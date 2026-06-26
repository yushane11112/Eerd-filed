import { describe, expect, it } from 'vitest'
import { gridToScreen, interpolateGridPoint, isoDepth, screenToGrid } from './isometric'

describe('isometric conversion', () => {
  it('round trips fractional grid coordinates', () => {
    const grid = { x: 12.25, y: 7.75 }
    const screen = gridToScreen(grid)
    const result = screenToGrid(screen)

    expect(result.x).toBeCloseTo(grid.x)
    expect(result.y).toBeCloseTo(grid.y)
  })

  it('accounts for elevation in both directions', () => {
    const grid = { x: 4, y: 9 }
    const elevated = gridToScreen(grid, 3)
    const flat = gridToScreen(grid)

    expect(elevated.y).toBeLessThan(flat.y)
    expect(screenToGrid(elevated, 3)).toEqual(grid)
  })

  it('clamps interpolation and produces stable depth', () => {
    expect(interpolateGridPoint({ x: 0, y: 0 }, { x: 10, y: 4 }, 0.5))
      .toEqual({ x: 5, y: 2 })
    expect(interpolateGridPoint({ x: 0, y: 0 }, { x: 10, y: 4 }, 2))
      .toEqual({ x: 10, y: 4 })
    expect(isoDepth({ x: 3, y: 7 })).toBe(10)
  })
})

