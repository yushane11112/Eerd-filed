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
      manualTickerStart: false,
      deferInitialSync: false,
      tickerMinFpsOverride: undefined,
      tickerMaxFpsOverride: undefined,
    })
  })

  it('supports independent opt-in ablations for the render harness', () => {
    expect(parseRenderDiagnostics('?renderProfile=1&disableArtwork=1&disableAnimation=1&disableAntialias=1&resolution=1&manualTickerStart=1&deferInitialSync=1&tickerMinFps=0&tickerMaxFps=0')).toEqual({
      enabled: true,
      authoredArtwork: false,
      authoredAnimation: false,
      terrain: true,
      antialias: false,
      resolutionOverride: 1,
      staticBuildingCache: false,
      buildingAtlas: true,
      buildingLod: true,
      manualTickerStart: true,
      deferInitialSync: true,
      tickerMinFpsOverride: 0,
      tickerMaxFpsOverride: 0,
    })
    expect(parseRenderDiagnostics('?staticBuildingCache=1')).toMatchObject({ staticBuildingCache: true })
    expect(parseRenderDiagnostics('?disableAtlas=1')).toMatchObject({ buildingAtlas: false })
    expect(parseRenderDiagnostics('?disableTerrain=1')).toMatchObject({ terrain: false })
    expect(parseRenderDiagnostics('?disableBuildingLod=1')).toMatchObject({ buildingLod: false })
    expect(parseRenderDiagnostics('?tickerMinFps=24')).toMatchObject({ tickerMinFpsOverride: 24 })
    expect(parseRenderDiagnostics('?tickerMinFps=-1')).toMatchObject({ tickerMinFpsOverride: undefined })
    expect(parseRenderDiagnostics('?tickerMaxFps=30')).toMatchObject({ tickerMaxFpsOverride: 30 })
    expect(parseRenderDiagnostics('?tickerMaxFps=-1')).toMatchObject({ tickerMaxFpsOverride: undefined })
  })
})
