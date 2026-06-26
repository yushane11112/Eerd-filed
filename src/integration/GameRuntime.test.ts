import { describe, expect, it } from 'vitest'
import { GameRuntime } from './GameRuntime'

describe('GameRuntime integration', () => {
  it('boots a connected town with housing, jobs and residents', () => {
    const runtime = new GameRuntime()
    const snapshot = runtime.getSnapshot()

    expect(Object.keys(snapshot.buildings).length).toBeGreaterThanOrEqual(5)
    expect(snapshot.metrics.housingCapacity).toBeGreaterThan(0)
    expect(snapshot.metrics.population).toBeGreaterThan(0)
    expect(snapshot.metrics.employedWorkers).toBeGreaterThan(0)
  })

  it('places roads and road-connected buildings into the shared snapshot', () => {
    const runtime = new GameRuntime()
    expect(runtime.placeRoad({ x: 6, y: 10 }).ok).toBe(true)
    expect(runtime.placeRoad({ x: 6, y: 9 }).ok).toBe(true)
    expect(runtime.placeRoad({ x: 6, y: 8 }).ok).toBe(true)

    const result = runtime.placeBuilding('house', { x: 4, y: 8 }, 0)
    expect(result.ok).toBe(true)
    expect(result.buildingId).toBeTruthy()
    expect(runtime.getSnapshot().buildings[result.buildingId!]).toBeDefined()
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
