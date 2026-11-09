async function pages(file) {
  if (!window.pdfjsLib) {
    await new Promise((ok, ng) => document.head.append(Object.assign(document.createElement('script'), { src: '/vendor/pdf.min.js', onload: ok, onerror: ng })))
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/vendor/pdf.worker.min.js'
  }
  const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise
  const out = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const base = page.getViewport({ scale: 1 })
    const viewport = page.getViewport({ scale: 2000 / Math.max(base.width, base.height) })
    const canvas = Object.assign(document.createElement('canvas'), { width: viewport.width, height: viewport.height })
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    await page.render({ canvasContext: ctx, viewport }).promise
    out.push(await new Promise((done) => canvas.toBlob(done, 'image/jpeg', 0.9)))
  }
  return out
}
