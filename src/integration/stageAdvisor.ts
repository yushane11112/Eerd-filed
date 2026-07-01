import type { GridPoint, RoadKind, SimulationSnapshot } from '../simulation/contracts'
import {
  BUILDING_DEFINITIONS,
  CITY_STAGE_LABELS,
  deriveRuntimeCityStage,
  isRuntimeBuildingUnlocked,
} from '../content/runtimeBuildings'
import { quoteBuildingConstruction, roadConstructionCost } from '../simulation/economy/construction'

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
  | 'placement'

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

export interface StageAdvisorOverlayCell {
  kind: StageAdvisorOverlayKind
  label: string
  position: GridPoint
  status: 'footprint' | 'entrance' | 'blocked' | 'planned' | 'bridge'
}

export interface StageAdvisorOverlay {
  id: number
  label: string
  points: StageAdvisorOverlayPoint[]
  paths?: StageAdvisorOverlayPath[]
  areas?: StageAdvisorOverlayArea[]
  cells?: StageAdvisorOverlayCell[]
  summary?: string[]
  metrics?: Record<string, number>
}

export interface StageGovernanceCard {
  id: string
  title: string
  detail: string
  cause: string
  action: string
  recommendation: StageGovernanceRecommendation
  score: number
  severity: 'high' | 'medium' | 'low'
  overlayMode: StageAdvisorOverlayMode
  metricLabel: string
  target?: {
    point: GridPoint
    label: string
  }
}

export interface StageGovernanceRecommendation {
  label: string
  tool: 'road' | 'building' | 'inspect'
  buildingType?: string
  overlayMode?: StageAdvisorOverlayMode
  availability?: {
    unlocked: boolean
    currentStageLabel: string
    requiredStageLabel?: string
    reason?: string
  }
  execution?: {
    buildable: boolean
    reason: string
    candidate?: GridPoint
    entrance?: GridPoint
    footprint?: GridPoint[]
    rotation?: 0 | 90 | 180 | 270
    landCandidates: number
    roadAnchors: number
    missingMaterials?: Partial<Record<string, number>>
    missingTreasury?: number
  }
  roadPlan?: {
    from: GridPoint
    to: GridPoint
    cells: Array<{
      point: GridPoint
      kind: RoadKind
      treasuryCost: number
    }>
    roadCells: number
    bridgeCells: number
    treasuryCost: number
    missingTreasury: number
    canAfford: boolean
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
    const recommendation = withServiceGapExecution(explainStageRecommendationAvailability({
      label: '打开服务图层并营造市场',
      tool: 'building',
      buildingType: 'market',
      overlayMode: 'service',
    }, snapshot), snapshot)
    cards.push({
      id: 'governance-service-gaps',
      title: '服务覆盖缺口',
      detail: `${serviceGaps} 处住宅不在服务范围内，后续会拖低满意度和迁入吸引力。`,
      cause: '住宅离现有市场、医馆、学塾或文化服务太远，居民无法形成稳定服务访问。',
      action: actionWithAvailability('优先在缺口附近补市场、医馆、学塾或文化服务。', recommendation),
      recommendation,
      score,
      severity: severityFromScore(score),
      overlayMode: 'service',
      metricLabel: '缺口住宅',
      target: target && { point: target.position, label: target.label },
    })
  }

  const roads = overlays.roads
  const disconnectedEntrances = roads?.metrics?.disconnectedEntrances ?? 0
  const isolatedRoadNetworks = roads?.metrics?.isolatedRoadNetworks ?? 0
  if (disconnectedEntrances > 0 || isolatedRoadNetworks > 0) {
    const target = roads?.points.find((point) => point.label.startsWith('未连通'))
    const score = 96 + disconnectedEntrances * 5 + isolatedRoadNetworks * 4
    const recommendation = explainStageRecommendationAvailability({
      label: '打开道路图层并接回主路网',
      tool: 'road',
      overlayMode: 'roads',
    }, snapshot)
    const roadPlan = roads?.paths?.[0]
      ? roadLinkConstructionPlan(roads.paths[0], snapshot)
      : undefined
    cards.push({
      id: 'governance-road-disconnected',
      title: '道路未连通',
      detail: `${disconnectedEntrances} 处建筑入口贴着孤立路网，${isolatedRoadNetworks} 段道路没有接回主路网。`,
      cause: '道路或桥梁只铺到局部，没有和主路网形成连续路径，居民、工人和货运会被困在孤岛路段。',
      action: actionWithAvailability('先用道路或桥梁把孤立路网接回主路网，再扩建新建筑。', recommendation),
      recommendation: roadPlan ? { ...recommendation, roadPlan } : recommendation,
      score,
      severity: severityFromScore(score),
      overlayMode: 'roads',
      metricLabel: '未连通',
      target: target && { point: target.position, label: target.label },
    })
  }
  const roadGaps = roads?.metrics?.roadGaps ?? 0
  if (roadGaps > 0) {
    const target = roads?.points.find((point) => point.label.startsWith('缺路'))
    const score = 88 + roadGaps * 3
    const recommendation = explainStageRecommendationAvailability({
      label: '打开道路图层并铺路',
      tool: 'road',
      overlayMode: 'roads',
    }, snapshot)
    cards.push({
      id: 'governance-road-gaps',
      title: '道路入口缺口',
      detail: `${roadGaps} 处建筑入口没有道路贴近，通勤、服务和物流都会变慢。`,
      cause: '建筑入口没有贴近道路，居民、工人和承运人无法稳定走共享路径。',
      action: actionWithAvailability('先给住宅、仓储、服务和生产入口补齐道路连接。', recommendation),
      recommendation,
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
    const recommendation = explainStageRecommendationAvailability({
      label: '打开物流图层并补仓储',
      tool: 'building',
      buildingType: 'granary',
      overlayMode: 'logistics',
    }, snapshot)
    cards.push({
      id: 'governance-logistics-hotspots',
      title: '物流热点拥堵',
      detail: `当前有 ${activeOrders} 条未完成订单、${hotspots} 个物流热点，货物流转容易压到少数建筑。`,
      cause: '订单集中在少数产地、仓储或市场，现有道路与仓储缓冲不足。',
      action: actionWithAvailability('靠近热点补仓储、优化道路，避免产地和市场单线拥堵。', recommendation),
      recommendation,
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
    const pressureRecommendation = activityPressureRecommendation({
      roadPressure,
      serviceHeat,
      cargoCongestion,
      targetLabel: target?.label,
    })
    const recommendation = explainStageRecommendationAvailability(pressureRecommendation.recommendation, snapshot)
    cards.push({
      id: 'governance-activity-pressure',
      title: '城市活动压力',
      detail: `道路压力 ${roadPressure}、服务热度 ${serviceHeat}、货运拥堵 ${cargoCongestion}，说明人流与货流正在压向少数路径。`,
      cause: '居民服务访问、工人通勤和承运人货运在同一区域叠加，可能放大道路拥堵与服务排队。',
      action: actionWithAvailability(pressureRecommendation.action, recommendation),
      recommendation,
      score,
      severity: severityFromScore(score),
      overlayMode: 'activity',
      metricLabel: pressureRecommendation.metricLabel,
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

  const allRoadCells = snapshot.cells
    .filter((cell) => cell.road)
  const roadConnectivity = diagnoseRoadConnectivity(allRoadCells)
  const roadCells = allRoadCells
    .slice(0, 8)
    .map((cell) => ({
      kind: 'road' as const,
      label: cell.road === 'bridge' ? '桥' : '道路',
      position: cell.point,
    }))
  const buildingRoadStatus = Object.values(snapshot.buildings)
    .map((building) => {
      const adjacentRoadKeys = adjacentRoadCellKeys(building.entrance, roadConnectivity.roadKeys)
      const touchesMainNetwork = adjacentRoadKeys.some((key) => roadConnectivity.mainComponentKeys.has(key))
      return {
        building,
        adjacentRoadKeys,
        touchesMainNetwork,
      }
    })
  const roadGaps = buildingRoadStatus
    .filter((item) => item.adjacentRoadKeys.length === 0)
    .slice(0, 4)
    .map(({ building }) => ({
      kind: 'road' as const,
      label: roadGapLabel(building.type),
      position: building.entrance,
    }))
  const disconnectedEntrances = buildingRoadStatus
    .filter((item) => item.adjacentRoadKeys.length > 0 && !item.touchesMainNetwork)
    .slice(0, 4)
    .map(({ building }) => ({
      kind: 'road' as const,
      label: roadDisconnectedLabel(building.type),
      position: building.entrance,
    }))
  const suggestedRoadLinks = suggestRoadNetworkLinks(roadConnectivity, snapshot.cells)
  const isolatedRoadNetworks = Math.max(0, roadConnectivity.components.length - 1)
  const summary = [
    `道路点 ${allRoadCells.length}`,
    ...(disconnectedEntrances.length > 0 ? [`未连通 ${disconnectedEntrances.length}`] : []),
    ...(isolatedRoadNetworks > 0 ? [`孤立路网 ${isolatedRoadNetworks}`] : []),
    `缺路 ${buildingRoadStatus.filter((item) => item.adjacentRoadKeys.length === 0).length}`,
  ]
  return compactOverlay(id, '道路连通', [
    ...roadCells,
    ...roadGaps,
    ...disconnectedEntrances,
  ], suggestedRoadLinks, [], summary, {
    roadCells: allRoadCells.length,
    roadGaps: buildingRoadStatus.filter((item) => item.adjacentRoadKeys.length === 0).length,
    disconnectedEntrances: buildingRoadStatus
      .filter((item) => item.adjacentRoadKeys.length > 0 && !item.touchesMainNetwork)
      .length,
    isolatedRoadNetworks,
    suggestedRoadLinks: suggestedRoadLinks.length,
  })
}

export function withRecommendationExecutionOverlay(
  overlay: StageAdvisorOverlay | undefined,
  recommendation: Readonly<StageGovernanceRecommendation> | undefined,
  id = Date.now(),
): StageAdvisorOverlay | undefined {
  const roadPlan = recommendation?.roadPlan
  if (roadPlan && roadPlan.cells.length > 0) {
    const cells: StageAdvisorOverlayCell[] = [
      ...roadPlan.cells.map((cell) => ({
        kind: 'road' as const,
        label: cell.kind === 'bridge' ? '桥梁' : '道路',
        position: cell.point,
        status: cell.kind === 'bridge' ? 'bridge' as const : 'planned' as const,
      })),
      ...(overlay?.cells ?? []),
    ]
    return compactOverlay(
      id,
      overlay?.label ?? '推荐补线位置',
      overlay?.points ?? [],
      overlay?.paths ?? [],
      overlay?.areas ?? [],
      [
        `补线 ${roadPlan.cells.length} 格`,
        `预计银两 ${roadPlan.treasuryCost}`,
        ...(overlay?.summary ?? []),
      ],
      overlay?.metrics ?? {},
      cells,
    )
  }
  const execution = recommendation?.execution
  if (!execution?.candidate) return overlay
  const cells: StageAdvisorOverlayCell[] = [
    ...(execution.footprint ?? []).map((position) => ({
      kind: 'placement' as const,
      label: '占地',
      position,
      status: 'footprint' as const,
    })),
    ...(execution.entrance ? [{
      kind: 'placement' as const,
      label: '入口',
      position: execution.entrance,
      status: 'entrance' as const,
    }] : []),
    ...(overlay?.cells ?? []),
  ]
  const points: StageAdvisorOverlayPoint[] = [
    {
      kind: 'placement',
      label: '建议落点',
      position: execution.candidate,
    },
    ...(execution.entrance ? [{
      kind: 'placement' as const,
      label: '入口',
      position: execution.entrance,
    }] : []),
    ...(overlay?.points ?? []),
  ]
  return compactOverlay(
    id,
    overlay?.label ?? '推荐营造位置',
    points,
    overlay?.paths ?? [],
    overlay?.areas ?? [],
    [
      recommendation?.buildingType ? `推荐 ${BUILDING_DEFINITIONS[recommendation.buildingType]?.name ?? recommendation.buildingType}` : '推荐营造',
      ...(overlay?.summary ?? []),
    ],
    overlay?.metrics ?? {},
    cells,
  )
}

function compactOverlay(
  id: number,
  label: string,
  points: StageAdvisorOverlayPoint[],
  paths: StageAdvisorOverlayPath[] = [],
  areas: StageAdvisorOverlayArea[] = [],
  summary: string[] = [],
  metrics: Record<string, number> = {},
  cells: StageAdvisorOverlayCell[] = [],
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
  const cellSeen = new Set<string>()
  const uniqueCells = cells.filter((cell) => {
    const key = `${cell.kind}:${cell.status}:${Math.round(cell.position.x * 100) / 100},${Math.round(cell.position.y * 100) / 100}`
    if (cellSeen.has(key)) return false
    cellSeen.add(key)
    return true
  })
  if (
    unique.length === 0
    && uniquePaths.length === 0
    && uniqueAreas.length === 0
    && uniqueCells.length === 0
  ) return undefined
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
  const limitedCells = uniqueCells.slice(0, 24).map((cell) => ({
    kind: cell.kind,
    label: cell.label,
    position: { ...cell.position },
    status: cell.status,
  }))
  if (limitedCells.length > 0) overlay.cells = limitedCells
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

function roadDisconnectedLabel(type: string): string {
  const definition = BUILDING_DEFINITIONS[type]
  if (type === 'house' || definition?.functions?.includes('housing')) return '未连通住宅'
  if (definition?.functions?.some((fn) => fn === 'service' || fn === 'market' || fn === 'culture')) return '未连通服务'
  if (definition?.functions?.includes('storage')) return '未连通仓储'
  if (definition?.functions?.some((fn) => fn === 'production' || fn === 'employment')) return '未连通生产'
  return '未连通'
}

function diagnoseRoadConnectivity(roadCells: ReadonlyArray<SimulationSnapshot['cells'][number]>): {
  roadKeys: ReadonlySet<string>
  components: ReadonlyArray<ReadonlySet<string>>
  mainComponentKeys: ReadonlySet<string>
} {
  const roadKeys = new Set(roadCells.map((cell) => pointKey(cell.point)))
  const visited = new Set<string>()
  const components: Set<string>[] = []
  const roadPointByKey = new Map(roadCells.map((cell) => [pointKey(cell.point), cell.point]))

  for (const cell of roadCells) {
    const startKey = pointKey(cell.point)
    if (visited.has(startKey)) continue
    const component = new Set<string>()
    const queue = [cell.point]
    visited.add(startKey)
    while (queue.length > 0) {
      const current = queue.shift()
      if (!current) continue
      component.add(pointKey(current))
      for (const neighbor of cardinalNeighborPoints(current)) {
        const neighborKey = pointKey(neighbor)
        if (!roadKeys.has(neighborKey) || visited.has(neighborKey)) continue
        visited.add(neighborKey)
        const roadPoint = roadPointByKey.get(neighborKey)
        if (roadPoint) queue.push(roadPoint)
      }
    }
    components.push(component)
  }

  const sortedComponents = components.sort((left, right) => (
    right.size - left.size || smallestKey(left).localeCompare(smallestKey(right))
  ))
  return {
    roadKeys,
    components: sortedComponents,
    mainComponentKeys: sortedComponents[0] ?? new Set<string>(),
  }
}

function adjacentRoadCellKeys(point: GridPoint, roadKeys: ReadonlySet<string>): string[] {
  return cardinalNeighborPoints(point)
    .map(pointKey)
    .filter((key) => roadKeys.has(key))
}

function suggestRoadNetworkLinks(
  roadConnectivity: ReturnType<typeof diagnoseRoadConnectivity>,
  cells: readonly SimulationSnapshot['cells'][number][],
): StageAdvisorOverlayPath[] {
  if (roadConnectivity.components.length <= 1) return []
  const terrainByKey = new Map(cells.map((cell) => [pointKey(cell.point), cell.terrain]))
  return roadConnectivity.components
    .slice(1)
    .flatMap((component) => {
      const pair = nearestRoadPair(component, roadConnectivity.mainComponentKeys)
      if (!pair) return []
      return [{
        kind: 'road' as const,
        label: crossesWaterOrShore(pair.from, pair.to, terrainByKey) ? '建议补桥' : '建议接路',
        from: pair.from,
        to: pair.to,
      }]
    })
    .slice(0, 4)
}

function roadLinkConstructionPlan(
  path: StageAdvisorOverlayPath,
  snapshot: Pick<SimulationSnapshot, 'cells' | 'economy'>,
): NonNullable<StageGovernanceRecommendation['roadPlan']> {
  const cellByKey = new Map(snapshot.cells.map((cell) => [pointKey(cell.point), cell]))
  const cells = straightGridLine(path.from, path.to)
    .slice(1, -1)
    .flatMap((point) => {
      const cell = cellByKey.get(pointKey(point))
      if (cell?.road) return []
      const kind: RoadKind = cell?.terrain === 'water' || cell?.terrain === 'shore'
        ? 'bridge'
        : 'stone'
      return [{
        point,
        kind,
        treasuryCost: roadConstructionCost(kind).treasury,
      }]
    })
  const treasuryCost = cells.reduce((sum, cell) => sum + cell.treasuryCost, 0)
  const missingTreasury = Math.max(0, treasuryCost - snapshot.economy.treasury)
  return {
    from: path.from,
    to: path.to,
    cells,
    roadCells: cells.filter((cell) => cell.kind !== 'bridge').length,
    bridgeCells: cells.filter((cell) => cell.kind === 'bridge').length,
    treasuryCost,
    missingTreasury,
    canAfford: missingTreasury === 0,
  }
}

function nearestRoadPair(
  fromKeys: ReadonlySet<string>,
  toKeys: ReadonlySet<string>,
): { from: GridPoint; to: GridPoint } | undefined {
  let best: { from: GridPoint; to: GridPoint; distance: number; key: string } | undefined
  for (const fromKey of fromKeys) {
    const from = parseGridPointKey(fromKey)
    for (const toKey of toKeys) {
      const to = parseGridPointKey(toKey)
      const distance = Math.abs(from.x - to.x) + Math.abs(from.y - to.y)
      const key = `${distance}:${fromKey}->${toKey}`
      if (!best || distance < best.distance || key.localeCompare(best.key) < 0) {
        best = { from, to, distance, key }
      }
    }
  }
  return best && { from: best.from, to: best.to }
}

function crossesWaterOrShore(
  from: GridPoint,
  to: GridPoint,
  terrainByKey: ReadonlyMap<string, string>,
): boolean {
  const path = straightGridLine(from, to)
  return path
    .slice(1, -1)
    .some((point) => {
      const terrain = terrainByKey.get(pointKey(point))
      return terrain === 'water' || terrain === 'shore'
    })
}

function straightGridLine(from: GridPoint, to: GridPoint): GridPoint[] {
  const points: GridPoint[] = [{ ...from }]
  let current = { ...from }
  while (current.x !== to.x) {
    current = { x: current.x + Math.sign(to.x - current.x), y: current.y }
    points.push({ ...current })
  }
  while (current.y !== to.y) {
    current = { x: current.x, y: current.y + Math.sign(to.y - current.y) }
    points.push({ ...current })
  }
  return points
}

function cardinalNeighborPoints(point: GridPoint): GridPoint[] {
  return [
    { x: point.x + 1, y: point.y },
    { x: point.x - 1, y: point.y },
    { x: point.x, y: point.y + 1 },
    { x: point.x, y: point.y - 1 },
  ]
}

function smallestKey(keys: ReadonlySet<string>): string {
  return [...keys].sort((left, right) => left.localeCompare(right))[0] ?? ''
}

function parseGridPointKey(key: string): GridPoint {
  const [x, y] = key.split(',').map(Number)
  return { x, y }
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

export function explainStageRecommendationAvailability(
  recommendation: StageGovernanceRecommendation,
  snapshot: Pick<SimulationSnapshot, 'metrics' | 'cells' | 'buildings' | 'economy'>,
): StageGovernanceRecommendation {
  if (recommendation.tool !== 'building' || !recommendation.buildingType) return recommendation
  const definition = BUILDING_DEFINITIONS[recommendation.buildingType]
  if (!definition) return recommendation
  const currentStage = deriveRuntimeCityStage(snapshot.metrics)
  const requiredStage = definition.cityStage ?? 'water-town'
  const currentStageLabel = CITY_STAGE_LABELS[currentStage]
  const requiredStageLabel = CITY_STAGE_LABELS[requiredStage]
  if (isRuntimeBuildingUnlocked(recommendation.buildingType, currentStage)) {
    return {
      ...recommendation,
      availability: {
        unlocked: true,
        currentStageLabel,
        requiredStageLabel,
      },
      execution: diagnoseBuildingRecommendationExecution(recommendation.buildingType, snapshot),
    }
  }
  return {
    label: `先解锁${requiredStageLabel}`,
    tool: 'inspect',
    overlayMode: recommendation.overlayMode,
    availability: {
      unlocked: false,
      currentStageLabel,
      requiredStageLabel,
      reason: `${definition.name}需要进入${requiredStageLabel}后营造，当前阶段是${currentStageLabel}。`,
    },
  }
}

function actionWithAvailability(action: string, recommendation: StageGovernanceRecommendation): string {
  if (recommendation.availability?.unlocked === false && recommendation.availability.reason) {
    return `${recommendation.availability.reason}先查看相关图层，用道路分流或已解锁建筑临时缓解。`
  }
  if (recommendation.execution?.buildable === false) {
    return `${action} ${recommendation.execution.reason}`
  }
  return action
}

function withServiceGapExecution(
  recommendation: StageGovernanceRecommendation,
  snapshot: Pick<SimulationSnapshot, 'cells' | 'buildings' | 'economy'>,
): StageGovernanceRecommendation {
  if (recommendation.tool !== 'building' || recommendation.buildingType !== 'market') return recommendation
  if (recommendation.availability?.unlocked === false) return recommendation
  const execution = diagnoseServiceGapMarketExecution(snapshot)
  return { ...recommendation, execution }
}

function diagnoseServiceGapMarketExecution(
  snapshot: Pick<SimulationSnapshot, 'cells' | 'buildings' | 'economy'>,
): NonNullable<StageGovernanceRecommendation['execution']> {
  const base = diagnoseBuildingRecommendationExecution('market', snapshot)
  if (!base.buildable) return base
  const definition = BUILDING_DEFINITIONS.market
  const cells = new Map(snapshot.cells.map((cell) => [pointBucket(cell.point), cell]))
  const homes = Object.values(snapshot.buildings).filter((building) => building.type === 'house')
  const serviceAreas = Object.values(snapshot.buildings)
    .filter((building) => {
      const buildingDefinition = BUILDING_DEFINITIONS[building.type]
      return building.status !== 'blocked'
        && buildingDefinition?.functions?.some((fn) => fn === 'service' || fn === 'market' || fn === 'culture')
    })
    .map((building) => ({
      center: building.entrance,
      radius: serviceRadius(building.level),
    }))
  const currentGaps = countServiceGaps(homes, serviceAreas)
  let best: (NonNullable<StageGovernanceRecommendation['execution']> & { gapCount: number; key: string }) | undefined
  let landCandidates = 0
  for (const originCell of snapshot.cells) {
    const origin = originCell.point
    const footprint = definition.footprint.map((point) => ({
      x: origin.x + point.x,
      y: origin.y + point.y,
    }))
    const footprintOk = footprint.every((point) => {
      const cell = cells.get(pointBucket(point))
      return cell
        && (cell.terrain === 'land' || cell.terrain === 'shore')
        && !cell.road
        && !cell.buildingId
    })
    if (!footprintOk) continue
    landCandidates += 1
    const entrance = {
      x: origin.x + definition.entrance.x,
      y: origin.y + definition.entrance.y,
    }
    if (!hasAdjacentRoad(cells, entrance)) continue
    const gapCount = countServiceGaps(homes, [
      ...serviceAreas,
      { center: entrance, radius: serviceRadius(1) },
    ])
    const key = `${gapCount}:${pointBucket(origin)}`
    if (gapCount < currentGaps && (!best || gapCount < best.gapCount || key.localeCompare(best.key) < 0)) {
      best = {
        buildable: true,
        reason: '已找到能减少服务缺口的市场落点，可切换到营造工具试放。',
        candidate: origin,
        entrance,
        footprint,
        rotation: 0,
        landCandidates,
        roadAnchors: base.roadAnchors,
        gapCount,
        key,
      }
    }
  }
  return best ?? base
}

function countServiceGaps(
  homes: ReadonlyArray<Pick<SimulationSnapshot['buildings'][string], 'entrance'>>,
  serviceAreas: ReadonlyArray<{ center: GridPoint; radius: number }>,
): number {
  return homes
    .filter((home) => !serviceAreas.some((area) => isNear(area.center, home.entrance, area.radius)))
    .length
}

function diagnoseBuildingRecommendationExecution(
  buildingType: string,
  snapshot: Pick<SimulationSnapshot, 'cells' | 'buildings' | 'economy'>,
): NonNullable<StageGovernanceRecommendation['execution']> {
  const definition = BUILDING_DEFINITIONS[buildingType]
  const roadAnchors = snapshot.cells.filter((cell) => Boolean(cell.road)).length
  if (!definition || snapshot.cells.length === 0) {
    return {
      buildable: false,
      reason: '当前快照没有可评估地图地块，先查看图层定位问题。',
      landCandidates: 0,
      roadAnchors,
    }
  }
  const affordability = definition
    ? quoteBuildingConstruction(
      buildingType,
      definition,
      snapshot.economy.treasury,
      snapshot.buildings,
      BUILDING_DEFINITIONS,
    )
    : undefined
  if (affordability && !affordability.canAfford) {
    return {
      buildable: false,
      reason: constructionAffordabilityReason(affordability.missingMaterials, affordability.missingTreasury),
      landCandidates: 0,
      roadAnchors,
      missingMaterials: affordability.missingMaterials,
      missingTreasury: affordability.missingTreasury,
    }
  }
  const cells = new Map(snapshot.cells.map((cell) => [pointBucket(cell.point), cell]))
  let landCandidates = 0
  for (const originCell of snapshot.cells) {
    const origin = originCell.point
    const footprint = definition.footprint.map((point) => ({
      x: origin.x + point.x,
      y: origin.y + point.y,
    }))
    const footprintOk = footprint.every((point) => {
      const cell = cells.get(pointBucket(point))
      return cell
        && (cell.terrain === 'land' || cell.terrain === 'shore')
        && !cell.road
        && !cell.buildingId
    })
    if (!footprintOk) continue
    landCandidates += 1
    const entrance = {
      x: origin.x + definition.entrance.x,
      y: origin.y + definition.entrance.y,
    }
    if (hasAdjacentRoad(cells, entrance)) {
      return {
        buildable: true,
        reason: '已找到空地和道路入口，可切换到营造工具试放。',
        candidate: origin,
        entrance,
        footprint,
        rotation: 0,
        landCandidates,
        roadAnchors,
      }
    }
  }
  if (landCandidates === 0) {
    return {
      buildable: false,
      reason: '当前没有足够连续空地，先清理占用或扩展道路旁地块。',
      landCandidates,
      roadAnchors,
    }
  }
  return {
    buildable: false,
    reason: '已有空地但入口未贴近道路，先铺一段连接路再营造。',
    landCandidates,
    roadAnchors,
  }
}

function constructionAffordabilityReason(
  missingMaterials: Partial<Record<string, number>>,
  missingTreasury: number,
): string {
  const parts = [
    missingTreasury > 0 ? `银两不足${missingTreasury}` : '',
    Object.entries(missingMaterials)
      .filter((entry): entry is [string, number] => typeof entry[1] === 'number' && entry[1] > 0)
      .map(([resource, amount]) => `${resourceName(resource)}×${amount}`)
      .join('、'),
  ].filter(Boolean)
  return parts.length > 0
    ? `营造资源不足：${parts.join('，')}。`
    : '营造资源不足。'
}

function resourceName(resource: string): string {
  return ({
    food: '粮食',
    fish: '鱼获',
    wood: '木料',
    stone: '石料',
    clay: '黏土',
    brick: '砖瓦',
    cloth: '布匹',
    salt: '盐',
    medicine: '药材',
  } as Record<string, string>)[resource] ?? resource
}

function hasAdjacentRoad(cells: ReadonlyMap<string, { road?: unknown }>, point: GridPoint): boolean {
  return [
    { x: point.x + 1, y: point.y },
    { x: point.x - 1, y: point.y },
    { x: point.x, y: point.y + 1 },
    { x: point.x, y: point.y - 1 },
  ].some((candidate) => Boolean(cells.get(pointBucket(candidate))?.road))
}

function activityPressureRecommendation(input: {
  roadPressure: number
  serviceHeat: number
  cargoCongestion: number
  targetLabel?: string
}): Pick<StageGovernanceCard, 'action' | 'metricLabel' | 'recommendation'> {
  if (
    input.cargoCongestion >= 2
    && (input.cargoCongestion >= input.serviceHeat || input.targetLabel?.startsWith('货路'))
  ) {
    return {
      action: '在货路热区附近补仓储或调整仓储位置，给产地和市场之间增加缓冲。',
      metricLabel: '货拥',
      recommendation: {
        label: '补仓储缓冲',
        tool: 'building',
        buildingType: 'granary',
        overlayMode: 'activity',
      },
    }
  }
  if (input.serviceHeat >= 3 || input.targetLabel?.startsWith('服路')) {
    return {
      action: '在服务热区附近补市场、医馆或文化服务点，减少居民跨区排队。',
      metricLabel: '服务热',
      recommendation: {
        label: '补服务点分流',
        tool: 'building',
        buildingType: 'market',
        overlayMode: 'activity',
      },
    }
  }
  return {
    action: '在道压热区旁补平行道路或短连线，让通勤和返家路线分流。',
    metricLabel: '道压',
    recommendation: {
      label: '铺路分流',
      tool: 'road',
      overlayMode: 'activity',
    },
  }
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
