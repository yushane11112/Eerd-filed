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
import { ServiceSystem } from './service'

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
  market: {
    type: 'market',
    name: '集市',
    category: 'market',
    footprint: [{ x: 0, y: 0 }],
    entrance: { x: 0, y: 0 },
    maxLevel: 8,
    jobs: 2,
    capacity: 30,
  },
  pharmacy: {
    type: 'pharmacy',
    name: '药铺',
    category: 'service',
    footprint: [{ x: 0, y: 0 }],
    entrance: { x: 0, y: 0 },
    maxLevel: 8,
    jobs: 1,
    capacity: 20,
  },
  academy: {
    type: 'academy',
    name: '书院',
    category: 'service',
    footprint: [{ x: 0, y: 0 }],
    entrance: { x: 0, y: 0 },
    maxLevel: 8,
    jobs: 2,
    capacity: 16,
  },
  theatre: {
    type: 'theatre',
    name: '戏台',
    category: 'service',
    footprint: [{ x: 0, y: 0 }],
    entrance: { x: 0, y: 0 },
    maxLevel: 8,
    jobs: 2,
    capacity: 16,
  },
  house: {
    type: 'house',
    name: '民居',
    category: 'housing',
    footprint: [{ x: 0, y: 0 }],
    entrance: { x: 0, y: 0 },
    maxLevel: 8,
    jobs: 0,
    capacity: 8,
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

function household(
  id: string,
  homeBuildingId: string,
  needs: SimulationSnapshot['households'][string]['needs'],
  income = 100,
): SimulationSnapshot['households'][string] {
  return {
    id,
    homeBuildingId,
    members: 3,
    workerIds: [],
    income,
    satisfaction: 50,
    needs,
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

  it('does not route freight through invalid water or occupied road cells', () => {
    const planner = new RoadRoutePlanner()
    const blockedCells = road(0, 3).map((cell) => {
      if (cell.point.x === 1) return { ...cell, terrain: 'water' as const }
      if (cell.point.x === 2) return { ...cell, buildingId: 'blocking-building' }
      return cell
    })

    expect(planner.findRoute(blockedCells, { x: 0, y: 0 }, { x: 3, y: 0 })).toBeUndefined()
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
    expect(cart.cargoIntent).toEqual({
      orderId: foodOrder.id,
      resource: 'food',
      amount: 4,
      sourceBuildingId: source.id,
      destinationBuildingId: destination.id,
      phase: 'dropoff',
    })
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
    expect(cart.cargoIntent).toBeUndefined()
  })

  it('marks carrier cargo intent as pickup before source arrival', () => {
    const source = building('granary-1', 'granary', { x: 2, y: 0 }, { food: 8 })
    const destination = building('eatery-1', 'eatery', { x: 4, y: 0 })
    const cart = carrier('cart-1', { x: 0, y: 0 })
    const state = snapshot({
      buildings: { [source.id]: source, [destination.id]: destination },
      agents: { [cart.id]: cart },
      logisticsOrders: {
        'food-order': {
          id: 'food-order',
          resource: 'food',
          amount: 2,
          sourceBuildingId: source.id,
          destinationBuildingId: destination.id,
          priority: 50,
          state: 'waiting',
        },
      },
    })

    new LogisticsSystem({ definitions }).update(state)

    expect(state.logisticsOrders['food-order']).toMatchObject({
      state: 'assigned',
      carrierId: cart.id,
    })
    expect(cart.position).toEqual({ x: 1, y: 0 })
    expect(cart.cargoIntent).toEqual({
      orderId: 'food-order',
      resource: 'food',
      amount: 2,
      sourceBuildingId: source.id,
      destinationBuildingId: destination.id,
      phase: 'pickup',
    })
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
    expect(destination.statusReason).toBe('logistics-failed:food:no-route')
    expect(state.metrics.logisticsEfficiency).toBe(0)
  })

  it('reports missing source inventory and lowers logistics efficiency when no order can be made', () => {
    const destination = building('eatery-1', 'eatery', { x: 4, y: 0 }, { salt: 2 })
    const state = snapshot({
      buildings: { [destination.id]: destination },
    })

    new LogisticsSystem({ definitions }).update(state)

    expect(Object.keys(state.logisticsOrders)).toHaveLength(0)
    expect(destination.statusReason).toBe('logistics-failed:food:no-source-inventory')
    expect(state.metrics.logisticsEfficiency).toBe(0)
  })

  it('reports source stock made unavailable by existing reservations', () => {
    const source = building('granary-1', 'granary', { x: 0, y: 0 }, { food: 4 })
    const reservedDestination = building('eatery-1', 'eatery', { x: 3, y: 0 }, { salt: 2 })
    const destination = building('eatery-2', 'eatery', { x: 4, y: 0 }, { salt: 2 })
    const state = snapshot({
      buildings: {
        [source.id]: source,
        [reservedDestination.id]: reservedDestination,
        [destination.id]: destination,
      },
      logisticsOrders: {
        reserved: {
          id: 'reserved',
          resource: 'food',
          amount: 4,
          sourceBuildingId: source.id,
          destinationBuildingId: reservedDestination.id,
          priority: 50,
          state: 'waiting',
        },
      },
    })

    new LogisticsSystem({ definitions }).update(state)

    expect(destination.statusReason).toBe('logistics-failed:food:source-inventory-insufficient')
    expect(state.metrics.logisticsEfficiency).toBe(0)
  })

  it('keeps waiting orders visible as no-carrier failures in efficiency', () => {
    const source = building('granary-1', 'granary', { x: 0, y: 0 }, { food: 8 })
    const destination = building('eatery-1', 'eatery', { x: 4, y: 0 }, { salt: 2 })
    const state = snapshot({
      buildings: { [source.id]: source, [destination.id]: destination },
    })

    new LogisticsSystem({
      definitions,
      idFactory: () => 'food-order',
    }).update(state)

    expect(state.logisticsOrders['food-order']).toMatchObject({
      resource: 'food',
      state: 'waiting',
    })
    expect(destination.statusReason).toBe('logistics-failed:food:no-carrier')
    expect(state.metrics.logisticsEfficiency).toBe(0)
  })

  it('records no-route on a waiting order when a carrier cannot reach its source', () => {
    const source = building('granary-1', 'granary', { x: 4, y: 0 }, { food: 8 })
    const destination = building('eatery-1', 'eatery', { x: 5, y: 0 }, { salt: 2 })
    const state = snapshot({
      cells: road(0, 1),
      buildings: { [source.id]: source, [destination.id]: destination },
      agents: { cart: carrier('cart', { x: 0, y: 0 }) },
      logisticsOrders: {
        'food-order': {
          id: 'food-order',
          resource: 'food',
          amount: 2,
          sourceBuildingId: source.id,
          destinationBuildingId: destination.id,
          priority: 50,
          state: 'waiting',
        },
      },
    })

    new LogisticsSystem({ definitions }).update(state)

    expect(state.logisticsOrders['food-order']).toMatchObject({
      state: 'waiting',
      failureReason: 'no-route',
    })
    expect(destination.statusReason).toBe('logistics-failed:food:no-route')
  })

  it('records destination capacity on an in-transit order that cannot unload', () => {
    const source = building('granary-1', 'granary', { x: 0, y: 0 })
    const destination = building('eatery-1', 'eatery', { x: 1, y: 0 }, { food: 8, salt: 2 })
    const cartEntity = carrier('cart', { x: 1, y: 0 })
    cartEntity.activity = 'delivering'
    cartEntity.path = [{ x: 1, y: 0 }]
    const state = snapshot({
      buildings: { [source.id]: source, [destination.id]: destination },
      agents: { [cartEntity.id]: cartEntity },
      logisticsOrders: {
        'food-order': {
          id: 'food-order',
          resource: 'food',
          amount: 1,
          sourceBuildingId: source.id,
          destinationBuildingId: destination.id,
          priority: 50,
          state: 'in_transit',
          carrierId: cartEntity.id,
        },
      },
    })

    new LogisticsSystem({ definitions }).update(state)

    expect(state.logisticsOrders['food-order']).toMatchObject({
      state: 'in_transit',
      failureReason: 'destination-capacity',
    })
    expect(cartEntity.cargoIntent).toBeUndefined()
    expect(destination.statusReason).toBe('logistics-failed:food:destination-capacity')
  })

  it('limits same-tick unloading throughput and records destination backlog', () => {
    const firstSource = building('granary-1', 'granary', { x: 0, y: 0 })
    const secondSource = building('granary-2', 'granary', { x: 0, y: 0 })
    const destination = building('market-1', 'market', { x: 1, y: 0 })
    const firstCart = carrier('cart-1', { x: 1, y: 0 })
    firstCart.activity = 'delivering'
    firstCart.path = [{ x: 1, y: 0 }]
    firstCart.cargoIntent = {
      orderId: 'first-order',
      resource: 'food',
      amount: 1,
      sourceBuildingId: firstSource.id,
      destinationBuildingId: destination.id,
      phase: 'dropoff',
    }
    const secondCart = carrier('cart-2', { x: 1, y: 0 })
    secondCart.activity = 'delivering'
    secondCart.path = [{ x: 1, y: 0 }]
    secondCart.cargoIntent = {
      orderId: 'second-order',
      resource: 'food',
      amount: 1,
      sourceBuildingId: secondSource.id,
      destinationBuildingId: destination.id,
      phase: 'dropoff',
    }
    const state = snapshot({
      tick: 20,
      buildings: {
        [firstSource.id]: firstSource,
        [secondSource.id]: secondSource,
        [destination.id]: destination,
      },
      agents: {
        [firstCart.id]: firstCart,
        [secondCart.id]: secondCart,
      },
      logisticsOrders: {
        'first-order': {
          id: 'first-order',
          resource: 'food',
          amount: 1,
          sourceBuildingId: firstSource.id,
          destinationBuildingId: destination.id,
          priority: 50,
          state: 'in_transit',
          carrierId: firstCart.id,
        },
        'second-order': {
          id: 'second-order',
          resource: 'food',
          amount: 1,
          sourceBuildingId: secondSource.id,
          destinationBuildingId: destination.id,
          priority: 50,
          state: 'in_transit',
          carrierId: secondCart.id,
        },
      },
    })

    new LogisticsSystem({
      definitions,
      unloadCapacityPerTick: 1,
    }).update(state)

    expect(state.logisticsOrders['first-order']).toMatchObject({ state: 'delivered' })
    expect(state.logisticsOrders['second-order']).toMatchObject({
      state: 'in_transit',
      failureReason: 'destination-throughput',
      throughputQueuedSinceTick: 20,
    })
    expect(destination.inventory.food).toBe(1)
    expect(secondCart.activity).toBe('delivering')
    expect(state.logisticsQueues?.['market-1']).toMatchObject({
      buildingId: 'market-1',
      unloadCapacityPerTick: 1,
      unloadedThisTick: 1,
      waitingToUnloadCount: 1,
      longestWaitTicks: 0,
      waitingOrderIds: ['second-order'],
    })

    state.tick = 21
    new LogisticsSystem({
      definitions,
      unloadCapacityPerTick: 1,
    }).update(state)

    expect(state.logisticsOrders['second-order']).toMatchObject({ state: 'delivered' })
    expect(destination.inventory.food).toBe(2)
    expect(state.logisticsQueues?.['market-1']).toMatchObject({
      unloadedThisTick: 1,
      waitingToUnloadCount: 0,
      longestWaitTicks: 0,
      waitingOrderIds: [],
    })
  })

  it('derives unload throughput from destination type, level, workers, and road access', () => {
    const createInboundState = (
      destination: BuildingEntity,
      orderCount: number,
    ): SimulationSnapshot => {
      const buildings: SimulationSnapshot['buildings'] = { [destination.id]: destination }
      const agents: SimulationSnapshot['agents'] = {}
      const logisticsOrders: SimulationSnapshot['logisticsOrders'] = {}
      for (let index = 0; index < orderCount; index += 1) {
        const source = building(`source-${index}`, 'farm', { x: 0, y: 0 }, { food: 5 })
        const cart = carrier(`cart-${index}`, destination.entrance)
        cart.activity = 'delivering'
        buildings[source.id] = source
        agents[cart.id] = cart
        logisticsOrders[`order-${index}`] = {
          id: `order-${index}`,
          resource: 'food',
          amount: 1,
          sourceBuildingId: source.id,
          destinationBuildingId: destination.id,
          priority: 50,
          state: 'in_transit',
          carrierId: cart.id,
        }
      }
      return snapshot({
        tick: 30,
        buildings,
        agents,
        logisticsOrders,
      })
    }

    const basicMarket = building('market-1', 'market', { x: 3, y: 0 }, {})
    const basicState = createInboundState(basicMarket, 4)

    new LogisticsSystem({ definitions }).update(basicState)

    expect(Object.values(basicState.logisticsOrders).filter((order) => order.state === 'delivered')).toHaveLength(3)
    expect(basicState.logisticsQueues?.['market-1']).toMatchObject({
      unloadCapacityPerTick: 3,
      unloadCapacityBreakdown: {
        source: 'building',
        category: 'market',
        base: 2,
        levelBonus: 0,
        workerBonus: 0,
        entranceBonus: 1,
        roadAccess: 2,
        workerCount: 1,
        cappedAt: 8,
        total: 3,
      },
      unloadedThisTick: 3,
      waitingToUnloadCount: 1,
      waitingOrderIds: ['order-3'],
    })

    const upgradedGranary = {
      ...building('granary-1', 'granary', { x: 3, y: 0 }, {}),
      level: 4,
      workers: ['worker-1', 'worker-2', 'worker-3', 'worker-4', 'worker-5', 'worker-6'],
    }
    const upgradedState = createInboundState(upgradedGranary, 6)

    new LogisticsSystem({ definitions }).update(upgradedState)

    expect(Object.values(upgradedState.logisticsOrders).filter((order) => order.state === 'delivered')).toHaveLength(6)
    expect(upgradedState.logisticsQueues?.['granary-1']).toMatchObject({
      unloadCapacityPerTick: 6,
      unloadCapacityBreakdown: {
        source: 'building',
        category: 'storage',
        base: 3,
        levelBonus: 1,
        workerBonus: 1,
        entranceBonus: 1,
        roadAccess: 2,
        workerCount: 6,
        cappedAt: 8,
        total: 6,
      },
      unloadedThisTick: 6,
      waitingToUnloadCount: 0,
      waitingOrderIds: [],
    })
  })

  it('archives completed logistics history while preserving efficiency statistics', () => {
    const state = snapshot({
      logisticsOrders: {
        'a-cancelled': {
          id: 'a-cancelled',
          resource: 'food',
          amount: 1,
          sourceBuildingId: 'granary',
          destinationBuildingId: 'market',
          priority: 1,
          state: 'cancelled',
          cancelReason: 'no-route',
        },
        'b-delivered': {
          id: 'b-delivered',
          resource: 'food',
          amount: 1,
          sourceBuildingId: 'granary',
          destinationBuildingId: 'market',
          priority: 1,
          state: 'delivered',
        },
        'c-delivered': {
          id: 'c-delivered',
          resource: 'wood',
          amount: 1,
          sourceBuildingId: 'granary',
          destinationBuildingId: 'market',
          priority: 1,
          state: 'delivered',
        },
      },
    })

    new LogisticsSystem({
      definitions,
      completedOrderRetention: 1,
    }).update(state)

    expect(Object.keys(state.logisticsOrders)).toEqual(['c-delivered'])
    expect(state.logisticsArchive).toEqual({
      archivedOrders: 2,
      delivered: 1,
      cancelled: 1,
      cancelReasons: { 'no-route': 1 },
    })
    expect(state.metrics.logisticsEfficiency).toBeCloseTo(2 / 3 * 100)
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

  it('creates replenishment orders for service buildings such as markets', () => {
    const source = building('granary-1', 'granary', { x: 0, y: 0 }, { food: 20 })
    const market = building('market-1', 'market', { x: 4, y: 0 })
    market.workers = ['worker-1']
    const state = snapshot({
      buildings: { [source.id]: source, [market.id]: market },
      agents: { cart: carrier('cart', { x: 0, y: 0 }) },
    })
    const system = new LogisticsSystem({
      definitions,
      serviceRules: {
        market: {
          need: 'food',
          resource: 'food',
          amountPerHousehold: 1,
          restoreAmount: 16,
          maxHouseholdsPerTick: 3,
        },
      },
      idFactory: () => 'market-food',
    })

    const events = system.update(state)

    expect(events).toContainEqual({ type: 'logistics-order-created', orderId: 'market-food' })
    expect(state.logisticsOrders['market-food']).toMatchObject({
      resource: 'food',
      sourceBuildingId: source.id,
      destinationBuildingId: market.id,
      state: 'in_transit',
    })
    expect(source.inventory.food).toBe(11)
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

describe('service system', () => {
  it('serves reachable households from staffed stocked markets', () => {
    const market = building('market-1', 'market', { x: 0, y: 0 }, { food: 3 })
    market.workers = ['worker-1']
    const home = building('house-1', 'house', { x: 3, y: 0 })
    const state = snapshot({
      buildings: { [market.id]: market, [home.id]: home },
      households: {
        household: {
          id: 'household',
          homeBuildingId: home.id,
          members: 3,
          workerIds: [],
          income: 20,
          satisfaction: 50,
          needs: { food: 20, goods: 95, health: 70, education: 70, entertainment: 70 },
        },
      },
    })

    const system = new ServiceSystem({ definitions })
    const events = system.update(state)

    expect(events).toHaveLength(0)
    expect(state.households.household.needs.food).toBe(20)
    expect(state.households.household.income).toBe(20)
    expect(market.inventory.food).toBe(3)
    expect(state.economy.treasury).toBe(100)
    expect(state.economy.lastTaxIncome).toBe(0)
    expect(market.status).toBe('serving')
    expect(state.agents['service-visit:1:market-1:household:food']).toMatchObject({
      role: 'resident',
      householdId: 'household',
      position: { x: 3, y: 0 },
      path: [
        { x: 3, y: 0 },
        { x: 2, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 0 },
      ],
      pathIndex: 0,
      activity: 'shopping',
      activityStartedTick: 1,
      serviceIntent: {
        buildingId: market.id,
        need: 'food',
        resource: 'food',
        amount: 1,
        saleValue: 5,
        restoreAmount: 16,
      },
    })

    state.tick = 2
    system.update(state)

    expect(state.agents['service-visit:1:market-1:household:food']).toMatchObject({
      position: { x: 2, y: 0 },
      pathIndex: 1,
      activity: 'shopping',
    })
    expect(state.agents['service-visit:2:market-1:household:food']).toBeUndefined()

    state.tick = 3
    system.update(state)
    state.tick = 4
    const arrivalEvents = system.update(state)

    expect(state.agents['service-visit:1:market-1:household:food']).toMatchObject({
      position: { x: 0, y: 0 },
      path: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 3, y: 0 },
      ],
      pathIndex: 0,
      activity: 'returning',
    })
    expect(arrivalEvents).toContainEqual({
      type: 'purchase-completed',
      buildingId: market.id,
      householdId: 'household',
      resource: 'food',
      amount: 1,
      taxPaid: 0.5,
    })
    expect(arrivalEvents).toContainEqual({
      type: 'service-delivered',
      buildingId: market.id,
      householdId: 'household',
      need: 'food',
    })
    expect(state.households.household.needs.food).toBe(36)
    expect(state.households.household.income).toBe(15)
    expect(market.inventory.food).toBe(2)
    expect(state.economy.treasury).toBe(100.5)
    expect(state.economy.lastTaxIncome).toBe(0.5)

    state.tick = 5
    system.update(state)
    state.tick = 6
    system.update(state)
    state.tick = 7
    system.update(state)

    expect(state.agents['service-visit:1:market-1:household:food']).toBeUndefined()
  })

  it('sells cloth as market goods and restores the household goods need', () => {
    const market = building('market-1', 'market', { x: 0, y: 0 }, { cloth: 2 })
    market.workers = ['worker-1']
    const home = building('house-1', 'house', { x: 3, y: 0 })
    const state = snapshot({
      buildings: { [market.id]: market, [home.id]: home },
      households: {
        household: household('household', home.id, {
          food: 95,
          goods: 20,
          health: 70,
          education: 70,
          entertainment: 70,
        }, 20),
      },
    })

    const system = new ServiceSystem({ definitions })
    const events = system.update(state)

    expect(events).toHaveLength(0)
    expect(state.households.household.needs.goods).toBe(20)
    expect(state.households.household.income).toBe(20)
    expect(market.inventory.cloth).toBe(2)
    expect(state.economy.treasury).toBe(100)

    state.tick = 2
    system.update(state)
    state.tick = 3
    system.update(state)
    state.tick = 4
    const arrivalEvents = system.update(state)

    expect(arrivalEvents).toContainEqual({
      type: 'purchase-completed',
      buildingId: market.id,
      householdId: 'household',
      resource: 'cloth',
      amount: 1,
      taxPaid: 0.3,
    })
    expect(arrivalEvents).toContainEqual({
      type: 'service-delivered',
      buildingId: market.id,
      householdId: 'household',
      need: 'goods',
    })
    expect(state.households.household.needs.goods).toBe(32)
    expect(state.households.household.income).toBe(17)
    expect(market.inventory.cloth).toBe(1)
    expect(state.economy.treasury).toBe(100.3)
  })

  it('does not let households buy market goods without enough disposable income', () => {
    const market = building('market-1', 'market', { x: 0, y: 0 }, { food: 3 })
    market.workers = ['worker-1']
    const home = building('house-1', 'house', { x: 3, y: 0 })
    const state = snapshot({
      buildings: { [market.id]: market, [home.id]: home },
      households: {
        household: household('household', home.id, {
          food: 20,
          goods: 95,
          health: 70,
          education: 70,
          entertainment: 70,
        }, 4),
      },
    })

    const events = new ServiceSystem({ definitions }).update(state)

    expect(events).toHaveLength(0)
    expect(state.households.household.needs.food).toBe(16)
    expect(state.households.household.income).toBe(4)
    expect(market.inventory.food).toBe(3)
    expect(state.economy.treasury).toBe(100)
    expect(market.statusReason).toBe('insufficient-household-income:food')
  })

  it('does not sell goods when the market lacks cloth stock', () => {
    const market = building('market-1', 'market', { x: 0, y: 0 })
    market.workers = ['worker-1']
    const home = building('house-1', 'house', { x: 3, y: 0 })
    const state = snapshot({
      buildings: { [market.id]: market, [home.id]: home },
      households: {
        household: household('household', home.id, {
          food: 95,
          goods: 20,
          health: 70,
          education: 70,
          entertainment: 70,
        }, 20),
      },
    })

    const events = new ServiceSystem({ definitions }).update(state)

    expect(events).toHaveLength(0)
    expect(state.households.household.needs.goods).toBe(17)
    expect(market.inventory.cloth).toBeUndefined()
    expect(market.statusReason).toBe('missing-service-resource:cloth')
  })

  it('serves medicine-backed health needs from staffed reachable pharmacies', () => {
    const pharmacy = building('pharmacy-1', 'pharmacy', { x: 0, y: 0 }, { medicine: 2 })
    pharmacy.workers = ['healer-1']
    const home = building('house-1', 'house', { x: 3, y: 0 })
    const state = snapshot({
      buildings: { [pharmacy.id]: pharmacy, [home.id]: home },
      households: {
        household: household('household', home.id, {
          food: 70,
          goods: 70,
          health: 30,
          education: 70,
          entertainment: 70,
        }),
      },
    })

    const system = new ServiceSystem({ definitions })
    const events = system.update(state)

    expect(events).toHaveLength(0)
    expect(state.households.household.needs.health).toBe(30)
    expect(pharmacy.inventory.medicine).toBe(2)

    state.tick = 2
    system.update(state)
    state.tick = 3
    system.update(state)
    state.tick = 4
    const arrivalEvents = system.update(state)

    expect(arrivalEvents).toContainEqual({
      type: 'service-delivered',
      buildingId: pharmacy.id,
      householdId: 'household',
      need: 'health',
    })
    expect(state.households.household.needs.health).toBe(44)
    expect(pharmacy.inventory.medicine).toBe(1)
    expect(pharmacy.status).toBe('serving')
  })

  it('serves education and entertainment without consumable stock but still requires workers and roads', () => {
    const academy = building('academy-1', 'academy', { x: 0, y: 0 })
    academy.workers = ['teacher-1']
    const theatre = building('theatre-1', 'theatre', { x: 1, y: 0 })
    theatre.workers = ['actor-1']
    const home = building('house-1', 'house', { x: 4, y: 0 })
    const state = snapshot({
      buildings: { [academy.id]: academy, [theatre.id]: theatre, [home.id]: home },
      households: {
        household: household('household', home.id, {
          food: 70,
          goods: 70,
          health: 70,
          education: 25,
          entertainment: 35,
        }),
      },
    })

    const system = new ServiceSystem({ definitions })
    const events = system.update(state)

    expect(events).toHaveLength(0)
    expect(state.households.household.needs.education).toBe(25)
    expect(state.households.household.needs.entertainment).toBe(35)

    const completionEvents = []
    for (state.tick = 2; state.tick <= 7; state.tick += 1) {
      completionEvents.push(...system.update(state))
    }

    expect(completionEvents).toEqual(expect.arrayContaining([
      {
        type: 'service-delivered',
        buildingId: academy.id,
        householdId: 'household',
        need: 'education',
      },
      {
        type: 'service-delivered',
        buildingId: theatre.id,
        householdId: 'household',
        need: 'entertainment',
      },
    ]))
    expect(state.households.household.needs.education).toBe(35)
    expect(state.households.household.needs.entertainment).toBe(47)
    expect(academy.status).toBe('serving')
    expect(theatre.status).toBe('serving')
  })

  it('does not fill needs unconditionally and respects per-tick service capacity', () => {
    const market = building('market-1', 'market', { x: 0, y: 0 }, { food: 10 })
    market.workers = ['worker-1']
    const homes = [
      building('house-1', 'house', { x: 2, y: 0 }),
      building('house-2', 'house', { x: 3, y: 0 }),
      building('house-3', 'house', { x: 4, y: 0 }),
      building('house-4', 'house', { x: 5, y: 0 }),
    ]
    const state = snapshot({
      buildings: {
        [market.id]: market,
        ...Object.fromEntries(homes.map((home) => [home.id, home])),
      },
      households: {
        first: household('first', homes[0].id, {
          food: 10,
          goods: 95,
          health: 70,
          education: 70,
          entertainment: 70,
        }),
        second: household('second', homes[1].id, {
          food: 20,
          goods: 95,
          health: 70,
          education: 70,
          entertainment: 70,
        }),
        third: household('third', homes[2].id, {
          food: 30,
          goods: 95,
          health: 70,
          education: 70,
          entertainment: 70,
        }),
        fourth: household('fourth', homes[3].id, {
          food: 40,
          goods: 95,
          health: 70,
          education: 70,
          entertainment: 70,
        }),
      },
    })

    const events = new ServiceSystem({ definitions }).update(state)

    expect(events).toHaveLength(0)
    expect(Object.values(state.agents).filter((agent) => (
      agent.id.startsWith('service-visit:')
    ))).toHaveLength(3)
    expect(state.households.first.needs.food).toBe(10)
    expect(state.households.second.needs.food).toBe(20)
    expect(state.households.third.needs.food).toBe(30)
    expect(state.households.fourth.needs.food).toBe(36)
    expect(market.inventory.food).toBe(10)
  })

  it('records excess service demand as a persistent queue with wait pressure', () => {
    const market = building('market-1', 'market', { x: 0, y: 0 }, { food: 10 })
    market.workers = ['worker-1']
    const homes = [
      building('house-1', 'house', { x: 2, y: 0 }),
      building('house-2', 'house', { x: 3, y: 0 }),
      building('house-3', 'house', { x: 4, y: 0 }),
      building('house-4', 'house', { x: 5, y: 0 }),
    ]
    const state = snapshot({
      tick: 10,
      buildings: {
        [market.id]: market,
        ...Object.fromEntries(homes.map((home) => [home.id, home])),
      },
      households: {
        first: household('first', homes[0].id, {
          food: 10,
          goods: 95,
          health: 70,
          education: 70,
          entertainment: 70,
        }),
        second: household('second', homes[1].id, {
          food: 20,
          goods: 95,
          health: 70,
          education: 70,
          entertainment: 70,
        }),
        third: household('third', homes[2].id, {
          food: 30,
          goods: 95,
          health: 70,
          education: 70,
          entertainment: 70,
        }),
        fourth: household('fourth', homes[3].id, {
          food: 40,
          goods: 95,
          health: 70,
          education: 70,
          entertainment: 70,
        }),
      },
    })
    const system = new ServiceSystem({
      definitions,
      rules: {
        market: {
          need: 'food',
          resource: 'food',
          amountPerHousehold: 1,
          saleValuePerHousehold: 5,
          restoreAmount: 16,
          maxHouseholdsPerTick: 1,
          unmetNeedPenalty: 4,
          unmetSatisfactionPenalty: 2,
        },
      },
    })

    system.update(state)

    expect(Object.values(state.agents).filter((agent) => (
      agent.id.startsWith('service-visit:')
    )).map((agent) => agent.householdId)).toEqual(['first'])
    expect(state.serviceQueues?.['market-1:food']).toMatchObject({
      buildingId: 'market-1',
      need: 'food',
      capacityPerTick: 1,
      servedThisTick: 1,
      rejectedThisTick: 0,
      waitingCount: 3,
      longestWaitTicks: 0,
      waiting: [
        { householdId: 'second', queuedSinceTick: 10, waitTicks: 0 },
        { householdId: 'third', queuedSinceTick: 10, waitTicks: 0 },
        { householdId: 'fourth', queuedSinceTick: 10, waitTicks: 0 },
      ],
    })
    expect(state.households.second.satisfaction).toBe(48)

    state.tick = 11
    system.update(state)

    expect(Object.values(state.agents).filter((agent) => (
      agent.id.startsWith('service-visit:')
    )).map((agent) => agent.householdId).sort()).toEqual(['first', 'second'])
    expect(state.serviceQueues?.['market-1:food']).toMatchObject({
      servedThisTick: 1,
      waitingCount: 2,
      longestWaitTicks: 1,
      waiting: [
        { householdId: 'third', queuedSinceTick: 10, waitTicks: 1 },
        { householdId: 'fourth', queuedSinceTick: 10, waitTicks: 1 },
      ],
    })

    state.tick = 12
    system.update(state)

    expect(Object.values(state.agents).filter((agent) => (
      agent.id.startsWith('service-visit:')
    )).map((agent) => agent.householdId).sort()).toEqual(['first', 'second'])
    expect(state.serviceQueues?.['market-1:food']).toMatchObject({
      servedThisTick: 0,
      waitingCount: 2,
      longestWaitTicks: 2,
      waiting: [
        { householdId: 'third', queuedSinceTick: 10, waitTicks: 2 },
        { householdId: 'fourth', queuedSinceTick: 10, waitTicks: 2 },
      ],
    })
  })

  it('does not serve households across disconnected roads', () => {
    const market = building('market-1', 'market', { x: 0, y: 0 }, { food: 3 })
    market.workers = ['worker-1']
    const home = building('house-1', 'house', { x: 4, y: 0 })
    const state = snapshot({
      cells: road(0, 1),
      buildings: { [market.id]: market, [home.id]: home },
      households: {
        household: {
          id: 'household',
          homeBuildingId: home.id,
          members: 3,
          workerIds: [],
          income: 20,
          satisfaction: 50,
          needs: { food: 20, goods: 95, health: 70, education: 70, entertainment: 70 },
        },
      },
    })

    const events = new ServiceSystem({ definitions }).update(state)

    expect(events).toHaveLength(0)
    expect(events.some((event) => event.type === 'purchase-completed')).toBe(false)
    expect(state.households.household.needs.food).toBe(16)
    expect(market.inventory.food).toBe(3)
    expect(market.statusReason).toBe('no-service-route')
  })

  it('blocks service buildings without workers or service stock', () => {
    const noWorkers = building('market-1', 'market', { x: 0, y: 0 }, { food: 3 })
    noWorkers.workers = []
    const noStock = building('market-2', 'market', { x: 2, y: 0 })
    noStock.workers = ['worker-1']
    const home = building('house-1', 'house', { x: 4, y: 0 })
    const state = snapshot({
      buildings: { [noWorkers.id]: noWorkers, [noStock.id]: noStock, [home.id]: home },
      households: {
        household: {
          id: 'household',
          homeBuildingId: home.id,
          members: 3,
          workerIds: [],
          income: 20,
          satisfaction: 50,
          needs: { food: 20, goods: 95, health: 70, education: 70, entertainment: 70 },
        },
      },
    })

    const events = new ServiceSystem({ definitions }).update(state)

    expect(events).toHaveLength(0)
    expect(events.some((event) => event.type === 'purchase-completed')).toBe(false)
    expect(noWorkers.statusReason).toBe('no-workers')
    expect(noStock.statusReason).toBe('missing-service-resource:food')
    expect(state.households.household.needs.food).toBe(16)
  })

  it('does not provide pharmacy service without required medicine stock', () => {
    const pharmacy = building('pharmacy-1', 'pharmacy', { x: 0, y: 0 })
    pharmacy.workers = ['healer-1']
    const home = building('house-1', 'house', { x: 2, y: 0 })
    const state = snapshot({
      buildings: { [pharmacy.id]: pharmacy, [home.id]: home },
      households: {
        household: household('household', home.id, {
          food: 70,
          goods: 70,
          health: 15,
          education: 70,
          entertainment: 70,
        }),
      },
    })

    const events = new ServiceSystem({ definitions }).update(state)

    expect(events).toHaveLength(0)
    expect(state.households.household.needs.health).toBe(12)
    expect(pharmacy.status).toBe('blocked')
    expect(pharmacy.statusReason).toBe('missing-service-resource:medicine')
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

  it('links stock logistics and market service into a visible resident need loop', () => {
    const granary = building('granary', 'granary', { x: 0, y: 0 }, { food: 20 })
    const market = building('market', 'market', { x: 2, y: 0 })
    market.workers = ['market-worker']
    const home = building('home', 'house', { x: 4, y: 0 })
    const cartEntity = carrier('cart', { x: 0, y: 0 })
    const state = snapshot({
      buildings: { granary, market, home },
      agents: { cart: cartEntity },
      households: {
        family: {
          id: 'family',
          homeBuildingId: home.id,
          members: 3,
          workerIds: [],
          income: 20,
          satisfaction: 40,
          needs: { food: 10, goods: 95, health: 60, education: 60, entertainment: 60 },
        },
      },
    })
    let orderSequence = 0
    const system = new EconomySystem({
      definitions,
      idFactory: () => `market-food-${++orderSequence}`,
    })

    const allEvents = []
    for (let index = 0; index < 6; index += 1) {
      allEvents.push(...system.update(state))
    }

    expect(Object.values(state.logisticsOrders).some((order) => order.state === 'delivered')).toBe(true)
    expect(allEvents).toContainEqual({
      type: 'purchase-completed',
      buildingId: market.id,
      householdId: 'family',
      resource: 'food',
      amount: 1,
      taxPaid: 0.5,
    })
    expect(allEvents).toContainEqual({
      type: 'service-delivered',
      buildingId: market.id,
      householdId: 'family',
      need: 'food',
    })
    expect(state.households.family.needs.food).toBeGreaterThan(10)
    expect(state.households.family.needs.food).toBeLessThanOrEqual(100)
    expect(market.status).toBe('serving')
  })

  it('keeps resident needs blocked when a road break prevents market restock', () => {
    const granary = building('granary', 'granary', { x: 0, y: 0 }, { food: 20 })
    const market = building('market', 'market', { x: 2, y: 0 })
    market.workers = ['market-worker']
    const home = building('home', 'house', { x: 4, y: 0 })
    const state = snapshot({
      cells: road(0, 0),
      buildings: { granary, market, home },
      agents: { cart: carrier('cart', { x: 0, y: 0 }) },
      households: {
        family: household('family', home.id, {
          food: 10,
          goods: 60,
          health: 60,
          education: 60,
          entertainment: 60,
        }),
      },
    })
    const system = new EconomySystem({
      definitions,
      idFactory: () => 'market-food',
    })

    const allEvents = []
    for (let index = 0; index < 3; index += 1) {
      allEvents.push(...system.update(state))
    }

    expect(allEvents).not.toContainEqual({ type: 'logistics-order-created', orderId: 'market-food' })
    expect(Object.keys(state.logisticsOrders)).toHaveLength(0)
    expect(granary.inventory.food).toBe(20)
    expect(state.households.family.needs.food).toBe(0)
    expect(market.status).toBe('blocked')
    expect(market.statusReason).toBe('no-service-route')
  })
})
