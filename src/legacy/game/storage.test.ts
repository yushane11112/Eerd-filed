import { describe, expect, it } from 'vitest'
import { createInitialState } from './engine'
import { migrateState } from './storage'

describe('save migration', () => {
  it('keeps legacy materials, maps four landmarks and compensates removed exploration and missions', () => {
    const legacy = {
      saveVersion: 4,
      prosperity: 90,
      explorationEnergy: 3,
      inventory: { wood: 12, stone: 8, rope: 4, glass: 2, cloth: 6 },
      landmarks: {
        pier: { level: 5 },
        cottage: { level: 3 },
        windmill: { level: 2 },
        lookout: { level: 1 },
      },
      missions: [{ status: 'active' }, { status: 'ready' }],
    }

    const migrated = migrateState(legacy)
    expect(migrated.saveVersion).toBe(5)
    expect(migrated.buildSites['main-pier'].level).toBe(5)
    expect(migrated.buildSites['main-inn'].level).toBe(3)
    expect(migrated.pendingDrops.length).toBeGreaterThanOrEqual(5)
    expect(migrated.inventory.wood).toBeGreaterThanOrEqual(12)
  })

  it('loads current saves without dropping new systems', () => {
    const current = createInitialState()
    const migrated = migrateState(current)
    expect(migrated.saveVersion).toBe(5)
    expect(migrated.worldDrops).toEqual(current.worldDrops)
    expect(migrated.buildSites).toEqual(current.buildSites)
  })
})
