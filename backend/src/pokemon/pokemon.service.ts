import { Injectable, NotFoundException } from '@nestjs/common';

const POKEAPI_BASE = 'https://pokeapi.co/api/v2';

type PokemonListResponse = {
  count: number;
  results: Array<{ name: string; url: string }>;
};

type PokemonDetailResponse = {
  id: number;
  name: string;
  species: { name: string };
  weight: number;
  sprites: { front_default: string | null };
};

type PokemonCard = {
  id: number;
  name: string;
  species: string;
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

  async list(page: number, limit: number, search?: string) {
    if (search) {
      const detail = await this.fetchPokemonDetail(search.toLowerCase());
      return {
        count: detail ? 1 : 0,
        page: 1,
        limit,
        items: detail ? [detail] : [],
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

  private async fetchPokemonDetail(name: string): Promise<PokemonCard | null> {
    const cached = this.detailCache.get(name);
    if (cached) {
      return cached;
    }

    const detailResponse = await fetch(`${POKEAPI_BASE}/pokemon/${name}`);

    if (detailResponse.status === 404) {
      return null;
    }

    if (!detailResponse.ok) {
      throw new NotFoundException(`Pokemon "${name}" could not be loaded`);
    }

    const detail = (await detailResponse.json()) as PokemonDetailResponse;

    const normalized: PokemonCard = {
      id: detail.id,
      name: detail.name,
      species: detail.species.name,
      weight: detail.weight,
      imageUrl: detail.sprites.front_default,
    };

    this.detailCache.set(name, normalized);

    return normalized;
  }
}
