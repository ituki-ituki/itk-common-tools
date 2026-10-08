const COLORS = ['#f97316', '#ec4899', '#8b5cf6', '#06b6d4', '#22c55e', '#eab308']
const mood = (p) => (p >= 80 ? 'なみなみ' : p >= 50 ? 'まだまだ' : p >= 20 ? 'あと少し' : p > 0 ? 'もうすぐ空' : 'からっぽ')

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
        this.items = data.items.map((it, i) => ({ ...it, n: i + 1, color: COLORS[i % COLORS.length], mood: mood(it.percent) }))
        this.state = 'done'
      } catch (e) {
        this.error = e.message || 'うまくいきませんでした'
        this.state = 'error'
      }
    },
    spot(it) {
      const [top, left, bottom, right] = it.box
      return `top:${top / 10}%;left:${left / 10}%;width:${(right - left) / 10}%;height:${(bottom - top) / 10}%;--c:${it.color}`
    },
  }
}
