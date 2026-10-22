const PERIOD = 30
const RING = 2 * Math.PI * 54

function totp() {
  return {
    PERIOD,
    RING,
    tab: 'code',
    code: '',
    left: 0,
    deadline: 0,
    error: '',
    copied: false,
    input: '',
    result: null,
    busy: false,
    init() {
      this.fetch()
      const tick = () => {
        this.left = Math.max(0, (this.deadline - Date.now()) / 1000)
        requestAnimationFrame(tick)
      }
      tick()
    },
    async fetch() {
      try {
        const r = await fetch('api/check')
        if (!r.ok) throw new Error()
        const data = await r.json()
        Object.assign(this, { code: data.code, error: '' })
        this.deadline = Date.now() + data.expire_sec * 1000
        setTimeout(() => this.fetch(), data.expire_sec * 1000 + 500)
      } catch {
        this.error = 'コードを取得できませんでした。5秒後に再試行します'
        setTimeout(() => this.fetch(), 5000)
      }
    },
    async verify() {
      this.busy = true
      try {
        const r = await fetch('api/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: this.input }) })
        this.result = r.ok ? 'ok' : r.status === 401 ? 'ng' : 'error'
      } catch {
        this.result = 'error'
      } finally {
        this.busy = false
      }
    },
  }
}
