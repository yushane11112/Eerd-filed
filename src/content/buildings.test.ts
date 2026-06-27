import { describe, expect, it } from 'vitest'
import {
  BUILDING_CATALOG,
  BUILDING_TYPES,
  getBuildingsByFunction,
  getBuildingsByStage,
  isEraConsistentBuilding,
} from './buildings'
import {
  BUILDING_DEFINITIONS,
  getRuntimeBuildingDefinition,
  LEGACY_RUNTIME_ASSET_IDS,
} from './runtimeBuildings'

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

  it('adds stage, function, connection and era metadata for runtime filtering', () => {
    expect(BUILDING_CATALOG['main-pier']).toMatchObject({
      cityStage: 'water-town',
      connections: expect.arrayContaining(['road', 'water', 'shore']),
      functions: expect.arrayContaining(['employment', 'logistics']),
    })
    expect(BUILDING_CATALOG['main-homes'].functions).toEqual(
      expect.arrayContaining(['housing']),
    )
    expect(Object.values(BUILDING_CATALOG).every(isEraConsistentBuilding)).toBe(true)
  })

  it('filters buildings by unlocked city stage and function', () => {
    const villageTypes = getBuildingsByStage('village-market').map((building) => building.type)
    const tradeTypes = getBuildingsByStage('trade-town').map((building) => building.type)
    const logisticsTypes = getBuildingsByFunction('logistics').map((building) => building.type)

    expect(villageTypes).toContain('windfield-rice')
    expect(villageTypes).not.toContain('tide-harbor')
    expect(tradeTypes).toContain('tide-harbor')
    expect(logisticsTypes).toEqual(expect.arrayContaining(['main-pier', 'tide-harbor']))
  })

  it('keeps starter runtime definitions compatible while pointing to gold taxonomy ids', () => {
    expect(LEGACY_RUNTIME_ASSET_IDS.house).toBe('main-homes')
    expect(getRuntimeBuildingDefinition('house')).toBe(BUILDING_DEFINITIONS.house)
    expect(BUILDING_DEFINITIONS.house).toMatchObject({
      type: 'house',
      cityStage: 'water-town',
      functions: expect.arrayContaining(['housing']),
      connections: expect.arrayContaining(['road']),
      capacity: 12,
      entrance: { x: 1, y: 1 },
    })
    expect(BUILDING_DEFINITIONS.market.districtAffinity).toContain('market-street')
  })
})
