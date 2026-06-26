import type {
  BuildingDefinition,
  BuildingEntity,
  ResourceKind,
} from '../contracts'

export type InventoryFailure = 'invalid-amount' | 'insufficient-stock' | 'insufficient-capacity'

export interface InventoryResult {
  ok: boolean
  reason?: InventoryFailure
}

export function inventoryAmount(building: BuildingEntity, resource: ResourceKind): number {
  return building.inventory[resource] ?? 0
}

export function inventoryTotal(building: BuildingEntity): number {
  return Object.values(building.inventory).reduce<number>((total, amount) => total + (amount ?? 0), 0)
}

export function inventoryFreeCapacity(
  building: BuildingEntity,
  definition: BuildingDefinition | undefined,
): number {
  if (!definition) return Number.POSITIVE_INFINITY
  return Math.max(0, definition.capacity - inventoryTotal(building))
}

export function canRemoveInventory(
  building: BuildingEntity,
  resource: ResourceKind,
  amount: number,
): boolean {
  return Number.isFinite(amount) && amount >= 0 && inventoryAmount(building, resource) >= amount
}

export function removeInventory(
  building: BuildingEntity,
  resource: ResourceKind,
  amount: number,
): InventoryResult {
  if (!Number.isFinite(amount) || amount < 0) return { ok: false, reason: 'invalid-amount' }
  if (!canRemoveInventory(building, resource, amount)) {
    return { ok: false, reason: 'insufficient-stock' }
  }

  const next = inventoryAmount(building, resource) - amount
  if (next === 0) delete building.inventory[resource]
  else building.inventory[resource] = next
  return { ok: true }
}

export function canAddInventory(
  building: BuildingEntity,
  definition: BuildingDefinition | undefined,
  amount: number,
): boolean {
  return Number.isFinite(amount) && amount >= 0 && inventoryFreeCapacity(building, definition) >= amount
}

export function addInventory(
  building: BuildingEntity,
  definition: BuildingDefinition | undefined,
  resource: ResourceKind,
  amount: number,
): InventoryResult {
  if (!Number.isFinite(amount) || amount < 0) return { ok: false, reason: 'invalid-amount' }
  if (!canAddInventory(building, definition, amount)) {
    return { ok: false, reason: 'insufficient-capacity' }
  }

  building.inventory[resource] = inventoryAmount(building, resource) + amount
  return { ok: true }
}

