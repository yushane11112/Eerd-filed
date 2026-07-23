import { Container } from 'pixi.js'
import type { AgentEntity, EntityId, SimulationSnapshot } from '../simulation/contracts'
import { applyCameraTransform, gridPointVisible } from './culling'
import { DEFAULT_ISO_METRICS } from './isometric'
import { createSceneLayers, type SceneLayers } from './layers'
import { ObjectPool } from './ObjectPool'
import type { PrefabRuntimeRegistry } from './prefab'
import type { BuildingArtworkProvider } from './artwork/buildingArtwork'
import type { BuildingAnimationDriverOptions, BuildingAnimationProvider } from './artwork/buildingAnimation'
import type {
  EntityVisual,
  IsoMetrics,
  SceneCamera,
  SceneSyncPerformanceProfile,
  SceneSyncStats,
} from './types'
import { AgentVisual, BuildingVisual, DistrictProsperityVisual, DropVisual } from './visuals'

function isTransport(agent: Readonly<AgentEntity>): boolean {
  return agent.role === 'carrier' || agent.role === 'cart' || agent.role === 'boat'
}

function migrationCandidateVisualId(id: EntityId): EntityId {
  return `migration-candidate:${id}`
}

export interface DynamicSceneOptions {
  prefabRegistry?: PrefabRuntimeRegistry
  buildingArtworkProvider?: BuildingArtworkProvider
  buildingAnimationProvider?: BuildingAnimationProvider
  buildingAnimationOptions?: BuildingAnimationDriverOptions
  staticBuildingCache?: boolean
  onSyncProfile?: (profile: SceneSyncPerformanceProfile) => void
}

export class DynamicScene {
  readonly root = new Container({ label: 'dynamic-city-scene' })
  readonly world = new Container({ label: 'dynamic-city-world' })
  readonly layers: SceneLayers

  private readonly metrics: Readonly<IsoMetrics>
  private readonly buildingPool: ObjectPool<BuildingVisual>
  private readonly districtPool: ObjectPool<DistrictProsperityVisual>
  private readonly residentPool: ObjectPool<AgentVisual>
  private readonly transportPool: ObjectPool<AgentVisual>
  private readonly dropPool: ObjectPool<DropVisual>
  private readonly active = new Map<EntityId, EntityVisual>()
  private readonly onSyncProfile?: (profile: SceneSyncPerformanceProfile) => void
  private lastSnapshot: Readonly<SimulationSnapshot> | null = null
  private lastSnapshotTick: number | null = null
  private lastBuildings: Readonly<SimulationSnapshot['buildings']> | null = null
  private lastAgents: Readonly<SimulationSnapshot['agents']> | null = null
  private lastDrops: Readonly<SimulationSnapshot['worldDrops']> | null = null
  private lastDistricts: Readonly<SimulationSnapshot['districts']> | null = null
  private lastMigrationCandidates: Readonly<SimulationSnapshot['migrationCandidates']> | null = null
  private lastCameraKey: string | null = null
  private lastStats: SceneSyncStats | null = null

  constructor(
    metrics: Readonly<IsoMetrics> = DEFAULT_ISO_METRICS,
    options: Readonly<DynamicSceneOptions> = {},
  ) {
    this.metrics = metrics
    this.onSyncProfile = options.onSyncProfile
    this.root.addChild(this.world)
    this.layers = createSceneLayers(this.world)
    this.buildingPool = new ObjectPool(
      () => new BuildingVisual(
        metrics,
      options.prefabRegistry,
      options.buildingArtworkProvider,
      options.buildingAnimationProvider,
      options.buildingAnimationOptions,
      options.staticBuildingCache,
      ),
      16,
      256,
    )
    this.districtPool = new ObjectPool(() => new DistrictProsperityVisual(metrics), 8, 64)
    this.residentPool = new ObjectPool(() => new AgentVisual(metrics, 'resident'), 32, 512)
    this.transportPool = new ObjectPool(() => new AgentVisual(metrics, 'transport'), 12, 256)
    this.dropPool = new ObjectPool(() => new DropVisual(metrics), 12, 64)
  }

  sync(
    snapshot: Readonly<SimulationSnapshot>,
    camera: Readonly<SceneCamera>,
    interpolationAlpha = 0,
  ): SceneSyncStats {
    const profileStart = this.onSyncProfile ? performance.now() : 0
    const cameraKey = `${camera.x}|${camera.y}|${camera.zoom}|${camera.viewportWidth}|${camera.viewportHeight}`
    let phaseStart = profileStart
    let districtsMs = 0
    let buildingsMs = 0
    let residentsMs = 0
    let dropsMs = 0
    applyCameraTransform(this.world, camera)

    // The ticker runs more often than the simulation clock. Replaying every
    // Graphics.clear()/path command for 300 buildings on unchanged snapshots
    // creates CPU and driver pressure without changing a pixel.
    const snapshotVisualsUnchanged = snapshot === this.lastSnapshot
      && snapshot.tick === this.lastSnapshotTick
      && snapshot.buildings === this.lastBuildings
      && snapshot.agents === this.lastAgents
      && snapshot.worldDrops === this.lastDrops
      && snapshot.districts === this.lastDistricts
      && snapshot.migrationCandidates === this.lastMigrationCandidates

    if (snapshotVisualsUnchanged && cameraKey === this.lastCameraKey && this.lastStats) {
      this.onSyncProfile?.({
        totalMs: performance.now() - profileStart,
        districtsMs: 0,
        buildingsMs: 0,
        residentsMs: 0,
        dropsMs: 0,
        cleanupMs: 0,
        sortMs: 0,
        buildings: this.lastStats.buildings,
        residents: this.lastStats.residents,
        transport: this.lastStats.transport,
        drops: this.lastStats.drops,
        visible: this.lastStats.visible,
        pooled: this.lastStats.pooled,
      })
      return this.lastStats
    }

    if (snapshotVisualsUnchanged && this.lastStats) {
      let visible = 0
      for (const visual of this.active.values()) {
        const wasVisible = visual.display.visible
        const isVisible = this.applyVisibility(visual, camera)
        if (isVisible && !wasVisible) visual.update(snapshot, 0)
        visible += isVisible
      }
      const stats = { ...this.lastStats, visible }
      this.lastCameraKey = cameraKey
      this.lastStats = stats
      this.onSyncProfile?.({
        totalMs: performance.now() - profileStart,
        districtsMs: 0,
        buildingsMs: 0,
        residentsMs: 0,
        dropsMs: 0,
        cleanupMs: 0,
        sortMs: 0,
        buildings: stats.buildings,
        residents: stats.residents,
        transport: stats.transport,
        drops: stats.drops,
        visible: stats.visible,
        pooled: stats.pooled,
      })
      return stats
    }

    const expected = new Set<EntityId>()
    let visible = 0
    let buildings = 0
    let districts = 0
    let residents = 0
    let transport = 0

    for (const district of snapshot.districts ?? []) {
      expected.add(district.id)
      const visual = this.ensureDistrict(district.id)
      visible += this.syncVisual(visual, district.center, snapshot, camera, interpolationAlpha)
      districts += 1
    }
    if (this.onSyncProfile) {
      districtsMs = performance.now() - phaseStart
      phaseStart = performance.now()
    }

    for (const building of Object.values(snapshot.buildings)) {
      expected.add(building.id)
      const visual = this.ensureBuilding(building.id)
      visible += this.syncVisual(visual, building.origin, snapshot, camera, interpolationAlpha)
      buildings += 1
    }
    if (this.onSyncProfile) {
      buildingsMs = performance.now() - phaseStart
      phaseStart = performance.now()
    }

    for (const agent of Object.values(snapshot.agents)) {
      expected.add(agent.id)
      const agentIsTransport = isTransport(agent)
      const visual = this.ensureAgent(agent.id, agentIsTransport)
      const next = agent.path[Math.min(agent.pathIndex + 1, agent.path.length - 1)]
      const position = next
        ? {
            x: agent.position.x + (next.x - agent.position.x) * interpolationAlpha,
            y: agent.position.y + (next.y - agent.position.y) * interpolationAlpha,
          }
        : agent.position
      visible += this.syncVisual(visual, position, snapshot, camera, interpolationAlpha)
      if (agentIsTransport) transport += 1
      else residents += 1
    }

    for (const candidate of Object.values(snapshot.migrationCandidates ?? {})) {
      const visualId = migrationCandidateVisualId(candidate.id)
      expected.add(visualId)
      const visual = this.ensureAgent(visualId, false)
      visible += this.syncVisual(visual, candidate.position, snapshot, camera, interpolationAlpha)
      residents += 1
    }
    if (this.onSyncProfile) {
      residentsMs = performance.now() - phaseStart
      phaseStart = performance.now()
    }

    for (const drop of snapshot.worldDrops) {
      expected.add(drop.id)
      const visual = this.ensureDrop(drop.id)
      visible += this.syncVisual(visual, drop.position, snapshot, camera, interpolationAlpha)
    }
    if (this.onSyncProfile) {
      dropsMs = performance.now() - phaseStart
      phaseStart = performance.now()
    }

    const cleanupStart = phaseStart
    for (const [id, visual] of [...this.active]) {
      if (!expected.has(id)) this.release(id, visual)
    }
    const cleanupMs = this.onSyncProfile ? performance.now() - cleanupStart : 0

    const sortStart = this.onSyncProfile ? performance.now() : 0
    this.sortDynamicLayers()
    if (this.onSyncProfile) {
      const end = performance.now()
      this.onSyncProfile({
        totalMs: end - profileStart,
        districtsMs,
        buildingsMs,
        residentsMs,
        dropsMs,
        cleanupMs,
        sortMs: end - sortStart,
        buildings,
        residents,
        transport,
        drops: snapshot.worldDrops.length,
        visible,
        pooled: this.buildingPool.pooledCount
          + this.districtPool.pooledCount
          + this.residentPool.pooledCount
          + this.transportPool.pooledCount
          + this.dropPool.pooledCount,
      })
    }
    const stats = {
      buildings,
      districts,
      residents,
      transport,
      drops: snapshot.worldDrops.length,
      visible,
      pooled: this.buildingPool.pooledCount
        + this.districtPool.pooledCount
        + this.residentPool.pooledCount
        + this.transportPool.pooledCount
        + this.dropPool.pooledCount,
    }
    this.lastSnapshot = snapshot
    this.lastSnapshotTick = snapshot.tick
    this.lastBuildings = snapshot.buildings
    this.lastAgents = snapshot.agents
    this.lastDrops = snapshot.worldDrops
    this.lastDistricts = snapshot.districts
    this.lastMigrationCandidates = snapshot.migrationCandidates
    this.lastCameraKey = cameraKey
    this.lastStats = stats
    return stats
  }

  destroy(): void {
    for (const [id, visual] of [...this.active]) this.release(id, visual)
    this.lastSnapshot = null
    this.lastSnapshotTick = null
    this.lastBuildings = null
    this.lastAgents = null
    this.lastDrops = null
    this.lastDistricts = null
    this.lastMigrationCandidates = null
    this.lastCameraKey = null
    this.lastStats = null
    this.root.destroy({ children: true })
  }

  private ensureBuilding(id: EntityId): BuildingVisual {
    const existing = this.active.get(id)
    if (existing instanceof BuildingVisual) return existing
    if (existing) this.release(id, existing)
    const visual = this.buildingPool.acquire()
    visual.entityId = id
    visual.display.visible = true
    visual.display.renderable = true
    this.layers.buildings.addChild(visual.display)
    this.active.set(id, visual)
    return visual
  }

  private ensureDistrict(id: EntityId): DistrictProsperityVisual {
    const existing = this.active.get(id)
    if (existing instanceof DistrictProsperityVisual) return existing
    if (existing) this.release(id, existing)
    const visual = this.districtPool.acquire()
    visual.entityId = id
    visual.display.visible = true
    visual.display.renderable = true
    this.layers.districts.addChild(visual.display)
    this.active.set(id, visual)
    return visual
  }

  private ensureAgent(id: EntityId, transport: boolean): AgentVisual {
    const existing = this.active.get(id)
    if (existing instanceof AgentVisual && existing.kind === (transport ? 'transport' : 'resident')) {
      return existing
    }
    if (existing) this.release(id, existing)
    const visual = transport ? this.transportPool.acquire() : this.residentPool.acquire()
    visual.entityId = id
    visual.display.visible = true
    visual.display.renderable = true
    const layer = transport ? this.layers.transport : this.layers.residents
    layer.addChild(visual.display)
    this.active.set(id, visual)
    return visual
  }

  private ensureDrop(id: EntityId): DropVisual {
    const existing = this.active.get(id)
    if (existing instanceof DropVisual) return existing
    if (existing) this.release(id, existing)
    const visual = this.dropPool.acquire()
    visual.entityId = id
    visual.display.visible = true
    visual.display.renderable = true
    this.layers.drops.addChild(visual.display)
    this.active.set(id, visual)
    return visual
  }

  private applyVisibility(visual: EntityVisual, camera: Readonly<SceneCamera>): number {
    const visible = gridPointVisible(visual.worldPosition, camera, this.metrics)
    visual.display.visible = visible
    visual.display.renderable = visible
    return visible ? 1 : 0
  }

  private syncVisual(
    visual: EntityVisual,
    position: { x: number; y: number },
    snapshot: Readonly<SimulationSnapshot>,
    camera: Readonly<SceneCamera>,
    interpolationAlpha: number,
  ): number {
    const visible = gridPointVisible(position, camera, this.metrics)
    if (!visible) {
      // Keep the latest world coordinate so a later camera move can reveal and
      // refresh the pooled visual without rebuilding it while off-screen.
      visual.worldPosition = position
      visual.display.visible = false
      visual.display.renderable = false
      return 0
    }
    visual.update(snapshot, interpolationAlpha)
    return this.applyVisibility(visual, camera)
  }

  private release(id: EntityId, visual: EntityVisual): void {
    this.active.delete(id)
    if (visual instanceof BuildingVisual) this.buildingPool.release(visual)
    else if (visual instanceof DistrictProsperityVisual) this.districtPool.release(visual)
    else if (visual instanceof DropVisual) this.dropPool.release(visual)
    else if (visual.kind === 'transport') this.transportPool.release(visual as AgentVisual)
    else this.residentPool.release(visual as AgentVisual)
  }

  private sortDynamicLayers(): void {
    this.layers.buildings.sortChildren()
    this.layers.residents.sortChildren()
    this.layers.transport.sortChildren()
    this.layers.drops.sortChildren()
  }
}
