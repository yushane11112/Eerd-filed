import { Container } from 'pixi.js'
import type { AgentEntity, EntityId, SimulationSnapshot } from '../simulation/contracts'
import { applyCameraTransform, gridPointVisible } from './culling'
import { DEFAULT_ISO_METRICS } from './isometric'
import { createSceneLayers, type SceneLayers } from './layers'
import { ObjectPool } from './ObjectPool'
import type { PrefabRuntimeRegistry } from './prefab'
import type {
  EntityVisual,
  IsoMetrics,
  SceneCamera,
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

  constructor(
    metrics: Readonly<IsoMetrics> = DEFAULT_ISO_METRICS,
    options: Readonly<DynamicSceneOptions> = {},
  ) {
    this.metrics = metrics
    this.root.addChild(this.world)
    this.layers = createSceneLayers(this.world)
    this.buildingPool = new ObjectPool(() => new BuildingVisual(metrics, options.prefabRegistry), 16, 256)
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
    applyCameraTransform(this.world, camera)
    const expected = new Set<EntityId>()
    let visible = 0
    let buildings = 0
    let districts = 0
    let residents = 0
    let transport = 0

    for (const district of snapshot.districts ?? []) {
      expected.add(district.id)
      const visual = this.ensureDistrict(district.id)
      visual.update(snapshot, interpolationAlpha)
      visible += this.applyVisibility(visual, camera)
      districts += 1
    }

    for (const building of Object.values(snapshot.buildings)) {
      expected.add(building.id)
      const visual = this.ensureBuilding(building.id)
      visual.update(snapshot, interpolationAlpha)
      visible += this.applyVisibility(visual, camera)
      buildings += 1
    }

    for (const agent of Object.values(snapshot.agents)) {
      expected.add(agent.id)
      const agentIsTransport = isTransport(agent)
      const visual = this.ensureAgent(agent.id, agentIsTransport)
      visual.update(snapshot, interpolationAlpha)
      visible += this.applyVisibility(visual, camera)
      if (agentIsTransport) transport += 1
      else residents += 1
    }

    for (const candidate of Object.values(snapshot.migrationCandidates ?? {})) {
      const visualId = migrationCandidateVisualId(candidate.id)
      expected.add(visualId)
      const visual = this.ensureAgent(visualId, false)
      visual.update(snapshot, interpolationAlpha)
      visible += this.applyVisibility(visual, camera)
      residents += 1
    }

    for (const drop of snapshot.worldDrops) {
      expected.add(drop.id)
      const visual = this.ensureDrop(drop.id)
      visual.update(snapshot, interpolationAlpha)
      visible += this.applyVisibility(visual, camera)
    }

    for (const [id, visual] of [...this.active]) {
      if (!expected.has(id)) this.release(id, visual)
    }

    this.sortDynamicLayers()
    return {
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
  }

  destroy(): void {
    for (const [id, visual] of [...this.active]) this.release(id, visual)
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
