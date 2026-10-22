const UPLOAD_URL = import.meta.env.VITE_UPLOAD_URL ?? '/common/file-shareing/upload'

export async function uploadCardImage(file: File): Promise<string> {
  if (!['image/png', 'image/jpeg'].includes(file.type)) throw new Error('png または jpeg のみアップロードできます')
  const body = new FormData()
  body.append('file', file)
  body.append('expiry_days', '0')
  body.append('use_password', '0')
  const response = await fetch(UPLOAD_URL, { method: 'POST', body })
  if (!response.ok) throw new Error('アップロードに失敗しました')
  return (await response.json()).url
}
