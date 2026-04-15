import { useNavigate } from '@tanstack/react-router'
import type { ChangeEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
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

  const [selectionPanelOpen, setSelectionPanelOpen] = useState(false)

  const selectionRows = useMemo(() => {
    const rows: { pokemon: PokemonCatalogItem; rowKey: string }[] = []
    for (const [pokemonId, entry] of Object.entries(selection)) {
      for (let i = 0; i < entry.count; i++) {
        rows.push({
          pokemon: entry.pokemon,
          rowKey: `${pokemonId}-${i}`,
        })
      }
    }
    return rows
  }, [selection])

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

  const removeSelectedRow = (pokemon: PokemonCatalogItem) => {
    updateSelection(pokemon, -1)
  }

  useEffect(() => {
    if (selectedItems.length === 0) {
      setSelectionPanelOpen(false)
    }
  }, [selectedItems.length])

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
      await navigate({ href: `/lists/${created._id}` })
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
          <p className="comic-chip flex w-full flex-wrap items-center justify-between">Distinct species: {speciesCount} / {MIN_SPECIES}</p>
          <p className="comic-chip flex w-full flex-wrap items-center justify-between">Total weight: {totalWeight} / {MAX_WEIGHT} hg</p>
          <div className="comic-chip flex min-h-9 w-full flex-wrap items-center justify-between gap-2">
            <span className="min-w-0">Selected Pokemon: {selectedItems.length}</span>
            <button
              type="button"
              className="shrink-0 rounded-md border-2 border-black bg-[#ff8a00] px-2 py-0.5 text-[10px] font-black uppercase tracking-wide shadow-[2px_2px_0_#000] transition-transform hover:-translate-x-px hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0"
              disabled={selectedItems.length === 0}
              onClick={() => setSelectionPanelOpen(true)}
            >
              View
            </button>
          </div>
        </div>
      </section>

      {selectionPanelOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
          role="presentation"
          onClick={() => setSelectionPanelOpen(false)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setSelectionPanelOpen(false)
          }}
        >
          <section
            className="comic-panel max-h-[min(80vh,560px)] w-full max-w-lg overflow-hidden border-4 border-black shadow-[8px_8px_0_#000]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="selected-pokemon-heading"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b-4 border-black pb-3">
              <h3 id="selected-pokemon-heading" className="comic-subtitle text-xl">
                Selected Pokemon
              </h3>
              <button
                type="button"
                className="comic-button bg-zinc-200 py-1 px-3 text-sm"
                onClick={() => setSelectionPanelOpen(false)}
              >
                Close
              </button>
            </div>
            {selectionRows.length === 0 ? (
              <p className="text-sm font-bold">No Pokemon selected.</p>
            ) : (
              <ul className="max-h-[min(60vh,420px)] space-y-2 overflow-y-auto pr-1">
                {selectionRows.map(({ pokemon, rowKey }) => (
                  <li
                    key={rowKey}
                    className="flex items-center gap-3 rounded-xl border-4 border-black bg-white/90 p-2"
                  >
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border-2 border-black bg-zinc-100">
                      {pokemon.imageUrl ? (
                        <img
                          src={pokemon.imageUrl}
                          alt=""
                          width={48}
                          height={48}
                          className="h-full w-full object-contain"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-black capitalize">{pokemon.name.replace(/-/g, ' ')}</p>
                      <p className="text-xs font-bold text-zinc-700">{pokemon.weight} hg</p>
                      {pokemon.types.length > 0 ? (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {pokemon.types.map((type) => (
                            <span key={type} className="comic-chip py-0 text-[10px] uppercase">
                              {type}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      className="comic-button shrink-0 bg-red-400 py-1 px-2 text-xs"
                      onClick={() => removeSelectedRow(pokemon)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}

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
