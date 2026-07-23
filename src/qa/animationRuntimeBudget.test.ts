import { Texture } from 'pixi.js'
import { describe, expect, it } from 'vitest'
import { BuildingAnimationDriver, type BuildingAnimationDriverDiagnostics } from '../rendering/artwork/buildingAnimation'

const BUILDING_COUNT = 300
const VISIBLE_BUILDING_COUNT = 150

describe('animation runtime pressure budget', () => {
  it('keeps 300 building hosts and 150 visible buildings inside the authored pool budget', () => {
    const provider = {
      getFrames: () => [Texture.WHITE, Texture.WHITE, Texture.WHITE],
    }
    const options = {
      partProvider: { getTexture: () => Texture.WHITE },
      particleProvider: { getTexture: () => Texture.WHITE },
      anchorProvider: { getAnchor: () => ({ x: 0.5, y: 0.6 }) },
    }
    const drivers = Array.from({ length: BUILDING_COUNT }, () => new BuildingAnimationDriver(provider, options))
    const plan = {
      assetId: 'main-pier',
      levelKey: 'L8',
      state: 'working' as const,
      playback: [
        {
          slotId: 'production-primary',
          clip: 'crane-cycle',
          technique: 'sprite-sequence' as const,
          progress: 0.4,
          frame: 1,
          loop: true,
          lodMode: 'full' as const,
          anchors: ['crane_01'],
          parts: ['crane_arm_a'],
        },
        {
          slotId: 'crane-arm',
          clip: 'crane-heavy-lift',
          technique: 'part-transform' as const,
          progress: 0.4,
          frame: 1,
          loop: true,
          lodMode: 'full' as const,
          anchors: ['crane_01'],
          parts: ['crane_arm_a'],
        },
        {
          slotId: 'weather',
          clip: 'harbor-weather',
          technique: 'particle' as const,
          progress: 0.4,
          frame: 1,
          loop: true,
          lodMode: 'reduced' as const,
          anchors: ['water_route_01'],
          parts: [],
        },
      ],
    }

    const firstChildren: unknown[] = []
    const diagnostics: BuildingAnimationDriverDiagnostics[] = []
    for (const [index, driver] of drivers.entries()) {
      if (index < VISIBLE_BUILDING_COUNT) driver.update(plan, 40, 30)
      diagnostics.push(driver.getDiagnostics())
    }

    expect(diagnostics.filter((entry) => entry.visibleChildren > 0)).toHaveLength(VISIBLE_BUILDING_COUNT)
    expect(diagnostics.filter((entry) => entry.visibleChildren === 0)).toHaveLength(BUILDING_COUNT - VISIBLE_BUILDING_COUNT)
    expect(diagnostics.slice(0, VISIBLE_BUILDING_COUNT).every((entry) => entry.visibleChildren === 5)).toBe(true)
    expect(Math.max(...diagnostics.map((entry) => entry.visibleChildren))).toBe(5)

    for (const driver of drivers.slice(0, VISIBLE_BUILDING_COUNT)) firstChildren.push(...driver.display.children)
    for (const driver of drivers.slice(0, VISIBLE_BUILDING_COUNT)) driver.update({ ...plan, playback: plan.playback.map((slot) => ({ ...slot, progress: 0.8 })) }, 40, 30)
    const secondChildren = drivers.slice(0, VISIBLE_BUILDING_COUNT).flatMap((driver) => driver.display.children)
    expect(secondChildren).toHaveLength(firstChildren.length)
    secondChildren.forEach((child, index) => expect(child).toBe(firstChildren[index]))
    expect(drivers.slice(0, VISIBLE_BUILDING_COUNT).every((driver) => driver.getDiagnostics().pooledParticleSprites === 3)).toBe(true)
  })
})
