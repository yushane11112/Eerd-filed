import { describe, expect, it, vi } from 'vitest'
import { applyCameraTransform, cameraWorldRect, gridPointVisible, pointInRect } from './culling'
import { DEFAULT_ISO_METRICS, gridToScreen } from './isometric'

describe('viewport culling', () => {
  const camera = {
    x: 100,
    y: 50,
    zoom: 2,
    viewportWidth: 800,
    viewportHeight: 600,
  }

  it('converts a screen viewport to world bounds', () => {
    expect(cameraWorldRect(camera)).toEqual({ x: 100, y: 50, width: 400, height: 300 })
    expect(pointInRect({ x: 500, y: 350 }, cameraWorldRect(camera))).toBe(true)
    expect(pointInRect({ x: 501, y: 350 }, cameraWorldRect(camera))).toBe(false)
  })

  it('culls grid points using their isometric position', () => {
    const visibleScreen = { x: 250, y: 150 }
    const visibleGrid = {
      x: visibleScreen.x / DEFAULT_ISO_METRICS.tileWidth
        + visibleScreen.y / DEFAULT_ISO_METRICS.tileHeight,
      y: visibleScreen.y / DEFAULT_ISO_METRICS.tileHeight
        - visibleScreen.x / DEFAULT_ISO_METRICS.tileWidth,
    }

    expect(gridToScreen(visibleGrid).x).toBeCloseTo(visibleScreen.x)
    expect(gridPointVisible(visibleGrid, camera, DEFAULT_ISO_METRICS, 0)).toBe(true)
    expect(gridPointVisible({ x: 100, y: 100 }, camera, DEFAULT_ISO_METRICS, 0)).toBe(false)
  })

  it('applies camera transform without mutating camera state', () => {
    const set = vi.fn()
    const world = { x: 0, y: 0, scale: { set } }
    applyCameraTransform(world, camera)

    expect(world.x).toBe(-200)
    expect(world.y).toBe(-100)
    expect(set).toHaveBeenCalledWith(2)
    expect(camera.x).toBe(100)
  })
})

