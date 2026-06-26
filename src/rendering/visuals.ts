import { Container, Graphics } from 'pixi.js'
import type {
  AgentEntity,
  BuildingEntity,
  EntityId,
  SimulationSnapshot,
  WorldDrop,
} from '../simulation/contracts'
import { gridToScreen, interpolateGridPoint, isoDepth } from './isometric'
import type { PrefabRuntimeRegistry, ResolvedPrefabBuilding } from './prefab'
import type { EntityVisual, IsoMetrics, RenderEntityKind } from './types'

type BlockedReasonKind = 'missing-input' | 'no-workers' | 'storage-full' | 'generic'
type BuildingStatusPresentation =
  | BuildingEntity['status']
  | `blocked:${BlockedReasonKind}`

const BUILDING_STATUS_COLOR: Record<BuildingEntity['status'], number> = {
  constructing: 0xc9a66b,
  idle: 0xb9aa8b,
  working: 0x6f9f74,
  delivering: 0x7a9eb8,
  serving: 0xd69a72,
  blocked: 0xb85c4c,
  upgrading: 0xd7b75b,
}

const STATUS_ACCENT_COLOR: Record<BuildingStatusPresentation, number> = {
  constructing: 0x7f6a4d,
  idle: 0x6d6a62,
  working: 0xf2d77c,
  delivering: 0xb9e0f2,
  serving: 0xf0b09a,
  blocked: 0xf1d0c8,
  'blocked:generic': 0xf1d0c8,
  'blocked:missing-input': 0xf0c15d,
  'blocked:no-workers': 0xe4e0d4,
  'blocked:storage-full': 0xc9b58a,
  upgrading: 0xf0d982,
}

const ROLE_COLOR: Record<AgentEntity['role'], number> = {
  resident: 0x5f7693,
  worker: 0x596b46,
  carrier: 0x9c7048,
  service: 0x8b668e,
  cart: 0x79563c,
  boat: 0x477f9d,
}

function animationPhase(snapshot: Readonly<SimulationSnapshot>, id: EntityId): number {
  let hash = 0
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) >>> 0
  }
  return (snapshot.tick * 0.12 + (hash % 100) / 100) % (Math.PI * 2)
}

function blockedReasonKind(reason: string | undefined): BlockedReasonKind {
  if (!reason) return 'generic'
  if (reason === 'no-workers') return 'no-workers'
  if (reason === 'output-full' || reason === 'storage-full') return 'storage-full'
  if (reason.startsWith('missing-input:') || reason.startsWith('missing-service-resource:')) {
    return 'missing-input'
  }
  return 'generic'
}

function statusPresentation(building: Readonly<BuildingEntity>): BuildingStatusPresentation {
  if (building.status !== 'blocked') return building.status
  return `blocked:${blockedReasonKind(building.statusReason)}`
}

abstract class BaseVisual implements EntityVisual {
  readonly display = new Container()
  entityId: EntityId | null = null
  abstract kind: RenderEntityKind
  worldPosition = { x: 0, y: 0 }

  constructor(protected readonly metrics: Readonly<IsoMetrics>) {}

  abstract update(snapshot: Readonly<SimulationSnapshot>, alpha: number): void

  reset(): void {
    this.entityId = null
    this.worldPosition = { x: 0, y: 0 }
    this.display.visible = false
    this.display.renderable = false
    this.display.alpha = 1
    this.display.rotation = 0
    this.display.scale.set(1)
    this.display.removeFromParent()
  }

  protected place(position: { x: number; y: number }, elevation = 0): void {
    this.worldPosition = position
    const screen = gridToScreen(position, elevation, this.metrics)
    this.display.position.set(screen.x, screen.y)
    this.display.zIndex = isoDepth(position, elevation)
  }
}

export class BuildingVisual extends BaseVisual {
  kind = 'building' as const
  private readonly body = new Graphics()
  private readonly prefabPlaceholder: Container | null
  private readonly prefabShell: Graphics | null
  private readonly statusLayer = new Container({ label: 'building-status-layer' })
  private readonly statusSymbol = new Graphics({ label: 'building-status-symbol' })
  private readonly statusMotion = new Graphics({ label: 'building-status-motion' })
  private readonly statusMask = new Graphics({ label: 'building-status-mask' })

  constructor(
    metrics: Readonly<IsoMetrics>,
    private readonly prefabRegistry?: PrefabRuntimeRegistry,
  ) {
    super(metrics)
    this.body.label = 'building-body'
    this.statusLayer.addChild(this.statusMask, this.statusSymbol, this.statusMotion)
    if (this.prefabRegistry) {
      this.prefabPlaceholder = new Container({ label: 'prefab-placeholder:unresolved' })
      this.prefabShell = new Graphics({ label: 'prefab-placeholder-shell' })
      this.prefabPlaceholder.addChild(this.prefabShell)
      this.display.addChild(this.body, this.prefabPlaceholder, this.statusLayer)
    } else {
      this.prefabPlaceholder = null
      this.prefabShell = null
      this.display.addChild(this.body, this.statusLayer)
    }
  }

  update(snapshot: Readonly<SimulationSnapshot>, _alpha: number): void {
    if (!this.entityId) return
    const building = snapshot.buildings[this.entityId]
    if (!building) return

    this.place(building.origin)
    const level = Math.max(0, Math.min(8, building.level))
    const width = 30 + level * 3
    const height = 24 + level * 4
    const phase = animationPhase(snapshot, building.id)
    const presentation = statusPresentation(building)

    this.body.clear()
      .poly([-width, 0, 0, width * 0.48, width, 0, 0, -width * 0.48])
      .fill({ color: 0xd8c69d })
      .rect(-width * 0.72, -height, width * 1.44, height)
      .fill({ color: BUILDING_STATUS_COLOR[building.status] })
      .poly([-width * 0.9, -height, 0, -height - width * 0.42, width * 0.9, -height, 0, -height + width * 0.2])
      .fill({ color: level === 0 ? 0x82796b : 0x4f6e62 })

    this.drawStatusPresentation(presentation, width, height, phase, building.productionProgress)
    this.drawPrefabPlaceholder(building, width, height)
    this.display.alpha = building.status === 'blocked' ? 0.72 : 1
  }

  private drawPrefabPlaceholder(
    building: Readonly<BuildingEntity>,
    fallbackWidth: number,
    fallbackHeight: number,
  ): void {
    if (!this.prefabRegistry || !this.prefabPlaceholder || !this.prefabShell) return

    const resolved = this.prefabRegistry.resolveBuilding({
      assetId: building.type,
      level: building.level,
      status: building.status,
      statusReason: building.statusReason,
      productionProgress: building.productionProgress,
    })

    this.prefabShell.clear()
    if (!resolved) {
      this.prefabPlaceholder.label = `prefab-placeholder:${building.type}:missing`
      this.prefabPlaceholder.visible = false
      return
    }

    this.prefabPlaceholder.visible = true
    this.prefabPlaceholder.label = prefabPlaceholderLabel(resolved)
    const bounds = resolved.descriptor.bounds.localPx
    const width = Math.max(fallbackWidth * 1.3, bounds.right - bounds.left)
    const height = Math.max(fallbackHeight, bounds.bottom - bounds.top)
    this.prefabShell
      .rect(-width / 2, -height, width, height)
      .stroke({ color: 0x283643, alpha: 0.28, width: 1.4 })
      .circle(0, -height * 0.5, 3)
      .fill({ color: prefabStateColor(resolved.state), alpha: 0.55 })
  }

  private drawStatusPresentation(
    presentation: BuildingStatusPresentation,
    width: number,
    height: number,
    phase: number,
    progress: number,
  ): void {
    const accent = STATUS_ACCENT_COLOR[presentation]
    const y = -height - 13
    this.statusLayer.position.set(0, 0)
    this.statusLayer.visible = presentation !== 'idle'
    this.statusLayer.label = `building-status-layer:${presentation}`
    this.statusSymbol.label = `building-status-symbol:${presentation}`
    this.statusMotion.label = `building-status-motion:${presentation}`
    this.statusMask.label = `building-status-mask:${presentation}`
    this.statusSymbol.clear()
    this.statusMotion.clear()
    this.statusMask.clear()

    if (presentation === 'idle') return

    this.statusMask
      .roundRect(-width * 0.54, -height + 4, width * 1.08, Math.max(5, height * 0.18), 2)
      .fill({ color: 0x2c2b28, alpha: 0.12 })

    if (presentation === 'working') {
      const sweep = Math.max(0.08, Math.min(1, progress || 0))
      this.statusSymbol
        .circle(0, y, 8)
        .stroke({ color: accent, alpha: 0.9, width: 2 })
        .circle(0, y, 2.5)
        .fill({ color: accent, alpha: 0.85 })
      for (let index = 0; index < 6; index += 1) {
        const angle = phase + index * (Math.PI / 3)
        this.statusMotion
          .moveTo(Math.cos(angle) * 6, y + Math.sin(angle) * 6)
          .lineTo(Math.cos(angle) * 10, y + Math.sin(angle) * 10)
      }
      this.statusMotion.stroke({ color: accent, alpha: 0.85, width: 1.6 })
      this.statusMask
        .rect(-width * 0.54, -height + 4, width * 1.08 * sweep, Math.max(5, height * 0.18))
        .fill({ color: accent, alpha: 0.25 })
      return
    }

    if (presentation === 'delivering') {
      const offset = Math.sin(phase) * 2
      this.statusSymbol
        .moveTo(-12 + offset, y)
        .lineTo(8 + offset, y)
        .lineTo(2 + offset, y - 6)
        .moveTo(8 + offset, y)
        .lineTo(2 + offset, y + 6)
        .stroke({ color: accent, alpha: 0.95, width: 2.2 })
      this.statusMotion
        .rect(-14 - offset, y + 7, 6, 3)
        .rect(-5 - offset, y + 7, 6, 3)
        .fill({ color: accent, alpha: 0.65 })
      return
    }

    if (presentation === 'serving') {
      const pulse = 1 + Math.sin(phase) * 0.08
      this.statusSymbol
        .roundRect(-3 * pulse, y - 11 * pulse, 6 * pulse, 22 * pulse, 2)
        .roundRect(-11 * pulse, y - 3 * pulse, 22 * pulse, 6 * pulse, 2)
        .fill({ color: accent, alpha: 0.9 })
      this.statusMotion
        .circle(0, y, 13 + Math.sin(phase) * 1.5)
        .stroke({ color: accent, alpha: 0.35, width: 1.4 })
      return
    }

    if (presentation === 'constructing' || presentation === 'upgrading') {
      const lift = Math.abs(Math.sin(phase)) * 3
      this.statusSymbol
        .moveTo(-10, y + 8)
        .lineTo(0, y - 9)
        .lineTo(10, y + 8)
        .moveTo(-5, y)
        .lineTo(5, y)
        .stroke({ color: accent, alpha: 0.9, width: 2 })
      this.statusMotion
        .rect(-9, y + 10 - lift, 18, 3)
        .fill({ color: accent, alpha: 0.7 })
      return
    }

    this.drawBlockedPresentation(presentation, y, accent, phase)
  }

  private drawBlockedPresentation(
    presentation: BuildingStatusPresentation,
    y: number,
    accent: number,
    phase: number,
  ): void {
    this.statusMask
      .moveTo(-16, y - 10)
      .lineTo(16, y + 10)
      .moveTo(16, y - 10)
      .lineTo(-16, y + 10)
      .stroke({ color: 0x46251f, alpha: 0.62, width: 2.3 })

    if (presentation === 'blocked:missing-input') {
      this.statusSymbol
        .moveTo(-12, y - 8)
        .lineTo(12, y - 8)
        .lineTo(4, y + 2)
        .lineTo(4, y + 10)
        .lineTo(-4, y + 10)
        .lineTo(-4, y + 2)
        .closePath()
        .stroke({ color: accent, alpha: 0.9, width: 2 })
      this.statusMotion
        .moveTo(-5, y - 16 + Math.sin(phase) * 2)
        .lineTo(0, y - 10 + Math.sin(phase) * 2)
        .lineTo(5, y - 16 + Math.sin(phase) * 2)
        .stroke({ color: accent, alpha: 0.75, width: 1.6 })
      return
    }

    if (presentation === 'blocked:no-workers') {
      this.statusSymbol
        .circle(0, y - 7, 4)
        .stroke({ color: accent, alpha: 0.9, width: 2 })
        .moveTo(0, y - 2)
        .lineTo(0, y + 10)
        .moveTo(-7, y + 3)
        .lineTo(7, y + 3)
        .moveTo(-6, y + 18)
        .lineTo(0, y + 10)
        .lineTo(6, y + 18)
        .stroke({ color: accent, alpha: 0.9, width: 2 })
      this.statusMotion
        .moveTo(-12, y + 13)
        .lineTo(12, y - 13)
        .stroke({ color: 0x46251f, alpha: 0.72, width: 2 })
      return
    }

    if (presentation === 'blocked:storage-full') {
      this.statusSymbol
        .rect(-13, y - 10, 10, 8)
        .rect(-1, y - 10, 10, 8)
        .rect(-7, y, 10, 8)
        .fill({ color: accent, alpha: 0.85 })
      this.statusMotion
        .moveTo(-14, y + 13)
        .lineTo(14, y + 13)
        .stroke({ color: accent, alpha: 0.9, width: 2.2 })
      return
    }

    this.statusSymbol
      .moveTo(0, y - 12)
      .lineTo(0, y + 4)
      .stroke({ color: accent, alpha: 0.95, width: 3 })
      .circle(0, y + 11, 2.4)
      .fill({ color: accent, alpha: 0.95 })
  }
}

function prefabPlaceholderLabel(resolved: Readonly<ResolvedPrefabBuilding>): string {
  const slotIds = resolved.slots.map((slot) => slot.id).join('+') || 'no-slots'
  return `prefab-placeholder:${resolved.assetId}:${resolved.levelKey}:${resolved.state}:${slotIds}`
}

function prefabStateColor(state: ResolvedPrefabBuilding['state']): number {
  if (state === 'storage_full') return 0xc9b58a
  if (state === 'blocked') return 0xb85c4c
  if (state === 'working') return 0x6f9f74
  if (state === 'serving') return 0xd69a72
  if (state === 'constructing') return 0xc9a66b
  return 0xb9aa8b
}

export class AgentVisual extends BaseVisual {
  kind: 'resident' | 'transport'
  private readonly body = new Graphics()

  constructor(metrics: Readonly<IsoMetrics>, kind: 'resident' | 'transport') {
    super(metrics)
    this.kind = kind
    this.display.addChild(this.body)
  }

  update(snapshot: Readonly<SimulationSnapshot>, alpha: number): void {
    if (!this.entityId) return
    const agent = snapshot.agents[this.entityId]
    if (!agent) return

    const next = agent.path[Math.min(agent.pathIndex + 1, agent.path.length - 1)]
    const position = next ? interpolateGridPoint(agent.position, next, alpha) : agent.position
    this.place(position)

    const phase = animationPhase(snapshot, agent.id)
    const moving = agent.activity === 'commuting'
      || agent.activity === 'delivering'
      || agent.activity === 'returning'
    const bob = moving ? Math.abs(Math.sin(phase)) * 2 : 0
    const isTransport = this.kind === 'transport'

    this.body.clear()
    if (isTransport) {
      const width = agent.role === 'boat' ? 26 : 20
      this.body.roundRect(-width / 2, -9 - bob, width, 10, 3)
        .fill({ color: ROLE_COLOR[agent.role] })
      this.body.circle(-width * 0.28, 2 - bob, 3).fill({ color: 0x3f3a34 })
      this.body.circle(width * 0.28, 2 - bob, 3).fill({ color: 0x3f3a34 })
    } else {
      this.body.circle(0, -12 - bob, 4).fill({ color: 0xe7c6a5 })
      this.body.roundRect(-4, -8 - bob, 8, 12, 3).fill({ color: ROLE_COLOR[agent.role] })
    }
  }
}

export class DropVisual extends BaseVisual {
  kind = 'drop' as const
  private readonly body = new Graphics()

  constructor(metrics: Readonly<IsoMetrics>) {
    super(metrics)
    this.display.addChild(this.body)
  }

  update(snapshot: Readonly<SimulationSnapshot>, _alpha: number): void {
    if (!this.entityId) return
    const drop = snapshot.worldDrops.find((candidate) => candidate.id === this.entityId)
    if (!drop) return
    this.updateDrop(snapshot, drop)
  }

  private updateDrop(snapshot: Readonly<SimulationSnapshot>, drop: Readonly<WorldDrop>): void {
    const phase = animationPhase(snapshot, drop.id)
    this.place(drop.position)
    this.body.clear()
      .circle(0, -8 - Math.sin(phase) * 3, 7)
      .fill({ color: 0xe4b94f, alpha: 0.95 })
      .circle(-2, -10 - Math.sin(phase) * 3, 2)
      .fill({ color: 0xffefaa, alpha: 0.9 })
    this.display.scale.set(Math.min(1.4, 0.9 + drop.amount * 0.08))
  }
}
