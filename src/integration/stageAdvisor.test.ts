import { describe, expect, it } from 'vitest'
import type { BuildingEntity, SimulationSnapshot } from '../simulation/contracts'
import {
  deriveStageAdvisorOverlay,
  deriveStageGovernanceCards,
  deriveStageMapOverlay,
  explainStageRecommendationAvailability,
  withRecommendationExecutionOverlay,
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
      logisticsQueues: {
        market: {
          buildingId: 'market',
          unloadCapacityPerTick: 1,
          unloadedThisTick: 1,
          waitingToUnloadCount: 2,
          longestWaitTicks: 4,
          waitingOrderIds: ['order', 'order2'],
        },
      },
      serviceQueues: {
        'market:food': {
          buildingId: 'market',
          need: 'food',
          capacityPerTick: 1,
          servedThisTick: 1,
          rejectedThisTick: 0,
          waitingCount: 1,
          longestWaitTicks: 3,
          waiting: [
            { householdId: 'family', queuedSinceTick: 9, waitTicks: 3 },
          ],
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
      metrics: { servicePoints: 1, serviceGaps: 1, queuedHouseholds: 1, longestServiceWait: 3 },
    })
    expect(deriveStageMapOverlay('service', snapshot, 12)?.points).toEqual(expect.arrayContaining([
      { kind: 'bottleneck', label: '排队x1', position: { x: 4, y: 5 } },
    ]))
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
      metrics: { activeOrders: 2, hotspots: 1, unloadBacklog: 2, longestUnloadWait: 4 },
    })
    expect(deriveStageMapOverlay('logistics', snapshot, 13)?.points).toEqual(expect.arrayContaining([
      { kind: 'bottleneck', label: '卸货排队x2', position: { x: 4, y: 5 } },
    ]))
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

  it('diagnoses building entrances that touch isolated roads but are not connected to the main road network', () => {
    const snapshot = makeSnapshot({
      cells: [
        { point: { x: 0, y: 1 }, terrain: 'land', elevation: 0, road: 'stone' },
        { point: { x: 1, y: 1 }, terrain: 'land', elevation: 0, road: 'stone' },
        { point: { x: 2, y: 1 }, terrain: 'water', elevation: 0 },
        { point: { x: 3, y: 1 }, terrain: 'shore', elevation: 0 },
        { point: { x: 4, y: 1 }, terrain: 'land', elevation: 0, road: 'stone' },
        { point: { x: 5, y: 1 }, terrain: 'land', elevation: 0, road: 'stone' },
        { point: { x: 6, y: 1 }, terrain: 'land', elevation: 0, road: 'stone' },
      ],
      buildings: {
        home: building('home', 'house', { x: 0, y: 2 }),
        market: building('market', 'market', { x: 4, y: 2 }),
      },
    })

    expect(deriveStageMapOverlay('roads', snapshot, 17)).toMatchObject({
      label: '道路连通',
      points: expect.arrayContaining([
        { kind: 'road', label: '未连通住宅', position: { x: 0, y: 2 } },
      ]),
      paths: [{
        kind: 'road',
        label: '建议补桥',
        from: { x: 1, y: 1 },
        to: { x: 4, y: 1 },
      }],
      summary: ['道路点 5', '未连通 1', '孤立路网 1'],
      metrics: {
        roadCells: 5,
        roadGaps: 0,
        disconnectedEntrances: 1,
        isolatedRoadNetworks: 1,
        suggestedRoadLinks: 1,
      },
    })
  })

  it('turns disconnected road networks into a higher-priority governance card than ordinary missing roads', () => {
    const snapshot = makeSnapshot({
      cells: [
        { point: { x: 0, y: 1 }, terrain: 'land', elevation: 0, road: 'stone' },
        { point: { x: 1, y: 1 }, terrain: 'land', elevation: 0, road: 'stone' },
        { point: { x: 2, y: 1 }, terrain: 'water', elevation: 0 },
        { point: { x: 3, y: 1 }, terrain: 'shore', elevation: 0 },
        { point: { x: 4, y: 1 }, terrain: 'land', elevation: 0, road: 'stone' },
        { point: { x: 5, y: 1 }, terrain: 'land', elevation: 0, road: 'stone' },
        { point: { x: 6, y: 1 }, terrain: 'land', elevation: 0, road: 'stone' },
      ],
      buildings: {
        home: building('home', 'house', { x: 0, y: 2 }),
        market: building('market', 'market', { x: 4, y: 2 }),
        granary: building('granary', 'granary', { x: 9, y: 9 }),
      },
    })

    expect(deriveStageGovernanceCards(snapshot)[0]).toMatchObject({
      id: 'governance-road-disconnected',
      title: '道路未连通',
      detail: '1 处建筑入口贴着孤立路网，1 段道路没有接回主路网。',
      cause: '道路或桥梁只铺到局部，没有和主路网形成连续路径，居民、工人和货运会被困在孤岛路段。',
      action: '先用道路或桥梁把孤立路网接回主路网，再扩建新建筑。',
      recommendation: {
        label: '打开道路图层并接回主路网',
        tool: 'road',
        overlayMode: 'roads',
        roadPlan: {
          from: { x: 1, y: 1 },
          to: { x: 4, y: 1 },
          cells: [
            { point: { x: 2, y: 1 }, kind: 'bridge', treasuryCost: 18 },
            { point: { x: 3, y: 1 }, kind: 'bridge', treasuryCost: 18 },
          ],
          bridgeCells: 2,
          roadCells: 0,
          treasuryCost: 36,
          missingTreasury: 0,
          canAfford: true,
        },
      },
      overlayMode: 'roads',
      metricLabel: '未连通',
      target: { point: { x: 0, y: 2 }, label: '未连通住宅' },
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
        pressureRoadCells: 0,
        serviceHeat: 1,
        cargoCongestion: 1,
      },
    })
  })

  it('projects activity pressure onto road cells when paths use the road network', () => {
    const snapshot = makeSnapshot({
      cells: [
        { point: { x: 4, y: 5 }, terrain: 'land', elevation: 0, road: 'stone' },
        { point: { x: 5, y: 5 }, terrain: 'land', elevation: 0, road: 'stone' },
        { point: { x: 6, y: 5 }, terrain: 'land', elevation: 0, road: 'stone' },
      ],
      agents: {
        shopper1: serviceAgent('shopper1', { x: 4, y: 5 }),
        shopper2: serviceAgent('shopper2', { x: 4, y: 5 }),
        cart1: cargoAgent('cart1', { x: 4, y: 5 }),
      },
    })

    expect(deriveStageMapOverlay('activity', snapshot, 16)).toMatchObject({
      label: '城市活动热力',
      points: expect.arrayContaining([
        { kind: 'activity', label: '服路x3', position: { x: 4, y: 5 } },
        { kind: 'activity', label: '服路x3', position: { x: 6, y: 5 } },
      ]),
      summary: ['道压 3', '服务热 2', '货拥 1'],
      metrics: {
        roadPressure: 3,
        pressureRoadCells: 3,
        serviceHeat: 2,
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
          label: '补仓储缓冲',
          tool: 'building',
          buildingType: 'granary',
          overlayMode: 'activity',
        },
        overlayMode: 'activity',
        metricLabel: '货拥',
        target: { point: { x: 4, y: 5 }, label: '货运热x4' },
      },
    ])
  })

  it('recommends service points or roads according to the dominant activity pressure', () => {
    const serviceSnapshot = makeSnapshot({
      agents: {
        shopper1: serviceAgent('shopper1', { x: 4, y: 5 }),
        shopper2: serviceAgent('shopper2', { x: 4, y: 5 }),
        shopper3: serviceAgent('shopper3', { x: 4, y: 5 }),
      },
    })
    const roadSnapshot = makeSnapshot({
      agents: {
        worker1: commuteAgent('worker1', { x: 4, y: 5 }),
        worker2: commuteAgent('worker2', { x: 4, y: 5 }),
        worker3: commuteAgent('worker3', { x: 4, y: 5 }),
        worker4: commuteAgent('worker4', { x: 4, y: 5 }),
      },
    })

    expect(deriveStageGovernanceCards(serviceSnapshot)[0]).toMatchObject({
      id: 'governance-activity-pressure',
      action: '在服务热区附近补市场、医馆或文化服务点，减少居民跨区排队。 当前快照没有可评估地图地块，先查看图层定位问题。',
      metricLabel: '服务热',
      recommendation: {
        label: '补服务点分流',
        tool: 'building',
        buildingType: 'market',
        overlayMode: 'activity',
      },
    })
    expect(deriveStageGovernanceCards(roadSnapshot)[0]).toMatchObject({
      id: 'governance-activity-pressure',
      action: '在道压热区旁补平行道路或短连线，让通勤和返家路线分流。',
      metricLabel: '道压',
      recommendation: {
        label: '铺路分流',
        tool: 'road',
        overlayMode: 'activity',
      },
    })
  })

  it('explains locked recommendation buildings and falls back to inspection', () => {
    const locked = explainStageRecommendationAvailability({
      label: '营造木作坊',
      tool: 'building',
      buildingType: 'woodshop',
      overlayMode: 'activity',
    }, makeSnapshot())
    const unlocked = explainStageRecommendationAvailability({
      label: '营造木作坊',
      tool: 'building',
      buildingType: 'woodshop',
      overlayMode: 'activity',
    }, makeSnapshot({
      metrics: {
        population: 16,
        households: 4,
        employedWorkers: 4,
        availableJobs: 8,
        housingCapacity: 48,
        satisfaction: 80,
        logisticsEfficiency: 90,
        cityAttraction: 45,
        activeDistricts: 2,
      },
    }))

    expect(locked).toMatchObject({
      label: '先解锁商贸镇',
      tool: 'inspect',
      overlayMode: 'activity',
      availability: {
        unlocked: false,
        currentStageLabel: '水乡镇',
        requiredStageLabel: '商贸镇',
        reason: '木作坊需要进入商贸镇后营造，当前阶段是水乡镇。',
      },
    })
    expect(unlocked).toMatchObject({
      label: '营造木作坊',
      tool: 'building',
      buildingType: 'woodshop',
      availability: {
        unlocked: true,
        currentStageLabel: '商贸镇',
        requiredStageLabel: '商贸镇',
      },
    })
  })

  it('diagnoses whether an unlocked recommendation has land and road access', () => {
    const ready = explainStageRecommendationAvailability({
      label: '营造集市',
      tool: 'building',
      buildingType: 'market',
      overlayMode: 'service',
    }, makeSnapshot({
      cells: [
        ...landRect(0, 0, 4, 3),
        { point: { x: 1, y: 2 }, terrain: 'land', elevation: 0, road: 'stone' },
      ],
      buildings: {
        granary: { ...building('granary', 'granary', { x: 8, y: 8 }), inventory: { wood: 10, stone: 10 } },
      },
      economy: { treasury: 500, taxRate: 0.1, lastTaxIncome: 0, lastMaintenanceCost: 0 },
    }))
    const noRoad = explainStageRecommendationAvailability({
      label: '营造集市',
      tool: 'building',
      buildingType: 'market',
      overlayMode: 'service',
    }, makeSnapshot({
      cells: landRect(0, 0, 4, 3),
      buildings: {
        granary: { ...building('granary', 'granary', { x: 8, y: 8 }), inventory: { wood: 10, stone: 10 } },
      },
      economy: { treasury: 500, taxRate: 0.1, lastTaxIncome: 0, lastMaintenanceCost: 0 },
    }))
    const noMaterials = explainStageRecommendationAvailability({
      label: '营造集市',
      tool: 'building',
      buildingType: 'market',
      overlayMode: 'service',
    }, makeSnapshot({
      cells: [
        ...landRect(0, 0, 4, 3),
        { point: { x: 1, y: 2 }, terrain: 'land', elevation: 0, road: 'stone' },
      ],
      economy: { treasury: 500, taxRate: 0.1, lastTaxIncome: 0, lastMaintenanceCost: 0 },
    }))

    expect(ready).toMatchObject({
      tool: 'building',
      buildingType: 'market',
      execution: {
        buildable: true,
        reason: '已找到空地和道路入口，可切换到营造工具试放。',
        candidate: { x: 0, y: 0 },
        roadAnchors: 1,
      },
    })
    expect(noRoad).toMatchObject({
      tool: 'building',
      buildingType: 'market',
      execution: {
        buildable: false,
        reason: '已有空地但入口未贴近道路，先铺一段连接路再营造。',
        roadAnchors: 0,
      },
    })
    expect(noMaterials).toMatchObject({
      execution: {
        buildable: false,
        reason: '营造资源不足：木料×4、石料×2。',
        missingMaterials: { wood: 4, stone: 2 },
        missingTreasury: 0,
      },
    })
  })

  it('adds a recommended placement candidate to an existing overlay', () => {
    const recommendation = explainStageRecommendationAvailability({
      label: '营造集市',
      tool: 'building',
      buildingType: 'market',
      overlayMode: 'service',
    }, makeSnapshot({
      cells: [
        ...landRect(0, 0, 4, 3),
        { point: { x: 1, y: 2 }, terrain: 'land', elevation: 0, road: 'stone' },
      ],
      buildings: {
        granary: { ...building('granary', 'granary', { x: 8, y: 8 }), inventory: { wood: 10, stone: 10 } },
      },
      economy: { treasury: 500, taxRate: 0.1, lastTaxIncome: 0, lastMaintenanceCost: 0 },
    }))

    expect(withRecommendationExecutionOverlay({
      id: 20,
      label: '服务范围',
      points: [{ kind: 'service', label: '服务点', position: { x: 4, y: 5 } }],
      summary: ['服务点 1'],
    }, recommendation, 21)).toMatchObject({
      id: 21,
      label: '服务范围',
      points: [
        { kind: 'placement', label: '建议落点', position: { x: 0, y: 0 } },
        { kind: 'placement', label: '入口', position: { x: 1, y: 1 } },
        { kind: 'service', label: '服务点', position: { x: 4, y: 5 } },
      ],
      summary: ['推荐 临河集市', '服务点 1'],
    })
  })

  it('adds a recommended building footprint and entrance cells to the placement overlay', () => {
    const recommendation = explainStageRecommendationAvailability({
      label: '营造集市',
      tool: 'building',
      buildingType: 'market',
      overlayMode: 'service',
    }, makeSnapshot({
      cells: [
        ...landRect(0, 0, 4, 3),
        { point: { x: 1, y: 2 }, terrain: 'land', elevation: 0, road: 'stone' },
      ],
      buildings: {
        granary: { ...building('granary', 'granary', { x: 8, y: 8 }), inventory: { wood: 10, stone: 10 } },
      },
      economy: { treasury: 500, taxRate: 0.1, lastTaxIncome: 0, lastMaintenanceCost: 0 },
    }))

    const overlay = withRecommendationExecutionOverlay(undefined, recommendation, 22)

    expect(recommendation.execution).toMatchObject({
      candidate: { x: 0, y: 0 },
      entrance: { x: 1, y: 1 },
      footprint: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
        { x: 2, y: 1 },
      ],
    })
    expect(overlay).toMatchObject({
      id: 22,
      label: '推荐营造位置',
      cells: [
        { kind: 'placement', label: '占地', status: 'footprint', position: { x: 0, y: 0 } },
        { kind: 'placement', label: '占地', status: 'footprint', position: { x: 1, y: 0 } },
        { kind: 'placement', label: '占地', status: 'footprint', position: { x: 2, y: 0 } },
        { kind: 'placement', label: '占地', status: 'footprint', position: { x: 0, y: 1 } },
        { kind: 'placement', label: '占地', status: 'footprint', position: { x: 1, y: 1 } },
        { kind: 'placement', label: '占地', status: 'footprint', position: { x: 2, y: 1 } },
        { kind: 'placement', label: '入口', status: 'entrance', position: { x: 1, y: 1 } },
      ],
    })
  })

  it('adds road plan construction cells to recommendation overlays', () => {
    const overlay = withRecommendationExecutionOverlay(undefined, {
      label: '打开道路图层并接回主路网',
      tool: 'road',
      overlayMode: 'roads',
      roadPlan: {
        from: { x: 1, y: 1 },
        to: { x: 4, y: 1 },
        cells: [
          { point: { x: 2, y: 1 }, kind: 'stone', treasuryCost: 6 },
          { point: { x: 3, y: 1 }, kind: 'bridge', treasuryCost: 18 },
        ],
        roadCells: 1,
        bridgeCells: 1,
        treasuryCost: 24,
        missingTreasury: 0,
        canAfford: true,
      },
    }, 26)

    expect(overlay).toMatchObject({
      id: 26,
      label: '推荐补线位置',
      summary: ['补线 2 格', '预计银两 24'],
      cells: [
        { kind: 'road', label: '道路', status: 'planned', position: { x: 2, y: 1 } },
        { kind: 'road', label: '桥梁', status: 'bridge', position: { x: 3, y: 1 } },
      ],
    })
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

  it.each([
    {
      reason: 'no-carrier' as const,
      label: '补充承运人调度',
      tool: 'inspect' as const,
      metricLabel: '缺车',
      actionIncludes: '补充车船',
      planKind: 'add-carrier-dispatch' as const,
      focusRole: 'source' as const,
      focusBuildingId: 'source',
    },
    {
      reason: 'no-route' as const,
      label: '打开道路图层并修通线路',
      tool: 'road' as const,
      metricLabel: '断路',
      actionIncludes: '修通道路',
      planKind: 'build-road-link' as const,
      focusRole: 'route' as const,
      focusBuildingId: 'market',
    },
    {
      reason: 'destination-capacity' as const,
      label: '扩建仓储容量',
      tool: 'building' as const,
      buildingType: 'granary',
      metricLabel: '仓满',
      actionIncludes: '扩仓',
      planKind: 'expand-storage' as const,
      focusRole: 'destination' as const,
      focusBuildingId: 'market',
    },
    {
      reason: 'source-inventory-insufficient' as const,
      label: '检查来源库存',
      tool: 'inspect' as const,
      metricLabel: '缺货源',
      actionIncludes: '补生产',
      planKind: 'inspect-source-stock' as const,
      focusRole: 'source' as const,
      focusBuildingId: 'source',
    },
    {
      reason: 'destination-throughput' as const,
      label: '分流卸货压力',
      tool: 'building' as const,
      buildingType: 'granary',
      metricLabel: '卸货排队',
      actionIncludes: '分流卸货',
      planKind: 'split-unload' as const,
      focusRole: 'destination' as const,
      focusBuildingId: 'market',
    },
  ])('recommends a specific logistics fix for $reason', ({
    reason,
    label,
    tool,
    buildingType,
    metricLabel,
    actionIncludes,
    planKind,
    focusRole,
    focusBuildingId,
  }) => {
    const snapshot = makeSnapshot({
      buildings: {
        source: building('source', 'granary', { x: 2, y: 2 }),
        market: building('market', 'market', { x: 4, y: 5 }),
      },
      logisticsOrders: Object.fromEntries([1, 2, 3].map((index) => [
        `order-${index}`,
        {
          id: `order-${index}`,
          resource: 'food',
          amount: 1,
          sourceBuildingId: 'source',
          destinationBuildingId: 'market',
          priority: 10,
          state: 'waiting',
          failureReason: reason,
          ...(reason === 'destination-throughput' ? { state: 'in_transit' as const } : {}),
        },
      ])),
      ...(reason === 'destination-throughput'
        ? {
            logisticsQueues: {
              market: {
                buildingId: 'market',
                unloadCapacityPerTick: 1,
                unloadedThisTick: 1,
                waitingToUnloadCount: 3,
                longestWaitTicks: 5,
                waitingOrderIds: ['order-1', 'order-2', 'order-3'],
              },
            },
          }
        : {}),
    })

    const card = deriveStageGovernanceCards(snapshot)
      .find((item) => item.id === 'governance-logistics-hotspots')

    expect(card).toMatchObject({
      recommendation: {
        label,
        tool,
        ...(buildingType ? { buildingType } : {}),
        overlayMode: 'logistics',
        logisticsPlan: {
          kind: planKind,
          orderIds: ['order-1', 'order-2', 'order-3'],
          sourceBuildingId: 'source',
          destinationBuildingId: 'market',
          resource: 'food',
          focusRole,
          focusBuildingId,
        },
      },
      metricLabel,
    })
    expect(card?.action).toContain(actionIncludes)
    if (reason === 'no-route') {
      expect(card?.recommendation.roadPlan).toMatchObject({
        from: { x: 2, y: 2 },
        to: { x: 4, y: 5 },
        roadCells: 4,
        bridgeCells: 0,
        treasuryCost: 24,
        missingTreasury: 0,
        canAfford: true,
      })
      expect(card?.recommendation.roadPlan?.cells.map((cell) => cell.point)).toEqual([
        { x: 3, y: 2 },
        { x: 4, y: 2 },
        { x: 4, y: 3 },
        { x: 4, y: 4 },
      ])
    } else {
      expect(card?.recommendation.roadPlan).toBeUndefined()
    }
  })

  it('places storage execution candidates near the logistics hotspot', () => {
    const cells = landRect(0, 0, 9, 9).map((cell) => {
      const key = `${cell.point.x},${cell.point.y}`
      const occupied = new Map([
        ['2,1', 'source'],
        ['3,1', 'source'],
        ['2,2', 'source'],
        ['3,2', 'source'],
        ['6,5', 'market'],
        ['7,5', 'market'],
        ['8,5', 'market'],
        ['6,6', 'market'],
        ['7,6', 'market'],
        ['8,6', 'market'],
      ]).get(key)
      return {
        ...cell,
        ...(key === '1,2' || key === '5,7' ? { road: { kind: 'street' as const } } : {}),
        ...(occupied ? { buildingId: occupied } : {}),
      }
    })
    const snapshot = makeSnapshot({
      cells,
      buildings: {
        source: { ...building('source', 'granary', { x: 2, y: 2 }), inventory: { wood: 3, stone: 2 } },
        market: building('market', 'market', { x: 6, y: 6 }),
      },
      economy: { treasury: 500, taxRate: 0.1, lastTaxIncome: 0, lastMaintenanceCost: 0 },
      logisticsOrders: Object.fromEntries([1, 2, 3].map((index) => [
        `order-${index}`,
        {
          id: `order-${index}`,
          resource: 'food',
          amount: 1,
          sourceBuildingId: 'source',
          destinationBuildingId: 'market',
          priority: 10,
          state: 'waiting',
          failureReason: 'destination-capacity',
        },
      ])),
    })

    const card = deriveStageGovernanceCards(snapshot)
      .find((item) => item.id === 'governance-logistics-hotspots')

    expect(card?.recommendation.logisticsPlan).toMatchObject({
      kind: 'expand-storage',
      focusRole: 'destination',
      focusBuildingId: 'market',
    })
    expect(card?.recommendation.execution).toMatchObject({
      buildable: true,
      reason: '已找到靠近物流热点的仓储落点，可切换到营造工具试放。',
      candidate: { x: 4, y: 5 },
      entrance: { x: 5, y: 6 },
      footprint: [
        { x: 4, y: 5 },
        { x: 5, y: 5 },
        { x: 4, y: 6 },
        { x: 5, y: 6 },
      ],
      rotation: 0,
      roadAnchors: 2,
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

function landRect(x: number, y: number, width: number, height: number): SimulationSnapshot['cells'] {
  return Array.from({ length: width * height }, (_, index) => ({
    point: {
      x: x + (index % width),
      y: y + Math.floor(index / width),
    },
    terrain: 'land',
    elevation: 0,
  }))
}

function serviceAgent(id: string, position: { x: number; y: number }): SimulationSnapshot['agents'][string] {
  return {
    id,
    role: 'resident',
    householdId: 'family',
    position,
    path: [position, { x: position.x + 1, y: position.y }, { x: position.x + 2, y: position.y }],
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
    path: [
      position,
      { x: position.x + 1, y: position.y },
      { x: position.x + 2, y: position.y },
      { x: position.x + 3, y: position.y },
    ],
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

function commuteAgent(id: string, position: { x: number; y: number }): SimulationSnapshot['agents'][string] {
  return {
    id,
    role: 'worker',
    householdId: 'family',
    employerBuildingId: 'granary',
    position,
    path: [
      position,
      { x: position.x + 1, y: position.y },
      { x: position.x + 2, y: position.y },
    ],
    pathIndex: 0,
    activity: 'commuting',
  }
}
