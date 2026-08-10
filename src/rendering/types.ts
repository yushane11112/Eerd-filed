import type { Container } from 'pixi.js'
import type { EntityId, GridPoint, SimulationSnapshot } from '../simulation/contracts'

export interface IsoMetrics {
  tileWidth: number
  tileHeight: number
  elevationHeight: number
  originX: number
  originY: number
}

export interface ScreenPoint {
  x: number
  y: number
}

export interface ScreenRect {
  x: number
  y: number
  width: number
  height: number
}

export interface SceneCamera {
  x: number
  y: number
  zoom: number
  viewportWidth: number
  viewportHeight: number
}

export type SceneLayerName =
  | 'terrain'
  | 'water'
  | 'roads'
  | 'districts'
  | 'buildings'
  | 'residents'
  | 'transport'
  | 'drops'
  | 'effects'
  | 'overlays'

export type RenderEntityKind = 'building' | 'resident' | 'transport' | 'drop' | 'district'

export interface EntityVisual<T extends Container = Container> {
  readonly display: T
  entityId: EntityId | null
  kind: RenderEntityKind
  worldPosition: GridPoint
  update(snapshot: Readonly<SimulationSnapshot>, alpha: number): void
  reset(): void
}

export interface SceneSyncStats {
  buildings: number
  districts: number
  residents: number
  transport: number
  drops: number
  visible: number
  detailedBuildings: number
  reducedBuildings: number
  pooled: number
}

export interface SceneSyncPerformanceProfile {
  totalMs: number
  districtsMs: number
  buildingsMs: number
  residentsMs: number
  dropsMs: number
  cleanupMs: number
  sortMs: number
  buildings: number
  residents: number
  transport: number
  drops: number
  visible: number
  detailedBuildings: number
  reducedBuildings: number
  pooled: number
}

export interface SceneTickerPerformanceProfile {
  callbackMs: number
  cameraMs: number
  sceneSyncMs: number
  tickerDeltaMs: number
  tickerElapsedMs: number
}
