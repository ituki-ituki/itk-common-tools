const COLORS = ['#f97316', '#ec4899', '#8b5cf6', '#06b6d4', '#22c55e', '#eab308']
const EMPTY = 20
const DEMO = [
  { label: 'グラス', percent: 100, box: [223, 73, 831, 387] },
  { label: 'グラス', percent: 62, box: [268, 377, 836, 654] },
  { label: 'グラス', percent: 0, box: [268, 663, 839, 953] },
]

async function shrink(file) {
  const img = new Image()
  img.src = URL.createObjectURL(file)
  await img.decode()
  const k = Math.min(1, 1024 / Math.max(img.naturalWidth, img.naturalHeight))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.naturalWidth * k)
  canvas.height = Math.round(img.naturalHeight * k)
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
  URL.revokeObjectURL(img.src)
  return new Promise((done) => canvas.toBlob(done, 'image/jpeg', 0.85))
}

function monitor() {
  return {
    state: 'idle',
    photo: '',
    items: [],
    error: '',
    flash: false,
    async shoot(event) {
      const file = event.target.files[0]
      event.target.value = ''
      if (!file) return
      this.state = 'busy'
      this.items = []
      try {
        const blob = await shrink(file)
        URL.revokeObjectURL(this.photo)
        this.photo = URL.createObjectURL(blob)
        const body = new FormData()
        body.append('file', blob, 'beer.jpg')
        const r = await fetch('scan', { method: 'POST', body })
        const data = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(data.detail || '通信に失敗しました')
        this.show(data.items)
      } catch (e) {
        this.error = e.message || 'うまくいきませんでした'
        this.state = 'error'
      }
    },
    demo() {
      URL.revokeObjectURL(this.photo)
      this.photo = 'demo.jpg'
      this.items = []
      this.state = 'preview'
      this.flash = true
      setTimeout(() => (this.flash = false), 80)
    },
    measure() {
      this.state = 'busy'
      setTimeout(() => this.show(DEMO), 2400)
    },
    show(items) {
      this.items = items.map((it, i) => ({
        ...it,
        n: i,
        color: it.percent < EMPTY ? '#94a3b8' : COLORS[i % COLORS.length],
        text: it.percent < EMPTY ? 'からっぽ' : it.percent + '%',
      }))
      this.state = 'done'
    },
    spot(it) {
      const [top, left, bottom, right] = it.box
      return `top:${top / 10}%;left:${left / 10}%;width:${(right - left) / 10}%;height:${(bottom - top) / 10}%;--c:${it.color}`
    },
  }
}
