import { describe, expect, it } from 'vitest'
import { runBridgeGapQaScenarios } from './bridgeGapScenarios'

describe('bridge gap QA scenarios', () => {
  it('builds bridge cells when a water gap splits the road network', () => {
    const scenarios = runBridgeGapQaScenarios()

    expect(scenarios).toEqual([
      {
        id: 'bridge-gap',
        title: '水面断点补桥成功',
        before: {
          disconnectedEntrances: expect.any(Number),
          isolatedRoadNetworks: expect.any(Number),
          treasury: 2400,
          roadCells: 0,
          bridgeCells: 2,
          roadPlanCost: 36,
          missingTreasury: 0,
          canAfford: true,
        },
        action: {
          ok: true,
          message: '补线施工完成：桥梁 2 格，花费银两36。',
        },
        after: {
          disconnectedEntrances: expect.any(Number),
          isolatedRoadNetworks: expect.any(Number),
          treasury: 2364,
        },
      },
    ])
    expect(scenarios[0].before.isolatedRoadNetworks).toBeGreaterThan(0)
    expect(scenarios[0].after.isolatedRoadNetworks)
      .toBeLessThan(scenarios[0].before.isolatedRoadNetworks)
  })
})
