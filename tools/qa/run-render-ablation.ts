import { spawn } from 'node:child_process'

const scenario = process.env.RENDER_ABLATION_SCENARIO ?? 'civilization-resident-timeline'
const profile = process.env.RENDER_ABLATION_PROFILE ?? 'desktop-gpu'
const profiles = (process.env.RENDER_ABLATION_PROFILES ?? profile)
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)
const repeats = Math.max(1, Number.parseInt(process.env.RENDER_ABLATION_REPEATS ?? '3', 10) || 1)
const allModes = [
  { id: 'full', query: 'renderProfile=1' },
  { id: 'no-react-commit', query: 'renderProfile=1&suppressReactCommit=1' },
  { id: 'no-ticker-min-fps', query: 'renderProfile=1&tickerMinFps=0' },
  { id: 'ticker-max-fps-30', query: 'renderProfile=1&tickerMaxFps=30' },
  { id: 'no-building-lod', query: 'renderProfile=1&disableBuildingLod=1' },
  { id: 'no-atlas', query: 'renderProfile=1&disableAtlas=1' },
  { id: 'no-artwork', query: 'renderProfile=1&disableArtwork=1' },
  { id: 'no-animation', query: 'renderProfile=1&disableAnimation=1' },
  { id: 'no-terrain', query: 'renderProfile=1&disableTerrain=1' },
] as const
const requestedModes = (process.env.RENDER_ABLATION_MODES ?? '').split(',').map((mode) => mode.trim()).filter(Boolean)
const modes = requestedModes.length
  ? allModes.filter((mode) => requestedModes.includes(mode.id))
  : allModes

if (modes.length === 0) throw new Error(`No render ablation mode matched RENDER_ABLATION_MODES=${requestedModes.join(',')}`)
let invocation = 0
const timeoutMs = Number.parseInt(process.env.RENDER_ABLATION_TIMEOUT_MS ?? '90000', 10)

interface BrowserResult {
  ok: boolean
  profileWindow?: string
  browserFrameBaseline?: { averageFrameMs?: number; p95FrameMs?: number; maxFrameMs?: number }
  frameMetrics?: { averageFrameMs?: number; p95FrameMs?: number; maxFrameMs?: number }
  renderProfile?: {
    p95?: { totalMs?: number }
    entityRange?: Record<string, { last?: number }>
  }
  rendererProfile?: { averageMs?: number; p95Ms?: number; maxMs?: number }
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
      sceneSyncMs?: number
      tickerDeltaMs?: number
      tickerElapsedMs?: number
    }
    sceneSyncSkipped?: { count?: number; ratio?: number }
  }
  appProfile?: {
    advance?: { p95Ms?: number; maxMs?: number }
    commitInterval?: { p95Ms?: number; maxMs?: number }
    advanceEmitSuppressed?: boolean
    runtimeAdvance?: Record<string, { p95Ms?: number; maxMs?: number }>
    lastSnapshotTick?: number | null
  }
  renderConfiguration?: {
    authoredArtwork?: boolean
    authoredAnimation?: boolean
    terrain?: boolean
    buildingLod?: boolean
  }
  readPixels?: { count?: number }
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
    examples?: Record<string, string>
  }
  failures?: string[]
}

const median = (values: number[]) => {
  const sorted = values.filter(Number.isFinite).sort((left, right) => left - right)
  return sorted[Math.floor((sorted.length - 1) / 2)] ?? Number.POSITIVE_INFINITY
}

const terminateProcessTree = (child: ReturnType<typeof spawn>, signal: NodeJS.Signals) => {
  if (!child.pid) return
  try {
    if (process.platform !== 'win32') process.kill(-child.pid, signal)
    else child.kill(signal)
  } catch {
    child.kill(signal)
  }
}

const run = (query: string, browserProfile: string) => new Promise<BrowserResult>((resolve, reject) => {
  invocation += 1
  const child = spawn(process.execPath, ['tools/browser-e2e/run-browser-e2e.cjs'], {
    env: {
      ...process.env,
      BROWSER_E2E_SCENARIO: scenario,
      BROWSER_E2E_PROFILE: browserProfile,
      BROWSER_E2E_RENDER_QUERY: query,
      BROWSER_E2E_PORT: String(Number.parseInt(process.env.BROWSER_E2E_PORT ?? '4173', 10) + invocation),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: process.platform !== 'win32',
  })
  let stdout = ''
  let stderr = ''
  let settled = false
  let forceKill: NodeJS.Timeout | undefined
  const settle = (callback: () => void) => {
    if (settled) return
    settled = true
    clearTimeout(timeout)
    if (forceKill) clearTimeout(forceKill)
    callback()
  }
  const cleanup = () => {
    terminateProcessTree(child, 'SIGTERM')
    forceKill = setTimeout(() => terminateProcessTree(child, 'SIGKILL'), 2_000)
    forceKill.unref()
  }
  const timeout = setTimeout(() => {
    settle(() => reject(new Error(`渲染差分运行超时（${query}，${timeoutMs}ms）`)))
    cleanup()
  }, timeoutMs)
  child.stdout.on('data', (chunk) => { stdout += chunk.toString() })
  child.stderr.on('data', (chunk) => { stderr += chunk.toString() })
  child.once('error', (error) => settle(() => reject(error)))
  child.once('close', (code, signal) => {
    if (settled) return
    const jsonStart = stdout.indexOf('{')
    if (jsonStart < 0) {
      settle(() => reject(new Error(`渲染差分没有输出 JSON（${browserProfile}, ${query}, close ${code}, signal ${signal ?? 'none'}）：${stderr || stdout}`)))
      return
    }
    try {
      const report = JSON.parse(stdout.slice(jsonStart))
      settle(() => resolve(report.results?.[0] ?? { ok: false, failures: ['missing scenario result'] }))
    } catch (error) {
      settle(() => reject(new Error(`渲染差分 JSON 解析失败（${browserProfile}）：${error instanceof Error ? error.message : String(error)}`)))
    }
  })
})

const main = async () => {
  const results = []
  for (const browserProfile of profiles) {
    for (const mode of modes) {
      const samples = []
      for (let index = 0; index < repeats; index += 1) samples.push(await run(mode.query, browserProfile))
      results.push({
        profile: browserProfile,
        mode: mode.id,
        query: mode.query,
        repeats,
        configuration: samples.at(-1)?.renderConfiguration ?? null,
        profileWindow: samples.at(-1)?.profileWindow ?? null,
        sample: summarizeSamples(samples),
        rawSamples: samples,
      })
    }
  }
  console.log(JSON.stringify({ scenario, profile: profiles.length === 1 ? profiles[0] : undefined, profiles, repeats, results }, null, 2))
}

const summarizeSamples = (samples: BrowserResult[]) => ({
  ok: samples.every((sample) => sample.ok),
  browserBaselineAverageFrameMs: median(samples.map((sample) => sample.browserFrameBaseline?.averageFrameMs ?? Number.POSITIVE_INFINITY)),
  browserBaselineP95FrameMs: median(samples.map((sample) => sample.browserFrameBaseline?.p95FrameMs ?? Number.POSITIVE_INFINITY)),
  browserBaselineMaxFrameMs: median(samples.map((sample) => sample.browserFrameBaseline?.maxFrameMs ?? Number.POSITIVE_INFINITY)),
  averageFrameMs: median(samples.map((sample) => sample.frameMetrics?.averageFrameMs ?? Number.POSITIVE_INFINITY)),
  p95FrameMs: median(samples.map((sample) => sample.frameMetrics?.p95FrameMs ?? Number.POSITIVE_INFINITY)),
  maxFrameMs: median(samples.map((sample) => sample.frameMetrics?.maxFrameMs ?? Number.POSITIVE_INFINITY)),
  renderSyncP95Ms: median(samples.map((sample) => sample.renderProfile?.p95?.totalMs ?? Number.POSITIVE_INFINITY)),
  rendererAverageMs: median(samples.map((sample) => sample.rendererProfile?.averageMs ?? Number.POSITIVE_INFINITY)),
  rendererP95Ms: median(samples.map((sample) => sample.rendererProfile?.p95Ms ?? Number.POSITIVE_INFINITY)),
  rendererMaxMs: median(samples.map((sample) => sample.rendererProfile?.maxMs ?? Number.POSITIVE_INFINITY)),
  tickerCallbackP95Ms: median(samples.map((sample) => sample.tickerProfile?.p95?.callbackMs ?? Number.POSITIVE_INFINITY)),
  tickerSceneSyncP95Ms: median(samples.map((sample) => sample.tickerProfile?.p95?.sceneSyncMs ?? Number.POSITIVE_INFINITY)),
  tickerDeltaP95Ms: median(samples.map((sample) => sample.tickerProfile?.p95?.tickerDeltaMs ?? Number.POSITIVE_INFINITY)),
  tickerElapsedP95Ms: median(samples.map((sample) => sample.tickerProfile?.p95?.tickerElapsedMs ?? Number.POSITIVE_INFINITY)),
  tickerMinFps: median(samples.map((sample) => sample.tickerProfile?.p95?.tickerMinFps ?? Number.POSITIVE_INFINITY)),
  tickerMaxFps: median(samples.map((sample) => sample.tickerProfile?.p95?.tickerMaxFps ?? Number.POSITIVE_INFINITY)),
  tickerCallbackMaxMs: median(samples.map((sample) => sample.tickerProfile?.max?.callbackMs ?? Number.POSITIVE_INFINITY)),
  tickerElapsedMaxMs: median(samples.map((sample) => sample.tickerProfile?.max?.tickerElapsedMs ?? Number.POSITIVE_INFINITY)),
  tickerSceneSyncSkippedRatio: median(samples.map((sample) => sample.tickerProfile?.sceneSyncSkipped?.ratio ?? Number.POSITIVE_INFINITY)),
  appAdvanceP95Ms: median(samples.map((sample) => sample.appProfile?.advance?.p95Ms ?? Number.POSITIVE_INFINITY)),
  appAdvanceMaxMs: median(samples.map((sample) => sample.appProfile?.advance?.maxMs ?? Number.POSITIVE_INFINITY)),
  appCommitIntervalP95Ms: median(samples.map((sample) => sample.appProfile?.commitInterval?.p95Ms ?? Number.POSITIVE_INFINITY)),
  appCommitIntervalMaxMs: median(samples.map((sample) => sample.appProfile?.commitInterval?.maxMs ?? Number.POSITIVE_INFINITY)),
  appAdvanceEmitSuppressed: samples.some((sample) => sample.appProfile?.advanceEmitSuppressed === true),
  runtimeEngineAdvanceP95Ms: median(samples.map((sample) => sample.appProfile?.runtimeAdvance?.engineAdvanceMs?.p95Ms ?? Number.POSITIVE_INFINITY)),
  runtimeSnapshotCloneP95Ms: median(samples.map((sample) => sample.appProfile?.runtimeAdvance?.snapshotCloneMs?.p95Ms ?? Number.POSITIVE_INFINITY)),
  runtimeTimelineP95Ms: median(samples.map((sample) => sample.appProfile?.runtimeAdvance?.timelineMs?.p95Ms ?? Number.POSITIVE_INFINITY)),
  runtimeDistrictP95Ms: median(samples.map((sample) => sample.appProfile?.runtimeAdvance?.districtMs?.p95Ms ?? Number.POSITIVE_INFINITY)),
  runtimeUpgradesP95Ms: median(samples.map((sample) => sample.appProfile?.runtimeAdvance?.upgradesMs?.p95Ms ?? Number.POSITIVE_INFINITY)),
  runtimeDropsP95Ms: median(samples.map((sample) => sample.appProfile?.runtimeAdvance?.dropsMs?.p95Ms ?? Number.POSITIVE_INFINITY)),
  runtimeRebuildP95Ms: median(samples.map((sample) => sample.appProfile?.runtimeAdvance?.rebuildMs?.p95Ms ?? Number.POSITIVE_INFINITY)),
  runtimeCacheEmitP95Ms: median(samples.map((sample) => sample.appProfile?.runtimeAdvance?.cacheEmitMs?.p95Ms ?? Number.POSITIVE_INFINITY)),
  detailedBuildings: median(samples.map((sample) => sample.renderProfile?.entityRange?.detailedBuildings?.last ?? Number.POSITIVE_INFINITY)),
  reducedBuildings: median(samples.map((sample) => sample.renderProfile?.entityRange?.reducedBuildings?.last ?? Number.POSITIVE_INFINITY)),
  readPixels: Math.max(...samples.map((sample) => sample.readPixels?.count ?? Number.POSITIVE_INFINITY)),
  consoleSummary: summarizeConsoleSamples(samples),
})

const maxConsoleCount = (
  samples: BrowserResult[],
  field: NonNullable<NonNullable<BrowserResult['consoleSummary']>['counts']> extends infer Counts
    ? Counts extends Record<string, unknown>
      ? keyof Counts
      : never
    : never,
) => Math.max(...samples.map((sample) => Number(sample.consoleSummary?.counts?.[field]) || 0))

const summarizeConsoleSamples = (samples: BrowserResult[]) => {
  const fields = ['total', 'error', 'warning', 'webgl', 'gpuStall', 'pixi', 'assetFallback', 'pageError', 'other'] as const
  const counts = Object.fromEntries(fields.map((field) => [field, maxConsoleCount(samples, field)]))
  const examples: Record<string, string> = {}
  for (const sample of samples) {
    for (const [category, example] of Object.entries(sample.consoleSummary?.examples ?? {})) {
      if (!examples[category]) examples[category] = example
    }
  }
  return { counts, examples }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error)
  process.exitCode = 1
})
