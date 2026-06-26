import type { BuildingDefinition, GridPoint } from '../contracts'

export type QuarterRotation = 0 | 90 | 180 | 270

export interface RotatedBuildingGeometry {
  footprint: GridPoint[]
  entrance: GridPoint
  width: number
  height: number
}

export function pointKey(point: GridPoint): string {
  return `${point.x},${point.y}`
}

export function isIntegerPoint(point: GridPoint): boolean {
  return Number.isInteger(point.x) && Number.isInteger(point.y)
}

export function addPoints(left: GridPoint, right: GridPoint): GridPoint {
  return { x: left.x + right.x, y: left.y + right.y }
}

function rotatePoint(point: GridPoint, rotation: QuarterRotation): GridPoint {
  switch (rotation) {
    case 0:
      return { ...point }
    case 90:
      return { x: -point.y, y: point.x }
    case 180:
      return { x: -point.x, y: -point.y }
    case 270:
      return { x: point.y, y: -point.x }
  }
}

/**
 * Rotates a definition around (0, 0), then normalizes its footprint so that
 * the returned bounding box starts at (0, 0). The entrance receives the same
 * translation and may intentionally remain outside of the footprint.
 */
export function rotateBuildingGeometry(
  definition: Pick<BuildingDefinition, 'footprint' | 'entrance'>,
  rotation: QuarterRotation,
): RotatedBuildingGeometry {
  if (definition.footprint.length === 0) {
    throw new Error('A building footprint must contain at least one cell')
  }
  if (!definition.footprint.every(isIntegerPoint) || !isIntegerPoint(definition.entrance)) {
    throw new Error('Building geometry must use integer grid coordinates')
  }

  const rotated = definition.footprint.map((point) => rotatePoint(point, rotation))
  const minX = Math.min(...rotated.map((point) => point.x))
  const minY = Math.min(...rotated.map((point) => point.y))
  const translated = rotated.map((point) => ({
    x: point.x - minX,
    y: point.y - minY,
  }))
  const unique = new Map(translated.map((point) => [pointKey(point), point]))
  if (unique.size !== translated.length) {
    throw new Error('Building footprint contains duplicate cells')
  }

  const entrance = rotatePoint(definition.entrance, rotation)
  const maxX = Math.max(...translated.map((point) => point.x))
  const maxY = Math.max(...translated.map((point) => point.y))

  return {
    footprint: [...unique.values()],
    entrance: { x: entrance.x - minX, y: entrance.y - minY },
    width: maxX + 1,
    height: maxY + 1,
  }
}

export function cardinalNeighbors(point: GridPoint): GridPoint[] {
  return [
    { x: point.x, y: point.y - 1 },
    { x: point.x + 1, y: point.y },
    { x: point.x, y: point.y + 1 },
    { x: point.x - 1, y: point.y },
  ]
}
