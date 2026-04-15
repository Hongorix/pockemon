import type { CollectionItem, ValidationViolation } from './types'

export const MIN_SPECIES = 3
export const MAX_WEIGHT = 1300

export const evaluateCollectionRules = (items: CollectionItem[]): ValidationViolation[] => {
  const speciesCount = new Set(items.map((item) => item.species.toLowerCase())).size
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0)
  const violations: ValidationViolation[] = []

  if (speciesCount < MIN_SPECIES) {
    violations.push({
      code: 'MIN_SPECIES',
      message: `At least ${MIN_SPECIES} different species are required.`,
    })
  }

  if (totalWeight > MAX_WEIGHT) {
    violations.push({
      code: 'MAX_WEIGHT',
      message: `Total weight cannot exceed ${MAX_WEIGHT} hectograms.`,
    })
  }

  return violations
}
