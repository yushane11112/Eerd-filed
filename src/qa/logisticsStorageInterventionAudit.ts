import type { SimulationSnapshot, LogisticsStorageInterventionRecord } from '../simulation/contracts'

export interface LogisticsStorageInterventionAudit {
  recordCount: number
  archivedRecordCount: number
  totalRecordCount: number
  totalOrdersReset: number
  totalCarriersReleased: number
  totalQueuesCleared: number
  lastTick: number
  valid: boolean
  errors: string[]
}

export function auditLogisticsStorageInterventions(
  snapshot: Pick<SimulationSnapshot, 'buildings' | 'logisticsStorageInterventionHistory' | 'logisticsStorageInterventionArchive'>,
): LogisticsStorageInterventionAudit {
  const records = snapshot.logisticsStorageInterventionHistory ?? []
  const errors: string[] = []
  const eventIds = new Set<string>()
  let totalOrdersReset = 0
  let totalCarriersReleased = 0
  let totalQueuesCleared = 0
  let lastTick = 0

  records.forEach((record, index) => {
    validateRecord(record, index, snapshot.buildings, eventIds, errors)
    totalOrdersReset += record.ordersReset
    totalCarriersReleased += record.carriersReleased
    totalQueuesCleared += record.queuesCleared
    lastTick = Math.max(lastTick, record.tick)
  })
  const archive = snapshot.logisticsStorageInterventionArchive
  if (archive) {
    for (const [label, value] of [
      ['archivedRecords', archive.archivedRecords],
      ['ordersReset', archive.ordersReset],
      ['carriersReleased', archive.carriersReleased],
      ['queuesCleared', archive.queuesCleared],
      ['lastTick', archive.lastTick],
    ] as const) {
      if (!Number.isInteger(value) || value < 0) errors.push(`归档 ${label} 非法`)
    }
    if (archive.lastTick > lastTick) lastTick = archive.lastTick
  }
  const archivedRecordCount = archive?.archivedRecords ?? 0

  return {
    recordCount: records.length,
    archivedRecordCount,
    totalRecordCount: records.length + archivedRecordCount,
    totalOrdersReset: totalOrdersReset + (archive?.ordersReset ?? 0),
    totalCarriersReleased: totalCarriersReleased + (archive?.carriersReleased ?? 0),
    totalQueuesCleared: totalQueuesCleared + (archive?.queuesCleared ?? 0),
    lastTick,
    valid: errors.length === 0,
    errors,
  }
}

export function formatLogisticsStorageInterventionAudit(
  audit: LogisticsStorageInterventionAudit,
): string {
  return [
    `干预记录 ${audit.recordCount}`,
    audit.archivedRecordCount > 0 ? `已归档 ${audit.archivedRecordCount}` : '',
    `重置订单 ${audit.totalOrdersReset}`,
    `释放承运 ${audit.totalCarriersReleased}`,
    `清理队列 ${audit.totalQueuesCleared}`,
    `最后刻 ${audit.lastTick}`,
    audit.valid ? '状态 有效' : `状态 异常(${audit.errors.length})`,
  ].filter(Boolean).join(' · ')
}

function validateRecord(
  record: LogisticsStorageInterventionRecord,
  index: number,
  buildings: SimulationSnapshot['buildings'],
  eventIds: Set<string>,
  errors: string[],
) {
  if (!record.eventId || eventIds.has(record.eventId)) {
    errors.push(`记录${index + 1} eventId 重复或为空`)
  }
  eventIds.add(record.eventId)
  if (!buildings[record.buildingId]) errors.push(`记录${index + 1} 建筑不存在：${record.buildingId}`)
  if (!Number.isInteger(record.tick) || record.tick < 0) errors.push(`记录${index + 1} tick 非法`)
  for (const [label, value] of [
    ['ordersReset', record.ordersReset],
    ['carriersReleased', record.carriersReleased],
    ['queuesCleared', record.queuesCleared],
  ] as const) {
    if (!Number.isInteger(value) || value < 0) errors.push(`记录${index + 1} ${label} 非法`)
  }
  if (!Array.isArray(record.orderIds)) errors.push(`记录${index + 1} orderIds 非法`)
}
