import { describe, expect, it } from 'vitest'
import type {
  BuildingDefinition,
  BuildingEntity,
  HouseholdState,
  SimulationSystem,
} from '../contracts'
import { EconomySystem } from '../economy'
import { SimulationEngine } from './SimulationEngine'
import { createInitialSimulationSnapshot } from './snapshot'

const definitions: Record<string, BuildingDefinition> = {
  house: {
    type: 'house',
    name: '民居',
    category: 'housing',
    footprint: [{ x: 0, y: 0 }],
    entrance: { x: 0, y: 1 },
    maxLevel: 8,
    jobs: 0,
    capacity: 8,
  },
  workshop: {
    type: 'workshop',
    name: '木作坊',
    category: 'production',
    footprint: [{ x: 0, y: 0 }],
    entrance: { x: 0, y: 1 },
    maxLevel: 8,
    jobs: 4,
    capacity: 10,
  },
  market: {
    type: 'market',
    name: '集市',
    category: 'market',
    footprint: [{ x: 0, y: 0 }],
    entrance: { x: 0, y: 1 },
    maxLevel: 8,
    jobs: 1,
    capacity: 10,
  },
}

function building(
  id: string,
  type: keyof typeof definitions,
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
    inventory: {},
    productionProgress: 0,
  }
}

function createEngine(seed = 123): SimulationEngine {
  const snapshot = createInitialSimulationSnapshot({
    seed,
    buildings: {
      home: building('home', 'house'),
      work: building('work', 'workshop'),
    },
  })
  return new SimulationEngine(snapshot, {
    buildingDefinitions: definitions,
    migrationIntervalTicks: 1,
    householdSize: [4, 4],
  })
}

describe('SimulationEngine', () => {
  it('creates a complete version 6 initial snapshot', () => {
    const snapshot = createInitialSimulationSnapshot({ seed: 9 })
    expect(snapshot).toMatchObject({
      version: 6,
      seed: 9,
      tick: 0,
      speed: 1,
      households: {},
      agents: {},
      logisticsOrders: {},
    })
    expect(snapshot.metrics.satisfaction).toBe(100)
  })

  it('advances at fixed ticks with pause and 1/2/4 speed', () => {
    const engine = createEngine()
    expect(engine.advance(199).ticks).toBe(0)
    expect(engine.advance(1).ticks).toBe(1)

    engine.setSpeed(2)
    expect(engine.advance(200).ticks).toBe(2)

    engine.setSpeed(4)
    expect(engine.advance(200).ticks).toBe(4)

    engine.pause()
    expect(engine.advance(10_000)).toEqual({ ticks: 0, events: [] })
    expect(engine.snapshot.tick).toBe(7)
  })

  it('migrates a household in and assigns workers to real job slots', () => {
    const engine = createEngine()
    const arrivalEvents = engine.step()
    const waiting = Object.values(engine.snapshot.migrationCandidates ?? {})[0]

    expect(arrivalEvents).toContainEqual({
      type: 'migration-candidate-arrived',
      candidateId: waiting.id,
      members: 4,
      attraction: expect.any(Number),
    })
    expect(engine.snapshot.metrics.waitingMigrants).toBe(1)

    const settlementEvents = engine.step()
    const snapshot = engine.snapshot
    const household = Object.values(snapshot.households)[0]

    expect(settlementEvents).toContainEqual({
      type: 'household-migrated',
      householdId: household.id,
      direction: 'in',
    })
    expect(snapshot.metrics).toMatchObject({
      population: 4,
      households: 1,
      employedWorkers: 2,
      availableJobs: 2,
      housingCapacity: 8,
      openHousingCapacity: 4,
      waitingMigrants: 1,
    })
    expect(snapshot.metrics.cityAttraction).toBeGreaterThan(0)
    expect(snapshot.buildings.work.workers).toHaveLength(2)
    expect(household.income).toBe(0)

    engine.step()
    expect(Object.values(engine.snapshot.households)[0].income).toBe(20)
  })

  it('does not overfill housing with a household that cannot fit', () => {
    const engine = createEngine()
    engine.step(5)
    expect(engine.snapshot.metrics).toMatchObject({
      households: 2,
      population: 8,
      housingCapacity: 8,
      openHousingCapacity: 0,
    })
  })

  it('keeps migrants away when city attraction is too low', () => {
    const snapshot = createInitialSimulationSnapshot({
      taxRate: 0.5,
      buildings: {},
    })
    const engine = new SimulationEngine(snapshot, {
      buildingDefinitions: definitions,
      migrationIntervalTicks: 1,
      householdSize: [4, 4],
    })

    const events = engine.step()

    expect(events.some((event) => event.type === 'migration-candidate-arrived')).toBe(false)
    expect(engine.snapshot.metrics.cityAttraction).toBeLessThan(35)
    expect(engine.snapshot.migrationCandidates).toEqual({})
  })

  it('lets waiting migrants leave when no housing opens before patience expires', () => {
    const snapshot = createInitialSimulationSnapshot({
      buildings: {
        work: building('work', 'workshop'),
      },
    })
    snapshot.migrationCandidates = {
      visitor: {
        id: 'visitor',
        members: 3,
        workerCount: 1,
        status: 'waiting',
        arrivedTick: 0,
        patienceTicks: 2,
        attractionAtArrival: 50,
      },
    }
    const engine = new SimulationEngine(snapshot, {
      buildingDefinitions: definitions,
      migrationIntervalTicks: 100,
    })

    const events = engine.step(2)

    expect(events).toContainEqual({
      type: 'migration-candidate-left',
      candidateId: 'visitor',
      reason: 'no-housing',
    })
    expect(engine.snapshot.migrationCandidates).toEqual({})
  })

  it('migrates households out when satisfaction reaches the threshold', () => {
    const snapshot = createInitialSimulationSnapshot({
      buildings: {
        home: building('home', 'house'),
      },
    })
    const household: HouseholdState = {
      id: 'unhappy',
      homeBuildingId: 'home',
      members: 2,
      workerIds: ['worker-1'],
      income: 0,
      satisfaction: 10,
      needs: {
        food: 0,
        goods: 0,
        health: 0,
        education: 0,
        entertainment: 0,
      },
    }
    snapshot.households[household.id] = household
    snapshot.agents['worker-1'] = {
      id: 'worker-1',
      role: 'worker',
      householdId: household.id,
      position: { x: 0, y: 0 },
      path: [],
      pathIndex: 0,
      activity: 'home',
    }

    const engine = new SimulationEngine(snapshot, {
      buildingDefinitions: definitions,
      migrationIntervalTicks: 100,
    })
    expect(engine.step()).toContainEqual({
      type: 'household-migrated',
      householdId: 'unhappy',
      direction: 'out',
    })
    expect(engine.snapshot.households).toEqual({})
    expect(engine.snapshot.agents).toEqual({})
  })

  it('makes a critical service shortage plus unemployment trigger migration pressure', () => {
    const snapshot = createInitialSimulationSnapshot({
      buildings: {
        home: building('home', 'house'),
      },
    })
    snapshot.households.family = {
      id: 'family',
      homeBuildingId: 'home',
      members: 2,
      workerIds: ['worker-1'],
      income: 0,
      satisfaction: 22,
      needs: {
        food: 0,
        goods: 100,
        health: 100,
        education: 100,
        entertainment: 100,
      },
    }
    snapshot.agents['worker-1'] = {
      id: 'worker-1',
      role: 'worker',
      householdId: 'family',
      position: { x: 0, y: 0 },
      path: [],
      pathIndex: 0,
      activity: 'home',
    }

    const engine = new SimulationEngine(snapshot, {
      buildingDefinitions: definitions,
      migrationIntervalTicks: 100,
    })

    expect(engine.step()).toContainEqual({
      type: 'household-migrated',
      householdId: 'family',
      direction: 'out',
    })
  })

  it('lets restored service needs stabilize and recover household satisfaction', () => {
    const restoreFood: SimulationSystem = {
      id: 'test.restore-food',
      update(state) {
        for (const household of Object.values(state.households)) {
          household.needs.food = 100
        }
        return []
      },
    }
    const snapshot = createInitialSimulationSnapshot({
      buildings: {
        home: building('home', 'house'),
        work: building('work', 'workshop'),
      },
    })
    snapshot.households.family = {
      id: 'family',
      homeBuildingId: 'home',
      members: 2,
      workerIds: ['worker-1'],
      income: 0,
      satisfaction: 40,
      needs: {
        food: 5,
        goods: 100,
        health: 100,
        education: 100,
        entertainment: 100,
      },
    }
    snapshot.agents['worker-1'] = {
      id: 'worker-1',
      role: 'worker',
      householdId: 'family',
      position: { x: 0, y: 0 },
      path: [],
      pathIndex: 0,
      activity: 'home',
    }

    const engine = new SimulationEngine(snapshot, {
      buildingDefinitions: definitions,
      systems: [restoreFood],
      migrationIntervalTicks: 100,
    })

    engine.step(8)

    expect(engine.snapshot.households.family.satisfaction).toBeGreaterThan(40)
  })

  it('turns market stockouts into visible household satisfaction pressure', () => {
    const snapshot = createInitialSimulationSnapshot({
      buildings: {
        home: building('home', 'house'),
        market: building('market', 'market'),
      },
    })
    snapshot.households.family = {
      id: 'family',
      homeBuildingId: 'home',
      members: 2,
      workerIds: ['worker-1'],
      income: 0,
      satisfaction: 60,
      needs: {
        food: 35,
        goods: 100,
        health: 100,
        education: 100,
        entertainment: 100,
      },
    }
    snapshot.agents['worker-1'] = {
      id: 'worker-1',
      role: 'worker',
      householdId: 'family',
      position: { x: 0, y: 1 },
      path: [],
      pathIndex: 0,
      activity: 'home',
    }

    const engine = new SimulationEngine(snapshot, {
      buildingDefinitions: definitions,
      systems: [new EconomySystem({ definitions })],
      migrationIntervalTicks: 100,
      migrationOutThreshold: 0,
    })

    engine.step(6)

    const family = engine.snapshot.households.family
    expect(family.needs.food).toBeLessThan(35)
    expect(family.satisfaction).toBeLessThan(60)
    expect(engine.snapshot.buildings.market.statusReason).toBe('missing-service-resource:food')
  })

  it('is reproducible from the same snapshot and seed', () => {
    const first = createEngine(999)
    const second = createEngine(999)
    first.step(2)
    second.step(2)
    expect(first.snapshot).toEqual(second.snapshot)
  })

  it('returns defensive snapshot copies', () => {
    const engine = createEngine()
    const copy = engine.snapshot
    copy.tick = 100
    expect(engine.snapshot.tick).toBe(0)
  })
})
