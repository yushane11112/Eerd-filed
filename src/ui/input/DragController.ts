import type { Point } from '../camera/types'

export interface DragState {
  pointerId: number | null
  origin: Point | null
  last: Point | null
  distance: number
  dragging: boolean
}

export interface DragUpdate {
  delta: Point
  state: Readonly<DragState>
}

export class DragController {
  private state: DragState = {
    pointerId: null,
    origin: null,
    last: null,
    distance: 0,
    dragging: false,
  }

  constructor(private readonly threshold = 4) {}

  getState(): Readonly<DragState> {
    return this.state
  }

  start(pointerId: number, point: Point): boolean {
    if (this.state.pointerId !== null) return false
    this.state = {
      pointerId,
      origin: point,
      last: point,
      distance: 0,
      dragging: false,
    }
    return true
  }

  move(pointerId: number, point: Point): DragUpdate | null {
    if (pointerId !== this.state.pointerId || !this.state.last || !this.state.origin) return null
    const origin = this.state.origin
    const incrementalDelta = {
      x: point.x - this.state.last.x,
      y: point.y - this.state.last.y,
    }
    const distance = this.state.distance + Math.hypot(incrementalDelta.x, incrementalDelta.y)
    const wasDragging = this.state.dragging
    this.state = {
      ...this.state,
      last: point,
      distance,
      dragging: this.state.dragging || distance >= this.threshold,
    }
    const delta = this.state.dragging && !wasDragging
      ? {
        x: point.x - origin.x,
        y: point.y - origin.y,
      }
      : incrementalDelta
    return { delta, state: this.state }
  }

  end(pointerId: number): Readonly<DragState> | null {
    if (pointerId !== this.state.pointerId) return null
    const ended = this.state
    this.cancel()
    return ended
  }

  cancel(): void {
    this.state = {
      pointerId: null,
      origin: null,
      last: null,
      distance: 0,
      dragging: false,
    }
  }
}
