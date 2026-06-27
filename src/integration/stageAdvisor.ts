import type { GridPoint, SimulationSnapshot } from '../simulation/contracts'
import { BUILDING_DEFINITIONS } from '../content/runtimeBuildings'

export type StageRequirementId = 'population' | 'attraction' | 'activeDistricts'
export type StageAdvisorOverlayMode = 'housing' | 'service' | 'logistics' | 'roads'
export type StageAdvisorOverlayKind =
  | 'housing'
  | 'migration'
  | 'bottleneck'
  | 'district'
  | 'service'
  | 'logistics'
  | 'road'

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

export interface StageAdvisorOverlay {
  id: number
  label: string
  points: StageAdvisorOverlayPoint[]
  paths?: StageAdvisorOverlayPath[]
}

export const STAGE_ADVISOR_OVERLAY_MODES: ReadonlyArray<{
  mode: StageAdvisorOverlayMode
  label: string
}> = [
  { mode: 'housing', label: '住房' },
  { mode: 'service', label: '服务' },
  { mode: 'logistics', label: '物流' },
  { mode: 'roads', label: '道路' },
]

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
    return compactOverlay(id, '住房容量', Object.values(snapshot.buildings)
      .filter((building) => building.type === 'house')
      .map((building) => {
        const capacity = BUILDING_DEFINITIONS[building.type]?.capacity ?? 0
        const used = householdCounts.get(building.id) ?? 0
        return {
          kind: 'housing' as const,
          label: capacity > used ? `空${capacity - used}` : '满员',
          position: building.entrance,
        }
      }))
  }

  if (mode === 'service') {
    return compactOverlay(id, '服务覆盖', Object.values(snapshot.buildings)
      .filter((building) => {
        const definition = BUILDING_DEFINITIONS[building.type]
        return definition?.functions?.some((fn) => fn === 'service' || fn === 'market' || fn === 'culture')
      })
      .map((building) => ({
        kind: 'service' as const,
        label: building.status === 'blocked' ? '服务停摆' : '服务点',
        position: building.entrance,
      })))
  }

  if (mode === 'logistics') {
    const activeOrders = Object.values(snapshot.logisticsOrders)
      .filter((order) => order.state !== 'delivered')
    return compactOverlay(id, '物流线路', activeOrders.flatMap((order) => {
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
    }), activeOrders.flatMap((order) => {
      const source = snapshot.buildings[order.sourceBuildingId]
      const destination = snapshot.buildings[order.destinationBuildingId]
      if (!source || !destination) return []
      return [{
        kind: 'logistics' as const,
        label: order.state === 'cancelled' ? '失败线路' : `${order.resource} x${order.amount}`,
        from: source.entrance,
        to: destination.entrance,
      }]
    }))
  }

  return compactOverlay(id, '道路连通', [
    ...snapshot.cells
      .filter((cell) => cell.road)
      .slice(0, 8)
      .map((cell) => ({
        kind: 'road' as const,
        label: cell.road === 'bridge' ? '桥' : '道路',
        position: cell.point,
      })),
    ...Object.values(snapshot.buildings)
      .filter((building) => !snapshot.cells.some((cell) => cell.road && isNear(cell.point, building.entrance, 1)))
      .slice(0, 4)
      .map((building) => ({
        kind: 'road' as const,
        label: '缺路',
        position: building.entrance,
      })),
  ])
}

function compactOverlay(
  id: number,
  label: string,
  points: StageAdvisorOverlayPoint[],
  paths: StageAdvisorOverlayPath[] = [],
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
  if (unique.length === 0 && uniquePaths.length === 0) return undefined
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
  return overlay
}

function isNear(a: GridPoint, b: GridPoint, distance: number): boolean {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) <= distance
}
