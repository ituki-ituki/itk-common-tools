const S = 1080
const load = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = src })

async function shrink(file, max = 1600) {
  const b = await createImageBitmap(file), k = Math.min(1, max / Math.max(b.width, b.height))
  const c = document.createElement('canvas')
  c.width = Math.round(b.width * k)
  c.height = Math.round(b.height * k)
  c.getContext('2d').drawImage(b, 0, 0, c.width, c.height)
  return c
}

function paint(canvas, img, logo) {
  canvas.width = canvas.height = S
  const g = canvas.getContext('2d'), k = Math.max(S / img.width, S / img.height), w = S / k, h = S / k
  g.drawImage(img, (img.width - w) / 2, (img.height - h) / 2, w, h, 0, 0, S, S)
  g.shadowColor = 'rgb(0 0 0 / .45)'
  g.shadowBlur = 16
  g.drawImage(logo, 900, 40, 140, 140 * logo.height / logo.width)
}

function wine() {
  let shot, logo
  return {
    poses: [['glass', 'グラス付き', 'fa-wine-glass'], ['low', '縦アングル', 'fa-arrows-up-down'], ['close', '近接', 'fa-magnifying-glass-plus'], ['basket', '注ぐ', 'fa-wine-bottle']],
    models: [['gemini-3.1-flash-image', 'Flash（速い・安い）'], ['gemini-3-pro-image', 'Pro（ラベルがきれい・高め）']],
    pose: '', model: 'gemini-3.1-flash-image', menu: false, note: '', thumb: '', result: false, left: null, busy: false, error: '',
    async init() {
      try { this.model = localStorage.model || this.model } catch {}
      this.$watch('model', (v) => { try { localStorage.model = v } catch {} })
      logo = await load('logo_w.png')
      this.left = (await (await fetch('api/left')).json()).left
    },
    async pick(file) {
      if (!file) return
      shot = await shrink(file)
      this.thumb = shot.toDataURL('image/jpeg', .7)
      this.result = false
    },
    async make() {
      Object.assign(this, { busy: true, error: '' })
      const body = new FormData()
      body.append('photo', await new Promise((ok) => shot.toBlob(ok, 'image/jpeg', .85)), 'bottle.jpg')
      for (const k of ['note', 'pose', 'model']) body.append(k, this[k])
      const res = await fetch('api/compose', { method: 'POST', body })
      const data = await res.json().catch(() => ({ detail: '通信に失敗しました' }))
      this.busy = false
      if (!res.ok) return this.error = data.detail
      const img = await load(data.image)
      this.left = data.left
      this.result = true
      this.$nextTick(() => paint(this.$refs.out, img, logo))
    },
    async save() {
      const blob = await new Promise((ok) => this.$refs.out.toBlob(ok, 'image/jpeg', .92))
      const file = new File([blob], 'azureblue.jpg', { type: 'image/jpeg' })
      if (navigator.canShare?.({ files: [file] })) return navigator.share({ files: [file] }).catch(() => {})
      const a = document.createElement('a')
      a.href = URL.createObjectURL(file)
      a.download = file.name
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    },
  }
}
