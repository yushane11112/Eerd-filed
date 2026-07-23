import type {
  AgentActivity,
  BuildingDefinition,
  SimulationSnapshot,
} from '../simulation/contracts'

export interface ResidentGovernanceSummary {
  households: number
  population: number
  housingCapacity: number
  overcrowdedHouseholds: number
  workerCount: number
  employedWorkers: number
  unemployedWorkers: number
  absentWorkers: number
  migrationCandidates: number
  migrationIn: number
  migrationOut: number
  netMigration: number
  publicServiceCoverage: number
  serviceMaintenanceCost: number
  migrationReasons: Array<{ label: string; count: number }>
  migrationHousing: Array<{ label: string; count: number }>
  migrationOccupations: Array<{ label: string; count: number }>
  employedWorkersOut: number
  unemployedWorkersOut: number
  activityCounts: Partial<Record<AgentActivity, number>>
  occupations: Array<{ label: string; count: number }>
  averageNeed: number
  lowestNeed: { label: string; value: number }
  servicePressure?: { label: string; ticks: number; cause: string }
  blockedBuildings: number
  longestBlockage?: { buildingId: string; label: string; ticks: number; reason: string }
  logisticsBacklog: number
  inventoryPressureBuildings: number
  lastFiscalOperationalPressure?: {
    tick: number
    blockedBuildings: number
    logisticsBacklog: number
    inventoryPressureBuildings: number
    pressuredHouseholds: number
    blockedBuildingsDelta?: number
    logisticsBacklogDelta?: number
    inventoryPressureBuildingsDelta?: number
    pressuredHouseholdsDelta?: number
  }
}

const NEED_LABELS: Record<string, string> = {
  food: '粮食',
  goods: '日用品',
  health: '医疗',
  education: '教育',
  entertainment: '娱乐',
}

export function deriveResidentGovernance(
  snapshot: Readonly<SimulationSnapshot>,
  definitions: Readonly<Record<string, Readonly<BuildingDefinition>>>,
): ResidentGovernanceSummary {
  const households = Object.values(snapshot.households)
  const homes = Object.values(snapshot.buildings).filter((building) => definitions[building.type]?.category === 'housing')
  const housingCapacity = homes.reduce((sum, building) => sum + (definitions[building.type]?.capacity ?? 0), 0)
  const occupancy = new Map<string, number>()
  for (const household of households) {
    occupancy.set(household.homeBuildingId, (occupancy.get(household.homeBuildingId) ?? 0) + household.members)
  }

  const workers = Object.values(snapshot.agents).filter((agent) => agent.role === 'worker')
  const occupations = new Map<string, number>()
  for (const worker of workers) {
    const employer = worker.employerBuildingId ? snapshot.buildings[worker.employerBuildingId] : undefined
    const label = employer ? (definitions[employer.type]?.name ?? employer.type) : '待业'
    occupations.set(label, (occupations.get(label) ?? 0) + 1)
  }

  const activityCounts: Partial<Record<AgentActivity, number>> = {}
  for (const agent of workers) {
    activityCounts[agent.activity] = (activityCounts[agent.activity] ?? 0) + 1
  }

  const needTotals = new Map<string, number>()
  for (const household of households) {
    for (const [need, value] of Object.entries(household.needs)) {
      needTotals.set(need, (needTotals.get(need) ?? 0) + value)
    }
  }
  const needEntries = Object.entries(NEED_LABELS).map(([key, label]) => ({
    label,
    value: households.length > 0 ? (needTotals.get(key) ?? 0) / households.length : 100,
  }))
  const lowestNeed = needEntries.reduce((lowest, entry) => entry.value < lowest.value ? entry : lowest, needEntries[0] ?? { label: '民生', value: 100 })
  const pressureEntries = households.flatMap((household) => Object.entries(household.needPressure ?? {}).map(([need, pressure]) => ({
    label: NEED_LABELS[need] ?? need,
    ticks: pressure?.ticks ?? 0,
    cause: pressure?.cause ?? 'capacity',
  })))
  const servicePressure = pressureEntries
    .filter((entry) => entry.ticks > 0)
    .sort((left, right) => right.ticks - left.ticks || left.label.localeCompare(right.label))[0]

  const buildings = Object.values(snapshot.buildings)
  const blockedBuildings = buildings.filter(isOperationalBlockage)
  const longestBlockage = blockedBuildings
    .map((building) => ({
      buildingId: building.id,
      label: definitions[building.type]?.name ?? building.type,
      ticks: Math.max(0, snapshot.tick - (building.blockedSinceTick ?? snapshot.tick)),
      reason: blockageReasonLabel(building.statusReason),
    }))
    .sort((left, right) => right.ticks - left.ticks || left.label.localeCompare(right.label))[0]
  const logisticsBacklog = Object.values(snapshot.logisticsOrders).filter((order) => order.state !== 'delivered' && order.state !== 'cancelled').length
  const inventoryPressureBuildings = buildings.filter((building) => {
    const reason = building.statusReason ?? ''
    return reason === 'output-full' || reason === 'storage-full' || reason.includes('destination-capacity')
  }).length
  const lastFiscal = snapshot.economy.fiscalHistory?.at(-1)

  return {
    households: households.length,
    population: households.reduce((sum, household) => sum + household.members, 0),
    housingCapacity,
    overcrowdedHouseholds: households.filter((household) => (occupancy.get(household.homeBuildingId) ?? 0) > (definitions[snapshot.buildings[household.homeBuildingId]?.type]?.capacity ?? 0)).length,
    workerCount: workers.length,
    employedWorkers: workers.filter((worker) => Boolean(worker.employerBuildingId)).length,
    unemployedWorkers: workers.filter((worker) => !worker.employerBuildingId).length,
    absentWorkers: workers.filter((worker) => worker.employerBuildingId && worker.workStatus === 'absent').length,
    migrationCandidates: Object.keys(snapshot.migrationCandidates ?? {}).length,
    migrationIn: snapshot.populationFlow?.householdsIn ?? snapshot.metrics.migrationIn ?? 0,
    migrationOut: snapshot.populationFlow?.householdsOut ?? snapshot.metrics.migrationOut ?? 0,
    netMigration: snapshot.metrics.netMigration ?? ((snapshot.populationFlow?.householdsIn ?? 0) - (snapshot.populationFlow?.householdsOut ?? 0)),
    publicServiceCoverage: snapshot.metrics.publicServiceCoverage ?? 0,
    serviceMaintenanceCost: snapshot.economy.lastServiceMaintenanceCost ?? 0,
    migrationReasons: summarizeCounts(snapshot.populationFlow?.departuresByReason, migrationReasonLabel),
    migrationHousing: summarizeCounts(snapshot.populationFlow?.departuresByHousing, (value) => definitions[value]?.name ?? value),
    migrationOccupations: summarizeCounts(snapshot.populationFlow?.departuresByOccupation, (value) => definitions[value]?.name ?? (value === 'unemployed' ? '待业' : value)),
    employedWorkersOut: snapshot.populationFlow?.employedWorkersOut ?? 0,
    unemployedWorkersOut: snapshot.populationFlow?.unemployedWorkersOut ?? 0,
    activityCounts,
    occupations: [...occupations.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((left, right) => (left.label === '待业' ? 1 : 0) - (right.label === '待业' ? 1 : 0) || right.count - left.count || left.label.localeCompare(right.label))
      .slice(0, 3),
    averageNeed: needEntries.reduce((sum, entry) => sum + entry.value, 0) / Math.max(1, needEntries.length),
    lowestNeed,
    ...(servicePressure ? { servicePressure } : {}),
    blockedBuildings: blockedBuildings.length,
    ...(longestBlockage ? { longestBlockage } : {}),
    logisticsBacklog,
    inventoryPressureBuildings,
    ...(lastFiscal?.operationalPressure ? {
      lastFiscalOperationalPressure: {
        tick: lastFiscal.tick,
        ...lastFiscal.operationalPressure,
        ...(lastFiscal.operationalPressureDelta ?? {}),
      },
    } : {}),
  }
}

function isOperationalBlockage(building: SimulationSnapshot['buildings'][string]): boolean {
  const reason = building.statusReason ?? ''
  return building.status === 'blocked'
    || reason === 'no-workers'
    || reason === 'output-full'
    || reason === 'storage-full'
    || reason === 'no-service-route'
    || reason.startsWith('missing-input:')
    || reason.startsWith('missing-service-resource:')
    || reason.startsWith('logistics-failed:')
}

function blockageReasonLabel(reason?: string): string {
  if (reason === 'no-workers') return '缺工'
  if (reason === 'output-full' || reason === 'storage-full' || reason?.includes('destination-capacity')) return '仓满'
  if (reason === 'no-service-route' || reason?.startsWith('logistics-failed:')) return '断路/物流'
  if (reason?.startsWith('missing-input:') || reason?.startsWith('missing-service-resource:')) return '缺料'
  return '运行阻塞'
}

function summarizeCounts(
  counts: Record<string, number> | undefined,
  label: (value: string) => string,
): Array<{ label: string; count: number }> {
  return Object.entries(counts ?? {})
    .map(([value, count]) => ({ label: label(value), count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))
}

function migrationReasonLabel(value: string): string {
  return ({
    'critical-needs': '关键需求短板',
    unemployment: '长期失业',
    'chronic-absence': '长期缺勤',
    'low-satisfaction': '满意度过低',
  } as Record<string, string>)[value] ?? value
}

export function formatResidentMigrationAudit(summary: ResidentGovernanceSummary): string {
  const reason = summary.migrationReasons[0]
  const occupation = summary.migrationOccupations[0]
  if (!reason && !occupation) return '暂无离城结构记录'
  const reasonText = reason ? `主要原因：${reason.label} ${reason.count} 户` : '暂无原因记录'
  const occupationText = occupation ? `；离城职业：${occupation.label} ${occupation.count}` : ''
  return `${reasonText}${occupationText}`
}

export function formatResidentActivity(summary: ResidentGovernanceSummary): string {
  const active = Object.entries(summary.activityCounts)
    .filter(([, count]) => (count ?? 0) > 0)
    .sort((left, right) => (right[1] ?? 0) - (left[1] ?? 0))
    .slice(0, 2)
    .map(([activity, count]) => `${activityLabel(activity)} ${count}`)
  return active.length > 0 ? active.join('、') : '暂无工作活动'
}

function activityLabel(activity: string): string {
  return ({
    home: '居家', commuting: '通勤', working: '工作', shopping: '购物',
    delivering: '配送', serving: '服务', returning: '返家', idle: '闲置',
  } as Record<string, string>)[activity] ?? activity
}

export function formatResidentPressure(summary: ResidentGovernanceSummary): string {
  if (!summary.servicePressure) return '暂无持续服务短板'
  return `${summary.servicePressure.label}：${pressureCauseLabel(summary.servicePressure.cause)}，已持续 ${summary.servicePressure.ticks} 刻`
}

function pressureCauseLabel(cause: string): string {
  return ({
    'no-workers': '服务点缺有效工人',
    'missing-resource': '服务库存缺资源',
    'no-route': '道路不可达',
    capacity: '服务容量不足',
    unaffordable: '家庭收入不足',
  } as Record<string, string>)[cause] ?? cause
}
