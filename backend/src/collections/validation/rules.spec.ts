import { validateCollectionRules } from './rules';

describe('validateCollectionRules', () => {
  it('returns violations when species count and total weight are invalid', () => {
    const result = validateCollectionRules([
      { pokemonId: 1, name: 'bulbasaur', species: 'bulbasaur', weight: 700 },
      { pokemonId: 2, name: 'ivysaur', species: 'bulbasaur', weight: 700 },
    ]);

    expect(result.violations).toHaveLength(2);
    expect(result.violations.map((violation) => violation.code)).toEqual([
      'MIN_SPECIES',
      'MAX_WEIGHT',
    ]);
  });

  it('passes valid collections', () => {
    const result = validateCollectionRules([
      { pokemonId: 1, name: 'bulbasaur', species: 'bulbasaur', weight: 300 },
      { pokemonId: 4, name: 'charmander', species: 'charmander', weight: 300 },
      { pokemonId: 7, name: 'squirtle', species: 'squirtle', weight: 300 },
    ]);

    expect(result.violations).toHaveLength(0);
    expect(result.totalWeight).toBe(900);
    expect(result.distinctSpeciesCount).toBe(3);
  });
});
