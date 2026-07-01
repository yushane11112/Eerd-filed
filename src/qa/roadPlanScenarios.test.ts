import { describe, expect, it } from 'vitest'
import { runRoadPlanQaScenarios } from './roadPlanScenarios'

describe('road plan QA scenarios', () => {
  it('reports success and low-treasury failure scenarios with auditable outcomes', () => {
    expect(runRoadPlanQaScenarios()).toEqual([
      {
        id: 'isolated-road-network',
        title: '孤立路网补线成功',
        before: {
          disconnectedEntrances: 1,
          isolatedRoadNetworks: 2,
          treasury: 2400,
          roadPlanCost: 6,
          missingTreasury: 0,
          canAfford: true,
        },
        action: {
          ok: true,
          message: '补线施工完成：铺设道路 1 格，花费银两6。',
        },
        after: {
          disconnectedEntrances: 0,
          isolatedRoadNetworks: 0,
          treasury: 2394,
        },
      },
      {
        id: 'isolated-road-network-low-treasury',
        title: '孤立路网补线财政不足',
        before: {
          disconnectedEntrances: 1,
          isolatedRoadNetworks: 2,
          treasury: 4,
          roadPlanCost: 6,
          missingTreasury: 2,
          canAfford: false,
        },
        action: {
          ok: false,
          message: '银两不足2，无法执行补线施工。',
        },
        after: {
          disconnectedEntrances: 1,
          isolatedRoadNetworks: 2,
          treasury: 4,
        },
      },
    ])
  })
})
