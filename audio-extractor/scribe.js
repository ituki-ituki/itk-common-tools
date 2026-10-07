const PART_SEC = 20 * 60

function asc(config) {
  let i = 12
  const desc = () => {
    i++
    let len = 0
    let b
    do {
      b = config[i++]
      len = (len << 7) | (b & 127)
    } while (b & 128)
    return len
  }
  desc()
  const flags = config[i + 2]
  i += 3
  if (flags & 0x80) i += 2
  if (flags & 0x40) i += config[i] + 1
  if (flags & 0x20) i += 2
  desc()
  i += 13
  desc()
  return config.slice(i, i + 2)
}

async function pieces(file) {
  const { trak } = await track(file)
  const [a, b] = asc(await esds(file, trak.mdia.minf.stbl.stsd.entries[0]))
  const profile = (a >> 3) - 1
  const freq = ((a & 7) << 1) | (b >> 7)
  const chan = (b >> 3) & 15
  const adts = (len) => new Uint8Array([0xff, 0xf1, (profile << 6) | (freq << 2) | (chan >> 2), ((chan & 3) << 6) | (len >> 11), (len >> 3) & 255, ((len & 7) << 5) | 31, 0xfc])
  const { samples } = trak
  const audio = await gather(file, samples, samples.reduce((t, s) => t + s.size, 0))
  const limit = PART_SEC * trak.mdia.mdhd.timescale
  const parts = []
  let chunk = []
  let time = 0
  let at = 0
  for (const s of samples) {
    chunk.push(adts(s.size + 7), audio.subarray(at, at += s.size))
    if ((time += s.duration) >= limit) {
      parts.push(new Blob(chunk, { type: 'audio/aac' }))
      chunk = []
      time = 0
    }
  }
  if (chunk.length) parts.push(new Blob(chunk, { type: 'audio/aac' }))
  return parts
}

async function transcribe(file, prompt, progress) {
  const parts = await pieces(file).catch((e) => {
    if (file.type.startsWith('audio/')) return [file]
    throw e
  })
  let done = 0
  progress(done, parts.length)
  const texts = await Promise.all(parts.map(async (part, i) => {
    const body = new FormData()
    body.append('file', part, 'part' + i)
    body.append('prompt', prompt)
    const r = await fetch('transcribe', { method: 'POST', body })
    const data = await r.json().catch(() => ({ error: '通信に失敗しました（' + r.status + '）' }))
    if (!r.ok || data.error) throw new Error(data.error || data.detail)
    progress(++done, parts.length)
    return data.text
  }))
  return texts.join('\n\n')
}
