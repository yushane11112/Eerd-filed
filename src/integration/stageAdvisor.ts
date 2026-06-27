import type { GridPoint, SimulationSnapshot } from '../simulation/contracts'

export type StageRequirementId = 'population' | 'attraction' | 'activeDistricts'

export interface StageAdvisorOverlay {
  id: number
  label: string
  points: GridPoint[]
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
        .map((building) => building.entrance),
      ...Object.values(snapshot.migrationCandidates ?? {})
        .map((candidate) => candidate.position),
    ])
  }

  if (requirementId === 'activeDistricts') {
    return compactOverlay(id, '街区核心', (snapshot.districts ?? [])
      .map((district) => district.center))
  }

  return compactOverlay(id, '吸引力瓶颈', [
    ...Object.values(snapshot.buildings)
      .filter((building) => building.status === 'blocked' || building.statusReason)
      .map((building) => building.entrance),
    ...Object.values(snapshot.buildings)
      .filter((building) => building.type === 'market' || building.type === 'granary')
      .map((building) => building.entrance),
  ])
}

function compactOverlay(
  id: number,
  label: string,
  points: GridPoint[],
): StageAdvisorOverlay | undefined {
  const seen = new Set<string>()
  const unique = points.filter((point) => {
    const key = `${Math.round(point.x * 100) / 100},${Math.round(point.y * 100) / 100}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  if (unique.length === 0) return undefined
  return { id, label, points: unique.slice(0, 8).map((point) => ({ ...point })) }
}

