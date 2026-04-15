import { Link } from '@tanstack/react-router'
import type { ChangeEvent } from 'react'
import { useState } from 'react'
import { ZodError } from 'zod'
import { parseCollectionFile } from '../lib/file-format'
import { useCollections, useCreateCollection } from '../lib/hooks'

export const HomePage = () => {
  const { data: collections, isLoading, isError } = useCollections()
  const createCollection = useCreateCollection()
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState<string | null>(null)

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImportError(null)
    setImportSuccess(null)

    try {
      const text = await file.text()
      const parsed = parseCollectionFile(JSON.parse(text))
      await createCollection.mutateAsync({
        name: parsed.name,
        items: parsed.items,
      })
      setImportSuccess(`List ${parsed.name} imported successfully.`)
    } catch (error) {
      if (error instanceof ZodError) {
        setImportError(`Invalid file: ${error.issues[0]?.message ?? 'unknown error'}`)
      } else {
        const details = (error as Error & { details?: { violations?: Array<{ message: string }> } }).details
        const serverMessage = details?.violations?.map((item) => item.message).join(' ')
        setImportError(serverMessage ?? (error instanceof Error ? error.message : 'Import failed.'))
      }
    } finally {
      event.currentTarget.value = ''
    }
  }

  return (
    <main className="space-y-6">
      <section className="comic-panel flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="comic-subtitle">Saved Lists</h2>
          <p className="max-w-2xl text-base">
            Build a squad, obey the 1300hg rule, and keep at least 3 distinct species.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="comic-button cursor-pointer bg-sky-300">
            Import list
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              disabled={createCollection.isPending}
              onChange={handleImportFile}
            />
          </label>
          <Link to="/create" className="comic-button bg-lime-300">
            Create New List
          </Link>
        </div>
      </section>

      {importSuccess ? <p className="comic-success">{importSuccess}</p> : null}
      {importError ? <p className="comic-warning">{importError}</p> : null}

      {isLoading ? <p className="comic-panel">Loading saved lists...</p> : null}
      {isError ? <p className="comic-warning">Could not load saved lists.</p> : null}

      {collections && collections.length === 0 ? (
        <p className="comic-panel">
          No lists yet. Smash the Create button and craft your first set.
        </p>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {collections?.map((collection) => (
          <article
            key={collection._id}
            className="comic-panel transition-transform hover:-translate-y-1"
          >
            <Link
              from="/"
              to="/lists/$listId"
              params={{ listId: collection._id }}
              className="block min-w-0"
            >
              <h3 className="comic-name text-2xl">{collection.name}</h3>
              <p className="mt-1 text-sm">Pokemon count: {collection.items.length}</p>
              <p className="text-sm">Total weight: {collection.totalWeight} hg</p>
              <p className="mt-3 text-xs uppercase tracking-widest">
                {new Date(collection.createdAt).toLocaleString()}
              </p>
            </Link>
          </article>
        ))}
      </section>
    </main>
  )
}
