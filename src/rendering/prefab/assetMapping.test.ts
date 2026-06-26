import { describe, expect, it } from 'vitest'
import { resolvePrefabAssetIdForBuildingType } from './assetMapping'

describe('prefab asset mapping', () => {
  it('maps legacy runtime building types to gold prefab asset ids', () => {
    expect(resolvePrefabAssetIdForBuildingType('house')).toBe('main-homes')
    expect(resolvePrefabAssetIdForBuildingType('granary')).toBe('main-granary')
    expect(resolvePrefabAssetIdForBuildingType('riceField')).toBe('windfield-rice')
    expect(resolvePrefabAssetIdForBuildingType('market')).toBe('main-eatery')
  })

  it('passes through explicitly authored gold asset ids and rejects unmapped building types', () => {
    expect(resolvePrefabAssetIdForBuildingType('main-pier')).toBe('main-pier')
    expect(resolvePrefabAssetIdForBuildingType('unknown-building')).toBeUndefined()
  })
})
