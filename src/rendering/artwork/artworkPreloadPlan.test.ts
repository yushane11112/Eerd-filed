import { describe, expect, it } from 'vitest'
import type { BuildingEntity, SimulationSnapshot } from '../../simulation/contracts'
import { DEFAULT_ISO_METRICS } from '../isometric'
import { createInitialBuildingArtworkPreloadPlan } from './artworkPreloadPlan'

const makeBuilding = (
  id: string,
  type: BuildingEntity['type'],
  origin: { x: number; y: number },
  level: number,
): BuildingEntity => ({
  id,
  type,
  origin,
  rotation: 0,
  entrance: origin,
  level,
  status: 'idle',
  workers: [],
  inventory: {},
  productionProgress: 0,
})

const makeSnapshot = (buildings: BuildingEntity[]): SimulationSnapshot => ({
  tick: 1,
  cells: {},
  buildings: Object.fromEntries(buildings.map((building) => [building.id, building])),
  agents: {},
  districts: [],
  worldDrops: [],
  migrationCandidates: {},
  metrics: {
    population: 0,
    housingCapacity: 0,
    employedWorkers: 0,
    availableJobs: 0,
    cityAttraction: 0,
    averageNeedSatisfaction: 0,
  },
  economy: {
    treasury: 0,
    taxRate: 0,
    lastIncome: 0,
    lastExpense: 0,
  },
  cityTimeline: [],
})

describe('initial building artwork preload plan', () => {
  it('preloads only artwork visible to the first camera frame', () => {
    const snapshot = makeSnapshot([
      makeBuilding('visible-home', 'house', { x: 0, y: 0 }, 2),
      makeBuilding('visible-market', 'market', { x: 2, y: 0 }, 3),
      makeBuilding('far-pier', 'main-pier', { x: 80, y: 80 }, 8),
    ])

    expect(createInitialBuildingArtworkPreloadPlan(snapshot, {
      x: -160,
      y: -120,
      zoom: 1,
      viewportWidth: 640,
      viewportHeight: 360,
    }, DEFAULT_ISO_METRICS)).toEqual({
      assetIds: ['main-homes', 'main-eatery'],
      deferredAssetIds: [],
      levels: [2, 3],
      visibleBuildings: 2,
      detailedBuildings: 2,
      totalAssetIds: 3,
    })
  })

  it('limits first-frame artwork to the nearest detailed building budget', () => {
    const buildings = Array.from({ length: 130 }, (_, index) => (
      makeBuilding(
        `house-${index}`,
        index < 120 ? 'house' : 'market',
        index < 120
          ? { x: index % 12, y: Math.floor(index / 12) }
          : { x: 240 + index, y: 240 + index },
        index < 120 ? 1 : 7,
      )
    ))

    const plan = createInitialBuildingArtworkPreloadPlan(makeSnapshot(buildings), {
      x: -240,
      y: -160,
      zoom: 1,
      viewportWidth: 50000,
      viewportHeight: 50000,
    })

    expect(plan).toEqual({
      assetIds: ['main-homes'],
      deferredAssetIds: [],
      levels: [1],
      visibleBuildings: expect.any(Number),
      detailedBuildings: 96,
      totalAssetIds: 2,
    })
    expect(plan.visibleBuildings).toBeGreaterThan(120)
  })

  it('falls back to the full snapshot before the viewport is known', () => {
    const snapshot = makeSnapshot([
      makeBuilding('home', 'house', { x: 0, y: 0 }, 1),
      makeBuilding('pier', 'main-pier', { x: 80, y: 80 }, 7),
    ])

    expect(createInitialBuildingArtworkPreloadPlan(snapshot, {
      x: 0,
      y: 0,
      zoom: 1,
      viewportWidth: 0,
      viewportHeight: 0,
    })).toEqual({
      assetIds: ['main-homes', 'main-pier'],
      deferredAssetIds: [],
      levels: [1, 7],
      visibleBuildings: 2,
      detailedBuildings: 2,
      totalAssetIds: 2,
    })
  })

  it('keeps only the first critical asset ids blocking the first frame', () => {
    const snapshot = makeSnapshot([
      makeBuilding('home', 'house', { x: 0, y: 0 }, 1),
      makeBuilding('market', 'market', { x: 1, y: 0 }, 1),
      makeBuilding('granary', 'granary', { x: 2, y: 0 }, 1),
      makeBuilding('rice', 'riceField', { x: 3, y: 0 }, 1),
      makeBuilding('kiln', 'kiln', { x: 4, y: 0 }, 1),
    ])

    expect(createInitialBuildingArtworkPreloadPlan(snapshot, {
      x: -240,
      y: -160,
      zoom: 1,
      viewportWidth: 1600,
      viewportHeight: 900,
    })).toMatchObject({
      assetIds: ['main-homes', 'main-eatery', 'main-granary'],
      deferredAssetIds: ['windfield-rice', 'main-kiln'],
      visibleBuildings: 5,
      detailedBuildings: 5,
      totalAssetIds: 5,
    })
  })
})
