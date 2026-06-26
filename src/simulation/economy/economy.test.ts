import { describe, expect, it } from 'vitest'
import type {
  AgentEntity,
  BuildingDefinition,
  BuildingEntity,
  GridPoint,
  SimulationSnapshot,
  WorldCell,
} from '../contracts'
import { EconomySystem } from './EconomySystem'
import { FiscalSystem } from './fiscal'
import {
  addInventory,
  inventoryFreeCapacity,
  removeInventory,
} from './inventory'
import { LogisticsSystem, RoadRoutePlanner } from './logistics'
import { ProductionSystem } from './production'

const definitions: Record<string, BuildingDefinition> = {
  farm: {
    type: 'farm',
    name: '稻田',
    category: 'production',
    footprint: [{ x: 0, y: 0 }],
    entrance: { x: 0, y: 0 },
    maxLevel: 8,
    jobs: 2,
    capacity: 20,
    production: {
      durationTicks: 2,
      inputs: {},
      outputs: { food: 4 },
    },
  },
  eatery: {
    type: 'eatery',
    name: '食肆',
    category: 'production',
    footprint: [{ x: 0, y: 0 }],
    entrance: { x: 0, y: 0 },
    maxLevel: 8,
    jobs: 2,
    capacity: 10,
    production: {
      durationTicks: 2,
      inputs: { food: 2, salt: 1 },
      outputs: { medicine: 1 },
    },
  },
  granary: {
    type: 'granary',
    name: '粮仓',
    category: 'storage',
    footprint: [{ x: 0, y: 0 }],
    entrance: { x: 0, y: 0 },
    maxLevel: 8,
    jobs: 1,
    capacity: 100,
  },
}

function road(from: number, to: number): WorldCell[] {
  return Array.from({ length: to - from + 1 }, (_, offset) => ({
    point: { x: from + offset, y: 0 },
    terrain: 'land' as const,
    elevation: 0,
    road: 'dirt' as const,
  }))
}

function building(
  id: string,
  type: string,
  entrance: GridPoint,
  inventory: BuildingEntity['inventory'] = {},
): BuildingEntity {
  return {
    id,
    type,
    origin: entrance,
    rotation: 0,
    level: 1,
    entrance,
    status: 'idle',
    workers: type === 'granary' ? [] : ['worker-1'],
    inventory,
    productionProgress: 0,
  }
}

function carrier(id: string, position: GridPoint): AgentEntity {
  return {
    id,
    role: 'cart',
    position,
    path: [],
    pathIndex: 0,
    activity: 'idle',
  }
}

function snapshot(overrides: Partial<SimulationSnapshot> = {}): SimulationSnapshot {
  return {
    version: 6,
    seed: 42,
    tick: 1,
    speed: 1,
    cells: road(0, 6),
    buildings: {},
    households: {},
    agents: {},
    logisticsOrders: {},
    economy: {
      treasury: 100,
      taxRate: 0.1,
      lastTaxIncome: 0,
      lastMaintenanceCost: 0,
    },
    metrics: {
      population: 0,
      households: 0,
      employedWorkers: 0,
      availableJobs: 0,
      housingCapacity: 0,
      satisfaction: 1,
      logisticsEfficiency: 1,
    },
    worldDrops: [],
    rareRewards: {
      missesSinceReward: 0,
      rewardsToday: 0,
      dayKey: '2026-06-25',
      processedEventIds: [],
      inventory: {},
    },
    ...overrides,
  }
}

describe('building inventory', () => {
  it('enforces stock and total building capacity', () => {
    const store = building('store', 'granary', { x: 0, y: 0 }, { food: 98 })

    expect(inventoryFreeCapacity(store, definitions.granary)).toBe(2)
    expect(addInventory(store, definitions.granary, 'salt', 3)).toEqual({
      ok: false,
      reason: 'insufficient-capacity',
    })
    expect(removeInventory(store, 'food', 99)).toEqual({
      ok: false,
      reason: 'insufficient-stock',
    })
    expect(addInventory(store, definitions.granary, 'salt', 2).ok).toBe(true)
    expect(store.inventory).toEqual({ food: 98, salt: 2 })
  })
})

describe('production system', () => {
  it('consumes inputs only when a cycle completes and adds real output', () => {
    const eatery = building('eatery-1', 'eatery', { x: 3, y: 0 }, { food: 2, salt: 1 })
    eatery.workers = ['worker-1', 'worker-2']
    const state = snapshot({ buildings: { [eatery.id]: eatery } })
    const system = new ProductionSystem({ definitions })

    expect(system.update(state)).toContainEqual({
      type: 'building-state-changed',
      buildingId: eatery.id,
    })
    expect(eatery.inventory).toEqual({ food: 2, salt: 1 })
    const events = system.update(state)

    expect(events).toContainEqual({ type: 'production-completed', buildingId: eatery.id })
    expect(eatery.inventory).toEqual({ medicine: 1 })
    expect(eatery.productionProgress).toBe(0)
  })

  it('reports actionable stop reasons for workers, inputs and full output storage', () => {
    const noWorkers = building('farm-1', 'farm', { x: 0, y: 0 })
    noWorkers.workers = []
    const missingInput = building('eatery-1', 'eatery', { x: 2, y: 0 }, { food: 2 })
    const full = building('farm-2', 'farm', { x: 4, y: 0 }, { stone: 20 })
    const state = snapshot({
      buildings: {
        [noWorkers.id]: noWorkers,
        [missingInput.id]: missingInput,
        [full.id]: full,
      },
    })

    new ProductionSystem({ definitions }).update(state)

    expect(noWorkers.statusReason).toBe('no-workers')
    expect(missingInput.statusReason).toBe('missing-input:salt')
    expect(full.statusReason).toBe('output-full')
    expect(Object.values(state.buildings).every((item) => item.status === 'blocked')).toBe(true)
  })
})

describe('road logistics', () => {
  it('finds only connected four-direction road routes', () => {
    const planner = new RoadRoutePlanner()
    expect(planner.findRoute(road(0, 3), { x: 0, y: 0 }, { x: 3, y: 0 })).toHaveLength(4)
    expect(planner.findRoute(
      road(0, 1),
      { x: 0, y: 0 },
      { x: 3, y: 0 },
    )).toBeUndefined()
  })

  it('creates an order, reserves stock and transports it one grid cell per update', () => {
    const source = building('granary-1', 'granary', { x: 0, y: 0 }, { food: 8, salt: 5 })
    const destination = building('eatery-1', 'eatery', { x: 4, y: 0 })
    const cart = carrier('cart-1', { x: 0, y: 0 })
    const state = snapshot({
      buildings: { [source.id]: source, [destination.id]: destination },
      agents: { [cart.id]: cart },
    })
    let orderSequence = 0
    const system = new LogisticsSystem({
      definitions,
      idFactory: () => `order-${++orderSequence}`,
    })

    const firstEvents = system.update(state)
    const foodOrder = Object.values(state.logisticsOrders).find((order) => order.resource === 'food')!

    expect(firstEvents).toContainEqual({ type: 'logistics-order-created', orderId: foodOrder.id })
    expect(foodOrder.state).toBe('in_transit')
    expect(source.inventory.food).toBe(4)
    expect(destination.inventory.food).toBeUndefined()
    expect(cart.position).toEqual({ x: 0, y: 0 })

    system.update(state)
    expect(cart.position).toEqual({ x: 1, y: 0 })
    expect(destination.inventory.food).toBeUndefined()

    system.update(state)
    system.update(state)
    expect(destination.inventory.food).toBeUndefined()
    system.update(state)

    expect(foodOrder.state).toBe('delivered')
    expect(destination.inventory.food).toBe(4)
    expect(cart.activity).toBe('idle')
  })

  it('does not create an order or move goods across a disconnected road', () => {
    const source = building('granary-1', 'granary', { x: 0, y: 0 }, { food: 8 })
    const destination = building('eatery-1', 'eatery', { x: 4, y: 0 }, { salt: 2 })
    const state = snapshot({
      cells: road(0, 1),
      buildings: { [source.id]: source, [destination.id]: destination },
      agents: { cart: carrier('cart', { x: 0, y: 0 }) },
    })

    new LogisticsSystem({ definitions }).update(state)

    expect(Object.keys(state.logisticsOrders)).toHaveLength(0)
    expect(source.inventory.food).toBe(8)
    expect(destination.inventory.food).toBeUndefined()
  })

  it('reserves source stock across simultaneous orders instead of overselling it', () => {
    const source = building('granary-1', 'granary', { x: 0, y: 0 }, { food: 5 })
    const first = building('eatery-1', 'eatery', { x: 3, y: 0 }, { salt: 2 })
    const second = building('eatery-2', 'eatery', { x: 6, y: 0 }, { salt: 2 })
    const state = snapshot({
      buildings: { [source.id]: source, [first.id]: first, [second.id]: second },
    })

    new LogisticsSystem({ definitions }).update(state)

    const orderedFood = Object.values(state.logisticsOrders)
      .filter((order) => order.resource === 'food')
      .reduce((total, order) => total + order.amount, 0)
    expect(orderedFood).toBe(5)
    expect(source.inventory.food).toBe(5)
  })
})

describe('fiscal system', () => {
  it('collects household tax and charges per-building maintenance on schedule', () => {
    const state = snapshot({
      tick: 10,
      buildings: {
        farm: building('farm', 'farm', { x: 0, y: 0 }),
        store: building('store', 'granary', { x: 1, y: 0 }),
      },
      households: {
        home: {
          id: 'home',
          homeBuildingId: 'house',
          members: 3,
          workerIds: ['worker'],
          income: 200,
          satisfaction: 1,
          needs: { food: 1, goods: 1, health: 1, education: 1, entertainment: 1 },
        },
      },
    })
    const system = new FiscalSystem({
      definitions,
      settlementIntervalTicks: 10,
      maintenanceCost: () => 3,
    })

    system.update(state)

    expect(state.economy.lastTaxIncome).toBe(20)
    expect(state.economy.lastMaintenanceCost).toBe(6)
    expect(state.economy.treasury).toBe(114)
  })
})

describe('integrated economy order', () => {
  it('runs production before logistics and fiscal settlement deterministically', () => {
    const farm = building('farm', 'farm', { x: 0, y: 0 })
    farm.workers = ['a', 'b']
    farm.productionProgress = 1
    const eatery = building('eatery', 'eatery', { x: 2, y: 0 }, { salt: 2 })
    const state = snapshot({
      tick: 5,
      buildings: { farm, eatery },
      agents: { cart: carrier('cart', { x: 0, y: 0 }) },
    })
    const system = new EconomySystem({
      definitions,
      settlementIntervalTicks: 5,
      maintenanceCost: () => 1,
      idFactory: () => 'food-order',
    })

    const events = system.update(state)

    expect(events).toContainEqual({ type: 'production-completed', buildingId: 'farm' })
    expect(events).toContainEqual({ type: 'logistics-order-created', orderId: 'food-order' })
    expect(state.logisticsOrders['food-order'].state).toBe('in_transit')
    expect(eatery.inventory.food).toBeUndefined()
    expect(state.economy.lastMaintenanceCost).toBe(2)
  })
})
