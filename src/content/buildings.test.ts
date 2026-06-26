import { describe, expect, it } from 'vitest'
import { BUILDING_CATALOG, BUILDING_TYPES } from './buildings'

describe('building catalog', () => {
  it('maps all twenty-eight original build sites into simulation definitions', () => {
    expect(BUILDING_TYPES).toHaveLength(28)
    expect(Object.values(BUILDING_CATALOG).every((item) => item.maxLevel === 8)).toBe(true)
  })

  it('keeps functional categories visually and mechanically distinct', () => {
    expect(BUILDING_CATALOG['main-homes'].category).toBe('housing')
    expect(BUILDING_CATALOG['main-granary'].category).toBe('storage')
    expect(BUILDING_CATALOG['windfield-rice'].production?.outputs.food).toBeGreaterThan(0)
    expect(BUILDING_CATALOG['tide-harbor'].production?.outputs.fish).toBeGreaterThan(0)
    expect(BUILDING_CATALOG['main-kiln'].production?.outputs.brick).toBeGreaterThan(0)
  })
})
