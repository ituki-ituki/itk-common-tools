export type ContactKey = 'email' | 'phone' | 'companyUrl' | 'line' | 'facebook' | 'twitter' | 'instagram'

export interface ContactTypeConfig {
  key: ContactKey
  label: string
  placeholder: string
  color: string
  icon: string
  buildUrl: (value: string) => string
}

const web = (base: string) => (v: string) => (/^https?:\/\//.test(v) ? v : `${base}${v}`)

export const CONTACT_TYPES: ContactTypeConfig[] = [
  { key: 'email', label: 'メール', placeholder: 'you@example.com', color: '#6366f1', icon: 'fa-solid fa-envelope', buildUrl: (v) => `mailto:${v}` },
  { key: 'phone', label: '電話', placeholder: '09012345678', color: '#22c55e', icon: 'fa-solid fa-phone', buildUrl: (v) => `tel:${v}` },
  { key: 'companyUrl', label: '企業URL', placeholder: 'https://example.com', color: '#334155', icon: 'fa-solid fa-building', buildUrl: web('https://') },
  { key: 'line', label: 'LINE', placeholder: 'line.me/ti/p/xxxxx または ID', color: '#06c755', icon: 'fa-brands fa-line', buildUrl: web('https://line.me/ti/p/') },
  { key: 'facebook', label: 'Facebook', placeholder: 'facebook.com/xxxxx', color: '#1877f2', icon: 'fa-brands fa-facebook-f', buildUrl: web('https://facebook.com/') },
  { key: 'twitter', label: 'X (Twitter)', placeholder: 'x.com/xxxxx', color: '#111827', icon: 'fa-brands fa-x-twitter', buildUrl: web('https://x.com/') },
  { key: 'instagram', label: 'Instagram', placeholder: 'instagram.com/xxxxx', color: '#e1306c', icon: 'fa-brands fa-instagram', buildUrl: web('https://instagram.com/') },
]
