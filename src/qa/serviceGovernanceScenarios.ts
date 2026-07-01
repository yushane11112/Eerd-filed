import type { ResourceKind } from '../simulation/contracts'
import { BUILDING_DEFINITIONS, GameRuntime } from '../integration/GameRuntime'
import { deriveStageGovernanceCards, deriveStageMapOverlay } from '../integration/stageAdvisor'
import { quoteBuildingConstruction } from '../simulation/economy'

export interface ServiceGovernanceQaScenarioSummary {
  id: string
  title: string
  before: {
    serviceGaps: number
    treasury: number
    recommendedBuilding?: string
    buildable: boolean
    constructionCost?: {
      treasury: number
      materials: Partial<Record<ResourceKind, number>>
    }
  }
  action: {
    ok: boolean
    message: string
  }
  after: {
    serviceGaps: number
    treasury: number
  }
}

export function runServiceGovernanceQaScenarios(): ServiceGovernanceQaScenarioSummary[] {
  const runtime = new GameRuntime()
  const serviceCard = deriveStageGovernanceCards(runtime.getSnapshot())
    .find((card) => card.id === 'governance-service-gaps')
  if (!serviceCard) {
    throw new Error('Default scenario did not produce a service governance card')
  }
  const execution = serviceCard.recommendation.execution
  const buildingType = serviceCard.recommendation.buildingType
  if (!execution?.candidate || !buildingType) {
    throw new Error('Service governance card did not produce a build candidate')
  }
  const quote = quoteBuildingConstruction(
    buildingType,
    BUILDING_DEFINITIONS[buildingType],
    runtime.getSnapshot().economy.treasury,
    runtime.getSnapshot().buildings,
    BUILDING_DEFINITIONS,
  )

  const before = {
    serviceGaps: serviceGaps(runtime),
    treasury: runtime.getSnapshot().economy.treasury,
    recommendedBuilding: buildingType,
    buildable: execution.buildable,
    constructionCost: quote.cost,
  }
  const action = runtime.placeBuilding(
    buildingType,
    execution.candidate,
    0,
  )

  return [{
    id: 'default-service-gap-market',
    title: '服务缺口补市场',
    before,
    action: {
      ok: action.ok,
      message: action.message,
    },
    after: {
      serviceGaps: serviceGaps(runtime),
      treasury: runtime.getSnapshot().economy.treasury,
    },
  }]
}

function serviceGaps(runtime: GameRuntime): number {
  return deriveStageMapOverlay('service', runtime.getSnapshot())?.metrics?.serviceGaps ?? 0
}
