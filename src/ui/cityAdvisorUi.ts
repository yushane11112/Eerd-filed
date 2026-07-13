import type { StageGovernanceRecommendation } from '../integration/stageAdvisor'
import type { LogisticsUnloadCapacityBreakdown } from '../simulation/contracts'

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
