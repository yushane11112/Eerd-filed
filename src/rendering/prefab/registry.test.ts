import { describe, expect, it } from 'vitest'
import sampleAnimationManifest from '../../../docs/project/gold-slice/sample-manifests/main-pier/animation-manifest.json'
import sampleBuildingManifest from '../../../docs/project/gold-slice/sample-manifests/main-pier/building-manifest.json'
import { parseRuntimePrefabDescriptor } from './parser'
import { PrefabRuntimeRegistry } from './registry'

function mainPierSampleDescriptor() {
  const result = parseRuntimePrefabDescriptor(sampleBuildingManifest, sampleAnimationManifest)
  if (!result.ok) throw new Error(result.errors.join('\n'))
  return result.descriptor
}

describe('PrefabRuntimeRegistry', () => {
  it('registers and queries runtime descriptors by assetId', () => {
    const descriptor = mainPierSampleDescriptor()
    const registry = new PrefabRuntimeRegistry()

    registry.register(descriptor)

    expect(registry.get('main-pier')).toBe(descriptor)
    expect(registry.has('main-pier')).toBe(true)
    expect(registry.has('missing-prefab')).toBe(false)
  })

  it('resolves the nearest authored level and state slots for a building placeholder', () => {
    const registry = new PrefabRuntimeRegistry()
    registry.register(mainPierSampleDescriptor())

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

  it('resolves main-pier sample authored levels and key runtime states after registration', () => {
    const registry = new PrefabRuntimeRegistry([mainPierSampleDescriptor()])

    expect(
      registry.resolveBuilding({ assetId: 'main-pier', level: 0, status: 'idle' })?.levelKey,
    ).toBe('L0')
    expect(
      registry.resolveBuilding({ assetId: 'main-pier', level: 1, status: 'idle' })?.levelKey,
    ).toBe('L1')
    expect(
      registry.resolveBuilding({ assetId: 'main-pier', level: 4, status: 'idle' })?.levelKey,
    ).toBe('L4')
    expect(
      registry.resolveBuilding({ assetId: 'main-pier', level: 8, status: 'idle' })?.levelKey,
    ).toBe('L8')

    expect(
      registry
        .resolveBuilding({
          assetId: 'main-pier',
          level: 8,
          status: 'blocked',
          statusReason: 'missing_input',
        })
        ?.slots.map((slot) => slot.id),
    ).toEqual(['blocked'])
    expect(
      registry
        .resolveBuilding({
          assetId: 'main-pier',
          level: 8,
          status: 'blocked',
          statusReason: 'storage-full',
        })
        ?.slots.map((slot) => slot.id),
    ).toEqual(['storage-full'])
    expect(
      registry
        .resolveBuilding({
          assetId: 'main-pier',
          level: 8,
          status: 'working',
          productionProgress: 0.5,
        })
        ?.slots.map((slot) => slot.id),
    ).toEqual([
      'staff-entry',
      'input-receive',
      'production-primary',
      'production-secondary',
      'output-ready',
    ])
  })
})
