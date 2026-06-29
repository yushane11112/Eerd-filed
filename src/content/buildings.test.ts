import { describe, expect, it } from 'vitest'
import {
  BUILDING_CATALOG,
  BUILDING_TYPES,
  getBuildingsByFunction,
  getBuildingsByStage,
  isEraConsistentBuilding,
} from './buildings'
import {
  BUILDING_DEFINITIONS,
  deriveRuntimeCityStage,
  getRuntimeCityStageProgress,
  getRuntimeBuildingMenu,
  getRuntimeBuildingMenuState,
  getRuntimeBuildingDefinition,
  isRuntimeBuildingUnlocked,
  LEGACY_RUNTIME_ASSET_IDS,
} from './runtimeBuildings'
import type { ResourceKind, SimulationSnapshot } from '../simulation/contracts'

describe('building catalog', () => {
  it('maps all twenty-eight original build sites into simulation definitions', () => {
    expect(BUILDING_TYPES).toHaveLength(28)
    expect(Object.values(BUILDING_CATALOG).every((item) => item.maxLevel === 8)).toBe(true)
  })

  it('keeps functional categories visually and mechanically distinct', () => {
    expect(BUILDING_CATALOG['main-homes'].category).toBe('housing')
    expect(BUILDING_CATALOG['main-granary'].category).toBe('storage')
    expect(BUILDING_CATALOG['windfield-rice'].production?.outputs.food).toBeGreaterThan(0)
    expect(BUILDING_CATALOG['tide-harbor'].production?.outputs.fish).toBeGreaterThan(0)
    expect(BUILDING_CATALOG['main-kiln'].production?.outputs.brick).toBeGreaterThan(0)
  })

  it('adds stage, function, connection and era metadata for runtime filtering', () => {
    expect(BUILDING_CATALOG['main-pier']).toMatchObject({
      cityStage: 'water-town',
      connections: expect.arrayContaining(['road', 'water', 'shore']),
      functions: expect.arrayContaining(['employment', 'logistics']),
    })
    expect(BUILDING_CATALOG['main-homes'].functions).toEqual(
      expect.arrayContaining(['housing']),
    )
    expect(Object.values(BUILDING_CATALOG).every(isEraConsistentBuilding)).toBe(true)
  })

  it('filters buildings by unlocked city stage and function', () => {
    const villageTypes = getBuildingsByStage('village-market').map((building) => building.type)
    const tradeTypes = getBuildingsByStage('trade-town').map((building) => building.type)
    const logisticsTypes = getBuildingsByFunction('logistics').map((building) => building.type)

    expect(villageTypes).toContain('windfield-rice')
    expect(villageTypes).not.toContain('tide-harbor')
    expect(tradeTypes).toContain('tide-harbor')
    expect(logisticsTypes).toEqual(expect.arrayContaining(['main-pier', 'tide-harbor']))
  })

  it('keeps starter runtime definitions compatible while pointing to gold taxonomy ids', () => {
    expect(LEGACY_RUNTIME_ASSET_IDS.house).toBe('main-homes')
    expect(getRuntimeBuildingDefinition('house')).toBe(BUILDING_DEFINITIONS.house)
    expect(BUILDING_DEFINITIONS.house).toMatchObject({
      type: 'house',
      cityStage: 'water-town',
      functions: expect.arrayContaining(['housing']),
      connections: expect.arrayContaining(['road']),
      capacity: 12,
      entrance: { x: 1, y: 1 },
    })
    expect(BUILDING_DEFINITIONS.market.districtAffinity).toContain('market-street')
  })

  it('gates starter runtime menu by derived city stage', () => {
    const starterStage = deriveRuntimeCityStage({
      population: 8,
      households: 2,
      employedWorkers: 2,
      availableJobs: 4,
      housingCapacity: 24,
      satisfaction: 72,
      logisticsEfficiency: 80,
      cityAttraction: 42,
      activeDistricts: 1,
    })
    const tradeStage = deriveRuntimeCityStage({
      population: 24,
      households: 6,
      employedWorkers: 8,
      availableJobs: 4,
      housingCapacity: 48,
      satisfaction: 78,
      logisticsEfficiency: 82,
      cityAttraction: 58,
      activeDistricts: 2,
    })

    expect(starterStage).toBe('water-town')
    expect(tradeStage).toBe('trade-town')
    expect(isRuntimeBuildingUnlocked('market', starterStage)).toBe(true)
    expect(isRuntimeBuildingUnlocked('woodshop', starterStage)).toBe(false)
    expect(isRuntimeBuildingUnlocked('woodshop', tradeStage)).toBe(true)
    expect(getRuntimeBuildingMenu(starterStage).find((item) => item.type === 'woodshop'))
      .toMatchObject({ unlocked: false, requiredStageLabel: '商贸镇' })
  })

  it('quotes construction cost and shortages in the runtime building menu state', () => {
    const affordable = getRuntimeBuildingMenuState('water-town', menuSnapshot({
      treasury: 500,
      storage: { wood: 8, stone: 4 },
    }))
    const short = getRuntimeBuildingMenuState('water-town', menuSnapshot({
      treasury: 70,
      storage: { wood: 1 },
    }))

    expect(affordable.find((item) => item.type === 'house')).toMatchObject({
      unlocked: true,
      canBuild: true,
      construction: {
        cost: { treasury: 80, materials: { wood: 2, stone: 1 } },
        missingMaterials: {},
        missingTreasury: 0,
      },
    })
    expect(short.find((item) => item.type === 'house')).toMatchObject({
      unlocked: true,
      canBuild: false,
      unavailableReason: '缺银两10、缺木料1、缺石料1',
      construction: {
        missingMaterials: { wood: 1, stone: 1 },
        missingTreasury: 10,
      },
    })
  })

  it('explains the next runtime city stage requirements', () => {
    const progress = getRuntimeCityStageProgress({
      population: 12,
      households: 3,
      employedWorkers: 4,
      availableJobs: 4,
      housingCapacity: 36,
      satisfaction: 78,
      logisticsEfficiency: 82,
      cityAttraction: 52,
      activeDistricts: 1,
    })

    expect(progress).toMatchObject({
      stage: 'water-town',
      stageLabel: '水乡镇',
      nextStage: 'trade-town',
      nextStageLabel: '商贸镇',
      readyForNextStage: false,
    })
    expect(progress.requirements).toEqual([
      {
        id: 'population',
        label: '人口',
        current: 12,
        target: 16,
        met: false,
        advice: '补民居、稳吸引，等候选人口沿路入住。',
        diagnosis: '住房还有余量，保持吸引力即可继续增长。',
      },
      {
        id: 'attraction',
        label: '吸引',
        current: 52,
        target: 45,
        met: true,
        suffix: '%',
        advice: '补空房、岗位、食物和物流，降低税负压力。',
        diagnosis: '吸引力接近达标，继续补食物、岗位和服务。',
      },
      {
        id: 'activeDistricts',
        label: '街区',
        current: 1,
        target: 2,
        met: false,
        advice: '成组营造民居、市场、粮仓和作坊，形成连续街区。',
        diagnosis: '还差 1 个活跃街区。',
      },
    ])
  })

  it('diagnoses concrete blockers for runtime stage goals', () => {
    const progress = getRuntimeCityStageProgress({
      population: 12,
      households: 3,
      employedWorkers: 4,
      availableJobs: 0,
      housingCapacity: 12,
      satisfaction: 60,
      logisticsEfficiency: 70,
      openHousingCapacity: 0,
      cityAttraction: 35,
      activeDistricts: 0,
      waitingMigrants: 0,
    })

    expect(progress.requirements.map((requirement) => requirement.diagnosis)).toEqual([
      '住房容量已满，先补民居。',
      '空房不足会直接拉低吸引力。',
      '还没有成型街区，先集中建设。',
    ])
  })
})

function menuSnapshot(options: {
  treasury: number
  storage: Partial<Record<ResourceKind, number>>
}): Pick<SimulationSnapshot, 'buildings' | 'economy'> {
  return {
    buildings: {
      granary: {
        id: 'granary',
        type: 'granary',
        origin: { x: 0, y: 0 },
        rotation: 0,
        level: 1,
        entrance: { x: 1, y: 1 },
        status: 'idle',
        workers: [],
        inventory: options.storage,
        productionProgress: 0,
      },
    },
    economy: {
      treasury: options.treasury,
      taxRate: 0.1,
      lastTaxIncome: 0,
      lastMaintenanceCost: 0,
    },
  }
}
