fetch('/gate/me').then((r) => r.ok && r.json()).then((user) => {
  if (!user) return
  const b = document.createElement('button')
  b.textContent = 'ログアウト'
  b.title = user.name
  b.style.cssText = 'position:fixed;top:8px;right:8px;z-index:2147483647;padding:3px 9px;border:0;border-radius:999px;background:rgb(0 0 0 / .45);color:#fff;font:11px system-ui,sans-serif;cursor:pointer;opacity:.75'
  b.onclick = () => fetch('/gate/logout', { method: 'POST' }).then(() => location.replace('/'))
  document.body.append(b)
}).catch(() => {})
