import type {
  BuildingEntity,
  CityMetrics,
  SimulationSnapshot,
} from '../contracts'

export interface InitialSnapshotOptions {
  seed?: number
  buildings?: Record<string, BuildingEntity>
  treasury?: number
  taxRate?: number
  dayKey?: string
}

export function createInitialSimulationSnapshot(
  options: InitialSnapshotOptions = {},
): SimulationSnapshot {
  const buildings = structuredClone(options.buildings ?? {})
  const metrics: CityMetrics = {
    population: 0,
    households: 0,
    employedWorkers: 0,
    availableJobs: 0,
    housingCapacity: 0,
    satisfaction: 100,
    logisticsEfficiency: 100,
  }

  return {
    version: 6,
    seed: options.seed ?? 1,
    tick: 0,
    speed: 1,
    cells: [],
    buildings,
    households: {},
    migrationCandidates: {},
    agents: {},
    logisticsOrders: {},
    economy: {
      treasury: options.treasury ?? 1_000,
      taxRate: options.taxRate ?? 0.1,
      lastTaxIncome: 0,
      lastMaintenanceCost: 0,
    },
    metrics,
    districts: [],
    worldDrops: [],
    rareRewards: {
      missesSinceReward: 0,
      rewardsToday: 0,
      dayKey: options.dayKey ?? '1970-01-01',
      processedEventIds: [],
      inventory: {},
    },
  }
}
