import { describe, expect, it } from 'vitest'
import type { SimulationSnapshot } from '../simulation/contracts'
import {
  createStressScenario,
} from './stressScenario'
import {
  runCivilizationQueuePressureProbe,
  summarizeCivilizationLongRunLayer,
} from './civilizationLongRun'

describe('civilization long-run queue pressure report', () => {
  it('summarizes service and logistics queue sizes for every sampled layer', () => {
    const snapshot: SimulationSnapshot = {
      ...createStressScenario(),
      serviceQueues: {
        'market-1:food': {
          buildingId: 'market-1',
          need: 'food',
          capacityPerTick: 2,
          servedThisTick: 2,
          rejectedThisTick: 5,
          waitingCount: 7,
          longestWaitTicks: 11,
          waiting: [
            { householdId: 'family-1', queuedSinceTick: 9, waitTicks: 11 },
          ],
        },
      },
      logisticsQueues: {
        'granary-1': {
          buildingId: 'granary-1',
          unloadCapacityPerTick: 1,
          unloadedThisTick: 1,
          waitingToUnloadCount: 4,
          longestWaitTicks: 6,
          waitingOrderIds: ['order-1', 'order-2'],
        },
      },
    }

    const summary = summarizeCivilizationLongRunLayer(snapshot)

    expect(summary.queuePressure).toEqual({
      serviceQueues: 1,
      queuedHouseholds: 7,
      longestServiceWaitTicks: 11,
      logisticsQueues: 1,
      unloadBacklog: 4,
      longestUnloadWaitTicks: 6,
    })
  })

  it('runs a deterministic unload throughput probe for the long-run QA command', () => {
    const probe = runCivilizationQueuePressureProbe()

    expect(probe.queuePressure.logisticsQueues).toBeGreaterThanOrEqual(1)
    expect(probe.queuePressure.unloadBacklog).toBeGreaterThanOrEqual(1)
    expect(probe.queuePressure.longestUnloadWaitTicks).toBeGreaterThanOrEqual(0)
  })
})
