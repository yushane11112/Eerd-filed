import type { GridPoint, SimulationSnapshot } from '../simulation/contracts'

export type StageRequirementId = 'population' | 'attraction' | 'activeDistricts'
export type StageAdvisorOverlayKind = 'housing' | 'migration' | 'bottleneck' | 'district'

export interface StageAdvisorOverlayPoint {
  kind: StageAdvisorOverlayKind
  label: string
  position: GridPoint
}

export interface StageAdvisorOverlay {
  id: number
  label: string
  points: StageAdvisorOverlayPoint[]
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

function compactOverlay(
  id: number,
  label: string,
  points: StageAdvisorOverlayPoint[],
): StageAdvisorOverlay | undefined {
  const seen = new Set<string>()
  const unique = points.filter((point) => {
    const key = `${point.kind}:${Math.round(point.position.x * 100) / 100},${Math.round(point.position.y * 100) / 100}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  if (unique.length === 0) return undefined
  return {
    id,
    label,
    points: unique.slice(0, 8).map((point) => ({
      kind: point.kind,
      label: point.label,
      position: { ...point.position },
    })),
  }
}
