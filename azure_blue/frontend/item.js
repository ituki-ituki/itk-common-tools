const post = (url, body) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

function newItem() {
  return {
    step: 'scan',
    editing: null,
    startNew(line) {
      Object.assign(this, { editing: line, step: 'item', error: '' })
      window.scrollTo(0, 0)
      if (!line.draft) this.suggest(line)
    },
    async suggest(line) {
      line.draft = { name: line.name, kana: '', short: '', initial_kana: '', initial_en: '', retail: '', price: '', price1: '', loading: true }
      const r = await post('api/draft', { name: line.name })
      const { name, ...rest } = r.ok ? await r.json() : {}
      Object.assign(line.draft, rest, { loading: false })
    },
    async saveNew() {
      const line = this.editing
      const r = await post('api/wines', { ...line.draft, cost: line.price })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) return (this.error = typeof data.detail === 'string' ? data.detail : '上代・標準売値・売値1を入れてください')
      this.wines.push(data)
      Object.assign(line, { code: data.code, by: 'new' })
      Object.assign(this, { editing: null, step: 'scan', error: '' })
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
