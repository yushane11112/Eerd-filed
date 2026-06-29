import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { BUILD_SITE_IDS, BUILDING_ASSET_PATHS, ENVIRONMENT_ASSET_PATHS } from './config'

describe('complete building art delivery', () => {
  it('declares a unique ruin plus eight upgrade images for every build site', () => {
    expect(BUILD_SITE_IDS).toHaveLength(28)
    expect(Object.keys(BUILDING_ASSET_PATHS)).toHaveLength(28)

    const allPaths = BUILD_SITE_IDS.flatMap((id) => {
      const stages = BUILDING_ASSET_PATHS[id]
      expect(stages).toHaveLength(9)
      return stages
    })

    expect(new Set(allPaths).size).toBe(28 * 9)
  })

  it('has every declared image on disk', () => {
    const missing = BUILD_SITE_IDS.flatMap((id) => BUILDING_ASSET_PATHS[id])
      .filter((assetPath) => !existsSync(`public${assetPath}`))

    expect(missing, `缺少建筑素材：\n${missing.join('\n')}`).toEqual([])
  })

  it('does not fall back to the four legacy archetype directories', () => {
    const allPaths = BUILD_SITE_IDS.flatMap((id) => BUILDING_ASSET_PATHS[id])
    expect(allPaths.some((path) => /world-v2\/(pier|cottage|windmill|lookout)\//.test(path)))
      .toBe(false)
  })

  it('includes all town-growth environment art', () => {
    const missing = Object.values(ENVIRONMENT_ASSET_PATHS)
      .filter((assetPath) => !existsSync(`public${assetPath}`))
    expect(missing, `缺少环境素材：\n${missing.join('\n')}`).toEqual([])
  })
})
