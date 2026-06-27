import { describe, expect, it } from 'vitest'
import type { BuildingEntity, SimulationSnapshot } from '../simulation/contracts'
import { deriveStageAdvisorOverlay } from './stageAdvisor'

describe('stage advisor overlays', () => {
  it('targets housing and waiting migrants for population blockers', () => {
    const overlay = deriveStageAdvisorOverlay('population', makeSnapshot({
      buildings: {
        home: building('home', 'house', { x: 2, y: 3 }),
      },
      migrationCandidates: {
        visitor: {
          id: 'visitor',
          members: 3,
          workerCount: 1,
          status: 'waiting',
          position: { x: 5, y: 6 },
          arrivedTick: 1,
          patienceTicks: 3,
          attractionAtArrival: 60,
        },
      },
    }), 1)

    expect(overlay).toEqual({
      id: 1,
      label: '住房与外来人口',
      points: [{ x: 2, y: 3 }, { x: 5, y: 6 }],
    })
  })

  it('targets districts and attraction bottleneck buildings', () => {
    const snapshot = makeSnapshot({
      buildings: {
        market: { ...building('market', 'market', { x: 4, y: 5 }), status: 'blocked', statusReason: 'no-workers' },
        granary: building('granary', 'granary', { x: 6, y: 7 }),
      },
      districts: [{
        id: 'district:market',
        kind: 'market-street',
        name: '市街',
        center: { x: 8, y: 9 },
        buildingIds: ['market'],
        prosperity: 55,
        activityLevel: 'steady',
        visualHints: { lanterns: 1, footTraffic: 1, decoration: 1 },
      }],
    })

    expect(deriveStageAdvisorOverlay('activeDistricts', snapshot, 2)).toMatchObject({
      label: '街区核心',
      points: [{ x: 8, y: 9 }],
    })
    expect(deriveStageAdvisorOverlay('attraction', snapshot, 3)).toMatchObject({
      label: '吸引力瓶颈',
      points: [{ x: 4, y: 5 }, { x: 6, y: 7 }],
    })
  })
})

function makeSnapshot(overrides: Partial<SimulationSnapshot> = {}): SimulationSnapshot {
  return {
    version: 6,
    seed: 1,
    tick: 1,
    speed: 1,
    cells: [],
    buildings: {},
    households: {},
    migrationCandidates: {},
    agents: {},
    logisticsOrders: {},
    economy: { treasury: 100, taxRate: 0.1, lastTaxIncome: 0, lastMaintenanceCost: 0 },
    metrics: {
      population: 0,
      households: 0,
      employedWorkers: 0,
      availableJobs: 0,
      housingCapacity: 0,
      satisfaction: 100,
      logisticsEfficiency: 100,
    },
    worldDrops: [],
    rareRewards: {
      missesSinceReward: 0,
      rewardsToday: 0,
      dayKey: '2026-06-27',
      processedEventIds: [],
      inventory: {},
    },
    ...overrides,
  }
}

function building(id: string, type: string, entrance: { x: number; y: number }): BuildingEntity {
  return {
    id,
    type,
    origin: { x: entrance.x, y: entrance.y - 1 },
    rotation: 0,
    level: 1,
    entrance,
    status: 'idle',
    workers: [],
    inventory: {},
    productionProgress: 0,
  }
}

