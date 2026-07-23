import { Texture } from 'pixi.js'
import { describe, expect, it } from 'vitest'
import { BuildingAnimationDriver, createBuildingAnimationProvider } from './buildingAnimation'

describe('building animation atlas runtime', () => {
  it('resolves authored frames and drives a deterministic AnimatedSprite frame', () => {
    const frames = [Texture.WHITE, Texture.WHITE, Texture.WHITE]
    const provider = createBuildingAnimationProvider([{
      assetId: 'main-pier',
      levelKey: 'L8',
      slotId: 'production-primary',
      clip: 'crane-cycle',
      frames,
    }])
    const driver = new BuildingAnimationDriver(provider)
    driver.update({
      assetId: 'main-pier',
      levelKey: 'L8',
      state: 'working',
      playback: [{
        slotId: 'production-primary',
        clip: 'crane-cycle',
        technique: 'sprite-sequence',
        progress: 0.66,
        frame: 1,
        loop: true,
        lodMode: 'full',
        anchors: ['production-primary'],
        parts: ['crane_arm_a'],
      }],
    }, 40, 30)

    const sprite = driver.display.children[0]
    expect(driver.display.visible).toBe(true)
    expect(sprite?.label).toBe('building-animation:main-pier:L8:production-primary')
    expect((sprite as { currentFrame?: number }).currentFrame).toBe(1)
  })

  it('keeps missing authored clips on the explicit fallback path', () => {
    const driver = new BuildingAnimationDriver(createBuildingAnimationProvider([]))
    driver.update({
      assetId: 'main-pier',
      levelKey: 'L0',
      state: 'constructing',
      playback: [{
        slotId: 'construction',
        clip: 'scaffold-build',
        technique: 'sprite-sequence',
        progress: 0.4,
        frame: 2,
        loop: false,
        lodMode: 'full',
        anchors: ['construction_stage_01'],
        parts: ['scaffold'],
      }],
    }, 40, 30)
    expect(driver.display.visible).toBe(false)
    expect(driver.display.children).toHaveLength(0)
  })

  it('clears pooled sprites on reset', () => {
    const driver = new BuildingAnimationDriver(createBuildingAnimationProvider([{
      assetId: 'main-pier',
      levelKey: 'L8',
      slotId: 'production-primary',
      clip: 'crane-cycle',
      frames: [Texture.WHITE],
    }]))
    driver.update({
      assetId: 'main-pier',
      levelKey: 'L8',
      state: 'working',
      playback: [{
        slotId: 'production-primary',
        clip: 'crane-cycle',
        technique: 'sprite-sequence',
        progress: 0,
        frame: 0,
        loop: true,
        lodMode: 'full',
        anchors: [],
        parts: [],
      }],
    }, 40, 30)
    driver.reset()
    expect(driver.display.children).toHaveLength(0)
    expect(driver.display.visible).toBe(false)
  })

  it('consumes authored part and particle slots with anchor transforms', () => {
    const driver = new BuildingAnimationDriver(createBuildingAnimationProvider([]), {
      partProvider: {
        getTexture: ({ partId }) => partId === 'crane_arm_a' ? Texture.WHITE : undefined,
      },
      particleProvider: {
        getTexture: ({ partId }) => partId === 'harbor-weather' ? Texture.WHITE : undefined,
      },
      anchorProvider: {
        getAnchor: ({ anchorId }) => anchorId === 'crane_01' ? { x: 0.75, y: 0.45 } : { x: 0.25, y: 0.3 },
      },
    })

    driver.update({
      assetId: 'main-pier',
      levelKey: 'L8',
      state: 'working',
      playback: [
        {
          slotId: 'production-primary',
          clip: 'crane-heavy-lift',
          technique: 'part-transform',
          progress: 0.25,
          frame: 0,
          loop: true,
          lodMode: 'full',
          anchors: ['crane_01'],
          parts: ['crane_arm_a'],
        },
        {
          slotId: 'weather',
          clip: 'harbor-weather',
          technique: 'particle',
          progress: 0.5,
          frame: 0,
          loop: true,
          lodMode: 'reduced',
          anchors: ['water_route_01'],
          parts: [],
        },
      ],
    }, 40, 30)

    expect(driver.display.visible).toBe(true)
    expect(driver.display.children.map((child) => child.label)).toEqual(expect.arrayContaining([
      'building-part:main-pier:crane_arm_a',
      'building-particle:main-pier:weather:0',
      'building-particle:main-pier:weather:1',
      'building-particle:main-pier:weather:2',
    ]))
  })
})
