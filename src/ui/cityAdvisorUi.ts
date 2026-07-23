import type { StageGovernanceRecommendation } from '../integration/stageAdvisor'
import type {
  LogisticsStorageIntervention,
  LogisticsStorageInterventionArchive,
  LogisticsStorageInterventionRecord,
  LogisticsUnloadCapacityBreakdown,
  CityTimelineRecord,
  CityTimelineResidentProfile,
} from '../simulation/contracts'

export function formatRoadPlanSummary(
  roadPlan: NonNullable<StageGovernanceRecommendation['roadPlan']>,
): string {
  const parts = [
    roadPlan.roadCells > 0 ? `道路 ${roadPlan.roadCells} 格` : '',
    roadPlan.bridgeCells > 0 ? `桥梁 ${roadPlan.bridgeCells} 格` : '',
  ].filter(Boolean)
  const scope = parts.length > 0 ? parts.join('、') : '无需新增道路'
  const affordability = roadPlan.canAfford
    ? '可直接施工'
    : `还缺银两 ${roadPlan.missingTreasury}`
  return `补线计划：${scope}，预计银两 ${roadPlan.treasuryCost}，${affordability}。`
}

export interface LogisticsInventoryPanelCopyInput {
  role: 'source' | 'destination' | 'focus'
  resource?: string
  resourceLabel?: string
  stock?: number
  orderCount: number
  busyCarriers: number
  waitingOrders: number
  unloadQueue?: {
    capacityPerTick: number
    waitingToUnloadCount: number
    longestWaitTicks: number
    breakdown?: LogisticsUnloadCapacityBreakdown
  }
}

export interface LogisticsInventoryPanelCopy {
  title: string
  inventory: string
  dispatch: string
  unload?: string
}

export function formatLogisticsInventoryPanelCopy(
  input: LogisticsInventoryPanelCopyInput,
): LogisticsInventoryPanelCopy {
  const roleLabel = input.role === 'source'
    ? '来源库存'
    : input.role === 'destination'
      ? '目的库存'
      : '相关库存'
  const resource = input.resourceLabel ?? input.resource ?? '相关货物'
  const stock = typeof input.stock === 'number' ? input.stock : 0
  const unload = input.unloadQueue
    ? formatUnloadCapacityCopy(input.unloadQueue)
    : undefined
  return {
    title: `物流执行计划：${roleLabel}`,
    inventory: `${resource}库存 ${stock}，关联订单 ${input.orderCount} 单。`,
    dispatch: `承运调度：忙碌 ${input.busyCarriers}，待派 ${input.waitingOrders}。`,
    ...(unload ? { unload } : {}),
  }
}

export function formatUnloadCapacityCopy(
  queue: NonNullable<LogisticsInventoryPanelCopyInput['unloadQueue']>,
): string {
  const wait = queue.longestWaitTicks > 0 ? `，最长等待 ${queue.longestWaitTicks} 刻` : ''
  if (!queue.breakdown) {
    return `卸货口：每刻 ${queue.capacityPerTick} 单，排队 ${queue.waitingToUnloadCount} 单${wait}。`
  }
  if (queue.breakdown.source === 'override') {
    return `卸货口：每刻 ${queue.capacityPerTick} 单，排队 ${queue.waitingToUnloadCount} 单${wait}；当前为 QA/压力场景固定能力。`
  }
  const parts = [
    `基础 ${queue.breakdown.base}`,
    queue.breakdown.levelBonus > 0 ? `等级 +${queue.breakdown.levelBonus}` : '',
    queue.breakdown.workerBonus > 0 ? `工人 +${queue.breakdown.workerBonus}` : '',
    queue.breakdown.entranceBonus > 0 ? `入口道路 +${queue.breakdown.entranceBonus}` : '',
  ].filter(Boolean)
  return [
    `卸货口：每刻 ${queue.capacityPerTick} 单，排队 ${queue.waitingToUnloadCount} 单${wait}`,
    `来源 ${parts.join('、')}`,
    `邻路 ${queue.breakdown.roadAccess} 格，工人 ${queue.breakdown.workerCount} 人，上限 ${queue.breakdown.cappedAt}`,
  ].join('；') + '。'
}

export function formatLogisticsStorageOutcome(
  outcome: LogisticsStorageIntervention,
): string {
  return `建成后已重置 ${outcome.ordersReset} 条订单、释放 ${outcome.carriersReleased} 名承运人，并清理 ${outcome.queuesCleared} 个卸货队列；订单将重新等待分流。`
}

export function formatLogisticsStorageHistory(
  records: readonly LogisticsStorageInterventionRecord[],
): string {
  const totals = records.reduce((summary, record) => ({
    ordersReset: summary.ordersReset + record.ordersReset,
    carriersReleased: summary.carriersReleased + record.carriersReleased,
    queuesCleared: summary.queuesCleared + record.queuesCleared,
  }), { ordersReset: 0, carriersReleased: 0, queuesCleared: 0 })
  return `历史干预 ${records.length} 次 · 重置订单 ${totals.ordersReset} · 释放承运 ${totals.carriersReleased} · 清理队列 ${totals.queuesCleared}`
}

export function formatLogisticsStorageArchive(
  archive: LogisticsStorageInterventionArchive | undefined,
  recentRecordCount: number,
): string {
  const archivedRecords = archive?.archivedRecords ?? 0
  const ordersReset = archive?.ordersReset ?? 0
  const carriersReleased = archive?.carriersReleased ?? 0
  const queuesCleared = archive?.queuesCleared ?? 0
  return `物流干预存档 · 近期明细 ${recentRecordCount} 条 · 已归档 ${archivedRecords} 条 · 累计重置订单 ${ordersReset} · 释放承运 ${carriersReleased} · 清理队列 ${queuesCleared}`
}

export function formatLogisticsStorageTimelineRecord(
  record: LogisticsStorageInterventionRecord,
  buildingLabel: string,
): string {
  return `第 ${record.tick} 刻 · ${buildingLabel} · 重置 ${record.ordersReset} 单 · 释放承运 ${record.carriersReleased} 人 · 清理队列 ${record.queuesCleared}`
}

export function formatCityTimelineRecord(record: CityTimelineRecord): string {
  const kind = ({
    service: '服务',
    population: '人口',
    finance: '财政',
    labor: '劳务',
    operations: '运行',
  } as Record<CityTimelineRecord['kind'], string>)[record.kind]
  return `第 ${record.tick} 刻 · ${kind} · ${record.title}`
}

export function formatCityTimelineResidentProfile(profile: CityTimelineResidentProfile): string {
  const occupation = profile.occupations.length > 0 ? profile.occupations.join('、') : '无职业记录'
  const satisfaction = profile.satisfaction === undefined ? '' : ` · 满意度 ${profile.satisfaction}`
  return `${profile.origin} ${profile.members} 人 · 劳动力 ${profile.employedCount}/${profile.workerCount} 已就业 · ${occupation}${satisfaction}`
}

export function formatServiceRecoveryRecord(record: CityTimelineRecord): string {
  return `第 ${record.tick} 刻 · ${record.detail}`
}
