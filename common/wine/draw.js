const S = 1080
const font = (px) => `${px}px kurenaido, sans-serif`

function cover(g, img, x, y, w, h) {
  const k = Math.max(w / img.width, h / img.height), sw = w / k, sh = h / k
  g.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h)
}

function text(g, list, x, y, size, max, gap = 1.6) {
  g.font = font(size)
  const k = Math.min(1, max / Math.max(...list.map((t) => g.measureText(t).width), 1))
  g.font = font(size * k)
  list.forEach((t, i) => g.fillText(t, x, y + i * size * k * gap))
  return y + list.length * size * k * gap
}

function mark(g, logo, x, y, w) {
  g.drawImage(logo, x, y, w, w * logo.height / logo.width)
}

const layouts = {
  card(g, w, img, [, white]) {
    cover(g, img, 0, 0, S, S)
    mark(g, white, 900, 40, 140)
    g.save()
    g.translate(560, 560)
    g.rotate(-0.04)
    g.shadowColor = 'rgb(0 0 0 / .35)'
    g.shadowBlur = 40
    g.fillStyle = w.paper
    g.fillRect(0, 0, 470, 440)
    g.shadowColor = 'transparent'
    g.fillStyle = 'rgb(0 0 0 / .25)'
    g.beginPath()
    g.arc(40, 40, 12, 0, 7)
    g.fill()
    g.fillStyle = w.ink
    g.textAlign = 'center'
    let y = text(g, [w.producer], 235, 90, 24, 380)
    y = text(g, [w.title], 235, y + 20, 40, 400)
    text(g, w.words, 235, y + 40, 34, 400)
    g.restore()
  },
  split(g, w, img, [blue]) {
    cover(g, img, 0, 0, S / 2, S)
    g.fillStyle = w.paper
    g.fillRect(S / 2, 0, S / 2, S)
    g.fillStyle = w.ink
    g.textAlign = 'center'
    const x = S * 3 / 4
    let y = text(g, [w.producer], x, 180, 26, 440)
    y = text(g, [w.title], x, y + 20, 46, 440)
    y = text(g, [[w.region, w.grapes].filter(Boolean).join('　')], x, y + 10, 24, 440)
    text(g, w.words, x, y + 70, 38, 440)
    mark(g, blue, x - 75, S - 170, 150)
  },
  bare(g, w, img) {
    cover(g, img, 0, 0, S, S)
  },
  line(g, w, img, [, white]) {
    cover(g, img, 0, 0, S, S)
    const shade = g.createLinearGradient(0, S * .55, 0, S)
    shade.addColorStop(0, 'rgb(0 0 0 / 0)')
    shade.addColorStop(1, 'rgb(0 0 0 / .65)')
    g.fillStyle = shade
    g.fillRect(0, 0, S, S)
    mark(g, white, 900, 40, 140)
    g.fillStyle = '#fff'
    g.textAlign = 'center'
    text(g, [w.line], S / 2, S - 110, 64, S - 160)
  },
}

function paint(canvas, layout, wine, img, logos) {
  canvas.width = canvas.height = S
  const g = canvas.getContext('2d')
  g.textBaseline = 'alphabetic'
  layouts[layout](g, wine, img, logos)
}
