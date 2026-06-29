import { describe, expect, it } from 'vitest'
import type { BuildingEntity, SimulationSnapshot } from '../simulation/contracts'
import {
  deriveStageAdvisorOverlay,
  deriveStageGovernanceCards,
  deriveStageMapOverlay,
} from './stageAdvisor'

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
      points: [
        { kind: 'housing', label: '住房', position: { x: 2, y: 3 } },
        { kind: 'migration', label: '等房', position: { x: 5, y: 6 } },
      ],
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
      points: [{ kind: 'district', label: '市街', position: { x: 8, y: 9 } }],
    })
    expect(deriveStageAdvisorOverlay('attraction', snapshot, 3)).toMatchObject({
      label: '吸引力瓶颈',
      points: [
        { kind: 'bottleneck', label: '停工', position: { x: 4, y: 5 } },
        { kind: 'bottleneck', label: '仓储', position: { x: 6, y: 7 } },
      ],
    })
  })

  it('derives switchable housing, service, logistics and road overlays', () => {
    const snapshot = makeSnapshot({
      cells: [
        { point: { x: 1, y: 1 }, terrain: 'land', elevation: 0, road: 'dirt' },
        { point: { x: 9, y: 9 }, terrain: 'land', elevation: 0 },
      ],
      buildings: {
        home: building('home', 'house', { x: 2, y: 3 }),
        farHome: building('farHome', 'house', { x: 12, y: 12 }),
        market: building('market', 'market', { x: 4, y: 5 }),
        granary: building('granary', 'granary', { x: 8, y: 8 }),
      },
      households: {
        family: {
          id: 'family',
          homeBuildingId: 'home',
          members: 7,
          workerIds: [],
          income: 0,
          satisfaction: 80,
          needs: { food: 80, goods: 80, health: 80, education: 80, entertainment: 80 },
        },
      },
      logisticsOrders: {
        order: {
          id: 'order',
          resource: 'food',
          amount: 5,
          sourceBuildingId: 'granary',
          destinationBuildingId: 'market',
          priority: 1,
          state: 'waiting',
        },
        order2: {
          id: 'order2',
          resource: 'wood',
          amount: 2,
          sourceBuildingId: 'home',
          destinationBuildingId: 'market',
          priority: 1,
          state: 'assigned',
        },
      },
    })

    expect(deriveStageMapOverlay('housing', snapshot, 11)).toMatchObject({
      label: '住房容量',
      points: expect.arrayContaining([
        { kind: 'housing', label: '空5', position: { x: 2, y: 3 } },
        { kind: 'housing', label: '空12', position: { x: 12, y: 12 } },
      ]),
      summary: ['住宅 2', '空位 0'],
      metrics: { houses: 2, openHousing: 0 },
    })
    expect(deriveStageMapOverlay('service', snapshot, 12)).toMatchObject({
      label: '服务范围',
      points: expect.arrayContaining([
        { kind: 'service', label: '服务点', position: { x: 4, y: 5 } },
        { kind: 'bottleneck', label: '缺服务', position: { x: 12, y: 12 } },
      ]),
      areas: [{
        kind: 'service',
        label: '覆盖',
        center: { x: 4, y: 5 },
        radius: 4,
      }],
      summary: ['服务点 1', '缺口住宅 1'],
      metrics: { servicePoints: 1, serviceGaps: 1 },
    })
    expect(deriveStageMapOverlay('logistics', snapshot, 13)).toMatchObject({
      label: '物流线路',
      points: expect.arrayContaining([
        { kind: 'logistics', label: '发货', position: { x: 8, y: 8 } },
        { kind: 'logistics', label: '收货', position: { x: 4, y: 5 } },
        { kind: 'bottleneck', label: '物流热点x2', position: { x: 4, y: 5 } },
      ]),
      paths: expect.arrayContaining([
        {
          kind: 'logistics',
          label: 'food x5',
          from: { x: 8, y: 8 },
          to: { x: 4, y: 5 },
        },
      ]),
      summary: ['未完成 2', '热点 1'],
      metrics: { activeOrders: 2, hotspots: 1 },
    })
    expect(deriveStageMapOverlay('roads', snapshot, 14)).toMatchObject({
      label: '道路连通',
      points: expect.arrayContaining([
        { kind: 'road', label: '道路', position: { x: 1, y: 1 } },
        { kind: 'road', label: '缺路仓储', position: { x: 8, y: 8 } },
        { kind: 'road', label: '缺路住宅', position: { x: 12, y: 12 } },
      ]),
      summary: ['道路点 1', '缺路 4'],
      metrics: { roadCells: 1, roadGaps: 4 },
    })
  })

  it('derives an activity heat overlay from service visits, commutes and cargo trips', () => {
    const snapshot = makeSnapshot({
      agents: {
        shopper: {
          id: 'shopper',
          role: 'resident',
          householdId: 'family',
          position: { x: 4, y: 5 },
          path: [{ x: 4, y: 5 }, { x: 6, y: 5 }],
          pathIndex: 0,
          activity: 'shopping',
          serviceIntent: {
            buildingId: 'market',
            need: 'food',
            resource: 'food',
            amount: 1,
            saleValue: 5,
            restoreAmount: 16,
          },
        },
        worker: {
          id: 'worker',
          role: 'worker',
          householdId: 'family',
          employerBuildingId: 'granary',
          position: { x: 4, y: 5 },
          path: [{ x: 4, y: 5 }, { x: 8, y: 8 }],
          pathIndex: 0,
          activity: 'commuting',
        },
        cart: {
          id: 'cart',
          role: 'cart',
          position: { x: 8, y: 8 },
          path: [{ x: 8, y: 8 }, { x: 4, y: 5 }],
          pathIndex: 0,
          activity: 'delivering',
          cargoIntent: {
            orderId: 'order',
            resource: 'food',
            amount: 5,
            sourceBuildingId: 'granary',
            destinationBuildingId: 'market',
            phase: 'dropoff',
          },
        },
      },
    })

    expect(deriveStageMapOverlay('activity', snapshot, 15)).toMatchObject({
      label: '城市活动热力',
      points: expect.arrayContaining([
        { kind: 'activity', label: '服务热x2', position: { x: 4, y: 5 } },
        { kind: 'activity', label: '货运热x1', position: { x: 8, y: 8 } },
      ]),
      paths: expect.arrayContaining([
        {
          kind: 'activity',
          label: '服务访问',
          from: { x: 4, y: 5 },
          to: { x: 6, y: 5 },
        },
        {
          kind: 'activity',
          label: 'food送货',
          from: { x: 8, y: 8 },
          to: { x: 4, y: 5 },
        },
      ]),
      summary: ['道压 3', '服务热 1', '货拥 1'],
      metrics: {
        activeAgents: 3,
        serviceVisits: 1,
        commutes: 1,
        cargoTrips: 1,
        hotspots: 2,
        roadPressure: 3,
        serviceHeat: 1,
        cargoCongestion: 1,
      },
    })
  })

  it('turns concentrated activity into a governance card', () => {
    const snapshot = makeSnapshot({
      agents: {
        shopper1: serviceAgent('shopper1', { x: 4, y: 5 }),
        shopper2: serviceAgent('shopper2', { x: 4, y: 5 }),
        cart1: cargoAgent('cart1', { x: 4, y: 5 }),
        cart2: cargoAgent('cart2', { x: 4, y: 5 }),
      },
    })

    expect(deriveStageGovernanceCards(snapshot)).toMatchObject([
      {
        id: 'governance-activity-pressure',
        title: '城市活动压力',
        recommendation: {
          label: '打开活动图层检查热区',
          tool: 'inspect',
          overlayMode: 'activity',
        },
        overlayMode: 'activity',
        metricLabel: '货拥',
        target: { point: { x: 4, y: 5 }, label: '货运热x4' },
      },
    ])
  })

  it('turns layer metrics into sorted governance cards', () => {
    const snapshot = makeSnapshot({
      cells: [
        { point: { x: 1, y: 1 }, terrain: 'land', elevation: 0, road: 'dirt' },
      ],
      buildings: {
        home: building('home', 'house', { x: 2, y: 3 }),
        farHome: building('farHome', 'house', { x: 12, y: 12 }),
        market: building('market', 'market', { x: 4, y: 5 }),
        granary: building('granary', 'granary', { x: 8, y: 8 }),
      },
      logisticsOrders: {
        order: {
          id: 'order',
          resource: 'food',
          amount: 5,
          sourceBuildingId: 'granary',
          destinationBuildingId: 'market',
          priority: 1,
          state: 'waiting',
        },
        order2: {
          id: 'order2',
          resource: 'wood',
          amount: 2,
          sourceBuildingId: 'home',
          destinationBuildingId: 'market',
          priority: 1,
          state: 'assigned',
        },
        order3: {
          id: 'order3',
          resource: 'brick',
          amount: 3,
          sourceBuildingId: 'granary',
          destinationBuildingId: 'market',
          priority: 1,
          state: 'waiting',
        },
      },
    })

    expect(deriveStageGovernanceCards(snapshot)).toMatchObject([
      {
        id: 'governance-logistics-hotspots',
        title: '物流热点拥堵',
        cause: '订单集中在少数产地、仓储或市场，现有道路与仓储缓冲不足。',
        recommendation: {
          label: '打开物流图层并补仓储',
          tool: 'building',
          buildingType: 'granary',
          overlayMode: 'logistics',
        },
        overlayMode: 'logistics',
        metricLabel: '热点',
        target: { point: { x: 4, y: 5 }, label: '物流热点x3' },
      },
      {
        id: 'governance-road-gaps',
        title: '道路入口缺口',
        recommendation: {
          label: '打开道路图层并铺路',
          tool: 'road',
          overlayMode: 'roads',
        },
        overlayMode: 'roads',
        metricLabel: '缺路',
        target: { point: { x: 2, y: 3 }, label: '缺路住宅' },
      },
      {
        id: 'governance-service-gaps',
        title: '服务覆盖缺口',
        recommendation: {
          label: '打开服务图层并营造市场',
          tool: 'building',
          buildingType: 'market',
          overlayMode: 'service',
        },
        overlayMode: 'service',
        metricLabel: '缺口住宅',
        target: { point: { x: 12, y: 12 }, label: '缺服务' },
      },
    ])
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

function serviceAgent(id: string, position: { x: number; y: number }): SimulationSnapshot['agents'][string] {
  return {
    id,
    role: 'resident',
    householdId: 'family',
    position,
    path: [position, { x: position.x + 2, y: position.y }],
    pathIndex: 0,
    activity: 'shopping',
    serviceIntent: {
      buildingId: 'market',
      need: 'food',
      resource: 'food',
      amount: 1,
      saleValue: 5,
      restoreAmount: 16,
    },
  }
}

function cargoAgent(id: string, position: { x: number; y: number }): SimulationSnapshot['agents'][string] {
  return {
    id,
    role: 'cart',
    position,
    path: [position, { x: position.x + 3, y: position.y }],
    pathIndex: 0,
    activity: 'delivering',
    cargoIntent: {
      orderId: `${id}-order`,
      resource: 'food',
      amount: 5,
      sourceBuildingId: 'granary',
      destinationBuildingId: 'market',
      phase: 'dropoff',
    },
  }
}
