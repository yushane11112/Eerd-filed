import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  BUILD_SITE_IDS, BUILD_SITES, TOWNSCAPE_ASSET_PATHS, townscapeStageForIsland,
} from './config'
import type { BuildSiteId, BuildSiteProgress } from './types'

function sitesAtLevel(level: number) {
  return Object.fromEntries(BUILD_SITE_IDS.map((id) => [id, {
    id,
    level: BUILD_SITES[id].islandId === 'main' ? level : 0,
    maxLevel: 8,
    buildProgress: 0,
    visualStage: Math.ceil(level / 2),
    decorStage: Math.floor(level / 2),
  }])) as Record<BuildSiteId, BuildSiteProgress>
}

describe('townwide stage art', () => {
  it('declares five whole-map stages for every island', () => {
    expect(Object.keys(TOWNSCAPE_ASSET_PATHS)).toEqual([
      'main', 'windfield', 'mistgrove', 'tide',
    ])
    for (const paths of Object.values(TOWNSCAPE_ASSET_PATHS)) {
      expect(paths).toHaveLength(5)
    }
  })

  it('uses unique stage assets rather than one permanent empty terrain', () => {
    const paths = Object.values(TOWNSCAPE_ASSET_PATHS).flat()
    expect(new Set(paths).size).toBe(20)
    expect(paths.some((path) => path.includes('terrain-base'))).toBe(false)
  })

  it('has every declared stage image on disk', () => {
    const missing = Object.values(TOWNSCAPE_ASSET_PATHS).flat()
      .filter((path) => !existsSync(`public${path}`))
    expect(missing, `缺少整体镇貌图：\n${missing.join('\n')}`).toEqual([])
  })

  it.each([
    [0, 0], [1, 1], [2, 1], [3, 2], [4, 2],
    [5, 3], [6, 3], [7, 4], [8, 4],
  ])('maps a whole-island average level of %i to townscape %i', (level, expected) => {
    expect(townscapeStageForIsland(sitesAtLevel(level), 'main')).toBe(expected)
  })
})
