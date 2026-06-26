import { describe, expect, it } from 'vitest'
import type { BuildingDefinition, WorldCell } from '../contracts'
import { rotateBuildingGeometry, WorldGrid } from './index'

const workshop: BuildingDefinition = {
  type: 'workshop',
  name: '木作坊',
  category: 'production',
  footprint: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }],
  entrance: { x: 1, y: 1 },
  maxLevel: 8,
  jobs: 4,
  capacity: 20,
}

describe('WorldGrid terrain and occupancy', () => {
  it('creates a complete rectangular grid and protects internal cells from mutation', () => {
    const grid = new WorldGrid(3, 2)
    expect(grid.toCells()).toHaveLength(6)
    expect(grid.getTerrain({ x: 2, y: 1 })).toBe('land')
    expect(grid.getCell({ x: 3, y: 1 })).toBeUndefined()

    const cell = grid.getCell({ x: 1, y: 1 })
    if (!cell) throw new Error('missing test cell')
    cell.point.x = 99
    expect(grid.getCell({ x: 1, y: 1 })?.point.x).toBe(1)
  })

  it('imports sparse cell overrides and rejects terrain edits under occupancy', () => {
    const overrides: WorldCell[] = [{
      point: { x: 1, y: 1 },
      terrain: 'water',
      elevation: -1,
    }]
    const grid = new WorldGrid(3, 3, overrides)
    expect(grid.getTerrain({ x: 1, y: 1 })).toBe('water')
    expect(grid.placeRoad({ x: 0, y: 0 }, 'dirt').changed).toBe(true)
    expect(grid.setTerrain({ x: 0, y: 0 }, 'shore')).toBe(false)
  })
})

describe('road construction and graph', () => {
  it('enforces road terrain and building occupancy rules', () => {
    const grid = new WorldGrid(4, 3)
    grid.setTerrain({ x: 1, y: 1 }, 'water')
    expect(grid.placeRoad({ x: 1, y: 1 }, 'dirt').reason).toBe('invalid-terrain')
    expect(grid.placeRoad({ x: 1, y: 1 }, 'bridge').changed).toBe(true)
    expect(grid.placeRoad({ x: 0, y: 0 }, 'bridge').reason).toBe('invalid-terrain')

    expect(grid.placeBuilding('hut', workshop, { x: 2, y: 0 }, 0).valid).toBe(true)
    expect(grid.placeRoad({ x: 2, y: 0 }, 'stone').reason).toBe('building-occupied')
  })

  it('updates connected components after road placement and removal', () => {
    const grid = new WorldGrid(6, 3)
    for (let x = 0; x < 6; x += 1) grid.placeRoad({ x, y: 1 }, 'stone')
    expect(grid.areRoadConnected({ x: 0, y: 1 }, { x: 5, y: 1 })).toBe(true)
    expect(grid.getRoadGraph().get('2,1')).toEqual([{ x: 3, y: 1 }, { x: 1, y: 1 }])

    grid.removeRoad({ x: 3, y: 1 })
    expect(grid.areRoadConnected({ x: 0, y: 1 }, { x: 5, y: 1 })).toBe(false)
    expect(grid.removeRoad({ x: 3, y: 1 }).reason).toBe('not-a-road')
  })
})

describe('building rotation and placement', () => {
  it('normalizes rotated footprints and rotates the entrance with them', () => {
    expect(rotateBuildingGeometry(workshop, 0)).toEqual({
      footprint: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }],
      entrance: { x: 1, y: 1 },
      width: 2,
      height: 2,
    })
    expect(rotateBuildingGeometry(workshop, 90)).toEqual({
      footprint: [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 0 }],
      entrance: { x: 0, y: 1 },
      width: 2,
      height: 2,
    })
  })

  it('reports all placement conflicts without partially occupying the grid', () => {
    const grid = new WorldGrid(3, 3)
    grid.setTerrain({ x: 2, y: 2 }, 'water')
    grid.placeRoad({ x: 2, y: 1 }, 'dirt')
    const result = grid.placeBuilding('shop', workshop, { x: 2, y: 1 }, 0)

    expect(result.valid).toBe(false)
    expect(result.issues.map((issue) => issue.reason)).toEqual([
      'road-occupied',
      'out-of-bounds',
      'terrain',
    ])
    expect(grid.getBuildingAt({ x: 2, y: 1 })).toBeUndefined()
  })

  it('places, queries and removes a rotated building', () => {
    const grid = new WorldGrid(5, 5)
    const result = grid.placeBuilding('shop', workshop, { x: 2, y: 1 }, 90)
    expect(result.valid).toBe(true)
    expect(grid.getBuildingAt({ x: 3, y: 1 })).toBe('shop')
    expect(grid.getBuildingPlacement('shop')?.entrance).toEqual({ x: 2, y: 2 })
    expect(grid.placeBuilding('shop', workshop, { x: 0, y: 0 }, 0).issues[0].reason)
      .toBe('duplicate-building-id')

    expect(grid.removeBuilding('shop')).toBe(true)
    expect(grid.getBuildingAt({ x: 3, y: 1 })).toBeUndefined()
  })

  it('can require a road next to the transformed entrance', () => {
    const grid = new WorldGrid(5, 5)
    expect(grid.validateBuildingPlacement(
      'shop',
      workshop,
      { x: 1, y: 1 },
      0,
      { requireRoadAccess: true },
    ).issues.at(-1)?.reason).toBe('no-road-access')

    grid.placeRoad({ x: 3, y: 2 }, 'dirt')
    expect(grid.placeBuilding(
      'shop',
      workshop,
      { x: 1, y: 1 },
      0,
      { requireRoadAccess: true },
    ).valid).toBe(true)
  })
})

describe('road A* pathfinding', () => {
  it('finds the shortest deterministic road path around a gap', () => {
    const grid = new WorldGrid(6, 5)
    const roads = [
      { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 1, y: 1 },
      { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 },
      { x: 4, y: 2 }, { x: 5, y: 2 },
      { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 },
      { x: 4, y: 3 },
    ]
    roads.forEach((point) => grid.placeRoad(point, 'stone'))

    expect(grid.findRoadPath({ x: 0, y: 2 }, { x: 5, y: 2 })).toEqual([
      { x: 0, y: 2 },
      { x: 1, y: 2 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 3, y: 1 },
      { x: 4, y: 1 },
      { x: 4, y: 2 },
      { x: 5, y: 2 },
    ])
  })

  it('returns null for disconnected endpoints, non-road endpoints and visit limits', () => {
    const grid = new WorldGrid(5, 2)
    for (let x = 0; x < 5; x += 1) grid.placeRoad({ x, y: 0 }, 'dirt')
    expect(grid.findRoadPath({ x: 0, y: 0 }, { x: 4, y: 0 }, { maxVisited: 2 })).toBeNull()
    expect(grid.findRoadPath({ x: 0, y: 0 }, { x: 4, y: 1 })).toBeNull()

    grid.removeRoad({ x: 2, y: 0 })
    expect(grid.findRoadPath({ x: 0, y: 0 }, { x: 4, y: 0 })).toBeNull()
  })
})
