import { Container, Graphics, Text } from 'pixi.js'
import type {
  AgentEntity,
  BuildingEntity,
  EntityId,
  SimulationSnapshot,
  WorldDrop,
} from '../simulation/contracts'
import { gridToScreen, interpolateGridPoint, isoDepth } from './isometric'
import { resolvePrefabAssetIdForBuildingType } from './prefab'
import type { PrefabRuntimeRegistry, ResolvedPrefabBuilding } from './prefab'
import type { EntityVisual, IsoMetrics, RenderEntityKind } from './types'

type BlockedReasonKind = 'missing-input' | 'no-workers' | 'logistics-failed' | 'storage-full' | 'generic'
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
  'blocked:logistics-failed': 0x8ec7e8,
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
  if (reason.startsWith('logistics-failed:')) return 'logistics-failed'
  if (reason === 'output-full' || reason === 'storage-full') return 'storage-full'
  if (reason.startsWith('missing-input:') || reason.startsWith('missing-service-resource:')) {
    return 'missing-input'
  }
  return 'generic'
}

function statusHintText(presentation: BuildingStatusPresentation): string {
  if (presentation === 'blocked:missing-input') return '缺料'
  if (presentation === 'blocked:no-workers') return '缺工'
  if (presentation === 'blocked:logistics-failed') return '物流失败'
  if (presentation === 'blocked:storage-full') return '仓满'
  if (presentation === 'blocked' || presentation === 'blocked:generic') return '阻塞'
  if (presentation === 'constructing') return '施工'
  if (presentation === 'upgrading') return '升级'
  if (presentation === 'working') return '生产'
  if (presentation === 'delivering') return '配送'
  if (presentation === 'serving') return '服务'
  return ''
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
  private readonly prefabOutline: Graphics | null
  private readonly prefabInfoBar: Graphics | null
  private readonly prefabStatusBar: Graphics | null
  private readonly prefabLevelMarks: Graphics | null
  private readonly prefabMainPierDetails: Container | null
  private readonly prefabMainPierFoundation: Graphics | null
  private readonly prefabMainPierBerths: Graphics | null
  private readonly prefabMainPierCargo: Graphics | null
  private readonly prefabGoldAssetDetails: Container | null
  private readonly prefabGoldAssetGround: Graphics | null
  private readonly prefabGoldAssetStructure: Graphics | null
  private readonly prefabGoldAssetActivity: Graphics | null
  private readonly prefabLabel: Text | null
  private readonly statusLayer = new Container({ label: 'building-status-layer' })
  private readonly statusSymbol = new Graphics({ label: 'building-status-symbol' })
  private readonly statusMotion = new Graphics({ label: 'building-status-motion' })
  private readonly statusMask = new Graphics({ label: 'building-status-mask' })
  private readonly statusHint = new Container({ label: 'building-status-hint' })
  private readonly statusHintBadge = new Graphics({ label: 'building-status-hint-badge' })
  private readonly statusHintText = new Text({
    text: '',
    style: {
      fill: 0x2c2b28,
      fontFamily: 'monospace',
      fontSize: 8,
      fontWeight: '700',
      letterSpacing: 0.2,
    },
    label: 'building-status-hint-text',
  })

  constructor(
    metrics: Readonly<IsoMetrics>,
    private readonly prefabRegistry?: PrefabRuntimeRegistry,
  ) {
    super(metrics)
    this.body.label = 'building-body'
    this.statusHint.addChild(this.statusHintBadge, this.statusHintText)
    this.statusLayer.addChild(this.statusMask, this.statusSymbol, this.statusMotion, this.statusHint)
    if (this.prefabRegistry) {
      this.prefabPlaceholder = new Container({ label: 'prefab-placeholder:unresolved' })
      this.prefabShell = new Graphics({ label: 'prefab-placeholder-shell' })
      this.prefabOutline = new Graphics({ label: 'prefab-placeholder-outline' })
      this.prefabInfoBar = new Graphics({ label: 'prefab-placeholder-info-bar' })
      this.prefabStatusBar = new Graphics({ label: 'prefab-placeholder-status-bar' })
      this.prefabLevelMarks = new Graphics({ label: 'prefab-placeholder-level-marks' })
      this.prefabMainPierDetails = new Container({ label: 'prefab-placeholder-main-pier-details' })
      this.prefabMainPierFoundation = new Graphics({ label: 'main-pier-placeholder-foundation' })
      this.prefabMainPierBerths = new Graphics({ label: 'main-pier-placeholder-berths' })
      this.prefabMainPierCargo = new Graphics({ label: 'main-pier-placeholder-cargo' })
      this.prefabMainPierDetails.addChild(
        this.prefabMainPierFoundation,
        this.prefabMainPierBerths,
        this.prefabMainPierCargo,
      )
      this.prefabGoldAssetDetails = new Container({ label: 'prefab-placeholder-gold-asset-details' })
      this.prefabGoldAssetGround = new Graphics({ label: 'gold-asset-placeholder-ground' })
      this.prefabGoldAssetStructure = new Graphics({ label: 'gold-asset-placeholder-structure' })
      this.prefabGoldAssetActivity = new Graphics({ label: 'gold-asset-placeholder-activity' })
      this.prefabGoldAssetDetails.addChild(
        this.prefabGoldAssetGround,
        this.prefabGoldAssetStructure,
        this.prefabGoldAssetActivity,
      )
      this.prefabLabel = new Text({
        text: '',
        style: {
          fill: 0x283643,
          fontFamily: 'monospace',
          fontSize: 7,
          fontWeight: '600',
          letterSpacing: 0.2,
        },
        label: 'prefab-placeholder-label',
      })
      this.prefabPlaceholder.addChild(
        this.prefabShell,
        this.prefabOutline,
        this.prefabInfoBar,
        this.prefabStatusBar,
        this.prefabLevelMarks,
        this.prefabLabel,
      )
      this.display.addChild(this.body, this.prefabPlaceholder, this.statusLayer)
    } else {
      this.prefabPlaceholder = null
      this.prefabShell = null
      this.prefabOutline = null
      this.prefabInfoBar = null
      this.prefabStatusBar = null
      this.prefabLevelMarks = null
      this.prefabMainPierDetails = null
      this.prefabMainPierFoundation = null
      this.prefabMainPierBerths = null
      this.prefabMainPierCargo = null
      this.prefabGoldAssetDetails = null
      this.prefabGoldAssetGround = null
      this.prefabGoldAssetStructure = null
      this.prefabGoldAssetActivity = null
      this.prefabLabel = null
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
    if (
      !this.prefabRegistry
      || !this.prefabPlaceholder
      || !this.prefabShell
      || !this.prefabOutline
      || !this.prefabInfoBar
      || !this.prefabStatusBar
      || !this.prefabLevelMarks
      || !this.prefabLabel
    ) {
      return
    }

    const assetId = resolvePrefabAssetIdForBuildingType(building.type)
    this.clearPrefabPlaceholder()
    if (!assetId) {
      this.prefabPlaceholder.label = `prefab-placeholder:${building.type}:unmapped`
      this.prefabPlaceholder.visible = false
      return
    }

    const resolved = this.prefabRegistry.resolveBuilding({
      assetId,
      level: building.level,
      status: building.status,
      statusReason: building.statusReason,
      productionProgress: building.productionProgress,
    })

    if (!resolved) {
      this.prefabPlaceholder.label = `prefab-placeholder:${assetId}:missing`
      this.prefabPlaceholder.visible = false
      return
    }

    this.prefabPlaceholder.visible = true
    this.prefabPlaceholder.label = prefabPlaceholderLabel(resolved)
    const bounds = resolved.descriptor.bounds.localPx
    const width = Math.max(fallbackWidth * 1.3, bounds.right - bounds.left)
    const height = Math.max(fallbackHeight, bounds.bottom - bounds.top)
    const left = -width / 2
    const top = -height
    const stateColor = prefabStateColor(resolved.state)
    const authoredLevelRatio = Math.max(0, Math.min(1, resolved.level.numericLevel / 8))
    const progressRatio = Math.max(0.08, Math.min(1, building.productionProgress || 0))

    this.prefabShell
      .rect(left, top, width, height)
      .fill({ color: 0xe8e0ce, alpha: 0.18 })
      .rect(left + 3, top + 14, width - 6, height - 20)
      .fill({ color: stateColor, alpha: 0.08 })

    this.prefabOutline
      .rect(left, top, width, height)
      .stroke({ color: 0x283643, alpha: 0.52, width: 1.4 })
      .moveTo(left, top + 13)
      .lineTo(left + width, top + 13)
      .moveTo(left + 7, top)
      .lineTo(left + 7, top + height)
      .moveTo(left + width - 7, top)
      .lineTo(left + width - 7, top + height)
      .stroke({ color: 0x283643, alpha: 0.25, width: 1 })

    this.prefabInfoBar
      .roundRect(left + 3, top + 3, width - 6, 8, 2)
      .fill({ color: 0xf4ecd7, alpha: 0.78 })
      .rect(left + 5, top + 5, Math.max(4, (width - 10) * authoredLevelRatio), 4)
      .fill({ color: 0x5f7693, alpha: 0.42 })

    this.prefabStatusBar
      .rect(left + 3, -5, width - 6, 3)
      .fill({ color: 0x283643, alpha: 0.18 })
      .rect(left + 3, -5, (width - 6) * progressRatio, 3)
      .fill({ color: stateColor, alpha: 0.75 })
      .circle(0, top + height * 0.56, 3)
      .fill({ color: stateColor, alpha: 0.68 })

    for (let level = 0; level <= 8; level += 1) {
      const x = left + 5 + ((width - 10) * level) / 8
      const tickHeight = level === resolved.level.numericLevel ? 7 : 4
      this.prefabLevelMarks
        .moveTo(x, top + 12)
        .lineTo(x, top + 12 - tickHeight)
    }
    this.prefabLevelMarks.stroke({ color: 0x283643, alpha: 0.42, width: 1 })

    this.drawMainPierPlaceholderDetails(resolved, left, top, width, height, stateColor)
    this.drawGoldAssetPlaceholderDetails(resolved, left, top, width, height, stateColor)

    this.prefabLabel.text = `${resolved.assetId} · ${resolved.levelKey}`
    this.prefabLabel.label = `prefab-placeholder-label:${resolved.assetId}:${resolved.levelKey}`
    this.prefabLabel.position.set(left + 6, top + 3)
  }

  private clearPrefabPlaceholder(): void {
    this.prefabShell?.clear()
    this.prefabOutline?.clear()
    this.prefabInfoBar?.clear()
    this.prefabStatusBar?.clear()
    this.prefabLevelMarks?.clear()
    this.clearMainPierPlaceholderDetails()
    this.clearGoldAssetPlaceholderDetails()
    if (this.prefabLabel) {
      this.prefabLabel.text = ''
      this.prefabLabel.label = 'prefab-placeholder-label'
    }
  }

  private drawMainPierPlaceholderDetails(
    resolved: Readonly<ResolvedPrefabBuilding>,
    left: number,
    top: number,
    width: number,
    height: number,
    stateColor: number,
  ): void {
    if (
      resolved.assetId !== 'main-pier'
      || !this.prefabPlaceholder
      || !this.prefabMainPierDetails
      || !this.prefabMainPierFoundation
      || !this.prefabMainPierBerths
      || !this.prefabMainPierCargo
      || !this.prefabLabel
    ) {
      return
    }

    if (resolved.levelKey !== 'L0' && resolved.levelKey !== 'L4' && resolved.levelKey !== 'L8') {
      return
    }

    if (!this.prefabMainPierDetails.parent) {
      const labelIndex = this.prefabPlaceholder.children.indexOf(this.prefabLabel)
      this.prefabPlaceholder.addChildAt(
        this.prefabMainPierDetails,
        Math.max(0, labelIndex),
      )
    }

    const waterY = -Math.max(7, height * 0.2)
    const deckTop = top + Math.max(18, height * 0.42)
    const deckHeight = Math.max(16, height * 0.34)
    const deckLeft = left + width * 0.14
    const deckWidth = width * 0.72
    const pierColor = resolved.levelKey === 'L0' ? 0x8c806f : 0x9f8660
    const stoneColor = resolved.levelKey === 'L8' ? 0x8c9a9a : 0x796f63

    this.prefabMainPierDetails.label = `prefab-placeholder-main-pier-details:${resolved.levelKey}`

    if (resolved.levelKey === 'L0') {
      this.prefabMainPierFoundation.label = 'main-pier-placeholder-water-edge:broken'
      this.prefabMainPierBerths.label = 'main-pier-placeholder-deck:collapsed-single-berth'
      this.prefabMainPierCargo.label = 'main-pier-placeholder-repair-clutter:L0'

      this.prefabMainPierFoundation
        .rect(left + width * 0.08, waterY - 3, width * 0.84, 5)
        .fill({ color: 0x477f9d, alpha: 0.2 })
        .moveTo(left + width * 0.16, waterY + 4)
        .lineTo(left + width * 0.28, waterY + 1)
        .lineTo(left + width * 0.4, waterY + 5)
        .lineTo(left + width * 0.52, waterY + 2)
        .lineTo(left + width * 0.68, waterY + 5)
        .stroke({ color: 0x477f9d, alpha: 0.38, width: 1.2 })

      this.prefabMainPierBerths
        .poly([
          deckLeft,
          deckTop + deckHeight,
          deckLeft + deckWidth * 0.28,
          deckTop + deckHeight * 0.48,
          deckLeft + deckWidth * 0.5,
          deckTop + deckHeight * 0.6,
          deckLeft + deckWidth * 0.74,
          deckTop + deckHeight * 0.36,
          deckLeft + deckWidth,
          deckTop + deckHeight,
        ])
        .fill({ color: pierColor, alpha: 0.46 })
        .moveTo(deckLeft + deckWidth * 0.22, deckTop + deckHeight * 0.82)
        .lineTo(deckLeft + deckWidth * 0.37, deckTop + deckHeight * 0.44)
        .moveTo(deckLeft + deckWidth * 0.58, deckTop + deckHeight * 0.78)
        .lineTo(deckLeft + deckWidth * 0.78, deckTop + deckHeight * 0.32)
        .stroke({ color: 0x3f3a34, alpha: 0.5, width: 1.2 })

      this.prefabMainPierCargo
        .rect(left + width * 0.22, deckTop + deckHeight * 0.58, 9, 6)
        .rect(left + width * 0.38, deckTop + deckHeight * 0.5, 12, 5)
        .fill({ color: 0x9c7048, alpha: 0.52 })
        .moveTo(left + width * 0.62, deckTop + deckHeight * 0.2)
        .lineTo(left + width * 0.7, deckTop + deckHeight * 0.55)
        .lineTo(left + width * 0.56, deckTop + deckHeight * 0.68)
        .stroke({ color: stateColor, alpha: 0.56, width: 1.4 })
      return
    }

    if (resolved.levelKey === 'L4') {
      this.prefabMainPierFoundation.label = 'main-pier-placeholder-warehouse:L4'
      this.prefabMainPierBerths.label = 'main-pier-placeholder-berths:double'
      this.prefabMainPierCargo.label = 'main-pier-placeholder-cargo-winch:L4'

      this.prefabMainPierFoundation
        .rect(left + width * 0.24, top + height * 0.28, width * 0.34, height * 0.18)
        .fill({ color: 0x7f6a4d, alpha: 0.48 })
        .poly([
          left + width * 0.22,
          top + height * 0.28,
          left + width * 0.42,
          top + height * 0.16,
          left + width * 0.6,
          top + height * 0.28,
        ])
        .fill({ color: 0x4f6e62, alpha: 0.58 })
        .rect(left + width * 0.31, top + height * 0.34, width * 0.08, height * 0.12)
        .fill({ color: 0x283643, alpha: 0.28 })

      for (let index = 0; index < 2; index += 1) {
        const berthX = left + width * (0.18 + index * 0.42)
        this.prefabMainPierBerths
          .rect(berthX, deckTop, width * 0.25, deckHeight)
          .fill({ color: pierColor, alpha: 0.42 })
          .rect(berthX + width * 0.04, waterY - 2, width * 0.17, 4)
          .fill({ color: 0x477f9d, alpha: 0.22 })
      }
      this.prefabMainPierBerths
        .moveTo(left + width * 0.5, deckTop + 2)
        .lineTo(left + width * 0.5, deckTop + deckHeight - 2)
        .stroke({ color: 0x283643, alpha: 0.32, width: 1 })

      this.prefabMainPierCargo
        .rect(left + width * 0.62, top + height * 0.44, 11, 7)
        .rect(left + width * 0.7, top + height * 0.38, 13, 6)
        .rect(left + width * 0.67, top + height * 0.31, 9, 6)
        .fill({ color: 0x9c7048, alpha: 0.58 })
        .moveTo(left + width * 0.66, top + height * 0.26)
        .lineTo(left + width * 0.76, top + height * 0.18)
        .lineTo(left + width * 0.72, top + height * 0.48)
        .stroke({ color: stateColor, alpha: 0.7, width: 1.4 })
      return
    }

    this.prefabMainPierFoundation.label = 'main-pier-placeholder-warehouse-row:L8'
    this.prefabMainPierBerths.label = 'main-pier-placeholder-berths:multi'
    this.prefabMainPierCargo.label = 'main-pier-placeholder-heavy-lift-crane:L8'

    for (let index = 0; index < 3; index += 1) {
      const houseX = left + width * (0.18 + index * 0.2)
      this.prefabMainPierFoundation
        .rect(houseX, top + height * 0.24, width * 0.16, height * 0.17)
        .fill({ color: 0x7f6a4d, alpha: 0.46 })
        .poly([
          houseX - 2,
          top + height * 0.24,
          houseX + width * 0.08,
          top + height * 0.13,
          houseX + width * 0.16 + 2,
          top + height * 0.24,
        ])
        .fill({ color: 0x4f6e62, alpha: 0.62 })
    }

    for (let index = 0; index < 3; index += 1) {
      const berthX = left + width * (0.12 + index * 0.27)
      this.prefabMainPierBerths
        .rect(berthX, deckTop, width * 0.19, deckHeight)
        .fill({ color: stoneColor, alpha: 0.46 })
        .rect(berthX + width * 0.025, waterY - 3, width * 0.14, 5)
        .fill({ color: 0x477f9d, alpha: 0.24 })
    }

    this.prefabMainPierCargo
      .moveTo(left + width * 0.68, top + height * 0.55)
      .lineTo(left + width * 0.68, top + height * 0.12)
      .lineTo(left + width * 0.88, top + height * 0.2)
      .moveTo(left + width * 0.78, top + height * 0.16)
      .lineTo(left + width * 0.78, top + height * 0.42)
      .stroke({ color: 0x283643, alpha: 0.62, width: 2 })
      .rect(left + width * 0.75, top + height * 0.43, 10, 8)
      .rect(left + width * 0.47, top + height * 0.48, 13, 8)
      .rect(left + width * 0.37, top + height * 0.56, 10, 7)
      .fill({ color: 0x9c7048, alpha: 0.6 })
      .circle(left + width * 0.78, top + height * 0.43, 2.4)
      .fill({ color: stateColor, alpha: 0.82 })
  }

  private clearMainPierPlaceholderDetails(): void {
    this.prefabMainPierFoundation?.clear()
    this.prefabMainPierBerths?.clear()
    this.prefabMainPierCargo?.clear()
    if (this.prefabMainPierDetails) {
      this.prefabMainPierDetails.label = 'prefab-placeholder-main-pier-details'
      this.prefabMainPierDetails.removeFromParent()
    }
    if (this.prefabMainPierFoundation) {
      this.prefabMainPierFoundation.label = 'main-pier-placeholder-foundation'
    }
    if (this.prefabMainPierBerths) {
      this.prefabMainPierBerths.label = 'main-pier-placeholder-berths'
    }
    if (this.prefabMainPierCargo) {
      this.prefabMainPierCargo.label = 'main-pier-placeholder-cargo'
    }
  }

  private drawGoldAssetPlaceholderDetails(
    resolved: Readonly<ResolvedPrefabBuilding>,
    left: number,
    top: number,
    width: number,
    height: number,
    stateColor: number,
  ): void {
    if (
      !this.prefabPlaceholder
      || !this.prefabGoldAssetDetails
      || !this.prefabGoldAssetGround
      || !this.prefabGoldAssetStructure
      || !this.prefabGoldAssetActivity
      || !this.prefabLabel
    ) {
      return
    }

    if (
      resolved.assetId !== 'main-homes'
      && resolved.assetId !== 'main-eatery'
      && resolved.assetId !== 'main-granary'
    ) {
      return
    }

    if (resolved.levelKey !== 'L0' && resolved.levelKey !== 'L4' && resolved.levelKey !== 'L8') {
      return
    }

    if (!this.prefabGoldAssetDetails.parent) {
      const labelIndex = this.prefabPlaceholder.children.indexOf(this.prefabLabel)
      this.prefabPlaceholder.addChildAt(
        this.prefabGoldAssetDetails,
        Math.max(0, labelIndex),
      )
    }

    this.prefabGoldAssetDetails.label = `prefab-placeholder-${resolved.assetId}-details:${resolved.levelKey}`

    if (resolved.assetId === 'main-homes') {
      this.drawMainHomesPlaceholderDetails(resolved.levelKey, left, top, width, height, stateColor)
      return
    }

    if (resolved.assetId === 'main-eatery') {
      this.drawMainEateryPlaceholderDetails(resolved.levelKey, left, top, width, height, stateColor)
      return
    }

    this.drawMainGranaryPlaceholderDetails(resolved.levelKey, left, top, width, height, stateColor)
  }

  private drawMainHomesPlaceholderDetails(
    levelKey: 'L0' | 'L4' | 'L8',
    left: number,
    top: number,
    width: number,
    height: number,
    stateColor: number,
  ): void {
    const ground = this.prefabGoldAssetGround
    const structure = this.prefabGoldAssetStructure
    const activity = this.prefabGoldAssetActivity
    if (!ground || !structure || !activity) return

    const yardY = top + height * 0.64
    if (levelKey === 'L0') {
      ground.label = 'main-homes-placeholder-lot:abandoned:L0'
      structure.label = 'main-homes-placeholder-hut:collapsed:L0'
      activity.label = 'main-homes-placeholder-yard:weeds:L0'

      ground
        .poly([left + width * 0.16, yardY, left + width * 0.5, yardY + 10, left + width * 0.84, yardY, left + width * 0.5, yardY - 12])
        .fill({ color: 0x7b715f, alpha: 0.32 })
        .moveTo(left + width * 0.2, yardY + 2)
        .lineTo(left + width * 0.78, yardY - 6)
        .stroke({ color: 0x4d463d, alpha: 0.42, width: 1 })
      structure
        .poly([left + width * 0.28, top + height * 0.48, left + width * 0.44, top + height * 0.3, left + width * 0.62, top + height * 0.5])
        .fill({ color: 0x6b5a4a, alpha: 0.5 })
        .moveTo(left + width * 0.35, top + height * 0.5)
        .lineTo(left + width * 0.58, top + height * 0.38)
        .stroke({ color: 0x352f2a, alpha: 0.55, width: 1.4 })
      for (let index = 0; index < 5; index += 1) {
        const x = left + width * (0.24 + index * 0.12)
        activity
          .moveTo(x, yardY + 4)
          .lineTo(x + 3, yardY - 6 - (index % 2) * 3)
          .lineTo(x + 7, yardY + 3)
      }
      activity.stroke({ color: 0x596b46, alpha: 0.58, width: 1.2 })
      return
    }

    if (levelKey === 'L4') {
      ground.label = 'main-homes-placeholder-courtyard:L4'
      structure.label = 'main-homes-placeholder-homes:cluster:L4'
      activity.label = 'main-homes-placeholder-residents:washline:L4'

      ground
        .roundRect(left + width * 0.18, top + height * 0.5, width * 0.64, height * 0.24, 4)
        .fill({ color: 0xc9b58a, alpha: 0.32 })
        .rect(left + width * 0.44, top + height * 0.56, width * 0.12, height * 0.1)
        .fill({ color: 0x8c9a9a, alpha: 0.36 })
      for (let index = 0; index < 3; index += 1) {
        const x = left + width * (0.22 + index * 0.2)
        structure
          .rect(x, top + height * 0.34, width * 0.15, height * 0.18)
          .fill({ color: 0x9f8660, alpha: 0.58 })
          .poly([x - 2, top + height * 0.34, x + width * 0.075, top + height * 0.22, x + width * 0.15 + 2, top + height * 0.34])
          .fill({ color: 0x7a9eb8, alpha: 0.58 })
      }
      activity
        .moveTo(left + width * 0.28, top + height * 0.48)
        .lineTo(left + width * 0.7, top + height * 0.44)
        .stroke({ color: 0x283643, alpha: 0.42, width: 1 })
        .rect(left + width * 0.36, top + height * 0.43, 7, 4)
        .rect(left + width * 0.52, top + height * 0.41, 8, 4)
        .fill({ color: stateColor, alpha: 0.72 })
        .circle(left + width * 0.26, top + height * 0.62, 2.4)
        .circle(left + width * 0.68, top + height * 0.6, 2.4)
        .fill({ color: 0xe7c6a5, alpha: 0.86 })
      return
    }

    ground.label = 'main-homes-placeholder-neighborhood:lanes:L8'
    structure.label = 'main-homes-placeholder-homes:dense-row:L8'
    activity.label = 'main-homes-placeholder-civic-yard:lanterns-residents:L8'

    ground
      .moveTo(left + width * 0.12, top + height * 0.62)
      .lineTo(left + width * 0.88, top + height * 0.62)
      .moveTo(left + width * 0.28, top + height * 0.46)
      .lineTo(left + width * 0.72, top + height * 0.74)
      .stroke({ color: 0xc9b58a, alpha: 0.62, width: 2 })
      .roundRect(left + width * 0.42, top + height * 0.5, width * 0.16, height * 0.12, 4)
      .fill({ color: 0x8c9a9a, alpha: 0.42 })
    for (let index = 0; index < 5; index += 1) {
      const x = left + width * (0.12 + index * 0.16)
      structure
        .rect(x, top + height * (0.28 + (index % 2) * 0.06), width * 0.13, height * 0.22)
        .fill({ color: 0x9f8660, alpha: 0.6 })
        .poly([x - 2, top + height * (0.28 + (index % 2) * 0.06), x + width * 0.065, top + height * (0.15 + (index % 2) * 0.05), x + width * 0.13 + 2, top + height * (0.28 + (index % 2) * 0.06)])
        .fill({ color: 0x4f6e62, alpha: 0.66 })
    }
    for (let index = 0; index < 5; index += 1) {
      const x = left + width * (0.2 + index * 0.13)
      activity
        .circle(x, top + height * 0.68, 2.2)
        .fill({ color: 0xe7c6a5, alpha: 0.86 })
        .circle(x + 4, top + height * 0.55, 2)
        .fill({ color: 0xf0d982, alpha: 0.82 })
    }
  }

  private drawMainEateryPlaceholderDetails(
    levelKey: 'L0' | 'L4' | 'L8',
    left: number,
    top: number,
    width: number,
    height: number,
    stateColor: number,
  ): void {
    const ground = this.prefabGoldAssetGround
    const structure = this.prefabGoldAssetStructure
    const activity = this.prefabGoldAssetActivity
    if (!ground || !structure || !activity) return

    if (levelKey === 'L0') {
      ground.label = 'main-eatery-placeholder-foundation:burnt-stall:L0'
      structure.label = 'main-eatery-placeholder-kitchen:cold-hearth:L0'
      activity.label = 'main-eatery-placeholder-seating:scattered:L0'

      ground
        .rect(left + width * 0.2, top + height * 0.58, width * 0.6, height * 0.12)
        .fill({ color: 0x5b5046, alpha: 0.38 })
        .moveTo(left + width * 0.24, top + height * 0.58)
        .lineTo(left + width * 0.68, top + height * 0.44)
        .stroke({ color: 0x3f3a34, alpha: 0.6, width: 1.4 })
      structure
        .circle(left + width * 0.5, top + height * 0.48, 8)
        .stroke({ color: 0x6d6a62, alpha: 0.68, width: 2 })
        .rect(left + width * 0.42, top + height * 0.38, width * 0.16, height * 0.08)
        .fill({ color: 0x3f3a34, alpha: 0.35 })
      activity
        .rect(left + width * 0.26, top + height * 0.66, 10, 3)
        .rect(left + width * 0.62, top + height * 0.62, 12, 3)
        .rect(left + width * 0.5, top + height * 0.7, 8, 3)
        .fill({ color: 0x7f6a4d, alpha: 0.52 })
      return
    }

    if (levelKey === 'L4') {
      ground.label = 'main-eatery-placeholder-shopfront:open:L4'
      structure.label = 'main-eatery-placeholder-kitchen:steaming:L4'
      activity.label = 'main-eatery-placeholder-tables:served:L4'

      ground
        .rect(left + width * 0.18, top + height * 0.5, width * 0.64, height * 0.2)
        .fill({ color: 0xd69a72, alpha: 0.22 })
        .rect(left + width * 0.18, top + height * 0.48, width * 0.64, 4)
        .fill({ color: 0xf0b09a, alpha: 0.58 })
      structure
        .rect(left + width * 0.28, top + height * 0.32, width * 0.34, height * 0.2)
        .fill({ color: 0x9c7048, alpha: 0.58 })
        .poly([left + width * 0.24, top + height * 0.32, left + width * 0.45, top + height * 0.2, left + width * 0.66, top + height * 0.32])
        .fill({ color: 0xb85c4c, alpha: 0.62 })
      for (let index = 0; index < 3; index += 1) {
        const x = left + width * (0.32 + index * 0.12)
        activity
          .moveTo(x, top + height * 0.28)
          .lineTo(x + 4, top + height * 0.18)
          .stroke({ color: 0xe4e0d4, alpha: 0.5, width: 1 })
      }
      activity
        .circle(left + width * 0.28, top + height * 0.64, 5)
        .circle(left + width * 0.52, top + height * 0.62, 5)
        .circle(left + width * 0.7, top + height * 0.64, 5)
        .fill({ color: stateColor, alpha: 0.48 })
      return
    }

    ground.label = 'main-eatery-placeholder-food-street:awnings:L8'
    structure.label = 'main-eatery-placeholder-kitchens:busy:L8'
    activity.label = 'main-eatery-placeholder-crowd:banquet-stalls:L8'

    for (let index = 0; index < 4; index += 1) {
      const x = left + width * (0.14 + index * 0.18)
      ground
        .rect(x, top + height * 0.42, width * 0.15, 5)
        .fill({ color: index % 2 ? 0xf0b09a : 0xf0d982, alpha: 0.76 })
        .rect(x + 2, top + height * 0.48, width * 0.11, height * 0.14)
        .fill({ color: 0xd69a72, alpha: 0.34 })
      structure
        .rect(x + 3, top + height * 0.3, width * 0.1, height * 0.15)
        .fill({ color: 0x9c7048, alpha: 0.58 })
    }
    for (let index = 0; index < 5; index += 1) {
      const x = left + width * (0.24 + index * 0.1)
      structure
        .moveTo(x, top + height * 0.28)
        .lineTo(x + 3, top + height * 0.17)
    }
    structure.stroke({ color: 0xe4e0d4, alpha: 0.48, width: 1 })
    for (let index = 0; index < 8; index += 1) {
      activity
        .circle(left + width * (0.18 + index * 0.08), top + height * (0.68 - (index % 2) * 0.05), 2.2)
        .fill({ color: index % 2 ? 0xe7c6a5 : stateColor, alpha: 0.82 })
    }
  }

  private drawMainGranaryPlaceholderDetails(
    levelKey: 'L0' | 'L4' | 'L8',
    left: number,
    top: number,
    width: number,
    height: number,
    stateColor: number,
  ): void {
    const ground = this.prefabGoldAssetGround
    const structure = this.prefabGoldAssetStructure
    const activity = this.prefabGoldAssetActivity
    if (!ground || !structure || !activity) return

    if (levelKey === 'L0') {
      ground.label = 'main-granary-placeholder-ground:spilled-grain:L0'
      structure.label = 'main-granary-placeholder-silo:broken:L0'
      activity.label = 'main-granary-placeholder-pest-clutter:L0'

      ground
        .circle(left + width * 0.36, top + height * 0.66, 7)
        .circle(left + width * 0.56, top + height * 0.62, 5)
        .fill({ color: 0xe4b94f, alpha: 0.36 })
      structure
        .rect(left + width * 0.34, top + height * 0.34, width * 0.16, height * 0.24)
        .fill({ color: 0x8c806f, alpha: 0.5 })
        .moveTo(left + width * 0.32, top + height * 0.34)
        .lineTo(left + width * 0.58, top + height * 0.48)
        .stroke({ color: 0x3f3a34, alpha: 0.62, width: 1.5 })
      activity
        .circle(left + width * 0.62, top + height * 0.7, 2)
        .circle(left + width * 0.68, top + height * 0.66, 2)
        .rect(left + width * 0.24, top + height * 0.68, 10, 4)
        .fill({ color: 0x3f3a34, alpha: 0.46 })
      return
    }

    if (levelKey === 'L4') {
      ground.label = 'main-granary-placeholder-storehouse:raised:L4'
      structure.label = 'main-granary-placeholder-bins:sorted:L4'
      activity.label = 'main-granary-placeholder-labor:cart-scale:L4'

      ground
        .rect(left + width * 0.22, top + height * 0.58, width * 0.56, 5)
        .fill({ color: 0x7f6a4d, alpha: 0.58 })
        .moveTo(left + width * 0.26, top + height * 0.58)
        .lineTo(left + width * 0.26, top + height * 0.7)
        .moveTo(left + width * 0.72, top + height * 0.58)
        .lineTo(left + width * 0.72, top + height * 0.7)
        .stroke({ color: 0x3f3a34, alpha: 0.42, width: 1.2 })
      structure
        .rect(left + width * 0.28, top + height * 0.34, width * 0.34, height * 0.23)
        .fill({ color: 0x9f8660, alpha: 0.62 })
        .poly([left + width * 0.25, top + height * 0.34, left + width * 0.45, top + height * 0.2, left + width * 0.66, top + height * 0.34])
        .fill({ color: 0xc9b58a, alpha: 0.68 })
        .rect(left + width * 0.66, top + height * 0.4, width * 0.11, height * 0.16)
        .fill({ color: 0xe4b94f, alpha: 0.46 })
      activity
        .rect(left + width * 0.22, top + height * 0.68, 16, 7)
        .fill({ color: 0x9c7048, alpha: 0.55 })
        .circle(left + width * 0.27, top + height * 0.77, 2.5)
        .circle(left + width * 0.37, top + height * 0.77, 2.5)
        .fill({ color: 0x3f3a34, alpha: 0.72 })
        .circle(left + width * 0.74, top + height * 0.64, 4)
        .stroke({ color: stateColor, alpha: 0.7, width: 1.4 })
      return
    }

    ground.label = 'main-granary-placeholder-warehouse:multi-bay:L8'
    structure.label = 'main-granary-placeholder-silos:stacked:L8'
    activity.label = 'main-granary-placeholder-market-yard:carts-workers:L8'

    ground
      .rect(left + width * 0.12, top + height * 0.56, width * 0.76, height * 0.14)
      .fill({ color: 0xc9b58a, alpha: 0.28 })
    for (let index = 0; index < 3; index += 1) {
      const x = left + width * (0.16 + index * 0.19)
      ground
        .rect(x, top + height * 0.42, width * 0.16, height * 0.16)
        .fill({ color: 0x9f8660, alpha: 0.56 })
        .rect(x + width * 0.04, top + height * 0.52, width * 0.08, height * 0.06)
        .fill({ color: 0x283643, alpha: 0.3 })
    }
    for (let index = 0; index < 4; index += 1) {
      const x = left + width * (0.2 + index * 0.14)
      structure
        .roundRect(x, top + height * (0.22 + (index % 2) * 0.05), width * 0.1, height * 0.26, 4)
        .fill({ color: 0xe4b94f, alpha: 0.44 })
        .rect(x, top + height * (0.2 + (index % 2) * 0.05), width * 0.1, 3)
        .fill({ color: 0x7f6a4d, alpha: 0.58 })
    }
    for (let index = 0; index < 4; index += 1) {
      const x = left + width * (0.22 + index * 0.14)
      activity
        .rect(x, top + height * 0.68, 12, 5)
        .fill({ color: 0x9c7048, alpha: 0.58 })
        .circle(x + 2, top + height * 0.75, 2)
        .circle(x + 10, top + height * 0.75, 2)
        .fill({ color: 0x3f3a34, alpha: 0.7 })
        .circle(x + 6, top + height * 0.62, 2)
        .fill({ color: stateColor, alpha: 0.82 })
    }
  }

  private clearGoldAssetPlaceholderDetails(): void {
    this.prefabGoldAssetGround?.clear()
    this.prefabGoldAssetStructure?.clear()
    this.prefabGoldAssetActivity?.clear()
    if (this.prefabGoldAssetDetails) {
      this.prefabGoldAssetDetails.label = 'prefab-placeholder-gold-asset-details'
      this.prefabGoldAssetDetails.removeFromParent()
    }
    if (this.prefabGoldAssetGround) {
      this.prefabGoldAssetGround.label = 'gold-asset-placeholder-ground'
    }
    if (this.prefabGoldAssetStructure) {
      this.prefabGoldAssetStructure.label = 'gold-asset-placeholder-structure'
    }
    if (this.prefabGoldAssetActivity) {
      this.prefabGoldAssetActivity.label = 'gold-asset-placeholder-activity'
    }
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
    this.drawStatusHint(presentation, width, height, accent)
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

  private drawStatusHint(
    presentation: BuildingStatusPresentation,
    width: number,
    height: number,
    accent: number,
  ): void {
    const text = statusHintText(presentation)
    this.statusHint.visible = text.length > 0
    this.statusHint.label = text
      ? `building-status-hint:${presentation}:${text}`
      : `building-status-hint:${presentation}`
    this.statusHintBadge.label = `building-status-hint-badge:${presentation}`
    this.statusHintText.label = `building-status-hint-text:${presentation}:${text}`
    this.statusHintText.text = text
    this.statusHintText.position.set(-width * 0.42 + 5, -height - 27)
    this.statusHintBadge.clear()

    if (!text) return

    const badgeWidth = Math.max(24, text.length * 10 + 10)
    this.statusHintBadge
      .roundRect(-width * 0.42, -height - 29, badgeWidth, 13, 3)
      .fill({ color: 0xf4ecd7, alpha: 0.86 })
      .roundRect(-width * 0.42, -height - 29, 4, 13, 2)
      .fill({ color: accent, alpha: 0.9 })
      .moveTo(-width * 0.42 + badgeWidth * 0.5, -height - 16)
      .lineTo(-width * 0.42 + badgeWidth * 0.5 + 4, -height - 10)
      .lineTo(-width * 0.42 + badgeWidth * 0.5 + 8, -height - 16)
      .fill({ color: 0xf4ecd7, alpha: 0.86 })
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

    if (presentation === 'blocked:logistics-failed') {
      const drift = Math.sin(phase) * 2
      this.statusSymbol
        .moveTo(-13 + drift, y - 6)
        .lineTo(6 + drift, y - 6)
        .lineTo(12 + drift, y)
        .lineTo(6 + drift, y + 6)
        .lineTo(-13 + drift, y + 6)
        .closePath()
        .stroke({ color: accent, alpha: 0.9, width: 2 })
        .circle(-6 + drift, y + 9, 2.2)
        .circle(7 + drift, y + 9, 2.2)
        .fill({ color: accent, alpha: 0.82 })
      this.statusMotion
        .moveTo(-15 - drift, y - 13)
        .lineTo(-8 - drift, y - 13)
        .moveTo(-17 - drift, y - 9)
        .lineTo(-11 - drift, y - 9)
        .moveTo(14, y - 12)
        .lineTo(14, y + 12)
        .stroke({ color: accent, alpha: 0.72, width: 1.6 })
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
