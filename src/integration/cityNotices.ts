import type { EntityId, GridPoint, LogisticsOrder, SimulationSnapshot } from '../simulation/contracts'

export type CityNoticeSeverity = 'critical' | 'warning' | 'info'
export type CityNoticeKind = 'resource' | 'workforce' | 'resident' | 'logistics'

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

  return notices
    .sort((left, right) => right.priority - left.priority || left.id.localeCompare(right.id))
    .slice(0, MAX_CITY_NOTICES)
}

export class CityNoticeTracker {
  private activeNoticeIds = new Set<string>()

  update(snapshot: SimulationSnapshot): CityNotice[] {
    const current = deriveCityNotices(snapshot)
    const currentIds = new Set(current.map((notice) => notice.id))
    const newlyActive = current.filter((notice) => !this.activeNoticeIds.has(notice.id))
    this.activeNoticeIds = currentIds
    return newlyActive
  }

  clear() {
    this.activeNoticeIds.clear()
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

function workforceTarget(snapshot: SimulationSnapshot): CityNoticeTarget | undefined {
  const understaffed = Object.values(snapshot.buildings)
    .filter((building) => {
      const jobs = buildingJobCapacity(snapshot, building.type)
      return jobs > 0 && building.workers.length < jobs
    })
    .sort((left, right) => {
      const leftMissing = buildingJobCapacity(snapshot, left.type) - left.workers.length
      const rightMissing = buildingJobCapacity(snapshot, right.type) - right.workers.length
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
