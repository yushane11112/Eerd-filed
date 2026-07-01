import { describe, expect, it } from 'vitest'
import {
  BROWSER_E2E_SCENARIOS,
  browserE2eScenarioById,
  validateBrowserE2eScenarios,
} from './browserE2eScenarios'

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
      }),
      expect.objectContaining({
        id: 'bridge-gap',
        path: '/?debugScenario=bridge-gap',
        mustContainText: expect.arrayContaining(['道路未连通', '桥梁 2 格']),
        forbiddenConsoleLevels: ['error'],
      }),
      expect.objectContaining({
        id: 'logistics-hotspot',
        path: '/?debugScenario=logistics-hotspot',
        mustContainText: expect.arrayContaining(['物流热点拥堵', '物流热点x3']),
        forbiddenConsoleLevels: ['error'],
      }),
      expect.objectContaining({
        id: 'service-governance',
        path: '/',
        mustContainText: expect.arrayContaining(['服务覆盖缺口', '打开服务图层并营造市场']),
        forbiddenConsoleLevels: ['error'],
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
})
