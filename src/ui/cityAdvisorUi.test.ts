import { describe, expect, it } from 'vitest'
import { formatLogisticsInventoryPanelCopy, formatRoadPlanSummary } from './cityAdvisorUi'

describe('city advisor UI copy', () => {
  it('summarizes road and bridge construction plans for bottleneck cards', () => {
    expect(formatRoadPlanSummary({
      from: { x: 1, y: 1 },
      to: { x: 4, y: 1 },
      cells: [
        { point: { x: 2, y: 1 }, kind: 'bridge', treasuryCost: 18 },
        { point: { x: 3, y: 1 }, kind: 'bridge', treasuryCost: 18 },
      ],
      roadCells: 0,
      bridgeCells: 2,
      treasuryCost: 36,
      missingTreasury: 0,
      canAfford: true,
    })).toBe('补线计划：桥梁 2 格，预计银两 36，可直接施工。')
  })

  it('explains mixed road plans and treasury gaps', () => {
    expect(formatRoadPlanSummary({
      from: { x: 0, y: 0 },
      to: { x: 4, y: 0 },
      cells: [
        { point: { x: 1, y: 0 }, kind: 'stone', treasuryCost: 6 },
        { point: { x: 2, y: 0 }, kind: 'stone', treasuryCost: 6 },
        { point: { x: 3, y: 0 }, kind: 'bridge', treasuryCost: 18 },
      ],
      roadCells: 2,
      bridgeCells: 1,
      treasuryCost: 30,
      missingTreasury: 12,
      canAfford: false,
    })).toBe('补线计划：道路 2 格、桥梁 1 格，预计银两 30，还缺银两 12。')
  })

  it('summarizes logistics inventory and dispatch state for inspector panels', () => {
    expect(formatLogisticsInventoryPanelCopy({
      role: 'source',
      resource: 'food',
      resourceLabel: '粮食',
      stock: 12,
      orderCount: 3,
      busyCarriers: 2,
      waitingOrders: 1,
    })).toEqual({
      title: '物流执行计划：来源库存',
      inventory: '粮食库存 12，关联订单 3 单。',
      dispatch: '承运调度：忙碌 2，待派 1。',
    })
  })

  it('explains unload capacity sources when a destination is queued', () => {
    expect(formatLogisticsInventoryPanelCopy({
      role: 'destination',
      resource: 'food',
      resourceLabel: '粮食',
      stock: 6,
      orderCount: 4,
      busyCarriers: 4,
      waitingOrders: 0,
      unloadQueue: {
        capacityPerTick: 5,
        waitingToUnloadCount: 3,
        longestWaitTicks: 7,
        breakdown: {
          source: 'building',
          category: 'storage',
          base: 3,
          levelBonus: 1,
          workerBonus: 0,
          entranceBonus: 1,
          roadAccess: 2,
          workerCount: 5,
          cappedAt: 8,
          total: 5,
        },
      },
    })).toEqual({
      title: '物流执行计划：目的库存',
      inventory: '粮食库存 6，关联订单 4 单。',
      dispatch: '承运调度：忙碌 4，待派 0。',
      unload: '卸货口：每刻 5 单，排队 3 单，最长等待 7 刻；来源 基础 3、等级 +1、入口道路 +1；邻路 2 格，工人 5 人，上限 8。',
    })
  })
})
