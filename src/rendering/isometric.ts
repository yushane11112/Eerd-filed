import type { GridPoint } from '../simulation/contracts'
import type { IsoMetrics, ScreenPoint } from './types'

export const DEFAULT_ISO_METRICS: Readonly<IsoMetrics> = Object.freeze({
  tileWidth: 96,
  tileHeight: 48,
  elevationHeight: 24,
  originX: 0,
  originY: 0,
})

export function gridToScreen(
  point: GridPoint,
  elevation = 0,
  metrics: Readonly<IsoMetrics> = DEFAULT_ISO_METRICS,
): ScreenPoint {
  return {
    x: metrics.originX + (point.x - point.y) * (metrics.tileWidth / 2),
    y: metrics.originY + (point.x + point.y) * (metrics.tileHeight / 2)
      - elevation * metrics.elevationHeight,
  }
}

export function screenToGrid(
  point: ScreenPoint,
  elevation = 0,
  metrics: Readonly<IsoMetrics> = DEFAULT_ISO_METRICS,
): GridPoint {
  const relativeX = point.x - metrics.originX
  const relativeY = point.y - metrics.originY + elevation * metrics.elevationHeight

  return {
    x: relativeX / metrics.tileWidth + relativeY / metrics.tileHeight,
    y: relativeY / metrics.tileHeight - relativeX / metrics.tileWidth,
  }
}

export function interpolateGridPoint(
  from: GridPoint,
  to: GridPoint,
  alpha: number,
): GridPoint {
  const clamped = Math.max(0, Math.min(1, alpha))
  return {
    x: from.x + (to.x - from.x) * clamped,
    y: from.y + (to.y - from.y) * clamped,
  }
}

export function isoDepth(point: GridPoint, elevation = 0): number {
  return point.x + point.y + elevation * 0.001
}

