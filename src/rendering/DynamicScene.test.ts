import { describe, expect, it } from 'vitest'
import type { BuildingEntity, SimulationSnapshot } from '../simulation/contracts'
import sampleAnimationManifest from '../../docs/project/gold-slice/sample-manifests/main-pier/animation-manifest.json'
import sampleBuildingManifest from '../../docs/project/gold-slice/sample-manifests/main-pier/building-manifest.json'
import validAnimationManifest from '../../tools/asset-validator/fixtures/valid-animation-manifest.json'
import validBuildingManifest from '../../tools/asset-validator/fixtures/valid-building-manifest.json'

// Pixi performs a canvas blend-mode capability probe during module loading.
// The scene tests do not render pixels, so a minimal context keeps jsdom quiet.
HTMLCanvasElement.prototype.getContext = (() => ({
  fillStyle: '',
  globalCompositeOperation: 'source-over',
  fillRect: () => undefined,
  drawImage: () => undefined,
  measureText: (text: string) => ({ width: text.length * 7 }),
  getImageData: () => ({ data: new Uint8ClampedArray([0, 0, 0, 0]) }),
})) as typeof HTMLCanvasElement.prototype.getContext

function createSnapshot(): SimulationSnapshot {
  return {
    version: 6,
    seed: 42,
    tick: 10,
    speed: 1,
    cells: [],
    buildings: {
      kiln: {
        id: 'kiln',
        type: 'kiln',
        origin: { x: 2, y: 2 },
        rotation: 0,
        level: 3,
        entrance: { x: 2, y: 3 },
        status: 'working',
        workers: [],
        inventory: {},
        productionProgress: 0.5,
      },
    },
    households: {},
    migrationCandidates: {},
    agents: {
      walker: {
        id: 'walker',
        role: 'worker',
        position: { x: 2, y: 3 },
        path: [{ x: 3, y: 3 }],
        pathIndex: 0,
        activity: 'commuting',
      },
      cart: {
        id: 'cart',
        role: 'cart',
        position: { x: 3, y: 3 },
        path: [{ x: 4, y: 3 }],
        pathIndex: 0,
        activity: 'delivering',
      },
    },
    logisticsOrders: {},
    economy: {
      treasury: 100,
      taxRate: 0.1,
      lastTaxIncome: 0,
      lastMaintenanceCost: 0,
    },
    metrics: {
      population: 1,
      households: 0,
      employedWorkers: 1,
      availableJobs: 0,
      housingCapacity: 0,
      satisfaction: 1,
      logisticsEfficiency: 1,
    },
    worldDrops: [{
      id: 'wood-drop',
      resource: 'wood',
      amount: 2,
      position: { x: 2, y: 4 },
      source: 'production',
      createdTick: 9,
    }],
    rareRewards: {
      missesSinceReward: 0,
      rewardsToday: 0,
      dayKey: '2026-06-25',
      processedEventIds: [],
      inventory: {},
    },
  }
}

function createBuilding(overrides: Partial<BuildingEntity> & Pick<BuildingEntity, 'id'>): BuildingEntity {
  return {
    id: overrides.id,
    type: 'kiln',
    origin: { x: 2, y: 2 },
    rotation: 0,
    level: 3,
    entrance: { x: 2, y: 3 },
    status: 'working',
    workers: [],
    inventory: {},
    productionProgress: 0.5,
    ...overrides,
  }
}

function childLabels(display: { children: readonly { label?: string }[] }): string[] {
  return display.children.map((child) => child.label ?? '')
}

function findPrefabLayer(display: { children: readonly { label?: string }[] }) {
  return display.children.find((child) => (
    typeof child.label === 'string' && child.label.startsWith('prefab-placeholder:')
  ))
}

describe('DynamicScene', () => {
  const camera = {
    x: -400,
    y: -200,
    zoom: 1,
    viewportWidth: 1200,
    viewportHeight: 800,
  }

  it('synchronizes entities into dedicated layers', async () => {
    const { DynamicScene } = await import('./DynamicScene')
    const scene = new DynamicScene()
    const stats = scene.sync(createSnapshot(), camera, 0.5)

    expect(stats).toMatchObject({
      buildings: 1,
      residents: 1,
      transport: 1,
      drops: 1,
      visible: 4,
    })
    expect(scene.layers.buildings.children).toHaveLength(1)
    expect(scene.layers.residents.children).toHaveLength(1)
    expect(scene.layers.transport.children).toHaveLength(1)
    expect(scene.layers.drops.children).toHaveLength(1)
  })

  it('culls offscreen entities before rebuilding their visuals and refreshes them on reveal', async () => {
    const { DynamicScene } = await import('./DynamicScene')
    const scene = new DynamicScene()
    const snapshot = createSnapshot()
    snapshot.buildings.remote = createBuilding({
      id: 'remote',
      origin: { x: 200, y: 200 },
      entrance: { x: 200, y: 201 },
    })

    const culled = scene.sync(snapshot, camera)

    expect(culled.buildings).toBe(2)
    expect(culled.visible).toBe(4)
    expect(scene.layers.buildings.children).toHaveLength(2)
    expect(scene.layers.buildings.children.filter((child) => child.visible)).toHaveLength(1)

    const revealed = scene.sync(snapshot, {
      x: -1000,
      y: -1000,
      zoom: 1,
      viewportWidth: 10000,
      viewportHeight: 20000,
    })

    expect(revealed.visible).toBe(5)
    expect(scene.layers.buildings.children.filter((child) => child.visible)).toHaveLength(2)
  })

  it('reduces far building detail when many buildings are visible at target scale', async () => {
    const { DynamicScene } = await import('./DynamicScene')
    const snapshot = createSnapshot()
    snapshot.buildings = Object.fromEntries(
      Array.from({ length: 140 }, (_, index) => {
        const id = `building-${index.toString().padStart(3, '0')}`
        return [id, createBuilding({
          id,
          origin: { x: index, y: 0 },
          entrance: { x: index, y: 1 },
          type: index % 2 === 0 ? 'house' : 'main-pier',
          status: 'working',
        })]
      }),
    )
    snapshot.agents = {}
    snapshot.worldDrops = []
    const scaleCamera = {
      x: 0,
      y: 0,
      zoom: 1,
      viewportWidth: 20_000,
      viewportHeight: 20_000,
    }

    const scene = new DynamicScene()
    const lodStats = scene.sync(snapshot, scaleCamera)

    expect(lodStats).toMatchObject({
      buildings: 140,
      visible: 140,
      detailedBuildings: 96,
      reducedBuildings: 44,
    })
    expect(scene.layers.buildings.children.filter((child) => child.label === 'building-visual:reduced')).toHaveLength(44)

    const lodDisabledScene = new DynamicScene(undefined, { buildingLod: false })
    const fullStats = lodDisabledScene.sync(snapshot, scaleCamera)

    expect(fullStats).toMatchObject({
      buildings: 140,
      visible: 140,
      detailedBuildings: 140,
      reducedBuildings: 0,
    })
    expect(lodDisabledScene.layers.buildings.children.filter((child) => child.label === 'building-visual:reduced')).toHaveLength(0)
  })

  it('renders a short-lived recovery pulse from the city timeline', async () => {
    const { DynamicScene } = await import('./DynamicScene')
    const snapshot = createSnapshot()
    snapshot.cityTimeline = [{
      id: 'recovery-1',
      tick: 10,
      kind: 'service',
      source: 'service-bottleneck-cleared',
      title: '服务瓶颈解除',
      detail: '药铺恢复医疗服务。',
      buildingId: 'kiln',
      serviceRecovery: {
        need: 'health',
        pressureClearedHouseholds: 1,
        maxPressureTicks: 3,
        buildingStatusBefore: 'blocked',
        buildingStatusAfter: 'serving',
      },
    }]
    const scene = new DynamicScene()
    scene.sync(snapshot, camera)

    const buildingDisplay = scene.layers.buildings.children[0]
    const statusLayer = buildingDisplay.children.find((child) => child.label?.startsWith('building-status-layer:recovery:'))
    expect(statusLayer).toBeDefined()
  })

  it('returns removed entities to their pools', async () => {
    const { DynamicScene } = await import('./DynamicScene')
    const scene = new DynamicScene()
    scene.sync(createSnapshot(), camera)
    const empty = createSnapshot()
    empty.buildings = {}
    empty.agents = {}
    empty.worldDrops = []

    const stats = scene.sync(empty, camera)

    expect(scene.layers.buildings.children).toHaveLength(0)
    expect(scene.layers.residents.children).toHaveLength(0)
    expect(scene.layers.transport.children).toHaveLength(0)
    expect(scene.layers.drops.children).toHaveLength(0)
    expect(stats.pooled).toBeGreaterThanOrEqual(4)
  })

  it('renders waiting migration candidates on the resident layer', async () => {
    const { DynamicScene } = await import('./DynamicScene')
    const scene = new DynamicScene()
    const snapshot = createSnapshot()
    snapshot.agents = {}
    snapshot.worldDrops = []
    snapshot.migrationCandidates = {
      visitor: {
        id: 'visitor',
        members: 3,
        workerCount: 1,
        status: 'waiting',
        position: { x: 4, y: 4 },
        arrivedTick: 8,
        patienceTicks: 4,
        attractionAtArrival: 72,
      },
    }

    const stats = scene.sync(snapshot, camera)

    expect(stats).toMatchObject({
      residents: 1,
      transport: 0,
      drops: 0,
    })
    expect(scene.layers.residents.children).toHaveLength(1)
    expect(childLabels(scene.layers.residents.children[0])).toContain('resident-lifecycle-state:candidate-waiting')
  })

  it('distinguishes a walking candidate from a newly settled resident', async () => {
    const { DynamicScene } = await import('./DynamicScene')
    const scene = new DynamicScene()
    const snapshot = createSnapshot()
    snapshot.tick = 12
    snapshot.buildings = {}
    snapshot.worldDrops = []
    snapshot.migrationCandidates = {
      visitor: {
        id: 'visitor',
        members: 3,
        workerCount: 1,
        status: 'walking',
        position: { x: 4, y: 4 },
        path: [{ x: 4, y: 4 }, { x: 5, y: 4 }],
        pathIndex: 0,
        arrivedTick: 8,
        patienceTicks: 4,
        attractionAtArrival: 72,
      },
    }
    snapshot.agents = {
      settledWorker: {
        id: 'settledWorker',
        role: 'worker',
        householdId: 'new-household',
        position: { x: 6, y: 4 },
        path: [],
        pathIndex: 0,
        activity: 'home',
      },
    }
    snapshot.households = {
      'new-household': {
        id: 'new-household',
        homeBuildingId: 'home',
        members: 3,
        workerIds: ['settledWorker'],
        income: 0,
        satisfaction: 70,
        origin: 'migrated',
        settledTick: 10,
        needs: { food: 100, goods: 100, health: 100, education: 100, entertainment: 100 },
      },
    }

    scene.sync(snapshot, camera)

    const labels = scene.layers.residents.children.map((display) => childLabels(display))
    expect(labels).toEqual(expect.arrayContaining([
      expect.arrayContaining(['resident-lifecycle-state:candidate-walking']),
      expect.arrayContaining(['resident-lifecycle-state:new-arrival']),
    ]))
  })

  it('adds stable activity trail and marker layers for visible agents', async () => {
    const { DynamicScene } = await import('./DynamicScene')
    const scene = new DynamicScene()
    const snapshot = createSnapshot()
    snapshot.buildings = {}
    snapshot.worldDrops = []
    snapshot.agents = {
      commuter: {
        id: 'commuter',
        role: 'worker',
        position: { x: 2, y: 3 },
        path: [{ x: 3, y: 3 }, { x: 4, y: 3 }],
        pathIndex: 0,
        activity: 'commuting',
      },
      service: {
        id: 'service',
        role: 'resident',
        position: { x: 3, y: 4 },
        path: [{ x: 4, y: 4 }],
        pathIndex: 0,
        activity: 'serving',
        serviceIntent: {
          buildingId: 'market-1',
          need: 'food',
          resource: 'food',
          amount: 1,
          saleValue: 2,
          restoreAmount: 10,
        },
      },
      pickup: {
        id: 'pickup',
        role: 'cart',
        position: { x: 4, y: 5 },
        path: [{ x: 5, y: 5 }],
        pathIndex: 0,
        activity: 'delivering',
        cargoIntent: {
          orderId: 'order-pickup',
          resource: 'food',
          amount: 2,
          sourceBuildingId: 'granary-1',
          destinationBuildingId: 'market-1',
          phase: 'pickup',
        },
      },
      dropoff: {
        id: 'dropoff',
        role: 'cart',
        position: { x: 5, y: 6 },
        path: [{ x: 6, y: 6 }],
        pathIndex: 0,
        activity: 'delivering',
        cargoIntent: {
          orderId: 'order-dropoff',
          resource: 'food',
          amount: 2,
          sourceBuildingId: 'granary-1',
          destinationBuildingId: 'market-1',
          phase: 'dropoff',
        },
      },
    }

    scene.sync(snapshot, camera, 0.5)

    expect(scene.layers.residents.children).toHaveLength(2)
    expect(scene.layers.transport.children).toHaveLength(2)
    const residentMarkers = scene.layers.residents.children.flatMap((display) => childLabels(display))
    const transportMarkers = scene.layers.transport.children.flatMap((display) => childLabels(display))
    expect(residentMarkers).toEqual(expect.arrayContaining([
      'agent-activity-trail:commute',
      'agent-body:worker:commuting',
      'agent-activity-marker:commute',
      'agent-activity-trail:service-visit',
      'agent-body:resident:serving',
      'agent-activity-marker:service-visit',
    ]))
    expect(transportMarkers).toEqual(expect.arrayContaining([
      'agent-activity-trail:cargo-pickup',
      'agent-body:cart:delivering',
      'agent-activity-marker:cargo-pickup',
      'agent-activity-trail:cargo-dropoff',
      'agent-activity-marker:cargo-dropoff',
    ]))

    const beforeResidentLabels = scene.layers.residents.children.map((display) => childLabels(display))
    const beforeTransportLabels = scene.layers.transport.children.map((display) => childLabels(display))
    snapshot.tick += 1
    scene.sync(snapshot, camera, 0.5)
    expect(scene.layers.residents.children.map((display) => childLabels(display))).toEqual(beforeResidentLabels)
    expect(scene.layers.transport.children.map((display) => childLabels(display))).toEqual(beforeTransportLabels)
  })

  it('renders district prosperity below buildings without duplicating visuals', async () => {
    const { DynamicScene } = await import('./DynamicScene')
    const scene = new DynamicScene()
    const snapshot = createSnapshot()
    snapshot.districts = [{
      id: 'district:market-street',
      kind: 'market-street',
      name: '临河市街',
      center: { x: 2, y: 3 },
      buildingIds: ['kiln'],
      prosperity: 76,
      activityLevel: 'busy',
      visualHints: { lanterns: 3, footTraffic: 4, decoration: 2 },
    }]

    const first = scene.sync(snapshot, camera)
    const second = scene.sync({ ...snapshot, tick: snapshot.tick + 1 }, camera)

    expect(first).toMatchObject({
      districts: 1,
      visible: expect.any(Number),
    })
    expect(second.districts).toBe(1)
    expect(scene.layers.districts.children).toHaveLength(1)
    expect(childLabels(scene.layers.districts.children[0])).toEqual([
      'district-prosperity-ground:market-street:high',
      'district-prosperity-lamps:market-street:high',
      'district-prosperity-activity:busy',
    ])
  })

  it('adds distinct procedural building status layers without growing pooled visuals', async () => {
    const { DynamicScene } = await import('./DynamicScene')
    const scene = new DynamicScene()
    const snapshot = createSnapshot()
    snapshot.buildings = {
      working: createBuilding({ id: 'working', status: 'working', origin: { x: 1, y: 1 } }),
      serving: createBuilding({ id: 'serving', status: 'serving', origin: { x: 2, y: 1 } }),
      delivering: createBuilding({ id: 'delivering', status: 'delivering', origin: { x: 3, y: 1 } }),
      blockedInput: createBuilding({
        id: 'blockedInput',
        status: 'blocked',
        statusReason: 'missing-input:wood',
        origin: { x: 4, y: 1 },
      }),
      blockedStorage: createBuilding({
        id: 'blockedStorage',
        status: 'blocked',
        statusReason: 'output-full',
        origin: { x: 5, y: 1 },
      }),
      blockedWorkers: createBuilding({
        id: 'blockedWorkers',
        status: 'blocked',
        statusReason: 'no-workers',
        origin: { x: 6, y: 1 },
      }),
      blockedLogistics: createBuilding({
        id: 'blockedLogistics',
        status: 'blocked',
        statusReason: 'logistics-failed:food:no-route',
        origin: { x: 7, y: 1 },
      }),
    }
    snapshot.agents = {}
    snapshot.worldDrops = []

    scene.sync(snapshot, camera)

    const layers = scene.layers.buildings.children.map((buildingDisplay) => {
      const statusLayer = buildingDisplay.children.find((child) => (
        typeof child.label === 'string' && child.label.startsWith('building-status-layer')
      ))
      return {
        displayChildCount: buildingDisplay.children.length,
        layerLabel: statusLayer?.label,
        motionLayer: buildingDisplay.children.find((child) => (
          typeof child.label === 'string' && child.label.startsWith('building-artwork-motion-layer:')
        ))?.label,
        statusChildCount: statusLayer?.children.length,
        statusChildLabels: statusLayer ? childLabels(statusLayer) : [],
        hintLayer: statusLayer?.children.find((child) => (
          typeof child.label === 'string' && child.label.startsWith('building-status-hint:')
        )),
      }
    })

    expect(layers).toHaveLength(7)
    expect(layers.map((layer) => layer.layerLabel)).toEqual(expect.arrayContaining([
      'building-status-layer:working',
      'building-status-layer:serving',
      'building-status-layer:delivering',
      'building-status-layer:blocked:missing-input',
      'building-status-layer:blocked:storage-full',
      'building-status-layer:blocked:no-workers',
      'building-status-layer:blocked:logistics-failed',
    ]))
    expect(layers.map((layer) => layer.motionLayer)).toEqual(expect.arrayContaining([
      expect.stringMatching(/^building-artwork-motion-layer:/),
    ]))
    expect(layers.map((layer) => layer.hintLayer?.label)).toEqual(expect.arrayContaining([
      'building-status-hint:blocked:missing-input:缺料',
      'building-status-hint:blocked:storage-full:仓满',
      'building-status-hint:blocked:no-workers:缺工',
      'building-status-hint:blocked:logistics-failed:物流失败',
    ]))
    for (const layer of layers) {
      expect(layer.displayChildCount).toBe(3)
      expect(layer.statusChildCount).toBe(4)
      expect(layer.statusChildLabels).toEqual(expect.arrayContaining([
        expect.stringMatching(/^building-status-mask:/),
        expect.stringMatching(/^building-status-symbol:/),
        expect.stringMatching(/^building-status-motion:/),
        expect.stringMatching(/^building-status-hint:/),
      ]))
    }

    const beforeChildCounts = scene.layers.buildings.children.map((buildingDisplay) => [
      buildingDisplay.children.length,
      buildingDisplay.children[1]?.children.length,
      buildingDisplay.children[1]?.children.at(-1)?.children.length,
    ])
    snapshot.tick += 1
    scene.sync(snapshot, camera)
    const afterChildCounts = scene.layers.buildings.children.map((buildingDisplay) => [
      buildingDisplay.children.length,
      buildingDisplay.children[1]?.children.length,
      buildingDisplay.children[1]?.children.at(-1)?.children.length,
    ])

    expect(afterChildCounts).toEqual(beforeChildCounts)
  })

  it('can sync buildings with prefab descriptor-driven placeholder visuals enabled', async () => {
    const { DynamicScene } = await import('./DynamicScene')
    const { parseRuntimePrefabDescriptor, PrefabRuntimeRegistry } = await import('./prefab')
    const parsed = parseRuntimePrefabDescriptor(validBuildingManifest, validAnimationManifest)
    if (!parsed.ok) throw new Error(parsed.errors.join('\n'))
    const prefabRegistry = new PrefabRuntimeRegistry([parsed.descriptor])
    const scene = new DynamicScene(undefined, { prefabRegistry })
    const snapshot = createSnapshot()
    snapshot.buildings = {
      pier: createBuilding({
        id: 'pier',
        type: 'main-pier',
        level: 6,
        status: 'blocked',
        statusReason: 'output-full',
      }),
    }
    snapshot.agents = {}
    snapshot.worldDrops = []

    const stats = scene.sync(snapshot, camera)

    expect(stats).toMatchObject({
      buildings: 1,
      residents: 0,
      transport: 0,
      drops: 0,
      visible: 1,
    })
    const prefabLayer = scene.layers.buildings.children[0]?.children.find((child) => (
      typeof child.label === 'string' && child.label.startsWith('prefab-placeholder:')
    ))
    expect(prefabLayer?.label).toBe('prefab-placeholder:main-pier:L4:storage_full:storage-full')
    expect(childLabels(prefabLayer ?? { children: [] })).toEqual([
      'prefab-placeholder-shell',
      'prefab-placeholder-outline',
      'prefab-placeholder-info-bar',
      'prefab-placeholder-status-bar',
      'prefab-placeholder-level-marks',
      'prefab-placeholder-main-pier-details:L4',
      'prefab-placeholder-label:main-pier:L4',
    ])
    const blockedMotionLayer = scene.layers.buildings.children[0]?.children.find((child) => (
      typeof child.label === 'string' && child.label.startsWith('building-artwork-motion-layer:')
    ))
    expect(blockedMotionLayer?.label).toContain('storage-full')

    snapshot.tick += 1
    snapshot.buildings.pier = createBuilding({
      id: 'pier',
      type: 'main-pier',
      level: 8,
      status: 'working',
      productionProgress: 0.75,
    })
    scene.sync(snapshot, camera)

    const updatedPrefabLayer = scene.layers.buildings.children[0]?.children.find((child) => (
      typeof child.label === 'string' && child.label.startsWith('prefab-placeholder:')
    ))
    expect(updatedPrefabLayer?.label).toBe(
      'prefab-placeholder:main-pier:L8:working:staff-entry+input-receive+production-primary+production-secondary+output-ready',
    )
    expect(childLabels(updatedPrefabLayer ?? { children: [] })).toEqual([
      'prefab-placeholder-shell',
      'prefab-placeholder-outline',
      'prefab-placeholder-info-bar',
      'prefab-placeholder-status-bar',
      'prefab-placeholder-level-marks',
      'prefab-placeholder-main-pier-details:L8',
      'prefab-placeholder-label:main-pier:L8',
    ])
    const workingMotionLayer = scene.layers.buildings.children[0]?.children.find((child) => (
      typeof child.label === 'string' && child.label.startsWith('building-artwork-motion-layer:')
    ))
    expect(workingMotionLayer?.label).toContain('production-primary')
  })

  it('throttles full-detail building motion updates between adjacent simulation ticks', async () => {
    const { DynamicScene } = await import('./DynamicScene')
    const scene = new DynamicScene()
    const snapshot = createSnapshot()
    snapshot.agents = {}
    snapshot.worldDrops = []

    scene.sync(snapshot, camera)
    const motionLayer = scene.layers.buildings.children[0]?.children.find((child) => (
      typeof child.label === 'string' && child.label.startsWith('building-artwork-motion-layer:')
    ))
    const initialLabel = motionLayer?.label
    expect(initialLabel).toContain('tick-10')

    snapshot.tick += 1
    scene.sync(snapshot, camera)
    expect(motionLayer?.label).toBe(initialLabel)

    snapshot.tick += 1
    scene.sync(snapshot, camera)
    expect(motionLayer?.label).toContain('tick-12')
  })

  it('skips unchanged building visual refreshes while preserving status changes', async () => {
    const { DynamicScene } = await import('./DynamicScene')
    const scene = new DynamicScene()
    const snapshot = createSnapshot()
    snapshot.agents = {}
    snapshot.worldDrops = []

    scene.sync(snapshot, camera)
    const motionLayer = scene.layers.buildings.children[0]?.children.find((child) => (
      typeof child.label === 'string' && child.label.startsWith('building-artwork-motion-layer:')
    ))
    const initialMotionLabel = motionLayer?.label
    expect(initialMotionLabel).toContain('working')

    snapshot.tick += 1
    scene.sync(snapshot, camera)
    expect(motionLayer?.label).toBe(initialMotionLabel)

    snapshot.tick += 1
    snapshot.buildings.kiln = {
      ...snapshot.buildings.kiln,
      status: 'blocked',
      statusReason: 'missing-input:wood',
    }
    scene.sync(snapshot, camera)
    expect(motionLayer?.label).toContain('blocked')
    const statusLayer = scene.layers.buildings.children[0]?.children.find((child) => (
      typeof child.label === 'string' && child.label.startsWith('building-status-layer:')
    ))
    expect(statusLayer?.label).toContain('blocked:missing-input')
  })

  it('draws stable level-specific procedural main-pier placeholder detail layers', async () => {
    const { DynamicScene } = await import('./DynamicScene')
    const { parseRuntimePrefabDescriptor, PrefabRuntimeRegistry } = await import('./prefab')
    const parsed = parseRuntimePrefabDescriptor(sampleBuildingManifest, sampleAnimationManifest)
    if (!parsed.ok) throw new Error(parsed.errors.join('\n'))
    const prefabRegistry = new PrefabRuntimeRegistry([parsed.descriptor])
    const scene = new DynamicScene(undefined, { prefabRegistry })
    const snapshot = createSnapshot()
    snapshot.agents = {}
    snapshot.worldDrops = []

    const expectedByLevel = [
      {
        id: 'pier-l0',
        level: 0,
        label: 'prefab-placeholder:main-pier:L0:constructing:construction',
        detailLayer: 'prefab-placeholder-main-pier-details:L0',
        detailChildren: [
          'main-pier-placeholder-water-edge:broken',
          'main-pier-placeholder-deck:collapsed-single-berth',
          'main-pier-placeholder-repair-clutter:L0',
        ],
      },
      {
        id: 'pier-l4',
        level: 4,
        label: 'prefab-placeholder:main-pier:L4:idle:base+idle-detail',
        detailLayer: 'prefab-placeholder-main-pier-details:L4',
        detailChildren: [
          'main-pier-placeholder-warehouse:L4',
          'main-pier-placeholder-berths:double',
          'main-pier-placeholder-cargo-winch:L4',
        ],
      },
      {
        id: 'pier-l8',
        level: 8,
        label: 'prefab-placeholder:main-pier:L8:working:staff-entry+input-receive+production-primary+production-secondary+output-ready',
        detailLayer: 'prefab-placeholder-main-pier-details:L8',
        detailChildren: [
          'main-pier-placeholder-warehouse-row:L8',
          'main-pier-placeholder-berths:multi',
          'main-pier-placeholder-heavy-lift-crane:L8',
        ],
      },
    ] as const

    for (const expected of expectedByLevel) {
      snapshot.buildings = {
        [expected.id]: createBuilding({
          id: expected.id,
          type: 'main-pier',
          level: expected.level,
          status: expected.level === 0 ? 'constructing' : expected.level === 8 ? 'working' : 'idle',
          productionProgress: 0.65,
        }),
      }

      scene.sync(snapshot, camera)
      const prefabLayer = findPrefabLayer(scene.layers.buildings.children[0] ?? { children: [] })
      expect(prefabLayer?.label).toBe(expected.label)
      const detailLayer = prefabLayer?.children.find((child) => child.label === expected.detailLayer)
      expect(detailLayer?.label).toBe(expected.detailLayer)
      expect(childLabels(detailLayer ?? { children: [] })).toEqual(expected.detailChildren)

      const beforeLabels = childLabels(prefabLayer ?? { children: [] })
      const beforeDetailLabels = childLabels(detailLayer ?? { children: [] })
      snapshot.tick += 1
      scene.sync(snapshot, camera)
      const stablePrefabLayer = findPrefabLayer(scene.layers.buildings.children[0] ?? { children: [] })
      const stableDetailLayer = stablePrefabLayer?.children.find((child) => child.label === expected.detailLayer)
      expect(childLabels(stablePrefabLayer ?? { children: [] })).toEqual(beforeLabels)
      expect(childLabels(stableDetailLayer ?? { children: [] })).toEqual(beforeDetailLabels)
    }
  })

  it('draws distinct L0 L4 L8 procedural detail layers for additional gold building assets', async () => {
    const { DynamicScene } = await import('./DynamicScene')
    const { parseRuntimePrefabDescriptor, PrefabRuntimeRegistry } = await import('./prefab')
    const goldAssetIds = ['main-homes', 'main-eatery', 'main-granary', 'windfield-rice'] as const
    const descriptors = goldAssetIds.map((assetId) => {
      const parsed = parseRuntimePrefabDescriptor(
        { ...validBuildingManifest, assetId },
        { ...validAnimationManifest, assetId },
      )
      if (!parsed.ok) throw new Error(parsed.errors.join('\n'))
      return parsed.descriptor
    })
    const scene = new DynamicScene(undefined, {
      prefabRegistry: new PrefabRuntimeRegistry(descriptors),
    })
    const snapshot = createSnapshot()
    snapshot.agents = {}
    snapshot.worldDrops = []

    const expectedByAsset = [
      {
        id: 'homes',
        type: 'house',
        detailLayer: 'prefab-placeholder-main-homes-details',
        detailChildrenByLevel: {
          L0: [
            'main-homes-placeholder-lot:abandoned:L0',
            'main-homes-placeholder-hut:collapsed:L0',
            'main-homes-placeholder-yard:weeds:L0',
          ],
          L4: [
            'main-homes-placeholder-courtyard:L4',
            'main-homes-placeholder-homes:cluster:L4',
            'main-homes-placeholder-residents:washline:L4',
          ],
          L8: [
            'main-homes-placeholder-neighborhood:lanes:L8',
            'main-homes-placeholder-homes:dense-row:L8',
            'main-homes-placeholder-civic-yard:lanterns-residents:L8',
          ],
        },
      },
      {
        id: 'eatery',
        type: 'market',
        detailLayer: 'prefab-placeholder-main-eatery-details',
        detailChildrenByLevel: {
          L0: [
            'main-eatery-placeholder-foundation:burnt-stall:L0',
            'main-eatery-placeholder-kitchen:cold-hearth:L0',
            'main-eatery-placeholder-seating:scattered:L0',
          ],
          L4: [
            'main-eatery-placeholder-shopfront:open:L4',
            'main-eatery-placeholder-kitchen:steaming:L4',
            'main-eatery-placeholder-tables:served:L4',
          ],
          L8: [
            'main-eatery-placeholder-food-street:awnings:L8',
            'main-eatery-placeholder-kitchens:busy:L8',
            'main-eatery-placeholder-crowd:banquet-stalls:L8',
          ],
        },
      },
      {
        id: 'granary',
        type: 'granary',
        detailLayer: 'prefab-placeholder-main-granary-details',
        detailChildrenByLevel: {
          L0: [
            'main-granary-placeholder-ground:spilled-grain:L0',
            'main-granary-placeholder-silo:broken:L0',
            'main-granary-placeholder-pest-clutter:L0',
          ],
          L4: [
            'main-granary-placeholder-storehouse:raised:L4',
            'main-granary-placeholder-bins:sorted:L4',
            'main-granary-placeholder-labor:cart-scale:L4',
          ],
          L8: [
            'main-granary-placeholder-warehouse:multi-bay:L8',
            'main-granary-placeholder-silos:stacked:L8',
            'main-granary-placeholder-market-yard:carts-workers:L8',
          ],
        },
      },
      {
        id: 'rice',
        type: 'riceField',
        detailLayer: 'prefab-placeholder-windfield-rice-details',
        detailChildrenByLevel: {
          L0: [
            'windfield-rice-placeholder-paddy:rough:L0',
            'windfield-rice-placeholder-bunds:broken:L0',
            'windfield-rice-placeholder-seedlings:sparse:L0',
          ],
          L4: [
            'windfield-rice-placeholder-paddy:grid:L4',
            'windfield-rice-placeholder-water-channels:L4',
            'windfield-rice-placeholder-workers:planting:L4',
          ],
          L8: [
            'windfield-rice-placeholder-paddy:terraced:L8',
            'windfield-rice-placeholder-irrigation:ordered:L8',
            'windfield-rice-placeholder-harvest:crowded:L8',
          ],
        },
      },
    ] as const

    for (const expected of expectedByAsset) {
      for (const level of [0, 4, 8] as const) {
        const levelKey = `L${level}` as const
        snapshot.buildings = {
          [expected.id]: createBuilding({
            id: expected.id,
            type: expected.type,
            level,
            status: level === 0 ? 'constructing' : level === 8 ? 'working' : 'idle',
            productionProgress: 0.65,
          }),
        }

        scene.sync(snapshot, camera)
        const prefabLayer = findPrefabLayer(scene.layers.buildings.children[0] ?? { children: [] })
        const detailLayer = prefabLayer?.children.find((child) => (
          child.label === `${expected.detailLayer}:${levelKey}`
        ))
        expect(detailLayer?.label).toBe(`${expected.detailLayer}:${levelKey}`)
        expect(childLabels(detailLayer ?? { children: [] })).toEqual(
          expected.detailChildrenByLevel[levelKey],
        )

        const beforeLabels = childLabels(prefabLayer ?? { children: [] })
        const beforeDetailLabels = childLabels(detailLayer ?? { children: [] })
        snapshot.tick += 1
        scene.sync(snapshot, camera)
        const stablePrefabLayer = findPrefabLayer(scene.layers.buildings.children[0] ?? { children: [] })
        const stableDetailLayer = stablePrefabLayer?.children.find((child) => (
          child.label === `${expected.detailLayer}:${levelKey}`
        ))
        expect(childLabels(stablePrefabLayer ?? { children: [] })).toEqual(beforeLabels)
        expect(childLabels(stableDetailLayer ?? { children: [] })).toEqual(beforeDetailLabels)
      }
    }
  })

  it('resolves prefab placeholders through building type to asset id mapping', async () => {
    const { DynamicScene } = await import('./DynamicScene')
    const { PrefabRuntimeRegistry } = await import('./prefab')
    const { parseRuntimePrefabDescriptor } = await import('./prefab/parser')
    const parsed = parseRuntimePrefabDescriptor(
      { ...validBuildingManifest, assetId: 'main-homes' },
      { ...validAnimationManifest, assetId: 'main-homes' },
    )
    if (!parsed.ok) throw new Error(parsed.errors.join('\n'))
    const prefabRegistry = new PrefabRuntimeRegistry([parsed.descriptor])
    const scene = new DynamicScene(undefined, { prefabRegistry })
    const snapshot = createSnapshot()
    snapshot.buildings = {
      home: createBuilding({
        id: 'home',
        type: 'house',
        level: 1,
        status: 'idle',
      }),
    }
    snapshot.agents = {}
    snapshot.worldDrops = []

    scene.sync(snapshot, camera)

    const prefabLayer = scene.layers.buildings.children[0]?.children.find((child) => (
      typeof child.label === 'string' && child.label.startsWith('prefab-placeholder:')
    ))
    expect(prefabLayer?.label).toBe('prefab-placeholder:main-homes:L1:idle:base+idle-detail')
    expect(childLabels(prefabLayer ?? { children: [] })).toEqual([
      'prefab-placeholder-shell',
      'prefab-placeholder-outline',
      'prefab-placeholder-info-bar',
      'prefab-placeholder-status-bar',
      'prefab-placeholder-level-marks',
      'prefab-placeholder-label:main-homes:L1',
    ])
  })

  it('keeps unmapped building types on the gray-box fallback', async () => {
    const { DynamicScene } = await import('./DynamicScene')
    const { parseRuntimePrefabDescriptor, PrefabRuntimeRegistry } = await import('./prefab')
    const parsed = parseRuntimePrefabDescriptor(validBuildingManifest, validAnimationManifest)
    if (!parsed.ok) throw new Error(parsed.errors.join('\n'))
    const scene = new DynamicScene(undefined, { prefabRegistry: new PrefabRuntimeRegistry([parsed.descriptor]) })
    const snapshot = createSnapshot()
    snapshot.buildings = {
      unknown: createBuilding({
        id: 'unknown',
        type: 'unknown-building',
        level: 1,
        status: 'idle',
      }),
    }
    snapshot.agents = {}
    snapshot.worldDrops = []

    scene.sync(snapshot, camera)

    const prefabLayer = scene.layers.buildings.children[0]?.children.find((child) => (
      typeof child.label === 'string' && child.label.startsWith('prefab-placeholder:')
    ))
    expect(prefabLayer?.label).toBe('prefab-placeholder:unknown-building:unmapped')
    expect(prefabLayer?.visible).toBe(false)
  })

  it('renders a catalog-driven identity fallback for mapped but unregistered prefab assets', async () => {
    const { DynamicScene } = await import('./DynamicScene')
    const { PrefabRuntimeRegistry } = await import('./prefab')
    const scene = new DynamicScene(undefined, { prefabRegistry: new PrefabRuntimeRegistry() })
    const snapshot = createSnapshot()
    snapshot.buildings = {
      pier: createBuilding({
        id: 'pier',
        type: 'main-pier',
        level: 4,
        status: 'working',
      }),
    }
    snapshot.agents = {}
    snapshot.worldDrops = []

    scene.sync(snapshot, camera)

    const prefabLayer = scene.layers.buildings.children[0]?.children.find((child) => (
      typeof child.label === 'string' && child.label.startsWith('prefab-placeholder:')
    ))
    expect(prefabLayer?.label).toBe('prefab-placeholder:main-pier:missing')
    expect(prefabLayer?.visible).toBe(true)
    expect(childLabels(prefabLayer ?? { children: [] })).toEqual([
      'prefab-placeholder-shell',
      'prefab-placeholder-outline',
      'prefab-placeholder-info-bar',
      'prefab-placeholder-status-bar',
      'prefab-placeholder-level-marks',
      'prefab-placeholder-label',
    ])
    const label = prefabLayer?.children.find((child) => child.label === 'prefab-placeholder-label')
    expect(label?.text).toContain('cross-berth-wharf')
  })
})
