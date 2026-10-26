const load = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = src })

async function shrink(file, max = 1600) {
  const b = await createImageBitmap(file), k = Math.min(1, max / Math.max(b.width, b.height))
  const c = document.createElement('canvas')
  c.width = Math.round(b.width * k)
  c.height = Math.round(b.height * k)
  c.getContext('2d').drawImage(b, 0, 0, c.width, c.height)
  return c
}

function wine() {
  let img, logos
  return {
    layouts: [['card', 'カード'], ['split', '左右'], ['line', '一行']],
    layout: 'card', note: '', taste: '', title: '', thumb: '', result: null, left: null, busy: false, error: '', copied: false,
    async init() {
      logos = await Promise.all(['logo.png', 'logo_w.png'].map(load))
      document.fonts.load(font(40))
      this.left = (await (await fetch('api/left')).json()).left
      this.$watch('layout', () => this.paint())
      this.$watch('title', () => this.paint())
    },
    async pick(file) {
      if (!file) return
      img = await shrink(file)
      this.thumb = img.toDataURL('image/jpeg', .7)
      this.result = null
    },
    async make() {
      Object.assign(this, { busy: true, error: '' })
      const body = new FormData()
      body.append('photo', await new Promise((ok) => img.toBlob(ok, 'image/jpeg', .85)), 'bottle.jpg')
      body.append('note', this.note)
      body.append('taste', this.taste)
      const res = await fetch('api/compose', { method: 'POST', body })
      const data = await res.json().catch(() => ({ detail: '通信に失敗しました' }))
      this.busy = false
      if (!res.ok) return this.error = data.detail
      this.left = data.left
      this.result = data
      this.title = [data.name, data.vintage].filter(Boolean).join(' ')
      this.$nextTick(() => this.paint())
    },
    async paint() {
      if (!this.result) return
      await document.fonts.load(font(40))
      paint(this.$refs.out, this.layout, { ...this.result, title: this.title }, img, logos)
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
