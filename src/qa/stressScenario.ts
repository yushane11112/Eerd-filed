import type {
  AgentEntity,
  BuildingDefinition,
  BuildingEntity,
  HouseholdState,
  LogisticsOrder,
  ResourceKind,
  SimulationSnapshot,
  WorldCell,
} from '../simulation/contracts'
import type { ServiceRule } from '../simulation/economy/service'
import { inventoryTotal } from '../simulation/economy/inventory'

export interface StressScenarioSize {
  households: number
  buildings: number
  visibleAgents: number
  width: number
  height: number
}

export const TARGET_STRESS_SIZE: StressScenarioSize = {
  households: 500,
  buildings: 300,
  visibleAgents: 150,
  width: 80,
  height: 60,
}

export const LONG_RUN_TICKS = 2_400

export const CIVILIZATION_LONG_RUN_THRESHOLDS = {
  minPopulation: 1_200,
  maxPopulation: 2_000,
  minAverageSatisfaction: 8,
  minLogisticsEfficiency: 45,
  maxBlockedBuildings: 260,
  maxActiveOrders: 240,
  maxHistoricalOrders: 20_000,
  maxBuildingInventory: 1_500,
} as const

export const stressScenarioDefinitions: Record<string, BuildingDefinition> = {
  'main-homes': {
    type: 'main-homes',
    name: '压力民居',
    category: 'housing',
    footprint: [{ x: 0, y: 0 }],
    entrance: { x: 0, y: 1 },
    maxLevel: 8,
    jobs: 0,
    capacity: 45,
  },
  'windfield-rice': {
    type: 'windfield-rice',
    name: '压力稻田',
    category: 'production',
    footprint: [{ x: 0, y: 0 }],
    entrance: { x: 0, y: 1 },
    maxLevel: 8,
    jobs: 0,
    capacity: 500,
    production: {
      durationTicks: 12,
      inputs: {},
      outputs: { food: 24 },
    },
  },
  'main-granary': {
    type: 'main-granary',
    name: '压力仓廪',
    category: 'storage',
    footprint: [{ x: 0, y: 0 }],
    entrance: { x: 0, y: 1 },
    maxLevel: 8,
    jobs: 1,
    capacity: 500,
  },
  'main-eatery': {
    type: 'main-eatery',
    name: '压力食肆',
    category: 'market',
    footprint: [{ x: 0, y: 0 }],
    entrance: { x: 0, y: 1 },
    maxLevel: 8,
    jobs: 1,
    capacity: 120,
  },
  'main-clinic': {
    type: 'main-clinic',
    name: '压力医馆',
    category: 'service',
    footprint: [{ x: 0, y: 0 }],
    entrance: { x: 0, y: 1 },
    maxLevel: 8,
    jobs: 1,
    capacity: 80,
  },
  'main-school': {
    type: 'main-school',
    name: '压力书院',
    category: 'service',
    footprint: [{ x: 0, y: 0 }],
    entrance: { x: 0, y: 1 },
    maxLevel: 8,
    jobs: 1,
    capacity: 80,
  },
  'main-theatre': {
    type: 'main-theatre',
    name: '压力戏台',
    category: 'service',
    footprint: [{ x: 0, y: 0 }],
    entrance: { x: 0, y: 1 },
    maxLevel: 8,
    jobs: 1,
    capacity: 80,
  },
}

export const stressScenarioServiceRules: Record<string, ServiceRule> = {
  'main-eatery': {
    need: 'food',
    resource: 'food',
    amountPerHousehold: 1,
    restoreAmount: 24,
    maxHouseholdsPerTick: 4,
    unmetNeedPenalty: 1,
    unmetSatisfactionPenalty: 0.25,
  },
  'main-granary': {
    need: 'goods',
    restoreAmount: 10,
    maxHouseholdsPerTick: 3,
    unmetNeedPenalty: 0.5,
    unmetSatisfactionPenalty: 0.1,
  },
  'main-clinic': {
    need: 'health',
    restoreAmount: 10,
    maxHouseholdsPerTick: 3,
    unmetNeedPenalty: 0.5,
    unmetSatisfactionPenalty: 0.1,
  },
  'main-school': {
    need: 'education',
    restoreAmount: 10,
    maxHouseholdsPerTick: 3,
    unmetNeedPenalty: 0.5,
    unmetSatisfactionPenalty: 0.1,
  },
  'main-theatre': {
    need: 'entertainment',
    restoreAmount: 10,
    maxHouseholdsPerTick: 3,
    unmetNeedPenalty: 0.5,
    unmetSatisfactionPenalty: 0.1,
  },
}

const STRESS_BUILDING_TYPES = Object.keys(stressScenarioDefinitions)

export function createStressScenario(
  size: StressScenarioSize = TARGET_STRESS_SIZE,
): SimulationSnapshot {
  const cells: WorldCell[] = []
  for (let y = 0; y < size.height; y += 1) {
    for (let x = 0; x < size.width; x += 1) {
      cells.push({
        point: { x, y },
        terrain: y > size.height - 8 ? 'water' : y === size.height - 8 ? 'shore' : 'land',
        elevation: 0,
        road: x % 6 === 0 || y % 6 === 0 ? 'stone' : undefined,
      })
    }
  }

  const buildings: Record<string, BuildingEntity> = {}
  for (let index = 0; index < size.buildings; index += 1) {
    const id = `stress-building-${index}`
    const type = STRESS_BUILDING_TYPES[index % STRESS_BUILDING_TYPES.length]
    buildings[id] = {
      id,
      type,
      origin: { x: 2 + (index * 3) % (size.width - 4), y: 2 + Math.floor(index / 24) * 3 },
      rotation: 0,
      level: 1 + index % 8,
      entrance: { x: 2 + (index * 3) % (size.width - 4), y: 3 + Math.floor(index / 24) * 3 },
      status: 'working',
      workers: [],
      inventory: initialInventory(type, index),
      productionProgress: index % 100,
    }
  }

  const buildingIds = Object.keys(buildings)
  const homeBuildingIds = buildingIds.filter((id) => buildings[id].type === 'main-homes')
  const households: Record<string, HouseholdState> = {}
  for (let index = 0; index < size.households; index += 1) {
    const id = `stress-household-${index}`
    const workerId = stressWorkerId(index)
    households[id] = {
      id,
      homeBuildingId: homeBuildingIds[index % homeBuildingIds.length],
      members: 2 + index % 4,
      workerIds: index < size.visibleAgents && index % 10 !== 0 ? [workerId] : [],
      income: 8 + index % 12,
      satisfaction: 70 + index % 20,
      needs: { food: 92, goods: 88, health: 90, education: 86, entertainment: 86 },
    }
  }

  const agents: Record<string, AgentEntity> = {}
  for (let index = 0; index < size.visibleAgents; index += 1) {
    const isCart = index % 10 === 0
    const id = isCart ? `stress-cart-${index}` : stressWorkerId(index)
    const position = { x: (index * 5) % size.width, y: (index * 7) % (size.height - 8) }
    agents[id] = {
      id,
      role: isCart ? 'cart' : 'worker',
      householdId: `stress-household-${index % size.households}`,
      position,
      path: [position, { x: Math.min(size.width - 1, position.x + 1), y: position.y }],
      pathIndex: 0,
      activity: isCart ? 'idle' : 'commuting',
    }
  }

  return {
    version: 6,
    seed: 20260625,
    tick: 0,
    speed: 1,
    cells,
    buildings,
    households,
    agents,
    logisticsOrders: {},
    economy: { treasury: 10000, taxRate: .1, lastTaxIncome: 0, lastMaintenanceCost: 0 },
    metrics: {
      population: Object.values(households).reduce((sum, household) => sum + household.members, 0),
      households: size.households,
      employedWorkers: size.households,
      availableJobs: size.buildings * 8,
      housingCapacity: size.households * 5,
      satisfaction: 68,
      logisticsEfficiency: 82,
    },
    worldDrops: [],
    rareRewards: {
      missesSinceReward: 0,
      rewardsToday: 0,
      dayKey: '2026-06-25',
      processedEventIds: [],
      inventory: {},
    },
  }
}

export function samplePerformance<T>(label: string, operation: () => T) {
  const start = performance.now()
  const result = operation()
  return { label, durationMs: performance.now() - start, result }
}

export interface StressScenarioSummary {
  tick: number
  population: number
  households: number
  averageSatisfaction: number
  logisticsEfficiency: number
  blockedBuildings: number
  activeOrders: number
  totalOrders: number
  maxBuildingInventory: number
  invalidNumericFields: string[]
}

export function summarizeStressScenario(snapshot: SimulationSnapshot): StressScenarioSummary {
  const orders = Object.values(snapshot.logisticsOrders)
  const buildings = Object.values(snapshot.buildings)
  return {
    tick: snapshot.tick,
    population: snapshot.metrics.population,
    households: snapshot.metrics.households,
    averageSatisfaction: snapshot.metrics.satisfaction,
    logisticsEfficiency: snapshot.metrics.logisticsEfficiency,
    blockedBuildings: buildings.filter((building) => building.status === 'blocked').length,
    activeOrders: orders.filter(isActiveOrder).length,
    totalOrders: orders.length,
    maxBuildingInventory: Math.max(0, ...buildings.map(inventoryTotal)),
    invalidNumericFields: invalidNumericFields(snapshot),
  }
}

function initialInventory(
  type: string,
  index: number,
): Partial<Record<ResourceKind, number>> {
  if (type === 'windfield-rice') return { food: 120 + index % 30 }
  if (type === 'main-eatery') return { food: 20 + index % 10 }
  if (type === 'main-granary') return { food: 80 + index % 20, wood: index % 7 }
  return {}
}

function stressWorkerId(index: number): string {
  return `stress-worker-${index}`
}

function isActiveOrder(order: LogisticsOrder): boolean {
  return order.state === 'waiting' || order.state === 'assigned' || order.state === 'in_transit'
}

function invalidNumericFields(snapshot: SimulationSnapshot): string[] {
  const invalid: string[] = []
  const check = (name: string, value: number) => {
    if (!Number.isFinite(value)) invalid.push(name)
  }

  check('tick', snapshot.tick)
  check('population', snapshot.metrics.population)
  check('households', snapshot.metrics.households)
  check('employedWorkers', snapshot.metrics.employedWorkers)
  check('availableJobs', snapshot.metrics.availableJobs)
  check('housingCapacity', snapshot.metrics.housingCapacity)
  check('satisfaction', snapshot.metrics.satisfaction)
  check('logisticsEfficiency', snapshot.metrics.logisticsEfficiency)
  check('treasury', snapshot.economy.treasury)

  for (const household of Object.values(snapshot.households)) {
    check(`households.${household.id}.members`, household.members)
    check(`households.${household.id}.income`, household.income)
    check(`households.${household.id}.satisfaction`, household.satisfaction)
    for (const [need, amount] of Object.entries(household.needs)) {
      check(`households.${household.id}.needs.${need}`, amount)
    }
  }
  for (const building of Object.values(snapshot.buildings)) {
    check(`buildings.${building.id}.level`, building.level)
    check(`buildings.${building.id}.productionProgress`, building.productionProgress)
    for (const [resource, amount] of Object.entries(building.inventory)) {
      check(`buildings.${building.id}.inventory.${resource}`, amount ?? Number.NaN)
    }
  }
  for (const order of Object.values(snapshot.logisticsOrders)) {
    check(`logisticsOrders.${order.id}.amount`, order.amount)
    check(`logisticsOrders.${order.id}.priority`, order.priority)
  }

  return invalid
}
