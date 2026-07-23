import {
  BROWSER_E2E_SCENARIOS,
  validateBrowserE2eScenarios,
} from './browserE2eScenarios'

declare const process: {
  env: Record<string, string | undefined>
  exit(code?: number): never
}

export interface BrowserE2eContractRunResult {
  ok: boolean
  scenarioCount: number
  scenarioIds: string[]
  errors: string[]
}

export function runBrowserE2eContractCheck(): BrowserE2eContractRunResult {
  const errors = validateBrowserE2eScenarios()
  return {
    ok: errors.length === 0,
    scenarioCount: BROWSER_E2E_SCENARIOS.length,
    scenarioIds: BROWSER_E2E_SCENARIOS.map((scenario) => scenario.id),
    errors,
  }
}

export function browserE2eContractPayload() {
  const result = runBrowserE2eContractCheck()
  return {
    ...result,
    scenarios: BROWSER_E2E_SCENARIOS.map((scenario) => ({
      id: scenario.id,
      title: scenario.title,
      path: scenario.path,
      mustContainText: scenario.mustContainText,
      forbiddenConsoleLevels: scenario.forbiddenConsoleLevels,
      renderEntityAssertions: scenario.renderEntityAssertions ?? null,
      renderEntityMinimums: scenario.renderEntityMinimums ?? null,
      interaction: scenario.interaction ?? null,
    })),
  }
}

if (process.env.BROWSER_E2E_CONTRACT_CLI === '1') {
  const payload = browserE2eContractPayload()
  console.log(JSON.stringify(payload, null, 2))
  if (!payload.ok) process.exit(1)
}
