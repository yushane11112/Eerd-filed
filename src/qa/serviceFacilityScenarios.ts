import type { AgentEntity, HouseholdState, ResourceKind } from '../simulation/contracts'
import { GameRuntime } from '../integration/GameRuntime'

export type ServiceFacilityType = 'pharmacy' | 'academy' | 'theatre'
type ServiceNeed = keyof HouseholdState['needs']

export interface ServiceFacilityFailureSummary {
  type: 'pharmacy'
  failure: 'no-workers' | 'missing-resource' | 'no-route'
  buildingId: string
  statusReason?: string
  pressureCause?: string
}

export interface ServiceFacilityQaScenarioSummary {
  id: string
  title: string
  build: {
    ok: boolean
    buildingId?: string
    message: string
    cost?: { treasury: number; materials: Partial<Record<ResourceKind, number>> }
  }
  staffing: {
    workerId?: string
    assigned: boolean
  }
  recovery: {
    need: ServiceNeed
    needBefore: number
    needAfter: number
    serviceDelivered: boolean
    healthBefore: number
    healthAfter: number
    pharmacyStatus?: string
    medicineRemaining: number
    publicServiceCoverageBefore: number
    publicServiceCoverageAfter: number
    attractionBefore: number
    attractionAfter: number
  }
}

/** Exercises construction, staffing and the resident service visit loop. */
export function runServiceFacilityQaScenario(): ServiceFacilityQaScenarioSummary {
  const runtime = new GameRuntime({ debugScenario: 'service-facility-runtime' })
  const before = runtime.getSnapshot()
  const patient = Object.values(before.households)
    .sort((left, right) => left.id.localeCompare(right.id))[0]
  if (!patient) throw new Error('Service scenario did not seed a household')

  const placement = runtime.previewBuildingPlacement('pharmacy', { x: 17, y: 5 }, 0)
  if (!placement.valid) {
    throw new Error(`Pharmacy scenario placement is invalid: ${placement.reason ?? 'unknown'}`)
  }
  const build = runtime.placeBuilding('pharmacy', { x: 17, y: 5 }, 0)
  if (!build.ok || !build.buildingId) {
    return {
      id: 'pharmacy-service-recovery',
      title: '药铺建造到居民康复闭环',
      build,
      staffing: { assigned: false },
      recovery: {
        need: 'health',
        needBefore: patient.needs.health,
        needAfter: patient.needs.health,
        serviceDelivered: false,
        healthBefore: patient.needs.health,
        healthAfter: patient.needs.health,
        medicineRemaining: 0,
        publicServiceCoverageBefore: before.metrics.publicServiceCoverage ?? 0,
        publicServiceCoverageAfter: before.metrics.publicServiceCoverage ?? 0,
        attractionBefore: before.metrics.cityAttraction ?? 0,
        attractionAfter: before.metrics.cityAttraction ?? 0,
      },
    }
  }

  const state = mutableRuntimeSnapshot(runtime)
  const pharmacy = state.buildings[build.buildingId]
  if (!pharmacy) throw new Error('Built pharmacy is missing from runtime state')
  const pharmacist: AgentEntity = {
    id: 'debug-pharmacist',
    role: 'worker' as const,
    employerBuildingId: pharmacy.id,
    position: { ...pharmacy.entrance },
    path: [],
    pathIndex: 0,
    activity: 'working' as const,
  }
  state.agents[pharmacist.id] = pharmacist

  pharmacist.employerBuildingId = pharmacy.id
  pharmacist.workStatus = 'present'
  pharmacy.workers = [pharmacist.id]
  pharmacy.inventory.medicine = 10
  const healthBefore = patient.needs.health
  runtime.advance(5_000)
  const after = runtime.getSnapshot()
  const serviceDelivered = (after.cityTimeline ?? []).some((event) => (
    event.source === 'service-delivered' && event.buildingId === pharmacy.id
  ))
  const finalHousehold = after.households[patient.id]

  return {
    id: 'pharmacy-service-recovery',
    title: '药铺建造到居民康复闭环',
    build,
    staffing: {
      workerId: pharmacist.id,
      assigned: after.buildings[pharmacy.id]?.workers.includes(pharmacist.id) ?? false,
    },
    recovery: {
      need: 'health',
      needBefore: healthBefore,
      needAfter: finalHousehold?.needs.health ?? healthBefore,
      serviceDelivered,
      healthBefore,
      healthAfter: finalHousehold?.needs.health ?? healthBefore,
      pharmacyStatus: after.buildings[pharmacy.id]?.statusReason,
      medicineRemaining: after.buildings[pharmacy.id]?.inventory.medicine ?? 0,
      publicServiceCoverageBefore: before.metrics.publicServiceCoverage ?? 0,
      publicServiceCoverageAfter: after.metrics.publicServiceCoverage ?? 0,
      attractionBefore: before.metrics.cityAttraction ?? 0,
      attractionAfter: after.metrics.cityAttraction ?? 0,
    },
  }
}

/** Runs all era-unlocked service facilities through the same recovery contract. */
export function runServiceFacilityQaScenarios(): ServiceFacilityQaScenarioSummary[] {
  return [
    runFacilityRecovery('pharmacy', 'health'),
    runFacilityRecovery('academy', 'education'),
    runFacilityRecovery('theatre', 'entertainment'),
  ]
}

/** Makes service failure causes observable instead of silently degrading needs. */
export function runServiceFacilityFailureScenarios(): ServiceFacilityFailureSummary[] {
  return (['no-workers', 'missing-resource', 'no-route'] as const).map((failure) => {
    const runtime = new GameRuntime({
      debugScenario: 'service-facility-runtime',
      debugUnlockedStage: 'trade-town',
    })
    const setupState = mutableRuntimeSnapshot(runtime)
    const patient = firstHousehold(setupState.households)
    patient.needs.health = 30
    seedCityStorage(setupState)
    const point = findPlacement(runtime, 'pharmacy')
    const build = runtime.placeBuilding('pharmacy', point, 0)
    if (!build.ok || !build.buildingId) throw new Error(`Failure fixture could not build pharmacy: ${build.message}`)
    const state = mutableRuntimeSnapshot(runtime)
    const pharmacy = state.buildings[build.buildingId]
    if (!pharmacy) throw new Error('Failure fixture lost pharmacy after construction')
    if (failure !== 'no-workers') {
      const pharmacist = addServiceWorker(state, pharmacy.id)
      pharmacy.workers = [pharmacist.id]
    }
    if (failure !== 'missing-resource') pharmacy.inventory.medicine = 10
    if (failure === 'no-route') {
      runtime.removeRoadPath(state.cells.filter((cell) => Boolean(cell.road)).map((cell) => cell.point))
    }
    runtime.advance(1_000)
    const after = runtime.getSnapshot()
    return {
      type: 'pharmacy',
      failure,
      buildingId: build.buildingId,
      statusReason: after.buildings[build.buildingId]?.statusReason,
      pressureCause: after.households[patient.id]?.needPressure?.health?.cause,
    }
  })
}

function runFacilityRecovery(type: ServiceFacilityType, need: ServiceNeed): ServiceFacilityQaScenarioSummary {
  const runtime = new GameRuntime({
    debugScenario: 'service-facility-runtime',
    debugUnlockedStage: 'prefecture-town',
  })
  const setupState = mutableRuntimeSnapshot(runtime)
  const patient = firstHousehold(setupState.households)
  patient.needs[need] = 30
  seedCityStorage(setupState)
  const point = findPlacement(runtime, type)
  const build = runtime.placeBuilding(type, point, 0)
  if (!build.ok || !build.buildingId) throw new Error(`${type} recovery fixture could not build: ${build.message}`)
  const state = mutableRuntimeSnapshot(runtime)
  const facility = state.buildings[build.buildingId]
  if (!facility) throw new Error(`${type} recovery fixture lost building after construction`)
  const worker = addServiceWorker(state, facility.id)
  facility.workers = [worker.id]
  if (type === 'pharmacy') facility.inventory.medicine = 10
  const before = patient.needs[need]
  const beforeMetrics = runtime.getSnapshot().metrics
  runtime.advance(5_000)
  const after = runtime.getSnapshot()
  const delivered = (after.cityTimeline ?? []).some((event) => (
    event.source === 'service-delivered' && event.buildingId === facility.id
  ))
  return {
    id: `${type}-service-recovery`,
    title: `${type}服务恢复闭环`,
    build,
    staffing: {
      workerId: worker.id,
      assigned: after.buildings[facility.id]?.workers.includes(worker.id) ?? false,
    },
    recovery: {
      need,
      needBefore: before,
      needAfter: after.households[patient.id]?.needs[need] ?? before,
      serviceDelivered: delivered,
      healthBefore: before,
      healthAfter: after.households[patient.id]?.needs[need] ?? before,
      pharmacyStatus: after.buildings[facility.id]?.statusReason,
      medicineRemaining: after.buildings[facility.id]?.inventory.medicine ?? 0,
      publicServiceCoverageBefore: beforeMetrics.publicServiceCoverage ?? 0,
      publicServiceCoverageAfter: after.metrics.publicServiceCoverage ?? 0,
      attractionBefore: beforeMetrics.cityAttraction ?? 0,
      attractionAfter: after.metrics.cityAttraction ?? 0,
    },
  }
}

function findPlacement(runtime: GameRuntime, type: ServiceFacilityType): { x: number; y: number } {
  for (let y = 3; y < 19; y += 1) {
    for (let x = 3; x < 24; x += 1) {
      if (runtime.previewBuildingPlacement(type, { x, y }, 0).valid) return { x, y }
    }
  }
  throw new Error(`${type} has no valid road-connected placement in the fixture map`)
}

function firstHousehold(households: Record<string, HouseholdState>): HouseholdState {
  const household = Object.values(households).sort((left, right) => left.id.localeCompare(right.id))[0]
  if (!household) throw new Error('Service fixture did not seed a household')
  return household
}

function seedCityStorage(state: ReturnType<GameRuntime['getSnapshot']>): void {
  state.economy.treasury = 10_000
  const granary = state.buildings['granary-1']
  if (granary) {
    granary.inventory = {
      ...granary.inventory,
      wood: 200,
      stone: 200,
      brick: 200,
      cloth: 200,
    }
  }
}

function addServiceWorker(
  state: ReturnType<GameRuntime['getSnapshot']>,
  buildingId: string,
): AgentEntity {
  const worker: AgentEntity = {
    id: `debug-service-worker-${buildingId}`,
    role: 'worker',
    employerBuildingId: buildingId,
    position: { ...state.buildings[buildingId].entrance },
    path: [],
    pathIndex: 0,
    activity: 'working',
    workStatus: 'present',
  }
  state.agents[worker.id] = worker
  return worker
}

function mutableRuntimeSnapshot(runtime: GameRuntime): ReturnType<GameRuntime['getSnapshot']> {
  return (runtime as unknown as { engine: { state: ReturnType<GameRuntime['getSnapshot']> } }).engine.state
}
