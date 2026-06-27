import type {
  BuildingEntity,
  GridPoint,
  MusicCompletionEvent,
  RareResourceKind,
  ResourceKind,
  SimulationSnapshot,
} from '../simulation/contracts'
import {
  BUILDING_DEFINITIONS,
  BUILDING_MENU,
} from '../content/runtimeBuildings'
import { SimulationEngine, createInitialSimulationSnapshot } from '../simulation/core'
import {
  advanceBuildingUpgrades,
  buildingUpgradeCost,
  EconomySystem,
  effectiveBuildingDefinition,
  RoadRoutePlanner,
  startBuildingUpgradeFromCityStorage,
  upgradeBuildingFromCityStorage,
} from '../simulation/economy'
import {
  createDropSpawnState,
  flushPendingDrops,
  pickUpWorldDrop,
  settleMusicCompletion,
  spawnRandomOrdinaryDrop,
  type DropSpawnState,
} from '../simulation/rewards'
import { WorldGrid, type QuarterRotation } from '../simulation/world'
import { CityNoticeTracker, deriveCityNotices, type CityNotice } from './cityNotices'

export type BuildTool =
  | { kind: 'inspect' }
  | { kind: 'road' }
  | { kind: 'building'; type: string; rotation: QuarterRotation }

export interface RuntimeActionResult {
  ok: boolean
  message: string
  buildingId?: string
  upgrade?: {
    level: number
    cost: Partial<Record<ResourceKind, number>>
    effect: {
      capacity: number
      jobs: number
    }
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

export { BUILDING_DEFINITIONS, BUILDING_MENU }

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

  constructor() {
    this.grid = new WorldGrid(28, 22, [], 'land')
    this.seedTerrainAndRoads()
    const buildings = this.seedBuildings()
    const initial = createInitialSimulationSnapshot({
      seed: 20260625,
      buildings,
      treasury: 2400,
      dayKey: localDayKey(Date.now()),
    })
    initial.cells = this.grid.toCells()
    initial.agents['carrier-1'] = {
      id: 'carrier-1', role: 'cart', position: { x: 13, y: 11 },
      path: [], pathIndex: 0, activity: 'idle',
    }
    this.dropState = createDropSpawnState()
    this.engine = this.createEngine(initial)
    this.engine.step(45)
    this.snapshotCache = this.engine.snapshot
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
      this.snapshotCache = snapshot
      this.emit()
    }
  }

  setSpeed(speed: 0 | 1 | 2 | 4) {
    this.engine.setSpeed(speed)
    this.refresh()
  }

  placeRoad(point: GridPoint): RuntimeActionResult {
    const result = this.grid.placeRoad(point, 'stone')
    if (!result.changed) {
      return { ok: false, message: result.reason === 'building-occupied' ? '建筑占用了这个地块' : '这里无法铺路' }
    }
    const snapshot = this.engine.snapshot
    snapshot.cells = this.grid.toCells()
    this.rebuild(snapshot)
    return { ok: true, message: '石板路已铺好，建筑与物流可沿路连接。' }
  }

  placeBuilding(type: string, point: GridPoint, rotation: QuarterRotation): RuntimeActionResult {
    const definition = BUILDING_DEFINITIONS[type]
    if (!definition) return { ok: false, message: '未知建筑类型' }
    const id = `${type}-${++this.buildingSequence}`
    const placement = this.grid.placeBuilding(id, definition, point, rotation, {
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
    snapshot.buildings[id] = createBuilding(id, type, point, placement.entrance, rotation)
    snapshot.cells = this.grid.toCells()
    this.rebuild(snapshot)
    return { ok: true, message: `${definition.name}已落成并接入城市模拟。`, buildingId: id }
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
    this.engine = this.createEngine(snapshot)
    this.snapshotCache = this.engine.snapshot
    this.emit()
  }

  private refresh() {
    this.snapshotCache = this.engine.snapshot
    this.emit()
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
