import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api'

export const collectionKeys = {
  all: ['collections'] as const,
  detail: (id: string) => [...collectionKeys.all, id] as const,
}

export const pokemonKeys = {
  all: ['pokemon'] as const,
  page: (page: number, limit: number, search?: string) =>
    [...pokemonKeys.all, page, limit, search ?? ''] as const,
}

export const useCollections = () =>
  useQuery({
    queryKey: collectionKeys.all,
    queryFn: api.getCollections,
  })

export const useCollection = (id: string) =>
  useQuery({
    queryKey: collectionKeys.detail(id),
    queryFn: () => api.getCollectionById(id),
  })

export const usePokemonCatalog = (page: number, limit: number, search?: string) =>
  useQuery({
    queryKey: pokemonKeys.page(page, limit, search),
    queryFn: () => api.getPokemonCatalog({ page, limit, search }),
    placeholderData: (previousData) => previousData,
  })

export const useCreateCollection = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.createCollection,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: collectionKeys.all })
    },
  })
}
