import type { GridPoint } from '../simulation/contracts'
import { gridToScreen } from './isometric'
import type { IsoMetrics, SceneCamera, ScreenPoint, ScreenRect } from './types'

export function cameraWorldRect(camera: Readonly<SceneCamera>, padding = 0): ScreenRect {
  const zoom = Math.max(camera.zoom, 0.0001)
  return {
    x: camera.x - padding / zoom,
    y: camera.y - padding / zoom,
    width: camera.viewportWidth / zoom + (padding * 2) / zoom,
    height: camera.viewportHeight / zoom + (padding * 2) / zoom,
  }
}

export function pointInRect(point: ScreenPoint, rect: ScreenRect): boolean {
  return point.x >= rect.x
    && point.y >= rect.y
    && point.x <= rect.x + rect.width
    && point.y <= rect.y + rect.height
}

export function gridPointVisible(
  point: GridPoint,
  camera: Readonly<SceneCamera>,
  metrics: Readonly<IsoMetrics>,
  padding = Math.max(metrics.tileWidth, metrics.tileHeight),
): boolean {
  return pointInRect(gridToScreen(point, 0, metrics), cameraWorldRect(camera, padding))
}

export function applyCameraTransform(
  world: { x: number; y: number; scale: { set(value: number): void } },
  camera: Readonly<SceneCamera>,
): void {
  world.scale.set(camera.zoom)
  world.x = -camera.x * camera.zoom
  world.y = -camera.y * camera.zoom
}

