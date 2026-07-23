import { describe, expect, it } from 'vitest'
import { createDefaultPrefabRegistry } from './defaultRegistry'
import { resolvePrefabAnimationPlan } from './animationRuntime'

describe('resolvePrefabAnimationPlan', () => {
  const registry = createDefaultPrefabRegistry()

  it('maps production progress into authored working slots', () => {
    const resolved = registry.resolveBuilding({ assetId: 'main-pier', level: 4, status: 'working', productionProgress: 0.62 })
    expect(resolved).toBeDefined()
    const plan = resolvePrefabAnimationPlan(resolved!, { tick: 120, productionProgress: 0.62, lod: 'LOD1' })
    expect(plan.state).toBe('working')
    expect(plan.levelKey).toBe('L4')
    expect(plan.playback.some((slot) => slot.technique === 'part-transform')).toBe(true)
    expect(plan.playback.every((slot) => slot.lodMode !== 'off')).toBe(true)
  })

  it('keeps construction progress deterministic and bounded', () => {
    const resolved = registry.resolveBuilding({ assetId: 'main-pier', level: 0, status: 'upgrading', productionProgress: 0.25 })
    expect(resolved).toBeDefined()
    const first = resolvePrefabAnimationPlan(resolved!, { tick: 45, constructionProgress: 0.25, lod: 'LOD0' })
    const second = resolvePrefabAnimationPlan(resolved!, { tick: 45, constructionProgress: 0.25, lod: 'LOD0' })
    expect(first).toEqual(second)
    expect(first.playback.every((slot) => slot.progress >= 0 && slot.progress <= 1)).toBe(true)
  })

  it('does not schedule LOD-off slots', () => {
    const resolved = registry.resolveBuilding({ assetId: 'main-pier', level: 8, status: 'idle' })
    expect(resolved).toBeDefined()
    const plan = resolvePrefabAnimationPlan(resolved!, { tick: 0, lod: 'LOD3' })
    expect(plan.playback.every((slot) => slot.lodMode !== 'off')).toBe(true)
  })
})
