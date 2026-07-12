import type { StageGovernanceRecommendation } from '../integration/stageAdvisor'

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
}

export function formatLogisticsInventoryPanelCopy(
  input: LogisticsInventoryPanelCopyInput,
): {
  title: string
  inventory: string
  dispatch: string
} {
  const roleLabel = input.role === 'source'
    ? '来源库存'
    : input.role === 'destination'
      ? '目的库存'
      : '相关库存'
  const resource = input.resourceLabel ?? input.resource ?? '相关货物'
  const stock = typeof input.stock === 'number' ? input.stock : 0
  return {
    title: `物流执行计划：${roleLabel}`,
    inventory: `${resource}库存 ${stock}，关联订单 ${input.orderCount} 单。`,
    dispatch: `承运调度：忙碌 ${input.busyCarriers}，待派 ${input.waitingOrders}。`,
  }
}
