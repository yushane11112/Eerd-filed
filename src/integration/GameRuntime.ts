import type {
  BuildingEntity,
  GridPoint,
  MusicCompletionEvent,
  RareResourceKind,
  ResourceKind,
  RoadKind,
  SimulationSnapshot,
} from '../simulation/contracts'
import {
  BUILDING_DEFINITIONS,
  BUILDING_MENU,
  CITY_STAGE_LABELS,
  deriveRuntimeCityStage,
  getRuntimeCityStageProgress,
  getRuntimeBuildingMenu,
  getRuntimeBuildingMenuState,
  isRuntimeBuildingUnlocked,
} from '../content/runtimeBuildings'
import {
  deriveDistrictProsperity,
  summarizeDistrictProsperity,
} from '../simulation/districts'
import { SimulationEngine, createInitialSimulationSnapshot } from '../simulation/core'
import {
  advanceBuildingUpgrades,
  buildingUpgradeCost,
  EconomySystem,
  effectiveBuildingDefinition,
  RoadRoutePlanner,
  quoteBuildingConstruction,
  roadConstructionCost,
  spendBuildingConstructionCost,
  startBuildingUpgradeFromCityStorage,
  upgradeBuildingFromCityStorage,
  type BuildingConstructionCost,
} from '../simulation/economy'
import {
  createDropSpawnState,
  flushPendingDrops,
  pickUpWorldDrop,
  settleMusicCompletion,
  spawnRandomOrdinaryDrop,
  type DropSpawnState,
} from '../simulation/rewards'
import { pointKey, WorldGrid, type PlacementIssue, type QuarterRotation } from '../simulation/world'
import { CityNoticeTracker, deriveCityNotices, type CityNotice } from './cityNotices'

export type BuildTool =
  | { kind: 'inspect' }
  | { kind: 'road' }
  | { kind: 'bridge' }
  | { kind: 'demolish-road' }
  | { kind: 'building'; type: string; rotation: QuarterRotation }

export interface RuntimeActionResult {
  ok: boolean
  message: string
  buildingId?: string
  roadPath?: {
    placed: number
    removed?: number
    skipped: number
    blocked: number
    invalidTerrain: number
    outOfBounds: number
    unchanged: number
    notRoad?: number
    unaffordable?: number
    treasuryCost?: number
    missingTreasury?: number
  }
  construction?: {
    treasury: number
    materials: Partial<Record<ResourceKind, number>>
  }
  demolition?: {
    householdsRemoved: number
    agentsRemoved: number
    workersReleased: number
    ordersCancelled: number
    carriersReleased: number
  }
  upgrade?: {
    level: number
    cost: Partial<Record<ResourceKind, number>>
    effect: {
      capacity: number
      jobs: number
    }
  }
}

export interface RoadPlanConstructionInput {
  cells: ReadonlyArray<{
    point: GridPoint
    kind: RoadKind
  }>
}

export type RuntimeDebugScenario = 'isolated-road-network' | 'isolated-road-network-low-treasury'

export interface GameRuntimeOptions {
  initialTreasury?: number
  debugScenario?: RuntimeDebugScenario
}

export interface BuildingPlacementPreviewCell {
  position: GridPoint
  status: 'footprint' | 'entrance' | 'blocked'
  label: string
}

export interface BuildingPlacementPreview {
  type: string
  rotation: QuarterRotation
  valid: boolean
  reason?: string
  origin: GridPoint
  entrance?: GridPoint
  cells: BuildingPlacementPreviewCell[]
  construction?: {
    cost: BuildingConstructionCost
    canAfford: boolean
    missingMaterials: Partial<Record<ResourceKind, number>>
    missingTreasury: number
  }
}

export interface BuildingUpgradeQuote {
  buildingId: string
  currentLevel: number
  nextLevel?: number
  maxLevel: number
  status: BuildingEntity['status']
  cost: Partial<Record<ResourceKind, number>>
  missing: Partial<Record<ResourceKind, number>>
  canUpgrade: boolean
  reason?: 'max-level' | 'insufficient-materials' | 'invalid-level' | 'upgrading' | 'already-upgrading' | 'unknown-building'
  effect?: {
    capacity: number
    jobs: number
  }
}

export {
  BUILDING_DEFINITIONS,
  BUILDING_MENU,
  CITY_STAGE_LABELS,
  deriveRuntimeCityStage,
  getRuntimeCityStageProgress,
  getRuntimeBuildingMenu,
  getRuntimeBuildingMenuState,
  isRuntimeBuildingUnlocked,
}

const RESOURCE_NAMES: Record<ResourceKind, string> = {
  food: '粮食', fish: '鱼获', wood: '木料', stone: '石料', clay: '黏土',
  brick: '砖瓦', cloth: '布匹', salt: '盐', medicine: '药材',
}

export class GameRuntime {
  readonly grid: WorldGrid
  private engine: SimulationEngine
  private dropState: DropSpawnState
  private listeners = new Set<() => void>()
  private snapshotCache: SimulationSnapshot
  private buildingSequence = 20
  private songSequence = 0
  private randomState = 0x4f1bbcdc
  private lastDropTick = 0
  private cityNoticeTracker = new CityNoticeTracker()

  constructor(options: GameRuntimeOptions = {}) {
    this.grid = new WorldGrid(28, 22, [], 'land')
    this.seedTerrainAndRoads()
    const buildings = this.seedBuildings()
    if (isIsolatedRoadNetworkScenario(options.debugScenario)) {
      this.applyIsolatedRoadNetworkScenario(buildings)
    }
    const initial = createInitialSimulationSnapshot({
      seed: 20260625,
      buildings,
      treasury: options.initialTreasury ?? debugScenarioInitialTreasury(options.debugScenario) ?? 2400,
      dayKey: localDayKey(Date.now()),
    })
    initial.cells = this.grid.toCells()
    initial.agents['carrier-1'] = {
      id: 'carrier-1', role: 'cart', position: { x: 13, y: 11 },
      path: [], pathIndex: 0, activity: 'idle',
    }
    this.dropState = createDropSpawnState()
    this.applyDistrictProsperity(initial)
    this.engine = this.createEngine(initial)
    this.engine.step(45)
    this.snapshotCache = this.withDistrictProsperity(this.engine.snapshot)
  }

  getSnapshot = (): SimulationSnapshot => this.snapshotCache

  getCityNotices = (): CityNotice[] => deriveCityNotices(this.snapshotCache)

  consumeCityNoticeEvents = (): CityNotice[] => this.cityNoticeTracker.update(this.snapshotCache)

  getBuildingUpgradeQuote(buildingId: string): BuildingUpgradeQuote | undefined {
    const snapshot = this.engine.snapshot
    const building = snapshot.buildings[buildingId]
    if (!building) return undefined
    const definition = BUILDING_DEFINITIONS[building.type]
    if (!definition) {
      return {
        buildingId,
        currentLevel: building.level,
        maxLevel: 0,
        status: building.status,
        cost: {},
        missing: {},
        canUpgrade: false,
        reason: 'unknown-building',
      }
    }

    const maxLevel = definition.maxLevel
    const cost = buildingUpgradeCost(building, definition)
    if (building.status === 'upgrading') {
      return {
        buildingId,
        currentLevel: building.level,
        nextLevel: building.level < maxLevel ? building.level + 1 : undefined,
        maxLevel,
        status: building.status,
        cost,
        missing: {},
        canUpgrade: false,
        reason: 'upgrading',
      }
    }

    const clonedBuildings = cloneBuildings(snapshot.buildings)
    const clonedBuilding = clonedBuildings[buildingId]
    const result = upgradeBuildingFromCityStorage(
      clonedBuilding,
      definition,
      clonedBuildings,
      BUILDING_DEFINITIONS,
    )

    if (!result.ok) {
      return {
        buildingId,
        currentLevel: building.level,
        nextLevel: result.reason === 'max-level' ? undefined : building.level + 1,
        maxLevel,
        status: building.status,
        cost,
        missing: result.missing ?? {},
        canUpgrade: false,
        reason: result.reason,
      }
    }

    return {
      buildingId,
      currentLevel: building.level,
      nextLevel: result.level,
      maxLevel,
      status: building.status,
      cost: result.cost,
      missing: {},
      canUpgrade: true,
      effect: result.effect,
    }
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  advance(elapsedMs: number) {
    const result = this.engine.advance(elapsedMs)
    if (result.ticks === 0) return
    let snapshot = this.engine.snapshot
    this.applyDistrictProsperity(snapshot)
    const hasUpgradingBuildings = Object.values(snapshot.buildings)
      .some((building) => building.status === 'upgrading')
    if (hasUpgradingBuildings) {
      advanceBuildingUpgrades(snapshot.buildings, BUILDING_DEFINITIONS, result.ticks)
    }
    if (snapshot.tick - this.lastDropTick >= 40) {
      this.lastDropTick = snapshot.tick
      const spawned = spawnRandomOrdinaryDrop(
        this.dropState,
        snapshot.tick,
        this.dropContext(),
        { minAmount: 1, maxAmount: 2 },
      )
      this.dropState = spawned.state
      snapshot.worldDrops = this.dropState.visible
      this.rebuild(snapshot)
    } else if (hasUpgradingBuildings) {
      this.rebuild(snapshot)
    } else {
      this.snapshotCache = this.withDistrictProsperity(snapshot)
      this.emit()
    }
  }

  setSpeed(speed: 0 | 1 | 2 | 4) {
    this.engine.setSpeed(speed)
    this.refresh()
  }

  placeRoad(point: GridPoint): RuntimeActionResult {
    const result = this.placeRoadPath([point])
    if (!result.ok) return result
    return {
      ...result,
      message: `石板路已铺好，消耗银两${result.roadPath?.treasuryCost ?? 0}，建筑与物流可沿路连接。`,
    }
  }

  placeRoadPath(points: readonly GridPoint[]): RuntimeActionResult {
    return this.placeRoadKindPath(points, 'stone')
  }

  placeBridgePath(points: readonly GridPoint[]): RuntimeActionResult {
    return this.placeRoadKindPath(points, 'bridge')
  }

  buildRoadPlan(plan: RoadPlanConstructionInput): RuntimeActionResult {
    const visited = new Set<string>()
    const stats = {
      placed: 0,
      skipped: 0,
      blocked: 0,
      invalidTerrain: 0,
      outOfBounds: 0,
      unchanged: 0,
      unaffordable: 0,
      treasuryCost: 0,
      missingTreasury: 0,
      roadPlaced: 0,
      bridgePlaced: 0,
    }
    const snapshot = this.engine.snapshot
    let treasury = snapshot.economy.treasury
    for (const item of plan.cells) {
      const rounded = { x: Math.round(item.point.x), y: Math.round(item.point.y) }
      const roadKind = item.kind
      const key = `${roadKind}:${pointKey(rounded)}`
      if (visited.has(key)) continue
      visited.add(key)
      const cell = this.grid.getCell(rounded)
      if (!cell) {
        stats.skipped += 1
        stats.outOfBounds += 1
        continue
      }
      if (cell.buildingId) {
        stats.skipped += 1
        stats.blocked += 1
        continue
      }
      const validTerrain = roadKind === 'bridge'
        ? cell.terrain === 'water' || cell.terrain === 'shore'
        : cell.terrain !== 'water'
      if (!validTerrain) {
        stats.skipped += 1
        stats.invalidTerrain += 1
        continue
      }
      if (cell.road === roadKind) {
        stats.skipped += 1
        stats.unchanged += 1
        continue
      }
      const roadCost = roadConstructionCost(roadKind).treasury
      if (treasury < roadCost) {
        stats.skipped += 1
        stats.unaffordable += 1
        stats.missingTreasury = Math.max(stats.missingTreasury, roadCost - treasury)
        continue
      }
      const result = this.grid.placeRoad(rounded, roadKind)
      if (result.changed) {
        stats.placed += 1
        if (roadKind === 'bridge') stats.bridgePlaced += 1
        else stats.roadPlaced += 1
        treasury -= roadCost
        stats.treasuryCost += roadCost
        continue
      }
      stats.skipped += 1
      if (result.reason === 'building-occupied') stats.blocked += 1
      else if (result.reason === 'invalid-terrain') stats.invalidTerrain += 1
      else if (result.reason === 'out-of-bounds') stats.outOfBounds += 1
      else stats.unchanged += 1
    }
    if (stats.placed > 0) {
      snapshot.economy.treasury = treasury
      snapshot.cells = this.grid.toCells()
      this.rebuild(snapshot)
    }
    return {
      ok: stats.placed > 0,
      message: roadPlanMessage(stats),
      roadPath: stats,
    }
  }

  private placeRoadKindPath(points: readonly GridPoint[], roadKind: RoadKind): RuntimeActionResult {
    const visited = new Set<string>()
    const stats = {
      placed: 0,
      skipped: 0,
      blocked: 0,
      invalidTerrain: 0,
      outOfBounds: 0,
      unchanged: 0,
      unaffordable: 0,
      treasuryCost: 0,
      missingTreasury: 0,
    }
    const roadCost = roadConstructionCost(roadKind).treasury
    const snapshot = this.engine.snapshot
    let treasury = snapshot.economy.treasury
    for (const point of points) {
      const rounded = { x: Math.round(point.x), y: Math.round(point.y) }
      const key = pointKey(rounded)
      if (visited.has(key)) continue
      visited.add(key)
      const cell = this.grid.getCell(rounded)
      if (!cell) {
        stats.skipped += 1
        stats.outOfBounds += 1
        continue
      }
      if (cell.buildingId) {
        stats.skipped += 1
        stats.blocked += 1
        continue
      }
      const validTerrain = roadKind === 'bridge'
        ? cell.terrain === 'water' || cell.terrain === 'shore'
        : cell.terrain !== 'water'
      if (!validTerrain) {
        stats.skipped += 1
        stats.invalidTerrain += 1
        continue
      }
      if (cell.road === roadKind) {
        stats.skipped += 1
        stats.unchanged += 1
        continue
      }
      if (treasury < roadCost) {
        stats.skipped += 1
        stats.unaffordable += 1
        stats.missingTreasury = Math.max(stats.missingTreasury, roadCost - treasury)
        continue
      }
      const result = this.grid.placeRoad(rounded, roadKind)
      if (result.changed) {
        stats.placed += 1
        treasury -= roadCost
        stats.treasuryCost += roadCost
        continue
      }
      stats.skipped += 1
      if (result.reason === 'building-occupied') stats.blocked += 1
      else if (result.reason === 'invalid-terrain') stats.invalidTerrain += 1
      else if (result.reason === 'out-of-bounds') stats.outOfBounds += 1
      else stats.unchanged += 1
    }
    if (stats.placed > 0) {
      snapshot.economy.treasury = treasury
      snapshot.cells = this.grid.toCells()
      this.rebuild(snapshot)
    }
    return {
      ok: stats.placed > 0,
      message: roadPathMessage(stats, roadKind),
      roadPath: stats,
    }
  }

  removeRoadPath(points: readonly GridPoint[]): RuntimeActionResult {
    const visited = new Set<string>()
    const stats = {
      placed: 0,
      removed: 0,
      skipped: 0,
      blocked: 0,
      invalidTerrain: 0,
      outOfBounds: 0,
      unchanged: 0,
      notRoad: 0,
    }
    for (const point of points) {
      const rounded = { x: Math.round(point.x), y: Math.round(point.y) }
      const key = pointKey(rounded)
      if (visited.has(key)) continue
      visited.add(key)
      const result = this.grid.removeRoad(rounded)
      if (result.changed) {
        stats.removed += 1
        continue
      }
      stats.skipped += 1
      if (result.reason === 'out-of-bounds') stats.outOfBounds += 1
      else if (result.reason === 'not-a-road') stats.notRoad += 1
      else stats.unchanged += 1
    }
    if (stats.removed > 0) {
      const snapshot = this.engine.snapshot
      snapshot.cells = this.grid.toCells()
      this.rebuild(snapshot)
    }
    return {
      ok: stats.removed > 0,
      message: removeRoadPathMessage(stats),
      roadPath: stats,
    }
  }

  demolishBuilding(buildingId: string): RuntimeActionResult {
    const snapshot = this.engine.snapshot
    const building = snapshot.buildings[buildingId]
    if (!building) return { ok: false, message: '未找到这座建筑', buildingId }

    const stats = {
      householdsRemoved: 0,
      agentsRemoved: 0,
      workersReleased: 0,
      ordersCancelled: 0,
      carriersReleased: 0,
    }
    const removedHouseholdIds = new Set<string>()
    const removedAgentIds = new Set<string>()

    for (const household of Object.values(snapshot.households)) {
      if (household.homeBuildingId !== buildingId) continue
      removedHouseholdIds.add(household.id)
      delete snapshot.households[household.id]
      stats.householdsRemoved += 1
    }

    for (const agent of Object.values(snapshot.agents)) {
      if (agent.householdId && removedHouseholdIds.has(agent.householdId)) {
        removedAgentIds.add(agent.id)
        continue
      }
      if (agent.serviceIntent?.buildingId === buildingId) {
        removedAgentIds.add(agent.id)
        continue
      }
      if (agent.employerBuildingId === buildingId) {
        delete agent.employerBuildingId
        agent.activity = 'home'
        agent.path = []
        agent.pathIndex = 0
        delete agent.activityStartedTick
        stats.workersReleased += 1
      }
    }

    for (const agentId of removedAgentIds) {
      delete snapshot.agents[agentId]
      stats.agentsRemoved += 1
    }

    for (const remainingBuilding of Object.values(snapshot.buildings)) {
      remainingBuilding.workers = remainingBuilding.workers.filter((workerId) => !removedAgentIds.has(workerId))
      if (remainingBuilding.id === buildingId) remainingBuilding.workers = []
    }

    for (const order of Object.values(snapshot.logisticsOrders)) {
      if (
        order.state === 'delivered'
        || order.state === 'cancelled'
        || (order.sourceBuildingId !== buildingId && order.destinationBuildingId !== buildingId)
      ) {
        continue
      }
      if (order.carrierId) {
        const carrier = snapshot.agents[order.carrierId]
        if (carrier) {
          carrier.activity = 'idle'
          carrier.path = []
          carrier.pathIndex = 0
          delete carrier.cargoIntent
          stats.carriersReleased += 1
        }
      }
      order.state = 'cancelled'
      order.cancelReason = 'building-demolished'
      delete order.failureReason
      delete order.carrierId
      stats.ordersCancelled += 1
    }

    this.grid.removeBuilding(buildingId)
    delete snapshot.buildings[buildingId]
    snapshot.cells = this.grid.toCells()
    this.rebuild(snapshot)

    return {
      ok: true,
      message: `${buildingId} 已拆除，迁出 ${stats.householdsRemoved} 户，取消 ${stats.ordersCancelled} 条物流。`,
      buildingId,
      demolition: stats,
    }
  }

  previewBuildingPlacement(type: string, point: GridPoint, rotation: QuarterRotation): BuildingPlacementPreview {
    const definition = BUILDING_DEFINITIONS[type]
    if (!definition) {
      return {
        type,
        rotation,
        valid: false,
        reason: '未知建筑类型',
        origin: { ...point },
        cells: [],
      }
    }
    const stage = deriveRuntimeCityStage(this.snapshotCache.metrics)
    if (!isRuntimeBuildingUnlocked(type, stage)) {
      return {
        type,
        rotation,
        valid: false,
        reason: `${definition.name}需要进入${CITY_STAGE_LABELS[definition.cityStage ?? 'water-town']}后营造。`,
        origin: { ...point },
        cells: [],
      }
    }
    const placement = this.grid.validateBuildingPlacement(`preview-${type}`, definition, point, rotation, {
      requireRoadAccess: true,
    })
    const issueByPoint = new Map(
      placement.issues
        .filter((issue) => issue.point)
        .map((issue) => [pointKey(issue.point!), issue]),
    )
    const cells: BuildingPlacementPreviewCell[] = placement.footprint.map((position) => {
      const issue = issueByPoint.get(pointKey(position))
      return {
        position: { ...position },
        status: issue && issue.reason !== 'no-road-access' ? 'blocked' : 'footprint',
        label: issue && issue.reason !== 'no-road-access' ? placementIssueLabel(issue) : '占地',
      }
    })
    if (placement.entrance) {
      const entranceIssue = placement.issues.find((issue) => issue.reason === 'no-road-access')
      cells.push({
        position: { ...placement.entrance },
        status: entranceIssue ? 'blocked' : 'entrance',
        label: entranceIssue ? '入口未连路' : '入口',
      })
    }
    const snapshot = this.engine.snapshot
    const construction = quoteBuildingConstruction(
      type,
      definition,
      snapshot.economy.treasury,
      snapshot.buildings,
      BUILDING_DEFINITIONS,
    )
    const placementReason = placement.valid ? undefined : placementFailureMessage(placement.issues[0])
    const constructionReason = construction.canAfford ? undefined : constructionFailureMessage(construction)
    return {
      type,
      rotation,
      valid: placement.valid && construction.canAfford,
      reason: placementReason ?? constructionReason,
      origin: { ...point },
      entrance: placement.entrance ? { ...placement.entrance } : undefined,
      cells,
      construction,
    }
  }

  placeBuilding(type: string, point: GridPoint, rotation: QuarterRotation): RuntimeActionResult {
    const definition = BUILDING_DEFINITIONS[type]
    if (!definition) return { ok: false, message: '未知建筑类型' }
    const stage = deriveRuntimeCityStage(this.snapshotCache.metrics)
    if (!isRuntimeBuildingUnlocked(type, stage)) {
      return {
        ok: false,
        message: `${definition.name}需要进入${CITY_STAGE_LABELS[definition.cityStage ?? 'water-town']}后营造。`,
      }
    }
    const id = `${type}-${++this.buildingSequence}`
    const placement = this.grid.validateBuildingPlacement(id, definition, point, rotation, {
      requireRoadAccess: true,
    })
    if (!placement.valid || !placement.entrance) {
      const issue = placement.issues[0]
      const message = issue?.reason === 'no-road-access'
        ? '入口必须紧邻道路'
        : issue?.reason === 'building-occupied' || issue?.reason === 'road-occupied'
          ? '这个位置已被占用'
          : '地块空间不足，无法营造'
      return { ok: false, message }
    }
    const snapshot = this.engine.snapshot
    const payment = spendBuildingConstructionCost(
      type,
      definition,
      snapshot.economy.treasury,
      snapshot.buildings,
      BUILDING_DEFINITIONS,
    )
    if (!payment.ok) {
      const missingMaterials = formatResourceList(payment.quote.missingMaterials)
      const missingTreasury = payment.quote.missingTreasury
      const shortage = [
        missingTreasury > 0 ? `银两不足${missingTreasury}` : '',
        missingMaterials === '无' ? '' : `材料不足：${missingMaterials}`,
      ].filter(Boolean).join('，')
      return {
        ok: false,
        message: shortage || '营造资源不足',
      }
    }
    const committed = this.grid.placeBuilding(id, definition, point, rotation, {
      requireRoadAccess: true,
    })
    if (!committed.valid || !committed.entrance) {
      return { ok: false, message: '地块状态已变化，无法营造' }
    }
    snapshot.economy.treasury = payment.treasury
    snapshot.buildings[id] = createBuilding(id, type, point, placement.entrance, rotation)
    snapshot.cells = this.grid.toCells()
    this.rebuild(snapshot)
    return {
      ok: true,
      message: `${definition.name}已落成，消耗银两${payment.cost.treasury}、${formatResourceList(payment.cost.materials)}。`,
      buildingId: id,
      construction: payment.cost,
    }
  }

  upgradeBuilding(buildingId: string): RuntimeActionResult {
    const snapshot = this.engine.snapshot
    const building = snapshot.buildings[buildingId]
    if (!building) return { ok: false, message: '未找到这座建筑' }
    const definition = BUILDING_DEFINITIONS[building.type]
    if (!definition) return { ok: false, message: '未知建筑类型', buildingId }

    const result = startBuildingUpgradeFromCityStorage(
      building,
      definition,
      snapshot.buildings,
      BUILDING_DEFINITIONS,
    )
    if (!result.ok) {
      if (result.reason === 'max-level') {
        return { ok: false, message: '这座建筑已达到最高等级', buildingId }
      }
      if (result.reason === 'insufficient-materials') {
        return {
          ok: false,
          message: `升级材料不足：${formatResourceList(result.missing ?? {})}`,
          buildingId,
        }
      }
      if (result.reason === 'already-upgrading') {
        return { ok: false, message: '这座建筑正在升级中', buildingId }
      }
      return { ok: false, message: '建筑等级状态异常，无法升级', buildingId }
    }

    const targetEffect = effectiveBuildingDefinition(definition, { level: result.targetLevel })
    this.rebuild(snapshot)
    return {
      ok: true,
      message: `${definition.name}开始升级至 ${result.targetLevel} 级，预计 ${result.durationTicks} tick 完工。`,
      buildingId,
      upgrade: {
        level: result.targetLevel,
        cost: result.cost,
        effect: {
          capacity: targetEffect.capacity,
          jobs: targetEffect.jobs,
        },
      },
    }
  }

  buildingAt(point: GridPoint) {
    return this.grid.getBuildingAt(point)
  }

  collectNearest(point: GridPoint, radius = 1.35): RuntimeActionResult {
    const nearest = this.dropState.visible
      .map((drop) => ({ drop, distance: Math.hypot(drop.position.x - point.x, drop.position.y - point.y) }))
      .filter(({ distance }) => distance <= radius)
      .sort((a, b) => a.distance - b.distance)[0]?.drop
    if (!nearest) return { ok: false, message: '' }

    const pickup = pickUpWorldDrop(this.dropState, nearest.id)
    this.dropState = pickup.state
    const snapshot = this.engine.snapshot
    const warehouse = Object.values(snapshot.buildings).find((building) => building.type === 'granary')
    if (warehouse && pickup.pickedUp) {
      warehouse.inventory[pickup.pickedUp.resource] =
        (warehouse.inventory[pickup.pickedUp.resource] ?? 0) + pickup.pickedUp.amount
    }
    const flushed = flushPendingDrops(this.dropState, this.dropContext())
    this.dropState = flushed.state
    snapshot.worldDrops = this.dropState.visible
    this.rebuild(snapshot)
    return {
      ok: true,
      message: pickup.pickedUp
        ? `拾取 ${RESOURCE_NAMES[pickup.pickedUp.resource]} ×${pickup.pickedUp.amount}，已送入粮仓。`
        : '材料已拾取',
    }
  }

  completeSong(): { reward?: RareResourceKind; misses: number } {
    this.songSequence += 1
    const event: MusicCompletionEvent = {
      eventId: `demo-song-${this.songSequence}`,
      trackId: `track-${this.songSequence}`,
      listenedSeconds: 210,
      durationSeconds: 240,
      completedAt: Date.now(),
    }
    const snapshot = this.engine.snapshot
    const result = settleMusicCompletion(snapshot.rareRewards, event, {
      random: () => this.random(),
      dayKey: localDayKey,
    })
    snapshot.rareRewards = result.state
    this.rebuild(snapshot)
    return { reward: result.reward, misses: result.state.missesSinceReward }
  }

  private seedTerrainAndRoads() {
    for (let x = 0; x < this.grid.width; x += 1) {
      for (let y = 0; y < this.grid.height; y += 1) {
        if (x < 2 || y < 2 || x >= this.grid.width - 2 || y >= this.grid.height - 2) {
          this.grid.setTerrain({ x, y }, 'water')
        } else if (x === 2 || y === 2 || x === this.grid.width - 3 || y === this.grid.height - 3) {
          this.grid.setTerrain({ x, y }, 'shore')
        }
      }
    }
    for (let x = 3; x <= 24; x += 1) this.grid.placeRoad({ x, y: 11 }, 'stone')
    for (let y = 4; y <= 18; y += 1) this.grid.placeRoad({ x: 13, y }, 'stone')
    for (let x = 7; x <= 20; x += 1) this.grid.placeRoad({ x, y: 7 }, 'dirt')
    for (let y = 7; y <= 15; y += 1) this.grid.placeRoad({ x: 20, y }, 'dirt')
  }

  private seedBuildings(): Record<string, BuildingEntity> {
    const seeds: Array<[string, string, GridPoint, QuarterRotation, Partial<Record<ResourceKind, number>>?]> = [
      ['house-1', 'house', { x: 8, y: 9 }, 0],
      ['house-2', 'house', { x: 15, y: 9 }, 0],
      ['granary-1', 'granary', { x: 10, y: 5 }, 0, { wood: 14, stone: 8, food: 20 }],
      ['riceField-1', 'riceField', { x: 21, y: 9 }, 0],
      ['market-1', 'market', { x: 14, y: 5 }, 0],
    ]
    const buildings: Record<string, BuildingEntity> = {}
    for (const [id, type, origin, rotation, inventory] of seeds) {
      const definition = BUILDING_DEFINITIONS[type]
      const placement = this.grid.placeBuilding(id, definition, origin, rotation, { requireRoadAccess: true })
      if (!placement.valid || !placement.entrance) continue
      buildings[id] = createBuilding(id, type, origin, placement.entrance, rotation, inventory)
    }
    return buildings
  }

  private applyIsolatedRoadNetworkScenario(buildings: Record<string, BuildingEntity>) {
    this.grid.removeRoad({ x: 6, y: 11 })
    this.grid.placeRoad({ x: 6, y: 9 }, 'stone')
    this.grid.placeRoad({ x: 6, y: 10 }, 'stone')
    this.grid.placeRoad({ x: 6, y: 12 }, 'stone')
    this.grid.placeRoad({ x: 7, y: 12 }, 'stone')

    const id = 'debug-isolated-house'
    const type = 'house'
    const origin = { x: 4, y: 8 }
    const rotation: QuarterRotation = 0
    const definition = BUILDING_DEFINITIONS[type]
    const placement = this.grid.placeBuilding(id, definition, origin, rotation, { requireRoadAccess: true })
    if (placement.valid && placement.entrance) {
      buildings[id] = createBuilding(id, type, origin, placement.entrance, rotation)
    }
  }

  private createEngine(snapshot: SimulationSnapshot) {
    return new SimulationEngine(snapshot, {
      buildingDefinitions: BUILDING_DEFINITIONS,
      systems: [
        new EconomySystem({
          definitions: BUILDING_DEFINITIONS,
          routePlanner: new RoadRoutePlanner(),
          settlementIntervalTicks: 75,
        }),
      ],
      ticksPerSecond: 5,
      migrationIntervalTicks: 20,
    })
  }

  private rebuild(snapshot: SimulationSnapshot) {
    snapshot.cells = this.grid.toCells()
    snapshot.worldDrops = this.dropState.visible
    this.applyDistrictProsperity(snapshot)
    this.engine = this.createEngine(snapshot)
    this.snapshotCache = this.withDistrictProsperity(this.engine.snapshot)
    this.emit()
  }

  private refresh() {
    this.snapshotCache = this.withDistrictProsperity(this.engine.snapshot)
    this.emit()
  }

  private withDistrictProsperity(snapshot: SimulationSnapshot): SimulationSnapshot {
    this.applyDistrictProsperity(snapshot)
    return snapshot
  }

  private applyDistrictProsperity(snapshot: SimulationSnapshot) {
    const districts = deriveDistrictProsperity(snapshot, BUILDING_DEFINITIONS)
    snapshot.districts = districts
    snapshot.metrics = {
      ...snapshot.metrics,
      ...summarizeDistrictProsperity(districts),
    }
  }

  private emit() {
    this.listeners.forEach((listener) => listener())
  }

  private dropContext() {
    const candidates = this.grid.toCells()
      .filter((cell) => cell.terrain !== 'water' && !cell.buildingId)
      .map((cell) => cell.point)
    return {
      candidatePositions: candidates,
      isReachable: (point: GridPoint) => this.grid.getTerrain(point) !== 'water',
      random: () => this.random(),
    }
  }

  private random() {
    this.randomState = (Math.imul(this.randomState, 1664525) + 1013904223) >>> 0
    return this.randomState / 0x1_0000_0000
  }
}

function createBuilding(
  id: string,
  type: string,
  origin: GridPoint,
  entrance: GridPoint,
  rotation: QuarterRotation,
  inventory: Partial<Record<ResourceKind, number>> = {},
): BuildingEntity {
  return {
    id,
    type,
    origin: { ...origin },
    rotation,
    level: 1,
    entrance: { ...entrance },
    status: 'idle',
    workers: [],
    inventory: { ...inventory },
    productionProgress: 0,
  }
}

function isIsolatedRoadNetworkScenario(scenario: RuntimeDebugScenario | undefined): boolean {
  return scenario === 'isolated-road-network' || scenario === 'isolated-road-network-low-treasury'
}

function debugScenarioInitialTreasury(scenario: RuntimeDebugScenario | undefined): number | undefined {
  if (scenario === 'isolated-road-network-low-treasury') return 4
  return undefined
}

function cloneBuildings(buildings: Record<string, BuildingEntity>): Record<string, BuildingEntity> {
  return Object.fromEntries(
    Object.entries(buildings).map(([id, building]) => [
      id,
      {
        ...building,
        origin: { ...building.origin },
        entrance: { ...building.entrance },
        workers: [...building.workers],
        inventory: { ...building.inventory },
      },
    ]),
  )
}

function localDayKey(timestamp: number) {
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatResourceList(resources: Partial<Record<ResourceKind, number>>): string {
  const entries = Object.entries(resources).filter((entry): entry is [ResourceKind, number] => (
    typeof entry[1] === 'number' && entry[1] > 0
  ))
  if (entries.length === 0) return '无'
  return entries.map(([resource, amount]) => `${RESOURCE_NAMES[resource]}×${amount}`).join('、')
}

function constructionFailureMessage(construction: {
  missingMaterials: Partial<Record<ResourceKind, number>>
  missingTreasury: number
}): string {
  const missingMaterials = formatResourceList(construction.missingMaterials)
  return [
    construction.missingTreasury > 0 ? `银两不足${construction.missingTreasury}` : '',
    missingMaterials === '无' ? '' : `材料不足：${missingMaterials}`,
  ].filter(Boolean).join('，') || '营造资源不足'
}

function roadPathMessage(
  stats: NonNullable<RuntimeActionResult['roadPath']>,
  roadKind: RoadKind,
): string {
  if (stats.placed <= 0) {
    if ((stats.unaffordable ?? 0) > 0) return `银两不足${stats.missingTreasury ?? 0}，无法${roadKind === 'bridge' ? '架设桥路' : '铺设道路'}。`
    if (stats.blocked > 0) return roadKind === 'bridge' ? '路径被建筑占用，无法架桥。' : '路径被建筑占用，无法铺路。'
    if (stats.invalidTerrain > 0) return roadKind === 'bridge' ? '桥路只能架在水面或岸边。' : '路径包含水面或不可铺设地形。'
    return roadKind === 'bridge' ? '这段路径没有新增桥路。' : '这段路径没有新增道路。'
  }
  const cost = (stats.treasuryCost ?? 0) > 0 ? `，花费银两${stats.treasuryCost}` : ''
  const skipped = stats.skipped > 0 ? `，跳过 ${stats.skipped} 格` : ''
  return roadKind === 'bridge'
    ? `连续架设 ${stats.placed} 格桥路${cost}${skipped}。`
    : `连续铺设 ${stats.placed} 格石板路${cost}${skipped}。`
}

function roadPlanMessage(stats: NonNullable<RuntimeActionResult['roadPath']> & {
  roadPlaced?: number
  bridgePlaced?: number
}): string {
  if (stats.placed <= 0) {
    if ((stats.unaffordable ?? 0) > 0) return `银两不足${stats.missingTreasury ?? 0}，无法执行补线施工。`
    if (stats.blocked > 0) return '补线路径被建筑占用，无法施工。'
    if (stats.invalidTerrain > 0) return '补线路径包含不可施工地形。'
    return '补线计划没有新增道路或桥梁。'
  }
  const parts = [
    (stats.roadPlaced ?? 0) > 0 ? `铺设道路 ${stats.roadPlaced} 格` : '',
    (stats.bridgePlaced ?? 0) > 0 ? `桥梁 ${stats.bridgePlaced} 格` : '',
  ].filter(Boolean)
  const cost = (stats.treasuryCost ?? 0) > 0 ? `，花费银两${stats.treasuryCost}` : ''
  const skipped = stats.skipped > 0 ? `，跳过 ${stats.skipped} 格` : ''
  return `补线施工完成：${parts.join('、')}${cost}${skipped}。`
}

function removeRoadPathMessage(stats: NonNullable<RuntimeActionResult['roadPath']>): string {
  const removed = stats.removed ?? 0
  if (removed <= 0) {
    if ((stats.outOfBounds ?? 0) > 0) return '这段路径超出地图，无法拆路。'
    return '这段路径没有可拆除的道路。'
  }
  const skipped = stats.skipped > 0 ? `，跳过 ${stats.skipped} 格` : ''
  return `拆除 ${removed} 格道路${skipped}。`
}

function placementFailureMessage(issue: PlacementIssue | undefined): string {
  if (!issue) return '地块空间不足，无法营造'
  if (issue.reason === 'no-road-access') return '入口必须紧邻道路'
  if (issue.reason === 'building-occupied' || issue.reason === 'road-occupied') return '这个位置已被占用'
  if (issue.reason === 'terrain' || issue.reason === 'out-of-bounds') return '地块空间不足，无法营造'
  return '地块空间不足，无法营造'
}

function placementIssueLabel(issue: PlacementIssue): string {
  if (issue.reason === 'building-occupied') return '已有建筑'
  if (issue.reason === 'road-occupied') return '已有道路'
  if (issue.reason === 'terrain') return '地形不符'
  if (issue.reason === 'out-of-bounds') return '超出地图'
  if (issue.reason === 'no-road-access') return '入口未连路'
  return '不可放置'
}
