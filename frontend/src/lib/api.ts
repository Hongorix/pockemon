import type { CollectionItem, CollectionRecord, PokemonListResponse } from './types'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

const request = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    ...options,
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null)
    const error = new Error(errorBody?.message ?? 'Request failed')
    ;(error as Error & { details?: unknown }).details = errorBody
    throw error
  }

  return (await response.json()) as T
}

export const api = {
  getCollections: () => request<CollectionRecord[]>('/collections'),
  getCollectionById: (id: string) => request<CollectionRecord>(`/collections/${id}`),
  createCollection: (payload: { name: string; items: CollectionItem[] }) =>
    request<CollectionRecord>('/collections', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getPokemonCatalog: (params: { page: number; limit: number; search?: string }) => {
    const query = new URLSearchParams({
      page: String(params.page),
      limit: String(params.limit),
    })

    if (params.search) {
      query.set('search', params.search)
    }

    return request<PokemonListResponse>(`/pokemon?${query.toString()}`)
  },
}
