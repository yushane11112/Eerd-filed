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
    description: 'Chromium 默认图形路径，作为本机硬件加速参考基线。',
    chromiumArgs: [],
    viewport: { width: 1366, height: 768 },
    deviceScaleFactor: 1,
    evidenceLevel: 'local-proxy',
  },
  {
    id: 'software-renderer',
    label: '软件渲染',
    description: '禁用硬件 GPU 并使用 SwiftShader，模拟低图形能力环境。',
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
    }
    max?: {
      callbackMs?: number
      tickerElapsedMs?: number
    }
  }
  readPixels?: { count?: number }
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

export function aggregatePerformanceSamples(samples: ReadonlyArray<PerformanceSample>): PerformanceSample {
  if (samples.length === 0) return { ok: false }
  const median = (values: number[]) => {
    const sorted = values.filter(Number.isFinite).sort((left, right) => left - right)
    return sorted.length === 0 ? Number.POSITIVE_INFINITY : sorted[Math.floor((sorted.length - 1) / 2)]
  }
  const frameValues = (field: 'averageFrameMs' | 'p95FrameMs' | 'maxFrameMs') =>
    samples.map((sample) => sample.frameMetrics?.[field] ?? Number.POSITIVE_INFINITY)
  return {
    ok: samples.every((sample) => sample.ok),
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
      },
      max: {
        callbackMs: median(samples.map((sample) => sample.tickerProfile?.max?.callbackMs ?? Number.POSITIVE_INFINITY)),
        tickerElapsedMs: median(samples.map((sample) => sample.tickerProfile?.max?.tickerElapsedMs ?? Number.POSITIVE_INFINITY)),
      },
    },
    readPixels: { count: Math.max(...samples.map((sample) => sample.readPixels?.count ?? Number.POSITIVE_INFINITY)) },
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
