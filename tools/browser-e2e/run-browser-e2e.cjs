#!/usr/bin/env node
const { spawn } = require('node:child_process')
const http = require('node:http')
const { chromium } = require('playwright')

const cwd = process.cwd()
const host = '127.0.0.1'
const port = Number(process.env.BROWSER_E2E_PORT || 4173)
const baseUrl = `http://${host}:${port}`
const scenarioFilter = process.env.BROWSER_E2E_SCENARIO

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
    { cwd, stdio: ['ignore', 'pipe', 'pipe'] },
  )
  const serverLogs = []
  server.stdout.on('data', (chunk) => serverLogs.push(chunk.toString()))
  server.stderr.on('data', (chunk) => serverLogs.push(chunk.toString()))

  try {
    await waitForHttp(baseUrl, 20_000)
    const browser = await chromium.launch({ headless: true })
    const results = []
    try {
      for (const scenario of selected) {
        results.push(await runScenario(browser, scenario))
      }
    } finally {
      await browser.close()
    }

    console.log(JSON.stringify({
      ok: results.every((result) => result.ok),
      baseUrl,
      scenarioCount: results.length,
      results,
    }, null, 2))

    const failed = results.filter((result) => !result.ok)
    if (failed.length > 0) process.exit(1)
  } finally {
    server.kill('SIGTERM')
    await new Promise((resolve) => {
      const timer = setTimeout(resolve, 1_000)
      server.once('exit', () => {
        clearTimeout(timer)
        resolve()
      })
    })
    if (process.env.BROWSER_E2E_DEBUG_SERVER_LOGS === '1') {
      console.error(serverLogs.join(''))
    }
  }
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
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } })
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
    await page.goto(`${baseUrl}${scenario.path}`, { waitUntil: 'networkidle', timeout: 20_000 })
    await page.getByLabel('城市瓶颈管理').getByRole('button', { name: /瓶颈/ }).click()

    for (const text of scenario.mustContainText) {
      const locator = page.getByText(text, { exact: false }).first()
      try {
        await locator.waitFor({ state: 'visible', timeout: 5_000 })
      } catch {
        failures.push(`Missing visible text: ${text}`)
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
      interaction: scenario.interaction || null,
      consoleMessages,
      failures,
    }
  } finally {
    await page.close()
  }
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
