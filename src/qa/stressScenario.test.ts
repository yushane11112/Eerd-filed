import { describe, expect, it } from 'vitest'
import { SimulationEngine } from '../simulation/core'
import { EconomySystem } from '../simulation/economy'
import {
  CIVILIZATION_LONG_RUN_THRESHOLDS,
  LONG_RUN_TICKS,
  createStressScenario,
  summarizeStressScenario,
  TARGET_STRESS_SIZE,
  stressScenarioDefinitions,
  stressScenarioServiceRules,
} from './stressScenario'

describe('target stress scenario', () => {
  it('creates the agreed city scale deterministically', () => {
    const first = createStressScenario()
    const second = createStressScenario()

    expect(Object.keys(first.households)).toHaveLength(TARGET_STRESS_SIZE.households)
    expect(Object.keys(first.buildings)).toHaveLength(TARGET_STRESS_SIZE.buildings)
    expect(Object.keys(first.agents)).toHaveLength(TARGET_STRESS_SIZE.visibleAgents)
    expect(second).toEqual(first)
  })

  it('keeps a multi-day civilization simulation inside grey-box stability bounds', () => {
    const engine = new SimulationEngine(createStressScenario(), {
      buildingDefinitions: stressScenarioDefinitions,
      migrationIntervalTicks: LONG_RUN_TICKS + 1,
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

    engine.step(LONG_RUN_TICKS)
    const summary = summarizeStressScenario(engine.snapshot)

    expect(summary.population).toBeGreaterThanOrEqual(
      CIVILIZATION_LONG_RUN_THRESHOLDS.minPopulation,
    )
    expect(summary.population).toBeLessThanOrEqual(
      CIVILIZATION_LONG_RUN_THRESHOLDS.maxPopulation,
    )
    expect(summary.averageSatisfaction).toBeGreaterThanOrEqual(
      CIVILIZATION_LONG_RUN_THRESHOLDS.minAverageSatisfaction,
    )
    expect(summary.logisticsEfficiency).toBeGreaterThanOrEqual(
      CIVILIZATION_LONG_RUN_THRESHOLDS.minLogisticsEfficiency,
    )
    expect(summary.blockedBuildings).toBeLessThanOrEqual(
      CIVILIZATION_LONG_RUN_THRESHOLDS.maxBlockedBuildings,
    )
    expect(summary.activeOrders).toBeLessThanOrEqual(
      CIVILIZATION_LONG_RUN_THRESHOLDS.maxActiveOrders,
    )
    expect(summary.totalOrders).toBeLessThanOrEqual(
      CIVILIZATION_LONG_RUN_THRESHOLDS.maxHistoricalOrders,
    )
    expect(summary.maxBuildingInventory).toBeLessThanOrEqual(
      CIVILIZATION_LONG_RUN_THRESHOLDS.maxBuildingInventory,
    )
    expect(summary.invalidNumericFields).toEqual([])
  })
})
