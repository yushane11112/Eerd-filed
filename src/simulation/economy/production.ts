import type {
  BuildingDefinition,
  BuildingEntity,
  ProductionRecipe,
  ResourceKind,
  SimulationEvent,
  SimulationSnapshot,
  SimulationSystem,
} from '../contracts'
import {
  addInventory,
  inventoryAmount,
  inventoryFreeCapacity,
  removeInventory,
} from './inventory'
import { effectiveBuildingDefinition } from './upgrades'
import { activeWorkerCount } from '../core/workforce'

export const PRODUCTION_STOP_REASONS = {
  NO_WORKERS: 'no-workers',
  MISSING_INPUT: 'missing-input',
  OUTPUT_FULL: 'output-full',
} as const

export interface ProductionSystemOptions {
  definitions: Readonly<Record<string, BuildingDefinition>>
}

function entries(record: Partial<Record<ResourceKind, number>>): [ResourceKind, number][] {
  return Object.entries(record).filter((entry): entry is [ResourceKind, number] => (
    typeof entry[1] === 'number' && entry[1] > 0
  ))
}

function missingInput(building: BuildingEntity, recipe: ProductionRecipe): ResourceKind | undefined {
  return entries(recipe.inputs).find(([resource, amount]) => (
    inventoryAmount(building, resource) < amount
  ))?.[0]
}

function outputAmount(recipe: ProductionRecipe): number {
  return entries(recipe.outputs).reduce((total, [, amount]) => total + amount, 0)
}

function inputAmount(recipe: ProductionRecipe): number {
  return entries(recipe.inputs).reduce((total, [, amount]) => total + amount, 0)
}

export class ProductionSystem implements SimulationSystem {
  readonly id = 'economy.production'
  private readonly definitions: Readonly<Record<string, BuildingDefinition>>

  constructor(options: ProductionSystemOptions) {
    this.definitions = options.definitions
  }

  update(snapshot: SimulationSnapshot): SimulationEvent[] {
    const events: SimulationEvent[] = []
    const buildings = Object.values(snapshot.buildings).sort((a, b) => a.id.localeCompare(b.id))

    for (const building of buildings) {
      const baseDefinition = this.definitions[building.type]
      const definition = baseDefinition
        ? effectiveBuildingDefinition(baseDefinition, building)
        : undefined
      const recipe = definition?.production
      if (!definition || !recipe || building.status === 'constructing' || building.status === 'upgrading') {
        continue
      }

      const previousStatus = building.status
      const previousReason = building.statusReason
      const missing = missingInput(building, recipe)
      const projectedOutputSpace = inventoryFreeCapacity(building, definition) + inputAmount(recipe)

      const presentWorkers = activeWorkerCount(snapshot, building)
      if (definition.jobs > 0 && presentWorkers === 0) {
        this.block(building, PRODUCTION_STOP_REASONS.NO_WORKERS, snapshot.tick)
      } else if (missing) {
        this.block(building, `${PRODUCTION_STOP_REASONS.MISSING_INPUT}:${missing}`, snapshot.tick)
      } else if (projectedOutputSpace < outputAmount(recipe)) {
        this.block(building, PRODUCTION_STOP_REASONS.OUTPUT_FULL, snapshot.tick)
      } else {
        building.status = 'working'
        delete building.statusReason
        delete building.blockedSinceTick
        delete building.blockedAuditBaseline
        const staffing = definition.jobs === 0
          ? 1
          : Math.min(1, presentWorkers / definition.jobs)
        building.productionProgress += staffing

        if (building.productionProgress >= recipe.durationTicks) {
          for (const [resource, amount] of entries(recipe.inputs)) {
            removeInventory(building, resource, amount)
          }
          for (const [resource, amount] of entries(recipe.outputs)) {
            addInventory(building, definition, resource, amount)
          }
          building.productionProgress %= recipe.durationTicks
          events.push({ type: 'production-completed', buildingId: building.id })
        }
      }

      if (building.status !== previousStatus || building.statusReason !== previousReason) {
        events.push({ type: 'building-state-changed', buildingId: building.id })
      }
    }

    return events
  }

  private block(building: BuildingEntity, reason: string, tick: number): void {
    if (building.status !== 'blocked' || building.statusReason !== reason) {
      building.blockedSinceTick = tick
    }
    building.status = 'blocked'
    building.statusReason = reason
  }
}
