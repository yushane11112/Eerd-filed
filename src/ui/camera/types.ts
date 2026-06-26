import type { CameraState } from '../../simulation/contracts'

export interface Point {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface WorldBounds {
  x: number
  y: number
  width: number
  height: number
}

export interface ZoomRange {
  min: number
  max: number
}

export interface CameraOptions {
  bounds: WorldBounds
  zoom: ZoomRange
  initial?: Partial<CameraState>
}

export type CameraListener = (state: Readonly<CameraState>) => void

