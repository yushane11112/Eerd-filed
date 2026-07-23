import { describe, expect, it, vi } from 'vitest'
import { Spritesheet, Texture } from 'pixi.js'
import {
  createSpritesheetBuildingAnimationProvider,
  loadBuildingAnimationAtlases,
} from './buildingAnimation'

function makeSheet(): Spritesheet {
  const sheet = new Spritesheet(Texture.WHITE, {
    frames: {
      'work-0': { frame: { x: 0, y: 0, w: 1, h: 1 }, sourceSize: { w: 1, h: 1 }, spriteSourceSize: { x: 0, y: 0, w: 1, h: 1 } },
      'work-1': { frame: { x: 0, y: 0, w: 1, h: 1 }, sourceSize: { w: 1, h: 1 }, spriteSourceSize: { x: 0, y: 0, w: 1, h: 1 } },
    },
    animations: { work: ['work-0', 'work-1'] },
    meta: { scale: '1' },
  })
  sheet.parse()
  return sheet
}

describe('building animation atlas loader', () => {
  it('loads and indexes authored atlases by building level', async () => {
    const sheet = makeSheet()
    const load = vi.fn(async () => sheet)
    const sheets = await loadBuildingAnimationAtlases([
      { assetId: 'main-pier', levelKey: 'level-8', url: '/assets/main-pier/level-8.json' },
    ], { load })

    expect(load).toHaveBeenCalledWith('/assets/main-pier/level-8.json')
    expect(createSpritesheetBuildingAnimationProvider(sheets).getFrames({
      assetId: 'main-pier', levelKey: 'level-8', slotId: 'workers', clip: 'work',
    })).toHaveLength(2)
  })

  it('rejects duplicate or incomplete manifest entries before loading', async () => {
    const load = vi.fn(async () => makeSheet())
    await expect(loadBuildingAnimationAtlases([
      { assetId: 'main-pier', levelKey: 'level-8', url: '/a.json' },
      { assetId: 'main-pier', levelKey: 'level-8', url: '/b.json' },
    ], { load })).rejects.toThrow('Duplicate building animation atlas key')
    expect(load).not.toHaveBeenCalled()
    await expect(loadBuildingAnimationAtlases([
      { assetId: '', levelKey: 'level-8', url: '/a.json' },
    ], { load })).rejects.toThrow('require assetId, levelKey and url')
  })
})
