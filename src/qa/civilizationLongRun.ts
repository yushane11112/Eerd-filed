import { SimulationEngine } from '../simulation/core'
import { EconomySystem } from '../simulation/economy'
import { LogisticsSystem } from '../simulation/economy/logistics'
import type {
  BuildingDefinition,
  ResourceKind,
  SimulationEvent,
  SimulationSnapshot,
  SimulationSystem,
} from '../simulation/contracts'
import {
  CIVILIZATION_LONG_RUN_THRESHOLDS,
  createStressScenario,
  TARGET_STRESS_SIZE,
  stressScenarioDefinitions,
  stressScenarioServiceRules,
  summarizeStressScenario,
  type StressScenarioSummary,
} from './stressScenario'

export const CIVILIZATION_30_DAY_TICKS = 7_200
export const CIVILIZATION_LONG_RUN_LAYER_TICKS = [2_400, 4_800, 7_200] as const

export const CIVILIZATION_LONG_RUN_SNAPSHOT_LIMITS = {
  households: 500,
  buildings: 300,
  agents: 1_200,
  logisticsOrders: CIVILIZATION_LONG_RUN_THRESHOLDS.maxHistoricalOrders,
  worldDrops: 0,
} as const

export interface CivilizationLongRunQueuePressure {
  serviceQueues: number
  queuedHouseholds: number
  longestServiceWaitTicks: number
  logisticsQueues: number
  unloadBacklog: number
  longestUnloadWaitTicks: number
}

export interface CivilizationLongRunLayerSummary extends StressScenarioSummary {
  queuePressure: CivilizationLongRunQueuePressure
  snapshotSizes: {
    households: number
    buildings: number
    agents: number
    logisticsOrders: number
    worldDrops: number
  }
}

export interface CivilizationLongRunReport {
  ticks: number
  scaleBaseline: {
    households: number
    buildings: number
    visibleAgents: number
  }
  layers: CivilizationLongRunLayerSummary[]
  final: CivilizationLongRunLayerSummary
  queuePressureProbe: CivilizationLongRunLayerSummary
  thresholds: typeof CIVILIZATION_LONG_RUN_THRESHOLDS
  snapshotLimits: typeof CIVILIZATION_LONG_RUN_SNAPSHOT_LIMITS
}

export function runCivilizationLongRunScenario(): CivilizationLongRunReport {
  const engine = new SimulationEngine(createStressScenario(), {
    buildingDefinitions: stressScenarioDefinitions,
    migrationIntervalTicks: CIVILIZATION_30_DAY_TICKS + 1,
    migrationOutThreshold: 0,
    systems: [
      new LongRunLogisticsPressureSystem(),
      new EconomySystem({
        definitions: stressScenarioDefinitions,
        routePlanner: {
          findRoute: (_cells, from, to) => [from, to],
        },
        serviceRules: stressScenarioServiceRules,
        unloadCapacityPerTick: 1,
        settlementIntervalTicks: 300,
      }),
    ],
  })

  const layers: CivilizationLongRunLayerSummary[] = []
  let currentTick = 0
  for (const targetTick of CIVILIZATION_LONG_RUN_LAYER_TICKS) {
    engine.step(targetTick - currentTick)
    currentTick = targetTick
    layers.push(summarizeCivilizationLongRunLayer(engine.snapshot))
  }

  const final = layers[layers.length - 1]
  return {
    ticks: CIVILIZATION_30_DAY_TICKS,
    scaleBaseline: {
      households: TARGET_STRESS_SIZE.households,
      buildings: TARGET_STRESS_SIZE.buildings,
      visibleAgents: TARGET_STRESS_SIZE.visibleAgents,
    },
    layers,
    final,
    queuePressureProbe: runCivilizationQueuePressureProbe(),
    thresholds: CIVILIZATION_LONG_RUN_THRESHOLDS,
    snapshotLimits: CIVILIZATION_LONG_RUN_SNAPSHOT_LIMITS,
  }
}

class LongRunLogisticsPressureSystem implements SimulationSystem {
  readonly id = 'qa.long-run-logistics-pressure'
  private readonly intervalTicks = 120
  private readonly resources: readonly ResourceKind[] = ['food', 'wood']

  update(snapshot: SimulationSnapshot): SimulationEvent[] {
    this.cleanupCompletedPressureCarriers(snapshot)
    if (snapshot.tick <= 0 || snapshot.tick % this.intervalTicks !== 0) return []
    const destination = Object.values(snapshot.buildings)
      .find((building) => building.type === 'main-eatery')
    if (!destination) return []
    const source = Object.values(snapshot.buildings)
      .find((building) => building.type === 'main-granary')
    if (!source) return []

    this.resources.forEach((resource, index) => {
      const orderId = `long-run-pressure-order:${snapshot.tick}:${index}`
      const carrierId = `long-run-pressure-carrier:${snapshot.tick}:${index}`
      if (snapshot.logisticsOrders[orderId] || snapshot.agents[carrierId]) return
      snapshot.logisticsOrders[orderId] = {
        id: orderId,
        resource,
        amount: 1,
        sourceBuildingId: source.id,
        destinationBuildingId: destination.id,
        priority: 120,
        state: 'in_transit',
        carrierId,
        throughputQueuedSinceTick: snapshot.tick - 1,
      }
      snapshot.agents[carrierId] = {
        id: carrierId,
        role: 'cart',
        position: { ...destination.entrance },
        path: [{ ...destination.entrance }],
        pathIndex: 0,
        activity: 'delivering',
        cargoIntent: {
          orderId,
          resource,
          amount: 1,
          sourceBuildingId: source.id,
          destinationBuildingId: destination.id,
          phase: 'dropoff',
        },
      }
    })
    return []
  }

  private cleanupCompletedPressureCarriers(snapshot: SimulationSnapshot): void {
    for (const [agentId, agent] of Object.entries(snapshot.agents)) {
      if (!agentId.startsWith('long-run-pressure-carrier:')) continue
      if (agent.activity !== 'idle') continue
      delete snapshot.agents[agentId]
    }
  }
}

export function runCivilizationQueuePressureProbe(): CivilizationLongRunLayerSummary {
  const definitions: Record<string, BuildingDefinition> = {
    source: {
      type: 'source',
      name: '压力货源',
      category: 'storage',
      footprint: [{ x: 0, y: 0 }],
      entrance: { x: 0, y: 1 },
      maxLevel: 8,
      jobs: 0,
      capacity: 50,
    },
    destination: {
      type: 'destination',
      name: '压力仓储',
      category: 'storage',
      footprint: [{ x: 0, y: 0 }],
      entrance: { x: 4, y: 1 },
      maxLevel: 8,
      jobs: 0,
      capacity: 50,
    },
  }
  const snapshot: SimulationSnapshot = {
    version: 6,
    seed: 20260704,
    tick: 10,
    speed: 1,
    cells: [
      { point: { x: 0, y: 1 }, terrain: 'land', elevation: 0, road: 'stone' },
      { point: { x: 4, y: 1 }, terrain: 'land', elevation: 0, road: 'stone' },
    ],
    buildings: {
      source: {
        id: 'source',
        type: 'source',
        origin: { x: 0, y: 0 },
        entrance: { x: 0, y: 1 },
        rotation: 0,
        level: 1,
        status: 'working',
        workers: [],
        inventory: { food: 10 },
        productionProgress: 0,
      },
      destination: {
        id: 'destination',
        type: 'destination',
        origin: { x: 4, y: 0 },
        entrance: { x: 4, y: 1 },
        rotation: 0,
        level: 1,
        status: 'working',
        workers: [],
        inventory: {},
        productionProgress: 0,
      },
    },
    households: {},
    agents: {
      carrierA: {
        id: 'carrierA',
        role: 'cart',
        position: { x: 4, y: 1 },
        path: [{ x: 4, y: 1 }],
        pathIndex: 0,
        activity: 'delivering',
        cargoIntent: {
          orderId: 'orderA',
          resource: 'food',
          amount: 1,
          sourceBuildingId: 'source',
          destinationBuildingId: 'destination',
          phase: 'dropoff',
        },
      },
      carrierB: {
        id: 'carrierB',
        role: 'cart',
        position: { x: 4, y: 1 },
        path: [{ x: 4, y: 1 }],
        pathIndex: 0,
        activity: 'delivering',
        cargoIntent: {
          orderId: 'orderB',
          resource: 'food',
          amount: 1,
          sourceBuildingId: 'source',
          destinationBuildingId: 'destination',
          phase: 'dropoff',
        },
      },
    },
    logisticsOrders: {
      orderA: {
        id: 'orderA',
        resource: 'food',
        amount: 1,
        sourceBuildingId: 'source',
        destinationBuildingId: 'destination',
        priority: 50,
        state: 'in_transit',
        carrierId: 'carrierA',
      },
      orderB: {
        id: 'orderB',
        resource: 'food',
        amount: 1,
        sourceBuildingId: 'source',
        destinationBuildingId: 'destination',
        priority: 50,
        state: 'in_transit',
        carrierId: 'carrierB',
        throughputQueuedSinceTick: 7,
      },
    },
    economy: { treasury: 0, taxRate: 0, lastTaxIncome: 0, lastMaintenanceCost: 0 },
    metrics: {
      population: 0,
      households: 0,
      employedWorkers: 0,
      availableJobs: 0,
      housingCapacity: 0,
      satisfaction: 0,
      logisticsEfficiency: 100,
    },
    worldDrops: [],
    rareRewards: {
      missesSinceReward: 0,
      rewardsToday: 0,
      dayKey: '2026-07-04',
      processedEventIds: [],
      inventory: {},
    },
  }

  new LogisticsSystem({
    definitions,
    unloadCapacityPerTick: 1,
    routePlanner: {
      findRoute: (_cells, from, to) => [from, to],
    },
  }).update(snapshot)

  return summarizeCivilizationLongRunLayer(snapshot)
}

export function summarizeCivilizationLongRunLayer(
  snapshot: SimulationSnapshot,
): CivilizationLongRunLayerSummary {
  return {
    ...summarizeStressScenario(snapshot),
    queuePressure: summarizeQueuePressure(snapshot),
    snapshotSizes: {
      households: Object.keys(snapshot.households).length,
      buildings: Object.keys(snapshot.buildings).length,
      agents: Object.keys(snapshot.agents).length,
      logisticsOrders: Object.keys(snapshot.logisticsOrders).length,
      worldDrops: snapshot.worldDrops.length,
    },
  }
}

function summarizeQueuePressure(
  snapshot: SimulationSnapshot,
): CivilizationLongRunQueuePressure {
  const serviceQueues = Object.values(snapshot.serviceQueues ?? {})
    .filter((queue) => queue.waitingCount > 0 || queue.rejectedThisTick > 0)
  const logisticsQueues = Object.values(snapshot.logisticsQueues ?? {})
    .filter((queue) => queue.waitingToUnloadCount > 0)

  return {
    serviceQueues: serviceQueues.length,
    queuedHouseholds: serviceQueues.reduce((sum, queue) => sum + queue.waitingCount, 0),
    longestServiceWaitTicks: serviceQueues.reduce(
      (max, queue) => Math.max(max, queue.longestWaitTicks),
      0,
    ),
    logisticsQueues: logisticsQueues.length,
    unloadBacklog: logisticsQueues.reduce((sum, queue) => sum + queue.waitingToUnloadCount, 0),
    longestUnloadWaitTicks: logisticsQueues.reduce(
      (max, queue) => Math.max(max, queue.longestWaitTicks),
      0,
    ),
  }
}
