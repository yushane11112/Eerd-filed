import type { BuildingEntity, SimulationSnapshot } from '../../simulation/contracts'
import { gridPointVisible } from '../culling'
import { DEFAULT_ISO_METRICS } from '../isometric'
import { resolvePrefabAssetIdForBuildingType } from '../prefab'
import type { IsoMetrics, SceneCamera } from '../types'

export const INITIAL_ARTWORK_LOD_TRIGGER_COUNT = 120
export const INITIAL_ARTWORK_FULL_DETAIL_BUDGET = 96
export const INITIAL_ARTWORK_BLOCKING_ASSET_BUDGET = 3

export interface BuildingArtworkPreloadPlan {
  assetIds: string[]
  deferredAssetIds: string[]
  levels: number[]
  visibleBuildings: number
  detailedBuildings: number
  totalAssetIds: number
}

export function createInitialBuildingArtworkPreloadPlan(
  snapshot: Readonly<SimulationSnapshot>,
  camera: Readonly<SceneCamera>,
  metrics: Readonly<IsoMetrics> = DEFAULT_ISO_METRICS,
): BuildingArtworkPreloadPlan {
  const allAssetIds = collectArtworkAssetIds(Object.values(snapshot.buildings))
  if (camera.viewportWidth <= 0 || camera.viewportHeight <= 0) {
    return {
      assetIds: allAssetIds,
      deferredAssetIds: [],
      levels: collectArtworkLevels(Object.values(snapshot.buildings)),
      visibleBuildings: Object.keys(snapshot.buildings).length,
      detailedBuildings: Object.keys(snapshot.buildings).length,
      totalAssetIds: allAssetIds.length,
    }
  }

  const visibleBuildings = Object.values(snapshot.buildings)
    .filter((building) => gridPointVisible(building.origin, camera, metrics))
  const scopedBuildings = visibleBuildings.length > 0
    ? selectDetailedBuildingsForInitialArtwork(visibleBuildings, camera)
    : Object.values(snapshot.buildings)
  const detailedAssetIds = collectArtworkAssetIds(scopedBuildings)
  return {
    assetIds: detailedAssetIds.slice(0, INITIAL_ARTWORK_BLOCKING_ASSET_BUDGET),
    deferredAssetIds: detailedAssetIds.slice(INITIAL_ARTWORK_BLOCKING_ASSET_BUDGET),
    levels: collectArtworkLevels(scopedBuildings),
    visibleBuildings: visibleBuildings.length,
    detailedBuildings: scopedBuildings.length,
    totalAssetIds: allAssetIds.length,
  }
}

function selectDetailedBuildingsForInitialArtwork(
  buildings: ReadonlyArray<Readonly<BuildingEntity>>,
  camera: Readonly<SceneCamera>,
): ReadonlyArray<Readonly<BuildingEntity>> {
  if (buildings.length <= INITIAL_ARTWORK_LOD_TRIGGER_COUNT) return buildings
  return [...buildings]
    .sort((left, right) => (
      distanceToCamera(left.origin, camera) - distanceToCamera(right.origin, camera)
      || left.id.localeCompare(right.id)
    ))
    .slice(0, INITIAL_ARTWORK_FULL_DETAIL_BUDGET)
}

function distanceToCamera(point: Readonly<{ x: number; y: number }>, camera: Readonly<SceneCamera>): number {
  const dx = point.x - camera.x
  const dy = point.y - camera.y
  return dx * dx + dy * dy
}

function collectArtworkAssetIds(buildings: ReadonlyArray<Readonly<BuildingEntity>>): string[] {
  return [...new Set(
    buildings
      .map((building) => resolvePrefabAssetIdForBuildingType(building.type))
      .filter((assetId): assetId is string => Boolean(assetId)),
  )]
}

function collectArtworkLevels(buildings: ReadonlyArray<Readonly<BuildingEntity>>): number[] {
  return [...new Set(buildings.map((building) => building.level))]
}
