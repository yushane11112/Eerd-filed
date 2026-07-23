import { spawn } from 'node:child_process'

const scenario = process.env.RENDER_ABLATION_SCENARIO ?? 'civilization-resident-timeline'
const profile = process.env.RENDER_ABLATION_PROFILE ?? 'desktop-gpu'
const repeats = Math.max(1, Number.parseInt(process.env.RENDER_ABLATION_REPEATS ?? '3', 10) || 1)
const allModes = [
  { id: 'full', query: 'renderProfile=1' },
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
  frameMetrics?: { averageFrameMs?: number; p95FrameMs?: number; maxFrameMs?: number }
  renderProfile?: { p95?: { totalMs?: number } }
  rendererProfile?: { averageMs?: number; p95Ms?: number; maxMs?: number }
  renderConfiguration?: { authoredArtwork?: boolean; authoredAnimation?: boolean; terrain?: boolean }
  readPixels?: { count?: number }
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

const run = (query: string) => new Promise<BrowserResult>((resolve, reject) => {
  invocation += 1
  const child = spawn(process.execPath, ['tools/browser-e2e/run-browser-e2e.cjs'], {
    env: {
      ...process.env,
      BROWSER_E2E_SCENARIO: scenario,
      BROWSER_E2E_PROFILE: profile,
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
      settle(() => reject(new Error(`渲染差分没有输出 JSON（${query}, close ${code}, signal ${signal ?? 'none'}）：${stderr || stdout}`)))
      return
    }
    try {
      const report = JSON.parse(stdout.slice(jsonStart))
      settle(() => resolve(report.results?.[0] ?? { ok: false, failures: ['missing scenario result'] }))
    } catch (error) {
      settle(() => reject(new Error(`渲染差分 JSON 解析失败：${error instanceof Error ? error.message : String(error)}`)))
    }
  })
})

const main = async () => {
  const results = []
  for (const mode of modes) {
    const samples = []
    for (let index = 0; index < repeats; index += 1) samples.push(await run(mode.query))
    results.push({
      mode: mode.id,
      query: mode.query,
      repeats,
      configuration: samples.at(-1)?.renderConfiguration ?? null,
      sample: {
        ok: samples.every((sample) => sample.ok),
        averageFrameMs: median(samples.map((sample) => sample.frameMetrics?.averageFrameMs ?? Number.POSITIVE_INFINITY)),
        p95FrameMs: median(samples.map((sample) => sample.frameMetrics?.p95FrameMs ?? Number.POSITIVE_INFINITY)),
        maxFrameMs: median(samples.map((sample) => sample.frameMetrics?.maxFrameMs ?? Number.POSITIVE_INFINITY)),
        renderSyncP95Ms: median(samples.map((sample) => sample.renderProfile?.p95?.totalMs ?? Number.POSITIVE_INFINITY)),
        rendererAverageMs: median(samples.map((sample) => sample.rendererProfile?.averageMs ?? Number.POSITIVE_INFINITY)),
        rendererP95Ms: median(samples.map((sample) => sample.rendererProfile?.p95Ms ?? Number.POSITIVE_INFINITY)),
        rendererMaxMs: median(samples.map((sample) => sample.rendererProfile?.maxMs ?? Number.POSITIVE_INFINITY)),
        readPixels: Math.max(...samples.map((sample) => sample.readPixels?.count ?? Number.POSITIVE_INFINITY)),
      },
      rawSamples: samples,
    })
  }
  console.log(JSON.stringify({ scenario, profile, repeats, results }, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error)
  process.exitCode = 1
})
