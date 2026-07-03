export type BrowserConsoleLevel = 'error' | 'warning'

export interface BrowserE2eScenario {
  id: string
  title: string
  path: string
  mustContainText: string[]
  forbiddenConsoleLevels: BrowserConsoleLevel[]
  interaction?: {
    clickText: string
    expectToastText: string
  }
}

export const BROWSER_E2E_SCENARIOS: BrowserE2eScenario[] = [
  {
    id: 'road-plan-success',
    title: '道路补线成功浏览器场景',
    path: '/?debugScenario=isolated-road-network',
    mustContainText: ['道路未连通', '补线计划'],
    forbiddenConsoleLevels: ['error'],
    interaction: {
      clickText: '打开道路图层并接回主路网',
      expectToastText: '补线施工完成',
    },
  },
  {
    id: 'road-plan-low-treasury',
    title: '补线财政不足浏览器场景',
    path: '/?debugScenario=isolated-road-network-low-treasury',
    mustContainText: ['道路未连通', '还缺银两'],
    forbiddenConsoleLevels: ['error'],
    interaction: {
      clickText: '打开道路图层并接回主路网',
      expectToastText: '银两不足2，无法执行补线施工',
    },
  },
  {
    id: 'bridge-gap',
    title: '桥梁缺口浏览器场景',
    path: '/?debugScenario=bridge-gap',
    mustContainText: ['道路未连通', '桥梁 2 格'],
    forbiddenConsoleLevels: ['error'],
    interaction: {
      clickText: '打开道路图层并接回主路网',
      expectToastText: '道路未连通：补线施工完成：桥梁 2 格，花费银两36。',
    },
  },
  {
    id: 'logistics-hotspot',
    title: '物流热点浏览器场景',
    path: '/?debugScenario=logistics-hotspot',
    mustContainText: ['物流热点拥堵', '当前有 3 条未完成订单'],
    forbiddenConsoleLevels: ['error'],
  },
  {
    id: 'service-governance',
    title: '服务治理浏览器场景',
    path: '/',
    mustContainText: ['服务覆盖缺口', '打开服务图层并营造市场'],
    forbiddenConsoleLevels: ['error'],
    interaction: {
      clickText: '打开服务图层并营造市场',
      expectToastText: '服务覆盖缺口：打开服务图层并营造市场。',
    },
  },
]

export function browserE2eScenarioById(id: string): BrowserE2eScenario | undefined {
  return BROWSER_E2E_SCENARIOS.find((scenario) => scenario.id === id)
}

export function validateBrowserE2eScenarios(
  scenarios: ReadonlyArray<BrowserE2eScenario> = BROWSER_E2E_SCENARIOS,
): string[] {
  const errors: string[] = []
  const ids = new Set<string>()

  for (const scenario of scenarios) {
    if (!scenario.id.trim()) errors.push('Scenario id is required')
    if (ids.has(scenario.id)) errors.push(`Duplicate scenario id: ${scenario.id}`)
    ids.add(scenario.id)
    if (!scenario.title.trim()) errors.push(`Scenario ${scenario.id} title is required`)
    if (!scenario.path.startsWith('/')) errors.push(`Scenario ${scenario.id} path must start with /`)
    if (scenario.mustContainText.length === 0) {
      errors.push(`Scenario ${scenario.id} must declare visible text assertions`)
    }
    for (const text of scenario.mustContainText) {
      if (!text.trim()) errors.push(`Scenario ${scenario.id} contains an empty text assertion`)
    }
    if (!scenario.forbiddenConsoleLevels.includes('error')) {
      errors.push(`Scenario ${scenario.id} must fail on console errors`)
    }
    if (scenario.interaction) {
      if (!scenario.interaction.clickText.trim()) {
        errors.push(`Scenario ${scenario.id} interaction clickText is required`)
      }
      if (!scenario.interaction.expectToastText.trim()) {
        errors.push(`Scenario ${scenario.id} interaction expectToastText is required`)
      }
    }
  }

  return errors
}
