import { describe, expect, it } from 'vitest'
import type { BuildingEntity, SimulationSnapshot } from '../simulation/contracts'
import validAnimationManifest from '../../tools/asset-validator/fixtures/valid-animation-manifest.json'
import validBuildingManifest from '../../tools/asset-validator/fixtures/valid-building-manifest.json'

// Pixi performs a canvas blend-mode capability probe during module loading.
// The scene tests do not render pixels, so a minimal context keeps jsdom quiet.
HTMLCanvasElement.prototype.getContext = (() => ({
  fillStyle: '',
  globalCompositeOperation: 'source-over',
  fillRect: () => undefined,
  drawImage: () => undefined,
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
      }
    })

    expect(layers).toHaveLength(6)
    expect(layers.map((layer) => layer.layerLabel)).toEqual(expect.arrayContaining([
      'building-status-layer:working',
      'building-status-layer:serving',
      'building-status-layer:delivering',
      'building-status-layer:blocked:missing-input',
      'building-status-layer:blocked:storage-full',
      'building-status-layer:blocked:no-workers',
    ]))
    for (const layer of layers) {
      expect(layer.displayChildCount).toBe(2)
      expect(layer.statusChildCount).toBe(3)
      expect(layer.statusChildLabels).toEqual(expect.arrayContaining([
        expect.stringMatching(/^building-status-mask:/),
        expect.stringMatching(/^building-status-symbol:/),
        expect.stringMatching(/^building-status-motion:/),
      ]))
    }

    const beforeChildCounts = scene.layers.buildings.children.map((buildingDisplay) => [
      buildingDisplay.children.length,
      buildingDisplay.children[1]?.children.length,
    ])
    snapshot.tick += 1
    scene.sync(snapshot, camera)
    const afterChildCounts = scene.layers.buildings.children.map((buildingDisplay) => [
      buildingDisplay.children.length,
      buildingDisplay.children[1]?.children.length,
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
  })
})
