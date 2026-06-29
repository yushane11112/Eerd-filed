import { describe, expect, it } from 'vitest'
import type { WorldCell } from '../contracts'
import { buildMovementPath } from './movementPath'

describe('shared movement paths', () => {
  it('prefers roads even when a shorter off-road line exists', () => {
    const cells = grid(3, 3, [
      cell(0, 1, 'land', 'dirt'),
      cell(0, 2, 'land', 'stone'),
      cell(1, 2, 'land', 'stone'),
      cell(2, 2, 'land', 'stone'),
      cell(2, 1, 'land', 'dirt'),
    ])

    expect(buildMovementPath({ x: 0, y: 1 }, { x: 2, y: 1 }, cells, {
      roadPreference: 'prefer-road',
    })).toEqual([
      { x: 0, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
      { x: 2, y: 1 },
    ])
  })

  it('falls back to a straight path when no world cells are available', () => {
    expect(buildMovementPath({ x: 2, y: 1 }, { x: 0, y: 3 }, [], {
      roadPreference: 'prefer-road',
    })).toEqual([
      { x: 2, y: 1 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
      { x: 0, y: 3 },
    ])
  })

  it('routes around blocked and water cells when a passable path exists', () => {
    const cells = grid(3, 3, [
      cell(1, 0, 'water'),
      cell(1, 1, 'land', undefined, 'blocking-building'),
      cell(0, 1, 'land', 'stone'),
      cell(0, 2, 'land', 'stone'),
      cell(1, 2, 'land', 'stone'),
      cell(2, 2, 'land', 'stone'),
      cell(2, 1, 'land', 'stone'),
    ])

    expect(buildMovementPath({ x: 0, y: 0 }, { x: 2, y: 0 }, cells, {
      roadPreference: 'prefer-road',
    })).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
      { x: 2, y: 1 },
      { x: 2, y: 0 },
    ])
  })
})

function grid(
  width: number,
  height: number,
  overrides: readonly WorldCell[],
): WorldCell[] {
  const byKey = new Map(overrides.map((item) => [`${item.point.x},${item.point.y}`, item]))
  const cells: WorldCell[] = []
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      cells.push(byKey.get(`${x},${y}`) ?? cell(x, y))
    }
  }
  return cells
}

function cell(
  x: number,
  y: number,
  terrain: WorldCell['terrain'] = 'land',
  road?: WorldCell['road'],
  buildingId?: string,
): WorldCell {
  return {
    point: { x, y },
    terrain,
    elevation: terrain === 'water' ? -1 : 0,
    road,
    buildingId,
  }
}
