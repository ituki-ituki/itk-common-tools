const MODES = [
  { key: 'audio', icon: 'fa-music', label: '音声', note: '音声だけを M4A で保存します。端末内で一瞬で終わります。' },
  { key: 'text', icon: 'fa-file-lines', label: '文字起こし', note: '音声を AI で文字起こしして、テキストで保存します。' },
  { key: 'caption', icon: 'fa-closed-captioning', label: '字幕動画', note: 'AI が作った字幕を焼き込み、指定の速度で MP4 を書き出します（20分程度まで）。' },
]
const PROMPT = 'この音声を日本語で正確に文字起こししてください。「えー」「あの」などのフィラーは省き、句読点と改行を適切に入れてください。文字起こし本文のみを出力してください。'
const CHUNK = 90 * 2 ** 20
const wait = (ms) => new Promise((done) => setTimeout(done, ms))

async function call(path, options) {
  const r = await fetch('api/' + path, options)
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(data.detail || '通信に失敗しました（' + r.status + '）')
  return data
}

async function burn(file, speed, step) {
  const job = crypto.randomUUID().replaceAll('-', '')
  const count = Math.ceil(file.size / CHUNK)
  for (let i = 0; i < count; i++) {
    step('アップロード中…', Math.round((i / count) * 100))
    await call(`upload/${job}/${i}`, { method: 'PUT', body: file.slice(i * CHUNK, (i + 1) * CHUNK) })
  }
  const body = new FormData()
  body.append('speed', speed)
  body.append('name', file.name)
  await call(`start/${job}`, { method: 'POST', body })
  for (;;) {
    await wait(2000)
    const s = await call(`status/${job}`)
    if (s.state === 'エラー') throw new Error(s.error)
    if (s.state === '完成') return `api/result/${job}`
    step(s.state + '…', s.progress)
  }
}

function studio() {
  const saved = (key, fallback) => {
    try {
      return localStorage.getItem('video:' + key) ?? fallback
    } catch {
      return fallback
    }
  }
  return {
    MODES,
    mode: saved('mode', 'audio'),
    prompt: saved('prompt', PROMPT),
    speed: 1,
    jobs: [],
    init() {
      for (const key of ['mode', 'prompt']) {
        this.$watch(key, (v) => {
          try {
            localStorage.setItem('video:' + key, v)
          } catch {}
        })
      }
    },
    get current() {
      return MODES.find((m) => m.key === this.mode)
    },
    reach(key) {
      return MODES.findIndex((m) => m.key === key) <= MODES.findIndex((m) => m.key === this.mode)
    },
    async pick(list) {
      const { mode, prompt, speed } = this
      for (const file of list) {
        this.jobs.unshift({ base: file.name.replace(/\.[^.]+$/, ''), mode, state: 'busy', note: '準備中…', progress: null, out: null })
        const job = this.jobs[0]
        const step = (note, progress = null) => Object.assign(job, { note, progress })
        try {
          if (mode === 'audio') {
            const blob = await extract(file)
            job.out = { ext: 'm4a', url: URL.createObjectURL(blob) }
            job.note = (blob.size / 1e6).toFixed(1) + ' MB'
          } else if (mode === 'text') {
            const text = await transcribe(file, prompt, (n, m) => step(`文字起こし中… ${n} / ${m}`, m > 1 ? Math.round((n / m) * 100) : null))
            job.out = { ext: 'txt', url: URL.createObjectURL(new Blob([text], { type: 'text/plain' })) }
            job.note = text.length.toLocaleString() + ' 文字'
          } else {
            job.out = { ext: 'mp4', url: await burn(file, speed, step) }
            job.note = speed.toFixed(2) + ' 倍・字幕つき'
          }
          job.progress = null
          job.state = 'done'
          this.save(job)
        } catch (e) {
          Object.assign(job, { state: 'error', note: e.message || '失敗しました', progress: null })
        }
      }
    },
    save(job) {
      const a = document.createElement('a')
      a.href = job.out.url
      a.download = job.base + (job.out.ext === 'mp4' ? '_字幕' : '') + '.' + job.out.ext
      a.click()
    },
  }
}
