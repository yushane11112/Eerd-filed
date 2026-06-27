import { describe, expect, it } from 'vitest'
import type { BuildingDefinition, BuildingEntity } from '../contracts'
import { deriveDistrictProsperity, summarizeDistrictProsperity } from './prosperity'

const definitions: Record<string, BuildingDefinition> = {
  house: definition('house', ['residential-lane'], ['housing']),
  market: definition('market', ['market-street'], ['market', 'employment']),
  granary: definition('granary', ['market-street', 'warehouse-yard'], ['storage', 'employment']),
}

describe('district prosperity', () => {
  it('groups buildings by district affinity and derives visual hints', () => {
    const districts = deriveDistrictProsperity({
      buildings: {
        home: building('home', 'house', { x: 2, y: 2 }, 3),
        market: building('market', 'market', { x: 5, y: 2 }, 4, 'serving'),
        granary: building('granary', 'granary', { x: 6, y: 3 }, 2, 'working'),
      },
    }, definitions)

    const marketStreet = districts.find((district) => district.kind === 'market-street')
    expect(marketStreet).toMatchObject({
      id: 'district:market-street',
      name: '临河市街',
      buildingIds: ['granary', 'market'],
      activityLevel: expect.stringMatching(/steady|busy/),
    })
    expect(marketStreet?.prosperity).toBeGreaterThan(40)
    expect(marketStreet?.visualHints.footTraffic).toBeGreaterThan(0)
  })

  it('summarizes active district count and average prosperity for metrics', () => {
    const districts = deriveDistrictProsperity({
      buildings: {
        home: building('home', 'house', { x: 2, y: 2 }, 3),
        market: building('market', 'market', { x: 5, y: 2 }, 4, 'serving'),
      },
    }, definitions)

    expect(summarizeDistrictProsperity(districts)).toMatchObject({
      activeDistricts: 2,
      averageDistrictProsperity: expect.any(Number),
    })
  })
})

function definition(
  type: string,
  districtAffinity: string[],
  functions: BuildingDefinition['functions'],
): BuildingDefinition {
  return {
    type,
    name: type,
    category: type === 'house' ? 'housing' : 'market',
    footprint: [{ x: 0, y: 0 }],
    entrance: { x: 0, y: 1 },
    maxLevel: 8,
    jobs: type === 'house' ? 0 : 2,
    capacity: 10,
    districtAffinity,
    functions,
  }
}

function building(
  id: string,
  type: string,
  origin: { x: number; y: number },
  level: number,
  status: BuildingEntity['status'] = 'idle',
): BuildingEntity {
  return {
    id,
    type,
    origin,
    rotation: 0,
    level,
    entrance: { x: origin.x, y: origin.y + 1 },
    status,
    workers: [],
    inventory: {},
    productionProgress: 0,
  }
}
