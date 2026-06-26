import type {
  BuildingDefinition,
  BuildingEntity,
  ResourceKind,
} from '../contracts'
import { inventoryAmount, removeInventory } from './inventory'

export const MIN_BUILDING_LEVEL = 0
export const MAX_BUILDING_LEVEL = 8

export type BuildingUpgradeFailure =
  | 'invalid-level'
  | 'max-level'
  | 'insufficient-materials'

export type BuildingUpgradeResult =
  | {
    ok: true
    previousLevel: number
    level: number
    cost: Partial<Record<ResourceKind, number>>
    effect: {
      capacity: number
      jobs: number
    }
  }
  | {
    ok: false
    reason: BuildingUpgradeFailure
    missing?: Partial<Record<ResourceKind, number>>
  }

export function buildingUpgradeCost(
  building: BuildingEntity,
  definition: BuildingDefinition,
): Partial<Record<ResourceKind, number>> {
  const nextLevel = building.level + 1
  if (nextLevel > maxLevelFor(definition)) return {}
  return compactCost({
    wood: nextLevel,
    stone: Math.floor(nextLevel / 2),
  })
}

export function effectiveBuildingDefinition(
  definition: BuildingDefinition,
  building: Pick<BuildingEntity, 'level'>,
): BuildingDefinition {
  const level = normalizedLevel(building.level)
  if (level === 0) {
    return {
      ...definition,
      capacity: 0,
      jobs: 0,
    }
  }
  const bonusLevels = Math.max(0, level - 1)
  const capacityMultiplier = 1 + bonusLevels * 0.15
  const jobsBonus = Math.floor((definition.jobs * bonusLevels) / 4)

  return {
    ...definition,
    capacity: Math.round(definition.capacity * capacityMultiplier),
    jobs: definition.jobs + jobsBonus,
  }
}

export function upgradeBuildingImmediately(
  building: BuildingEntity,
  definition: BuildingDefinition,
): BuildingUpgradeResult {
  if (!Number.isInteger(building.level) || building.level < MIN_BUILDING_LEVEL) {
    return { ok: false, reason: 'invalid-level' }
  }

  const maxLevel = maxLevelFor(definition)
  if (building.level >= maxLevel) {
    return { ok: false, reason: 'max-level' }
  }

  const previousLevel = building.level
  const cost = buildingUpgradeCost(building, definition)
  const missing = missingMaterials(building, cost)
  if (Object.keys(missing).length > 0) {
    return { ok: false, reason: 'insufficient-materials', missing }
  }

  for (const [resource, amount] of costEntries(cost)) {
    removeInventory(building, resource, amount)
  }
  building.level = previousLevel + 1
  const effect = effectiveBuildingDefinition(definition, building)

  return {
    ok: true,
    previousLevel,
    level: building.level,
    cost,
    effect: {
      capacity: effect.capacity,
      jobs: effect.jobs,
    },
  }
}

function maxLevelFor(definition: BuildingDefinition): number {
  return Math.min(MAX_BUILDING_LEVEL, definition.maxLevel)
}

function normalizedLevel(level: number): number {
  if (!Number.isFinite(level)) return MIN_BUILDING_LEVEL
  return Math.min(MAX_BUILDING_LEVEL, Math.max(MIN_BUILDING_LEVEL, Math.floor(level)))
}

function missingMaterials(
  building: BuildingEntity,
  cost: Partial<Record<ResourceKind, number>>,
): Partial<Record<ResourceKind, number>> {
  const missing: Partial<Record<ResourceKind, number>> = {}
  for (const [resource, amount] of costEntries(cost)) {
    const shortage = amount - inventoryAmount(building, resource)
    if (shortage > 0) missing[resource] = shortage
  }
  return missing
}

function compactCost(
  cost: Partial<Record<ResourceKind, number>>,
): Partial<Record<ResourceKind, number>> {
  return Object.fromEntries(costEntries(cost)) as Partial<Record<ResourceKind, number>>
}

function costEntries(
  cost: Partial<Record<ResourceKind, number>>,
): [ResourceKind, number][] {
  return Object.entries(cost).filter((entry): entry is [ResourceKind, number] => (
    typeof entry[1] === 'number' && entry[1] > 0
  ))
}
