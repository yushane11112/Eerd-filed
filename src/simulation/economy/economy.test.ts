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
): SimulationSnapshot['households'][string] {
  return {
    id,
    homeBuildingId,
    members: 3,
    workerIds: [],
    income: 0,
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
    expect(destination.statusReason).toBe('logistics-failed:food:destination-capacity')
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
          income: 0,
          satisfaction: 50,
          needs: { food: 20, goods: 70, health: 70, education: 70, entertainment: 70 },
        },
      },
    })

    const events = new ServiceSystem({ definitions }).update(state)

    expect(events).toContainEqual({
      type: 'service-delivered',
      buildingId: market.id,
      householdId: 'household',
      need: 'food',
    })
    expect(state.households.household.needs.food).toBe(36)
    expect(market.inventory.food).toBe(2)
    expect(market.status).toBe('serving')
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

    const events = new ServiceSystem({ definitions }).update(state)

    expect(events).toContainEqual({
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

    const events = new ServiceSystem({ definitions }).update(state)

    expect(events).toEqual(expect.arrayContaining([
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
          goods: 70,
          health: 70,
          education: 70,
          entertainment: 70,
        }),
        second: household('second', homes[1].id, {
          food: 20,
          goods: 70,
          health: 70,
          education: 70,
          entertainment: 70,
        }),
        third: household('third', homes[2].id, {
          food: 30,
          goods: 70,
          health: 70,
          education: 70,
          entertainment: 70,
        }),
        fourth: household('fourth', homes[3].id, {
          food: 40,
          goods: 70,
          health: 70,
          education: 70,
          entertainment: 70,
        }),
      },
    })

    const events = new ServiceSystem({ definitions }).update(state)

    expect(events).toHaveLength(3)
    expect(state.households.first.needs.food).toBe(26)
    expect(state.households.second.needs.food).toBe(36)
    expect(state.households.third.needs.food).toBe(46)
    expect(state.households.fourth.needs.food).toBe(40)
    expect(market.inventory.food).toBe(7)
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
          income: 0,
          satisfaction: 50,
          needs: { food: 20, goods: 70, health: 70, education: 70, entertainment: 70 },
        },
      },
    })

    const events = new ServiceSystem({ definitions }).update(state)

    expect(events).toHaveLength(0)
    expect(state.households.household.needs.food).toBe(20)
    expect(market.inventory.food).toBe(3)
    expect(market.statusReason).toBe('no-service-demand')
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
          income: 0,
          satisfaction: 50,
          needs: { food: 20, goods: 70, health: 70, education: 70, entertainment: 70 },
        },
      },
    })

    const events = new ServiceSystem({ definitions }).update(state)

    expect(events).toHaveLength(0)
    expect(noWorkers.statusReason).toBe('no-workers')
    expect(noStock.statusReason).toBe('missing-service-resource:food')
    expect(state.households.household.needs.food).toBe(20)
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
    expect(state.households.household.needs.health).toBe(15)
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
          income: 0,
          satisfaction: 40,
          needs: { food: 10, goods: 60, health: 60, education: 60, entertainment: 60 },
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
      type: 'service-delivered',
      buildingId: market.id,
      householdId: 'family',
      need: 'food',
    })
    expect(state.households.family.needs.food).toBeGreaterThan(26)
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
    expect(state.households.family.needs.food).toBe(10)
    expect(market.status).toBe('blocked')
    expect(market.statusReason).toBe('missing-service-resource:food')
  })
})
