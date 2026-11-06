function newItem() {
  return {
    creating: null,
    item: {},
    async create() {
      const line = this.picking
      this.picking = null
      this.creating = line
      this.item = { name: '', kana: '', short: '', initial_kana: '', initial_en: '', retail: '', price: '', price1: '', cost: line.price, loading: true, error: '' }
      const r = await fetch('api/draft', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: line.name }) })
      if (r.ok) Object.assign(this.item, await r.json())
      this.item.loading = false
    },
    async saveItem() {
      const r = await fetch('api/wines', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(this.item) })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) return (this.item.error = typeof data.detail === 'string' ? data.detail : '未入力の項目があります')
      this.wines = [...this.wines, data]
      Object.assign(this.creating, { code: data.code, by: 'new' })
      this.creating = null
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
