import { describe, expect, it } from 'vitest'
import type {
  BuildingDefinition,
  BuildingEntity,
  HouseholdState,
} from '../contracts'
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
    const events = engine.step()
    const snapshot = engine.snapshot
    const household = Object.values(snapshot.households)[0]

    expect(events).toContainEqual({
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
    })
    expect(snapshot.buildings.work.workers).toHaveLength(2)
    expect(household.income).toBe(0)

    engine.step()
    expect(Object.values(engine.snapshot.households)[0].income).toBe(20)
  })

  it('does not overfill housing with a household that cannot fit', () => {
    const engine = createEngine()
    engine.step(3)
    expect(engine.snapshot.metrics).toMatchObject({
      households: 2,
      population: 8,
      housingCapacity: 8,
    })
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
