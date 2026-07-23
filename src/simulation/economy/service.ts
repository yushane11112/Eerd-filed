import type {
  AgentEntity,
  BuildingDefinition,
  BuildingEntity,
  GridPoint,
  HouseholdState,
  HouseholdNeedPressureCause,
  ResourceKind,
  SimulationEvent,
  SimulationSnapshot,
  SimulationSystem,
} from '../contracts'
import { inventoryAmount, removeInventory } from './inventory'
import { RoadRoutePlanner, type RoutePlanner } from './logistics'
import { activeWorkerCount } from '../core/workforce'

type NeedKind = keyof HouseholdState['needs']

export interface ServiceRule {
  need: NeedKind
  resource?: ResourceKind
  amountPerHousehold?: number
  saleValuePerHousehold?: number
  restoreAmount: number
  maxHouseholdsPerTick: number
  maxConcurrentVisits?: number
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

const MAX_TRACKED_QUEUE_ENTRIES = 12

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
    events.push(...this.advanceServiceVisits(snapshot))
    const activeVisits = indexActiveServiceVisits(snapshot)
    snapshot.serviceQueues ??= {}
    const touchedQueues = new Set<string>()
    const servedNeeds = new Set<string>()
    const unmetNeeds = new Map<string, {
      household: HouseholdState
      rule: ServiceRule
      cause: HouseholdNeedPressureCause
      buildingId: string
    }>()
    const serviceBuildings = Object.values(snapshot.buildings)
      .filter((building) => this.rulesFor(building).length > 0)
      .sort((left, right) => left.id.localeCompare(right.id))

    for (const serviceBuilding of serviceBuildings) {
      const definition = this.definitions[serviceBuilding.type]
      if (!definition) continue

      for (const rule of this.rulesFor(serviceBuilding)) {
        const queueId = serviceQueueId(serviceBuilding.id, rule.need)
        const previousStatus = serviceBuilding.status
        const previousStatusReason = serviceBuilding.statusReason
        touchedQueues.add(queueId)
        const demandingHouseholds = this.demandingHouseholds(snapshot, rule)
        const candidates = this.reachableHouseholds(snapshot, serviceBuilding, rule)
        if (activeWorkerCount(snapshot, serviceBuilding) === 0) {
          markBlocked(serviceBuilding, 'no-workers', snapshot.tick)
          this.recordServiceQueue(snapshot, serviceBuilding, rule, {
            servedThisTick: 0,
            rejectedThisTick: candidates.length,
            waiting: [],
          })
          this.markUnmet(unmetNeeds, candidates, rule, 'no-workers', serviceBuilding.id)
          continue
        }
        if (candidates.length === 0) {
          if (demandingHouseholds.length === 0) continue
          markBlocked(serviceBuilding, 'no-service-route', snapshot.tick)
          this.recordServiceQueue(snapshot, serviceBuilding, rule, {
            servedThisTick: 0,
            rejectedThisTick: demandingHouseholds.length,
            waiting: [],
          })
          if (demandingHouseholds.length > 0) {
            this.markUnmet(unmetNeeds, demandingHouseholds, rule, 'no-route', serviceBuilding.id)
          }
          continue
        }
        const consume = rule.amountPerHousehold ?? 1
        if (rule.resource && inventoryAmount(serviceBuilding, rule.resource) < consume) {
          markBlocked(serviceBuilding, `missing-service-resource:${rule.resource}`, snapshot.tick)
          this.recordServiceQueue(snapshot, serviceBuilding, rule, {
            servedThisTick: 0,
            rejectedThisTick: candidates.length,
            waiting: [],
          })
          this.markUnmet(unmetNeeds, candidates, rule, 'missing-resource', serviceBuilding.id)
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
            snapshot.tick,
          )
          this.recordServiceQueue(snapshot, serviceBuilding, rule, {
            servedThisTick: 0,
            rejectedThisTick: candidates.length,
            waiting: [],
          })
          this.markUnmet(unmetNeeds, candidates, rule, 'unaffordable', serviceBuilding.id)
          continue
        }

        let served = 0
        const servedHouseholdIds = new Set<string>()
        const activeVisitCount = activeVisits.counts.get(serviceQueueId(serviceBuilding.id, rule.need)) ?? 0
        const capacityPerTick = serviceCapacityPerTick(rule, serviceBuilding.level)
        const maxConcurrentVisits = rule.maxConcurrentVisits ?? capacityPerTick * 2
        const remainingConcurrentSlots = Math.max(0, maxConcurrentVisits - activeVisitCount)
        const dispatchCapacity = Math.min(capacityPerTick, remainingConcurrentSlots)
        const queueCandidates = affordableCandidates.filter((household) => (
          !activeVisits.keys.has(activeServiceVisitKey(serviceBuilding.id, household.id, rule.need))
        ))
        for (const household of affordableCandidates) {
          const visitKey = activeServiceVisitKey(serviceBuilding.id, household.id, rule.need)
          if (activeVisits.keys.has(visitKey)) {
            continue
          }
          if (served >= dispatchCapacity) break
          const didSpawn = this.spawnServiceVisit(snapshot, serviceBuilding, household, rule, activeVisits, {
            amount: consume,
            saleValue,
          })
          if (!didSpawn) continue
          served += 1
          servedNeeds.add(needKey(household.id, rule.need))
          servedHouseholdIds.add(household.id)
        }

        if (served > 0) {
          serviceBuilding.status = 'serving'
          delete serviceBuilding.statusReason
          delete serviceBuilding.blockedSinceTick
          delete serviceBuilding.blockedAuditBaseline
          const pressuredHouseholds = candidates.filter((household) => (
            servedHouseholdIds.has(household.id) && Boolean(household.needPressure?.[rule.need])
          ))
          if (previousStatusReason || pressuredHouseholds.length > 0) {
            events.push({
              type: 'service-bottleneck-cleared',
              buildingId: serviceBuilding.id,
              need: rule.need,
              ...(previousStatusReason ? { previousCause: serviceCauseFromStatus(previousStatusReason) } : {}),
              pressureClearedHouseholds: pressuredHouseholds.length,
              maxPressureTicks: Math.max(0, ...pressuredHouseholds.map((household) => household.needPressure?.[rule.need]?.ticks ?? 0)),
              buildingStatusBefore: previousStatus,
              buildingStatusAfter: serviceBuilding.status,
            })
          }
        }
        if (served < candidates.length) {
          this.markUnmet(
            unmetNeeds,
            candidates.filter((household) => (
              !servedHouseholdIds.has(household.id)
              && !activeVisits.keys.has(activeServiceVisitKey(serviceBuilding.id, household.id, rule.need))
            )),
            rule,
            'capacity',
            serviceBuilding.id,
          )
        }
        this.recordServiceQueue(snapshot, serviceBuilding, rule, {
          servedThisTick: served,
          rejectedThisTick: Math.max(0, candidates.length - affordableCandidates.length),
          waiting: queueCandidates.filter((household) => !servedHouseholdIds.has(household.id)),
        })
      }
    }

    for (const queueId of Object.keys(snapshot.serviceQueues)) {
      if (!touchedQueues.has(queueId)) delete snapshot.serviceQueues[queueId]
    }
    this.applyUnmetNeedPressure(snapshot, unmetNeeds, servedNeeds)
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
      cause: HouseholdNeedPressureCause
      buildingId: string
    }>,
    households: readonly HouseholdState[],
    rule: ServiceRule,
    cause: HouseholdNeedPressureCause,
    buildingId: string,
  ): void {
    for (const household of households) {
      unmetNeeds.set(needKey(household.id, rule.need), { household, rule, cause, buildingId })
    }
  }

  private applyUnmetNeedPressure(
    snapshot: SimulationSnapshot,
    unmetNeeds: ReadonlyMap<string, {
      household: HouseholdState
      rule: ServiceRule
      cause: HouseholdNeedPressureCause
      buildingId: string
    }>,
    servedNeeds: ReadonlySet<string>,
  ): void {
    for (const [key, { household, rule, cause, buildingId }] of unmetNeeds) {
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
      household.needPressure ??= {}
      const previous = household.needPressure[rule.need]
      household.needPressure[rule.need] = {
        ticks: Math.min(10_000, (previous?.ticks ?? 0) + 1),
        cause,
        buildingId,
      }
    }
    for (const key of servedNeeds) {
      const [householdId, need] = key.split(':') as [string, NeedKind]
      const household = snapshot.households[householdId]
      if (household?.needPressure?.[need]) {
        delete household.needPressure[need]
      }
    }
  }

  private spawnServiceVisit(
    snapshot: SimulationSnapshot,
    serviceBuilding: BuildingEntity,
    household: HouseholdState,
    rule: ServiceRule,
    activeVisits: ActiveServiceVisitIndex,
    transaction: {
      amount: number
      saleValue: number
    },
  ): boolean {
    const home = snapshot.buildings[household.homeBuildingId]
    if (!home) return false
    const visitKey = activeServiceVisitKey(serviceBuilding.id, household.id, rule.need)
    if (activeVisits.keys.has(visitKey)) return false
    const path = this.routePlanner.findRoute(
      snapshot.cells,
      home.entrance,
      serviceBuilding.entrance,
    ) ?? directPath(home.entrance, serviceBuilding.entrance)
    const id = `service-visit:${snapshot.tick}:${serviceBuilding.id}:${household.id}:${rule.need}`
    if (snapshot.agents[id]) return false
    snapshot.agents[id] = {
      id,
      role: 'resident',
      householdId: household.id,
      position: { ...(path[0] ?? home.entrance) },
      path,
      pathIndex: 0,
      activity: serviceActivity(rule),
      activityStartedTick: snapshot.tick,
      serviceIntent: {
        buildingId: serviceBuilding.id,
        need: rule.need,
        resource: rule.resource,
        amount: transaction.amount,
        saleValue: transaction.saleValue,
        restoreAmount: rule.restoreAmount,
      },
    }
    activeVisits.keys.add(visitKey)
    const queueId = serviceQueueId(serviceBuilding.id, rule.need)
    activeVisits.counts.set(queueId, (activeVisits.counts.get(queueId) ?? 0) + 1)
    return true
  }

  private recordServiceQueue(
    snapshot: SimulationSnapshot,
    serviceBuilding: BuildingEntity,
    rule: ServiceRule,
    state: {
      servedThisTick: number
      rejectedThisTick: number
      waiting: readonly HouseholdState[]
    },
  ): void {
    snapshot.serviceQueues ??= {}
    const id = serviceQueueId(serviceBuilding.id, rule.need)
    const previousEntries = new Map(
      snapshot.serviceQueues[id]?.waiting.map((entry) => [
        entry.householdId,
        entry.queuedSinceTick,
      ]) ?? [],
    )
    const trackedWaiting = state.waiting.slice(0, MAX_TRACKED_QUEUE_ENTRIES)
    const waiting = trackedWaiting.map((household) => {
      const queuedSinceTick = previousEntries.get(household.id) ?? snapshot.tick
      return {
        householdId: household.id,
        queuedSinceTick,
        waitTicks: Math.max(0, snapshot.tick - queuedSinceTick),
      }
    })
    const longestWaitTicks = state.waiting.reduce((max, household) => {
      const queuedSinceTick = previousEntries.get(household.id) ?? snapshot.tick
      return Math.max(max, Math.max(0, snapshot.tick - queuedSinceTick))
    }, 0)
    snapshot.serviceQueues[id] = {
      buildingId: serviceBuilding.id,
      need: rule.need,
      capacityPerTick: serviceCapacityPerTick(rule, serviceBuilding.level),
      servedThisTick: state.servedThisTick,
      rejectedThisTick: state.rejectedThisTick,
      waitingCount: state.waiting.length,
      longestWaitTicks,
      waiting,
    }
  }

  private advanceServiceVisits(snapshot: SimulationSnapshot): SimulationEvent[] {
    const events: SimulationEvent[] = []
    for (const agent of Object.values(snapshot.agents).sort((left, right) => (
      left.id.localeCompare(right.id)
    ))) {
      if (agent.role !== 'resident') continue
      if (!agent.id.startsWith('service-visit:')) continue
      if (agent.path.length === 0) continue
      const nextIndex = Math.min(agent.pathIndex + 1, agent.path.length - 1)
      agent.pathIndex = nextIndex
      agent.position = { ...agent.path[nextIndex] }
      if (nextIndex < agent.path.length - 1) continue
      if (agent.activity === 'returning') {
        delete snapshot.agents[agent.id]
        continue
      }
      events.push(...this.completeServiceVisit(snapshot, agent))
      agent.activity = 'returning'
      agent.path = [...agent.path].reverse().map((point) => ({ ...point }))
      agent.pathIndex = 0
      agent.activityStartedTick = snapshot.tick
    }
    return events
  }

  private completeServiceVisit(
    snapshot: SimulationSnapshot,
    agent: AgentEntity,
  ): SimulationEvent[] {
    const intent = agent.serviceIntent
    if (!intent || intent.completed || !agent.householdId) return []
    const household = snapshot.households[agent.householdId]
    const serviceBuilding = snapshot.buildings[intent.buildingId]
    if (!household || !serviceBuilding) return []

    const events: SimulationEvent[] = []
    if (intent.resource) {
      const removed = removeInventory(serviceBuilding, intent.resource, intent.amount)
      if (!removed.ok) {
        markBlocked(serviceBuilding, `missing-service-resource:${intent.resource}`, snapshot.tick)
        return []
      }
      if (intent.saleValue > 0) {
        const taxPaid = roundCurrency(intent.saleValue * snapshot.economy.taxRate)
        household.income = Math.max(0, household.income - intent.saleValue)
        snapshot.economy.treasury += taxPaid
        snapshot.economy.lastTaxIncome += taxPaid
        events.push({
          type: 'purchase-completed',
          buildingId: serviceBuilding.id,
          householdId: household.id,
          resource: intent.resource,
          amount: intent.amount,
          taxPaid,
        })
      }
    }
    const needBefore = household.needs[intent.need]
    household.needs[intent.need] = clamp(
      household.needs[intent.need] + intent.restoreAmount,
      0,
      100,
    )
    const needAfter = household.needs[intent.need]
    serviceBuilding.status = 'serving'
    delete serviceBuilding.statusReason
    delete serviceBuilding.blockedSinceTick
    delete serviceBuilding.blockedAuditBaseline
    intent.completed = true
    events.push({
      type: 'service-delivered',
      buildingId: serviceBuilding.id,
      householdId: household.id,
      need: intent.need,
      needBefore,
      needAfter,
    })
    return events
  }
}

function markBlocked(building: BuildingEntity, reason: string, tick: number): void {
  if (building.status !== 'blocked' || building.statusReason !== reason) {
    building.blockedSinceTick = tick
  }
  building.status = 'blocked'
  building.statusReason = reason
}

function serviceCauseFromStatus(reason: string): HouseholdNeedPressureCause | undefined {
  if (reason === 'no-workers') return 'no-workers'
  if (reason === 'no-service-route') return 'no-route'
  if (reason.startsWith('missing-service-resource:')) return 'missing-resource'
  if (reason.startsWith('insufficient-household-income:')) return 'unaffordable'
  return undefined
}

function needKey(householdId: string, need: NeedKind): string {
  return `${householdId}:${need}`
}

function serviceQueueId(buildingId: string, need: NeedKind): string {
  return `${buildingId}:${need}`
}

export function serviceCapacityPerTick(rule: ServiceRule, level: number): number {
  const normalizedLevel = Math.max(1, Math.floor(level))
  return rule.maxHouseholdsPerTick + Math.floor(Math.max(0, normalizedLevel - 1) / 2)
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100
}

function serviceActivity(rule: ServiceRule): 'shopping' | 'serving' {
  return rule.resource ? 'shopping' : 'serving'
}

function directPath(from: GridPoint, to: GridPoint): GridPoint[] {
  return [{ ...from }, { ...to }]
}

interface ActiveServiceVisitIndex {
  keys: Set<string>
  counts: Map<string, number>
}

function indexActiveServiceVisits(snapshot: SimulationSnapshot): ActiveServiceVisitIndex {
  const keys = new Set<string>()
  const counts = new Map<string, number>()
  for (const agent of Object.values(snapshot.agents)) {
    if (!agent.id.startsWith('service-visit:')) continue
    const intent = agent.serviceIntent
    if (!intent || !agent.householdId) continue
    const key = activeServiceVisitKey(intent.buildingId, agent.householdId, intent.need)
    const queueId = serviceQueueId(intent.buildingId, intent.need)
    keys.add(key)
    counts.set(queueId, (counts.get(queueId) ?? 0) + 1)
  }
  return { keys, counts }
}

function activeServiceVisitKey(
  buildingId: string,
  householdId: string,
  need: NeedKind,
): string {
  return `${buildingId}:${householdId}:${need}`
}
