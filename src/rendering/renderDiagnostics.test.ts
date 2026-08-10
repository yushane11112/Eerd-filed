import { describe, expect, it } from 'vitest'
import { parseRenderDiagnostics } from './renderDiagnostics'

describe('parseRenderDiagnostics', () => {
  it('keeps all layers enabled for normal production URLs', () => {
    expect(parseRenderDiagnostics('')).toEqual({
      enabled: false,
      authoredArtwork: true,
      authoredAnimation: true,
      terrain: true,
      antialias: true,
      resolutionOverride: undefined,
      staticBuildingCache: false,
      buildingAtlas: true,
      buildingLod: true,
    })
  })

  it('supports independent opt-in ablations for the render harness', () => {
    expect(parseRenderDiagnostics('?renderProfile=1&disableArtwork=1&disableAnimation=1&disableAntialias=1&resolution=1')).toEqual({
      enabled: true,
      authoredArtwork: false,
      authoredAnimation: false,
      terrain: true,
      antialias: false,
      resolutionOverride: 1,
      staticBuildingCache: false,
      buildingAtlas: true,
      buildingLod: true,
    })
    expect(parseRenderDiagnostics('?staticBuildingCache=1')).toMatchObject({ staticBuildingCache: true })
    expect(parseRenderDiagnostics('?disableAtlas=1')).toMatchObject({ buildingAtlas: false })
    expect(parseRenderDiagnostics('?disableTerrain=1')).toMatchObject({ terrain: false })
    expect(parseRenderDiagnostics('?disableBuildingLod=1')).toMatchObject({ buildingLod: false })
  })
})
