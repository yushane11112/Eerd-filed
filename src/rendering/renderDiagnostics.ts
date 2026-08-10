export interface RenderDiagnosticsConfig {
  enabled: boolean
  authoredArtwork: boolean
  authoredAnimation: boolean
  terrain: boolean
  antialias: boolean
  resolutionOverride?: number
  staticBuildingCache: boolean
  buildingAtlas: boolean
  buildingLod: boolean
  manualTickerStart: boolean
  deferInitialSync: boolean
  tickerMinFpsOverride?: number
  tickerMaxFpsOverride?: number
}

/**
 * Reads opt-in render ablation flags used by the performance harness.
 * Production URLs keep every visual layer enabled by default.
 */
export function parseRenderDiagnostics(search: string): RenderDiagnosticsConfig {
  const params = new URLSearchParams(search)
  return {
    enabled: params.get('renderProfile') === '1',
    authoredArtwork: params.get('disableArtwork') !== '1',
    authoredAnimation: params.get('disableAnimation') !== '1',
    terrain: params.get('disableTerrain') !== '1',
    antialias: params.get('disableAntialias') !== '1',
    resolutionOverride: params.get('resolution') === '1' ? 1 : undefined,
    staticBuildingCache: params.get('staticBuildingCache') === '1',
    // The shared atlas is now the production path. `disableAtlas=1` is kept
    // for controlled regression comparisons and emergency asset fallback.
    buildingAtlas: params.get('disableAtlas') !== '1',
    buildingLod: params.get('disableBuildingLod') !== '1',
    manualTickerStart: params.get('manualTickerStart') === '1',
    deferInitialSync: params.get('deferInitialSync') === '1',
    tickerMinFpsOverride: parseNonNegativeNumber(params.get('tickerMinFps')),
    tickerMaxFpsOverride: parseNonNegativeNumber(params.get('tickerMaxFps')),
  }
}

function parseNonNegativeNumber(value: string | null): number | undefined {
  if (value === null || value.trim() === '') return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined
}
