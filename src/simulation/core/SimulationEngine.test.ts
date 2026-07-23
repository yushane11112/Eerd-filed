import { describe, expect, it } from 'vitest'
import type {
  BuildingDefinition,
  BuildingEntity,
  HouseholdState,
  SimulationSystem,
  WorldCell,
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
    expect(waiting.position).toEqual({ x: 2, y: 1 })
    expect(waiting.targetHomeBuildingId).toBe('home')

    const movingEvents = engine.step()
    const moving = Object.values(engine.snapshot.migrationCandidates ?? {})[0]

    expect(movingEvents).not.toContainEqual({
      type: 'household-migrated',
      householdId: expect.any(String),
      direction: 'in',
    })
    expect(moving).toMatchObject({
      id: waiting.id,
      status: 'walking',
      position: { x: 2, y: 1 },
      path: [
        { x: 2, y: 1 },
        { x: 1, y: 1 },
        { x: 0, y: 1 },
      ],
      pathIndex: 0,
    })

    engine.step()
    expect(Object.values(engine.snapshot.migrationCandidates ?? {})[0]).toMatchObject({
      status: 'walking',
      position: { x: 1, y: 1 },
      pathIndex: 1,
    })

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
    })
    expect(household).toMatchObject({ origin: 'migrated', settledTick: snapshot.tick })
    expect(snapshot.metrics.waitingMigrants).toBeGreaterThan(0)
    expect(snapshot.populationFlow).toMatchObject({ householdsIn: 1, residentsIn: 4 })
    expect(snapshot.metrics).toMatchObject({ migrationIn: 1, migrationOut: 0, netMigration: 1 })
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

  it('routes walking migration candidates along roads when a road path is available', () => {
    const home = {
      ...building('home', 'house'),
      entrance: { x: 2, y: 1 },
    }
    const snapshot = createInitialSimulationSnapshot({
      buildings: {
        home,
        work: building('work', 'workshop'),
      },
    })
    snapshot.cells = migrationRouteCells()
    snapshot.migrationCandidates = {
      visitor: {
        id: 'visitor',
        members: 4,
        workerCount: 2,
        status: 'waiting',
        position: { x: 0, y: 1 },
        targetHomeBuildingId: 'home',
        arrivedTick: 0,
        patienceTicks: 6,
        attractionAtArrival: 80,
      },
    }
    const engine = new SimulationEngine(snapshot, {
      buildingDefinitions: definitions,
      migrationIntervalTicks: 100,
      householdSize: [4, 4],
    })

    engine.step()

    expect(engine.snapshot.migrationCandidates?.visitor).toMatchObject({
      status: 'walking',
      path: [
        { x: 0, y: 1 },
        { x: 0, y: 2 },
        { x: 1, y: 2 },
        { x: 2, y: 2 },
        { x: 2, y: 1 },
      ],
      pathIndex: 0,
    })
  })

  it('gives employed workers a visible commute and return-home loop along shared road paths', () => {
    const home = {
      ...building('home', 'house'),
      entrance: { x: 0, y: 1 },
    }
    const work = {
      ...building('work', 'workshop'),
      entrance: { x: 2, y: 1 },
    }
    const snapshot = createInitialSimulationSnapshot({
      buildings: { home, work },
    })
    snapshot.cells = migrationRouteCells()
    snapshot.households.family = {
      id: 'family',
      homeBuildingId: 'home',
      members: 2,
      workerIds: ['worker-1'],
      income: 0,
      satisfaction: 70,
      needs: {
        food: 100,
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
      migrationIntervalTicks: 100,
    })

    engine.step()

    expect(engine.snapshot.agents['worker-1']).toMatchObject({
      employerBuildingId: 'work',
      activity: 'commuting',
      position: { x: 0, y: 1 },
      path: [
        { x: 0, y: 1 },
        { x: 0, y: 2 },
        { x: 1, y: 2 },
        { x: 2, y: 2 },
        { x: 2, y: 1 },
      ],
      pathIndex: 0,
    })

    engine.step()

    expect(engine.snapshot.agents['worker-1']).toMatchObject({
      activity: 'commuting',
      position: { x: 0, y: 2 },
      pathIndex: 1,
    })

    engine.step(3)

    expect(engine.snapshot.agents['worker-1']).toMatchObject({
      activity: 'working',
      position: { x: 2, y: 1 },
      pathIndex: 4,
    })

    engine.step(4)

    expect(engine.snapshot.agents['worker-1']).toMatchObject({
      activity: 'returning',
      position: { x: 2, y: 1 },
      path: [
        { x: 2, y: 1 },
        { x: 2, y: 2 },
        { x: 1, y: 2 },
        { x: 0, y: 2 },
        { x: 0, y: 1 },
      ],
      pathIndex: 0,
    })

    engine.step()

    expect(engine.snapshot.agents['worker-1']).toMatchObject({
      activity: 'returning',
      position: { x: 2, y: 2 },
      pathIndex: 1,
    })

    engine.step(3)

    expect(engine.snapshot.agents['worker-1']).toMatchObject({
      activity: 'home',
      position: { x: 0, y: 1 },
      pathIndex: 4,
    })
  })

  it('turns low resident health into absence and restores the work route after recovery', () => {
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
      satisfaction: 70,
      needs: {
        food: 100,
        goods: 100,
        health: 20,
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
      migrationIntervalTicks: 100,
    })

    const absentEvents = engine.step()
    expect(absentEvents).toContainEqual({
      type: 'worker-employment-changed',
      workerId: 'worker-1',
      householdId: 'family',
      buildingId: 'work',
    })
    expect(absentEvents).toContainEqual({
      type: 'worker-attendance-changed',
      workerId: 'worker-1',
      householdId: 'family',
      buildingId: 'work',
      status: 'absent',
      reason: 'low-health',
    })
    expect(engine.snapshot.agents['worker-1']).toMatchObject({
      employerBuildingId: 'work',
      workStatus: 'absent',
      absenceReason: 'low-health',
      activity: 'home',
    })

    const recovered = engine.snapshot
    recovered.households.family.needs.health = 80
    recovered.households.family.satisfaction = 80
    const recoveredEngine = new SimulationEngine(recovered, {
      buildingDefinitions: definitions,
      migrationIntervalTicks: 100,
    })
    expect(recoveredEngine.step()).toContainEqual({
      type: 'worker-attendance-changed',
      workerId: 'worker-1',
      householdId: 'family',
      buildingId: 'work',
      status: 'present',
      reason: 'recovered',
    })
    expect(['commuting', 'working']).toContain(recoveredEngine.snapshot.agents['worker-1'].activity)
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

  it('feeds public service coverage into the city attraction score', () => {
    const snapshot = createInitialSimulationSnapshot({
      buildings: { home: building('home', 'house') },
    })
    snapshot.households = {
      family: {
        id: 'family',
        homeBuildingId: 'home',
        members: 2,
        workerIds: [],
        income: 0,
        satisfaction: 70,
        needs: { food: 100, goods: 100, health: 100, education: 100, entertainment: 100 },
      },
    }
    const healthy = new SimulationEngine(snapshot, { buildingDefinitions: definitions })
    const pressuredSnapshot = healthy.snapshot
    pressuredSnapshot.households.family.needs.health = 30
    pressuredSnapshot.households.family.needs.education = 30
    pressuredSnapshot.households.family.needs.entertainment = 30
    const pressured = new SimulationEngine(pressuredSnapshot, { buildingDefinitions: definitions })

    expect(healthy.snapshot.metrics.publicServiceCoverage).toBe(100)
    expect(pressured.snapshot.metrics.publicServiceCoverage).toBe(30)
    expect(healthy.snapshot.metrics.cityAttraction).toBeGreaterThan(pressured.snapshot.metrics.cityAttraction ?? 0)
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
        position: { x: 0, y: 1 },
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
    const result = engine.advance(200)
    expect(result.events).toContainEqual({
      type: 'household-migrated',
      householdId: 'unhappy',
      direction: 'out',
      reason: 'critical-needs',
      need: 'food',
    })
    expect(engine.snapshot.households).toEqual({})
    expect(engine.snapshot.agents).toEqual({})
    expect(result.departedResidents?.unhappy).toMatchObject({
      phase: 'departed', members: 2, workerCount: 1, employedCount: 0,
      occupations: ['待业'], satisfaction: 0,
    })
    expect(engine.snapshot.populationFlow).toMatchObject({
      householdsOut: 1,
      residentsOut: 2,
      departuresByReason: { 'critical-needs': 1 },
      departuresByHousing: { house: 1 },
      departuresByOccupation: { unemployed: 1 },
      employedWorkersOut: 0,
      unemployedWorkersOut: 1,
    })
  })

  it('keeps an employed resident profile and occupation ledger when a household leaves', () => {
    const snapshot = createInitialSimulationSnapshot({
      buildings: {
        home: building('home', 'house'),
        work: building('work', 'workshop'),
      },
    })
    snapshot.buildings.work.workers = ['worker-1']
    snapshot.households.employed = {
      id: 'employed',
      homeBuildingId: 'home',
      members: 2,
      workerIds: ['worker-1'],
      income: 20,
      satisfaction: 10,
      needs: { food: 0, goods: 100, health: 100, education: 100, entertainment: 100 },
    }
    snapshot.agents['worker-1'] = {
      id: 'worker-1',
      role: 'worker',
      householdId: 'employed',
      employerBuildingId: 'work',
      position: { x: 0, y: 0 },
      path: [],
      pathIndex: 0,
      activity: 'working',
    }

    const engine = new SimulationEngine(snapshot, {
      buildingDefinitions: definitions,
      migrationIntervalTicks: 100,
    })
    const result = engine.advance(200)

    expect(result.events).toContainEqual({
      type: 'household-migrated',
      householdId: 'employed',
      direction: 'out',
      reason: 'critical-needs',
      need: 'food',
    })
    expect(result.departedResidents?.employed).toMatchObject({
      phase: 'departed',
      employedCount: 1,
      occupations: ['木作坊'],
    })
    expect(engine.snapshot.populationFlow).toMatchObject({
      employedWorkersOut: 1,
      unemployedWorkersOut: 0,
      departuresByOccupation: { workshop: 1 },
    })
    expect(engine.snapshot.buildings.work.workers).toEqual([])
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
      reason: 'critical-needs',
      need: 'food',
    })
  })

  it('records chronic absence as the migration pressure when needs are stable', () => {
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
      satisfaction: 20,
      needs: {
        food: 100,
        goods: 100,
        health: 100,
        education: 100,
        entertainment: 100,
      },
      absenceTicks: 4,
    }
    snapshot.agents['worker-1'] = {
      id: 'worker-1',
      role: 'worker',
      householdId: 'family',
      employerBuildingId: 'work',
      workStatus: 'absent',
      position: { x: 0, y: 0 },
      path: [],
      pathIndex: 0,
      activity: 'home',
    }
    snapshot.buildings.work.workers = ['worker-1']

    const engine = new SimulationEngine(snapshot, {
      buildingDefinitions: definitions,
      migrationIntervalTicks: 100,
      systems: [{
        id: 'test.keep-low-satisfaction',
        update(state) {
          state.households.family.satisfaction = 20
          return []
        },
      }],
    })

    expect(engine.step()).toContainEqual({
      type: 'household-migrated',
      householdId: 'family',
      direction: 'out',
      reason: 'chronic-absence',
      absenceTicks: 5,
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

  it('records blockage consequences and their duration delta through the real engine loop', () => {
    const snapshot = createInitialSimulationSnapshot({
      buildings: {
        home: building('home', 'house'),
        work: building('work', 'workshop'),
      },
    })
    const blockageLifecycle: SimulationSystem = {
      id: 'test.blockage-lifecycle',
      update(state) {
        const work = state.buildings.work
        if (state.tick === 1) {
          work.status = 'blocked'
          work.statusReason = 'missing-input:wood'
          work.inventory.wood = 2
        } else if (state.tick === 2) {
          work.inventory.wood = 5
        } else if (state.tick === 3) {
          work.status = 'working'
          delete work.statusReason
        }
        return []
      },
    }
    const engine = new SimulationEngine(snapshot, {
      buildingDefinitions: definitions,
      systems: [blockageLifecycle],
      migrationIntervalTicks: 100,
    })

    const started = engine.step()
    engine.step()
    const cleared = engine.step()

    expect(started).toContainEqual(expect.objectContaining({
      type: 'building-blockage-started',
      buildingId: 'work',
      consequences: expect.objectContaining({ inventoryTotal: 2 }),
    }))
    expect(cleared).toContainEqual(expect.objectContaining({
      type: 'building-blockage-cleared',
      buildingId: 'work',
      durationTicks: 2,
      consequencesAtStart: expect.objectContaining({ inventoryTotal: 2 }),
      consequences: expect.objectContaining({ inventoryTotal: 5 }),
      consequenceDelta: expect.objectContaining({ inventoryDelta: 3 }),
    }))
  })

  it('closes and restarts the lifecycle when a blockage reason changes', () => {
    const snapshot = createInitialSimulationSnapshot({
      buildings: {
        home: building('home', 'house'),
        work: building('work', 'workshop'),
      },
    })
    const changingBlockage: SimulationSystem = {
      id: 'test.changing-blockage',
      update(state) {
        const work = state.buildings.work
        work.status = state.tick < 3 ? 'blocked' : 'working'
        if (state.tick === 1) {
          work.statusReason = 'missing-input:wood'
          work.inventory.wood = 2
        } else if (state.tick === 2) {
          work.statusReason = 'logistics-failed:wood:no-route'
          work.inventory.wood = 3
        } else {
          delete work.statusReason
          work.inventory.wood = 5
        }
        return []
      },
    }
    const engine = new SimulationEngine(snapshot, {
      buildingDefinitions: definitions,
      systems: [changingBlockage],
      migrationIntervalTicks: 100,
    })

    const firstTick = engine.step()
    const secondTick = engine.step()
    const thirdTick = engine.step()

    expect(firstTick.filter((event) => event.type === 'building-blockage-started')).toHaveLength(1)
    expect(secondTick).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'building-blockage-cleared', reason: 'missing-input:wood', durationTicks: 1 }),
      expect.objectContaining({ type: 'building-blockage-started', reason: 'logistics-failed:wood:no-route', blockedSinceTick: 2 }),
    ]))
    expect(thirdTick).toContainEqual(expect.objectContaining({
      type: 'building-blockage-cleared',
      reason: 'logistics-failed:wood:no-route',
      durationTicks: 1,
      consequenceDelta: expect.objectContaining({ inventoryDelta: 2 }),
    }))
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

function migrationRouteCells(): WorldCell[] {
  const roads = new Set(['0,1', '0,2', '1,2', '2,2'])
  return [
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
    { x: 0, y: 2 },
    { x: 1, y: 2 },
    { x: 2, y: 2 },
  ].map((point) => ({
    point,
    terrain: 'land',
    elevation: 0,
    road: roads.has(`${point.x},${point.y}`) ? 'stone' : undefined,
  }))
}
