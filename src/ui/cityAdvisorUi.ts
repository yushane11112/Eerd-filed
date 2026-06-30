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
