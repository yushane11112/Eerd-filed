import type {
  LogisticsStorageInterventionArchive,
  LogisticsStorageInterventionRecord,
} from '../contracts'

export const MAX_LOGISTICS_STORAGE_HISTORY = 200

export function appendLogisticsStorageIntervention(
  history: readonly LogisticsStorageInterventionRecord[],
  archive: LogisticsStorageInterventionArchive | undefined,
  record: LogisticsStorageInterventionRecord,
): {
  history: LogisticsStorageInterventionRecord[]
  archive: LogisticsStorageInterventionArchive
} {
  const next = [...history, record]
  const archiveState = archive ?? {
    archivedRecords: 0,
    ordersReset: 0,
    carriersReleased: 0,
    queuesCleared: 0,
    lastTick: 0,
  }
  const archiveCount = Math.max(0, next.length - MAX_LOGISTICS_STORAGE_HISTORY)
  for (const archivedRecord of next.slice(0, archiveCount)) {
    archiveState.archivedRecords += 1
    archiveState.ordersReset += archivedRecord.ordersReset
    archiveState.carriersReleased += archivedRecord.carriersReleased
    archiveState.queuesCleared += archivedRecord.queuesCleared
    archiveState.lastTick = Math.max(archiveState.lastTick, archivedRecord.tick)
  }
  return {
    history: next.slice(-MAX_LOGISTICS_STORAGE_HISTORY),
    archive: archiveState,
  }
}
