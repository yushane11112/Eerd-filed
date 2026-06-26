import type {
  BuildingDefinition,
  BuildingEntity,
  HouseholdState,
  ResourceKind,
  SimulationEvent,
  SimulationSnapshot,
  SimulationSystem,
} from '../contracts'
import { inventoryAmount, removeInventory } from './inventory'
import { RoadRoutePlanner, type RoutePlanner } from './logistics'

type NeedKind = keyof HouseholdState['needs']

export interface ServiceRule {
  need: NeedKind
  resource?: ResourceKind
  amountPerHousehold?: number
  restoreAmount: number
  maxHouseholdsPerTick: number
}

export interface ServiceSystemOptions {
  definitions: Readonly<Record<string, BuildingDefinition>>
  routePlanner?: RoutePlanner
  rules?: Readonly<Record<string, ServiceRule>>
}

export const DEFAULT_SERVICE_RULES: Readonly<Record<string, ServiceRule>> = {
  market: {
    need: 'food',
    resource: 'food',
    amountPerHousehold: 1,
    restoreAmount: 16,
    maxHouseholdsPerTick: 3,
  },
  pharmacy: {
    need: 'health',
    resource: 'medicine',
    amountPerHousehold: 1,
    restoreAmount: 14,
    maxHouseholdsPerTick: 2,
  },
  academy: {
    need: 'education',
    restoreAmount: 10,
    maxHouseholdsPerTick: 4,
  },
  theatre: {
    need: 'entertainment',
    restoreAmount: 12,
    maxHouseholdsPerTick: 4,
  },
}

export class ServiceSystem implements SimulationSystem {
  readonly id = 'economy.service'
  private readonly definitions: Readonly<Record<string, BuildingDefinition>>
  private readonly routePlanner: RoutePlanner
  private readonly rules: Readonly<Record<string, ServiceRule>>

  constructor(options: ServiceSystemOptions) {
    this.definitions = options.definitions
    this.routePlanner = options.routePlanner ?? new RoadRoutePlanner()
    this.rules = options.rules ?? DEFAULT_SERVICE_RULES
  }

  update(snapshot: SimulationSnapshot): SimulationEvent[] {
    const events: SimulationEvent[] = []
    const serviceBuildings = Object.values(snapshot.buildings)
      .filter((building) => this.ruleFor(building))
      .sort((left, right) => left.id.localeCompare(right.id))

    for (const serviceBuilding of serviceBuildings) {
      const rule = this.ruleFor(serviceBuilding)!
      const definition = this.definitions[serviceBuilding.type]
      if (!definition) continue

      const candidates = this.reachableHouseholds(snapshot, serviceBuilding, rule)
      if (serviceBuilding.workers.length === 0) {
        markBlocked(serviceBuilding, 'no-workers')
        continue
      }
      if (rule.resource && inventoryAmount(serviceBuilding, rule.resource) <= 0) {
        markBlocked(serviceBuilding, `missing-service-resource:${rule.resource}`)
        continue
      }
      if (candidates.length === 0) {
        markBlocked(serviceBuilding, 'no-service-demand')
        continue
      }

      let served = 0
      for (const household of candidates) {
        if (served >= rule.maxHouseholdsPerTick) break
        if (rule.resource) {
          const consume = rule.amountPerHousehold ?? 1
          const removed = removeInventory(serviceBuilding, rule.resource, consume)
          if (!removed.ok) break
        }
        household.needs[rule.need] = clamp(
          household.needs[rule.need] + rule.restoreAmount,
          0,
          100,
        )
        served += 1
        events.push({
          type: 'service-delivered',
          buildingId: serviceBuilding.id,
          householdId: household.id,
          need: rule.need,
        })
      }

      if (served > 0) {
        serviceBuilding.status = 'serving'
        delete serviceBuilding.statusReason
      }
    }

    return events
  }

  private ruleFor(building: BuildingEntity): ServiceRule | undefined {
    return this.rules[building.type]
  }

  private reachableHouseholds(
    snapshot: SimulationSnapshot,
    serviceBuilding: BuildingEntity,
    rule: ServiceRule,
  ): HouseholdState[] {
    return Object.values(snapshot.households)
      .filter((household) => household.needs[rule.need] < 92)
      .filter((household) => {
        const home = snapshot.buildings[household.homeBuildingId]
        if (!home) return false
        return Boolean(this.routePlanner.findRoute(
          snapshot.cells,
          serviceBuilding.entrance,
          home.entrance,
        ))
      })
      .sort((left, right) => (
        left.needs[rule.need] - right.needs[rule.need]
        || left.id.localeCompare(right.id)
      ))
  }
}

function markBlocked(building: BuildingEntity, reason: string): void {
  building.status = 'blocked'
  building.statusReason = reason
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
