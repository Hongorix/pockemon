import { useNavigate } from '@tanstack/react-router'
import type { ChangeEvent } from 'react'
import { useMemo, useState } from 'react'
import { ZodError } from 'zod'
import { PokemonCard } from '../components/pokemon-card'
import { parseCollectionFile } from '../lib/file-format'
import { useCreateCollection, usePokemonCatalog } from '../lib/hooks'
import { evaluateCollectionRules, MAX_WEIGHT, MIN_SPECIES } from '../lib/rules'
import type { CollectionItem, PokemonCatalogItem } from '../lib/types'

type SelectedState = Record<number, { pokemon: PokemonCatalogItem; count: number }>

const PAGE_SIZE = 20

const flattenSelections = (selection: SelectedState): CollectionItem[] => {
  return Object.values(selection).flatMap((entry) =>
    Array.from({ length: entry.count }, () => ({
      pokemonId: entry.pokemon.id,
      name: entry.pokemon.name,
      species: entry.pokemon.species,
      weight: entry.pokemon.weight,
      imageUrl: entry.pokemon.imageUrl,
    })),
  )
}

export const CreateListPage = () => {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [committedSearch, setCommittedSearch] = useState('')
  const [name, setName] = useState('')
  const [selection, setSelection] = useState<SelectedState>({})
  const [uploadError, setUploadError] = useState<string | null>(null)

  const { data, isLoading, isError } = usePokemonCatalog(page, PAGE_SIZE, committedSearch)
  const createCollection = useCreateCollection()

  const selectedItems = useMemo(() => flattenSelections(selection), [selection])
  const violations = useMemo(() => evaluateCollectionRules(selectedItems), [selectedItems])
  const totalWeight = useMemo(
    () => selectedItems.reduce((sum, item) => sum + item.weight, 0),
    [selectedItems],
  )
  const speciesCount = useMemo(
    () => new Set(selectedItems.map((item) => item.species.toLowerCase())).size,
    [selectedItems],
  )

  const updateSelection = (pokemon: PokemonCatalogItem, delta: number) => {
    setSelection((current) => {
      const existing = current[pokemon.id]
      const nextCount = Math.max((existing?.count ?? 0) + delta, 0)

      if (nextCount === 0) {
        const { [pokemon.id]: removed, ...rest } = current
        void removed
        return rest
      }

      return {
        ...current,
        [pokemon.id]: {
          pokemon,
          count: nextCount,
        },
      }
    })
  }

  const handleSearch = () => {
    setPage(1)
    setCommittedSearch(search.trim())
  }

  const handleSave = async () => {
    setUploadError(null)

    if (name.trim().length < 2) {
      setUploadError('List name must be at least 2 characters long.')
      return
    }

    if (violations.length > 0) {
      setUploadError('Fix rule violations before saving.')
      return
    }

    try {
      const created = await createCollection.mutateAsync({
        name: name.trim(),
        items: selectedItems,
      })
      await navigate({ to: '/lists/$listId', params: { listId: created._id } })
    } catch (error) {
      const details = (error as Error & { details?: { violations?: Array<{ message: string }> } }).details
      const serverMessage = details?.violations?.map((item) => item.message).join(' ')
      setUploadError(serverMessage ?? 'Could not save list right now.')
    }
  }

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const parsed = parseCollectionFile(JSON.parse(text))

      const nextSelection: SelectedState = {}
      for (const item of parsed.items) {
        const key = item.pokemonId
        const existing = nextSelection[key]
        nextSelection[key] = {
          pokemon: {
            id: item.pokemonId,
            name: item.name,
            species: item.species,
            types: [],
            weight: item.weight,
            imageUrl: item.imageUrl ?? null,
          },
          count: (existing?.count ?? 0) + 1,
        }
      }

      setName(parsed.name)
      setSelection(nextSelection)
      setUploadError(null)
    } catch (error) {
      if (error instanceof ZodError) {
        setUploadError(`Invalid file format: ${error.issues[0]?.message ?? 'unknown error'}`)
      } else {
        setUploadError('Could not parse uploaded file.')
      }
    } finally {
      event.currentTarget.value = ''
    }
  }

  return (
    <main className="space-y-6">
      <section className="comic-panel space-y-4">
        <h2 className="comic-subtitle">Create List</h2>
        <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr]">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="comic-input"
            placeholder="List name"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="comic-input"
            placeholder="Search by Pokemon name"
          />
          <button type="button" className="comic-button" onClick={handleSearch}>
            Search
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="comic-button cursor-pointer bg-cyan-300">
            Upload Saved File
            <input type="file" accept="application/json" className="hidden" onChange={handleUpload} />
          </label>
          <button
            type="button"
            className="comic-button bg-fuchsia-300"
            onClick={handleSave}
            disabled={createCollection.isPending}
          >
            {createCollection.isPending ? 'Saving...' : 'Save List'}
          </button>
        </div>
        <div className="grid gap-2 md:grid-cols-3">
          <p className="comic-chip">Distinct species: {speciesCount} / {MIN_SPECIES}</p>
          <p className="comic-chip">Total weight: {totalWeight} / {MAX_WEIGHT} hg</p>
          <p className="comic-chip">Selected Pokemon: {selectedItems.length}</p>
        </div>
      </section>

      {violations.length > 0 ? (
        <section className="comic-warning">
          {violations.map((violation) => (
            <p key={violation.code}>{violation.message}</p>
          ))}
        </section>
      ) : null}

      {uploadError ? <section className="comic-warning">{uploadError}</section> : null}
      {isLoading ? <section className="comic-panel">Loading Pokemon...</section> : null}
      {isError ? <section className="comic-warning">Failed to fetch Pokemon from API.</section> : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data?.items.map((pokemon) => (
          <PokemonCard
            key={pokemon.id}
            pokemon={pokemon}
            selectedCount={selection[pokemon.id]?.count ?? 0}
            onAdd={() => updateSelection(pokemon, 1)}
            onRemove={() => updateSelection(pokemon, -1)}
          />
        ))}
      </section>

      <section className="comic-panel flex items-center justify-between">
        <button
          type="button"
          className="comic-button"
          onClick={() => setPage((current) => Math.max(current - 1, 1))}
          disabled={page === 1 || Boolean(committedSearch)}
        >
          Previous
        </button>
        <p className="font-black">Page {page}</p>
        <button
          type="button"
          className="comic-button"
          onClick={() => setPage((current) => current + 1)}
          disabled={Boolean(committedSearch) || !data || data.items.length < PAGE_SIZE}
        >
          Next
        </button>
      </section>
    </main>
  )
}
