const PX_PER_HOUR = 56
const SNAP_MIN = 15
const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']
const DAY_MS = 24 * 60 * 60 * 1000
const ICS_KEY = 'schedule-listing:ics-url'

const pad2 = (n) => String(n).padStart(2, '0')
const hhmm = (min) => pad2(Math.floor(min / 60)) + ':' + pad2(min % 60)
const px = (min) => min / 60 * PX_PER_HOUR
const box = (a, b) => 'top:' + px(a) + 'px;height:' + Math.max(4, px(b - a)) + 'px'
const span = (x, y) => ({ a: Math.min(x, y), b: Math.max(x, y) + SNAP_MIN })

function startOfWeek(date) {
  const d = new Date(date)
  d.setDate(d.getDate() - (d.getDay() + 6) % 7)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function slotLabel(day, a, b) {
  const md = (day.getMonth() + 1) + '/' + day.getDate()
  const ymd = day.getFullYear() === new Date().getFullYear() ? md : day.getFullYear() + '/' + md
  return ymd + '（' + WEEKDAYS[day.getDay()] + '）' + hhmm(a) + '-' + hhmm(b)
}

function occurrences(event, from, to) {
  const hits = []
  const add = (start, end) => start < to && end > from && hits.push({ start, end })
  try {
    if (!event.isRecurring()) {
      add(event.startDate.toJSDate(), event.endDate.toJSDate())
      return hits
    }
    const it = event.iterator()
    let next, guard = 0
    while ((next = it.next()) && guard++ < 200000) {
      const occ = event.getOccurrenceDetails(next)
      const start = occ.startDate.toJSDate()
      if (start >= to) break
      add(start, occ.endDate.toJSDate())
    }
  } catch (e) { console.error('schedule-listing: skipped a malformed calendar event', event.uid, e) }
  return hits
}

function scheduler() {
  let icsEvents = []
  let touchPending = null

  return {
    PX_PER_HOUR,
    WEEKDAYS,
    ROW: 'height:' + PX_PER_HOUR + 'px',
    HALF: 'top:' + PX_PER_HOUR / 2 + 'px',
    hours: [...Array(24).keys()],
    weekStartTs: startOfWeek(new Date()),
    drag: null,
    hover: null,
    touchSelect: null,
    items: [],
    copied: false,
    icsUrl: '',
    icsEventCount: 0,
    icsLoading: false,
    icsError: '',
    icsSynced: false,
    weekOccurrences: [],
    settingsOpen: false,

    init() {
      this.icsUrl = localStorage.getItem(ICS_KEY) || ''
      if (this.icsUrl) this.syncIcs(false)
    },

    get days() {
      return Array.from({ length: 7 }, (_, i) => new Date(this.weekStartTs + i * DAY_MS))
    },
    get weekLabel() {
      const s = this.days[0], e = this.days[6]
      return s.getFullYear() + '年' + (s.getMonth() + 1) + '/' + s.getDate() + ' - ' + (e.getMonth() + 1) + '/' + e.getDate()
    },

    shift(days) {
      this.touchSelect = null
      this.weekStartTs = days ? this.weekStartTs + days * DAY_MS : startOfWeek(new Date())
      this.recomputeOccurrences()
    },

    syncCalScroll(source) {
      const { calHead, calBody } = this.$refs
      if (source === 'head') calBody.scrollLeft = calHead.scrollLeft
      else calHead.scrollLeft = calBody.scrollLeft
    },

    rule(h) { return h === 8 || h === 19 ? 'border-t border-slate-400' : 'border-t border-line' },
    isToday(day) { return day.toDateString() === new Date().toDateString() },

    snap(el, clientY) {
      const min = Math.floor((clientY - el.getBoundingClientRect().top) / PX_PER_HOUR * 60 / SNAP_MIN) * SNAP_MIN
      return Math.max(0, Math.min(24 * 60 - SNAP_MIN, min))
    },

    onHover(dayIndex, ev) { this.hover = { dayIndex, at: this.snap(ev.currentTarget, ev.clientY) } },
    hoverStyle() { return box(this.hover.at, this.hover.at + SNAP_MIN) },

    onPointerDown(dayIndex, ev) {
      if (ev.pointerType === 'touch') {
        touchPending = { dayIndex, el: ev.currentTarget, x: ev.clientX, y: ev.clientY }
        return
      }
      this.touchSelect = null
      const start = this.snap(ev.currentTarget, ev.clientY)
      this.drag = { dayIndex, el: ev.currentTarget, start, cur: start }
    },
    onDrag(ev) {
      if (touchPending) {
        if (Math.abs(ev.clientX - touchPending.x) > 10 || Math.abs(ev.clientY - touchPending.y) > 10) touchPending = null
        return
      }
      if (!this.drag) return
      ev.preventDefault()
      this.drag.cur = this.snap(this.drag.el, ev.clientY)
    },
    endDrag(ev) {
      if (touchPending) {
        const p = touchPending
        touchPending = null
        this.onTouchSelect(p.dayIndex, this.snap(p.el, typeof ev?.clientY === 'number' ? ev.clientY : p.y))
        return
      }
      if (!this.drag) return
      const { dayIndex, start, cur } = this.drag
      this.drag = null
      this.addItem(dayIndex, span(start, cur))
    },
    cancelDrag() {
      touchPending = null
      this.drag = null
    },
    onTouchSelect(dayIndex, at) {
      navigator.vibrate?.(10)
      if (this.touchSelect?.dayIndex !== dayIndex) {
        this.touchSelect = { dayIndex, start: at }
        return
      }
      const { start } = this.touchSelect
      this.touchSelect = null
      this.addItem(dayIndex, span(start, at))
    },
    cancelTouchSelect() { this.touchSelect = null },
    addItem(dayIndex, { a, b }) {
      const day = this.days[dayIndex]
      this.items.push({ id: Date.now() + '-' + Math.random(), dayTs: day.getTime(), a, b, label: slotLabel(day, a, b) })
    },

    selectionDayIndex() { return (this.drag || this.touchSelect)?.dayIndex ?? null },
    selectionRange() {
      if (this.drag) return span(this.drag.start, this.drag.cur)
      if (this.touchSelect) return span(this.touchSelect.start, this.touchSelect.start)
      return null
    },
    previewStyle() {
      const r = this.selectionRange()
      return r ? box(r.a, r.b) : ''
    },
    previewLabel() {
      const r = this.selectionRange()
      return r ? hhmm(r.a) + '-' + hhmm(r.b) : ''
    },

    removeItem(id) { this.items = this.items.filter(it => it.id !== id) },
    clearAll() { this.items = [] },
    copyAll() {
      if (this.items.length) clip(this, this.items.map(it => '・' + it.label).join('\n'))
    },

    setEvents(events, synced) {
      icsEvents = events
      this.icsEventCount = events.length
      this.icsSynced = synced
      this.recomputeOccurrences()
    },
    async syncIcs(persist) {
      if (!this.icsUrl) return
      this.icsLoading = true
      this.icsError = ''
      try {
        const res = await fetch('ical?url=' + encodeURIComponent(this.icsUrl))
        if (!res.ok) throw new Error(await res.text())
        const comp = new ICAL.Component(ICAL.parse(await res.text()))
        this.setEvents(comp.getAllSubcomponents('vevent').map(ve => new ICAL.Event(ve)), true)
        if (persist) localStorage.setItem(ICS_KEY, this.icsUrl)
      } catch (e) {
        console.error('schedule-listing: ical sync failed', e)
        this.icsError = 'カレンダーを取得できませんでした'
        this.setEvents([], false)
      } finally {
        this.icsLoading = false
      }
    },
    disconnectIcs() {
      this.icsUrl = ''
      this.icsError = ''
      localStorage.removeItem(ICS_KEY)
      this.setEvents([], false)
    },

    recomputeOccurrences() {
      const from = this.days[0]
      const to = new Date(from.getTime() + 7 * DAY_MS)
      this.weekOccurrences = icsEvents.flatMap(ev => occurrences(ev, from, to).map(o => ({ uid: ev.uid, summary: ev.summary, ...o })))
    },
    busyBlocks(dayIndex) {
      const day = this.days[dayIndex]
      const end = day.getTime() + DAY_MS
      return this.weekOccurrences
        .map(o => ({ o, a: Math.max(o.start - day, 0) / 60000, b: (Math.min(o.end, end) - day) / 60000 }))
        .filter(({ a, b }) => b > a)
        .map(({ o, a, b }) => ({ key: o.uid + '-' + o.start.getTime() + '-' + dayIndex, style: box(a, b), label: o.summary || '予定' }))
    },
    candidateBlocks(dayIndex) {
      const ts = this.days[dayIndex].getTime()
      return this.items.filter(it => it.dayTs === ts).map(it => ({ id: it.id, style: box(it.a, it.b), label: hhmm(it.a) + '-' + hhmm(it.b) }))
    },
  }
}
