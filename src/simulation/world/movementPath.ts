import type { GridPoint, WorldCell } from '../contracts'

export interface MovementPathOptions {
  readonly roadPreference?: 'none' | 'prefer-road'
  readonly fallback?: 'none' | 'straight'
  readonly requireRoad?: boolean
}

export function buildMovementPath(
  from: GridPoint,
  to: GridPoint,
  cells: readonly WorldCell[],
  options: MovementPathOptions = {},
): GridPoint[] {
  return findMovementPath(from, to, cells, {
    ...options,
    fallback: options.fallback ?? 'straight',
  }) ?? buildStraightPath(from, to)
}

export function findMovementPath(
  from: GridPoint,
  to: GridPoint,
  cells: readonly WorldCell[],
  options: MovementPathOptions = {},
): GridPoint[] | undefined {
  if (samePoint(from, to)) return [{ ...from }]
  if (cells.length === 0 || options.roadPreference === 'none') {
    return options.fallback === 'none' ? undefined : buildStraightPath(from, to)
  }

  const cellByKey = new Map(cells.map((cell) => [pointKey(cell.point), cell]))
  const targetKey = pointKey(to)
  const startKey = pointKey(from)
  if (!cellByKey.has(startKey) || !cellByKey.has(targetKey)) {
    return options.fallback === 'none' ? undefined : buildStraightPath(from, to)
  }

  const distances = new Map<string, number>([[startKey, 0]])
  const previous = new Map<string, string>()
  const open = new Set<string>([startKey])

  while (open.size > 0) {
    const currentKey = [...open].sort((left, right) => (
      (distances.get(left) ?? Number.POSITIVE_INFINITY)
        - (distances.get(right) ?? Number.POSITIVE_INFINITY)
        || left.localeCompare(right)
    ))[0]
    open.delete(currentKey)
    if (currentKey === targetKey) break

    const current = cellByKey.get(currentKey)
    if (!current) continue
    for (const neighbor of gridNeighbors(current.point)) {
      const neighborKey = pointKey(neighbor)
      const cell = cellByKey.get(neighborKey)
      if (!cell || !isPassable(cell, from, to, options)) continue
      const distance = (distances.get(currentKey) ?? 0) + stepCost(cell, to, options)
      if (distance >= (distances.get(neighborKey) ?? Number.POSITIVE_INFINITY)) continue
      distances.set(neighborKey, distance)
      previous.set(neighborKey, currentKey)
      open.add(neighborKey)
    }
  }

  if (!distances.has(targetKey)) {
    return options.fallback === 'none' ? undefined : buildStraightPath(from, to)
  }
  const pathKeys = [targetKey]
  while (pathKeys[0] !== startKey) {
    const before = previous.get(pathKeys[0])
    if (!before) return options.fallback === 'none' ? undefined : buildStraightPath(from, to)
    pathKeys.unshift(before)
  }
  return pathKeys.map(parsePointKey)
}

function isPassable(
  cell: WorldCell,
  from: GridPoint,
  to: GridPoint,
  options: MovementPathOptions,
): boolean {
  const isEndpoint = samePoint(cell.point, from) || samePoint(cell.point, to)
  if (isEndpoint) return true
  if (cell.terrain === 'water' && cell.road !== 'bridge') return false
  if (options.requireRoad && !cell.road) return false
  return !cell.buildingId
}

function stepCost(
  cell: WorldCell,
  to: GridPoint,
  options: MovementPathOptions,
): number {
  if (samePoint(cell.point, to)) return 1
  if (options.roadPreference !== 'prefer-road') return 1
  if (cell.road === 'stone') return 1
  if (cell.road === 'dirt' || cell.road === 'bridge') return 2
  return 5
}

function gridNeighbors(point: GridPoint): GridPoint[] {
  return [
    { x: point.x + 1, y: point.y },
    { x: point.x - 1, y: point.y },
    { x: point.x, y: point.y + 1 },
    { x: point.x, y: point.y - 1 },
  ]
}

function buildStraightPath(from: GridPoint, to: GridPoint): GridPoint[] {
  const path: GridPoint[] = [{ ...from }]
  let current = { ...from }
  while (current.x !== to.x) {
    current = {
      x: current.x + Math.sign(to.x - current.x),
      y: current.y,
    }
    path.push({ ...current })
  }
  while (current.y !== to.y) {
    current = {
      x: current.x,
      y: current.y + Math.sign(to.y - current.y),
    }
    path.push({ ...current })
  }
  return path
}

function samePoint(left: GridPoint, right: GridPoint): boolean {
  return left.x === right.x && left.y === right.y
}

function pointKey(point: GridPoint): string {
  return `${point.x},${point.y}`
}

function parsePointKey(key: string): GridPoint {
  const [x, y] = key.split(',').map(Number)
  return { x, y }
}
