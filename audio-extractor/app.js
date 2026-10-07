const be = (n, len = 4) => Array.from({ length: len }, (_, i) => Math.floor(n / 2 ** (8 * (len - 1 - i))) & 255)
const str = (s) => [...s].map((c) => c.charCodeAt(0))
const box = (type, ...parts) => {
  const body = parts.flat()
  return [...be(body.length + 8), ...str(type), ...body]
}
const full = (type, flags, ...parts) => box(type, be(flags), ...parts)
const zeros = (n) => Array(n).fill(0)
const MATRIX = [0x10000, 0, 0, 0, 0x10000, 0, 0, 0, 0x40000000].flatMap((n) => be(n))

async function track(file) {
  const mp4 = MP4Box.createFile()
  let info = null
  mp4.onReady = (i) => (info = i)
  for (let pos = 0; !info && pos < file.size; ) {
    const buf = await file.slice(pos, pos + 2 ** 20).arrayBuffer()
    buf.fileStart = pos
    const next = mp4.appendBuffer(buf)
    pos = next > pos ? next : pos + buf.byteLength
  }
  if (!info) throw new Error('動画として読み込めませんでした')
  if (!info.audioTracks.length) throw new Error('音声が入っていない動画です')
  return { trak: mp4.getTrackById(info.audioTracks[0].id), movie: mp4.moov.mvhd.timescale }
}

async function gather(file, samples, bytes) {
  const out = new Uint8Array(bytes)
  let at = 0
  for (let i = 0; i < samples.length; ) {
    const from = samples[i].offset
    const buf = new Uint8Array(await file.slice(from, from + Math.max(2 ** 24, samples[i].size)).arrayBuffer())
    for (let s = samples[i]; s && s.offset >= from && s.offset + s.size <= from + buf.length; s = samples[++i]) {
      out.set(buf.subarray(s.offset - from, s.offset - from + s.size), at)
      at += s.size
    }
  }
  return out
}

async function esds(file, entry) {
  const raw = new Uint8Array(await file.slice(entry.start, entry.start + entry.size).arrayBuffer())
  for (let i = 4; entry.type === 'mp4a' && i + 4 <= raw.length; i++) {
    if (String.fromCharCode(...raw.subarray(i, i + 4)) === 'esds') {
      return Array.from(raw.subarray(i - 4, i - 4 + new DataView(raw.buffer).getUint32(i - 4)))
    }
  }
  throw new Error('この動画の音声形式には対応していません')
}

async function extract(file) {
  const { trak, movie } = await track(file)
  const edits = trak.edts?.elst?.entries ?? []
  const entry = trak.mdia.minf.stbl.stsd.entries[0]
  const config = await esds(file, entry)
  const { samples } = trak
  const scale = trak.mdia.mdhd.timescale
  const length = samples.reduce((t, s) => t + s.duration, 0)
  const bytes = samples.reduce((t, s) => t + s.size, 0)
  const runs = []
  for (const s of samples) {
    const last = runs.at(-1)
    if (last?.[1] === s.duration) last[0]++
    else runs.push([1, s.duration])
  }

  const ftyp = box('ftyp', str('M4A '), be(0), str('M4A mp42isom'))
  const moov = (offset) => box('moov',
    full('mvhd', 0, be(0), be(0), be(scale), be(length), be(0x10000), be(0x100, 2), zeros(10), MATRIX, zeros(24), be(2)),
    box('trak',
      full('tkhd', 7, be(0), be(0), be(1), be(0), be(length), zeros(8), be(0, 2), be(0, 2), be(0x100, 2), be(0, 2), MATRIX, be(0), be(0)),
      edits.length ? box('edts', full('elst', 0, be(edits.length),
        edits.flatMap((e) => [...be(Math.round(e.segment_duration * scale / movie)), ...be(e.media_time), ...be(1, 2), ...be(0, 2)]))) : [],
      box('mdia',
        full('mdhd', 0, be(0), be(0), be(scale), be(length), be(0x55c4, 2), be(0, 2)),
        full('hdlr', 0, be(0), str('soun'), zeros(12), str('SoundHandler'), [0]),
        box('minf',
          full('smhd', 0, be(0)),
          box('dinf', full('dref', 0, be(1), full('url ', 1))),
          box('stbl',
            full('stsd', 0, be(1), box('mp4a', zeros(6), be(1, 2), zeros(8), be(entry.channel_count, 2), be(16, 2), be(0), be(entry.samplerate * 65536), config)),
            full('stts', 0, be(runs.length), runs.flatMap(([n, d]) => [...be(n), ...be(d)])),
            full('stsc', 0, be(1), be(1), be(samples.length), be(1)),
            full('stsz', 0, be(0), be(samples.length), samples.flatMap((s) => be(s.size))),
            full('stco', 0, be(1), be(offset)))))))

  const head = ftyp.length + moov(0).length + 8
  const header = new Uint8Array([...ftyp, ...moov(head), ...be(bytes + 8), ...str('mdat')])
  return new Blob([header, await gather(file, samples, bytes)], { type: 'audio/mp4' })
}
