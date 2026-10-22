const { soft = '#f1f5f9', accent = '#3b82f6', deep = '#1d4ed8' } = document.currentScript.dataset
const rgb = (hex) => hex.match(/\w\w/g).map((x) => parseInt(x, 16)).join(' ')
for (const [k, v] of Object.entries({ soft, accent, deep })) document.documentElement.style.setProperty(`--${k}`, rgb(v))

async function clip(state, text) {
  await navigator.clipboard.writeText(text)
  state.copied = true
  setTimeout(() => state.copied = false, 1500)
}
