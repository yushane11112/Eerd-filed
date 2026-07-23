import type { EntityId, GridPoint, LogisticsOrder, SimulationSnapshot } from '../simulation/contracts'
import { activeWorkerCount } from '../simulation/core/workforce'

export type CityNoticeSeverity = 'critical' | 'warning' | 'info'
export type CityNoticeKind = 'resource' | 'workforce' | 'resident' | 'logistics' | 'migration' | 'finance'

export interface CityNotice {
  id: string
  kind: CityNoticeKind
  severity: CityNoticeSeverity
  title: string
  message: string
  tick: number
  priority: number
  target?: CityNoticeTarget
}

export type CityNoticeLifecyclePhase = 'activated' | 'retriggered' | 'resolved' | 'acknowledged'

export interface CityNoticeLifecycleEvent {
  eventId: string
  phase: CityNoticeLifecyclePhase
  noticeId: string
  kind: CityNoticeKind
  severity: CityNoticeSeverity
  tick: number
  target?: CityNoticeTarget
}

export interface CityNoticeAnalyticsStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

const CITY_NOTICE_ANALYTICS_STORAGE_KEY = 'little-ear-island:city-notice-analytics:v1'
const DEFAULT_ANALYTICS_BATCH_SIZE = 50

export interface AmbientCityStory {
  id: string
  title: string
  body: string
  actionLabel: string
  target?: CityNoticeTarget
  resolved?: boolean
}

const MAX_CITY_NOTICES = 4

export type CityNoticeTarget =
  | { kind: 'building'; buildingId: EntityId }
  | { kind: 'point'; point: GridPoint; label: string }

export function deriveCityNotices(snapshot: SimulationSnapshot): CityNotice[] {
  const notices: CityNotice[] = []
  const population = snapshot.metrics.population
  const food = totalFood(snapshot)
  const waitingOrders = Object.values(snapshot.logisticsOrders)
    .filter(isWaitingOrder)
    .length
  const blockedBuildings = Object.values(snapshot.buildings)
    .filter((building) => building.status === 'blocked')
    .length
  const waitingMigrants = Object.values(snapshot.migrationCandidates ?? {})
    .filter((candidate) => candidate.status === 'waiting' || candidate.status === 'walking')
    .sort((left, right) => left.arrivedTick - right.arrivedTick || left.id.localeCompare(right.id))
  const latestFiscalPressure = snapshot.economy.fiscalHistory?.at(-1)?.operationalPressureDelta
  if (latestFiscalPressure && fiscalPressureIncreased(latestFiscalPressure)) {
    const fiscalTarget = fiscalPressureTarget(snapshot)
    const pressureTotal = latestFiscalPressure.blockedBuildingsDelta
      + latestFiscalPressure.logisticsBacklogDelta
      + latestFiscalPressure.inventoryPressureBuildingsDelta
      + latestFiscalPressure.pressuredHouseholdsDelta
    notices.push({
      id: 'fiscal-pressure-rising',
      kind: 'finance',
      severity: pressureTotal >= 4 ? 'critical' : 'warning',
      title: '运营压力在上升',
      message: `最近财政周期比上一周期多出 ${pressureTotal} 项运营压力，优先检查${fiscalTarget ? fiscalTargetLabel(fiscalTarget) : '城市运行状态'}。`,
      tick: snapshot.tick,
      priority: 88,
      ...(fiscalTarget ? { target: fiscalTarget } : {}),
    })
  }

  if (population > 0 && food < Math.max(6, population * 0.35)) {
    notices.push({
      id: 'food-shortage',
      kind: 'resource',
      severity: 'critical',
      title: '粮仓见底',
      message: food <= 0
        ? '岛上几乎没有可用粮食，居民会很快不满。'
        : `粮食只剩约 ${Math.floor(food)} 份，撑不了太久。`,
      tick: snapshot.tick,
      priority: 100,
      target: foodTarget(snapshot),
    })
  }

  const logisticsTarget = waitingLogisticsTarget(snapshot)
  if (
    snapshot.metrics.logisticsEfficiency < 0.55 ||
    waitingOrders >= 3 ||
    blockedBuildings >= 2
  ) {
    notices.push({
      id: 'logistics-blocked',
      kind: 'logistics',
      severity: snapshot.metrics.logisticsEfficiency < 0.4 ? 'critical' : 'warning',
      title: '路上有点堵',
      message: waitingOrders > 0
        ? `${waitingOrders} 笔搬运还在等待，生产材料可能送不到。`
        : '搬运效率偏低，检查道路连接和建筑入口会更直接。',
      tick: snapshot.tick,
      priority: 85,
      target: logisticsTarget,
    })
  }

  const openJobs = snapshot.metrics.availableJobs - snapshot.metrics.employedWorkers
  const workerTarget = workforceTarget(snapshot)
  if (openJobs >= Math.max(3, Math.ceil(snapshot.metrics.availableJobs * 0.3))) {
    notices.push({
      id: 'worker-shortage',
      kind: 'workforce',
      severity: 'warning',
      title: '工坊缺人手',
      message: `还有 ${openJobs} 个岗位没人做，产出会慢下来。`,
      tick: snapshot.tick,
      priority: 70,
      target: workerTarget,
    })
  }

  const residentTarget = residentTargetBuilding(snapshot)
  if (snapshot.metrics.satisfaction < 55) {
    notices.push({
      id: 'resident-unhappy',
      kind: 'resident',
      severity: snapshot.metrics.satisfaction < 40 ? 'critical' : 'warning',
      title: '居民有怨气',
      message: `满意度降到 ${Math.round(snapshot.metrics.satisfaction)}，先补基础需求比扩张更重要。`,
      tick: snapshot.tick,
      priority: 65,
      target: residentTarget,
    })
  }

  if (waitingMigrants.length > 0) {
    const candidate = waitingMigrants[0]
    const waitTicks = Math.max(0, snapshot.tick - candidate.arrivedTick)
    notices.push({
      id: 'migration-waiting',
      kind: 'migration',
      severity: waitTicks >= Math.max(1, candidate.patienceTicks - 1) ? 'warning' : 'info',
      title: candidate.status === 'walking' ? '新住户正在进城' : '有人在城口等房',
      message: candidate.status === 'walking'
        ? `${candidate.members} 位外来人正往住处走，抵达家门后会正式入住。`
        : `${candidate.members} 位外来人正在找住处，空房和城镇吸引力会决定他们是否留下。`,
      tick: snapshot.tick,
      priority: 62,
      target: {
        kind: 'point',
        point: candidate.position,
        label: candidate.status === 'walking' ? '外来人口进城路线' : '外来人口临时停留点',
      },
    })
  }

  return notices
    .sort((left, right) => right.priority - left.priority || left.id.localeCompare(right.id))
    .slice(0, MAX_CITY_NOTICES)
}

export function deriveAmbientCityStories(snapshot: SimulationSnapshot): AmbientCityStory[] {
  return deriveCityNotices(snapshot).map(cityNoticeToStory)
}

export class CityNoticeTracker {
  private activeNoticeIds = new Set<string>()
  private activeNotices = new Map<string, CityNotice>()
  private seenNoticeIds = new Set<string>()
  private acknowledgedNoticeIds = new Set<string>()
  private lifecycleEvents: CityNoticeLifecycleEvent[] = []

  update(snapshot: SimulationSnapshot): CityNotice[] {
    const current = deriveCityNotices(snapshot)
    const currentIds = new Set(current.map((notice) => notice.id))
    const newlyActive = current.filter((notice) => !this.activeNoticeIds.has(notice.id))

    for (const notice of newlyActive) {
      this.lifecycleEvents.push(this.createLifecycleEvent(
        notice,
        this.seenNoticeIds.has(notice.id) ? 'retriggered' : 'activated',
      ))
      this.seenNoticeIds.add(notice.id)
      this.acknowledgedNoticeIds.delete(notice.id)
    }
    for (const noticeId of this.activeNoticeIds) {
      if (currentIds.has(noticeId)) continue
      const previous = this.activeNotices.get(noticeId)
      if (previous) this.lifecycleEvents.push(this.createLifecycleEvent(previous, 'resolved', snapshot.tick))
      this.acknowledgedNoticeIds.delete(noticeId)
    }

    this.activeNoticeIds = currentIds
    this.activeNotices = new Map(current.map((notice) => [notice.id, notice]))
    return newlyActive
  }

  acknowledge(noticeId: string, tick: number): boolean {
    const notice = this.activeNotices.get(noticeId)
    if (!notice || this.acknowledgedNoticeIds.has(noticeId)) return false
    this.acknowledgedNoticeIds.add(noticeId)
    this.lifecycleEvents.push(this.createLifecycleEvent(notice, 'acknowledged', tick))
    return true
  }

  consumeLifecycleEvents(): CityNoticeLifecycleEvent[] {
    const events = this.lifecycleEvents
    this.lifecycleEvents = []
    return events
  }

  clear() {
    this.activeNoticeIds.clear()
    this.activeNotices.clear()
    this.seenNoticeIds.clear()
    this.acknowledgedNoticeIds.clear()
    this.lifecycleEvents = []
  }

  private createLifecycleEvent(
    notice: CityNotice,
    phase: CityNoticeLifecyclePhase,
    tick = notice.tick,
  ): CityNoticeLifecycleEvent {
    return {
      // Stable across reloads: the same notice phase at the same simulation tick
      // must deduplicate even when the runtime instance is recreated.
      eventId: `city-notice:${notice.id}:${phase}:${tick}`,
      phase,
      noticeId: notice.id,
      kind: notice.kind,
      severity: notice.severity,
      tick,
      ...(notice.target ? { target: notice.target } : {}),
    }
  }
}

/**
 * A small durable outbox for product analytics. It deliberately knows nothing
 * about transport; an adapter can peek, send, then acknowledge a batch.
 */
export class CityNoticeAnalyticsQueue {
  private pending = new Map<string, CityNoticeLifecycleEvent>()

  constructor(
    private readonly storage: CityNoticeAnalyticsStorage | undefined = browserCityNoticeAnalyticsStorage(),
    private readonly storageKey = CITY_NOTICE_ANALYTICS_STORAGE_KEY,
  ) {
    this.restore()
  }

  enqueue(events: readonly CityNoticeLifecycleEvent[]): number {
    let added = 0
    for (const event of events) {
      if (this.pending.has(event.eventId)) continue
      this.pending.set(event.eventId, event)
      added += 1
    }
    if (added > 0) this.persist()
    return added
  }

  peek(limit = DEFAULT_ANALYTICS_BATCH_SIZE): CityNoticeLifecycleEvent[] {
    return [...this.pending.values()].slice(0, Math.max(0, limit))
  }

  acknowledge(eventIds: readonly string[]): number {
    let removed = 0
    for (const eventId of eventIds) {
      if (!this.pending.delete(eventId)) continue
      removed += 1
    }
    if (removed > 0) this.persist()
    return removed
  }

  consume(limit = DEFAULT_ANALYTICS_BATCH_SIZE): CityNoticeLifecycleEvent[] {
    const batch = this.peek(limit)
    this.acknowledge(batch.map((event) => event.eventId))
    return batch
  }

  size(): number {
    return this.pending.size
  }

  clear(): void {
    this.pending.clear()
    this.persist()
  }

  private restore() {
    if (!this.storage) return
    try {
      const raw = this.storage.getItem(this.storageKey)
      if (!raw) return
      const parsed: unknown = JSON.parse(raw)
      if (!Array.isArray(parsed)) return
      for (const candidate of parsed) {
        if (!isCityNoticeLifecycleEvent(candidate)) continue
        this.pending.set(candidate.eventId, candidate)
      }
    } catch {
      // A corrupt analytics cache must never prevent the city from booting.
      this.pending.clear()
    }
  }

  private persist() {
    if (!this.storage) return
    try {
      this.storage.setItem(this.storageKey, JSON.stringify([...this.pending.values()]))
    } catch {
      // Storage quota/private mode failures are non-fatal; the in-memory queue remains usable.
    }
  }
}

function browserCityNoticeAnalyticsStorage(): CityNoticeAnalyticsStorage | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

function isCityNoticeLifecycleEvent(value: unknown): value is CityNoticeLifecycleEvent {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<CityNoticeLifecycleEvent>
  return typeof candidate.eventId === 'string'
    && typeof candidate.noticeId === 'string'
    && typeof candidate.kind === 'string'
    && typeof candidate.severity === 'string'
    && typeof candidate.phase === 'string'
    && typeof candidate.tick === 'number'
}

export class AmbientCityStoryTracker {
  private resolvedStoryIds = new Set<string>()

  update(snapshot: SimulationSnapshot): AmbientCityStory[] {
    const stories = deriveAmbientCityStories(snapshot)
    const activeStoryIds = new Set(stories.map((story) => story.id))
    for (const storyId of this.resolvedStoryIds) {
      if (!activeStoryIds.has(storyId)) this.resolvedStoryIds.delete(storyId)
    }
    return stories.filter((story) => !this.resolvedStoryIds.has(story.id))
  }

  resolve(storyId: string) {
    this.resolvedStoryIds.add(storyId)
  }

  clear() {
    this.resolvedStoryIds.clear()
  }
}

function cityNoticeToStory(notice: CityNotice): AmbientCityStory {
  return {
    id: `story-${notice.id}`,
    title: notice.title,
    body: notice.message,
    actionLabel: notice.target ? '看一眼' : '知道了',
    target: notice.target,
    resolved: false,
  }
}

function totalFood(snapshot: SimulationSnapshot) {
  const storedFood = Object.values(snapshot.buildings)
    .reduce((sum, building) => sum + (building.inventory.food ?? 0), 0)
  const droppedFood = snapshot.worldDrops
    .filter((drop) => drop.resource === 'food')
    .reduce((sum, drop) => sum + drop.amount, 0)
  return storedFood + droppedFood
}

function isWaitingOrder(order: LogisticsOrder) {
  return order.state === 'waiting' || order.state === 'assigned'
}

function foodTarget(snapshot: SimulationSnapshot): CityNoticeTarget | undefined {
  const stockedFoodBuilding = Object.values(snapshot.buildings)
    .filter((building) => (building.inventory.food ?? 0) > 0)
    .sort((left, right) => (right.inventory.food ?? 0) - (left.inventory.food ?? 0))[0]
  if (stockedFoodBuilding) return { kind: 'building', buildingId: stockedFoodBuilding.id }

  const foodProducer = Object.values(snapshot.buildings)
    .find((building) => building.type === 'riceField' || building.type === 'market' || building.type === 'granary')
  if (foodProducer) return { kind: 'building', buildingId: foodProducer.id }

  const droppedFood = snapshot.worldDrops.find((drop) => drop.resource === 'food')
  if (droppedFood) return { kind: 'point', point: droppedFood.position, label: '散落粮食' }
  return undefined
}

function waitingLogisticsTarget(snapshot: SimulationSnapshot): CityNoticeTarget | undefined {
  const waitingOrder = Object.values(snapshot.logisticsOrders)
    .filter(isWaitingOrder)
    .sort((left, right) => right.priority - left.priority || left.id.localeCompare(right.id))[0]
  if (waitingOrder?.destinationBuildingId && snapshot.buildings[waitingOrder.destinationBuildingId]) {
    return { kind: 'building', buildingId: waitingOrder.destinationBuildingId }
  }
  if (waitingOrder?.sourceBuildingId && snapshot.buildings[waitingOrder.sourceBuildingId]) {
    return { kind: 'building', buildingId: waitingOrder.sourceBuildingId }
  }

  const blockedBuilding = Object.values(snapshot.buildings)
    .find((building) => building.status === 'blocked')
  if (blockedBuilding) return { kind: 'building', buildingId: blockedBuilding.id }
  return undefined
}

function fiscalPressureIncreased(delta: {
  blockedBuildingsDelta: number
  logisticsBacklogDelta: number
  inventoryPressureBuildingsDelta: number
  pressuredHouseholdsDelta: number
}) {
  return delta.blockedBuildingsDelta > 0
    || delta.logisticsBacklogDelta > 0
    || delta.inventoryPressureBuildingsDelta > 0
    || delta.pressuredHouseholdsDelta > 0
}

function fiscalPressureTarget(snapshot: SimulationSnapshot): CityNoticeTarget | undefined {
  const blocked = Object.values(snapshot.buildings)
    .filter((building) => building.status === 'blocked')
    .sort((left, right) => left.id.localeCompare(right.id))[0]
  if (blocked) return { kind: 'building', buildingId: blocked.id }
  const logistics = waitingLogisticsTarget(snapshot)
  if (logistics) return logistics
  return residentTargetBuilding(snapshot)
}

function fiscalTargetLabel(target: CityNoticeTarget): string {
  return target.kind === 'point' ? target.label : '对应运行建筑'
}

function workforceTarget(snapshot: SimulationSnapshot): CityNoticeTarget | undefined {
  const understaffed = Object.values(snapshot.buildings)
    .filter((building) => {
      const jobs = buildingJobCapacity(snapshot, building.type)
      return jobs > 0 && activeWorkerCount(snapshot, building) < jobs
    })
    .sort((left, right) => {
      const leftMissing = buildingJobCapacity(snapshot, left.type) - activeWorkerCount(snapshot, left)
      const rightMissing = buildingJobCapacity(snapshot, right.type) - activeWorkerCount(snapshot, right)
      return rightMissing - leftMissing || left.id.localeCompare(right.id)
    })[0]
  if (understaffed) return { kind: 'building', buildingId: understaffed.id }

  const home = Object.values(snapshot.buildings).find((building) => building.type === 'house')
  return home ? { kind: 'building', buildingId: home.id } : undefined
}

function residentTargetBuilding(snapshot: SimulationSnapshot): CityNoticeTarget | undefined {
  const lowestSatisfactionHomeId = Object.values(snapshot.households)
    .filter((household) => snapshot.buildings[household.homeBuildingId])
    .sort((left, right) => left.satisfaction - right.satisfaction || left.id.localeCompare(right.id))[0]
    ?.homeBuildingId
  if (lowestSatisfactionHomeId) return { kind: 'building', buildingId: lowestSatisfactionHomeId }

  const home = Object.values(snapshot.buildings).find((building) => building.type === 'house')
  return home ? { kind: 'building', buildingId: home.id } : undefined
}

function buildingJobCapacity(snapshot: SimulationSnapshot, type: string) {
  const typedSnapshot = snapshot as SimulationSnapshot & {
    buildingDefinitions?: Record<string, { jobs?: number }>
  }
  return typedSnapshot.buildingDefinitions?.[type]?.jobs ?? defaultJobsByType(type)
}

function defaultJobsByType(type: string) {
  return ({
    house: 0,
    granary: 2,
    riceField: 3,
    woodshop: 3,
    market: 4,
  } as Record<string, number>)[type] ?? 0
}
