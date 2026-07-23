import { describe, expect, it } from 'vitest'
import type {
  BuildingEntity,
  LogisticsOrder,
  MigrationCandidateState,
  SimulationSnapshot,
} from '../simulation/contracts'
import {
  AmbientCityStoryTracker,
  CityNoticeAnalyticsQueue,
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

  it('emits an auditable lifecycle for activation, acknowledgement, recovery and retrigger', () => {
    const tracker = new CityNoticeTracker()
    const active = makeSnapshot({
      tick: 120,
      metrics: { satisfaction: 42 },
      buildings: { 'granary-1': building('granary-1', 'granary', { food: 50 }) },
    })
    const recovered = makeSnapshot({
      tick: 150,
      metrics: { satisfaction: 80 },
      buildings: { 'granary-1': building('granary-1', 'granary', { food: 50 }) },
    })

    tracker.update(active)
    expect(tracker.consumeLifecycleEvents()).toEqual([
      expect.objectContaining({
        phase: 'activated',
        noticeId: 'resident-unhappy',
        kind: 'resident',
        tick: 120,
      }),
    ])
    expect(tracker.acknowledge('resident-unhappy', 121)).toBe(true)
    expect(tracker.acknowledge('resident-unhappy', 122)).toBe(false)
    expect(tracker.consumeLifecycleEvents()).toEqual([
      expect.objectContaining({ phase: 'acknowledged', noticeId: 'resident-unhappy', tick: 121 }),
    ])

    tracker.update(recovered)
    expect(tracker.consumeLifecycleEvents()).toEqual([
      expect.objectContaining({ phase: 'resolved', noticeId: 'resident-unhappy', tick: 150 }),
    ])

    tracker.update({ ...active, tick: 180 })
    expect(tracker.consumeLifecycleEvents()).toEqual([
      expect.objectContaining({ phase: 'retriggered', noticeId: 'resident-unhappy', tick: 180 }),
    ])
  })

  it('restores a durable analytics batch and deduplicates stable event ids', () => {
    const storage = new MemoryAnalyticsStorage()
    const tracker = new CityNoticeTracker()
    tracker.update(makeSnapshot({
      tick: 120,
      metrics: { satisfaction: 42 },
      buildings: { 'granary-1': building('granary-1', 'granary', { food: 50 }) },
    }))
    const events = tracker.consumeLifecycleEvents()
    const firstQueue = new CityNoticeAnalyticsQueue(storage)

    expect(firstQueue.enqueue(events)).toBe(events.length)
    expect(firstQueue.enqueue(events)).toBe(0)

    const restoredQueue = new CityNoticeAnalyticsQueue(storage)
    expect(restoredQueue.peek()).toEqual(events)
    expect(restoredQueue.acknowledge([events[0].eventId])).toBe(1)
    expect(new CityNoticeAnalyticsQueue(storage).peek()).toEqual(events.slice(1))
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

  it('turns a rising fiscal operating pressure into a locatable notice', () => {
    const notices = deriveCityNotices(makeSnapshot({
      buildings: { 'workshop-1': { ...building('workshop-1', 'woodshop'), status: 'blocked', statusReason: 'output-full' } },
      economy: {
        fiscalHistory: [{
          tick: 120,
          treasuryBefore: 100,
          treasuryAfter: 80,
          taxIncome: 10,
          maintenanceCost: 30,
          serviceMaintenanceCost: 0,
          operationalPressure: {
            blockedBuildings: 1,
            logisticsBacklog: 0,
            inventoryPressureBuildings: 0,
            pressuredHouseholds: 0,
          },
          operationalPressureDelta: {
            blockedBuildingsDelta: 1,
            logisticsBacklogDelta: 0,
            inventoryPressureBuildingsDelta: 0,
            pressuredHouseholdsDelta: 0,
          },
        }],
      },
    }))

    expect(notices.find((notice) => notice.id === 'fiscal-pressure-rising')).toMatchObject({
      kind: 'finance',
      severity: 'warning',
      target: { kind: 'building', buildingId: 'workshop-1' },
    })
  })

  it('does not repeat the fiscal alert while the same pressure cycle remains active', () => {
    const tracker = new CityNoticeTracker()
    const snapshot = makeSnapshot({
      tick: 120,
      buildings: {
        'workshop-1': { ...building('workshop-1', 'woodshop'), status: 'blocked', statusReason: 'output-full' },
      },
      economy: {
        fiscalHistory: [{
          tick: 120,
          treasuryBefore: 100,
          treasuryAfter: 80,
          taxIncome: 10,
          maintenanceCost: 30,
          serviceMaintenanceCost: 0,
          operationalPressure: { blockedBuildings: 1, logisticsBacklog: 0, inventoryPressureBuildings: 0, pressuredHouseholds: 0 },
          operationalPressureDelta: { blockedBuildingsDelta: 1, logisticsBacklogDelta: 0, inventoryPressureBuildingsDelta: 0, pressuredHouseholdsDelta: 0 },
        }],
      },
    })

    expect(tracker.update(snapshot).map((notice) => notice.id)).toContain('fiscal-pressure-rising')
    expect(tracker.update({ ...snapshot, tick: 121 }).map((notice) => notice.id)).not.toContain('fiscal-pressure-rising')
  })

  it('re-arms the fiscal alert after pressure resolves and rises again', () => {
    const tracker = new CityNoticeTracker()
    const base = makeSnapshot({
      buildings: {
        'workshop-1': { ...building('workshop-1', 'woodshop'), status: 'blocked', statusReason: 'output-full' },
      },
    })
    const pressure = (tick: number, blockedBuildingsDelta: number) => ({
      ...base,
      tick,
      economy: {
        ...base.economy,
        fiscalHistory: [{
          tick,
          treasuryBefore: 100,
          treasuryAfter: 80,
          taxIncome: 10,
          maintenanceCost: 30,
          serviceMaintenanceCost: 0,
          operationalPressure: { blockedBuildings: blockedBuildingsDelta > 0 ? 1 : 0, logisticsBacklog: 0, inventoryPressureBuildings: 0, pressuredHouseholds: 0 },
          operationalPressureDelta: { blockedBuildingsDelta, logisticsBacklogDelta: 0, inventoryPressureBuildingsDelta: 0, pressuredHouseholdsDelta: 0 },
        }],
      },
    })

    expect(tracker.update(pressure(120, 1)).map((notice) => notice.id)).toContain('fiscal-pressure-rising')
    expect(tracker.update(pressure(240, 0)).map((notice) => notice.id)).not.toContain('fiscal-pressure-rising')
    expect(tracker.update(pressure(360, 1)).map((notice) => notice.id)).toContain('fiscal-pressure-rising')
  })

  it.each([
    {
      name: 'food shortage',
      id: 'food-shortage',
      active: makeSnapshot({
        metrics: { population: 20 },
        buildings: { 'granary-1': building('granary-1', 'granary', { food: 1 }) },
      }),
      recovered: makeSnapshot({
        metrics: { population: 20 },
        buildings: { 'granary-1': building('granary-1', 'granary', { food: 80 }) },
      }),
    },
    {
      name: 'logistics blockage',
      id: 'logistics-blocked',
      active: makeSnapshot({
        metrics: { logisticsEfficiency: 0.35 },
        logisticsOrders: {
          'order-1': order('order-1', 'granary-1', 'market-1'),
          'order-2': order('order-2', 'granary-1', 'market-1'),
          'order-3': order('order-3', 'granary-1', 'market-1'),
        },
      }),
      recovered: makeSnapshot({ metrics: { logisticsEfficiency: 0.95 } }),
    },
    {
      name: 'migration waiting',
      id: 'migration-waiting',
      active: makeSnapshot({
        tick: 42,
        migrationCandidates: { visitor: migrationCandidate('visitor') },
      }),
      recovered: makeSnapshot({ tick: 43 }),
    },
  ])('re-arms the $name notice after the underlying state recovers', ({ id, active, recovered }) => {
    const tracker = new CityNoticeTracker()

    expect(tracker.update(active).map((notice) => notice.id)).toContain(id)
    expect(tracker.update({ ...active, tick: active.tick + 1 }).map((notice) => notice.id)).not.toContain(id)
    expect(tracker.update(recovered).map((notice) => notice.id)).not.toContain(id)
    expect(tracker.update({ ...active, tick: recovered.tick + 1 }).map((notice) => notice.id)).toContain(id)
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

  it('surfaces walking migration candidates as in-city move-in stories', () => {
    const stories = deriveAmbientCityStories(makeSnapshot({
      tick: 42,
      migrationCandidates: {
        visitor: {
          ...migrationCandidate('visitor'),
          status: 'walking',
          position: { x: 3, y: 4 },
          targetHomeBuildingId: 'home',
          path: [
            { x: 1, y: 2 },
            { x: 2, y: 3 },
            { x: 3, y: 4 },
          ],
          pathIndex: 2,
        },
      },
    }))

    expect(stories.find((story) => story.id === 'story-migration-waiting')).toMatchObject({
      title: '新住户正在进城',
      body: '3 位外来人正往住处走，抵达家门后会正式入住。',
      target: {
        kind: 'point',
        point: { x: 3, y: 4 },
        label: '外来人口进城路线',
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

class MemoryAnalyticsStorage {
  private values = new Map<string, string>()

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

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
  economy?: Partial<SimulationSnapshot['economy']>
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
      ...overrides.economy,
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
