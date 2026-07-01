import type { LogisticsOrder } from '../simulation/contracts'
import type { RuntimeDebugScenario } from '../integration/GameRuntime'
import { GameRuntime } from '../integration/GameRuntime'
import { deriveStageGovernanceCards, deriveStageMapOverlay } from '../integration/stageAdvisor'

export interface LogisticsHotspotQaScenarioSummary {
  id: RuntimeDebugScenario
  title: string
  before: {
    activeOrders: number
    hotspots: number
    targetLabel?: string
    targetPoint?: { x: number; y: number }
    recommendedBuilding?: string
    recommendationTool?: string
  }
  orders: Array<Pick<LogisticsOrder, 'id' | 'resource' | 'destinationBuildingId' | 'state'>>
}

const LOGISTICS_HOTSPOT_QA_SCENARIOS: Array<{
  id: RuntimeDebugScenario
  title: string
}> = [
  { id: 'logistics-hotspot', title: '市场入货物流热点' },
]

export function runLogisticsHotspotQaScenarios(): LogisticsHotspotQaScenarioSummary[] {
  return LOGISTICS_HOTSPOT_QA_SCENARIOS.map(({ id, title }) => {
    const runtime = new GameRuntime({ debugScenario: id })
    const snapshot = runtime.getSnapshot()
    const overlay = deriveStageMapOverlay('logistics', snapshot)
    const card = deriveStageGovernanceCards(snapshot)
      .find((item) => item.id === 'governance-logistics-hotspots')
    if (!card) {
      throw new Error(`Scenario ${id} did not produce a logistics governance card`)
    }

    return {
      id,
      title,
      before: {
        activeOrders: overlay?.metrics?.activeOrders ?? 0,
        hotspots: overlay?.metrics?.hotspots ?? 0,
        targetLabel: card.target?.label,
        targetPoint: card.target?.point,
        recommendedBuilding: card.recommendation.buildingType,
        recommendationTool: card.recommendation.tool,
      },
      orders: Object.values(snapshot.logisticsOrders)
        .sort((left, right) => right.priority - left.priority || left.id.localeCompare(right.id))
        .map((order) => ({
          id: order.id,
          resource: order.resource,
          destinationBuildingId: order.destinationBuildingId,
          state: order.state,
        })),
    }
  })
}
