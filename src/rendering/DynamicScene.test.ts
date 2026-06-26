import { describe, expect, it } from 'vitest'
import type { SimulationSnapshot } from '../simulation/contracts'

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
})
