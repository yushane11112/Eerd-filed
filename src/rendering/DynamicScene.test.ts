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
    expect(layers.map((layer) => layer.hintLayer?.label)).toEqual(expect.arrayContaining([
      'building-status-hint:blocked:missing-input:缺料',
      'building-status-hint:blocked:storage-full:仓满',
      'building-status-hint:blocked:no-workers:缺工',
      'building-status-hint:blocked:logistics-failed:物流失败',
    ]))
    for (const layer of layers) {
      expect(layer.displayChildCount).toBe(2)
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
    const goldAssetIds = ['main-homes', 'main-eatery', 'main-granary'] as const
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

  it('keeps mapped but unregistered prefab assets on the gray-box fallback', async () => {
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
    expect(prefabLayer?.visible).toBe(false)
    expect(childLabels(prefabLayer ?? { children: [] })).toEqual([
      'prefab-placeholder-shell',
      'prefab-placeholder-outline',
      'prefab-placeholder-info-bar',
      'prefab-placeholder-status-bar',
      'prefab-placeholder-level-marks',
      'prefab-placeholder-label',
    ])
  })
})
