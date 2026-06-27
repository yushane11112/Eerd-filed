import type {
  BuildingCityStage,
  BuildingDefinition,
  CityMetrics,
} from '../simulation/contracts'
import { BUILDING_CATALOG, CITY_STAGE_ORDER } from './buildings'

type RuntimeBuildingSeed = Pick<
  BuildingDefinition,
  'type' | 'name' | 'category' | 'footprint' | 'entrance' | 'maxLevel'
  | 'jobs' | 'capacity' | 'production' | 'cityStage' | 'functions'
  | 'connections' | 'eraTags' | 'districtAffinity'
>

export const LEGACY_RUNTIME_ASSET_IDS: Record<string, keyof typeof BUILDING_CATALOG> = {
  house: 'main-homes',
  granary: 'main-granary',
  riceField: 'windfield-rice',
  woodshop: 'main-carpentry',
  market: 'main-eatery',
}

export const BUILDING_DEFINITIONS: Record<string, BuildingDefinition> = {
  house: runtimeSeed('main-homes', {
    type: 'house',
    name: '江南民居',
    footprint: square(2, 2),
    entrance: { x: 1, y: 1 },
    jobs: 0,
    capacity: 12,
    districtAffinity: ['residential-lane', 'garden-homes'],
  }),
  granary: runtimeSeed('main-granary', {
    type: 'granary',
    name: '粮仓',
    footprint: square(2, 2),
    entrance: { x: 1, y: 1 },
    jobs: 2,
    capacity: 100,
    districtAffinity: ['warehouse-yard', 'market-backstreet'],
  }),
  riceField: runtimeSeed('windfield-rice', {
    type: 'riceField',
    name: '水稻田',
    footprint: square(3, 2),
    entrance: { x: 1, y: 1 },
    jobs: 3,
    capacity: 60,
    production: { durationTicks: 35, inputs: {}, outputs: { food: 4 } },
    districtAffinity: ['farm-edge'],
  }),
  woodshop: runtimeSeed('main-carpentry', {
    type: 'woodshop',
    name: '木作坊',
    cityStage: 'trade-town',
    footprint: square(2, 2),
    entrance: { x: 1, y: 1 },
    jobs: 3,
    capacity: 60,
    production: { durationTicks: 45, inputs: { wood: 2 }, outputs: { brick: 1 } },
    districtAffinity: ['craft-lane', 'warehouse-yard'],
  }),
  market: runtimeSeed('main-eatery', {
    type: 'market',
    name: '临河集市',
    footprint: square(3, 2),
    entrance: { x: 1, y: 1 },
    jobs: 4,
    capacity: 80,
    districtAffinity: ['market-street', 'riverside-shops'],
  }),
}

function square(width: number, height: number): BuildingDefinition['footprint'] {
  return Array.from({ length: width * height }, (_, index) => ({
    x: index % width,
    y: Math.floor(index / width),
  }))
}

export const BUILDING_MENU = [
  { type: 'house', shortName: '民居', icon: 'home', cityStage: 'water-town' },
  { type: 'granary', shortName: '粮仓', icon: 'storage', cityStage: 'water-town' },
  { type: 'riceField', shortName: '稻田', icon: 'building', cityStage: 'village-market' },
  { type: 'woodshop', shortName: '木作', icon: 'building', cityStage: 'trade-town' },
  { type: 'market', shortName: '集市', icon: 'building', cityStage: 'water-town' },
] as const

export type RuntimeBuildingMenuItem = typeof BUILDING_MENU[number]

export const CITY_STAGE_LABELS: Record<BuildingCityStage, string> = {
  wilderness: '荒村',
  'village-market': '村集',
  'water-town': '水乡镇',
  'trade-town': '商贸镇',
  'prefecture-town': '府镇',
  'prosperous-water-city': '盛世水都',
}

export function getRuntimeBuildingDefinition(type: string): BuildingDefinition | undefined {
  return BUILDING_DEFINITIONS[type]
}

export function deriveRuntimeCityStage(metrics: CityMetrics): BuildingCityStage {
  const population = metrics.population
  const attraction = metrics.cityAttraction ?? 0
  const activeDistricts = metrics.activeDistricts ?? 0

  if (population >= 120 && attraction >= 70 && activeDistricts >= 4) {
    return 'prosperous-water-city'
  }
  if (population >= 80 && attraction >= 60 && activeDistricts >= 3) {
    return 'prefecture-town'
  }
  if (population >= 16 && attraction >= 45 && activeDistricts >= 2) {
    return 'trade-town'
  }
  return 'water-town'
}

export function isRuntimeBuildingUnlocked(
  type: string,
  stage: BuildingCityStage,
): boolean {
  const item = BUILDING_MENU.find((candidate) => candidate.type === type)
  if (!item) return false
  return stageRank(item.cityStage) <= stageRank(stage)
}

export function getRuntimeBuildingMenu(stage: BuildingCityStage) {
  return BUILDING_MENU.map((item) => ({
    ...item,
    unlocked: isRuntimeBuildingUnlocked(item.type, stage),
    requiredStageLabel: CITY_STAGE_LABELS[item.cityStage],
  }))
}

function stageRank(stage: BuildingCityStage): number {
  return CITY_STAGE_ORDER.indexOf(stage)
}

function runtimeSeed(
  sourceType: keyof typeof BUILDING_CATALOG,
  overrides: Partial<RuntimeBuildingSeed> & Pick<RuntimeBuildingSeed, 'type' | 'name'>,
): BuildingDefinition {
  const source = BUILDING_CATALOG[sourceType]
  return {
    ...source,
    ...overrides,
    footprint: (overrides.footprint ?? source.footprint).map((point) => ({ ...point })),
    entrance: { ...(overrides.entrance ?? source.entrance) },
    functions: overrides.functions ?? source.functions,
    connections: overrides.connections ?? source.connections,
    eraTags: overrides.eraTags ?? source.eraTags,
    districtAffinity: overrides.districtAffinity ?? source.districtAffinity,
  }
}
