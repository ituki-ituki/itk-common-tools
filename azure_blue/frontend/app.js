const SKIP = '__skip__'
const fold = (s) => s.normalize('NFKC').toLowerCase().replace(/[\s・\-ー,.]/g, '')
const yen = (v) => Number(v || 0).toLocaleString()

async function shrink(file) {
  const img = new Image()
  img.src = URL.createObjectURL(file)
  await img.decode()
  const k = Math.min(1, 2000 / Math.max(img.naturalWidth, img.naturalHeight))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.naturalWidth * k)
  canvas.height = Math.round(img.naturalHeight * k)
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
  URL.revokeObjectURL(img.src)
  return new Promise((done) => canvas.toBlob(done, 'image/jpeg', 0.9))
}

function scanner() {
  return {
    ...newItem(),
    slips: [],
    wines: [],
    suppliers: [],
    busy: 0,
    picking: null,
    adding: null,
    draft: {},
    query: '',
    error: '',
    async init() {
      const r = await fetch('api/masters')
      Object.assign(this, await r.json())
      if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js')
    },
    shoot(event) {
      for (const file of event.target.files) this.add(file)
      event.target.value = ''
    },
    async add(file) {
      const slip = { id: Date.now() + Math.random(), photo: '', state: 'busy', lines: [] }
      this.slips.push(slip)
      const s = this.slips.at(-1)
      this.busy++
      try {
        const blob = await shrink(file)
        s.photo = URL.createObjectURL(blob)
        const body = new FormData()
        body.append('file', blob, 'slip.jpg')
        const r = await fetch('api/scan', { method: 'POST', body })
        const data = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(data.detail || '通信に失敗しました')
        Object.assign(s, data, { state: 'done' })
      } catch (e) {
        Object.assign(s, { state: 'error', message: e.message })
      }
      this.busy--
    },
    drop(slip) {
      this.slips = this.slips.filter((s) => s !== slip)
    },
    wine(code) {
      return code === SKIP ? 'スキップして、手動で入力する' : this.wines.find((w) => w.code === code)?.name || ''
    },
    open(line) {
      Object.assign(this, { picking: line, query: '' })
      this.$nextTick(() => this.$refs.query.focus())
    },
    hits() {
      const q = fold(this.query)
      return this.wines.filter((w) => fold(w.name).includes(q)).slice(0, 30)
    },
    choose(code) {
      Object.assign(this.picking, { code, by: 'manual' })
      this.picking = null
    },
    warns(slip) {
      const wines = slip.lines.filter((l) => !l.fee)
      const qty = wines.reduce((a, l) => a + Number(l.qty), 0)
      const amount = slip.lines.reduce((a, l) => a + Number(l.amount), 0)
      const out = []
      if (qty % 12) out.push(`${qty}本 — 12の倍数でない`)
      if (slip.printed_qty != null && slip.printed_qty !== qty) out.push(`数量計 ${slip.printed_qty} と不一致`)
      if (slip.printed_amount != null && slip.printed_amount !== amount) out.push(`税抜合計 ${yen(slip.printed_amount)} と不一致（${yen(amount)}）`)
      wines.filter((l) => Math.round(l.qty * l.price) !== Number(l.amount)).forEach((l) => out.push(`単価×数量≠金額：${l.name}`))
      if (!slip.supplier_code) out.push('仕入先未選択')
      return out
    },
    addSupplier(slip) {
      slip.supplier_code = ''
      Object.assign(this, { adding: slip, draft: { code: '', name: slip.supplier || '', error: '' } })
    },
    async saveSupplier() {
      const r = await post('api/suppliers', this.draft)
      const data = await r.json().catch(() => ({}))
      if (!r.ok) return (this.draft.error = data.detail || '保存に失敗しました')
      this.suppliers = [...this.suppliers, data].sort((a, b) => a.name.localeCompare(b.name))
      this.$nextTick(() => (this.adding.supplier_code = data.code, this.adding = null))
    },
    get tokens() {
      return this.slips.reduce((a, s) => a + (s.usage ? s.usage.input + s.usage.output : 0), 0)
    },
    get news() {
      return this.slips.filter((s) => s.state === 'done').flatMap((s) => s.lines.filter((l) => !l.fee && !l.code))
    },
    get ready() {
      const done = this.slips.filter((s) => s.state === 'done')
      return done.length && !this.busy && done.every((s) => s.supplier_code)
    },
    async go() {
      if (this.step === 'scan' && this.news.length) return this.next()
      this.error = ''
      try {
        await this.register()
        await this.save()
      } catch (e) {
        this.error = e.message
      }
    },
    async save() {
      const bills = this.slips.filter((s) => s.state === 'done').map((s) => ({
        supplier_code: s.supplier_code,
        invoice: s.invoice,
        date: s.date,
        lines: s.lines.filter((l) => l.code !== SKIP).map((l) => ({ ...l, code: l.fee ? null : l.code, wine: this.wine(l.code) })),
      }))
      const r = await post('api/export', bills)
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).detail || '出力に失敗しました')
      this.download(await r.json())
      this.step = 'scan'
    },
  }
}
