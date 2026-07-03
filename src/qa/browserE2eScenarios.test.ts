import { describe, expect, it } from 'vitest'
import {
  BROWSER_E2E_SCENARIOS,
  browserE2eScenarioById,
  validateBrowserE2eScenarios,
} from './browserE2eScenarios'
import { browserE2eContractPayload } from './browserE2eRunner'

describe('browser E2E scenario contract', () => {
  it('covers every fixed governance debug scenario with URL and visible assertions', () => {
    expect(validateBrowserE2eScenarios()).toEqual([])
    expect(BROWSER_E2E_SCENARIOS.map((scenario) => scenario.id)).toEqual([
      'road-plan-success',
      'road-plan-low-treasury',
      'bridge-gap',
      'logistics-hotspot',
      'service-governance',
    ])
    expect(BROWSER_E2E_SCENARIOS).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'road-plan-success',
        path: '/?debugScenario=isolated-road-network',
        mustContainText: expect.arrayContaining(['道路未连通', '补线计划']),
        forbiddenConsoleLevels: ['error'],
      }),
      expect.objectContaining({
        id: 'road-plan-low-treasury',
        path: '/?debugScenario=isolated-road-network-low-treasury',
        mustContainText: expect.arrayContaining(['道路未连通', '还缺银两']),
        forbiddenConsoleLevels: ['error'],
        interaction: {
          clickText: '打开道路图层并接回主路网',
          expectToastText: '银两不足2，无法执行补线施工',
        },
      }),
      expect.objectContaining({
        id: 'bridge-gap',
        path: '/?debugScenario=bridge-gap',
        mustContainText: expect.arrayContaining(['道路未连通', '桥梁 2 格']),
        forbiddenConsoleLevels: ['error'],
        interaction: {
          clickText: '打开道路图层并接回主路网',
          expectToastText: '道路未连通：补线施工完成：桥梁 2 格，花费银两36。',
        },
      }),
      expect.objectContaining({
        id: 'logistics-hotspot',
        path: '/?debugScenario=logistics-hotspot',
        mustContainText: expect.arrayContaining(['物流热点拥堵', '当前有 3 条未完成订单']),
        forbiddenConsoleLevels: ['error'],
        interaction: {
          clickText: '打开物流图层并补仓储',
          expectToastText: '物流热点拥堵：打开物流图层并补仓储。',
        },
      }),
      expect.objectContaining({
        id: 'service-governance',
        path: '/',
        mustContainText: expect.arrayContaining(['服务覆盖缺口', '打开服务图层并营造市场']),
        forbiddenConsoleLevels: ['error'],
        interaction: {
          clickText: '打开服务图层并营造市场',
          expectToastText: '服务覆盖缺口：打开服务图层并营造市场。',
        },
      }),
    ]))
  })

  it('provides stable lookup for command line runners', () => {
    expect(browserE2eScenarioById('logistics-hotspot')).toMatchObject({
      id: 'logistics-hotspot',
      path: '/?debugScenario=logistics-hotspot',
    })
    expect(browserE2eScenarioById('missing')).toBeUndefined()
  })

  it('declares at least one real browser interaction instead of only page text checks', () => {
    expect(BROWSER_E2E_SCENARIOS.some((scenario) => scenario.interaction)).toBe(true)
    expect(browserE2eScenarioById('road-plan-success')).toMatchObject({
      interaction: {
        clickText: '打开道路图层并接回主路网',
        expectToastText: '补线施工完成',
      },
    })
    expect(browserE2eScenarioById('road-plan-low-treasury')).toMatchObject({
      interaction: {
        clickText: '打开道路图层并接回主路网',
        expectToastText: '银两不足2，无法执行补线施工',
      },
    })
    expect(browserE2eScenarioById('bridge-gap')).toMatchObject({
      interaction: {
        clickText: '打开道路图层并接回主路网',
        expectToastText: '道路未连通：补线施工完成：桥梁 2 格，花费银两36。',
      },
    })
    expect(browserE2eScenarioById('logistics-hotspot')).toMatchObject({
      interaction: {
        clickText: '打开物流图层并补仓储',
        expectToastText: '物流热点拥堵：打开物流图层并补仓储。',
      },
    })
    expect(browserE2eScenarioById('service-governance')).toMatchObject({
      interaction: {
        clickText: '打开服务图层并营造市场',
        expectToastText: '服务覆盖缺口：打开服务图层并营造市场。',
      },
    })
  })

  it('exports interaction metadata for real browser runners', () => {
    expect(browserE2eContractPayload().scenarios).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'road-plan-success',
        interaction: {
          clickText: '打开道路图层并接回主路网',
          expectToastText: '补线施工完成',
        },
      }),
      expect.objectContaining({
        id: 'road-plan-low-treasury',
        interaction: {
          clickText: '打开道路图层并接回主路网',
          expectToastText: '银两不足2，无法执行补线施工',
        },
      }),
      expect.objectContaining({
        id: 'bridge-gap',
        interaction: {
          clickText: '打开道路图层并接回主路网',
          expectToastText: '道路未连通：补线施工完成：桥梁 2 格，花费银两36。',
        },
      }),
      expect.objectContaining({
        id: 'logistics-hotspot',
        interaction: {
          clickText: '打开物流图层并补仓储',
          expectToastText: '物流热点拥堵：打开物流图层并补仓储。',
        },
      }),
      expect.objectContaining({
        id: 'service-governance',
        interaction: {
          clickText: '打开服务图层并营造市场',
          expectToastText: '服务覆盖缺口：打开服务图层并营造市场。',
        },
      }),
    ]))
  })
})
