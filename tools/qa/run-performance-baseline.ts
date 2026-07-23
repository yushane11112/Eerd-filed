import { spawn } from 'node:child_process'
import {
  PERFORMANCE_ENVIRONMENTS,
  PERFORMANCE_THRESHOLDS,
  aggregatePerformanceSamples,
  evaluatePerformanceSample,
  type PerformanceEnvironmentConfig,
} from '../../src/qa/performanceBaseline'

const scenario = process.env.PERF_BASELINE_SCENARIO ?? 'civilization-resident-timeline'
const strict = process.env.PERF_BASELINE_STRICT === '1'
const repeats = Math.max(1, Number.parseInt(process.env.PERF_BASELINE_REPEATS ?? '3', 10) || 1)

const main = async () => {
  const results = []
  for (const environment of PERFORMANCE_ENVIRONMENTS) {
    const samples = []
    for (let index = 0; index < repeats; index += 1) {
      samples.push(await runEnvironment(environment))
    }
    const result = aggregatePerformanceSamples(samples)
    const evaluation = evaluatePerformanceSample(result)
    results.push({
      environment: environment.id,
      label: environment.label,
      description: environment.description,
      evidenceLevel: environment.evidenceLevel,
      scenario,
      evaluation,
      sample: result,
      repeats,
      rawSamples: samples,
    })
  }

  const report = {
    ok: results.every((result) => result.evaluation.ok),
    strict,
    thresholds: PERFORMANCE_THRESHOLDS,
    results,
    limitations: [
      'desktop-gpu 和 software-renderer 是本地 Chromium 代理，不等同于所有用户设备。',
      'embedded-container 是视口和 Chromium 参数代理，不是 Q 音乐真实 WebView 认证。',
    '本报告不替代真实 DCC、图集、粒子和目标设备资源接入后的验收。',
    `每个环境重复 ${repeats} 次；帧时间用中位数评估，readPixels 使用最差值。`,
    ],
  }
  console.log(JSON.stringify(report, null, 2))
  if (strict && !report.ok) process.exitCode = 1
}

const runEnvironment = (environment: PerformanceEnvironmentConfig) => new Promise<any>((resolve, reject) => {
  const child = spawn(process.execPath, ['tools/browser-e2e/run-browser-e2e.cjs'], {
    env: {
      ...process.env,
      BROWSER_E2E_SCENARIO: scenario,
      BROWSER_E2E_PROFILE: environment.id,
      // The managed browser sandbox whitelists the existing E2E preview port;
      // runs are sequential, so one port is sufficient and avoids false startup failures.
      BROWSER_E2E_PORT: process.env.BROWSER_E2E_PORT ?? '4173',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let stdout = ''
  let stderr = ''
  child.stdout.on('data', (chunk) => { stdout += chunk.toString() })
  child.stderr.on('data', (chunk) => { stderr += chunk.toString() })
  child.once('error', reject)
  child.once('exit', (code) => {
    const jsonStart = stdout.indexOf('{')
    if (jsonStart < 0) {
      reject(new Error(`性能基线没有输出 JSON（${environment.id}, exit ${code}）：${stderr || stdout}`))
      return
    }
    try {
      const report = JSON.parse(stdout.slice(jsonStart))
      resolve(report.results?.[0] ?? { ok: false, failures: ['missing scenario result'] })
    } catch (error) {
      reject(new Error(`性能基线 JSON 解析失败（${environment.id}）：${error instanceof Error ? error.message : String(error)}`))
    }
  })
})

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error)
  process.exitCode = 1
})
