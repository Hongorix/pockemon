import { useNavigate, useParams } from '@tanstack/react-router'
import { useQueries } from '@tanstack/react-query'
import { useMemo } from 'react'
import { api } from '../lib/api'
import { useCollection, useDeleteCollection } from '../lib/hooks'
import type { CollectionItem } from '../lib/types'

const normalizeCompare = (a: string, b: string) =>
  a.trim().toLowerCase().replace(/-/g, ' ') === b.trim().toLowerCase().replace(/-/g, ' ')

const speciesDuplicatesName = (item: CollectionItem) => normalizeCompare(item.species, item.name)

export const ListDetailPage = () => {
  const navigate = useNavigate()
  const { listId } = useParams({ strict: false })
  const { data: collection, isLoading, isError } = useCollection(listId ?? '')
  const deleteCollection = useDeleteCollection()

  const collectionItems = collection?.items
  const namesNeedingTypes = useMemo(() => {
    if (!collectionItems?.length) return []
    const names = new Set<string>()
    for (const item of collectionItems) {
      if (!item.types?.length) names.add(item.name)
    }
    return [...names]
  }, [collectionItems])

  const idsNeedingImage = useMemo(() => {
    if (!collectionItems?.length) return []
    const ids = new Set<number>()
    for (const item of collectionItems) {
      if (!item.imageUrl) ids.add(item.pokemonId)
    }
    return [...ids]
  }, [collectionItems])

  const typeLookups = useQueries({
    queries: namesNeedingTypes.map((name) => ({
      queryKey: ['pokemon', 'type-lookup', name] as const,
      queryFn: () => api.getPokemonCatalog({ page: 1, limit: 1, search: name }),
      enabled: Boolean(collection) && namesNeedingTypes.length > 0,
      staleTime: 60 * 60 * 1000,
    })),
  })

  const imageLookups = useQueries({
    queries: idsNeedingImage.map((id) => ({
      queryKey: ['pokemon', 'by-id', id] as const,
      queryFn: () => api.getPokemonById(id),
      enabled: Boolean(collection) && idsNeedingImage.length > 0,
      staleTime: 60 * 60 * 1000,
    })),
  })

  const resolvedTypesByName = useMemo(() => {
    const map = new Map<string, string[]>()
    namesNeedingTypes.forEach((name, index) => {
      const first = typeLookups[index]?.data?.items?.[0]
      if (first?.types?.length) map.set(name, first.types)
    })
    return map
  }, [namesNeedingTypes, typeLookups])

  const resolvedImageUrlById = useMemo(() => {
    const map = new Map<number, string | null>()
    idsNeedingImage.forEach((id, index) => {
      const url = imageLookups[index]?.data?.imageUrl ?? null
      if (url) map.set(id, url)
    })
    return map
  }, [idsNeedingImage, imageLookups])

  const handleDownload = () => {
    if (!collection) return

    const payload = {
      version: 1 as const,
      name: collection.name,
      items: collection.items,
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${collection.name.toLowerCase().replace(/\s+/g, '-')}.pokemon-list.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return <section className="comic-panel">Loading collection...</section>
  }

  if (isError || !collection) {
    return <section className="comic-warning">Collection not found.</section>
  }

  return (
    <main className="space-y-6">
      <section className="comic-panel space-y-2">
        <h2 className="comic-subtitle">{collection.name}</h2>
        <p>Total Pokemon: {collection.items.length}</p>
        <p>Total weight: {collection.totalWeight} hg</p>
        <div className="flex flex-wrap gap-3">
          <button type="button" className="comic-button bg-amber-300" onClick={handleDownload}>
            Download List File
          </button>
          <button
            type="button"
            className="comic-button bg-red-400"
            disabled={deleteCollection.isPending}
            onClick={() => {
              if (!collection || !listId) return
              if (!confirm(`Delete list "${collection.name}"? This cannot be undone.`)) return
              void deleteCollection.mutateAsync(listId).then(() => navigate({ href: '/' }))
            }}
          >
            Delete list
          </button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {collection.items.map((item, index) => {
          const types =
            item.types?.length ? item.types : (resolvedTypesByName.get(item.name) ?? [])
          const imageUrl = item.imageUrl ?? resolvedImageUrlById.get(item.pokemonId) ?? null
          const showSpecies = !speciesDuplicatesName(item)

          return (
            <article key={`${item.pokemonId}-${index}`} className="comic-card">
              <div className="flex items-center justify-between">
                <p className="comic-chip">#{item.pokemonId}</p>
                <p className="font-mono text-sm">{item.weight} hg</p>
              </div>
              <div className="my-4 grid place-items-center rounded-xl border-4 border-black bg-white/70 p-4">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={item.name}
                    width={200}
                    height={200}
                    className="h-48 w-48 object-contain"
                  />
                ) : (
                  <div className="h-48 w-48 bg-zinc-200" />
                )}
              </div>
              <h3 className="comic-name text-xl capitalize">{item.name.replace(/-/g, ' ')}</h3>
              {types.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {types.map((type) => (
                    <span key={type} className="comic-chip py-0 text-[10px] uppercase">
                      {type}
                    </span>
                  ))}
                </div>
              ) : null}
              {showSpecies ? (
                <p className="mt-2 text-sm uppercase tracking-wide">Species: {item.species}</p>
              ) : null}
            </article>
          )
        })}
      </section>
    </main>
  )
}
