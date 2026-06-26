import type { CameraState } from '../../simulation/contracts'
import type { Point, WorldBounds, ZoomRange } from './types'

const finiteOr = (value: number, fallback: number) =>
  Number.isFinite(value) ? value : fallback

export function clampZoom(zoom: number, range: ZoomRange): number {
  const min = Math.max(Number.EPSILON, finiteOr(range.min, 1))
  const max = Math.max(min, finiteOr(range.max, min))
  return Math.min(max, Math.max(min, finiteOr(zoom, min)))
}

export function clampCamera(
  state: CameraState,
  bounds: WorldBounds,
  range: ZoomRange,
): CameraState {
  const zoom = clampZoom(state.zoom, range)
  const viewportWidth = Math.max(0, finiteOr(state.viewportWidth, 0))
  const viewportHeight = Math.max(0, finiteOr(state.viewportHeight, 0))
  const worldWidth = Math.max(0, finiteOr(bounds.width, 0))
  const worldHeight = Math.max(0, finiteOr(bounds.height, 0))
  const centerX = finiteOr(bounds.x, 0) + worldWidth / 2
  const centerY = finiteOr(bounds.y, 0) + worldHeight / 2
  const visibleHalfWidth = viewportWidth / zoom / 2
  const visibleHalfHeight = viewportHeight / zoom / 2

  const minX = bounds.x + visibleHalfWidth
  const maxX = bounds.x + worldWidth - visibleHalfWidth
  const minY = bounds.y + visibleHalfHeight
  const maxY = bounds.y + worldHeight - visibleHalfHeight

  return {
    ...state,
    x: minX > maxX
      ? centerX
      : Math.min(maxX, Math.max(minX, finiteOr(state.x, centerX))),
    y: minY > maxY
      ? centerY
      : Math.min(maxY, Math.max(minY, finiteOr(state.y, centerY))),
    zoom,
    viewportWidth,
    viewportHeight,
  }
}

export function screenToWorld(state: CameraState, point: Point): Point {
  return {
    x: state.x + (point.x - state.viewportWidth / 2) / state.zoom,
    y: state.y + (point.y - state.viewportHeight / 2) / state.zoom,
  }
}

export function worldToScreen(state: CameraState, point: Point): Point {
  return {
    x: (point.x - state.x) * state.zoom + state.viewportWidth / 2,
    y: (point.y - state.y) * state.zoom + state.viewportHeight / 2,
  }
}

