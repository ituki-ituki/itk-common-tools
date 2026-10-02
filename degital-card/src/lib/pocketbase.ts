import PocketBase, { ClientResponseError } from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_PB_URL ?? 'http://127.0.0.1:8090')

export interface Card {
  id: string
  name: string
  title: string
  email: string
  phone: string
  companyUrl: string
  line: string
  facebook: string
  twitter: string
  instagram: string
  imageUrlFront: string
  imageUrlBack: string
  created: string
  updated: string
}

export type CardInput = Pick<
  Card,
  | 'name'
  | 'title'
  | 'email'
  | 'phone'
  | 'companyUrl'
  | 'line'
  | 'facebook'
  | 'twitter'
  | 'instagram'
  | 'imageUrlFront'
  | 'imageUrlBack'
>

export class CardNotFoundError extends Error {}
export class CardIdTakenError extends Error {}

export const ID_PATTERN = /^[a-z0-9]([a-z0-9-]{0,38}[a-z0-9])?$/

export function isValidCardId(id: string): boolean {
  return ID_PATTERN.test(id)
}

export function cardUrl(id: string): string {
  return `${window.location.origin}${import.meta.env.BASE_URL}${id}`
}

export async function getCard(id: string): Promise<Card> {
  try {
    return await pb.collection('cards').getOne<Card>(id)
  } catch (error) {
    if (error instanceof ClientResponseError && error.status === 404) {
      throw new CardNotFoundError(id)
    }
    throw error
  }
}

export async function createCard(id: string, data: CardInput): Promise<Card> {
  try {
    return await pb.collection('cards').create<Card>({ id, ...data })
  } catch (error) {
    if (error instanceof ClientResponseError && error.status === 400) {
      throw new CardIdTakenError(id)
    }
    throw error
  }
}

export async function updateCard(id: string, data: CardInput): Promise<Card> {
  try {
    return await pb.collection('cards').update<Card>(id, data)
  } catch (error) {
    if (error instanceof ClientResponseError && error.status === 404) {
      throw new CardNotFoundError(id)
    }
    throw error
  }
}

export async function deleteCard(id: string): Promise<void> {
  await pb.collection('cards').delete(id)
}
