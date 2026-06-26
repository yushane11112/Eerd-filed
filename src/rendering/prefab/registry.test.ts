import { describe, expect, it } from 'vitest'
import validAnimationManifest from '../../../tools/asset-validator/fixtures/valid-animation-manifest.json'
import validBuildingManifest from '../../../tools/asset-validator/fixtures/valid-building-manifest.json'
import { parseRuntimePrefabDescriptor } from './parser'
import { PrefabRuntimeRegistry } from './registry'

function fixtureDescriptor() {
  const result = parseRuntimePrefabDescriptor(validBuildingManifest, validAnimationManifest)
  if (!result.ok) throw new Error(result.errors.join('\n'))
  return result.descriptor
}

describe('PrefabRuntimeRegistry', () => {
  it('registers and queries runtime descriptors by assetId', () => {
    const descriptor = fixtureDescriptor()
    const registry = new PrefabRuntimeRegistry()

    registry.register(descriptor)

    expect(registry.get('main-pier')).toBe(descriptor)
    expect(registry.has('main-pier')).toBe(true)
    expect(registry.has('missing-prefab')).toBe(false)
  })

  it('resolves the nearest authored level and state slots for a building placeholder', () => {
    const registry = new PrefabRuntimeRegistry()
    registry.register(fixtureDescriptor())

    const resolved = registry.resolveBuilding({
      assetId: 'main-pier',
      level: 6,
      status: 'blocked',
      statusReason: 'output-full',
      productionProgress: 0.4,
    })

    expect(resolved).toMatchObject({
      assetId: 'main-pier',
      state: 'storage_full',
      levelKey: 'L4',
    })
    expect(resolved?.level.numericLevel).toBe(4)
    expect(resolved?.slots.map((slot) => slot.id)).toEqual(['storage-full'])
  })
})
