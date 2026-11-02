const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi)
const bytes = (n) => n < 1048576 ? `${Math.round(n / 1024)} KB` : `${(n / 1048576).toFixed(2)} MB`

function photo() {
  let bitmap, blob, timer
  return {
    ratios: [['自由', 0], ['1:1', 1], ['4:3', 4 / 3], ['3:4', 3 / 4], ['16:9', 16 / 9], ['9:16', 9 / 16]],
    name: '', origin: 0, size: 0, ratio: 0, quality: 80, turn: 0, W: 0, H: 0, box: null, drag: null,
    bytes,
    async load(file) {
      if (!file) return
      bitmap = await createImageBitmap(file)
      Object.assign(this, { name: file.name.replace(/\.\w+$/, ''), origin: file.size, turn: 0 })
      this.render()
    },
    rotate() {
      this.turn = (this.turn + 1) % 4
      this.render()
    },
    render() {
      const v = this.$refs.view, odd = this.turn % 2
      v.width = odd ? bitmap.height : bitmap.width
      v.height = odd ? bitmap.width : bitmap.height
      const g = v.getContext('2d')
      g.translate(v.width / 2, v.height / 2)
      g.rotate(this.turn * Math.PI / 2)
      g.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2)
      Object.assign(this, { W: v.width, H: v.height })
      this.fit()
    },
    fit() {
      const { W, H, ratio: r } = this
      let w = W, h = H
      if (r) w / h > r ? w = h * r : h = w / r
      this.box = { x: (W - w) / 2, y: (H - h) / 2, w, h }
      this.pack()
    },
    pack() {
      clearTimeout(timer)
      timer = setTimeout(() => {
        const { x, y, w, h } = this.box, c = document.createElement('canvas'), g = c.getContext('2d')
        c.width = Math.round(w)
        c.height = Math.round(h)
        g.fillStyle = '#fff'
        g.fillRect(0, 0, c.width, c.height)
        g.drawImage(this.$refs.view, x, y, w, h, 0, 0, c.width, c.height)
        c.toBlob((b) => { blob = b; this.size = b.size }, 'image/jpeg', this.quality / 100)
      }, 200)
    },
    scale() {
      return this.W / this.$refs.view.getBoundingClientRect().width
    },
    grab(e, sx = 0, sy = 0) {
      e.target.setPointerCapture(e.pointerId)
      const { x, y, w, h } = this.box
      this.drag = sx ? { sx, sy, ax: sx > 0 ? x : x + w, ay: sy > 0 ? y : y + h } : { px: e.clientX, py: e.clientY, x, y }
    },
    move(e) {
      const d = this.drag, b = this.box, k = this.scale()
      if (!d) return
      if (!d.sx) {
        b.x = clamp(d.x + (e.clientX - d.px) * k, 0, this.W - b.w)
        b.y = clamp(d.y + (e.clientY - d.py) * k, 0, this.H - b.h)
        return
      }
      const r = this.$refs.view.getBoundingClientRect(), r0 = this.ratio
      const mw = d.sx > 0 ? this.W - d.ax : d.ax, mh = d.sy > 0 ? this.H - d.ay : d.ay
      let w = clamp(((e.clientX - r.left) * k - d.ax) * d.sx, 20, mw)
      let h = clamp(((e.clientY - r.top) * k - d.ay) * d.sy, 20, mh)
      if (r0) h = (w = Math.min(Math.max(w, h * r0), mw, mh * r0)) / r0
      Object.assign(b, { w, h, x: d.sx > 0 ? d.ax : d.ax - w, y: d.sy > 0 ? d.ay : d.ay - h })
    },
    drop() {
      if (!this.drag) return
      this.drag = null
      this.pack()
    },
    frame() {
      const { x, y, w, h } = this.box, { W, H } = this
      return `left:${x / W * 100}%;top:${y / H * 100}%;width:${w / W * 100}%;height:${h / H * 100}%`
    },
    save() {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${this.name}.jpg`
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    },
  }
}
