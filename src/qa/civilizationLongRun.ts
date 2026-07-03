import { SimulationEngine } from '../simulation/core'
import { EconomySystem } from '../simulation/economy'
import type { SimulationSnapshot } from '../simulation/contracts'
import {
  CIVILIZATION_LONG_RUN_THRESHOLDS,
  createStressScenario,
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

export interface CivilizationLongRunLayerSummary extends StressScenarioSummary {
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
  layers: CivilizationLongRunLayerSummary[]
  final: CivilizationLongRunLayerSummary
  thresholds: typeof CIVILIZATION_LONG_RUN_THRESHOLDS
  snapshotLimits: typeof CIVILIZATION_LONG_RUN_SNAPSHOT_LIMITS
}

export function runCivilizationLongRunScenario(): CivilizationLongRunReport {
  const engine = new SimulationEngine(createStressScenario(), {
    buildingDefinitions: stressScenarioDefinitions,
    migrationIntervalTicks: CIVILIZATION_30_DAY_TICKS + 1,
    migrationOutThreshold: 0,
    systems: [
      new EconomySystem({
        definitions: stressScenarioDefinitions,
        routePlanner: {
          findRoute: (_cells, from, to) => [from, to],
        },
        serviceRules: stressScenarioServiceRules,
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
    layers,
    final,
    thresholds: CIVILIZATION_LONG_RUN_THRESHOLDS,
    snapshotLimits: CIVILIZATION_LONG_RUN_SNAPSHOT_LIMITS,
  }
}

function summarizeCivilizationLongRunLayer(
  snapshot: SimulationSnapshot,
): CivilizationLongRunLayerSummary {
  return {
    ...summarizeStressScenario(snapshot),
    snapshotSizes: {
      households: Object.keys(snapshot.households).length,
      buildings: Object.keys(snapshot.buildings).length,
      agents: Object.keys(snapshot.agents).length,
      logisticsOrders: Object.keys(snapshot.logisticsOrders).length,
      worldDrops: snapshot.worldDrops.length,
    },
  }
}
