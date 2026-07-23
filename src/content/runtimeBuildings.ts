import type {
  BuildingCityStage,
  BuildingDefinition,
  CityMetrics,
  SimulationSnapshot,
} from '../simulation/contracts'
import { quoteBuildingConstruction } from '../simulation/economy/construction'
import { BUILDING_CATALOG, CITY_STAGE_ORDER } from './buildings'

type RuntimeBuildingSeed = Pick<
  BuildingDefinition,
  'type' | 'name' | 'category' | 'footprint' | 'entrance' | 'maxLevel'
  | 'jobs' | 'capacity' | 'production' | 'cityStage' | 'functions'
  | 'connections' | 'eraTags' | 'districtAffinity' | 'visualIdentity'
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
  pharmacy: runtimeSeed('main-pharmacy', {
    type: 'pharmacy',
    name: '草木药铺',
    cityStage: 'trade-town',
    footprint: square(2, 2),
    entrance: { x: 1, y: 2 },
    jobs: 8,
    capacity: 30,
    production: { durationTicks: 80, inputs: {}, outputs: { medicine: 2 } },
    districtAffinity: ['market-street', 'riverside-shops'],
  }),
  academy: runtimeSeed('main-academy', {
    type: 'academy',
    name: '溪山书院',
    cityStage: 'prefecture-town',
    footprint: square(4, 3),
    entrance: { x: 2, y: 3 },
    jobs: 18,
    capacity: 80,
    districtAffinity: ['civic-axis', 'garden-homes'],
  }),
  theatre: runtimeSeed('main-theatre', {
    type: 'theatre',
    name: '水上戏台',
    cityStage: 'prefecture-town',
    footprint: square(4, 3),
    entrance: { x: 2, y: 3 },
    jobs: 20,
    capacity: 120,
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
  { type: 'pharmacy', shortName: '药铺', icon: 'service', cityStage: 'trade-town' },
  { type: 'academy', shortName: '书院', icon: 'service', cityStage: 'prefecture-town' },
  { type: 'theatre', shortName: '戏台', icon: 'culture', cityStage: 'prefecture-town' },
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
    diagnosis: string
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

export function getRuntimeBuildingMenuState(
  stage: BuildingCityStage,
  snapshot: Pick<SimulationSnapshot, 'buildings' | 'economy'>,
) {
  return getRuntimeBuildingMenu(stage).map((item) => {
    const definition = BUILDING_DEFINITIONS[item.type]
    const quote = quoteBuildingConstruction(
      item.type,
      definition,
      snapshot.economy.treasury,
      snapshot.buildings,
      BUILDING_DEFINITIONS,
    )
    return {
      ...item,
      construction: quote,
      canBuild: item.unlocked && quote.canAfford,
      unavailableReason: !item.unlocked
        ? `需要${item.requiredStageLabel}`
        : quote.canAfford
          ? undefined
          : constructionShortageLabel(quote.missingMaterials, quote.missingTreasury),
    }
  })
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
        diagnosis: populationStageDiagnosis(metrics),
      },
      {
        id: 'attraction' as const,
        label: '吸引',
        current: Math.round(metrics.cityAttraction ?? 0),
        target: next.attraction,
        met: (metrics.cityAttraction ?? 0) >= next.attraction,
        suffix: '%',
        advice: '补空房、岗位、食物和物流，降低税负压力。',
        diagnosis: attractionStageDiagnosis(metrics),
      },
      {
        id: 'activeDistricts' as const,
        label: '街区',
        current: metrics.activeDistricts ?? 0,
        target: next.activeDistricts,
        met: (metrics.activeDistricts ?? 0) >= next.activeDistricts,
        advice: '成组营造民居、市场、粮仓和作坊，形成连续街区。',
        diagnosis: districtStageDiagnosis(metrics, next.activeDistricts),
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

function constructionShortageLabel(
  missingMaterials: Partial<Record<string, number>>,
  missingTreasury: number,
): string {
  const parts = [
    missingTreasury > 0 ? `缺银两${missingTreasury}` : '',
    ...Object.entries(missingMaterials)
      .filter((entry): entry is [string, number] => typeof entry[1] === 'number' && entry[1] > 0)
      .map(([resource, amount]) => `缺${resourceName(resource)}${amount}`),
  ].filter(Boolean)
  return parts.join('、') || '资源不足'
}

function resourceName(resource: string): string {
  return ({
    food: '粮食',
    fish: '鱼获',
    wood: '木料',
    stone: '石料',
    clay: '黏土',
    brick: '砖瓦',
    cloth: '布匹',
    salt: '盐',
    medicine: '药材',
  } as Record<string, string>)[resource] ?? resource
}

function stageThresholdMet(metrics: CityMetrics, threshold: RuntimeStageThreshold): boolean {
  return (
    metrics.population >= threshold.population
    && (metrics.cityAttraction ?? 0) >= threshold.attraction
    && (metrics.activeDistricts ?? 0) >= threshold.activeDistricts
  )
}

function populationStageDiagnosis(metrics: CityMetrics): string {
  if (openHousingCapacity(metrics) <= 0) return '住房容量已满，先补民居。'
  if ((metrics.waitingMigrants ?? 0) > 0) return '已有外来人口正在等待或进城。'
  if ((metrics.cityAttraction ?? 0) < 45) return '城市吸引力偏低，外来人口来得慢。'
  return '住房还有余量，保持吸引力即可继续增长。'
}

function attractionStageDiagnosis(metrics: CityMetrics): string {
  if (openHousingCapacity(metrics) <= 0) return '空房不足会直接拉低吸引力。'
  if (metrics.availableJobs <= 0) return '可用岗位不足，补作坊或市场。'
  if (metrics.satisfaction < 65) return '居民满意度偏低，先补基础需求。'
  if (metrics.logisticsEfficiency < 75) return '物流效率偏低，检查道路与仓储。'
  return '吸引力接近达标，继续补食物、岗位和服务。'
}

function districtStageDiagnosis(metrics: CityMetrics, target: number): string {
  const activeDistricts = metrics.activeDistricts ?? 0
  if (activeDistricts <= 0) return '还没有成型街区，先集中建设。'
  return `还差 ${Math.max(0, target - activeDistricts)} 个活跃街区。`
}

function openHousingCapacity(metrics: CityMetrics): number {
  return metrics.openHousingCapacity ?? Math.max(0, metrics.housingCapacity - metrics.population)
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
