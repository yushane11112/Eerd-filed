import { describe, expect, it } from 'vitest'
import { Sprite, Texture } from 'pixi.js'
import {
  buildBuildingArtworkAssetPaths,
  configureBuildingArtworkSprite,
  createDefaultBuildingArtworkProvider,
  loadDefaultBuildingArtworkProvider,
  resolveBuildingArtworkPath,
} from './buildingArtwork'

describe('building artwork runtime contract', () => {
  it('clamps authored levels to the nine-level production range', () => {
    expect(resolveBuildingArtworkPath('main-kiln', -1)).toBe('/assets/buildings-runtime-384/main-kiln/level-0.png')
    expect(resolveBuildingArtworkPath('main-kiln', 8.6)).toBe('/assets/buildings-runtime-384/main-kiln/level-8.png')
  })

  it('builds a deduplicated nine-level preload manifest', () => {
    expect(buildBuildingArtworkAssetPaths(['main-kiln', 'main-kiln'])).toHaveLength(9)
    expect(buildBuildingArtworkAssetPaths(['main-kiln'])[8]).toBe('/assets/buildings-runtime-384/main-kiln/level-8.png')
  })

  it('can preload only levels present in the current snapshot', () => {
    expect(buildBuildingArtworkAssetPaths(['main-kiln', 'main-pier'], [0, 3, 3, 8])).toEqual([
      '/assets/buildings-runtime-384/main-kiln/level-0.png',
      '/assets/buildings-runtime-384/main-kiln/level-3.png',
      '/assets/buildings-runtime-384/main-kiln/level-8.png',
      '/assets/buildings-runtime-384/main-pier/level-0.png',
      '/assets/buildings-runtime-384/main-pier/level-3.png',
      '/assets/buildings-runtime-384/main-pier/level-8.png',
    ])
  })

  it('fails fast when the texture budget is too small', async () => {
    await expect(loadDefaultBuildingArtworkProvider(['main-kiln'], { maxTextures: 8 }))
      .rejects.toThrow('budget is 8')
  })

  it('honours cancellation before starting a network load', async () => {
    const controller = new AbortController()
    controller.abort()
    await expect(loadDefaultBuildingArtworkProvider(['main-kiln'], { signal: controller.signal }))
      .rejects.toMatchObject({ name: 'AbortError' })
  })

  it('caches a texture per asset level path', () => {
    const provider = createDefaultBuildingArtworkProvider()
    expect(provider.get('main-kiln', 3)).toBe(provider.get('main-kiln', 3))
  })

  it('uses a consistent isometric sprite footprint', () => {
    const sprite = new Sprite()
    configureBuildingArtworkSprite(sprite, Texture.WHITE, 40, 30)
    expect(sprite.anchor.x).toBe(0.5)
    expect(sprite.anchor.y).toBe(1)
    expect(sprite.width).toBe(86)
    expect(sprite.height).toBe(64.5)
  })
})
