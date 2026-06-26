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
})
