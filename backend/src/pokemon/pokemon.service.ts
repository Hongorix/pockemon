import { Injectable, NotFoundException } from '@nestjs/common';

const POKEAPI_BASE = 'https://pokeapi.co/api/v2';

type PokemonListResponse = {
  count: number;
  results: Array<{ name: string; url: string }>;
};

type PokemonDetailResponse = {
  id: number;
  name: string;
  species: { name: string; url: string };
  types: Array<{ slot: number; type: { name: string } }>;
  weight: number;
  sprites: {
    front_default: string | null;
    other?: {
      home?: { front_default?: string | null };
      'official-artwork'?: { front_default?: string | null };
    };
  };
};

type PokemonSpeciesResponse = {
  varieties: Array<{
    is_default: boolean;
    pokemon: { name: string; url: string };
  }>;
};

function pokemonImageUrl(sprites: PokemonDetailResponse['sprites']): string | null {
  return (
    sprites.front_default ??
    sprites.other?.['official-artwork']?.front_default ??
    sprites.other?.home?.front_default ??
    null
  );
}

/** e.g. charizard-mega-x → charizard, tatsugiri-curly-mega → tatsugiri-curly */
function inferBaseFormName(formName: string): string | null {
  const megaXY = /^(.+)-mega-[xy]$/.exec(formName);
  if (megaXY) {
    return megaXY[1];
  }
  const mega = /^(.+)-mega$/.exec(formName);
  if (mega) {
    return mega[1];
  }
  return null;
}

type PokemonCard = {
  id: number;
  name: string;
  species: string;
  types: string[];
  weight: number;
  imageUrl: string | null;
};

@Injectable()
export class PokemonService {
  private readonly pageCache = new Map<
    string,
    { count: number; items: PokemonCard[] }
  >();

  private readonly detailCache = new Map<string, PokemonCard>();

  private allPokemonNames: Promise<string[]> | null = null;

  private async getAllPokemonNames(): Promise<string[]> {
    if (!this.allPokemonNames) {
      this.allPokemonNames = (async () => {
        const listResponse = await fetch(
          `${POKEAPI_BASE}/pokemon?limit=10000`,
        );
        if (!listResponse.ok) {
          throw new Error('Unable to retrieve pokemon name list from PokeAPI');
        }
        const listData = (await listResponse.json()) as PokemonListResponse;
        return listData.results.map((item) => item.name);
      })();
    }
    return this.allPokemonNames;
  }

  async list(page: number, limit: number, search?: string) {
    const query = search?.trim().toLowerCase() ?? '';

    if (query) {
      const allNames = await this.getAllPokemonNames();
      const matches = allNames.filter((name) => name.includes(query));
      const offset = (page - 1) * limit;
      const slice = matches.slice(offset, offset + limit);
      const items = await Promise.all(
        slice.map((name) => this.fetchPokemonDetail(name)),
      );
      const normalizedItems = items.filter((item): item is PokemonCard => !!item);

      return {
        count: matches.length,
        page,
        limit,
        items: normalizedItems,
      };
    }

    const offset = (page - 1) * limit;
    const cacheKey = `${offset}:${limit}`;
    const cached = this.pageCache.get(cacheKey);

    if (cached) {
      return {
        count: cached.count,
        page,
        limit,
        items: cached.items,
      };
    }

    const listResponse = await fetch(
      `${POKEAPI_BASE}/pokemon?offset=${offset}&limit=${limit}`,
    );

    if (!listResponse.ok) {
      throw new Error('Unable to retrieve pokemon list from PokeAPI');
    }

    const listData = (await listResponse.json()) as PokemonListResponse;
    const items = await Promise.all(
      listData.results.map((item) => this.fetchPokemonDetail(item.name)),
    );

    const normalizedItems = items.filter((item): item is PokemonCard => !!item);

    this.pageCache.set(cacheKey, {
      count: listData.count,
      items: normalizedItems,
    });

    return {
      count: listData.count,
      page,
      limit,
      items: normalizedItems,
    };
  }

  /**
   * Some forms (e.g. tatsugiri-*-mega) have no sprite URLs in PokeAPI; use another
   * variety of the same species (typically the matching non-mega form).
   */
  private async resolveImageViaSpeciesLine(
    formName: string,
    speciesUrl: string,
  ): Promise<string | null> {
    const speciesResponse = await fetch(speciesUrl);
    if (!speciesResponse.ok) {
      return null;
    }
    const species = (await speciesResponse.json()) as PokemonSpeciesResponse;

    const imageFromPokemonUrl = async (
      pokemonUrl: string,
    ): Promise<string | null> => {
      const res = await fetch(pokemonUrl);
      if (!res.ok) {
        return null;
      }
      const detail = (await res.json()) as PokemonDetailResponse;
      return pokemonImageUrl(detail.sprites);
    };

    const baseName = inferBaseFormName(formName);
    if (baseName) {
      const match = species.varieties.find((v) => v.pokemon.name === baseName);
      if (match) {
        const img = await imageFromPokemonUrl(match.pokemon.url);
        if (img) {
          return img;
        }
      }
    }

    const defaultVariety = species.varieties.find((v) => v.is_default);
    if (defaultVariety && defaultVariety.pokemon.name !== formName) {
      const img = await imageFromPokemonUrl(defaultVariety.pokemon.url);
      if (img) {
        return img;
      }
    }

    for (const v of species.varieties) {
      if (v.pokemon.name === formName) {
        continue;
      }
      const img = await imageFromPokemonUrl(v.pokemon.url);
      if (img) {
        return img;
      }
    }

    return null;
  }

  /**
   * @param identifier PokeAPI accepts a species name slug or numeric id (e.g. `"10322"`).
   */
  private async fetchPokemonDetail(identifier: string): Promise<PokemonCard | null> {
    const cached = this.detailCache.get(identifier);
    if (cached) {
      return cached;
    }

    const detailResponse = await fetch(
      `${POKEAPI_BASE}/pokemon/${encodeURIComponent(identifier)}`,
    );

    if (detailResponse.status === 404) {
      return null;
    }

    if (!detailResponse.ok) {
      throw new NotFoundException(`Pokemon "${identifier}" could not be loaded`);
    }

    const detail = (await detailResponse.json()) as PokemonDetailResponse;

    let imageUrl = pokemonImageUrl(detail.sprites);
    if (!imageUrl && detail.species.url) {
      imageUrl = await this.resolveImageViaSpeciesLine(
        detail.name,
        detail.species.url,
      );
    }

    const normalized: PokemonCard = {
      id: detail.id,
      name: detail.name,
      species: detail.species.name,
      types: detail.types
        .sort((a, b) => a.slot - b.slot)
        .map((entry) => entry.type.name),
      weight: detail.weight,
      imageUrl,
    };

    this.detailCache.set(identifier, normalized);
    this.detailCache.set(normalized.name, normalized);
    this.detailCache.set(String(normalized.id), normalized);

    return normalized;
  }

  async getPokemonById(id: number): Promise<PokemonCard | null> {
    return this.fetchPokemonDetail(String(id));
  }
}
