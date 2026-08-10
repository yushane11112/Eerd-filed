import { describe, expect, it } from 'vitest'
import {
  aggregatePerformanceSamples,
  PERFORMANCE_ENVIRONMENTS,
  PERFORMANCE_THRESHOLDS,
  evaluatePerformanceSample,
} from './performanceBaseline'

describe('performance baseline contract', () => {
  it('declares desktop, software and embedded-container environments', () => {
    expect(PERFORMANCE_ENVIRONMENTS.map((environment) => environment.id)).toEqual([
      'desktop-gpu',
      'software-renderer',
      'embedded-container',
    ])
    expect(PERFORMANCE_ENVIRONMENTS[1].chromiumArgs).toContain('--disable-gpu')
    expect(PERFORMANCE_ENVIRONMENTS[2].evidenceLevel).toBe('container-proxy')
  })

  it('passes only when all runtime quality gates pass', () => {
    const evaluation = evaluatePerformanceSample({
      ok: true,
      frameMetrics: { averageFrameMs: 12, p95FrameMs: 18, maxFrameMs: 30 },
      renderProfile: { p95: { totalMs: 1.2 } },
      rendererProfile: { p95Ms: 2, maxMs: 4 },
      readPixels: { count: 0 },
    })
    expect(evaluation.ok).toBe(true)
    expect(evaluation.checks).toHaveLength(6)
  })

  it('keeps a weak browser result red instead of weakening the gate', () => {
    const evaluation = evaluatePerformanceSample({
      ok: true,
      frameMetrics: { averageFrameMs: 20.75, p95FrameMs: 33.4, maxFrameMs: 33.4 },
      renderProfile: { p95: { totalMs: 1 } },
      readPixels: { count: 0 },
    })
    expect(evaluation.ok).toBe(false)
    expect(evaluation.checks.find((check) => check.metric === 'averageFrameMs')?.threshold)
      .toBe(PERFORMANCE_THRESHOLDS.averageFrameMs)
  })

  it('uses median frame timing while keeping the worst readback count', () => {
    const aggregate = aggregatePerformanceSamples([
      {
        ok: true,
        browserFrameBaseline: { averageFrameMs: 16, p95FrameMs: 17, maxFrameMs: 18 },
        frameMetrics: { averageFrameMs: 15, p95FrameMs: 20, maxFrameMs: 30 },
        renderProfile: { p95: { totalMs: 1 } },
        rendererProfile: { p95Ms: 2, maxMs: 4 },
        tickerProfile: { p95: { callbackMs: 1, sceneSyncMs: 1, tickerDeltaMs: 16, tickerElapsedMs: 20, tickerMinFps: 10, tickerMaxFps: 0 }, max: { callbackMs: 2, tickerElapsedMs: 30 }, sceneSyncSkipped: { ratio: 0.2 } },
        appProfile: {
          advance: { p95Ms: 0.5, maxMs: 1 },
          commitInterval: { p95Ms: 16, maxMs: 18 },
          runtimeAdvance: {
            engineAdvanceMs: { p95Ms: 3, maxMs: 6 },
            snapshotCloneMs: { p95Ms: 2, maxMs: 4 },
          },
        },
        readPixels: { count: 0 },
        loadProfile: { appInitMs: 10, artworkProviderMs: 40, artworkPreloadAssetCount: 2, artworkDeferredAssetCount: 3, artworkPreloadLevelCount: 4, artworkPreloadVisibleBuildings: 80, artworkPreloadDetailedBuildings: 70, artworkTotalAssetCount: 5, artworkAtlasManifestMs: 3, artworkAtlasBlockingLoadMs: 30, artworkAtlasDeferredDispatchMs: 0.1, artworkAtlasFullQualityDispatchMs: 0.2, artworkAtlasBlockingEntryCount: 2, artworkAtlasDeferredEntryCount: 3, artworkAtlasFullQualityEntryCount: 2, artworkAtlasBlockingTextureCount: 8, artworkAtlasDeferredTextureCount: 12, artworkAtlasFullQualityTextureCount: 8, sceneSetupMs: 5, terrainMs: 4, firstSyncMs: 8, firstSyncDelayMs: 1, totalMs: 75 },
        graphicsContext: {
          canvasWidth: 1366,
          canvasHeight: 768,
          contextType: 'webgl2',
          supportedExtensionCount: 32,
          unmaskedRenderer: 'ANGLE (Apple, ANGLE Metal Renderer)',
          angleBackend: 'apple',
          softwareRenderer: false,
        },
        consoleSummary: {
          counts: { total: 1, warning: 1, webgl: 1, gpuStall: 1 },
          byPhase: { 'steady-sample': { total: 1, warning: 1, webgl: 1, gpuStall: 1 } },
          examples: { gpuStall: 'WebGL warning: GPU stall due to ReadPixels' },
        },
      },
      {
        ok: true,
        browserFrameBaseline: { averageFrameMs: 50, p95FrameMs: 55, maxFrameMs: 60 },
        frameMetrics: { averageFrameMs: 80, p95FrameMs: 90, maxFrameMs: 100 },
        renderProfile: { p95: { totalMs: 5 } },
        rendererProfile: { p95Ms: 9, maxMs: 20 },
        tickerProfile: { p95: { callbackMs: 5, sceneSyncMs: 4, tickerDeltaMs: 100, tickerElapsedMs: 90, tickerMinFps: 0, tickerMaxFps: 0 }, max: { callbackMs: 7, tickerElapsedMs: 100 }, sceneSyncSkipped: { ratio: 0.8 } },
        appProfile: {
          advance: { p95Ms: 4, maxMs: 7 },
          commitInterval: { p95Ms: 80, maxMs: 90 },
          advanceEmitSuppressed: true,
          runtimeAdvance: {
            engineAdvanceMs: { p95Ms: 20, maxMs: 30 },
            snapshotCloneMs: { p95Ms: 12, maxMs: 18 },
          },
        },
        readPixels: { count: 2 },
        loadProfile: { appInitMs: 20, artworkProviderMs: 120, artworkPreloadAssetCount: 4, artworkDeferredAssetCount: 1, artworkPreloadLevelCount: 8, artworkPreloadVisibleBuildings: 220, artworkPreloadDetailedBuildings: 96, artworkTotalAssetCount: 5, artworkAtlasManifestMs: 7, artworkAtlasBlockingLoadMs: 100, artworkAtlasDeferredDispatchMs: 0.3, artworkAtlasFullQualityDispatchMs: 0.6, artworkAtlasBlockingEntryCount: 4, artworkAtlasDeferredEntryCount: 1, artworkAtlasFullQualityEntryCount: 4, artworkAtlasBlockingTextureCount: 32, artworkAtlasDeferredTextureCount: 8, artworkAtlasFullQualityTextureCount: 32, sceneSetupMs: 9, terrainMs: 6, firstSyncMs: 16, firstSyncDelayMs: 2, totalMs: 180 },
        graphicsContext: {
          canvasWidth: 1366,
          canvasHeight: 768,
          contextType: 'webgl2',
          supportedExtensionCount: 24,
          unmaskedRenderer: 'ANGLE (Google, Vulkan SwiftShader)',
          angleBackend: 'google',
          softwareRenderer: true,
        },
        consoleSummary: {
          counts: { total: 0, warning: 0, webgl: 0, gpuStall: 0 },
          byPhase: {},
          examples: {},
        },
      },
      {
        ok: true,
        browserFrameBaseline: { averageFrameMs: 17, p95FrameMs: 18, maxFrameMs: 20 },
        frameMetrics: { averageFrameMs: 16, p95FrameMs: 22, maxFrameMs: 40 },
        renderProfile: { p95: { totalMs: 2 } },
        rendererProfile: { p95Ms: 3, maxMs: 6 },
        tickerProfile: { p95: { callbackMs: 2, sceneSyncMs: 2, tickerDeltaMs: 17, tickerElapsedMs: 22, tickerMinFps: 10, tickerMaxFps: 0 }, max: { callbackMs: 3, tickerElapsedMs: 40 }, sceneSyncSkipped: { ratio: 0.5 } },
        appProfile: {
          advance: { p95Ms: 1, maxMs: 2 },
          commitInterval: { p95Ms: 17, maxMs: 20 },
          runtimeAdvance: {
            engineAdvanceMs: { p95Ms: 5, maxMs: 8 },
            snapshotCloneMs: { p95Ms: 4, maxMs: 7 },
          },
        },
        readPixels: { count: 0 },
        loadProfile: { appInitMs: 12, artworkProviderMs: 60, artworkPreloadAssetCount: 3, artworkDeferredAssetCount: 2, artworkPreloadLevelCount: 6, artworkPreloadVisibleBuildings: 160, artworkPreloadDetailedBuildings: 90, artworkTotalAssetCount: 5, artworkAtlasManifestMs: 5, artworkAtlasBlockingLoadMs: 50, artworkAtlasDeferredDispatchMs: 0.2, artworkAtlasFullQualityDispatchMs: 0.4, artworkAtlasBlockingEntryCount: 3, artworkAtlasDeferredEntryCount: 2, artworkAtlasFullQualityEntryCount: 3, artworkAtlasBlockingTextureCount: 18, artworkAtlasDeferredTextureCount: 12, artworkAtlasFullQualityTextureCount: 18, sceneSetupMs: 7, terrainMs: 5, firstSyncMs: 10, firstSyncDelayMs: 3, totalMs: 90 },
        consoleSummary: {
          counts: { total: 2, warning: 2, webgl: 1, gpuStall: 0, assetFallback: 1 },
          byPhase: { 'page-load': { total: 2, warning: 2, webgl: 1, assetFallback: 1 } },
          examples: { assetFallback: 'Building artwork preload failed; using procedural fallback.' },
        },
      },
    ])
    expect(aggregate.browserFrameBaseline).toEqual({ averageFrameMs: 17, p95FrameMs: 18, maxFrameMs: 20 })
    expect(aggregate.frameMetrics).toEqual({ averageFrameMs: 16, p95FrameMs: 22, maxFrameMs: 40 })
    expect(aggregate.renderProfile?.p95?.totalMs).toBe(2)
    expect(aggregate.rendererProfile).toEqual({ p95Ms: 3, maxMs: 6 })
    expect(aggregate.tickerProfile).toEqual({
      p95: { callbackMs: 2, sceneSyncMs: 2, tickerDeltaMs: 17, tickerElapsedMs: 22, tickerMinFps: 10, tickerMaxFps: 0 },
      max: { callbackMs: 3, tickerElapsedMs: 40 },
      sceneSyncSkipped: { ratio: 0.5 },
    })
    expect(aggregate.appProfile).toEqual({
      advance: { p95Ms: 1, maxMs: 2 },
      commitInterval: { p95Ms: 17, maxMs: 20 },
      advanceEmitSuppressed: true,
      runtimeAdvance: expect.objectContaining({
        engineAdvanceMs: { p95Ms: 5, maxMs: 8 },
        snapshotCloneMs: { p95Ms: 4, maxMs: 7 },
      }),
    })
    expect(aggregate.readPixels?.count).toBe(2)
    expect(aggregate.loadProfile).toEqual(expect.objectContaining({
      appInitMs: 12,
      artworkProviderMs: 60,
      artworkPreloadAssetCount: 3,
      artworkDeferredAssetCount: 2,
      artworkPreloadLevelCount: 6,
      artworkPreloadVisibleBuildings: 160,
      artworkPreloadDetailedBuildings: 90,
      artworkTotalAssetCount: 5,
      artworkAtlasManifestMs: 5,
      artworkAtlasBlockingLoadMs: 50,
      artworkAtlasDeferredDispatchMs: 0.2,
      artworkAtlasFullQualityDispatchMs: 0.4,
      artworkAtlasBlockingEntryCount: 3,
      artworkAtlasDeferredEntryCount: 2,
      artworkAtlasFullQualityEntryCount: 3,
      artworkAtlasBlockingTextureCount: 18,
      artworkAtlasDeferredTextureCount: 12,
      artworkAtlasFullQualityTextureCount: 18,
      firstSyncMs: 10,
      firstSyncDelayMs: 2,
      totalMs: 90,
    }))
    expect(aggregate.graphicsContext).toEqual(expect.objectContaining({
      contextType: 'webgl2',
      supportedExtensionCount: 32,
      softwareRenderer: true,
      unmaskedRenderer: 'ANGLE (Google, Vulkan SwiftShader)',
    }))
    expect(aggregate.consoleSummary?.counts).toEqual(expect.objectContaining({
      total: 2,
      warning: 2,
      webgl: 1,
      gpuStall: 1,
      assetFallback: 1,
    }))
    expect(aggregate.consoleSummary?.byPhase?.['steady-sample']).toEqual(expect.objectContaining({ gpuStall: 1 }))
    expect(aggregate.consoleSummary?.byPhase?.['page-load']).toEqual(expect.objectContaining({ assetFallback: 1 }))
    expect(aggregate.consoleSummary?.examples?.gpuStall).toContain('GPU stall')
    expect(aggregate.consoleSummary?.examples?.assetFallback).toContain('fallback')
  })
})
