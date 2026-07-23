import type {
  BuildingCityStage,
  BuildingConnectionKind,
  BuildingDefinition,
  BuildingFunction,
  ProductionRecipe,
  ResourceKind,
} from '../simulation/contracts'
import { BUILDING_VISUAL_IDENTITIES } from './buildingVisualIdentity'

type BuildingSeed = Omit<BuildingDefinition, 'footprint' | 'entrance' | 'maxLevel'> & {
  size?: [number, number]
}

export const CITY_STAGE_ORDER: readonly BuildingCityStage[] = [
  'wilderness',
  'village-market',
  'water-town',
  'trade-town',
  'prefecture-town',
  'prosperous-water-city',
]

const recipe = (
  durationTicks: number,
  inputs: Partial<Record<ResourceKind, number>>,
  outputs: Partial<Record<ResourceKind, number>>,
): ProductionRecipe => ({ durationTicks, inputs, outputs })

const seed = ({
  size = [2, 2],
  ...definition
}: BuildingSeed): BuildingDefinition => {
  const [width, height] = size
  const cityStage = definition.cityStage ?? inferCityStage(definition.type)
  return {
    ...definition,
    footprint: Array.from({ length: width * height }, (_, index) => ({
      x: index % width,
      y: Math.floor(index / width),
    })),
    entrance: { x: Math.floor(width / 2), y: height },
    maxLevel: 8,
    cityStage,
    functions: definition.functions ?? inferFunctions(definition),
    connections: definition.connections ?? inferConnections(definition),
    eraTags: definition.eraTags ?? ['jiangnan-water-town', 'ming-qing-inspired', 'preindustrial'],
    visualIdentity: BUILDING_VISUAL_IDENTITIES[definition.type],
  }
}

export const BUILDING_CATALOG: Record<string, BuildingDefinition> = {
  'main-pier': seed({
    type: 'main-pier', name: '旧码头', category: 'harbor', size: [3, 2],
    jobs: 8, capacity: 80,
  }),
  'main-ferry': seed({
    type: 'main-ferry', name: '青石渡口', category: 'harbor', size: [3, 2],
    jobs: 6, capacity: 50,
  }),
  'main-bridge': seed({
    type: 'main-bridge', name: '听雨桥', category: 'service', size: [4, 1],
    jobs: 2, capacity: 120,
  }),
  'main-inn': seed({
    type: 'main-inn', name: '临水客栈', category: 'market', size: [3, 3],
    jobs: 12, capacity: 36,
    production: recipe(60, { food: 2 }, {}),
  }),
  'main-teahouse': seed({
    type: 'main-teahouse', name: '半日茶楼', category: 'market', size: [3, 2],
    jobs: 10, capacity: 30,
    production: recipe(50, { food: 1 }, {}),
  }),
  'main-eatery': seed({
    type: 'main-eatery', name: '小满食肆', category: 'market', size: [2, 2],
    jobs: 8, capacity: 28,
    production: recipe(40, { food: 2, salt: 1 }, {}),
  }),
  'main-weavery': seed({
    type: 'main-weavery', name: '云锦布坊', category: 'production', size: [3, 2],
    jobs: 14, capacity: 40,
    production: recipe(80, {}, { cloth: 3 }),
  }),
  'main-carpentry': seed({
    type: 'main-carpentry', name: '榫卯木作', category: 'production', size: [3, 2],
    jobs: 12, capacity: 50,
    production: recipe(70, { wood: 2 }, { wood: 3 }),
  }),
  'main-kiln': seed({
    type: 'main-kiln', name: '青瓦瓷窑', category: 'production', size: [3, 3],
    jobs: 16, capacity: 60,
    production: recipe(100, { clay: 3 }, { brick: 3 }),
  }),
  'main-granary': seed({
    type: 'main-granary', name: '丰年粮仓', category: 'storage', size: [3, 3],
    jobs: 8, capacity: 300,
  }),
  'main-pharmacy': seed({
    type: 'main-pharmacy', name: '草木药铺', category: 'service', size: [2, 2],
    jobs: 8, capacity: 30,
    production: recipe(80, {}, { medicine: 2 }),
  }),
  'main-academy': seed({
    type: 'main-academy', name: '溪山书院', category: 'service', size: [4, 3],
    jobs: 18, capacity: 80,
  }),
  'main-theatre': seed({
    type: 'main-theatre', name: '水上戏台', category: 'service', size: [4, 3],
    jobs: 20, capacity: 120,
  }),
  'main-homes': seed({
    type: 'main-homes', name: '柳岸民居', category: 'housing', size: [2, 2],
    jobs: 0, capacity: 24,
  }),
  'main-gate': seed({
    type: 'main-gate', name: '小耳镇口', category: 'landmark', size: [3, 1],
    jobs: 4, capacity: 100,
  }),
  'main-garden': seed({
    type: 'main-garden', name: '临水花园', category: 'service', size: [4, 3],
    jobs: 8, capacity: 100,
  }),
  'windfield-rice': seed({
    type: 'windfield-rice', name: '层层稻田', category: 'production', size: [4, 4],
    jobs: 18, capacity: 80,
    production: recipe(120, {}, { food: 8 }),
  }),
  'windfield-orchard': seed({
    type: 'windfield-orchard', name: '四时果园', category: 'production', size: [4, 4],
    jobs: 14, capacity: 70,
    production: recipe(140, {}, { food: 6 }),
  }),
  'windfield-mill': seed({
    type: 'windfield-mill', name: '溪边水磨', category: 'production', size: [3, 3],
    jobs: 10, capacity: 60,
    production: recipe(70, { food: 3 }, { food: 5 }),
  }),
  'windfield-barn': seed({
    type: 'windfield-barn', name: '晒谷长仓', category: 'storage', size: [4, 3],
    jobs: 10, capacity: 400,
  }),
  'mistgrove-tea': seed({
    type: 'mistgrove-tea', name: '青岚茶园', category: 'production', size: [4, 4],
    jobs: 16, capacity: 70,
    production: recipe(130, {}, { medicine: 2 }),
  }),
  'mistgrove-herbs': seed({
    type: 'mistgrove-herbs', name: '山野药圃', category: 'production', size: [4, 3],
    jobs: 14, capacity: 60,
    production: recipe(120, {}, { medicine: 4 }),
  }),
  'mistgrove-bamboo': seed({
    type: 'mistgrove-bamboo', name: '听风竹坊', category: 'production', size: [3, 3],
    jobs: 12, capacity: 70,
    production: recipe(90, {}, { wood: 5 }),
  }),
  'mistgrove-pavilion': seed({
    type: 'mistgrove-pavilion', name: '云岫山亭', category: 'landmark', size: [3, 3],
    jobs: 4, capacity: 80,
  }),
  'tide-harbor': seed({
    type: 'tide-harbor', name: '潮生渔港', category: 'harbor', size: [4, 3],
    jobs: 20, capacity: 120,
    production: recipe(100, {}, { fish: 7 }),
  }),
  'tide-salt': seed({
    type: 'tide-salt', name: '白浪盐场', category: 'production', size: [5, 4],
    jobs: 16, capacity: 90,
    production: recipe(130, {}, { salt: 6 }),
  }),
  'tide-shipyard': seed({
    type: 'tide-shipyard', name: '远航船坊', category: 'production', size: [4, 3],
    jobs: 24, capacity: 100,
    production: recipe(180, { wood: 8, cloth: 2 }, {}),
  }),
  'tide-lighthouse': seed({
    type: 'tide-lighthouse', name: '归潮灯塔', category: 'landmark', size: [2, 3],
    jobs: 6, capacity: 160,
  }),
}

export const BUILDING_TYPES = Object.keys(BUILDING_CATALOG)

export function getBuildingsByStage(stage: BuildingCityStage): BuildingDefinition[] {
  const stageIndex = CITY_STAGE_ORDER.indexOf(stage)
  return Object.values(BUILDING_CATALOG)
    .filter((definition) => (
      CITY_STAGE_ORDER.indexOf(definition.cityStage ?? 'water-town') <= stageIndex
    ))
    .sort((left, right) => left.type.localeCompare(right.type))
}

export function getBuildingsByFunction(buildingFunction: BuildingFunction): BuildingDefinition[] {
  return Object.values(BUILDING_CATALOG)
    .filter((definition) => definition.functions?.includes(buildingFunction))
    .sort((left, right) => left.type.localeCompare(right.type))
}

export function isEraConsistentBuilding(definition: BuildingDefinition): boolean {
  const tags = definition.eraTags ?? []
  return (
    tags.includes('jiangnan-water-town')
    && tags.includes('ming-qing-inspired')
    && tags.includes('preindustrial')
    && !tags.some((tag) => (
      tag === 'modern'
      || tag === 'electric'
      || tag === 'steam-industrial'
      || tag === 'future'
    ))
  )
}

function inferCityStage(type: string): BuildingCityStage {
  if (type.startsWith('windfield-') || type === 'main-ferry') return 'village-market'
  if (type.startsWith('mistgrove-')) return 'water-town'
  if (type.startsWith('tide-')) return 'trade-town'
  if (type === 'main-academy' || type === 'main-theatre' || type === 'main-garden') {
    return 'prefecture-town'
  }
  return 'water-town'
}

function inferFunctions(definition: BuildingSeed): BuildingFunction[] {
  const functions = new Set<BuildingFunction>()
  if (definition.jobs > 0) functions.add('employment')
  if (definition.production) functions.add('production')
  if (definition.category === 'housing') functions.add('housing')
  if (definition.category === 'storage') functions.add('storage')
  if (definition.category === 'market') functions.add('market')
  if (definition.category === 'service') functions.add('service')
  if (definition.category === 'harbor') functions.add('logistics')
  if (definition.category === 'landmark') functions.add('culture')
  if (definition.type.includes('gate') || definition.type.includes('lighthouse')) {
    functions.add('governance')
  }
  if (definition.type.includes('bridge') || definition.type.includes('pier') || definition.type.includes('ferry')) {
    functions.add('logistics')
  }
  if (definition.type.includes('garden') || definition.type.includes('pavilion')) {
    functions.add('beautification')
  }
  return [...functions]
}

function inferConnections(definition: BuildingSeed): BuildingConnectionKind[] {
  const connections = new Set<BuildingConnectionKind>(['road'])
  if (
    definition.category === 'harbor'
    || definition.type.includes('pier')
    || definition.type.includes('ferry')
    || definition.type.includes('harbor')
    || definition.type.includes('shipyard')
    || definition.type.includes('lighthouse')
  ) {
    connections.add('water')
    connections.add('shore')
  }
  return [...connections]
}
