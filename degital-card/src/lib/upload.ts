const UPLOAD_URL = import.meta.env.VITE_UPLOAD_URL ?? '/common/file-shareing/upload'
const ALLOWED_TYPES = ['image/png', 'image/jpeg']

export class InvalidImageTypeError extends Error {}
export class ImageUploadError extends Error {}

export function isAllowedImageType(file: File): boolean {
  return ALLOWED_TYPES.includes(file.type)
}

export async function uploadCardImage(file: File): Promise<string> {
  if (!isAllowedImageType(file)) {
    throw new InvalidImageTypeError('png または jpeg のみアップロードできます')
  }

  const body = new FormData()
  body.append('file', file)
  body.append('expiry_days', '0')
  body.append('use_password', '0')

  const response = await fetch(UPLOAD_URL, { method: 'POST', body })
  if (!response.ok) {
    throw new ImageUploadError('アップロードに失敗しました')
  }

  const data: { url: string } = await response.json()
  return data.url
}
