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

interface RuntimeStageThreshold {
  stage: BuildingCityStage
  population: number
  attraction: number
  activeDistricts: number
}

export interface RuntimeCityStageProgress {
  stage: BuildingCityStage
  stageLabel: string
  nextStage?: BuildingCityStage
  nextStageLabel?: string
  requirements: Array<{
    id: 'population' | 'attraction' | 'activeDistricts'
    label: string
    current: number
    target: number
    met: boolean
    suffix?: string
    advice: string
  }>
  readyForNextStage: boolean
}

const RUNTIME_STAGE_THRESHOLDS: readonly RuntimeStageThreshold[] = [
  { stage: 'water-town', population: 0, attraction: 0, activeDistricts: 0 },
  { stage: 'trade-town', population: 16, attraction: 45, activeDistricts: 2 },
  { stage: 'prefecture-town', population: 80, attraction: 60, activeDistricts: 3 },
  { stage: 'prosperous-water-city', population: 120, attraction: 70, activeDistricts: 4 },
]

export function getRuntimeBuildingDefinition(type: string): BuildingDefinition | undefined {
  return BUILDING_DEFINITIONS[type]
}

export function deriveRuntimeCityStage(metrics: CityMetrics): BuildingCityStage {
  return [...RUNTIME_STAGE_THRESHOLDS]
    .reverse()
    .find((threshold) => stageThresholdMet(metrics, threshold))
    ?.stage ?? 'water-town'
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

export function getRuntimeCityStageProgress(metrics: CityMetrics): RuntimeCityStageProgress {
  const stage = deriveRuntimeCityStage(metrics)
  const stageIndex = RUNTIME_STAGE_THRESHOLDS.findIndex((threshold) => threshold.stage === stage)
  const next = RUNTIME_STAGE_THRESHOLDS[stageIndex + 1]
  const requirements = next
    ? [
      {
        id: 'population' as const,
        label: '人口',
        current: metrics.population,
        target: next.population,
        met: metrics.population >= next.population,
        advice: '补民居、稳吸引，等候选人口沿路入住。',
      },
      {
        id: 'attraction' as const,
        label: '吸引',
        current: Math.round(metrics.cityAttraction ?? 0),
        target: next.attraction,
        met: (metrics.cityAttraction ?? 0) >= next.attraction,
        suffix: '%',
        advice: '补空房、岗位、食物和物流，降低税负压力。',
      },
      {
        id: 'activeDistricts' as const,
        label: '街区',
        current: metrics.activeDistricts ?? 0,
        target: next.activeDistricts,
        met: (metrics.activeDistricts ?? 0) >= next.activeDistricts,
        advice: '成组营造民居、市场、粮仓和作坊，形成连续街区。',
      },
    ]
    : []
  return {
    stage,
    stageLabel: CITY_STAGE_LABELS[stage],
    nextStage: next?.stage,
    nextStageLabel: next ? CITY_STAGE_LABELS[next.stage] : undefined,
    requirements,
    readyForNextStage: requirements.length > 0 && requirements.every((requirement) => requirement.met),
  }
}

function stageRank(stage: BuildingCityStage): number {
  return CITY_STAGE_ORDER.indexOf(stage)
}

function stageThresholdMet(metrics: CityMetrics, threshold: RuntimeStageThreshold): boolean {
  return (
    metrics.population >= threshold.population
    && (metrics.cityAttraction ?? 0) >= threshold.attraction
    && (metrics.activeDistricts ?? 0) >= threshold.activeDistricts
  )
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
