import { Container, Graphics } from 'pixi.js'
import type {
  AgentEntity,
  BuildingEntity,
  EntityId,
  SimulationSnapshot,
  WorldDrop,
} from '../simulation/contracts'
import { gridToScreen, interpolateGridPoint, isoDepth } from './isometric'
import type { EntityVisual, IsoMetrics, RenderEntityKind } from './types'

const BUILDING_STATUS_COLOR: Record<BuildingEntity['status'], number> = {
  constructing: 0xc9a66b,
  idle: 0xb9aa8b,
  working: 0x6f9f74,
  delivering: 0x7a9eb8,
  serving: 0xd69a72,
  blocked: 0xb85c4c,
  upgrading: 0xd7b75b,
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
  private readonly activity = new Graphics()

  constructor(metrics: Readonly<IsoMetrics>) {
    super(metrics)
    this.display.addChild(this.body, this.activity)
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
    const working = building.status === 'working'
      || building.status === 'delivering'
      || building.status === 'serving'

    this.body.clear()
      .poly([-width, 0, 0, width * 0.48, width, 0, 0, -width * 0.48])
      .fill({ color: 0xd8c69d })
      .rect(-width * 0.72, -height, width * 1.44, height)
      .fill({ color: BUILDING_STATUS_COLOR[building.status] })
      .poly([-width * 0.9, -height, 0, -height - width * 0.42, width * 0.9, -height, 0, -height + width * 0.2])
      .fill({ color: level === 0 ? 0x82796b : 0x4f6e62 })

    this.activity.clear()
    if (working) {
      this.activity.circle(0, -height - 12 - Math.sin(phase) * 2, 3 + Math.sin(phase) * 0.5)
        .fill({ color: 0xf2d77c, alpha: 0.85 })
    }
    this.display.alpha = building.status === 'blocked' ? 0.72 : 1
  }
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
