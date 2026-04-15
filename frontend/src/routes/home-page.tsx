import { Link } from '@tanstack/react-router'
import { useCollections } from '../lib/hooks'

export const HomePage = () => {
  const { data: collections, isLoading, isError } = useCollections()

  return (
    <main className="space-y-6">
      <section className="comic-panel flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="comic-subtitle">Saved Lists</h2>
          <p className="max-w-2xl text-base">
            Build a squad, obey the 1300hg rule, and keep at least 3 distinct species.
          </p>
        </div>
        <Link to="/create" className="comic-button bg-lime-300">
          Create New List
        </Link>
      </section>

      {isLoading ? <p className="comic-panel">Loading saved lists...</p> : null}
      {isError ? <p className="comic-warning">Could not load saved lists.</p> : null}

      {collections && collections.length === 0 ? (
        <p className="comic-panel">
          No lists yet. Smash the Create button and craft your first set.
        </p>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {collections?.map((collection) => (
          <Link
            key={collection._id}
            to="/lists/$listId"
            params={{ listId: collection._id }}
            className="comic-panel block transition-transform hover:-translate-y-1"
          >
            <h3 className="comic-name text-2xl">{collection.name}</h3>
            <p className="mt-1 text-sm">Pokemon count: {collection.items.length}</p>
            <p className="text-sm">Total weight: {collection.totalWeight} hg</p>
            <p className="mt-3 text-xs uppercase tracking-widest">
              {new Date(collection.createdAt).toLocaleString()}
            </p>
          </Link>
        ))}
      </section>
    </main>
  )
}
