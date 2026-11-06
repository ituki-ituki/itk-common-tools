const post = (url, body) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

function newItem() {
  return {
    step: 'scan',
    next() {
      this.step = 'master'
      window.scrollTo(0, 0)
      this.news.forEach((l) => l.draft || this.suggest(l))
    },
    async suggest(line) {
      line.draft = { name: line.name, kana: '', short: '', initial_kana: '', initial_en: '', retail: '', price: '', price1: '', cost: line.price, loading: true }
      const r = await post('api/draft', { name: line.name })
      const { name, ...rest } = r.ok ? await r.json() : {}
      Object.assign(line.draft, rest, { loading: false })
    },
    async register() {
      for (const line of this.news) {
        const r = await post('api/wines', { ...line.draft, cost: line.price })
        const data = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(`${line.draft.name}：${typeof data.detail === 'string' ? data.detail : '売価が未入力です'}`)
        this.wines.push(data)
        Object.assign(line, { code: data.code, by: 'new' })
      }
    },
    download(files) {
      files.forEach((f, i) => setTimeout(() => {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(new Blob([Uint8Array.from(atob(f.data), (c) => c.charCodeAt(0))], { type: 'text/csv' }))
        a.download = f.name
        a.click()
      }, i * 800))
    },
  }
}
