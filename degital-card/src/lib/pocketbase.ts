import PocketBase, { ClientResponseError } from 'pocketbase'

const cards = new PocketBase(import.meta.env.VITE_PB_URL ?? 'http://127.0.0.1:8090').collection('cards')

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

export type CardInput = Omit<Card, 'id' | 'created' | 'updated'>

export class CardNotFoundError extends Error {}
export class CardIdTakenError extends Error {}

export const blankCard = (): CardInput => ({
  name: '',
  title: '',
  email: '',
  phone: '',
  companyUrl: '',
  line: '',
  facebook: '',
  twitter: '',
  instagram: '',
  imageUrlFront: '',
  imageUrlBack: '',
})

export const isValidCardId = (id: string) => /^[a-z0-9]([a-z0-9-]{0,38}[a-z0-9])?$/.test(id)

export const cardUrl = (id: string) => `${window.location.origin}${import.meta.env.BASE_URL}${id}`

async function guard<T>(task: Promise<T>, status: number, Fail: new () => Error): Promise<T> {
  try {
    return await task
  } catch (error) {
    throw error instanceof ClientResponseError && error.status === status ? new Fail() : error
  }
}

export const getCard = (id: string) => guard(cards.getOne<Card>(id), 404, CardNotFoundError)
export const createCard = (id: string, data: CardInput) => guard(cards.create<Card>({ id, ...data }), 400, CardIdTakenError)
export const updateCard = (id: string, data: CardInput) => guard(cards.update<Card>(id, data), 404, CardNotFoundError)
export const deleteCard = (id: string) => cards.delete(id)
