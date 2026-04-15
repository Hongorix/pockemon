export type PokemonCatalogItem = {
  id: number
  name: string
  species: string
  types: string[]
  weight: number
  imageUrl: string | null
}

export type PokemonListResponse = {
  count: number
  page: number
  limit: number
  items: PokemonCatalogItem[]
}

export type CollectionItem = {
  pokemonId: number
  name: string
  species: string
  weight: number
  imageUrl?: string | null
  types?: string[]
}

export type CollectionRecord = {
  _id: string
  name: string
  items: CollectionItem[]
  totalWeight: number
  createdAt: string
  updatedAt: string
}

export type ValidationViolation = {
  code: 'MIN_SPECIES' | 'MAX_WEIGHT'
  message: string
}
