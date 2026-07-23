import { describe, expect, it } from 'vitest'
import { formatCityTimelineRecord, formatCityTimelineResidentProfile, formatLogisticsInventoryPanelCopy, formatLogisticsStorageArchive, formatLogisticsStorageHistory, formatLogisticsStorageOutcome, formatLogisticsStorageTimelineRecord, formatRoadPlanSummary, formatServiceRecoveryRecord } from './cityAdvisorUi'

describe('city advisor UI copy', () => {
  it('formats service recovery records for governance and building details', () => {
    expect(formatServiceRecoveryRecord({
      id: 'recovery-1',
      tick: 24,
      kind: 'service',
      source: 'service-bottleneck-cleared',
      title: '服务瓶颈解除',
      detail: '药铺恢复医疗服务，1 户居民压力清除，最长持续 4 刻。',
    })).toBe('第 24 刻 · 药铺恢复医疗服务，1 户居民压力清除，最长持续 4 刻。')
  })

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

  it('explains the persistent result of building a logistics buffer', () => {
    expect(formatLogisticsStorageOutcome({
      tick: 42,
      ordersReset: 3,
      carriersReleased: 2,
      queuesCleared: 1,
    })).toBe('建成后已重置 3 条订单、释放 2 名承运人，并清理 1 个卸货队列；订单将重新等待分流。')
  })

  it('summarizes multiple persisted logistics interventions', () => {
    expect(formatLogisticsStorageHistory([
      { eventId: 'a', buildingId: 'granary-1', buildingType: 'granary', tick: 10, orderIds: ['o1'], ordersReset: 2, carriersReleased: 1, queuesCleared: 1 },
      { eventId: 'b', buildingId: 'granary-2', buildingType: 'granary', tick: 20, orderIds: ['o2'], ordersReset: 1, carriersReleased: 2, queuesCleared: 0 },
    ])).toBe('历史干预 2 次 · 重置订单 3 · 释放承运 3 · 清理队列 1')
  })

  it('summarizes recent and archived logistics interventions for city management', () => {
    expect(formatLogisticsStorageArchive({
      archivedRecords: 203,
      ordersReset: 812,
      carriersReleased: 390,
      queuesCleared: 203,
      lastTick: 4800,
    }, 200)).toBe(
      '物流干预存档 · 近期明细 200 条 · 已归档 203 条 · 累计重置订单 812 · 释放承运 390 · 清理队列 203',
    )
  })

  it('formats a clickable logistics governance timeline entry', () => {
    expect(formatLogisticsStorageTimelineRecord({
      eventId: 'event-7',
      buildingId: 'granary-1',
      buildingType: 'granary',
      tick: 720,
      orderIds: ['order-1'],
      ordersReset: 2,
      carriersReleased: 1,
      queuesCleared: 1,
    }, '南仓')).toBe('第 720 刻 · 南仓 · 重置 2 单 · 释放承运 1 人 · 清理队列 1')
  })

  it('labels city timeline records by civilization system', () => {
    expect(formatCityTimelineRecord({
      id: 'city-12-0-purchase-completed',
      tick: 12,
      kind: 'finance',
      source: 'purchase-completed',
      title: '市场交易完成',
      detail: '东市售出粮食×2，税收 +3。',
      buildingId: 'market-1',
    })).toBe('第 12 刻 · 财政 · 市场交易完成')
  })

  it('shows the resident identity and employment transition in the timeline', () => {
    expect(formatCityTimelineResidentProfile({
      phase: 'settled',
      origin: '外来家庭',
      members: 4,
      workerCount: 2,
      employedCount: 1,
      occupations: ['木作坊', '待业'],
      satisfaction: 86,
    })).toBe('外来家庭 4 人 · 劳动力 1/2 已就业 · 木作坊、待业 · 满意度 86')
  })
})
