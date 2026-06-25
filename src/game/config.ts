import type {
  BuildSiteDefinition, BuildSiteId, BuildSiteProgress, IslandDefinition, IslandId, MaterialKind,
} from './types'

export const WORLD = { width: 6144, height: 3456 }
export const MAX_VISIBLE_DROPS = 30
export const DROP_INTERVAL_MINUTES = 4

export const MATERIAL_META: Record<MaterialKind, { name: string; short: string; color: number; css: string }> = {
  wood: { name: '木料', short: '木', color: 0xa96f45, css: '#a96f45' },
  stone: { name: '石料', short: '石', color: 0x77817d, css: '#77817d' },
  brick: { name: '砖瓦', short: '瓦', color: 0xb85f4b, css: '#b85f4b' },
  rope: { name: '绳索', short: '绳', color: 0xc49751, css: '#c49751' },
  cloth: { name: '布匹', short: '布', color: 0xc87568, css: '#c87568' },
}

export const MATERIAL_KINDS = Object.keys(MATERIAL_META) as MaterialKind[]

export const ISLANDS: Record<IslandId, IslandDefinition> = {
  main: { id: 'main', name: '小耳镇', subtitle: '从旧港开始的新生活', centerX: 2850, centerY: 1840, unlockProsperity: 0 },
  windfield: { id: 'windfield', name: '风禾岛', subtitle: '稻浪与果香', centerX: 900, centerY: 790, unlockProsperity: 180 },
  mistgrove: { id: 'mistgrove', name: '青岚岛', subtitle: '茶山与竹林', centerX: 5160, centerY: 830, unlockProsperity: 420 },
  tide: { id: 'tide', name: '潮汐岛', subtitle: '盐风与船坞', centerX: 5280, centerY: 2760, unlockProsperity: 760 },
}

const site = (
  id: BuildSiteId, islandId: IslandId, name: string, subtitle: string,
  category: BuildSiteDefinition['category'], x: number, y: number,
  preferred: MaterialKind[], scale = 1,
): BuildSiteDefinition => ({ id, islandId, name, subtitle, category, x, y, preferred, scale })

export const BUILD_SITES: Record<BuildSiteId, BuildSiteDefinition> = {
  'main-pier': site('main-pier', 'main', '旧码头', '潮水带来第一批客人', 'harbor', 1940, 2780, ['wood', 'rope'], 1.12),
  'main-ferry': site('main-ferry', 'main', '青石渡口', '连接主镇与群岛', 'harbor', 2550, 2860, ['stone', 'rope']),
  'main-bridge': site('main-bridge', 'main', '听雨桥', '两岸人家渐渐相连', 'civic', 3220, 2050, ['stone', 'brick'], .94),
  'main-inn': site('main-inn', 'main', '临水客栈', '给远来的旅人歇脚', 'shop', 2450, 2160, ['wood', 'cloth'], 1.08),
  'main-teahouse': site('main-teahouse', 'main', '半日茶楼', '临窗能看见整条河', 'shop', 3490, 1790, ['wood', 'brick']),
  'main-eatery': site('main-eatery', 'main', '小满食肆', '灶火一亮就有香气', 'shop', 3800, 2320, ['brick', 'wood']),
  'main-weavery': site('main-weavery', 'main', '云锦布坊', '门前总晒着新染的布', 'craft', 2780, 1540, ['cloth', 'wood']),
  'main-carpentry': site('main-carpentry', 'main', '榫卯木作', '修屋造船都少不了它', 'craft', 2050, 1660, ['wood', 'rope']),
  'main-kiln': site('main-kiln', 'main', '青瓦瓷窑', '窑火让废墟有了新瓦', 'craft', 4140, 1550, ['stone', 'brick']),
  'main-granary': site('main-granary', 'main', '丰年粮仓', '屋檐下总有麻雀停留', 'civic', 1720, 2050, ['wood', 'brick']),
  'main-pharmacy': site('main-pharmacy', 'main', '草木药铺', '晒架上摆满山野草药', 'shop', 3090, 1340, ['wood', 'cloth']),
  'main-academy': site('main-academy', 'main', '溪山书院', '晨读声顺着河岸传开', 'civic', 3650, 1180, ['wood', 'stone'], 1.08),
  'main-theatre': site('main-theatre', 'main', '水上戏台', '暮色里最热闹的地方', 'civic', 4400, 2110, ['wood', 'cloth'], 1.08),
  'main-homes': site('main-homes', 'main', '柳岸民居', '小镇真正住下了人', 'home', 2480, 1180, ['brick', 'wood'], 1.12),
  'main-gate': site('main-gate', 'main', '小耳镇口', '石阶尽头是新街', 'civic', 1550, 1450, ['stone', 'brick'], 1.08),
  'main-garden': site('main-garden', 'main', '临水花园', '四季都有新景可看', 'scenic', 4140, 1080, ['stone', 'cloth'], 1.08),
  'windfield-rice': site('windfield-rice', 'windfield', '层层稻田', '风过时像金色水面', 'farm', 620, 760, ['stone', 'rope'], .9),
  'windfield-orchard': site('windfield-orchard', 'windfield', '四时果园', '枝头总留一枚给鸟儿', 'farm', 1030, 560, ['wood', 'rope'], .9),
  'windfield-mill': site('windfield-mill', 'windfield', '溪边水磨', '水声推动木轮慢慢转', 'craft', 1140, 970, ['wood', 'stone'], 1.02),
  'windfield-barn': site('windfield-barn', 'windfield', '晒谷长仓', '丰收时铺满整片晒场', 'farm', 690, 1120, ['wood', 'brick'], .96),
  'mistgrove-tea': site('mistgrove-tea', 'mistgrove', '青岚茶园', '雾散前采下第一篓茶', 'farm', 4920, 760, ['wood', 'cloth'], .9),
  'mistgrove-herbs': site('mistgrove-herbs', 'mistgrove', '山野药圃', '小径旁都是有用的草木', 'farm', 5360, 620, ['stone', 'cloth'], .9),
  'mistgrove-bamboo': site('mistgrove-bamboo', 'mistgrove', '听风竹坊', '竹片在廊下轻轻碰响', 'craft', 5510, 990, ['wood', 'rope'], .96),
  'mistgrove-pavilion': site('mistgrove-pavilion', 'mistgrove', '云岫山亭', '可以远眺整片群岛', 'scenic', 5000, 1100, ['stone', 'wood'], 1.02),
  'tide-harbor': site('tide-harbor', 'tide', '潮生渔港', '渔船随晨潮一同归岸', 'harbor', 5020, 2860, ['wood', 'rope'], 1.04),
  'tide-salt': site('tide-salt', 'tide', '白浪盐场', '晴日里铺开银白盐花', 'farm', 5520, 2760, ['stone', 'rope'], .92),
  'tide-shipyard': site('tide-shipyard', 'tide', '远航船坊', '让更远的岛有了方向', 'craft', 5260, 2440, ['wood', 'rope'], 1.08),
  'tide-lighthouse': site('tide-lighthouse', 'tide', '归潮灯塔', '暮色中最先亮起的灯', 'scenic', 5750, 2350, ['stone', 'brick'], 1.08),
}

export const BUILD_SITE_IDS = Object.keys(BUILD_SITES) as BuildSiteId[]

const at = (x: number, y: number) => ({
  x: Math.round(x / 1672 * WORLD.width),
  y: Math.round(y / 941 * WORLD.height),
})

export const DISPLAY_SITE_POSITIONS: Record<BuildSiteId, { x: number; y: number }> = {
  'main-pier': at(150, 775),
  'main-ferry': at(325, 720),
  'main-bridge': at(405, 430),
  'main-inn': at(535, 525),
  'main-teahouse': at(720, 335),
  'main-eatery': at(960, 510),
  'main-weavery': at(1450, 420),
  'main-carpentry': at(610, 690),
  'main-kiln': at(1510, 505),
  'main-granary': at(1370, 245),
  'main-pharmacy': at(845, 285),
  'main-academy': at(835, 125),
  'main-theatre': at(1150, 350),
  'main-homes': at(465, 205),
  'main-gate': at(175, 585),
  'main-garden': at(1165, 735),
  'windfield-rice': at(330, 230),
  'windfield-orchard': at(1260, 190),
  'windfield-mill': at(245, 620),
  'windfield-barn': at(1260, 530),
  'mistgrove-tea': at(355, 250),
  'mistgrove-herbs': at(880, 570),
  'mistgrove-bamboo': at(1310, 525),
  'mistgrove-pavilion': at(805, 135),
  'tide-harbor': at(300, 650),
  'tide-salt': at(1260, 620),
  'tide-shipyard': at(1260, 210),
  'tide-lighthouse': at(265, 150),
}

export const BUILDING_ASSET_PATHS = Object.fromEntries(
  BUILD_SITE_IDS.map((id) => [
    id,
    Array.from({ length: 9 }, (_, level) => `/assets/buildings/${id}/level-${level}.png`),
  ]),
) as Record<BuildSiteId, string[]>

export const TOWNSCAPE_ASSET_PATHS: Record<IslandId, string[]> = {
  main: Array.from({ length: 5 }, (_, stage) => `/assets/townscape/main/stage-${stage}.png`),
  windfield: Array.from({ length: 5 }, (_, stage) => `/assets/townscape/windfield/stage-${stage}.png`),
  mistgrove: Array.from({ length: 5 }, (_, stage) => `/assets/townscape/mistgrove/stage-${stage}.png`),
  tide: Array.from({ length: 5 }, (_, stage) => `/assets/townscape/tide/stage-${stage}.png`),
}

export const ENVIRONMENT_ASSET_PATHS = {
  dirtRoad: '/assets/environment/dirt-road.png',
  stoneRoad: '/assets/environment/stone-road.png',
  willowCluster: '/assets/environment/willow-cluster.png',
  flowerGarden: '/assets/environment/flower-garden.png',
  marketStall: '/assets/environment/market-stall.png',
  lanternGate: '/assets/environment/lantern-gate.png',
  scaffold: '/assets/environment/scaffold.png',
  residentGroup: '/assets/environment/resident-group.png',
  cargoCart: '/assets/environment/cargo-cart.png',
} as const

export const ISLAND_SITE_IDS: Record<IslandId, BuildSiteId[]> = {
  main: BUILD_SITE_IDS.filter((id) => BUILD_SITES[id].islandId === 'main'),
  windfield: BUILD_SITE_IDS.filter((id) => BUILD_SITES[id].islandId === 'windfield'),
  mistgrove: BUILD_SITE_IDS.filter((id) => BUILD_SITES[id].islandId === 'mistgrove'),
  tide: BUILD_SITE_IDS.filter((id) => BUILD_SITES[id].islandId === 'tide'),
}

export const LEVEL_BUILD_REQUIREMENT = [20, 34, 52, 74, 100, 132, 168, 210]

export function visualStageForLevel(level: number) {
  if (level <= 0) return 0
  return Math.min(4, Math.ceil(level / 2))
}

export function decorStageForLevel(level: number) {
  return Math.max(0, Math.floor(level / 2))
}

export function townscapeStageForIsland(
  buildSites: Record<BuildSiteId, BuildSiteProgress>,
  islandId: IslandId,
) {
  const ids = ISLAND_SITE_IDS[islandId]
  const averageLevel = ids.reduce((sum, id) => sum + buildSites[id].level, 0) / ids.length
  if (averageLevel < 1) return 0
  if (averageLevel < 3) return 1
  if (averageLevel < 5) return 2
  if (averageLevel < 7) return 3
  return 4
}
