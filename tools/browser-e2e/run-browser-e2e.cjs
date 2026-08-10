#!/usr/bin/env node
const { spawn } = require('node:child_process')
const http = require('node:http')
const { chromium } = require('playwright')

const cwd = process.cwd()
const host = '127.0.0.1'
const port = Number(process.env.BROWSER_E2E_PORT || 4173)
const baseUrl = `http://${host}:${port}`
const scenarioFilter = process.env.BROWSER_E2E_SCENARIO
const profile = process.env.BROWSER_E2E_PROFILE || 'desktop-gpu'
const renderQuery = process.env.BROWSER_E2E_RENDER_QUERY

const profiles = {
  'desktop-gpu': {
    viewport: { width: 1366, height: 768 },
    deviceScaleFactor: 1,
    launchArgs: [],
  },
  'software-renderer': {
    viewport: { width: 1366, height: 768 },
    deviceScaleFactor: 1,
    launchArgs: ['--disable-gpu', '--use-angle=swiftshader'],
  },
  'embedded-container': {
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    launchArgs: ['--disable-features=CalculateNativeWinOcclusion'],
  },
}

main().catch((error) => {
  console.error(error?.stack || error)
  process.exit(1)
})

async function main() {
  const scenarios = await loadScenarioContract()
  const selected = scenarioFilter
    ? scenarios.filter((scenario) => scenario.id === scenarioFilter)
    : scenarios
  if (selected.length === 0) {
    throw new Error(`No browser E2E scenario matched ${scenarioFilter}`)
  }

  const server = spawn(
    process.execPath,
    [
      './node_modules/vite/bin/vite.js',
      'preview',
      '--host',
      host,
      '--port',
      String(port),
      '--strictPort',
    ],
    { cwd, stdio: ['ignore', 'pipe', 'pipe'], detached: process.platform !== 'win32' },
  )
  const serverLogs = []
  server.stdout.on('data', (chunk) => serverLogs.push(chunk.toString()))
  server.stderr.on('data', (chunk) => serverLogs.push(chunk.toString()))

  try {
    await waitForHttp(baseUrl, 20_000)
    const browserProfile = profiles[profile]
    if (!browserProfile) throw new Error(`Unknown BROWSER_E2E_PROFILE: ${profile}`)
    const browser = await chromium.launch({ headless: true, args: browserProfile.launchArgs })
    const results = []
    try {
      for (const scenario of selected) {
        results.push(await runScenario(browser, scenario))
      }
    } finally {
      await closeBrowser(browser)
    }

    console.log(JSON.stringify({
      ok: results.every((result) => result.ok),
      baseUrl,
      profile,
      scenarioCount: results.length,
      results,
    }, null, 2))

    const failed = results.filter((result) => !result.ok)
    if (failed.length > 0) process.exit(1)
  } finally {
    await terminateProcessTree(server)
    if (process.env.BROWSER_E2E_DEBUG_SERVER_LOGS === '1') {
      console.error(serverLogs.join(''))
    }
  }
}

async function closeBrowser(browser) {
  try {
    await withTimeout(browser.close(), 5_000)
  } catch {
    const browserProcess = typeof browser.process === 'function' ? browser.process() : null
    if (browserProcess) await terminateProcessTree(browserProcess)
  }
}

async function terminateProcessTree(child) {
  if (!child?.pid) return
  try {
    if (process.platform !== 'win32') process.kill(-child.pid, 'SIGTERM')
    else child.kill('SIGTERM')
  } catch {}
  await new Promise((resolve) => {
    const timer = setTimeout(() => {
      try {
        if (process.platform !== 'win32') process.kill(-child.pid, 'SIGKILL')
        else child.kill('SIGKILL')
      } catch {}
      resolve()
    }, 1_000)
    child.once('exit', () => {
      clearTimeout(timer)
      resolve()
    })
  })
}

function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`operation timed out after ${timeoutMs}ms`)), timeoutMs)),
  ])
}

async function loadScenarioContract() {
  const runner = spawn(
    './node_modules/.bin/vite-node',
    ['src/qa/browserE2eRunner.ts'],
    {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        BROWSER_E2E_CONTRACT_CLI: '1',
      },
    },
  )
  let stdout = ''
  let stderr = ''
  runner.stdout.on('data', (chunk) => { stdout += chunk.toString() })
  runner.stderr.on('data', (chunk) => { stderr += chunk.toString() })
  const exitCode = await new Promise((resolve) => runner.once('exit', resolve))
  if (exitCode !== 0) {
    throw new Error(`Browser E2E contract runner failed:\n${stderr || stdout}`)
  }
  const jsonStart = stdout.indexOf('{')
  if (jsonStart < 0) throw new Error(`Browser E2E contract runner did not emit JSON:\n${stdout}`)
  const contract = JSON.parse(stdout.slice(jsonStart))
  if (!contract.ok) throw new Error(`Browser E2E contract is invalid:\n${stdout}`)
  return contract.scenarios
}

async function runScenario(browser, scenario) {
  const browserProfile = profiles[profile]
  const page = await browser.newPage({
    viewport: browserProfile.viewport,
    deviceScaleFactor: browserProfile.deviceScaleFactor,
  })
  await page.addInitScript(() => {
    window.__littleEarReadPixels = { count: 0, samples: [] }
    window.__littleEarRenderProfiles = []
    const install = (prototype) => {
      if (!prototype || prototype.__littleEarReadPixelsWrapped) return
      const original = prototype.readPixels
      if (typeof original !== 'function') return
      prototype.readPixels = function (...args) {
        window.__littleEarReadPixels.count += 1
        if (window.__littleEarReadPixels.samples.length < 3) {
          window.__littleEarReadPixels.samples.push({ width: args[2], height: args[3] })
        }
        return original.apply(this, args)
      }
      prototype.__littleEarReadPixelsWrapped = true
    }
    install(window.WebGLRenderingContext?.prototype)
    install(window.WebGL2RenderingContext?.prototype)
  })
  const consoleMessages = []
  page.on('console', (message) => {
    consoleMessages.push({
      type: message.type(),
      text: message.text(),
    })
  })
  page.on('pageerror', (error) => {
    consoleMessages.push({
      type: 'error',
      text: error.message,
    })
  })

  const failures = []
  try {
    const scenarioUrl = new URL(`${baseUrl}${scenario.path}`)
    if (renderQuery) {
      const query = new URLSearchParams(renderQuery.replace(/^\?/, ''))
      for (const [key, value] of query) scenarioUrl.searchParams.set(key, value)
    }
    await page.goto(scenarioUrl.toString(), { waitUntil: 'networkidle', timeout: 20_000 })
    const bottleneckButton = page.getByLabel('城市瓶颈管理').getByRole('button', { name: /瓶颈/ })
    if (await bottleneckButton.getAttribute('aria-expanded') !== 'true') {
      await bottleneckButton.scrollIntoViewIfNeeded()
      await bottleneckButton.click()
    }

    for (const text of scenario.mustContainText) {
      const locator = page.getByText(text, { exact: false }).first()
      try {
        await locator.waitFor({ state: 'visible', timeout: 5_000 })
      } catch {
        failures.push(`Missing visible text: ${text}`)
      }
    }

    await resetRenderProfileSamples(page)
    const frameMetrics = await sampleFrameMetrics(page)
    const renderProfile = await page.evaluate(() => {
      const profiles = window.__littleEarRenderProfiles ?? []
      if (profiles.length === 0) return { sampleCount: 0 }
      const timingFields = ['totalMs', 'districtsMs', 'buildingsMs', 'residentsMs', 'dropsMs', 'cleanupMs', 'sortMs']
      const countFields = ['buildings', 'residents', 'transport', 'drops', 'visible', 'detailedBuildings', 'reducedBuildings', 'pooled']
      const percentile = (values, ratio) => {
        const sorted = [...values].sort((left, right) => left - right)
        return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * ratio))]
      }
      const average = {}
      const p95 = {}
      for (const field of timingFields) {
        const values = profiles.map((profile) => Number(profile[field]) || 0)
        average[field] = Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(3))
        p95[field] = Number(percentile(values, 0.95).toFixed(3))
      }
      const entityRange = {}
      for (const field of countFields) {
        const values = profiles.map((profile) => Number(profile[field]) || 0)
        entityRange[field] = {
          min: Math.min(...values),
          max: Math.max(...values),
          last: values[values.length - 1],
        }
      }
      return { sampleCount: profiles.length, average, p95, entityRange }
    })
    const rendererProfile = await page.evaluate(() => {
      const values = window.__littleEarRendererProfiles ?? []
      if (values.length === 0) return { sampleCount: 0 }
      const sorted = [...values].sort((left, right) => left - right)
      const sum = values.reduce((total, value) => total + value, 0)
      return {
        sampleCount: values.length,
        averageMs: Number((sum / values.length).toFixed(3)),
        p95Ms: Number(sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))].toFixed(3)),
        maxMs: Number(sorted[sorted.length - 1].toFixed(3)),
      }
    })
    const renderConfiguration = await page.evaluate(() => window.__littleEarRenderConfiguration ?? null)

    for (const [field, expected] of Object.entries(scenario.renderEntityAssertions || {})) {
      const actual = renderProfile.entityRange?.[field]?.last
      if (actual !== expected) {
        failures.push(`Render entity assertion ${field}: expected ${expected}, got ${actual ?? 'missing'}`)
      }
    }
    const renderEntityMinimums = { ...(scenario.renderEntityMinimums || {}) }
    for (const conditional of scenario.conditionalRenderEntityMinimums || []) {
      if (renderConfigurationMatches(renderConfiguration, conditional.when || {})) {
        Object.assign(renderEntityMinimums, conditional.minimums || {})
      }
    }
    for (const [field, minimum] of Object.entries(renderEntityMinimums)) {
      const actual = renderProfile.entityRange?.[field]?.last
      if (typeof actual !== 'number' || actual < minimum) {
        failures.push(`Render entity minimum ${field}: expected >= ${minimum}, got ${actual ?? 'missing'}`)
      }
    }

    if (scenario.interaction) {
      await page.getByRole('button', { name: scenario.interaction.clickText }).click({ timeout: 5_000 })
      try {
        await page.getByText(scenario.interaction.expectToastText, { exact: false })
          .first()
          .waitFor({ state: 'visible', timeout: 5_000 })
      } catch {
        failures.push(`Missing interaction result text: ${scenario.interaction.expectToastText}`)
      }
      if (scenario.interaction.expectVisibleText) {
        try {
          await page.getByText(scenario.interaction.expectVisibleText, { exact: false })
            .first()
            .waitFor({ state: 'visible', timeout: 5_000 })
        } catch {
          failures.push(`Missing post-interaction visible text: ${scenario.interaction.expectVisibleText}`)
        }
      }
    }

    const forbidden = new Set(scenario.forbiddenConsoleLevels)
    for (const message of consoleMessages) {
      if (forbidden.has(message.type)) {
        failures.push(`Forbidden console ${message.type}: ${message.text}`)
      }
    }

    return {
      id: scenario.id,
      title: scenario.title,
      path: scenario.path,
      ok: failures.length === 0,
      checkedTexts: scenario.mustContainText,
      frameMetrics,
      renderProfile,
      rendererProfile,
      profileWindow: 'steady-state-after-assertions',
      renderConfiguration,
      readPixels: await page.evaluate(() => window.__littleEarReadPixels ?? { count: 0, samples: [] }),
      interaction: scenario.interaction || null,
      consoleMessages,
      failures,
    }
  } finally {
    await page.close()
  }
}

async function resetRenderProfileSamples(page) {
  await page.evaluate(() => {
    if (Array.isArray(window.__littleEarRenderProfiles)) window.__littleEarRenderProfiles.length = 0
    if (Array.isArray(window.__littleEarRendererProfiles)) window.__littleEarRendererProfiles.length = 0
  })
}

function renderConfigurationMatches(configuration, expected) {
  if (!configuration) return false
  return Object.entries(expected).every(([field, value]) => configuration[field] === value)
}

async function sampleFrameMetrics(page) {
  return page.evaluate(async () => {
    const frameTimes = []
    const startedAt = performance.now()
    let previous = startedAt
    let frameCount = 0
    await new Promise((resolve) => {
      const sample = (now) => {
        frameCount += 1
        frameTimes.push(now - previous)
        previous = now
        if (now - startedAt >= 1_000) {
          resolve()
          return
        }
        requestAnimationFrame(sample)
      }
      requestAnimationFrame(sample)
    })
    const sorted = frameTimes.slice(1).sort((left, right) => left - right)
    const sum = sorted.reduce((total, value) => total + value, 0)
    const canvas = document.querySelector('canvas')
    return {
      durationMs: Math.round(performance.now() - startedAt),
      frameCount,
      averageFrameMs: sorted.length ? Number((sum / sorted.length).toFixed(2)) : 0,
      p95FrameMs: sorted.length ? Number(sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))].toFixed(2)) : 0,
      maxFrameMs: sorted.length ? Number(sorted[sorted.length - 1].toFixed(2)) : 0,
      canvasWidth: canvas?.width ?? 0,
      canvasHeight: canvas?.height ?? 0,
    }
  })
}

function waitForHttp(url, timeoutMs) {
  const startedAt = Date.now()
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const request = http.get(url, (response) => {
        response.resume()
        if (response.statusCode && response.statusCode >= 200 && response.statusCode < 500) {
          resolve()
          return
        }
        retry()
      })
      request.on('error', retry)
      request.setTimeout(1_000, () => {
        request.destroy()
        retry()
      })
    }
    const retry = () => {
      if (Date.now() - startedAt > timeoutMs) {
        reject(new Error(`Timed out waiting for ${url}`))
        return
      }
      setTimeout(attempt, 250)
    }
    attempt()
  })
}
