import { describe, expect, it } from 'vitest'
import {
  DEFAULT_CONSTRUCTION_ECONOMY_TABLE,
  buildingUpgradeCost,
  quoteBuildingConstruction,
  quoteRoadConstruction,
  validateConstructionEconomyTable,
  type ConstructionEconomyTable,
} from './construction'

describe('construction economy table', () => {
  it('exports a valid default table matching the current first-pass balance', () => {
    expect(validateConstructionEconomyTable(DEFAULT_CONSTRUCTION_ECONOMY_TABLE)).toEqual([])
    expect(DEFAULT_CONSTRUCTION_ECONOMY_TABLE.buildingCosts.market).toEqual({
      treasury: 180,
      materials: { wood: 4, stone: 2 },
    })
    expect(DEFAULT_CONSTRUCTION_ECONOMY_TABLE.roadCosts).toEqual({
      dirt: { treasury: 2 },
      stone: { treasury: 6 },
      bridge: { treasury: 18 },
    })
    expect(DEFAULT_CONSTRUCTION_ECONOMY_TABLE.upgradeCosts).toEqual({
      woodPerNextLevel: 1,
      stonePerTwoNextLevels: 1,
    })
    expect(buildingUpgradeCost({ level: 3 }, DEFAULT_CONSTRUCTION_ECONOMY_TABLE)).toEqual({
      wood: 4,
      stone: 2,
    })
  })

  it('allows QA and balancing passes to quote from a custom economy table', () => {
    const table: ConstructionEconomyTable = {
      buildingCosts: {
        market: { treasury: 260, materials: { wood: 6, stone: 3, brick: 2 } },
      },
      roadCosts: {
        dirt: { treasury: 1 },
        stone: { treasury: 8 },
        bridge: { treasury: 24 },
      },
      upgradeCosts: {
        woodPerNextLevel: 2,
        stonePerTwoNextLevels: 3,
      },
      fallback: {
        baseTreasury: 90,
        treasuryPerFootprint: 30,
        woodPerTwoFootprint: 2,
        stonePerThreeFootprint: 1,
      },
    }

    expect(quoteRoadConstruction('bridge', 3, 80, table)).toMatchObject({
      cost: { treasury: 72 },
      missingTreasury: 0,
      canAfford: true,
    })
    expect(quoteBuildingConstruction(
      'market',
      { type: 'market', name: '市场', category: 'market', footprint: [{ x: 0, y: 0 }], entrance: { x: 0, y: 1 }, maxLevel: 8 },
      300,
      {},
      {},
      table,
    )).toMatchObject({
      cost: {
        treasury: 260,
        materials: { wood: 6, stone: 3, brick: 2 },
      },
      missingMaterials: { wood: 6, stone: 3, brick: 2 },
      missingTreasury: 0,
      canAfford: false,
    })
    expect(buildingUpgradeCost({ level: 2 }, table)).toEqual({
      wood: 6,
      stone: 3,
    })
  })

  it('reports invalid economy tables before they can enter production balancing', () => {
    expect(validateConstructionEconomyTable({
      buildingCosts: {
        house: { treasury: -1, materials: { wood: 2 } },
        market: { treasury: 10, materials: { stone: -2 } },
      },
      roadCosts: {
        dirt: { treasury: 0 },
        stone: { treasury: 6 },
        bridge: { treasury: Number.NaN },
      },
      upgradeCosts: {
        woodPerNextLevel: -1,
        stonePerTwoNextLevels: Number.POSITIVE_INFINITY,
      },
      fallback: {
        baseTreasury: 50,
        treasuryPerFootprint: 20,
        woodPerTwoFootprint: 0,
        stonePerThreeFootprint: 0,
      },
    })).toEqual([
      'buildingCosts.house.treasury must be a non-negative finite number',
      'buildingCosts.market.materials.stone must be a non-negative finite number',
      'roadCosts.bridge.treasury must be a non-negative finite number',
      'upgradeCosts.woodPerNextLevel must be a non-negative finite number',
      'upgradeCosts.stonePerTwoNextLevels must be a non-negative finite number',
      'fallback.woodPerTwoFootprint must be greater than zero',
      'fallback.stonePerThreeFootprint must be greater than zero',
    ])
  })
})
