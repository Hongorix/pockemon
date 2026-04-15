import type { PokemonCatalogItem } from '../lib/types'

type PokemonCardProps = {
  pokemon: PokemonCatalogItem
  selectedCount: number
  onAdd: () => void
  onRemove: () => void
}

export const PokemonCard = ({ pokemon, selectedCount, onAdd, onRemove }: PokemonCardProps) => {
  return (
    <article className="comic-card">
      <div className="flex items-center justify-between">
        <p className="comic-chip">#{pokemon.id}</p>
        <p className="font-mono text-sm">{pokemon.weight} hg</p>
      </div>
      <div className="my-4 grid place-items-center rounded-xl border-4 border-black bg-white/70 p-3">
        {pokemon.imageUrl ? (
          <img
            src={pokemon.imageUrl}
            alt={pokemon.name}
            width={120}
            height={120}
            className="h-28 w-28 object-contain drop-shadow-[4px_6px_0_#000]"
          />
        ) : (
          <div className="h-28 w-28 bg-zinc-200" />
        )}
      </div>
      <h3 className="comic-name">{pokemon.name}</h3>
      <p className="text-sm uppercase tracking-wide">{pokemon.species}</p>
      <div className="mt-4 flex items-center justify-between">
        <button className="comic-mini-btn" type="button" onClick={onRemove} disabled={selectedCount < 1}>
          -
        </button>
        <p className="text-lg font-bold">{selectedCount}</p>
        <button className="comic-mini-btn" type="button" onClick={onAdd}>
          +
        </button>
      </div>
    </article>
  )
}
