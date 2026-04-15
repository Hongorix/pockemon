import { useParams } from '@tanstack/react-router'
import { useCollection } from '../lib/hooks'

export const ListDetailPage = () => {
  const { listId } = useParams({ strict: false })
  const { data: collection, isLoading, isError } = useCollection(listId ?? '')

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
        <button type="button" className="comic-button bg-amber-300" onClick={handleDownload}>
          Download List File
        </button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {collection.items.map((item, index) => (
          <article key={`${item.pokemonId}-${index}`} className="comic-card">
            <div className="flex items-center justify-between">
              <p className="comic-chip">#{item.pokemonId}</p>
              <p className="font-mono text-sm">{item.weight} hg</p>
            </div>
            <div className="my-4 grid place-items-center rounded-xl border-4 border-black bg-white/70 p-4">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  width={200}
                  height={200}
                  className="h-48 w-48 object-contain"
                />
              ) : (
                <div className="h-48 w-48 bg-zinc-200" />
              )}
            </div>
            <h3 className="comic-name text-xl">{item.name}</h3>
            <p className="text-sm uppercase tracking-wide">Species: {item.species}</p>
          </article>
        ))}
      </section>
    </main>
  )
}
