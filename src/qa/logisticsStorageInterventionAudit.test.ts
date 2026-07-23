import { describe, expect, it } from 'vitest'
import { createInitialSimulationSnapshot } from '../simulation/core/snapshot'
import type { LogisticsStorageInterventionRecord } from '../simulation/contracts'
import {
  auditLogisticsStorageInterventions,
  formatLogisticsStorageInterventionAudit,
} from './logisticsStorageInterventionAudit'

const record = (overrides: Partial<LogisticsStorageInterventionRecord> = {}): LogisticsStorageInterventionRecord => ({
  eventId: 'storage-event-1',
  buildingId: 'granary-1',
  buildingType: 'granary',
  tick: 42,
  orderIds: ['order-1'],
  ordersReset: 1,
  carriersReleased: 1,
  queuesCleared: 2,
  ...overrides,
})

describe('logistics storage intervention audit', () => {
  it('aggregates valid persisted intervention history', () => {
    const snapshot = createInitialSimulationSnapshot({
      buildings: {
        'granary-1': {
          id: 'granary-1', type: 'granary', origin: { x: 1, y: 1 }, rotation: 0,
          level: 1, entrance: { x: 1, y: 2 }, status: 'idle', workers: [], inventory: {}, productionProgress: 0,
        },
      },
    })
    snapshot.logisticsStorageInterventionHistory = [record(), record({
      eventId: 'storage-event-2', tick: 80, ordersReset: 2, carriersReleased: 0, queuesCleared: 1,
    })]
    expect(auditLogisticsStorageInterventions(snapshot)).toMatchObject({
      recordCount: 2, archivedRecordCount: 0, totalRecordCount: 2, totalOrdersReset: 3, totalCarriersReleased: 1, totalQueuesCleared: 3, lastTick: 80, valid: true,
    })
  })

  it('rejects duplicate events and missing buildings', () => {
    const snapshot = createInitialSimulationSnapshot()
    snapshot.logisticsStorageInterventionHistory = [record(), record({ buildingId: 'missing' })]
    const audit = auditLogisticsStorageInterventions(snapshot)
    expect(audit.valid).toBe(false)
    expect(audit.errors).toEqual(expect.arrayContaining([
      '记录2 eventId 重复或为空',
      '记录2 建筑不存在：missing',
    ]))
  })

  it('formats a compact operator report', () => {
    expect(formatLogisticsStorageInterventionAudit({
      recordCount: 1, archivedRecordCount: 2, totalRecordCount: 3, totalOrdersReset: 2, totalCarriersReleased: 1,
      totalQueuesCleared: 3, lastTick: 12, valid: true, errors: [],
    })).toBe('干预记录 1 · 已归档 2 · 重置订单 2 · 释放承运 1 · 清理队列 3 · 最后刻 12 · 状态 有效')
  })

  it('includes bounded-history archive totals in the audit', () => {
    const snapshot = createInitialSimulationSnapshot()
    snapshot.logisticsStorageInterventionArchive = {
      archivedRecords: 201,
      ordersReset: 20,
      carriersReleased: 12,
      queuesCleared: 8,
      lastTick: 900,
    }
    const audit = auditLogisticsStorageInterventions(snapshot)
    expect(audit).toMatchObject({ archivedRecordCount: 201, totalRecordCount: 201, totalOrdersReset: 20, lastTick: 900, valid: true })
  })
})
