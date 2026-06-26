import { describe, expect, it } from 'vitest'
import validAnimationManifest from '../../../tools/asset-validator/fixtures/valid-animation-manifest.json'
import validBuildingManifest from '../../../tools/asset-validator/fixtures/valid-building-manifest.json'
import invalidAnimationManifest from '../../../tools/asset-validator/fixtures/invalid-animation-manifest.json'
import invalidBuildingManifest from '../../../tools/asset-validator/fixtures/invalid-building-manifest.json'
import { parseRuntimePrefabDescriptor, resolvePrefabAnimationState } from './parser'

describe('prefab manifest runtime parser', () => {
  it('builds a descriptor from valid gold-slice fixtures without loading textures', () => {
    const result = parseRuntimePrefabDescriptor(validBuildingManifest, validAnimationManifest)

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(result.errors.join('\n'))

    expect(result.descriptor.assetId).toBe('main-pier')
    expect(result.descriptor.levels.L0.layers[0]).toMatchObject({
      id: 'shadow',
      atlas: 'main-pier-L0',
      frame: 'shadow',
    })
    expect(result.descriptor.anchors.berth_01.localPx).toEqual({ x: -96, y: 60 })
    expect(result.descriptor.stateSlots.working.map((slot) => slot.id)).toEqual([
      'staff-entry',
      'input-receive',
      'production-primary',
      'production-secondary',
      'output-ready',
    ])
    expect(result.descriptor.stateSlots.storage_full).toHaveLength(1)
    expect(result.descriptor.stateSlots.storage_full[0]).toMatchObject({
      id: 'storage-full',
      clip: 'main-pier-storage-full-cargo-stacks',
      technique: 'sprite-sequence',
    })
  })

  it('returns explicit errors for missing cross references and invalid state mapping', () => {
    const result = parseRuntimePrefabDescriptor(invalidBuildingManifest, invalidAnimationManifest)

    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('invalid fixtures unexpectedly parsed')

    expect(result.errors).toContain("building.levels.L4 is required for gold prefab runtime")
    expect(result.errors).toContain("building.levels.L8 is required for gold prefab runtime")
    expect(result.errors).toContain("building.levels.L0.anchors references missing anchor 'missing_anchor'")
    expect(result.errors).toContain("animation.slots.production-primary.anchors references missing anchor 'missing_anchor'")
    expect(result.errors).toContain("animation.slots.production-primary.parts references missing animated part 'missing_part'")
    expect(result.errors).toContain(
      "animation.slots.production-primary.playbackRateSource 'sceneTime' cannot drive working production",
    )
    expect(result.errors).toContain("animation.slots missing required state coverage 'serving'")
    expect(result.errors).toContain("animation.slots missing required state coverage 'storage_full'")
  })

  it('maps simulation-facing building status into prefab animation states', () => {
    expect(resolvePrefabAnimationState({ status: 'upgrading' })).toBe('constructing')
    expect(resolvePrefabAnimationState({ status: 'blocked', statusReason: 'output-full' })).toBe('storage_full')
    expect(resolvePrefabAnimationState({ status: 'blocked', statusReason: 'missing-input:rice' })).toBe('blocked')
    expect(resolvePrefabAnimationState({ status: 'delivering' })).toBe('serving')
    expect(resolvePrefabAnimationState({ status: 'idle', inventoryFull: true })).toBe('storage_full')
  })

  it('reports a precise missing-field error instead of throwing', () => {
    const result = parseRuntimePrefabDescriptor(
      { ...validBuildingManifest, sourceBlend: undefined },
      validAnimationManifest,
    )

    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('manifest with missing sourceBlend unexpectedly parsed')
    expect(result.errors).toContain('building.sourceBlend must be a non-empty string')
  })
})
