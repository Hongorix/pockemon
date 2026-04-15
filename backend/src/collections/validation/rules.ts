import { CreateCollectionItemDto } from '../dto/create-collection.dto';

export const COLLECTION_MIN_SPECIES = 3;
export const COLLECTION_MAX_WEIGHT = 1300;

export type CollectionRuleViolation = {
  code: 'MIN_SPECIES' | 'MAX_WEIGHT';
  message: string;
};

export type CollectionValidationResult = {
  totalWeight: number;
  distinctSpeciesCount: number;
  violations: CollectionRuleViolation[];
};

export const validateCollectionRules = (
  items: CreateCollectionItemDto[],
): CollectionValidationResult => {
  const speciesSet = new Set(items.map((item) => item.species.toLowerCase()));
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  const violations: CollectionRuleViolation[] = [];

  if (speciesSet.size < COLLECTION_MIN_SPECIES) {
    violations.push({
      code: 'MIN_SPECIES',
      message: `Select at least ${COLLECTION_MIN_SPECIES} Pokemon of different species.`,
    });
  }

  if (totalWeight > COLLECTION_MAX_WEIGHT) {
    violations.push({
      code: 'MAX_WEIGHT',
      message: `Total weight must be ${COLLECTION_MAX_WEIGHT} hectograms or less.`,
    });
  }

  return {
    totalWeight,
    distinctSpeciesCount: speciesSet.size,
    violations,
  };
};
