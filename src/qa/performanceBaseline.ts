export type PerformanceEnvironmentId = 'desktop-gpu' | 'software-renderer' | 'embedded-container'

export interface PerformanceEnvironmentConfig {
  id: PerformanceEnvironmentId
  label: string
  description: string
  chromiumArgs: string[]
  viewport: { width: number; height: number }
  deviceScaleFactor: number
  evidenceLevel: 'local-proxy' | 'container-proxy'
}

export const PERFORMANCE_ENVIRONMENTS: ReadonlyArray<PerformanceEnvironmentConfig> = [
  {
    id: 'desktop-gpu',
    label: '桌面 GPU',
    description: 'Chromium 默认图形路径；真实 GPU/软件后端以浏览器样本的 graphicsContext 为准。',
    chromiumArgs: [],
    viewport: { width: 1366, height: 768 },
    deviceScaleFactor: 1,
    evidenceLevel: 'local-proxy',
  },
  {
    id: 'software-renderer',
    label: '软件渲染',
    description: '显式禁用硬件 GPU 并使用 SwiftShader，模拟低图形能力环境。',
    chromiumArgs: ['--disable-gpu', '--use-angle=swiftshader'],
    viewport: { width: 1366, height: 768 },
    deviceScaleFactor: 1,
    evidenceLevel: 'local-proxy',
  },
  {
    id: 'embedded-container',
    label: '嵌入容器代理',
    description: '以较小视口模拟 Q 音乐内嵌 WebView 的布局与像素压力；不是 Q 音乐真实容器认证。',
    chromiumArgs: ['--disable-features=CalculateNativeWinOcclusion'],
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    evidenceLevel: 'container-proxy',
  },
]

export const PERFORMANCE_THRESHOLDS = {
  averageFrameMs: 16.7,
  p95FrameMs: 25,
  maxFrameMs: 50,
  renderSyncP95Ms: 4,
  readPixelsCount: 0,
} as const

export interface PerformanceSample {
  ok: boolean
  browserFrameBaseline?: {
    averageFrameMs?: number
    p95FrameMs?: number
    maxFrameMs?: number
  }
  frameMetrics?: {
    averageFrameMs?: number
    p95FrameMs?: number
    maxFrameMs?: number
  }
  renderProfile?: {
    p95?: { totalMs?: number }
  }
  rendererProfile?: { p95Ms?: number; maxMs?: number }
  tickerProfile?: {
    p95?: {
      callbackMs?: number
      sceneSyncMs?: number
      tickerDeltaMs?: number
      tickerElapsedMs?: number
      tickerMinFps?: number
      tickerMaxFps?: number
    }
    max?: {
      callbackMs?: number
      tickerElapsedMs?: number
    }
    sceneSyncSkipped?: { ratio?: number }
  }
  appProfile?: {
    advance?: { p95Ms?: number; maxMs?: number }
    commitInterval?: { p95Ms?: number; maxMs?: number }
    advanceEmitSuppressed?: boolean
    runtimeAdvance?: {
      totalMs?: { p95Ms?: number; maxMs?: number }
      engineAdvanceMs?: { p95Ms?: number; maxMs?: number }
      snapshotCloneMs?: { p95Ms?: number; maxMs?: number }
      timelineMs?: { p95Ms?: number; maxMs?: number }
      scenarioFixtureMs?: { p95Ms?: number; maxMs?: number }
      districtMs?: { p95Ms?: number; maxMs?: number }
      upgradesMs?: { p95Ms?: number; maxMs?: number }
      dropsMs?: { p95Ms?: number; maxMs?: number }
      rebuildMs?: { p95Ms?: number; maxMs?: number }
      cacheEmitMs?: { p95Ms?: number; maxMs?: number }
    }
  }
  readPixels?: { count?: number }
  loadProfile?: {
    appInitMs?: number
    animationAtlasMs?: number
    artworkProviderMs?: number
    artworkPreloadAssetCount?: number
    artworkDeferredAssetCount?: number
    artworkPreloadLevelCount?: number
    artworkPreloadVisibleBuildings?: number
    artworkPreloadDetailedBuildings?: number
    artworkTotalAssetCount?: number
    artworkAtlasManifestMs?: number
    artworkAtlasBlockingLoadMs?: number
    artworkAtlasDeferredDispatchMs?: number
    artworkAtlasFullQualityDispatchMs?: number
    artworkAtlasBlockingEntryCount?: number
    artworkAtlasDeferredEntryCount?: number
    artworkAtlasFullQualityEntryCount?: number
    artworkAtlasBlockingTextureCount?: number
    artworkAtlasDeferredTextureCount?: number
    artworkAtlasFullQualityTextureCount?: number
    sceneSetupMs?: number
    terrainMs?: number
    firstSyncMs?: number
    firstSyncDelayMs?: number
    totalMs?: number
  }
  graphicsContext?: {
    canvasWidth?: number
    canvasHeight?: number
    contextType?: string
    contextAttributes?: Record<string, unknown> | null
    vendor?: string | null
    renderer?: string | null
    unmaskedVendor?: string | null
    unmaskedRenderer?: string | null
    supportedExtensionCount?: number
    angleBackend?: string | null
    softwareRenderer?: boolean
  }
  consoleSummary?: {
    counts?: {
      total?: number
      error?: number
      warning?: number
      webgl?: number
      gpuStall?: number
      pixi?: number
      assetFallback?: number
      pageError?: number
      other?: number
    }
    byPhase?: Record<string, {
      total?: number
      error?: number
      warning?: number
      webgl?: number
      gpuStall?: number
      pixi?: number
      assetFallback?: number
      pageError?: number
      other?: number
    }>
    examples?: Record<string, string>
  }
}

export interface PerformanceCheck {
  metric: string
  actual: number | boolean
  threshold: number | boolean
  ok: boolean
}

export interface PerformanceEvaluation {
  ok: boolean
  checks: PerformanceCheck[]
}

type RuntimeAdvanceProfileField = keyof NonNullable<NonNullable<PerformanceSample['appProfile']>['runtimeAdvance']>
type ConsoleSummaryCounts = NonNullable<NonNullable<PerformanceSample['consoleSummary']>['counts']>
type ConsoleSummaryField = keyof ConsoleSummaryCounts
type LoadProfileField = keyof NonNullable<PerformanceSample['loadProfile']>

export function aggregatePerformanceSamples(samples: ReadonlyArray<PerformanceSample>): PerformanceSample {
  if (samples.length === 0) return { ok: false }
  const median = (values: number[]) => {
    const sorted = values.filter(Number.isFinite).sort((left, right) => left - right)
    return sorted.length === 0 ? Number.POSITIVE_INFINITY : sorted[Math.floor((sorted.length - 1) / 2)]
  }
  const frameValues = (field: 'averageFrameMs' | 'p95FrameMs' | 'maxFrameMs') =>
    samples.map((sample) => sample.frameMetrics?.[field] ?? Number.POSITIVE_INFINITY)
  const runtimeAdvancePhase = (field: RuntimeAdvanceProfileField) => ({
    p95Ms: median(samples.map((sample) => sample.appProfile?.runtimeAdvance?.[field]?.p95Ms ?? Number.POSITIVE_INFINITY)),
    maxMs: median(samples.map((sample) => sample.appProfile?.runtimeAdvance?.[field]?.maxMs ?? Number.POSITIVE_INFINITY)),
  })
  const consoleFields: ConsoleSummaryField[] = ['total', 'error', 'warning', 'webgl', 'gpuStall', 'pixi', 'assetFallback', 'pageError', 'other']
  const consoleExamples: Record<string, string> = {}
  const consolePhases = [...new Set(samples.flatMap((sample) => Object.keys(sample.consoleSummary?.byPhase ?? {})))]
  for (const sample of samples) {
    for (const [category, example] of Object.entries(sample.consoleSummary?.examples ?? {})) {
      if (!consoleExamples[category]) consoleExamples[category] = example
    }
  }
  return {
    ok: samples.every((sample) => sample.ok),
    browserFrameBaseline: {
      averageFrameMs: median(samples.map((sample) => sample.browserFrameBaseline?.averageFrameMs ?? Number.POSITIVE_INFINITY)),
      p95FrameMs: median(samples.map((sample) => sample.browserFrameBaseline?.p95FrameMs ?? Number.POSITIVE_INFINITY)),
      maxFrameMs: median(samples.map((sample) => sample.browserFrameBaseline?.maxFrameMs ?? Number.POSITIVE_INFINITY)),
    },
    frameMetrics: {
      averageFrameMs: median(frameValues('averageFrameMs')),
      p95FrameMs: median(frameValues('p95FrameMs')),
      maxFrameMs: median(frameValues('maxFrameMs')),
    },
    renderProfile: { p95: { totalMs: median(samples.map((sample) => sample.renderProfile?.p95?.totalMs ?? Number.POSITIVE_INFINITY)) } },
    rendererProfile: {
      p95Ms: median(samples.map((sample) => sample.rendererProfile?.p95Ms ?? Number.POSITIVE_INFINITY)),
      maxMs: median(samples.map((sample) => sample.rendererProfile?.maxMs ?? Number.POSITIVE_INFINITY)),
    },
    tickerProfile: {
      p95: {
        callbackMs: median(samples.map((sample) => sample.tickerProfile?.p95?.callbackMs ?? Number.POSITIVE_INFINITY)),
        sceneSyncMs: median(samples.map((sample) => sample.tickerProfile?.p95?.sceneSyncMs ?? Number.POSITIVE_INFINITY)),
        tickerDeltaMs: median(samples.map((sample) => sample.tickerProfile?.p95?.tickerDeltaMs ?? Number.POSITIVE_INFINITY)),
        tickerElapsedMs: median(samples.map((sample) => sample.tickerProfile?.p95?.tickerElapsedMs ?? Number.POSITIVE_INFINITY)),
        tickerMinFps: median(samples.map((sample) => sample.tickerProfile?.p95?.tickerMinFps ?? Number.POSITIVE_INFINITY)),
        tickerMaxFps: median(samples.map((sample) => sample.tickerProfile?.p95?.tickerMaxFps ?? Number.POSITIVE_INFINITY)),
      },
      max: {
        callbackMs: median(samples.map((sample) => sample.tickerProfile?.max?.callbackMs ?? Number.POSITIVE_INFINITY)),
        tickerElapsedMs: median(samples.map((sample) => sample.tickerProfile?.max?.tickerElapsedMs ?? Number.POSITIVE_INFINITY)),
      },
      sceneSyncSkipped: {
        ratio: median(samples.map((sample) => sample.tickerProfile?.sceneSyncSkipped?.ratio ?? Number.POSITIVE_INFINITY)),
      },
    },
    appProfile: {
      advance: {
        p95Ms: median(samples.map((sample) => sample.appProfile?.advance?.p95Ms ?? Number.POSITIVE_INFINITY)),
        maxMs: median(samples.map((sample) => sample.appProfile?.advance?.maxMs ?? Number.POSITIVE_INFINITY)),
      },
      commitInterval: {
        p95Ms: median(samples.map((sample) => sample.appProfile?.commitInterval?.p95Ms ?? Number.POSITIVE_INFINITY)),
        maxMs: median(samples.map((sample) => sample.appProfile?.commitInterval?.maxMs ?? Number.POSITIVE_INFINITY)),
      },
      advanceEmitSuppressed: samples.some((sample) => sample.appProfile?.advanceEmitSuppressed === true),
      runtimeAdvance: {
        totalMs: runtimeAdvancePhase('totalMs'),
        engineAdvanceMs: runtimeAdvancePhase('engineAdvanceMs'),
        snapshotCloneMs: runtimeAdvancePhase('snapshotCloneMs'),
        timelineMs: runtimeAdvancePhase('timelineMs'),
        scenarioFixtureMs: runtimeAdvancePhase('scenarioFixtureMs'),
        districtMs: runtimeAdvancePhase('districtMs'),
        upgradesMs: runtimeAdvancePhase('upgradesMs'),
        dropsMs: runtimeAdvancePhase('dropsMs'),
        rebuildMs: runtimeAdvancePhase('rebuildMs'),
        cacheEmitMs: runtimeAdvancePhase('cacheEmitMs'),
      },
    },
    readPixels: { count: Math.max(...samples.map((sample) => sample.readPixels?.count ?? Number.POSITIVE_INFINITY)) },
    loadProfile: aggregateLoadProfile(samples, median),
    graphicsContext: aggregateGraphicsContext(samples),
    consoleSummary: {
      counts: Object.fromEntries(consoleFields.map((field) => [
        field,
        Math.max(...samples.map((sample) => Number(sample.consoleSummary?.counts?.[field]) || 0)),
      ])),
      byPhase: Object.fromEntries(consolePhases.map((phase) => [
        phase,
        Object.fromEntries(consoleFields.map((field) => [
          field,
          Math.max(...samples.map((sample) => Number(sample.consoleSummary?.byPhase?.[phase]?.[field]) || 0)),
        ])),
      ])),
      examples: consoleExamples,
    },
  }
}

function aggregateLoadProfile(
  samples: ReadonlyArray<PerformanceSample>,
  median: (values: number[]) => number,
): PerformanceSample['loadProfile'] {
  if (!samples.some((sample) => sample.loadProfile)) return undefined
  const fields: LoadProfileField[] = ['appInitMs', 'animationAtlasMs', 'artworkProviderMs', 'artworkPreloadAssetCount', 'artworkDeferredAssetCount', 'artworkPreloadLevelCount', 'artworkPreloadVisibleBuildings', 'artworkPreloadDetailedBuildings', 'artworkTotalAssetCount', 'artworkAtlasManifestMs', 'artworkAtlasBlockingLoadMs', 'artworkAtlasDeferredDispatchMs', 'artworkAtlasFullQualityDispatchMs', 'artworkAtlasBlockingEntryCount', 'artworkAtlasDeferredEntryCount', 'artworkAtlasFullQualityEntryCount', 'artworkAtlasBlockingTextureCount', 'artworkAtlasDeferredTextureCount', 'artworkAtlasFullQualityTextureCount', 'sceneSetupMs', 'terrainMs', 'firstSyncMs', 'firstSyncDelayMs', 'totalMs']
  return Object.fromEntries(fields
    .map((field) => [field, median(samples.map((sample) => sample.loadProfile?.[field] ?? Number.POSITIVE_INFINITY))] as const)
    .filter(([, value]) => Number.isFinite(value)))
}

function aggregateGraphicsContext(samples: ReadonlyArray<PerformanceSample>): PerformanceSample['graphicsContext'] {
  const latest = [...samples].reverse().find((sample) => sample.graphicsContext)?.graphicsContext
  if (!latest) return undefined
  return {
    ...latest,
    supportedExtensionCount: Math.max(...samples.map((sample) => sample.graphicsContext?.supportedExtensionCount ?? 0)),
    softwareRenderer: samples.some((sample) => sample.graphicsContext?.softwareRenderer === true),
  }
}

export function evaluatePerformanceSample(
  sample: PerformanceSample,
  thresholds: typeof PERFORMANCE_THRESHOLDS = PERFORMANCE_THRESHOLDS,
): PerformanceEvaluation {
  const averageFrameMs = sample.frameMetrics?.averageFrameMs ?? Number.POSITIVE_INFINITY
  const p95FrameMs = sample.frameMetrics?.p95FrameMs ?? Number.POSITIVE_INFINITY
  const maxFrameMs = sample.frameMetrics?.maxFrameMs ?? Number.POSITIVE_INFINITY
  const renderSyncP95Ms = sample.renderProfile?.p95?.totalMs ?? Number.POSITIVE_INFINITY
  const readPixelsCount = sample.readPixels?.count ?? Number.POSITIVE_INFINITY
  const checks: PerformanceCheck[] = [
    { metric: 'scenario', actual: sample.ok, threshold: true, ok: sample.ok },
    { metric: 'averageFrameMs', actual: averageFrameMs, threshold: thresholds.averageFrameMs, ok: averageFrameMs <= thresholds.averageFrameMs },
    { metric: 'p95FrameMs', actual: p95FrameMs, threshold: thresholds.p95FrameMs, ok: p95FrameMs <= thresholds.p95FrameMs },
    { metric: 'maxFrameMs', actual: maxFrameMs, threshold: thresholds.maxFrameMs, ok: maxFrameMs <= thresholds.maxFrameMs },
    { metric: 'renderSyncP95Ms', actual: renderSyncP95Ms, threshold: thresholds.renderSyncP95Ms, ok: renderSyncP95Ms <= thresholds.renderSyncP95Ms },
    { metric: 'readPixelsCount', actual: readPixelsCount, threshold: thresholds.readPixelsCount, ok: readPixelsCount <= thresholds.readPixelsCount },
  ]
  return { ok: checks.every((check) => check.ok), checks }
}
