import type {
  BuildingDefinition,
  BuildingEntity,
  GridPoint,
  MusicCompletionEvent,
  RareResourceKind,
  ResourceKind,
  SimulationSnapshot,
} from '../simulation/contracts'
import { SimulationEngine, createInitialSimulationSnapshot } from '../simulation/core'
import { EconomySystem, RoadRoutePlanner } from '../simulation/economy'
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
}

const square = (width: number, height: number): GridPoint[] =>
  Array.from({ length: width * height }, (_, index) => ({
    x: index % width,
    y: Math.floor(index / width),
  }))

export const BUILDING_DEFINITIONS: Record<string, BuildingDefinition> = {
  house: {
    type: 'house', name: '江南民居', category: 'housing',
    footprint: square(2, 2), entrance: { x: 1, y: 1 }, maxLevel: 8,
    jobs: 0, capacity: 12,
  },
  granary: {
    type: 'granary', name: '粮仓', category: 'storage',
    footprint: square(2, 2), entrance: { x: 1, y: 1 }, maxLevel: 8,
    jobs: 2, capacity: 100,
  },
  riceField: {
    type: 'riceField', name: '水稻田', category: 'production',
    footprint: square(3, 2), entrance: { x: 1, y: 1 }, maxLevel: 8,
    jobs: 3, capacity: 60,
    production: { durationTicks: 35, inputs: {}, outputs: { food: 4 } },
  },
  woodshop: {
    type: 'woodshop', name: '木作坊', category: 'production',
    footprint: square(2, 2), entrance: { x: 1, y: 1 }, maxLevel: 8,
    jobs: 3, capacity: 60,
    production: { durationTicks: 45, inputs: { wood: 2 }, outputs: { brick: 1 } },
  },
  market: {
    type: 'market', name: '临河集市', category: 'market',
    footprint: square(3, 2), entrance: { x: 1, y: 1 }, maxLevel: 8,
    jobs: 4, capacity: 80,
  },
}

export const BUILDING_MENU = [
  { type: 'house', shortName: '民居', icon: 'home' },
  { type: 'granary', shortName: '粮仓', icon: 'storage' },
  { type: 'riceField', shortName: '稻田', icon: 'building' },
  { type: 'woodshop', shortName: '木作', icon: 'building' },
  { type: 'market', shortName: '集市', icon: 'building' },
] as const

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

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  advance(elapsedMs: number) {
    const result = this.engine.advance(elapsedMs)
    if (result.ticks === 0) return
    let snapshot = this.engine.snapshot
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

function localDayKey(timestamp: number) {
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
