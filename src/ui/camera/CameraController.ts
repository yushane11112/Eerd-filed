import type { CameraState } from '../../simulation/contracts'
import { clampCamera, clampZoom, screenToWorld } from './math'
import type {
  CameraFocusOptions, CameraListener, CameraOptions, Point, Size, WorldBounds, ZoomRange,
} from './types'

export class CameraController {
  private state: CameraState
  private bounds: WorldBounds
  private zoomRange: ZoomRange
  private listeners = new Set<CameraListener>()

  constructor(options: CameraOptions) {
    this.bounds = { ...options.bounds }
    this.zoomRange = { ...options.zoom }
    this.state = clampCamera({
      x: options.bounds.x + options.bounds.width / 2,
      y: options.bounds.y + options.bounds.height / 2,
      zoom: options.zoom.min,
      viewportWidth: 0,
      viewportHeight: 0,
      fullscreen: false,
      ...options.initial,
    }, this.bounds, this.zoomRange)
  }

  getState = (): Readonly<CameraState> => this.state

  subscribe = (listener: CameraListener): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  setViewport(size: Size): void {
    this.commit({
      ...this.state,
      viewportWidth: size.width,
      viewportHeight: size.height,
    })
  }

  setBounds(bounds: WorldBounds): void {
    this.bounds = { ...bounds }
    this.commit(this.state)
  }

  setZoomRange(range: ZoomRange): void {
    this.zoomRange = { ...range }
    this.commit(this.state)
  }

  centerOn(point: Point): void {
    this.commit({ ...this.state, x: point.x, y: point.y })
  }

  focusOn(point: Point, options: CameraFocusOptions = {}): void {
    this.commit({
      ...this.state,
      x: point.x,
      y: point.y,
      zoom: options.zoom ?? this.state.zoom,
    })
  }

  panByScreenDelta(delta: Point): void {
    this.commit({
      ...this.state,
      x: this.state.x - delta.x / this.state.zoom,
      y: this.state.y - delta.y / this.state.zoom,
    })
  }

  zoomAt(screenPoint: Point, requestedZoom: number): void {
    const worldAnchor = screenToWorld(this.state, screenPoint)
    const zoom = clampZoom(requestedZoom, this.zoomRange)
    this.commit({
      ...this.state,
      zoom,
      x: worldAnchor.x - (screenPoint.x - this.state.viewportWidth / 2) / zoom,
      y: worldAnchor.y - (screenPoint.y - this.state.viewportHeight / 2) / zoom,
    })
  }

  zoomBy(screenPoint: Point, factor: number): void {
    if (!Number.isFinite(factor) || factor <= 0) return
    this.zoomAt(screenPoint, this.state.zoom * factor)
  }

  setFullscreen(fullscreen: boolean): void {
    this.commit({ ...this.state, fullscreen })
  }

  reset(options?: { center?: Point; zoom?: number }): void {
    this.commit({
      ...this.state,
      x: options?.center?.x ?? this.bounds.x + this.bounds.width / 2,
      y: options?.center?.y ?? this.bounds.y + this.bounds.height / 2,
      zoom: options?.zoom ?? this.zoomRange.min,
    })
  }

  private commit(next: CameraState): void {
    const clamped = clampCamera(next, this.bounds, this.zoomRange)
    if (
      clamped.x === this.state.x
      && clamped.y === this.state.y
      && clamped.zoom === this.state.zoom
      && clamped.viewportWidth === this.state.viewportWidth
      && clamped.viewportHeight === this.state.viewportHeight
      && clamped.fullscreen === this.state.fullscreen
    ) return
    this.state = clamped
    this.listeners.forEach((listener) => listener(this.state))
  }
}
