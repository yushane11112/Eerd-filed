import type { BuildingDefinition } from '../simulation/contracts'
import { BUILDING_CATALOG } from './buildings'

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

export function getRuntimeBuildingDefinition(type: string): BuildingDefinition | undefined {
  return BUILDING_DEFINITIONS[type]
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
