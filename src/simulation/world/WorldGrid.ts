import type {
  BuildingDefinition,
  EntityId,
  GridPoint,
  RoadKind,
  TerrainKind,
  WorldCell,
} from '../contracts'
import {
  addPoints,
  cardinalNeighbors,
  isIntegerPoint,
  pointKey,
  rotateBuildingGeometry,
  type QuarterRotation,
  type RotatedBuildingGeometry,
} from './geometry'

export type PlacementFailure =
  | 'invalid-origin'
  | 'out-of-bounds'
  | 'terrain'
  | 'road-occupied'
  | 'building-occupied'
  | 'duplicate-building-id'
  | 'no-road-access'
  | 'invalid-definition'

export interface PlacementIssue {
  reason: PlacementFailure
  point?: GridPoint
  message: string
}

export interface BuildingPlacement {
  buildingId: EntityId
  origin: GridPoint
  rotation: QuarterRotation
  footprint: GridPoint[]
  entrance: GridPoint
}

export interface PlacementOptions {
  allowedTerrain?: readonly TerrainKind[]
  requireRoadAccess?: boolean
}

export interface PlacementValidation {
  valid: boolean
  geometry?: RotatedBuildingGeometry
  footprint: GridPoint[]
  entrance?: GridPoint
  issues: PlacementIssue[]
}

export interface RoadMutationResult {
  changed: boolean
  cell?: WorldCell
  reason?: 'out-of-bounds' | 'building-occupied' | 'invalid-terrain' | 'not-a-road'
}

export interface PathOptions {
  maxVisited?: number
}

interface QueueNode {
  key: string
  point: GridPoint
  f: number
  h: number
  order: number
}

class MinHeap {
  private readonly values: QueueNode[] = []

  get size(): number {
    return this.values.length
  }

  push(value: QueueNode): void {
    this.values.push(value)
    this.bubbleUp(this.values.length - 1)
  }

  pop(): QueueNode | undefined {
    const first = this.values[0]
    const last = this.values.pop()
    if (this.values.length > 0 && last) {
      this.values[0] = last
      this.sinkDown(0)
    }
    return first
  }

  private compare(left: QueueNode, right: QueueNode): number {
    return left.f - right.f || left.h - right.h || left.order - right.order
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2)
      if (this.compare(this.values[index], this.values[parent]) >= 0) return
      ;[this.values[index], this.values[parent]] = [this.values[parent], this.values[index]]
      index = parent
    }
  }

  private sinkDown(index: number): void {
    while (true) {
      const left = index * 2 + 1
      const right = left + 1
      let smallest = index
      if (left < this.values.length && this.compare(this.values[left], this.values[smallest]) < 0) {
        smallest = left
      }
      if (right < this.values.length && this.compare(this.values[right], this.values[smallest]) < 0) {
        smallest = right
      }
      if (smallest === index) return
      ;[this.values[index], this.values[smallest]] = [this.values[smallest], this.values[index]]
      index = smallest
    }
  }
}

function clonePoint(point: GridPoint): GridPoint {
  return { x: point.x, y: point.y }
}

function cloneCell(cell: WorldCell): WorldCell {
  return {
    point: clonePoint(cell.point),
    terrain: cell.terrain,
    elevation: cell.elevation,
    ...(cell.road ? { road: cell.road } : {}),
    ...(cell.buildingId ? { buildingId: cell.buildingId } : {}),
  }
}

function manhattan(left: GridPoint, right: GridPoint): number {
  return Math.abs(left.x - right.x) + Math.abs(left.y - right.y)
}

export class WorldGrid {
  readonly width: number
  readonly height: number

  private readonly cells = new Map<string, WorldCell>()
  private readonly placements = new Map<EntityId, BuildingPlacement>()
  private roadGraphCache: Map<string, GridPoint[]> | undefined
  private componentCache: Map<string, number> | undefined

  constructor(
    width: number,
    height: number,
    initialCells: readonly WorldCell[] = [],
    defaultTerrain: TerrainKind = 'land',
  ) {
    if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
      throw new Error('WorldGrid dimensions must be positive integers')
    }
    this.width = width
    this.height = height

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const point = { x, y }
        this.cells.set(pointKey(point), { point, terrain: defaultTerrain, elevation: 0 })
      }
    }

    const seen = new Set<string>()
    for (const source of initialCells) {
      if (!isIntegerPoint(source.point) || !this.contains(source.point)) {
        throw new Error(`Initial cell ${pointKey(source.point)} is outside the grid`)
      }
      const key = pointKey(source.point)
      if (seen.has(key)) throw new Error(`Duplicate initial cell ${key}`)
      seen.add(key)
      this.cells.set(key, cloneCell(source))
    }
  }

  contains(point: GridPoint): boolean {
    return isIntegerPoint(point)
      && point.x >= 0
      && point.y >= 0
      && point.x < this.width
      && point.y < this.height
  }

  getCell(point: GridPoint): Readonly<WorldCell> | undefined {
    const cell = this.cells.get(pointKey(point))
    return cell ? cloneCell(cell) : undefined
  }

  getTerrain(point: GridPoint): TerrainKind | undefined {
    return this.cells.get(pointKey(point))?.terrain
  }

  getBuildingAt(point: GridPoint): EntityId | undefined {
    return this.cells.get(pointKey(point))?.buildingId
  }

  getRoadAt(point: GridPoint): RoadKind | undefined {
    return this.cells.get(pointKey(point))?.road
  }

  isOccupied(point: GridPoint): boolean {
    const cell = this.cells.get(pointKey(point))
    return Boolean(cell?.road || cell?.buildingId)
  }

  setTerrain(point: GridPoint, terrain: TerrainKind, elevation?: number): boolean {
    const cell = this.cells.get(pointKey(point))
    if (!cell || cell.road || cell.buildingId) return false
    cell.terrain = terrain
    if (elevation !== undefined) cell.elevation = elevation
    return true
  }

  toCells(): WorldCell[] {
    return [...this.cells.values()].map(cloneCell)
  }

  placeRoad(point: GridPoint, kind: RoadKind): RoadMutationResult {
    const cell = this.cells.get(pointKey(point))
    if (!cell) return { changed: false, reason: 'out-of-bounds' }
    if (cell.buildingId) return { changed: false, reason: 'building-occupied' }
    const validTerrain = kind === 'bridge'
      ? cell.terrain === 'water' || cell.terrain === 'shore'
      : cell.terrain !== 'water'
    if (!validTerrain) return { changed: false, reason: 'invalid-terrain' }
    if (cell.road === kind) return { changed: false, cell: cloneCell(cell) }
    cell.road = kind
    this.invalidateRoadGraph()
    return { changed: true, cell: cloneCell(cell) }
  }

  removeRoad(point: GridPoint): RoadMutationResult {
    const cell = this.cells.get(pointKey(point))
    if (!cell) return { changed: false, reason: 'out-of-bounds' }
    if (!cell.road) return { changed: false, reason: 'not-a-road' }
    delete cell.road
    this.invalidateRoadGraph()
    return { changed: true, cell: cloneCell(cell) }
  }

  validateBuildingPlacement(
    buildingId: EntityId,
    definition: Pick<BuildingDefinition, 'footprint' | 'entrance'>,
    origin: GridPoint,
    rotation: QuarterRotation,
    options: PlacementOptions = {},
  ): PlacementValidation {
    const issues: PlacementIssue[] = []
    if (!isIntegerPoint(origin)) {
      issues.push({ reason: 'invalid-origin', message: 'Building origin must use integer coordinates' })
      return { valid: false, footprint: [], issues }
    }
    if (this.placements.has(buildingId) || this.hasBuildingCells(buildingId)) {
      issues.push({ reason: 'duplicate-building-id', message: `Building ${buildingId} already exists` })
    }

    let geometry: RotatedBuildingGeometry
    try {
      geometry = rotateBuildingGeometry(definition, rotation)
    } catch (error) {
      issues.push({
        reason: 'invalid-definition',
        message: error instanceof Error ? error.message : 'Invalid building geometry',
      })
      return { valid: false, footprint: [], issues }
    }

    const footprint = geometry.footprint.map((point) => addPoints(origin, point))
    const entrance = addPoints(origin, geometry.entrance)
    const allowedTerrain = new Set(options.allowedTerrain ?? ['land', 'shore'])
    for (const point of footprint) {
      const cell = this.cells.get(pointKey(point))
      if (!cell) {
        issues.push({ reason: 'out-of-bounds', point, message: `Cell ${pointKey(point)} is outside the grid` })
      } else if (!allowedTerrain.has(cell.terrain)) {
        issues.push({ reason: 'terrain', point, message: `Terrain ${cell.terrain} is not buildable` })
      } else if (cell.buildingId) {
        issues.push({ reason: 'building-occupied', point, message: `Cell is occupied by ${cell.buildingId}` })
      } else if (cell.road) {
        issues.push({ reason: 'road-occupied', point, message: 'Cell is occupied by a road' })
      }
    }

    if (options.requireRoadAccess && !this.hasRoadAccess(entrance, footprint)) {
      issues.push({
        reason: 'no-road-access',
        point: entrance,
        message: 'The building entrance is not adjacent to the road network',
      })
    }

    return {
      valid: issues.length === 0,
      geometry,
      footprint,
      entrance,
      issues,
    }
  }

  placeBuilding(
    buildingId: EntityId,
    definition: Pick<BuildingDefinition, 'footprint' | 'entrance'>,
    origin: GridPoint,
    rotation: QuarterRotation,
    options: PlacementOptions = {},
  ): PlacementValidation {
    const validation = this.validateBuildingPlacement(
      buildingId,
      definition,
      origin,
      rotation,
      options,
    )
    if (!validation.valid || !validation.entrance) return validation

    const placement: BuildingPlacement = {
      buildingId,
      origin: clonePoint(origin),
      rotation,
      footprint: validation.footprint.map(clonePoint),
      entrance: clonePoint(validation.entrance),
    }
    for (const point of placement.footprint) {
      const cell = this.cells.get(pointKey(point))
      if (cell) cell.buildingId = buildingId
    }
    this.placements.set(buildingId, placement)
    return validation
  }

  removeBuilding(buildingId: EntityId): boolean {
    const placement = this.placements.get(buildingId)
    let removed = false
    if (placement) {
      for (const point of placement.footprint) {
        const cell = this.cells.get(pointKey(point))
        if (cell?.buildingId === buildingId) {
          delete cell.buildingId
          removed = true
        }
      }
      this.placements.delete(buildingId)
      return removed
    }

    // Imported snapshots may contain occupancy without placement metadata.
    for (const cell of this.cells.values()) {
      if (cell.buildingId === buildingId) {
        delete cell.buildingId
        removed = true
      }
    }
    return removed
  }

  getBuildingPlacement(buildingId: EntityId): BuildingPlacement | undefined {
    const placement = this.placements.get(buildingId)
    return placement
      ? {
          ...placement,
          origin: clonePoint(placement.origin),
          entrance: clonePoint(placement.entrance),
          footprint: placement.footprint.map(clonePoint),
        }
      : undefined
  }

  getRoadNeighbors(point: GridPoint): GridPoint[] {
    if (!this.getRoadAt(point)) return []
    return cardinalNeighbors(point)
      .filter((neighbor) => Boolean(this.getRoadAt(neighbor)))
      .map(clonePoint)
  }

  getRoadGraph(): ReadonlyMap<string, readonly GridPoint[]> {
    const graph = this.ensureRoadGraph()
    return new Map(
      [...graph].map(([key, neighbors]) => [key, neighbors.map(clonePoint)]),
    )
  }

  areRoadConnected(start: GridPoint, goal: GridPoint): boolean {
    if (!this.getRoadAt(start) || !this.getRoadAt(goal)) return false
    this.ensureComponents()
    return this.componentCache?.get(pointKey(start)) === this.componentCache?.get(pointKey(goal))
  }

  findRoadPath(start: GridPoint, goal: GridPoint, options: PathOptions = {}): GridPoint[] | null {
    if (!this.getRoadAt(start) || !this.getRoadAt(goal)) return null
    if (start.x === goal.x && start.y === goal.y) return [clonePoint(start)]
    if (!this.areRoadConnected(start, goal)) return null

    const maxVisited = options.maxVisited ?? this.width * this.height
    if (!Number.isInteger(maxVisited) || maxVisited <= 0) return null

    const startKey = pointKey(start)
    const goalKey = pointKey(goal)
    const open = new MinHeap()
    const cameFrom = new Map<string, string>()
    const points = new Map<string, GridPoint>([[startKey, clonePoint(start)]])
    const scores = new Map<string, number>([[startKey, 0]])
    const closed = new Set<string>()
    let order = 0
    const initialH = manhattan(start, goal)
    open.push({ key: startKey, point: clonePoint(start), f: initialH, h: initialH, order })

    while (open.size > 0 && closed.size < maxVisited) {
      const current = open.pop()
      if (!current || closed.has(current.key)) continue
      if (current.key === goalKey) {
        return this.reconstructPath(cameFrom, points, goalKey)
      }
      closed.add(current.key)

      for (const neighbor of this.getRoadNeighbors(current.point)) {
        const neighborKey = pointKey(neighbor)
        if (closed.has(neighborKey)) continue
        const tentative = (scores.get(current.key) ?? Number.POSITIVE_INFINITY) + 1
        if (tentative >= (scores.get(neighborKey) ?? Number.POSITIVE_INFINITY)) continue
        cameFrom.set(neighborKey, current.key)
        points.set(neighborKey, neighbor)
        scores.set(neighborKey, tentative)
        const h = manhattan(neighbor, goal)
        order += 1
        open.push({ key: neighborKey, point: neighbor, f: tentative + h, h, order })
      }
    }
    return null
  }

  private hasBuildingCells(buildingId: EntityId): boolean {
    for (const cell of this.cells.values()) {
      if (cell.buildingId === buildingId) return true
    }
    return false
  }

  private hasRoadAccess(entrance: GridPoint, footprint: readonly GridPoint[]): boolean {
    const footprintKeys = new Set(footprint.map(pointKey))
    if (!footprintKeys.has(pointKey(entrance)) && this.getRoadAt(entrance)) return true
    return cardinalNeighbors(entrance).some((point) => Boolean(this.getRoadAt(point)))
  }

  private invalidateRoadGraph(): void {
    this.roadGraphCache = undefined
    this.componentCache = undefined
  }

  private ensureRoadGraph(): Map<string, GridPoint[]> {
    if (this.roadGraphCache) return this.roadGraphCache
    const graph = new Map<string, GridPoint[]>()
    for (const cell of this.cells.values()) {
      if (!cell.road) continue
      graph.set(pointKey(cell.point), cardinalNeighbors(cell.point)
        .filter((point) => Boolean(this.getRoadAt(point))))
    }
    this.roadGraphCache = graph
    return graph
  }

  private ensureComponents(): void {
    if (this.componentCache) return
    const graph = this.ensureRoadGraph()
    const components = new Map<string, number>()
    let component = 0
    for (const key of graph.keys()) {
      if (components.has(key)) continue
      const pending = [key]
      components.set(key, component)
      while (pending.length > 0) {
        const current = pending.pop()
        if (!current) continue
        for (const neighbor of graph.get(current) ?? []) {
          const neighborKey = pointKey(neighbor)
          if (components.has(neighborKey)) continue
          components.set(neighborKey, component)
          pending.push(neighborKey)
        }
      }
      component += 1
    }
    this.componentCache = components
  }

  private reconstructPath(
    cameFrom: ReadonlyMap<string, string>,
    points: ReadonlyMap<string, GridPoint>,
    goalKey: string,
  ): GridPoint[] {
    const path: GridPoint[] = []
    let current: string | undefined = goalKey
    while (current) {
      const point = points.get(current)
      if (point) path.push(clonePoint(point))
      current = cameFrom.get(current)
    }
    return path.reverse()
  }
}
