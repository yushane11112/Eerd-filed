import { describe, expect, it } from 'vitest'
import type {
  BuildingEntity,
  LogisticsOrder,
  MigrationCandidateState,
  SimulationSnapshot,
} from '../simulation/contracts'
import {
  AmbientCityStoryTracker,
  CityNoticeTracker,
  deriveAmbientCityStories,
  deriveCityNotices,
} from './cityNotices'

describe('city notice derivation', () => {
  it('does not emit repeated notices for the same unresolved state', () => {
    const tracker = new CityNoticeTracker()
    const snapshot = makeSnapshot({
      tick: 120,
      metrics: { satisfaction: 42, population: 24, employedWorkers: 5, availableJobs: 16 },
    })

    const first = tracker.update(snapshot)
    const second = tracker.update({ ...snapshot, tick: 150 })

    expect(first.map((notice) => notice.id)).toContain('resident-unhappy')
    expect(second).toHaveLength(0)
  })

  it('orders severe problems before softer city feedback', () => {
    const notices = deriveCityNotices(makeSnapshot({
      metrics: { logisticsEfficiency: 0.35, satisfaction: 45, population: 20 },
      buildings: {
        'granary-1': building('granary-1', 'granary', { food: 2 }),
      },
    }))

    expect(notices.map((notice) => notice.id).slice(0, 2)).toEqual([
      'food-shortage',
      'logistics-blocked',
    ])
  })

  it('removes notices when the city state recovers', () => {
    const blocked = deriveCityNotices(makeSnapshot({
      metrics: { satisfaction: 44, logisticsEfficiency: 0.4 },
    }))
    const recovered = deriveCityNotices(makeSnapshot({
      metrics: { satisfaction: 80, logisticsEfficiency: 0.9 },
      buildings: {
        'granary-1': building('granary-1', 'granary', { food: 50 }),
      },
    }))

    expect(blocked.map((notice) => notice.id)).toContain('resident-unhappy')
    expect(blocked.map((notice) => notice.id)).toContain('logistics-blocked')
    expect(recovered.map((notice) => notice.id)).not.toContain('resident-unhappy')
    expect(recovered.map((notice) => notice.id)).not.toContain('logistics-blocked')
  })

  it('attaches a relevant building target to food shortage notices', () => {
    const notices = deriveCityNotices(makeSnapshot({
      metrics: { population: 20 },
      buildings: {
        'granary-1': building('granary-1', 'granary', { food: 2 }),
        'riceField-1': building('riceField-1', 'riceField'),
      },
    }))

    expect(notices.find((notice) => notice.id === 'food-shortage')?.target).toEqual({
      kind: 'building',
      buildingId: 'granary-1',
    })
  })

  it('targets the destination of a waiting logistics order', () => {
    const notices = deriveCityNotices(makeSnapshot({
      logisticsOrders: {
        'order-1': order('order-1', 'granary-1', 'market-1'),
        'order-2': order('order-2', 'granary-1', 'market-1'),
        'order-3': order('order-3', 'granary-1', 'market-1'),
      },
      buildings: {
        'granary-1': building('granary-1', 'granary', { food: 20 }),
        'market-1': building('market-1', 'market'),
      },
    }))

    expect(notices.find((notice) => notice.id === 'logistics-blocked')?.target).toEqual({
      kind: 'building',
      buildingId: 'market-1',
    })
  })

  it('derives lightweight ambient stories from city notices', () => {
    const stories = deriveAmbientCityStories(makeSnapshot({
      metrics: { population: 20 },
      buildings: {
        'granary-1': building('granary-1', 'granary', { food: 2 }),
      },
    }))

    expect(stories[0]).toMatchObject({
      id: 'story-food-shortage',
      title: '粮仓见底',
      body: '粮食只剩约 2 份，撑不了太久。',
      actionLabel: '看一眼',
      target: { kind: 'building', buildingId: 'granary-1' },
      resolved: false,
    })
  })

  it('surfaces waiting migration candidates as locatable ambient stories', () => {
    const stories = deriveAmbientCityStories(makeSnapshot({
      tick: 42,
      migrationCandidates: {
        visitor: migrationCandidate('visitor'),
      },
    }))

    expect(stories.find((story) => story.id === 'story-migration-waiting')).toMatchObject({
      title: '有人在城口等房',
      body: '3 位外来人正在找住处，空房和城镇吸引力会决定他们是否留下。',
      actionLabel: '看一眼',
      target: {
        kind: 'point',
        point: { x: 1, y: 2 },
        label: '外来人口临时停留点',
      },
    })
  })

  it('keeps an acknowledged ambient story quiet until the underlying notice resolves', () => {
    const tracker = new AmbientCityStoryTracker()
    const lowFood = makeSnapshot({
      tick: 120,
      metrics: { population: 20 },
      buildings: {
        'granary-1': building('granary-1', 'granary', { food: 2 }),
      },
    })
    const recovered = makeSnapshot({
      tick: 150,
      metrics: { population: 20 },
      buildings: {
        'granary-1': building('granary-1', 'granary', { food: 50 }),
      },
    })

    expect(tracker.update(lowFood).map((story) => story.id)).toContain('story-food-shortage')
    tracker.resolve('story-food-shortage')

    expect(tracker.update({ ...lowFood, tick: 130 })).toHaveLength(0)
    expect(tracker.update(recovered).map((story) => story.id)).not.toContain('story-food-shortage')
    expect(tracker.update({ ...lowFood, tick: 180 }).map((story) => story.id)).toContain('story-food-shortage')
  })
})

const metricDefaults = {
  population: 12,
  households: 3,
  employedWorkers: 6,
  availableJobs: 8,
  housingCapacity: 24,
  satisfaction: 75,
  logisticsEfficiency: 0.9,
}

function makeSnapshot(overrides: {
  tick?: number
  metrics?: Partial<SimulationSnapshot['metrics']>
  buildings?: Record<string, BuildingEntity>
  logisticsOrders?: Record<string, LogisticsOrder>
  migrationCandidates?: Record<string, MigrationCandidateState>
} = {}): SimulationSnapshot {
  return {
    version: 6,
    seed: 1,
    tick: overrides.tick ?? 1,
    speed: 1,
    cells: [],
    buildings: overrides.buildings ?? {},
    households: {},
    migrationCandidates: overrides.migrationCandidates ?? {},
    agents: {},
    logisticsOrders: overrides.logisticsOrders ?? {},
    economy: {
      treasury: 1000,
      taxRate: 0.1,
      lastTaxIncome: 0,
      lastMaintenanceCost: 0,
    },
    metrics: { ...metricDefaults, ...overrides.metrics },
    worldDrops: [],
    rareRewards: {
      missesSinceReward: 0,
      rewardsToday: 0,
      dayKey: '2026-06-26',
      processedEventIds: [],
      inventory: {},
    },
  }
}

function migrationCandidate(id: string): MigrationCandidateState {
  return {
    id,
    members: 3,
    workerCount: 1,
    status: 'waiting',
    position: { x: 1, y: 2 },
    arrivedTick: 40,
    patienceTicks: 4,
    attractionAtArrival: 66,
  }
}

function building(
  id: string,
  type: string,
  inventory: BuildingEntity['inventory'] = {},
): BuildingEntity {
  return {
    id,
    type,
    origin: { x: 0, y: 0 },
    rotation: 0,
    level: 1,
    entrance: { x: 0, y: 1 },
    status: 'idle',
    workers: [],
    inventory,
    productionProgress: 0,
  }
}

function order(
  id: string,
  sourceBuildingId: string,
  destinationBuildingId: string,
): LogisticsOrder {
  return {
    id,
    resource: 'food',
    amount: 4,
    sourceBuildingId,
    destinationBuildingId,
    priority: 10,
    state: 'waiting',
  }
}
