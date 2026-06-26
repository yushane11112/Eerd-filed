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
  saleValuePerHousehold?: number
  restoreAmount: number
  maxHouseholdsPerTick: number
  unmetNeedPenalty?: number
  unmetSatisfactionPenalty?: number
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
    saleValuePerHousehold: 5,
    restoreAmount: 16,
    maxHouseholdsPerTick: 3,
    unmetNeedPenalty: 4,
    unmetSatisfactionPenalty: 2,
  },
  pharmacy: {
    need: 'health',
    resource: 'medicine',
    amountPerHousehold: 1,
    restoreAmount: 14,
    maxHouseholdsPerTick: 2,
    unmetNeedPenalty: 3,
    unmetSatisfactionPenalty: 1.5,
  },
  academy: {
    need: 'education',
    restoreAmount: 10,
    maxHouseholdsPerTick: 4,
    unmetNeedPenalty: 2,
    unmetSatisfactionPenalty: 1,
  },
  theatre: {
    need: 'entertainment',
    restoreAmount: 12,
    maxHouseholdsPerTick: 4,
    unmetNeedPenalty: 2,
    unmetSatisfactionPenalty: 1,
  },
}

const DEFAULT_MARKET_GOODS_RULE: ServiceRule = {
  need: 'goods',
  // Cloth represents everyday household goods in the current ResourceKind set.
  resource: 'cloth',
  amountPerHousehold: 1,
  saleValuePerHousehold: 3,
  restoreAmount: 12,
  maxHouseholdsPerTick: 3,
  unmetNeedPenalty: 3,
  unmetSatisfactionPenalty: 1.5,
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
    const servedNeeds = new Set<string>()
    const unmetNeeds = new Map<string, {
      household: HouseholdState
      rule: ServiceRule
    }>()
    const serviceBuildings = Object.values(snapshot.buildings)
      .filter((building) => this.rulesFor(building).length > 0)
      .sort((left, right) => left.id.localeCompare(right.id))

    for (const serviceBuilding of serviceBuildings) {
      const definition = this.definitions[serviceBuilding.type]
      if (!definition) continue

      for (const rule of this.rulesFor(serviceBuilding)) {
        const demandingHouseholds = this.demandingHouseholds(snapshot, rule)
        const candidates = this.reachableHouseholds(snapshot, serviceBuilding, rule)
        if (serviceBuilding.workers.length === 0) {
          markBlocked(serviceBuilding, 'no-workers')
          this.markUnmet(unmetNeeds, candidates, rule)
          continue
        }
        if (candidates.length === 0) {
          if (demandingHouseholds.length === 0) continue
          markBlocked(serviceBuilding, 'no-service-route')
          if (demandingHouseholds.length > 0) {
            this.markUnmet(unmetNeeds, demandingHouseholds, rule)
          }
          continue
        }
        const consume = rule.amountPerHousehold ?? 1
        if (rule.resource && inventoryAmount(serviceBuilding, rule.resource) < consume) {
          markBlocked(serviceBuilding, `missing-service-resource:${rule.resource}`)
          this.markUnmet(unmetNeeds, candidates, rule)
          continue
        }
        const saleValue = definition.category === 'market'
          ? (rule.saleValuePerHousehold ?? 0)
          : 0
        const affordableCandidates = saleValue > 0
          ? candidates.filter((household) => household.income >= saleValue)
          : candidates
        if (definition.category === 'market' && affordableCandidates.length === 0) {
          markBlocked(
            serviceBuilding,
            `insufficient-household-income:${rule.resource ?? rule.need}`,
          )
          this.markUnmet(unmetNeeds, candidates, rule)
          continue
        }

        let served = 0
        const servedHouseholdIds = new Set<string>()
        for (const household of affordableCandidates) {
          if (served >= rule.maxHouseholdsPerTick) break
          if (rule.resource) {
            const removed = removeInventory(serviceBuilding, rule.resource, consume)
            if (!removed.ok) break
            if (definition.category === 'market') {
              const taxPaid = roundCurrency(saleValue * snapshot.economy.taxRate)
              household.income = Math.max(0, household.income - saleValue)
              snapshot.economy.treasury += taxPaid
              snapshot.economy.lastTaxIncome += taxPaid
              events.push({
                type: 'purchase-completed',
                buildingId: serviceBuilding.id,
                householdId: household.id,
                resource: rule.resource,
                amount: consume,
                taxPaid,
              })
            }
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
          servedNeeds.add(needKey(household.id, rule.need))
          servedHouseholdIds.add(household.id)
        }

        if (served > 0) {
          serviceBuilding.status = 'serving'
          delete serviceBuilding.statusReason
        }
        if (served < candidates.length) {
          this.markUnmet(
            unmetNeeds,
            candidates.filter((household) => !servedHouseholdIds.has(household.id)),
            rule,
          )
        }
      }
    }

    this.applyUnmetNeedPressure(unmetNeeds, servedNeeds)
    return events
  }

  private rulesFor(building: BuildingEntity): readonly ServiceRule[] {
    const rule = this.rules[building.type]
    if (!rule) return []
    if (building.type !== 'market' || rule.need === 'goods') return [rule]
    return [rule, DEFAULT_MARKET_GOODS_RULE]
  }

  private reachableHouseholds(
    snapshot: SimulationSnapshot,
    serviceBuilding: BuildingEntity,
    rule: ServiceRule,
  ): HouseholdState[] {
    return this.demandingHouseholds(snapshot, rule)
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

  private demandingHouseholds(
    snapshot: SimulationSnapshot,
    rule: ServiceRule,
  ): HouseholdState[] {
    return Object.values(snapshot.households)
      .filter((household) => household.needs[rule.need] < 92)
      .sort((left, right) => (
        left.needs[rule.need] - right.needs[rule.need]
        || left.id.localeCompare(right.id)
      ))
  }

  private markUnmet(
    unmetNeeds: Map<string, {
      household: HouseholdState
      rule: ServiceRule
    }>,
    households: readonly HouseholdState[],
    rule: ServiceRule,
  ): void {
    for (const household of households) {
      unmetNeeds.set(needKey(household.id, rule.need), { household, rule })
    }
  }

  private applyUnmetNeedPressure(
    unmetNeeds: ReadonlyMap<string, {
      household: HouseholdState
      rule: ServiceRule
    }>,
    servedNeeds: ReadonlySet<string>,
  ): void {
    for (const [key, { household, rule }] of unmetNeeds) {
      if (servedNeeds.has(key)) continue
      household.needs[rule.need] = clamp(
        household.needs[rule.need] - (rule.unmetNeedPenalty ?? 1),
        0,
        100,
      )
      household.satisfaction = clamp(
        household.satisfaction - (rule.unmetSatisfactionPenalty ?? 0),
        0,
        100,
      )
    }
  }
}

function markBlocked(building: BuildingEntity, reason: string): void {
  building.status = 'blocked'
  building.statusReason = reason
}

function needKey(householdId: string, need: NeedKind): string {
  return `${householdId}:${need}`
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100
}
