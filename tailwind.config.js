const rgb = (v) => `rgb(var(--${v}) / <alpha-value>)`
module.exports = {
  content: ['*.html', '*/**/*.{html,js,py}', '!**/node_modules/**', '!**/.venv/**', '!degital-card/**', '!vendor/**'],
  theme: {
    extend: {
      colors: { ink: '#0f172a', mute: '#64748b', line: '#e2e8f0', soft: rgb('soft'), accent: rgb('accent'), deep: rgb('deep') },
    },
  },
}
