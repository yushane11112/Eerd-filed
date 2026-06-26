import { describe, expect, it, vi } from 'vitest'
import { CameraController } from './CameraController'
import { screenToWorld, worldToScreen } from './math'

const createCamera = () => new CameraController({
  bounds: { x: 0, y: 0, width: 1000, height: 800 },
  zoom: { min: 1, max: 4 },
  initial: {
    x: 500,
    y: 400,
    zoom: 1,
    viewportWidth: 400,
    viewportHeight: 200,
  },
})

describe('CameraController', () => {
  it('keeps the world point under the pointer fixed while zooming', () => {
    const camera = createCamera()
    const pointer = { x: 300, y: 70 }
    const before = screenToWorld(camera.getState(), pointer)

    camera.zoomAt(pointer, 2)

    expect(screenToWorld(camera.getState(), pointer)).toEqual(before)
    expect(camera.getState().zoom).toBe(2)
  })

  it('clamps camera movement to world edges', () => {
    const camera = createCamera()
    camera.centerOn({ x: -100, y: 5000 })

    expect(camera.getState()).toMatchObject({ x: 200, y: 700 })
  })

  it('focuses a world point and clamps requested zoom in one update', () => {
    const camera = createCamera()
    const listener = vi.fn()
    camera.subscribe(listener)

    camera.focusOn({ x: 750, y: 650 }, { zoom: 10 })

    expect(camera.getState()).toMatchObject({ x: 750, y: 650, zoom: 4 })
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('centers worlds smaller than the viewport', () => {
    const camera = new CameraController({
      bounds: { x: 10, y: 20, width: 100, height: 80 },
      zoom: { min: 1, max: 2 },
      initial: { viewportWidth: 500, viewportHeight: 400 },
    })
    camera.centerOn({ x: 900, y: -900 })

    expect(camera.getState()).toMatchObject({ x: 60, y: 60 })
  })

  it('pans in inverse world direction and emits only changed states', () => {
    const camera = createCamera()
    const listener = vi.fn()
    camera.subscribe(listener)

    camera.panByScreenDelta({ x: 40, y: -20 })
    camera.setFullscreen(false)

    expect(camera.getState()).toMatchObject({ x: 460, y: 420 })
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('round-trips world and screen coordinates', () => {
    const state = createCamera().getState()
    const point = { x: 280, y: 615 }

    expect(screenToWorld(state, worldToScreen(state, point))).toEqual(point)
  })
})
