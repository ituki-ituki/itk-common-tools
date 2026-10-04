function warikan() {
  return {
    members: [],
    payments: [],
    name: '',
    draft: { payer: '', amount: '', title: '', targets: [] },

    join() {
      const name = this.name.trim()
      if (!name || this.members.includes(name)) return
      this.members.push(name)
      this.draft.targets.push(name)
      if (!this.draft.payer) this.draft.payer = name
      this.name = ''
    },

    used(member) {
      return this.payments.some(p => p.payer === member || p.targets.includes(member))
    },

    leave(member) {
      if (this.used(member)) return
      this.members = this.members.filter(m => m !== member)
      this.draft.targets = this.draft.targets.filter(m => m !== member)
      if (this.draft.payer === member) this.draft.payer = this.members[0] || ''
    },

    pay() {
      const { payer, amount, title, targets } = this.draft
      if (!payer || !Number.isInteger(amount) || amount <= 0 || !targets.length) return
      this.payments.push({ id: Date.now(), payer, amount, title: title.trim(), targets: [...targets] })
      this.draft = { payer, amount: '', title: '', targets: [...this.members] }
    },

    drop(payment) {
      this.payments = this.payments.filter(p => p !== payment)
    },

    get transfers() {
      const balance = Object.fromEntries(this.members.map(m => [m, 0]))
      for (const p of this.payments) {
        const share = Math.floor(p.amount / p.targets.length)
        for (const t of p.targets.filter(t => t !== p.payer)) {
          balance[t] -= share
          balance[p.payer] += share
        }
      }
      const side = sign => Object.entries(balance)
        .filter(([, v]) => v * sign > 0)
        .map(([m, v]) => ({ m, v: Math.abs(v) }))
        .sort((a, b) => b.v - a.v)
      const debtors = side(-1)
      const creditors = side(1)
      const result = []
      let i = 0
      let j = 0
      while (i < debtors.length && j < creditors.length) {
        const v = Math.min(debtors[i].v, creditors[j].v)
        result.push({ from: debtors[i].m, to: creditors[j].m, v })
        debtors[i].v -= v
        creditors[j].v -= v
        if (!debtors[i].v) i++
        if (!creditors[j].v) j++
      }
      return result
    },

    yen(v) {
      return `¥${v.toLocaleString()}`
    },
  }
}
