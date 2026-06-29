import type { GridPoint, SimulationSnapshot } from '../simulation/contracts'
import { BUILDING_DEFINITIONS } from '../content/runtimeBuildings'

export type StageRequirementId = 'population' | 'attraction' | 'activeDistricts'
export type StageAdvisorOverlayMode = 'housing' | 'service' | 'logistics' | 'roads' | 'activity'
export type StageAdvisorOverlayKind =
  | 'housing'
  | 'migration'
  | 'bottleneck'
  | 'district'
  | 'service'
  | 'logistics'
  | 'road'
  | 'activity'

export interface StageAdvisorOverlayPoint {
  kind: StageAdvisorOverlayKind
  label: string
  position: GridPoint
}

export interface StageAdvisorOverlayPath {
  kind: StageAdvisorOverlayKind
  label: string
  from: GridPoint
  to: GridPoint
}

export interface StageAdvisorOverlayArea {
  kind: StageAdvisorOverlayKind
  label: string
  center: GridPoint
  radius: number
}

export interface StageAdvisorOverlay {
  id: number
  label: string
  points: StageAdvisorOverlayPoint[]
  paths?: StageAdvisorOverlayPath[]
  areas?: StageAdvisorOverlayArea[]
  summary?: string[]
  metrics?: Record<string, number>
}

export interface StageGovernanceCard {
  id: string
  title: string
  detail: string
  cause: string
  action: string
  recommendation: {
    label: string
    tool: 'road' | 'building' | 'inspect'
    buildingType?: string
    overlayMode?: StageAdvisorOverlayMode
  }
  score: number
  severity: 'high' | 'medium' | 'low'
  overlayMode: StageAdvisorOverlayMode
  metricLabel: string
  target?: {
    point: GridPoint
    label: string
  }
}

export const STAGE_ADVISOR_OVERLAY_MODES: ReadonlyArray<{
  mode: StageAdvisorOverlayMode
  label: string
}> = [
  { mode: 'housing', label: '住房' },
  { mode: 'service', label: '服务' },
  { mode: 'logistics', label: '物流' },
  { mode: 'roads', label: '道路' },
  { mode: 'activity', label: '活动' },
]

export function deriveStageGovernanceCards(
  snapshot: Readonly<SimulationSnapshot>,
): StageGovernanceCard[] {
  const overlays = Object.fromEntries(
    STAGE_ADVISOR_OVERLAY_MODES.map((item) => [
      item.mode,
      deriveStageMapOverlay(item.mode, snapshot, 0),
    ]),
  ) as Partial<Record<StageAdvisorOverlayMode, StageAdvisorOverlay | undefined>>
  const cards: StageGovernanceCard[] = []

  const service = overlays.service
  const serviceGaps = service?.metrics?.serviceGaps ?? 0
  if (serviceGaps > 0) {
    const target = service?.points.find((point) => point.label === '缺服务')
    const score = 92 + serviceGaps * 4
    cards.push({
      id: 'governance-service-gaps',
      title: '服务覆盖缺口',
      detail: `${serviceGaps} 处住宅不在服务范围内，后续会拖低满意度和迁入吸引力。`,
      cause: '住宅离现有市场、医馆、学塾或文化服务太远，居民无法形成稳定服务访问。',
      action: '优先在缺口附近补市场、医馆、学塾或文化服务。',
      recommendation: {
        label: '打开服务图层并营造市场',
        tool: 'building',
        buildingType: 'market',
        overlayMode: 'service',
      },
      score,
      severity: severityFromScore(score),
      overlayMode: 'service',
      metricLabel: '缺口住宅',
      target: target && { point: target.position, label: target.label },
    })
  }

  const roads = overlays.roads
  const roadGaps = roads?.metrics?.roadGaps ?? 0
  if (roadGaps > 0) {
    const target = roads?.points.find((point) => point.label.startsWith('缺路'))
    const score = 88 + roadGaps * 3
    cards.push({
      id: 'governance-road-gaps',
      title: '道路入口缺口',
      detail: `${roadGaps} 处建筑入口没有道路贴近，通勤、服务和物流都会变慢。`,
      cause: '建筑入口没有贴近道路，居民、工人和承运人无法稳定走共享路径。',
      action: '先给住宅、仓储、服务和生产入口补齐道路连接。',
      recommendation: {
        label: '打开道路图层并铺路',
        tool: 'road',
        overlayMode: 'roads',
      },
      score,
      severity: severityFromScore(score),
      overlayMode: 'roads',
      metricLabel: '缺路',
      target: target && { point: target.position, label: target.label },
    })
  }

  const logistics = overlays.logistics
  const hotspots = logistics?.metrics?.hotspots ?? 0
  const activeOrders = logistics?.metrics?.activeOrders ?? 0
  if (hotspots > 0 || activeOrders >= 3) {
    const target = logistics?.points.find((point) => point.label.startsWith('物流热点'))
      ?? logistics?.points.find((point) => point.kind === 'logistics')
    const score = 82 + hotspots * 8 + activeOrders
    cards.push({
      id: 'governance-logistics-hotspots',
      title: '物流热点拥堵',
      detail: `当前有 ${activeOrders} 条未完成订单、${hotspots} 个物流热点，货物流转容易压到少数建筑。`,
      cause: '订单集中在少数产地、仓储或市场，现有道路与仓储缓冲不足。',
      action: '靠近热点补仓储、优化道路，避免产地和市场单线拥堵。',
      recommendation: {
        label: '打开物流图层并补仓储',
        tool: 'building',
        buildingType: 'granary',
        overlayMode: 'logistics',
      },
      score,
      severity: severityFromScore(score),
      overlayMode: 'logistics',
      metricLabel: hotspots > 0 ? '热点' : '未完成',
      target: target && { point: target.position, label: target.label },
    })
  }

  const activity = overlays.activity
  const roadPressure = activity?.metrics?.roadPressure ?? 0
  const serviceHeat = activity?.metrics?.serviceHeat ?? 0
  const cargoCongestion = activity?.metrics?.cargoCongestion ?? 0
  if (roadPressure >= 4 || serviceHeat >= 3 || cargoCongestion >= 2) {
    const target = activity?.points.find((point) => isRoadPressureLabel(point.label))
      ?? activity?.points.find((point) => point.label.startsWith('货运热'))
      ?? activity?.points.find((point) => point.label.startsWith('服务热'))
      ?? activity?.points.find((point) => point.kind === 'activity')
    const score = 76 + roadPressure * 2 + serviceHeat * 3 + cargoCongestion * 5
    cards.push({
      id: 'governance-activity-pressure',
      title: '城市活动压力',
      detail: `道路压力 ${roadPressure}、服务热度 ${serviceHeat}、货运拥堵 ${cargoCongestion}，说明人流与货流正在压向少数路径。`,
      cause: '居民服务访问、工人通勤和承运人货运在同一区域叠加，可能放大道路拥堵与服务排队。',
      action: '先打开活动图层确认热区，再补道路分流、服务点或仓储缓冲。',
      recommendation: {
        label: '打开活动图层检查热区',
        tool: 'inspect',
        overlayMode: 'activity',
      },
      score,
      severity: severityFromScore(score),
      overlayMode: 'activity',
      metricLabel: cargoCongestion >= serviceHeat ? '货拥' : '服务热',
      target: target && { point: target.position, label: target.label },
    })
  }

  return cards.sort((left, right) => (
    right.score - left.score || left.id.localeCompare(right.id)
  ))
}

export function deriveStageAdvisorOverlay(
  requirementId: StageRequirementId,
  snapshot: Readonly<SimulationSnapshot>,
  id = Date.now(),
): StageAdvisorOverlay | undefined {
  if (requirementId === 'population') {
    return compactOverlay(id, '住房与外来人口', [
      ...Object.values(snapshot.buildings)
        .filter((building) => building.type === 'house')
        .map((building) => ({
          kind: 'housing' as const,
          label: '住房',
          position: building.entrance,
        })),
      ...Object.values(snapshot.migrationCandidates ?? {})
        .map((candidate) => ({
          kind: 'migration' as const,
          label: candidate.status === 'walking' ? '进城中' : '等房',
          position: candidate.position,
        })),
    ])
  }

  if (requirementId === 'activeDistricts') {
    return compactOverlay(id, '街区核心', (snapshot.districts ?? [])
      .map((district) => ({
        kind: 'district' as const,
        label: district.name,
        position: district.center,
      })))
  }

  return compactOverlay(id, '吸引力瓶颈', [
    ...Object.values(snapshot.buildings)
      .filter((building) => building.status === 'blocked' || building.statusReason)
      .map((building) => ({
        kind: 'bottleneck' as const,
        label: building.statusReason ? '停工' : '瓶颈',
        position: building.entrance,
      })),
    ...Object.values(snapshot.buildings)
      .filter((building) => building.type === 'market' || building.type === 'granary')
      .map((building) => ({
        kind: 'bottleneck' as const,
        label: building.type === 'market' ? '市场' : '仓储',
        position: building.entrance,
      })),
  ])
}

export function deriveStageMapOverlay(
  mode: StageAdvisorOverlayMode,
  snapshot: Readonly<SimulationSnapshot>,
  id = Date.now(),
): StageAdvisorOverlay | undefined {
  if (mode === 'housing') {
    const householdCounts = new Map<string, number>()
    Object.values(snapshot.households).forEach((household) => {
      householdCounts.set(
        household.homeBuildingId,
        (householdCounts.get(household.homeBuildingId) ?? 0) + household.members,
      )
    })
    const housingPoints = Object.values(snapshot.buildings)
      .filter((building) => building.type === 'house')
      .map((building) => {
        const capacity = BUILDING_DEFINITIONS[building.type]?.capacity ?? 0
        const used = householdCounts.get(building.id) ?? 0
        return {
          kind: 'housing' as const,
          label: capacity > used ? `空${capacity - used}` : '满员',
          position: building.entrance,
        }
      })
    const openHousing = snapshot.metrics.openHousingCapacity
      ?? Math.max(0, snapshot.metrics.housingCapacity - snapshot.metrics.population)
    return compactOverlay(id, '住房容量', housingPoints, [], [], [
      `住宅 ${housingPoints.length}`,
      `空位 ${openHousing}`,
    ], {
      houses: housingPoints.length,
      openHousing,
    })
  }

  if (mode === 'service') {
    const serviceBuildings = Object.values(snapshot.buildings)
      .filter((building) => {
        const definition = BUILDING_DEFINITIONS[building.type]
        return definition?.functions?.some((fn) => fn === 'service' || fn === 'market' || fn === 'culture')
      })
    const serviceAreas = serviceBuildings
      .filter((building) => building.status !== 'blocked')
      .map((building) => ({
        kind: 'service' as const,
        label: '覆盖',
        center: building.entrance,
        radius: serviceRadius(building.level),
      }))
    const uncoveredHomes = Object.values(snapshot.buildings)
      .filter((building) => building.type === 'house')
      .filter((building) => !serviceAreas.some((area) => isNear(area.center, building.entrance, area.radius)))
      .slice(0, 4)
      .map((building) => ({
        kind: 'bottleneck' as const,
        label: '缺服务',
        position: building.entrance,
      }))
    return compactOverlay(id, '服务范围', [
      ...serviceBuildings.map((building) => ({
        kind: 'service' as const,
        label: building.status === 'blocked' ? '服务停摆' : '服务点',
        position: building.entrance,
      })),
      ...uncoveredHomes,
    ], [], serviceAreas, [
      `服务点 ${serviceBuildings.length}`,
      `缺口住宅 ${uncoveredHomes.length}`,
    ], {
      servicePoints: serviceBuildings.length,
      serviceGaps: uncoveredHomes.length,
    })
  }

  if (mode === 'logistics') {
    const activeOrders = Object.values(snapshot.logisticsOrders)
      .filter((order) => order.state !== 'delivered')
    const endpointCounts = new Map<string, number>()
    activeOrders.forEach((order) => {
      endpointCounts.set(order.sourceBuildingId, (endpointCounts.get(order.sourceBuildingId) ?? 0) + 1)
      endpointCounts.set(order.destinationBuildingId, (endpointCounts.get(order.destinationBuildingId) ?? 0) + 1)
    })
    const hotspots = Array.from(endpointCounts.entries())
      .filter(([, count]) => count > 1)
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .flatMap(([buildingId, count]) => {
        const building = snapshot.buildings[buildingId]
        if (!building) return []
        return [{
          kind: 'bottleneck' as const,
          label: `物流热点x${count}`,
          position: building.entrance,
        }]
      })
    return compactOverlay(id, '物流线路', [
      ...activeOrders.flatMap((order) => {
      const source = snapshot.buildings[order.sourceBuildingId]
      const destination = snapshot.buildings[order.destinationBuildingId]
      const points: Array<StageAdvisorOverlayPoint | undefined> = [
        source && {
          kind: 'logistics' as const,
          label: order.state === 'cancelled' ? '失败源' : '发货',
          position: source.entrance,
        },
        destination && {
          kind: 'logistics' as const,
          label: order.state === 'cancelled' ? '失败点' : '收货',
          position: destination.entrance,
        },
      ]
      return points.filter((point): point is StageAdvisorOverlayPoint => Boolean(point))
      }),
      ...hotspots,
    ], activeOrders.flatMap((order) => {
      const source = snapshot.buildings[order.sourceBuildingId]
      const destination = snapshot.buildings[order.destinationBuildingId]
      if (!source || !destination) return []
      return [{
        kind: 'logistics' as const,
        label: order.state === 'cancelled' ? '失败线路' : `${order.resource} x${order.amount}`,
        from: source.entrance,
        to: destination.entrance,
      }]
    }), [], [
      `未完成 ${activeOrders.length}`,
      `热点 ${hotspots.length}`,
    ], {
      activeOrders: activeOrders.length,
      hotspots: hotspots.length,
    })
  }

  if (mode === 'activity') {
    const activeAgents = Object.values(snapshot.agents)
      .filter((agent) => (
        agent.activity === 'commuting'
        || agent.activity === 'returning'
        || agent.activity === 'delivering'
        || agent.activity === 'shopping'
        || agent.activity === 'serving'
      ))
      .sort((left, right) => left.id.localeCompare(right.id))
    const heat = new Map<string, {
      position: GridPoint
      count: number
      service: number
      commute: number
      cargo: number
    }>()
    const roadCells = new Set(snapshot.cells
      .filter((cell) => cell.road)
      .map((cell) => pointBucket(cell.point)))
    const roadPressureCells = new Map<string, {
      position: GridPoint
      count: number
      service: number
      commute: number
      cargo: number
    }>()
    for (const agent of activeAgents) {
      const key = pointBucket(agent.position)
      const item = heat.get(key) ?? {
        position: { ...agent.position },
        count: 0,
        service: 0,
        commute: 0,
        cargo: 0,
      }
      item.count += 1
      if (agent.serviceIntent) item.service += 1
      else if (agent.cargoIntent) item.cargo += 1
      else if (agent.activity === 'commuting' || agent.activity === 'returning') item.commute += 1
      heat.set(key, item)

      for (const pathPoint of remainingPathPoints(agent)) {
        const pathKey = pointBucket(pathPoint)
        if (!roadCells.has(pathKey)) continue
        const roadItem = roadPressureCells.get(pathKey) ?? {
          position: { x: Math.round(pathPoint.x), y: Math.round(pathPoint.y) },
          count: 0,
          service: 0,
          commute: 0,
          cargo: 0,
        }
        roadItem.count += 1
        if (agent.serviceIntent) roadItem.service += 1
        else if (agent.cargoIntent) roadItem.cargo += 1
        else if (agent.activity === 'commuting' || agent.activity === 'returning') roadItem.commute += 1
        roadPressureCells.set(pathKey, roadItem)
      }
    }
    const pressureRoadPoints = [...roadPressureCells.values()]
      .sort((left, right) => right.count - left.count || pointKey(left.position).localeCompare(pointKey(right.position)))
      .slice(0, 4)
      .map((item) => ({
        kind: 'activity' as const,
        label: roadPressureLabel(item),
        position: item.position,
      }))
    const activityHotspots = [...heat.values()]
      .sort((left, right) => right.count - left.count || pointKey(left.position).localeCompare(pointKey(right.position)))
      .slice(0, 6)
      .map((item) => ({
        kind: 'activity' as const,
        label: activityHeatLabel(item),
        position: item.position,
      }))
    const hotspots = [
      ...pressureRoadPoints,
      ...activityHotspots,
    ]
    const paths = activeAgents
      .filter((agent) => agent.path.length > 0)
      .slice(0, 8)
      .flatMap((agent) => {
        const destination = agent.path[agent.path.length - 1]
        if (!destination) return []
        return [{
          kind: 'activity' as const,
          label: agentActivityLabel(agent),
          from: agent.position,
          to: destination,
        }]
      })
    const serviceVisits = activeAgents.filter((agent) => Boolean(agent.serviceIntent)).length
    const cargoTrips = activeAgents.filter((agent) => Boolean(agent.cargoIntent)).length
    const commutes = activeAgents.filter((agent) => (
      !agent.serviceIntent
      && !agent.cargoIntent
      && (agent.activity === 'commuting' || agent.activity === 'returning')
    )).length
    const roadPressure = roadPressureCells.size > 0
      ? Math.max(...[...roadPressureCells.values()].map((item) => item.count))
      : activeAgents.filter((agent) => agent.path.length > 1).length
    const serviceHeat = serviceVisits
    const cargoCongestion = cargoTrips
    return compactOverlay(id, '城市活动热力', hotspots, paths, [], [
      `道压 ${roadPressure}`,
      `服务热 ${serviceHeat}`,
      `货拥 ${cargoCongestion}`,
    ], {
      activeAgents: activeAgents.length,
      serviceVisits,
      commutes,
      cargoTrips,
      hotspots: hotspots.length,
      roadPressure,
      pressureRoadCells: roadPressureCells.size,
      serviceHeat,
      cargoCongestion,
    })
  }

  const roadCells = snapshot.cells
    .filter((cell) => cell.road)
    .slice(0, 8)
    .map((cell) => ({
      kind: 'road' as const,
      label: cell.road === 'bridge' ? '桥' : '道路',
      position: cell.point,
    }))
  const roadGaps = Object.values(snapshot.buildings)
    .filter((building) => !snapshot.cells.some((cell) => cell.road && isNear(cell.point, building.entrance, 1)))
    .slice(0, 4)
    .map((building) => ({
      kind: 'road' as const,
      label: roadGapLabel(building.type),
      position: building.entrance,
    }))
  return compactOverlay(id, '道路连通', [
    ...roadCells,
    ...roadGaps,
  ], [], [], [
    `道路点 ${roadCells.length}`,
    `缺路 ${roadGaps.length}`,
  ], {
    roadCells: roadCells.length,
    roadGaps: roadGaps.length,
  })
}

function compactOverlay(
  id: number,
  label: string,
  points: StageAdvisorOverlayPoint[],
  paths: StageAdvisorOverlayPath[] = [],
  areas: StageAdvisorOverlayArea[] = [],
  summary: string[] = [],
  metrics: Record<string, number> = {},
): StageAdvisorOverlay | undefined {
  const seen = new Set<string>()
  const unique = points.filter((point) => {
    const key = `${point.kind}:${Math.round(point.position.x * 100) / 100},${Math.round(point.position.y * 100) / 100}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  const pathSeen = new Set<string>()
  const uniquePaths = paths.filter((path) => {
    const key = `${path.kind}:${Math.round(path.from.x * 100) / 100},${Math.round(path.from.y * 100) / 100}->${Math.round(path.to.x * 100) / 100},${Math.round(path.to.y * 100) / 100}`
    if (pathSeen.has(key)) return false
    pathSeen.add(key)
    return true
  })
  const areaSeen = new Set<string>()
  const uniqueAreas = areas.filter((area) => {
    const key = `${area.kind}:${Math.round(area.center.x * 100) / 100},${Math.round(area.center.y * 100) / 100}:${Math.round(area.radius * 100) / 100}`
    if (areaSeen.has(key)) return false
    areaSeen.add(key)
    return true
  })
  if (unique.length === 0 && uniquePaths.length === 0 && uniqueAreas.length === 0) return undefined
  const overlay: StageAdvisorOverlay = {
    id,
    label,
    points: unique.slice(0, 8).map((point) => ({
      kind: point.kind,
      label: point.label,
      position: { ...point.position },
    })),
  }
  const limitedPaths = uniquePaths.slice(0, 8).map((path) => ({
      kind: path.kind,
      label: path.label,
      from: { ...path.from },
      to: { ...path.to },
    }))
  if (limitedPaths.length > 0) overlay.paths = limitedPaths
  const limitedAreas = uniqueAreas.slice(0, 8).map((area) => ({
    kind: area.kind,
    label: area.label,
    center: { ...area.center },
    radius: area.radius,
  }))
  if (limitedAreas.length > 0) overlay.areas = limitedAreas
  const cleanSummary = summary.filter(Boolean).slice(0, 3)
  if (cleanSummary.length > 0) overlay.summary = cleanSummary
  if (Object.keys(metrics).length > 0) overlay.metrics = { ...metrics }
  return overlay
}

function isNear(a: GridPoint, b: GridPoint, distance: number): boolean {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) <= distance
}

function serviceRadius(level: number): number {
  return 3 + Math.min(level, 5)
}

function roadGapLabel(type: string): string {
  const definition = BUILDING_DEFINITIONS[type]
  if (type === 'house' || definition?.functions?.includes('housing')) return '缺路住宅'
  if (definition?.functions?.some((fn) => fn === 'service' || fn === 'market' || fn === 'culture')) return '缺路服务'
  if (definition?.functions?.includes('storage')) return '缺路仓储'
  if (definition?.functions?.some((fn) => fn === 'production' || fn === 'employment')) return '缺路生产'
  return '缺路'
}

function pointBucket(point: GridPoint): string {
  return `${Math.round(point.x)},${Math.round(point.y)}`
}

function pointKey(point: GridPoint): string {
  return `${point.x},${point.y}`
}

function activityHeatLabel(item: {
  count: number
  service: number
  commute: number
  cargo: number
}): string {
  if (item.cargo >= item.service && item.cargo >= item.commute && item.cargo > 0) return `货运热x${item.count}`
  if (item.service >= item.commute && item.service > 0) return `服务热x${item.count}`
  if (item.commute > 0) return `通勤热x${item.count}`
  return `活动热x${item.count}`
}

function roadPressureLabel(item: {
  count: number
  service: number
  commute: number
  cargo: number
}): string {
  if (item.cargo >= item.service && item.cargo >= item.commute && item.cargo > 0) return `货路x${item.count}`
  if (item.service >= item.commute && item.service > 0) return `服路x${item.count}`
  if (item.commute > 0) return `通路x${item.count}`
  return `道压x${item.count}`
}

function isRoadPressureLabel(label: string): boolean {
  return label.startsWith('道压')
    || label.startsWith('货路')
    || label.startsWith('服路')
    || label.startsWith('通路')
}

function agentActivityLabel(agent: Readonly<SimulationSnapshot['agents'][string]>): string {
  if (agent.cargoIntent?.phase === 'pickup') return `${agent.cargoIntent.resource}取货`
  if (agent.cargoIntent?.phase === 'dropoff') return `${agent.cargoIntent.resource}送货`
  if (agent.serviceIntent) return agent.activity === 'returning' ? '服务返家' : '服务访问'
  if (agent.activity === 'returning') return '返家'
  if (agent.activity === 'commuting') return '通勤'
  return '活动'
}

function remainingPathPoints(agent: Readonly<SimulationSnapshot['agents'][string]>): GridPoint[] {
  if (agent.path.length === 0) return []
  return agent.path.slice(Math.max(0, agent.pathIndex))
}

function severityFromScore(score: number): StageGovernanceCard['severity'] {
  if (score >= 92) return 'high'
  if (score >= 82) return 'medium'
  return 'low'
}
