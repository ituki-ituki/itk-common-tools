const CHUNK = 90 * 2 ** 20

async function call(path, options) {
  const r = await fetch('api/' + path, options)
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(data.detail || '通信に失敗しました（' + r.status + '）')
  return data
}

function subtitler() {
  return {
    speed: 1,
    phase: '',
    name: '',
    note: '',
    progress: 0,
    url: '',
    get busy() {
      return this.phase === 'busy'
    },
    async go(file) {
      if (!file || this.busy) return
      const job = crypto.randomUUID().replaceAll('-', '')
      Object.assign(this, { phase: 'busy', name: file.name, note: 'アップロード中…', progress: 0, url: '' })
      try {
        const count = Math.ceil(file.size / CHUNK)
        for (let i = 0; i < count; i++) {
          await call(`upload/${job}/${i}`, { method: 'PUT', body: file.slice(i * CHUNK, (i + 1) * CHUNK) })
          this.progress = Math.round(((i + 1) / count) * 100)
        }
        const body = new FormData()
        body.append('speed', this.speed)
        body.append('name', file.name)
        await call(`start/${job}`, { method: 'POST', body })
        for (;;) {
          await new Promise((done) => setTimeout(done, 2000))
          const s = await call(`status/${job}`)
          if (s.state === 'エラー') throw new Error(s.error)
          this.progress = s.progress
          this.note = s.state === '完成' ? '完成しました' : s.state + '…（このタブは開いたままにしてください）'
          if (s.state === '完成') break
        }
        this.url = `api/result/${job}`
        this.phase = 'done'
        location.href = this.url
      } catch (e) {
        this.note = e.message
        this.phase = 'error'
      }
    },
  }
}
