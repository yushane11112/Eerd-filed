import type {
  AgentEntity, BuildingEntity, HouseholdState, SimulationSnapshot, WorldCell,
} from '../simulation/contracts'

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
    buildings[id] = {
      id,
      type: index % 4 === 0 ? 'main-homes' : index % 4 === 1 ? 'windfield-rice' : index % 4 === 2 ? 'main-granary' : 'main-eatery',
      origin: { x: 2 + (index * 3) % (size.width - 4), y: 2 + Math.floor(index / 24) * 3 },
      rotation: 0,
      level: 1 + index % 8,
      entrance: { x: 2 + (index * 3) % (size.width - 4), y: 3 + Math.floor(index / 24) * 3 },
      status: index % 11 === 0 ? 'blocked' : 'working',
      statusReason: index % 11 === 0 ? '压力场景：原料不足' : undefined,
      workers: [],
      inventory: { food: index % 20, wood: index % 7 },
      productionProgress: index % 100,
    }
  }

  const buildingIds = Object.keys(buildings)
  const households: Record<string, HouseholdState> = {}
  for (let index = 0; index < size.households; index += 1) {
    const id = `stress-household-${index}`
    households[id] = {
      id,
      homeBuildingId: buildingIds[index % buildingIds.length],
      members: 2 + index % 4,
      workerIds: [`stress-worker-${index}`],
      income: 8 + index % 12,
      satisfaction: 45 + index % 50,
      needs: { food: 60, goods: 50, health: 70, education: 45, entertainment: 40 },
    }
  }

  const agents: Record<string, AgentEntity> = {}
  for (let index = 0; index < size.visibleAgents; index += 1) {
    const id = `stress-agent-${index}`
    const position = { x: (index * 5) % size.width, y: (index * 7) % (size.height - 8) }
    agents[id] = {
      id,
      role: index % 10 === 0 ? 'cart' : 'worker',
      householdId: `stress-household-${index % size.households}`,
      employerBuildingId: buildingIds[(index * 3) % buildingIds.length],
      position,
      path: [position, { x: Math.min(size.width - 1, position.x + 1), y: position.y }],
      pathIndex: 0,
      activity: 'commuting',
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
      logisticsEfficiency: .82,
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

