const ITEMS = [
  { key: 'morning', icon: 'fa-sun', label: '体重(朝)', weight: true, color: '#f59e0b' },
  { key: 'night', icon: 'fa-moon', label: '体重(夜)', weight: true, color: '#6366f1' },
  { key: 'protein', icon: 'fa-bottle-water', label: 'ドリンク', color: '#f97316' },
  { key: 'whitening', icon: 'fa-tooth', label: '歯', color: '#0ea5e9' },
  { key: 'exercise', icon: 'fa-person-running', label: '運動', color: '#22c55e' },
]
const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']
const iso = (d) => d.toLocaleDateString('sv-SE')
const daysAgo = (n) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

function health() {
  return {
    ITEMS,
    span: 21,
    dates: [],
    records: {},
    lastWhitening: null,
    sheet: null,
    value: '',
    init() {
      this.load()
    },
    async load() {
      const r = await fetch(`api/days?start=${iso(daysAgo(this.span - 1))}&end=${iso(new Date())}`)
      const data = await r.json()
      this.records = Object.fromEntries(data.days.map((d) => [d.date, d]))
      this.lastWhitening = data.lastWhitening
      this.dates = Array.from({ length: this.span }, (_, i) => daysAgo(i))
    },
    more() {
      this.span += 21
      this.load()
    },
    rec(d) {
      return this.records[iso(d)] || {}
    },
    day(d) {
      return { label: `${d.getMonth() + 1}/${d.getDate()}`, week: WEEKDAYS[d.getDay()], dow: d.getDay(), today: iso(d) === iso(new Date()) }
    },
    get since() {
      return this.lastWhitening === null ? null : Math.round((new Date(iso(new Date())) - new Date(this.lastWhitening)) / 864e5)
    },
    async save(date, patch) {
      const r = await fetch(`api/days/${date}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) })
      if (!r.ok) return alert('保存できませんでした')
      this.records[date] = await r.json()
      if ('whitening' in patch) this.load()
    },
    toggle(d, key) {
      this.save(iso(d), { [key]: !this.rec(d)[key] })
    },
    open(d, item) {
      const latest = Object.values(this.records).sort((a, b) => b.date.localeCompare(a.date)).flatMap((r) => [r.night, r.morning]).find((v) => v != null)
      const current = this.rec(d)[item.key] ?? latest
      this.sheet = { date: iso(d), item, title: `${this.day(d).label}（${this.day(d).week}）${item.label}` }
      this.value = current == null ? '' : current.toFixed(1)
    },
    step(delta) {
      const base = parseFloat(this.value) || 0
      this.value = (Math.round((base + delta) * 10) / 10).toFixed(1)
    },
    commit(value) {
      const { date, item } = this.sheet
      const v = value === null ? null : Math.round(parseFloat(this.value) * 10) / 10
      if (v !== null && !(v >= 20 && v <= 300)) return alert('20〜300 kg の範囲で入力してください')
      this.save(date, { [item.key]: v })
      this.sheet = null
    },
  }
}
