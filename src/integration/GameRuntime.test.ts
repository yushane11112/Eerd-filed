import { describe, expect, it } from 'vitest'
import { GameRuntime } from './GameRuntime'
import { deriveStageGovernanceCards, deriveStageMapOverlay } from './stageAdvisor'

describe('GameRuntime integration', () => {
  it('boots a connected town with housing, jobs and residents', () => {
    const runtime = new GameRuntime()
    const snapshot = runtime.getSnapshot()

    expect(Object.keys(snapshot.buildings).length).toBeGreaterThanOrEqual(5)
    expect(snapshot.metrics.housingCapacity).toBeGreaterThan(0)
    expect(snapshot.metrics.population).toBeGreaterThan(0)
    expect(snapshot.metrics.employedWorkers).toBeGreaterThan(0)
    expect(snapshot.districts?.length).toBeGreaterThan(0)
    expect(snapshot.metrics.activeDistricts).toBe(snapshot.districts?.length)
    expect(snapshot.districts?.some((district) => district.kind === 'market-street')).toBe(true)
  })

  it('injects the resident lifecycle browser fixture into the live engine', () => {
    const runtime = new GameRuntime({ debugScenario: 'civilization-resident-timeline' })
    const timeline = runtime.getSnapshot().cityTimeline ?? []

    expect(timeline).toEqual(expect.arrayContaining([
      expect.objectContaining({
        source: 'migration-candidate-arrived',
        resident: expect.objectContaining({ phase: 'arrived', origin: '候选家庭' }),
      }),
      expect.objectContaining({
        source: 'household-migrated',
        resident: expect.objectContaining({ phase: 'settled', origin: '外来家庭' }),
      }),
    ]))
  })

  it('places roads and road-connected buildings into the shared snapshot', () => {
    const runtime = new GameRuntime()
    const before = runtime.getSnapshot()
    expect(runtime.placeRoad({ x: 6, y: 10 }).ok).toBe(true)
    expect(runtime.placeRoad({ x: 6, y: 9 }).ok).toBe(true)
    expect(runtime.placeRoad({ x: 6, y: 8 }).ok).toBe(true)

    const result = runtime.placeBuilding('house', { x: 4, y: 8 }, 0)
    const after = runtime.getSnapshot()
    expect(result.ok).toBe(true)
    expect(result.buildingId).toBeTruthy()
    expect(result.construction).toEqual({
      treasury: 80,
      materials: { wood: 2, stone: 1 },
    })
    expect(after.buildings[result.buildingId!]).toBeDefined()
    expect(after.economy.treasury).toBe(before.economy.treasury - 18 - 80)
    expect(after.buildings['granary-1'].inventory.wood).toBe((before.buildings['granary-1'].inventory.wood ?? 0) - 2)
    expect(after.buildings['granary-1'].inventory.stone).toBe((before.buildings['granary-1'].inventory.stone ?? 0) - 1)
  })

  it('lays roads along a dragged path and reports skipped cells without discarding valid segments', () => {
    const runtime = new GameRuntime()

    const result = runtime.placeRoadPath([
      { x: 3, y: 4 },
      { x: 4, y: 4 },
      { x: 5, y: 4 },
      { x: 6, y: 4 },
      { x: 7, y: 4 },
      { x: 8, y: 9 },
    ])
    const snapshot = runtime.getSnapshot()
    const roadKeys = new Set(snapshot.cells.filter((cell) => cell.road).map((cell) => `${cell.point.x},${cell.point.y}`))

    expect(result).toMatchObject({
      ok: true,
      message: '连续铺设 5 格石板路，花费银两30，跳过 1 格。',
      roadPath: {
        placed: 5,
        skipped: 1,
        blocked: 1,
        invalidTerrain: 0,
        outOfBounds: 0,
        treasuryCost: 30,
      },
    })
    expect(snapshot.economy.treasury).toBe(2370)
    expect(['3,4', '4,4', '5,4', '6,4', '7,4'].every((key) => roadKeys.has(key))).toBe(true)
    expect(snapshot.buildings['house-1'].origin).toEqual({ x: 8, y: 9 })
  })

  it('limits road construction to the treasury available for the path', () => {
    const runtime = new GameRuntime({ initialTreasury: 10 })

    const result = runtime.placeRoadPath([
      { x: 3, y: 4 },
      { x: 4, y: 4 },
    ])
    const snapshot = runtime.getSnapshot()
    const roads = new Set(snapshot.cells.filter((cell) => cell.road).map((cell) => `${cell.point.x},${cell.point.y}`))

    expect(result).toMatchObject({
      ok: true,
      message: '连续铺设 1 格石板路，花费银两6，跳过 1 格。',
      roadPath: {
        placed: 1,
        skipped: 1,
        unaffordable: 1,
        treasuryCost: 6,
        missingTreasury: 2,
      },
    })
    expect(snapshot.economy.treasury).toBe(4)
    expect(roads.has('3,4')).toBe(true)
    expect(roads.has('4,4')).toBe(false)
  })

  it('does not charge or require treasury when dragging over existing roads', () => {
    const runtime = new GameRuntime({ initialTreasury: 4 })

    const result = runtime.placeRoadPath([
      { x: 13, y: 11 },
      { x: 3, y: 4 },
    ])
    const snapshot = runtime.getSnapshot()
    const roads = new Set(snapshot.cells.filter((cell) => cell.road).map((cell) => `${cell.point.x},${cell.point.y}`))

    expect(result).toMatchObject({
      ok: false,
      message: '银两不足2，无法铺设道路。',
      roadPath: {
        placed: 0,
        skipped: 2,
        unchanged: 1,
        unaffordable: 1,
        treasuryCost: 0,
        missingTreasury: 2,
      },
    })
    expect(snapshot.economy.treasury).toBe(4)
    expect(roads.has('13,11')).toBe(true)
    expect(roads.has('3,4')).toBe(false)
  })

  it('builds bridges across water and shore with dedicated treasury cost', () => {
    const runtime = new GameRuntime({ initialTreasury: 40 })

    const result = runtime.placeBridgePath([
      { x: 0, y: 11 },
      { x: 1, y: 11 },
      { x: 2, y: 11 },
    ])
    const snapshot = runtime.getSnapshot()
    const bridgeCells = snapshot.cells
      .filter((cell) => ['0,11', '1,11', '2,11'].includes(`${cell.point.x},${cell.point.y}`))

    expect(result).toMatchObject({
      ok: true,
      message: '连续架设 2 格桥路，花费银两36，跳过 1 格。',
      roadPath: {
        placed: 2,
        skipped: 1,
        unaffordable: 1,
        missingTreasury: 14,
        treasuryCost: 36,
      },
    })
    expect(snapshot.economy.treasury).toBe(4)
    expect(bridgeCells.filter((cell) => cell.road === 'bridge')).toHaveLength(2)
  })

  it('rejects bridges on ordinary land without charging treasury', () => {
    const runtime = new GameRuntime({ initialTreasury: 40 })

    const result = runtime.placeBridgePath([{ x: 3, y: 4 }])
    const snapshot = runtime.getSnapshot()
    const target = snapshot.cells.find((cell) => cell.point.x === 3 && cell.point.y === 4)

    expect(result).toMatchObject({
      ok: false,
      message: '桥路只能架在水面或岸边。',
      roadPath: {
        placed: 0,
        skipped: 1,
        invalidTerrain: 1,
        treasuryCost: 0,
      },
    })
    expect(snapshot.economy.treasury).toBe(40)
    expect(target?.road).toBeUndefined()
  })

  it('builds a mixed road plan with roads and bridges in one action', () => {
    const runtime = new GameRuntime({ initialTreasury: 40 })

    const result = runtime.buildRoadPlan({
      cells: [
        { point: { x: 3, y: 4 }, kind: 'stone' },
        { point: { x: 0, y: 11 }, kind: 'bridge' },
        { point: { x: 1, y: 11 }, kind: 'bridge' },
      ],
    })
    const snapshot = runtime.getSnapshot()
    const roadByKey = new Map(snapshot.cells.map((cell) => [`${cell.point.x},${cell.point.y}`, cell.road]))

    expect(result).toMatchObject({
      ok: true,
      message: '补线施工完成：铺设道路 1 格、桥梁 1 格，花费银两24，跳过 1 格。',
      roadPath: {
        placed: 2,
        skipped: 1,
        unaffordable: 1,
        treasuryCost: 24,
        missingTreasury: 2,
      },
    })
    expect(snapshot.economy.treasury).toBe(16)
    expect(roadByKey.get('3,4')).toBe('stone')
    expect(roadByKey.get('0,11')).toBe('bridge')
    expect(roadByKey.get('1,11')).toBeUndefined()
  })

  it('provides a debug scenario for exercising disconnected road plan governance end to end', () => {
    const runtime = new GameRuntime({ debugScenario: 'isolated-road-network' })
    const beforeCards = deriveStageGovernanceCards(runtime.getSnapshot())
    const roadCard = beforeCards.find((card) => card.id === 'governance-road-disconnected')

    expect(roadCard?.recommendation.roadPlan).toMatchObject({
      cells: expect.arrayContaining([
        expect.objectContaining({ point: { x: 6, y: 11 }, kind: 'stone' }),
      ]),
      roadCells: expect.any(Number),
      treasuryCost: expect.any(Number),
      canAfford: true,
    })

    const beforeMetrics = deriveRoadMetrics(runtime)
    const result = runtime.buildRoadPlan({
      cells: roadCard!.recommendation.roadPlan!.cells.map((cell) => ({
        point: cell.point,
        kind: cell.kind,
      })),
    })
    const afterMetrics = deriveRoadMetrics(runtime)

    expect(result.ok).toBe(true)
    expect(afterMetrics.disconnectedEntrances).toBeLessThan(beforeMetrics.disconnectedEntrances)
    expect(afterMetrics.isolatedRoadNetworks).toBeLessThan(beforeMetrics.isolatedRoadNetworks)
  })

  it('provides a low treasury debug scenario for road plan affordability failures', () => {
    const runtime = new GameRuntime({ debugScenario: 'isolated-road-network-low-treasury' })
    const roadCard = deriveStageGovernanceCards(runtime.getSnapshot())
      .find((card) => card.id === 'governance-road-disconnected')

    expect(runtime.getSnapshot().economy.treasury).toBe(4)
    expect(roadCard?.recommendation.roadPlan).toMatchObject({
      roadCells: 1,
      treasuryCost: 6,
      missingTreasury: 2,
      canAfford: false,
    })

    const result = runtime.buildRoadPlan({
      cells: roadCard!.recommendation.roadPlan!.cells.map((cell) => ({
        point: cell.point,
        kind: cell.kind,
      })),
    })

    expect(result).toMatchObject({
      ok: false,
      message: '银两不足2，无法执行补线施工。',
      roadPath: {
        placed: 0,
        skipped: 1,
        unaffordable: 1,
        missingTreasury: 2,
      },
    })
    expect(runtime.getSnapshot().economy.treasury).toBe(4)
  })

  it('removes roads along a dragged path and reports cells that were not roads', () => {
    const runtime = new GameRuntime()
    runtime.placeRoadPath([
      { x: 3, y: 4 },
      { x: 4, y: 4 },
      { x: 5, y: 4 },
    ])

    const result = runtime.removeRoadPath([
      { x: 3, y: 4 },
      { x: 4, y: 4 },
      { x: 5, y: 4 },
      { x: 6, y: 4 },
      { x: 99, y: 99 },
    ])
    const snapshot = runtime.getSnapshot()
    const roads = new Set(snapshot.cells.filter((cell) => cell.road).map((cell) => `${cell.point.x},${cell.point.y}`))

    expect(result).toMatchObject({
      ok: true,
      message: '拆除 3 格道路，跳过 2 格。',
      roadPath: {
        removed: 3,
        skipped: 2,
        notRoad: 1,
        outOfBounds: 1,
      },
    })
    expect(['3,4', '4,4', '5,4'].some((key) => roads.has(key))).toBe(false)
  })

  it('demolishes a house by migrating out its households and freeing occupied cells', () => {
    const runtime = new GameRuntime()
    const before = runtime.getSnapshot()
    const householdIds = Object.values(before.households)
      .filter((household) => household.homeBuildingId === 'house-1')
      .map((household) => household.id)
    const householdAgentIds = Object.values(before.agents)
      .filter((agent) => agent.householdId && householdIds.includes(agent.householdId))
      .map((agent) => agent.id)

    expect(householdIds.length).toBeGreaterThan(0)

    const result = runtime.demolishBuilding('house-1')
    const after = runtime.getSnapshot()

    expect(result).toMatchObject({
      ok: true,
      buildingId: 'house-1',
      demolition: {
        householdsRemoved: householdIds.length,
        agentsRemoved: householdAgentIds.length,
      },
    })
    expect(after.buildings['house-1']).toBeUndefined()
    expect(after.cells.some((cell) => cell.buildingId === 'house-1')).toBe(false)
    expect(householdIds.every((id) => after.households[id] === undefined)).toBe(true)
    expect(householdAgentIds.every((id) => after.agents[id] === undefined)).toBe(true)
    expect(Object.values(after.buildings).every((building) => (
      building.workers.every((workerId) => !householdAgentIds.includes(workerId))
    ))).toBe(true)
  })

  it('cancels logistics and releases carriers when demolishing a referenced building', () => {
    const runtime = new GameRuntime()
    const snapshot = mutableRuntimeSnapshot(runtime)
    snapshot.logisticsOrders['demo-order'] = {
      id: 'demo-order',
      resource: 'food',
      amount: 3,
      sourceBuildingId: 'granary-1',
      destinationBuildingId: 'market-1',
      priority: 10,
      state: 'assigned',
      carrierId: 'carrier-1',
    }
    snapshot.agents['carrier-1'].activity = 'delivering'
    snapshot.agents['carrier-1'].cargoIntent = {
      orderId: 'demo-order',
      resource: 'food',
      amount: 3,
      sourceBuildingId: 'granary-1',
      destinationBuildingId: 'market-1',
      phase: 'pickup',
    }

    const result = runtime.demolishBuilding('granary-1')
    const after = runtime.getSnapshot()

    expect(result).toMatchObject({
      ok: true,
      buildingId: 'granary-1',
      demolition: {
        ordersCancelled: 1,
        carriersReleased: 1,
      },
    })
    expect(after.buildings['granary-1']).toBeUndefined()
    expect(after.cells.some((cell) => cell.buildingId === 'granary-1')).toBe(false)
    expect(after.logisticsOrders['demo-order']).toMatchObject({
      state: 'cancelled',
      cancelReason: 'building-demolished',
    })
    expect(after.logisticsOrders['demo-order']).not.toHaveProperty('failureReason')
    expect(after.logisticsOrders['demo-order']).not.toHaveProperty('carrierId')
    expect(after.agents['carrier-1']).toMatchObject({
      activity: 'idle',
      path: [],
      pathIndex: 0,
    })
    expect(after.agents['carrier-1']).not.toHaveProperty('cargoIntent')
  })

  it('redispatches active logistics orders by releasing carriers back to the waiting queue', () => {
    const runtime = new GameRuntime()
    const snapshot = mutableRuntimeSnapshot(runtime)
    snapshot.logisticsQueues = {
      'market-1': {
        buildingId: 'market-1',
        unloadCapacityPerTick: 1,
        unloadedThisTick: 1,
        waitingToUnloadCount: 1,
        longestWaitTicks: 4,
        waitingOrderIds: ['dispatch-order'],
      },
    }
    snapshot.logisticsOrders['dispatch-order'] = {
      id: 'dispatch-order',
      resource: 'food',
      amount: 2,
      sourceBuildingId: 'granary-1',
      destinationBuildingId: 'market-1',
      priority: 80,
      state: 'assigned',
      carrierId: 'carrier-1',
      failureReason: 'no-carrier',
      throughputQueuedSinceTick: 12,
    }
    snapshot.agents['carrier-1'].activity = 'delivering'
    snapshot.agents['carrier-1'].path = [{ x: 13, y: 11 }, { x: 12, y: 11 }]
    snapshot.agents['carrier-1'].pathIndex = 1
    snapshot.agents['carrier-1'].cargoIntent = {
      orderId: 'dispatch-order',
      resource: 'food',
      amount: 2,
      sourceBuildingId: 'granary-1',
      destinationBuildingId: 'market-1',
      phase: 'pickup',
    }

    const result = runtime.redispatchLogisticsOrders(['dispatch-order', 'missing-order', 'dispatch-order'])
    const after = runtime.getSnapshot()

    expect(result).toMatchObject({
      ok: true,
      logisticsDispatch: {
        ordersReset: 1,
        carriersReleased: 1,
        missingOrders: 1,
      },
    })
    expect(after.logisticsOrders['dispatch-order']).toMatchObject({
      state: 'waiting',
    })
    expect(after.logisticsOrders['dispatch-order']).not.toHaveProperty('carrierId')
    expect(after.logisticsOrders['dispatch-order']).not.toHaveProperty('failureReason')
    expect(after.logisticsOrders['dispatch-order']).not.toHaveProperty('throughputQueuedSinceTick')
    expect(after.agents['carrier-1']).toMatchObject({
      activity: 'idle',
      path: [],
      pathIndex: 0,
    })
    expect(after.agents['carrier-1']).not.toHaveProperty('cargoIntent')
    expect(after.logisticsQueues).toEqual({})
  })

  it('adds a carrier for blocked logistics plans and lets the economy dispatch it', () => {
    const runtime = new GameRuntime()
    const snapshot = mutableRuntimeSnapshot(runtime)
    snapshot.agents['carrier-1'].activity = 'delivering'
    snapshot.agents['carrier-1'].cargoIntent = {
      orderId: 'busy-order',
      resource: 'food',
      amount: 1,
      sourceBuildingId: 'granary-1',
      destinationBuildingId: 'market-1',
      phase: 'pickup',
    }
    snapshot.logisticsOrders['capacity-order'] = {
      id: 'capacity-order',
      resource: 'food',
      amount: 2,
      sourceBuildingId: 'granary-1',
      destinationBuildingId: 'market-1',
      priority: 90,
      state: 'waiting',
      failureReason: 'no-carrier',
    }

    const result = runtime.addCarrierForLogisticsPlan({
      orderIds: ['capacity-order', 'missing-order', 'capacity-order'],
      sourceBuildingId: 'granary-1',
    })
    const afterAdd = runtime.getSnapshot()

    expect(result).toMatchObject({
      ok: true,
      logisticsCarrier: {
        carrierId: 'runtime-cart-1',
        carriersAdded: 1,
        ordersReset: 1,
        carriersReleased: 0,
        missingOrders: 1,
        sourceBuildingId: 'granary-1',
      },
    })
    expect(afterAdd.agents['runtime-cart-1']).toMatchObject({
      role: 'cart',
      activity: 'idle',
      position: afterAdd.buildings['granary-1'].entrance,
    })
    expect(afterAdd.logisticsOrders['capacity-order']).toMatchObject({
      state: 'waiting',
    })
    expect(afterAdd.logisticsOrders['capacity-order']).not.toHaveProperty('failureReason')

    runtime.advance(1_000)
    const afterAdvance = runtime.getSnapshot()

    expect(afterAdvance.logisticsOrders['capacity-order']).toMatchObject({
      carrierId: 'runtime-cart-1',
    })
    expect(afterAdvance.logisticsOrders['capacity-order'].state).not.toBe('waiting')
    expect(afterAdvance.logisticsOrders['capacity-order']).not.toHaveProperty('failureReason')
    expect(afterAdvance.agents['runtime-cart-1'].cargoIntent).toMatchObject({
      orderId: 'capacity-order',
      resource: 'food',
      sourceBuildingId: 'granary-1',
      destinationBuildingId: 'market-1',
    })
  })

  it('transfers reserve stock into a logistics source and retries blocked orders', () => {
    const runtime = new GameRuntime()
    const snapshot = mutableRuntimeSnapshot(runtime)
    snapshot.buildings['granary-1'].inventory = { wood: 14, stone: 8 }
    snapshot.buildings['riceField-1'].inventory = { food: 8 }
    snapshot.logisticsQueues = {
      'market-1': {
        buildingId: 'market-1',
        unloadCapacityPerTick: 1,
        unloadedThisTick: 0,
        waitingToUnloadCount: 1,
        longestWaitTicks: 3,
        waitingOrderIds: ['stock-order'],
      },
    }
    snapshot.logisticsOrders['stock-order'] = {
      id: 'stock-order',
      resource: 'food',
      amount: 6,
      sourceBuildingId: 'granary-1',
      destinationBuildingId: 'market-1',
      priority: 85,
      state: 'assigned',
      carrierId: 'carrier-1',
      failureReason: 'source-inventory-insufficient',
      throughputQueuedSinceTick: 21,
    }
    snapshot.agents['carrier-1'].activity = 'delivering'
    snapshot.agents['carrier-1'].path = [{ x: 13, y: 11 }]
    snapshot.agents['carrier-1'].pathIndex = 0
    snapshot.agents['carrier-1'].cargoIntent = {
      orderId: 'stock-order',
      resource: 'food',
      amount: 6,
      sourceBuildingId: 'granary-1',
      destinationBuildingId: 'market-1',
      phase: 'pickup',
    }

    const result = runtime.transferSourceInventoryForLogisticsPlan({
      orderIds: ['stock-order', 'missing-order', 'stock-order'],
      sourceBuildingId: 'granary-1',
      resource: 'food',
    })
    const after = runtime.getSnapshot()

    expect(result).toMatchObject({
      ok: true,
      logisticsTransfer: {
        resource: 'food',
        transferred: 6,
        sourceBuildingId: 'granary-1',
        donorBuildingIds: ['riceField-1'],
        ordersReset: 1,
        carriersReleased: 1,
        missingOrders: 1,
        missingAmount: 0,
      },
    })
    expect(after.buildings['granary-1'].inventory.food).toBe(6)
    expect(after.buildings['riceField-1'].inventory.food).toBe(2)
    expect(after.logisticsOrders['stock-order']).toMatchObject({
      state: 'waiting',
    })
    expect(after.logisticsOrders['stock-order']).not.toHaveProperty('carrierId')
    expect(after.logisticsOrders['stock-order']).not.toHaveProperty('failureReason')
    expect(after.logisticsOrders['stock-order']).not.toHaveProperty('throughputQueuedSinceTick')
    expect(after.agents['carrier-1']).toMatchObject({
      activity: 'idle',
      path: [],
      pathIndex: 0,
    })
    expect(after.agents['carrier-1']).not.toHaveProperty('cargoIntent')
    expect(after.logisticsQueues).toEqual({})
  })

  it('builds storage from a logistics storage plan and retries congested orders', () => {
    const runtime = new GameRuntime()
    const snapshot = mutableRuntimeSnapshot(runtime)
    snapshot.buildings['granary-1'].inventory = { wood: 20, stone: 10 }
    const candidate = snapshot.cells
      .map((cell) => cell.point)
      .find((point) => runtime.previewBuildingPlacement('granary', point, 0).valid)
    expect(candidate).toBeDefined()

    snapshot.logisticsQueues = {
      'market-1': {
        buildingId: 'market-1',
        unloadCapacityPerTick: 1,
        unloadedThisTick: 0,
        waitingToUnloadCount: 1,
        longestWaitTicks: 4,
        waitingOrderIds: ['storage-order'],
      },
    }
    snapshot.logisticsOrders['storage-order'] = {
      id: 'storage-order',
      resource: 'food',
      amount: 4,
      sourceBuildingId: 'granary-1',
      destinationBuildingId: 'market-1',
      priority: 88,
      state: 'assigned',
      carrierId: 'carrier-1',
      failureReason: 'destination-capacity',
      throughputQueuedSinceTick: 33,
    }
    snapshot.agents['carrier-1'].activity = 'delivering'
    snapshot.agents['carrier-1'].path = [{ x: 14, y: 5 }]
    snapshot.agents['carrier-1'].pathIndex = 0
    snapshot.agents['carrier-1'].cargoIntent = {
      orderId: 'storage-order',
      resource: 'food',
      amount: 4,
      sourceBuildingId: 'granary-1',
      destinationBuildingId: 'market-1',
      phase: 'dropoff',
    }

    const beforeTreasury = snapshot.economy.treasury
    const result = runtime.buildStorageForLogisticsPlan({
      orderIds: ['storage-order', 'missing-order', 'storage-order'],
      point: candidate!,
      buildingType: 'granary',
    })
    const after = runtime.getSnapshot()

    expect(result).toMatchObject({
      ok: true,
      logisticsStorage: {
        buildingType: 'granary',
        ordersReset: 1,
        carriersReleased: 1,
        missingOrders: 1,
        queuesCleared: 1,
      },
    })
    expect(result.logisticsStorage?.buildingId).toMatch(/^granary-/)
    expect(result.construction).toEqual({ treasury: 140, materials: { wood: 3, stone: 2 } })
    expect(after.economy.treasury).toBe(beforeTreasury - 140)
    expect(after.buildings[result.logisticsStorage!.buildingId!]).toMatchObject({
      type: 'granary',
      origin: candidate,
      status: 'idle',
    })
    expect(after.logisticsOrders['storage-order']).toMatchObject({
      state: 'waiting',
    })
    expect(after.logisticsOrders['storage-order']).not.toHaveProperty('carrierId')
    expect(after.logisticsOrders['storage-order']).not.toHaveProperty('failureReason')
    expect(after.logisticsOrders['storage-order']).not.toHaveProperty('throughputQueuedSinceTick')
    expect(after.agents['carrier-1']).toMatchObject({
      activity: 'idle',
      path: [],
      pathIndex: 0,
    })
    expect(after.agents['carrier-1']).not.toHaveProperty('cargoIntent')
    expect(after.logisticsQueues).toEqual({})
    expect(after.logisticsStorageInterventions?.[result.logisticsStorage!.buildingId!]).toEqual({
      tick: after.tick,
      ordersReset: 1,
      carriersReleased: 1,
      queuesCleared: 1,
    })
    expect(after.logisticsStorageInterventionHistory).toEqual([{
      eventId: `logistics-storage-${result.logisticsStorage!.buildingId}-${after.tick}`,
      buildingId: result.logisticsStorage!.buildingId,
      buildingType: 'granary',
      tick: after.tick,
      orderIds: ['storage-order'],
      ordersReset: 1,
      carriersReleased: 1,
      queuesCleared: 1,
    }])
  })

  it('previews building placement footprint and conflicts without mutating the city', () => {
    const runtime = new GameRuntime()
    runtime.placeRoad({ x: 6, y: 10 })
    runtime.placeRoad({ x: 6, y: 9 })
    runtime.placeRoad({ x: 6, y: 8 })
    const before = runtime.getSnapshot()

    const valid = runtime.previewBuildingPlacement('house', { x: 4, y: 8 }, 0)
    const roadConflict = runtime.previewBuildingPlacement('house', { x: 6, y: 8 }, 0)
    const noRoad = runtime.previewBuildingPlacement('house', { x: 20, y: 18 }, 0)

    expect(valid).toMatchObject({
      valid: true,
      reason: undefined,
      entrance: { x: 5, y: 9 },
      cells: [
        { status: 'footprint', position: { x: 4, y: 8 } },
        { status: 'footprint', position: { x: 5, y: 8 } },
        { status: 'footprint', position: { x: 4, y: 9 } },
        { status: 'footprint', position: { x: 5, y: 9 } },
        { status: 'entrance', position: { x: 5, y: 9 } },
      ],
    })
    expect(roadConflict).toMatchObject({
      valid: false,
      reason: '这个位置已被占用',
    })
    expect(roadConflict.cells.some((cell) => cell.status === 'blocked' && cell.position.x === 6 && cell.position.y === 8))
      .toBe(true)
    expect(noRoad).toMatchObject({
      valid: false,
      reason: '入口必须紧邻道路',
    })
    expect(noRoad.cells.some((cell) => cell.status === 'blocked' && cell.label === '入口未连路'))
      .toBe(true)
    expect(runtime.getSnapshot().buildings).toEqual(before.buildings)
    expect(runtime.getSnapshot().economy.treasury).toBe(before.economy.treasury)
  })

  it('rejects construction when city storage cannot pay the material cost', () => {
    const runtime = new GameRuntime()
    const placed = placeManyHouses(runtime, 7)
    const beforeFailure = runtime.getSnapshot()
    const result = runtime.placeBuilding('house', { x: 22, y: 16 }, 0)
    const after = runtime.getSnapshot()

    expect(placed).toBe(7)
    expect(result).toMatchObject({
      ok: false,
      message: '材料不足：木料×2',
    })
    expect(after.economy.treasury).toBe(beforeFailure.economy.treasury)
    expect(Object.values(after.buildings).some((building) => building.origin.x === 22 && building.origin.y === 16)).toBe(false)
  })

  it('marks otherwise valid placement previews invalid when construction resources are missing', () => {
    const runtime = new GameRuntime()
    expect(placeManyHouses(runtime, 7)).toBe(7)

    const preview = runtime.previewBuildingPlacement('house', { x: 22, y: 16 }, 0)

    expect(preview).toMatchObject({
      valid: false,
      reason: '材料不足：木料×2',
      construction: {
        canAfford: false,
        missingMaterials: { wood: 2 },
        missingTreasury: 0,
      },
    })
    expect(preview.cells.some((cell) => cell.status === 'footprint')).toBe(true)
  })

  it('rejects buildings that are locked behind a later city stage', () => {
    const runtime = new GameRuntime()

    const result = runtime.placeBuilding('woodshop', { x: 4, y: 8 }, 0)

    expect(result).toEqual({
      ok: false,
      message: '木作坊需要进入商贸镇后营造。',
    })
    expect(Object.values(runtime.getSnapshot().buildings)
      .some((building) => building.type === 'woodshop')).toBe(false)
  })

  it('settles completed songs into rare-only reward state', () => {
    const runtime = new GameRuntime()
    for (let index = 0; index < 5; index += 1) runtime.completeSong()
    const rareCount = Object.values(runtime.getSnapshot().rareRewards.inventory)
      .reduce((sum, value) => sum + (value ?? 0), 0)

    expect(rareCount).toBeGreaterThanOrEqual(1)
    expect(runtime.getSnapshot().worldDrops).toHaveLength(0)
  })

  it('starts an upgrade through the runtime API, then advance completes it and refreshes observable capacity', () => {
    const runtime = new GameRuntime()
    const before = runtime.getSnapshot()

    const result = runtime.upgradeBuilding('granary-1')
    const started = runtime.getSnapshot()

    expect(result.ok).toBe(true)
    expect(result.upgrade).toEqual({
      level: 2,
      cost: { wood: 2, stone: 1 },
      effect: { capacity: 115, jobs: 2 },
    })
    expect(started.buildings['granary-1'].level).toBe(before.buildings['granary-1'].level)
    expect(started.buildings['granary-1'].status).toBe('upgrading')
    expect(started.buildings['granary-1'].productionProgress).toBe(0)
    expect(started.buildings['granary-1'].inventory.wood).toBe(12)
    expect(started.buildings['granary-1'].inventory.stone).toBe(7)

    runtime.advance(3_800)
    expect(runtime.getSnapshot().buildings['granary-1'].status).toBe('upgrading')
    expect(runtime.getSnapshot().buildings['granary-1'].productionProgress).toBe(19)

    runtime.advance(200)
    const completed = runtime.getSnapshot()
    expect(completed.buildings['granary-1'].level).toBe(before.buildings['granary-1'].level + 1)
    expect(completed.buildings['granary-1'].status).toBe('idle')
    expect(completed.buildings['granary-1'].productionProgress).toBe(0)
  })

  it('starts a building upgrade through the runtime API using city storage materials first', () => {
    const runtime = new GameRuntime()
    const before = runtime.getSnapshot()

    const result = runtime.upgradeBuilding('house-1')
    const after = runtime.getSnapshot()

    expect(result.ok).toBe(true)
    expect(result.upgrade).toEqual({
      level: 2,
      cost: { wood: 2, stone: 1 },
      effect: { capacity: 14, jobs: 0 },
    })
    expect(after.buildings['house-1'].level).toBe(before.buildings['house-1'].level)
    expect(after.buildings['house-1'].status).toBe('upgrading')
    expect(after.buildings['house-1'].inventory).toEqual({})
    expect(after.buildings['granary-1'].inventory.wood).toBe(12)
    expect(after.buildings['granary-1'].inventory.stone).toBe(7)
  })

  it('rejects duplicate runtime upgrade requests while construction is already in progress', () => {
    const runtime = new GameRuntime()

    const first = runtime.upgradeBuilding('house-1')
    const duplicate = runtime.upgradeBuilding('house-1')

    expect(first.ok).toBe(true)
    expect(duplicate).toMatchObject({
      ok: false,
      buildingId: 'house-1',
      message: '这座建筑正在升级中',
    })
    expect(runtime.getSnapshot().buildings['house-1'].level).toBe(1)
    expect(runtime.getSnapshot().buildings['house-1'].status).toBe('upgrading')
    expect(runtime.getSnapshot().buildings['granary-1'].inventory.wood).toBe(12)
    expect(runtime.getSnapshot().buildings['granary-1'].inventory.stone).toBe(7)
  })

  it('quotes building upgrade cost and missing materials without mutating storage', () => {
    const runtime = new GameRuntime()
    mutableRuntimeSnapshot(runtime).buildings['granary-1'].inventory.cloth = 1

    const firstQuote = runtime.getBuildingUpgradeQuote('house-1')
    const before = runtime.getSnapshot()
    for (let index = 0; index < 4; index += 1) {
      runtime.upgradeBuilding('house-1')
      runtime.advance(10_000)
    }
    const missingQuote = runtime.getBuildingUpgradeQuote('house-1')
    const afterQuote = runtime.getSnapshot()

    expect(firstQuote).toMatchObject({
      buildingId: 'house-1',
      currentLevel: 1,
      nextLevel: 2,
      cost: { wood: 2, stone: 1 },
      missing: {},
      canUpgrade: true,
      effect: { capacity: 14, jobs: 0 },
      economic: {
        capacityDelta: 2,
        productionValueDelta: 0,
        serviceCapacityDelta: 0,
        verdict: 'no-return',
      },
    })
    expect(before.buildings['granary-1'].inventory.wood).toBe(14)
    expect(before.buildings['granary-1'].inventory.stone).toBe(8)
    expect(missingQuote).toMatchObject({
      currentLevel: 5,
      nextLevel: 6,
      cost: { wood: 6, stone: 3 },
      missing: { wood: 6, stone: 1 },
      canUpgrade: false,
      reason: 'insufficient-materials',
    })
    expect(afterQuote.buildings['granary-1'].inventory.wood).toBeUndefined()
    expect(afterQuote.buildings['granary-1'].inventory.stone).toBe(2)
  })
})

function mutableRuntimeSnapshot(runtime: GameRuntime): ReturnType<GameRuntime['getSnapshot']> {
  return (runtime as unknown as { engine: { state: ReturnType<GameRuntime['getSnapshot']> } }).engine.state
}

function deriveRoadMetrics(runtime: GameRuntime) {
  const metrics = deriveStageMapOverlay('roads', runtime.getSnapshot())?.metrics ?? {}
  return {
    disconnectedEntrances: metrics.disconnectedEntrances ?? 0,
    isolatedRoadNetworks: metrics.isolatedRoadNetworks ?? 0,
  }
}

function placeManyHouses(runtime: GameRuntime, target: number): number {
  const origins = [
    { x: 4, y: 3 },
    { x: 4, y: 5 },
    { x: 4, y: 8 },
    { x: 4, y: 12 },
    { x: 4, y: 14 },
    { x: 4, y: 16 },
    { x: 8, y: 3 },
  ]
  let placed = 0
  for (const origin of origins) {
    runtime.placeRoad({ x: origin.x + 2, y: origin.y + 1 })
    const result = runtime.placeBuilding('house', origin, 0)
    if (result.ok) placed += 1
    if (placed >= target) break
  }
  runtime.placeRoad({ x: 24, y: 17 })
  return placed
}
