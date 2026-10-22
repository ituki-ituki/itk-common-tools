const { soft = '#f1f5f9', accent = '#3b82f6', deep = '#1d4ed8' } = document.currentScript.dataset

tailwind.config = {
  theme: {
    extend: {
      colors: { ink: '#0f172a', mute: '#64748b', line: '#e2e8f0', soft, accent, deep },
    },
  },
}

document.head.insertAdjacentHTML('beforeend', '<style>[x-cloak]{display:none!important}</style>')

async function clip(state, text) {
  await navigator.clipboard.writeText(text)
  state.copied = true
  setTimeout(() => state.copied = false, 1500)
}
