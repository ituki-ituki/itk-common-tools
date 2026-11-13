const api = (path, method = 'GET', body) =>
  fetch(`api/${path}`, { method, headers: { 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) })

function board() {
  return {
    tasks: [],
    name: '',
    error: '',
    async init() {
      const r = await api('tasks')
      this.tasks = r.ok ? await r.json() : []
    },
    async add() {
      const r = await api('tasks', 'POST', { name: this.name })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) return (this.error = data.detail || '追加できませんでした')
      Object.assign(this, { tasks: [data, ...this.tasks], name: '', error: '' })
    },
    async finish(task) {
      this.tasks = this.tasks.filter((t) => t !== task)
      await api(`tasks/${task.id}`, 'PATCH', { done: true })
    },
    async note(task) {
      await api(`tasks/${task.id}`, 'PATCH', { memo: task.memo })
    },
    day: (d) => d.replaceAll('-', '/'),
  }
}
