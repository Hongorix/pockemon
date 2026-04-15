import { z } from 'zod'
import type { CollectionItem } from './types'

const collectionItemSchema = z.object({
  pokemonId: z.number().int().positive(),
  name: z.string().min(1),
  species: z.string().min(1),
  weight: z.number().int().positive(),
  imageUrl: z.string().nullable().optional(),
})

const collectionExportSchema = z.object({
  version: z.literal(1),
  name: z.string().min(1),
  items: z.array(collectionItemSchema),
})

export type CollectionExport = {
  version: 1
  name: string
  items: CollectionItem[]
}

export const parseCollectionFile = (value: unknown): CollectionExport => {
  return collectionExportSchema.parse(value)
}
