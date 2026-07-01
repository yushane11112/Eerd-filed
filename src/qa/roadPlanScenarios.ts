import type { RuntimeDebugScenario } from '../integration/GameRuntime'
import { GameRuntime } from '../integration/GameRuntime'
import { deriveStageGovernanceCards, deriveStageMapOverlay } from '../integration/stageAdvisor'

export interface RoadPlanQaScenarioSummary {
  id: RuntimeDebugScenario
  title: string
  before: {
    disconnectedEntrances: number
    isolatedRoadNetworks: number
    treasury: number
    roadPlanCost: number
    missingTreasury: number
    canAfford: boolean
  }
  action: {
    ok: boolean
    message: string
  }
  after: {
    disconnectedEntrances: number
    isolatedRoadNetworks: number
    treasury: number
  }
}

const ROAD_PLAN_QA_SCENARIOS: Array<{
  id: RuntimeDebugScenario
  title: string
}> = [
  { id: 'isolated-road-network', title: '孤立路网补线成功' },
  { id: 'isolated-road-network-low-treasury', title: '孤立路网补线财政不足' },
]

export function runRoadPlanQaScenarios(): RoadPlanQaScenarioSummary[] {
  return ROAD_PLAN_QA_SCENARIOS.map(({ id, title }) => {
    const runtime = new GameRuntime({ debugScenario: id })
    const roadCard = deriveStageGovernanceCards(runtime.getSnapshot())
      .find((card) => card.id === 'governance-road-disconnected')
    const roadPlan = roadCard?.recommendation.roadPlan
    if (!roadPlan) {
      throw new Error(`Scenario ${id} did not produce a roadPlan`)
    }

    const beforeMetrics = roadMetrics(runtime)
    const action = runtime.buildRoadPlan({
      cells: roadPlan.cells.map((cell) => ({
        point: cell.point,
        kind: cell.kind,
      })),
    })
    const afterMetrics = roadMetrics(runtime)

    return {
      id,
      title,
      before: {
        disconnectedEntrances: beforeMetrics.disconnectedEntrances,
        isolatedRoadNetworks: beforeMetrics.isolatedRoadNetworks,
        treasury: beforeMetrics.treasury,
        roadPlanCost: roadPlan.treasuryCost,
        missingTreasury: roadPlan.missingTreasury,
        canAfford: roadPlan.canAfford,
      },
      action: {
        ok: action.ok,
        message: action.message,
      },
      after: {
        disconnectedEntrances: afterMetrics.disconnectedEntrances,
        isolatedRoadNetworks: afterMetrics.isolatedRoadNetworks,
        treasury: afterMetrics.treasury,
      },
    }
  })
}

function roadMetrics(runtime: GameRuntime): {
  disconnectedEntrances: number
  isolatedRoadNetworks: number
  treasury: number
} {
  const snapshot = runtime.getSnapshot()
  const metrics = deriveStageMapOverlay('roads', snapshot)?.metrics ?? {}
  return {
    disconnectedEntrances: metrics.disconnectedEntrances ?? 0,
    isolatedRoadNetworks: metrics.isolatedRoadNetworks ?? 0,
    treasury: snapshot.economy.treasury,
  }
}
