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
      'logistics-storage-build',
      'logistics-source-shortage',
      'service-governance',
      'civilization-resident-timeline',
      'civilization-scale',
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
          expectToastText: '粮仓已作为物流缓冲落成',
        },
      }),
      expect.objectContaining({
        id: 'logistics-storage-build',
        path: '/?debugScenario=logistics-storage-build',
        mustContainText: expect.arrayContaining(['物流热点拥堵', '分流卸货压力', '执行计划：分流卸货口', '每刻卸货 2 单']),
        forbiddenConsoleLevels: ['error'],
        interaction: {
          clickText: '分流卸货压力',
          expectToastText: '粮仓已作为物流缓冲落成',
          expectVisibleText: '建成后的物流变化',
        },
      }),
      expect.objectContaining({
        id: 'logistics-source-shortage',
        path: '/?debugScenario=logistics-source-shortage',
        mustContainText: expect.arrayContaining(['物流热点拥堵', '检查来源库存', '执行计划：定位货源库存']),
        forbiddenConsoleLevels: ['error'],
        interaction: {
          clickText: '检查来源库存',
          expectToastText: '已定位到「粮仓」。',
          expectVisibleText: '物流执行计划：来源库存',
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
      expect.objectContaining({
        id: 'civilization-resident-timeline',
        path: '/?debugScenario=civilization-resident-timeline&renderProfile=1',
        mustContainText: expect.arrayContaining(['城市运行', '居民生活', '就业', '居民状态：', '外来家庭', '候选家庭']),
      }),
    ]))
  })

  it('provides stable lookup for command line runners', () => {
    expect(browserE2eScenarioById('logistics-hotspot')).toMatchObject({
      id: 'logistics-hotspot',
      path: '/?debugScenario=logistics-hotspot',
    })
    expect(browserE2eScenarioById('logistics-storage-build')).toMatchObject({
      id: 'logistics-storage-build',
      path: '/?debugScenario=logistics-storage-build',
    })
    expect(browserE2eScenarioById('missing')).toBeUndefined()
  })

  it('keeps the civilization-scale baseline on the authored render path', () => {
    expect(browserE2eScenarioById('civilization-scale')).toMatchObject({
      path: '/?debugScenario=civilization-scale&renderProfile=1',
    })
    expect(browserE2eScenarioById('civilization-scale')?.path).not.toContain('disableArtwork=1')
    expect(browserE2eScenarioById('civilization-scale')?.path).not.toContain('disableAnimation=1')
    expect(browserE2eScenarioById('civilization-scale')?.path).not.toContain('disableTerrain=1')
    expect(browserE2eScenarioById('civilization-scale')?.path).not.toContain('disableBuildingLod=1')
    expect(browserE2eScenarioById('civilization-scale')?.renderEntityMinimums).toMatchObject({
      detailedBuildings: 1,
    })
    expect(browserE2eScenarioById('civilization-scale')?.conditionalRenderEntityMinimums).toContainEqual({
      when: { buildingLod: true },
      minimums: { reducedBuildings: 1 },
    })
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
        expectToastText: '粮仓已作为物流缓冲落成',
      },
    })
    expect(browserE2eScenarioById('logistics-storage-build')).toMatchObject({
      interaction: {
        clickText: '分流卸货压力',
        expectToastText: '粮仓已作为物流缓冲落成',
        expectVisibleText: '建成后的物流变化',
      },
    })
    expect(browserE2eScenarioById('logistics-source-shortage')).toMatchObject({
      interaction: {
        clickText: '检查来源库存',
        expectToastText: '已定位到「粮仓」。',
        expectVisibleText: '物流执行计划：来源库存',
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
          expectToastText: '粮仓已作为物流缓冲落成',
        },
      }),
      expect.objectContaining({
        id: 'logistics-storage-build',
        interaction: {
          clickText: '分流卸货压力',
          expectToastText: '粮仓已作为物流缓冲落成',
          expectVisibleText: '建成后的物流变化',
        },
      }),
      expect.objectContaining({
        id: 'logistics-source-shortage',
        interaction: {
          clickText: '检查来源库存',
          expectToastText: '已定位到「粮仓」。',
          expectVisibleText: '物流执行计划：来源库存',
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
