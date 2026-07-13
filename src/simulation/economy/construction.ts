import type {
  BuildingCategory,
  BuildingDefinition,
  BuildingEntity,
  ResourceKind,
  RoadKind,
} from '../contracts'
import { inventoryAmount, removeInventory } from './inventory'

export interface BuildingConstructionCost {
  treasury: number
  materials: Partial<Record<ResourceKind, number>>
}

export interface BuildingConstructionQuote {
  buildingType: string
  cost: BuildingConstructionCost
  missingMaterials: Partial<Record<ResourceKind, number>>
  missingTreasury: number
  canAfford: boolean
}

export interface RoadConstructionCost {
  treasury: number
}

export interface RoadConstructionQuote {
  kind: RoadKind
  count: number
  cost: RoadConstructionCost
  missingTreasury: number
  canAfford: boolean
}

export interface BuildingUpgradeCostCurve {
  base?: Partial<Record<ResourceKind, number>>
  perNextLevel?: Partial<Record<ResourceKind, number>>
  perTwoNextLevels?: Partial<Record<ResourceKind, number>>
  milestoneLevels?: Partial<Record<number, Partial<Record<ResourceKind, number>>>>
}

export interface ConstructionEconomyTable {
  buildingCosts: Record<string, BuildingConstructionCost>
  roadCosts: Record<RoadKind, RoadConstructionCost>
  upgradeCosts: {
    defaultCurve: BuildingUpgradeCostCurve
    categoryCurves?: Partial<Record<BuildingCategory, BuildingUpgradeCostCurve>>
    typeCurves?: Record<string, BuildingUpgradeCostCurve>
  }
  fallback: {
    baseTreasury: number
    treasuryPerFootprint: number
    woodPerTwoFootprint: number
    stonePerThreeFootprint: number
  }
}

export const DEFAULT_CONSTRUCTION_ECONOMY_TABLE: ConstructionEconomyTable = {
  buildingCosts: {
    house: { treasury: 80, materials: { wood: 2, stone: 1 } },
    granary: { treasury: 140, materials: { wood: 3, stone: 2 } },
    riceField: { treasury: 60, materials: { wood: 1 } },
    market: { treasury: 180, materials: { wood: 4, stone: 2 } },
    woodshop: { treasury: 220, materials: { wood: 5, stone: 2, brick: 1 } },
  },
  roadCosts: {
    dirt: { treasury: 2 },
    stone: { treasury: 6 },
    bridge: { treasury: 18 },
  },
  upgradeCosts: {
    defaultCurve: {
      perNextLevel: { wood: 1 },
      perTwoNextLevels: { stone: 1 },
    },
    categoryCurves: {
      housing: {
        perNextLevel: { wood: 1 },
        perTwoNextLevels: { stone: 1 },
        milestoneLevels: {
          4: { cloth: 1 },
          7: { brick: 1 },
        },
      },
      storage: {
        perNextLevel: { wood: 1 },
        perTwoNextLevels: { stone: 1 },
        milestoneLevels: {
          5: { brick: 1 },
        },
      },
      production: {
        perNextLevel: { wood: 2 },
        perTwoNextLevels: { stone: 1, brick: 1 },
      },
      market: {
        perNextLevel: { wood: 2 },
        perTwoNextLevels: { stone: 1 },
        milestoneLevels: {
          3: { cloth: 1 },
          6: { brick: 2 },
        },
      },
      service: {
        perNextLevel: { wood: 1 },
        perTwoNextLevels: { stone: 2 },
        milestoneLevels: {
          4: { cloth: 1 },
          6: { brick: 2 },
        },
      },
      harbor: {
        perNextLevel: { wood: 2 },
        perTwoNextLevels: { stone: 1, brick: 1 },
      },
      landmark: {
        perNextLevel: { stone: 1 },
        perTwoNextLevels: { brick: 1 },
        milestoneLevels: {
          4: { cloth: 1 },
        },
      },
    },
  },
  fallback: {
    baseTreasury: 50,
    treasuryPerFootprint: 20,
    woodPerTwoFootprint: 2,
    stonePerThreeFootprint: 3,
  },
}

export function buildingUpgradeCost(
  building: Pick<BuildingEntity, 'level'>,
  table: ConstructionEconomyTable = DEFAULT_CONSTRUCTION_ECONOMY_TABLE,
  definition?: Pick<BuildingDefinition, 'type' | 'category'>,
): Partial<Record<ResourceKind, number>> {
  const nextLevel = Math.max(0, Math.floor(building.level + 1))
  if (!Number.isFinite(nextLevel) || nextLevel <= 0) return {}
  const curve = upgradeCostCurveFor(table, definition)
  return compactCost(
    addCosts(
      scaleCost(curve.base, 1),
      scaleCost(curve.perNextLevel, nextLevel),
      scaleCost(curve.perTwoNextLevels, Math.floor(nextLevel / 2)),
      curve.milestoneLevels?.[nextLevel],
    ),
  )
}

export function buildingConstructionCost(
  type: string,
  definition?: BuildingDefinition,
  table: ConstructionEconomyTable = DEFAULT_CONSTRUCTION_ECONOMY_TABLE,
): BuildingConstructionCost {
  const base = table.buildingCosts[type]
  if (base) return cloneCost(base)
  const footprintSize = definition?.footprint.length ?? 1
  return {
    treasury: table.fallback.baseTreasury + footprintSize * table.fallback.treasuryPerFootprint,
    materials: {
      wood: Math.max(1, Math.ceil(footprintSize / table.fallback.woodPerTwoFootprint)),
      stone: Math.floor(footprintSize / table.fallback.stonePerThreeFootprint),
    },
  }
}

export function roadConstructionCost(
  kind: RoadKind,
  table: ConstructionEconomyTable = DEFAULT_CONSTRUCTION_ECONOMY_TABLE,
): RoadConstructionCost {
  return { ...table.roadCosts[kind] }
}

export function quoteRoadConstruction(
  kind: RoadKind,
  count: number,
  treasury: number,
  table: ConstructionEconomyTable = DEFAULT_CONSTRUCTION_ECONOMY_TABLE,
): RoadConstructionQuote {
  const unitCost = roadConstructionCost(kind, table)
  const safeCount = Math.max(0, Math.floor(count))
  const cost = { treasury: unitCost.treasury * safeCount }
  const missingTreasury = Math.max(0, cost.treasury - treasury)
  return {
    kind,
    count: safeCount,
    cost,
    missingTreasury,
    canAfford: missingTreasury <= 0,
  }
}

export function quoteBuildingConstruction(
  type: string,
  definition: BuildingDefinition | undefined,
  treasury: number,
  buildings: Record<string, BuildingEntity>,
  definitions: Record<string, BuildingDefinition>,
  table: ConstructionEconomyTable = DEFAULT_CONSTRUCTION_ECONOMY_TABLE,
): BuildingConstructionQuote {
  const cost = buildingConstructionCost(type, definition, table)
  const storageBuildings = cityStorageBuildings(buildings, definitions)
  const missingMaterials = missingMaterialsFromCityStorage(storageBuildings, cost.materials)
  const missingTreasury = Math.max(0, cost.treasury - treasury)
  return {
    buildingType: type,
    cost,
    missingMaterials,
    missingTreasury,
    canAfford: missingTreasury <= 0 && Object.keys(missingMaterials).length === 0,
  }
}

export function spendBuildingConstructionCost(
  type: string,
  definition: BuildingDefinition | undefined,
  treasury: number,
  buildings: Record<string, BuildingEntity>,
  definitions: Record<string, BuildingDefinition>,
  table: ConstructionEconomyTable = DEFAULT_CONSTRUCTION_ECONOMY_TABLE,
): {
  ok: true
  treasury: number
  cost: BuildingConstructionCost
} | {
  ok: false
  quote: BuildingConstructionQuote
} {
  const quote = quoteBuildingConstruction(type, definition, treasury, buildings, definitions, table)
  if (!quote.canAfford) return { ok: false, quote }
  const storageBuildings = cityStorageBuildings(buildings, definitions)
  for (const [resource, amount] of costEntries(quote.cost.materials)) {
    let remaining = amount
    for (const store of storageBuildings) {
      if (remaining <= 0) break
      const available = inventoryAmount(store, resource)
      const spent = Math.min(available, remaining)
      if (spent > 0) {
        removeInventory(store, resource, spent)
        remaining -= spent
      }
    }
  }
  return {
    ok: true,
    treasury: treasury - quote.cost.treasury,
    cost: quote.cost,
  }
}

export function validateConstructionEconomyTable(table: ConstructionEconomyTable): string[] {
  const errors: string[] = []
  for (const [type, cost] of Object.entries(table.buildingCosts)) {
    validateNonNegative(cost.treasury, `buildingCosts.${type}.treasury`, errors)
    for (const [resource, amount] of Object.entries(cost.materials)) {
      validateNonNegative(amount, `buildingCosts.${type}.materials.${resource}`, errors)
    }
  }
  for (const kind of ['dirt', 'stone', 'bridge'] as RoadKind[]) {
    validateNonNegative(table.roadCosts[kind]?.treasury, `roadCosts.${kind}.treasury`, errors)
  }
  validateUpgradeCurve(table.upgradeCosts?.defaultCurve, 'upgradeCosts.defaultCurve', errors)
  for (const [category, curve] of Object.entries(table.upgradeCosts?.categoryCurves ?? {})) {
    validateUpgradeCurve(curve, `upgradeCosts.categoryCurves.${category}`, errors)
  }
  for (const [type, curve] of Object.entries(table.upgradeCosts?.typeCurves ?? {})) {
    validateUpgradeCurve(curve, `upgradeCosts.typeCurves.${type}`, errors)
  }
  validateNonNegative(table.fallback.baseTreasury, 'fallback.baseTreasury', errors)
  validateNonNegative(table.fallback.treasuryPerFootprint, 'fallback.treasuryPerFootprint', errors)
  validatePositive(table.fallback.woodPerTwoFootprint, 'fallback.woodPerTwoFootprint', errors)
  validatePositive(table.fallback.stonePerThreeFootprint, 'fallback.stonePerThreeFootprint', errors)
  return errors
}

function upgradeCostCurveFor(
  table: ConstructionEconomyTable,
  definition?: Pick<BuildingDefinition, 'type' | 'category'>,
): BuildingUpgradeCostCurve {
  if (definition?.type && table.upgradeCosts.typeCurves?.[definition.type]) {
    return table.upgradeCosts.typeCurves[definition.type]
  }
  if (definition?.category && table.upgradeCosts.categoryCurves?.[definition.category]) {
    return table.upgradeCosts.categoryCurves[definition.category]!
  }
  return table.upgradeCosts.defaultCurve
}

function scaleCost(
  cost: Partial<Record<ResourceKind, number>> | undefined,
  factor: number,
): Partial<Record<ResourceKind, number>> {
  if (!cost || factor <= 0) return {}
  const scaled: Partial<Record<ResourceKind, number>> = {}
  for (const [resource, amount] of costEntries(cost)) {
    scaled[resource] = amount * factor
  }
  return scaled
}

function addCosts(
  ...costs: Array<Partial<Record<ResourceKind, number>> | undefined>
): Partial<Record<ResourceKind, number>> {
  const total: Partial<Record<ResourceKind, number>> = {}
  for (const cost of costs) {
    if (!cost) continue
    for (const [resource, amount] of costEntries(cost)) {
      total[resource] = (total[resource] ?? 0) + amount
    }
  }
  return total
}

function validateUpgradeCurve(
  curve: BuildingUpgradeCostCurve | undefined,
  path: string,
  errors: string[],
): void {
  if (!curve) {
    errors.push(`${path} must be defined`)
    return
  }
  validateCostMap(curve.base, `${path}.base`, errors)
  validateCostMap(curve.perNextLevel, `${path}.perNextLevel`, errors)
  validateCostMap(curve.perTwoNextLevels, `${path}.perTwoNextLevels`, errors)
  for (const [level, cost] of Object.entries(curve.milestoneLevels ?? {})) {
    validatePositive(Number(level), `${path}.milestoneLevels.${level}`, errors)
    validateCostMap(cost, `${path}.milestoneLevels.${level}`, errors)
  }
}

function validateCostMap(
  cost: Partial<Record<ResourceKind, number>> | undefined,
  path: string,
  errors: string[],
): void {
  for (const [resource, amount] of Object.entries(cost ?? {})) {
    validateNonNegative(amount, `${path}.${resource}`, errors)
  }
}

function cityStorageBuildings(
  buildings: Record<string, BuildingEntity>,
  definitions: Record<string, BuildingDefinition>,
): BuildingEntity[] {
  return Object.values(buildings)
    .filter((building) => {
      const definition = definitions[building.type]
      return definition?.category === 'storage' || building.type === 'granary'
    })
    .sort((a, b) => a.id.localeCompare(b.id))
}

function missingMaterialsFromCityStorage(
  storageBuildings: BuildingEntity[],
  cost: Partial<Record<ResourceKind, number>>,
): Partial<Record<ResourceKind, number>> {
  const missing: Partial<Record<ResourceKind, number>> = {}
  for (const [resource, amount] of costEntries(cost)) {
    const available = storageBuildings.reduce(
      (total, building) => total + inventoryAmount(building, resource),
      0,
    )
    const shortage = amount - available
    if (shortage > 0) missing[resource] = shortage
  }
  return missing
}

function cloneCost(cost: BuildingConstructionCost): BuildingConstructionCost {
  return {
    treasury: cost.treasury,
    materials: { ...cost.materials },
  }
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

function validateNonNegative(value: number | undefined, label: string, errors: string[]): void {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    errors.push(`${label} must be a non-negative finite number`)
  }
}

function validatePositive(value: number | undefined, label: string, errors: string[]): void {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    errors.push(`${label} must be greater than zero`)
  }
}
