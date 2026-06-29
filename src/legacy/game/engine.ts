import {
  BUILD_SITES, BUILD_SITE_IDS, DROP_INTERVAL_MINUTES, ISLANDS, LEVEL_BUILD_REQUIREMENT,
  MATERIAL_KINDS, MAX_VISIBLE_DROPS, decorStageForLevel, visualStageForLevel,
} from './config'
import type {
  AmbientEvent, BuildSiteId, BuildSiteProgress, DropSource, InventoryState,
  IslandId, IslandState, MaterialKind, PendingDrop, WorldDrop,
} from './types'

export const LEGACY_LISTENING_DROPS_ENABLED = false

export interface ListeningProgressOptions {
  legacyMaterialDrops?: boolean
}

const emptyInventory = (): InventoryState => ({ wood: 0, stone: 0, brick: 0, rope: 0, cloth: 0 })

const buildSiteProgress = (): Record<BuildSiteId, BuildSiteProgress> => Object.fromEntries(
  BUILD_SITE_IDS.map((id) => [id, {
    id, level: 0, maxLevel: 8, buildProgress: 0, visualStage: 0, decorStage: 0,
  }]),
) as Record<BuildSiteId, BuildSiteProgress>

const initialEvents = (): AmbientEvent[] => [
  {
    id: 'cat-on-boat',
    islandId: 'main',
    title: '船篷上的小橘猫',
    description: '它似乎在等一条刚靠岸的小鱼。',
    x: 2210, y: 2670, icon: 'cat',
    choices: ['把鱼放在石阶上', '安静坐在旁边'],
  },
  {
    id: 'river-kite',
    islandId: 'main',
    title: '挂在柳树上的纸鸢',
    description: '风一吹，尾穗还在轻轻晃。',
    x: 3350, y: 1480, icon: 'kite',
    choices: ['请木匠搭把手', '等风小一些'],
  },
]

export function createInitialState(): IslandState {
  const state: IslandState = {
    saveVersion: 5,
    day: 1,
    prosperity: 28,
    listeningMinutes: 0,
    listeningRemainder: 0,
    processedMusicReports: [],
    inventory: emptyInventory(),
    worldDrops: [],
    pendingDrops: [],
    selectedBuildSiteId: 'main-pier',
    buildSites: buildSiteProgress(),
    islands: {
      main: { id: 'main', unlocked: true, routeProgress: 100 },
      windfield: { id: 'windfield', unlocked: false, routeProgress: 0 },
      mistgrove: { id: 'mistgrove', unlocked: false, routeProgress: 0 },
      tide: { id: 'tide', unlocked: false, routeProgress: 0 },
    },
    ambientEvents: initialEvents(),
    letters: [{
      id: 'welcome',
      title: '旧港重新亮灯了',
      body: '潮水把几捆木料送到石阶旁。镇上的第一处营造，可以从旧码头开始。',
      day: 1,
      read: false,
    }],
    visitors: [],
    discoveredSpecies: ['白尾鸥', '礁石蟹'],
    discoveredViews: ['初晴旧港'],
    sceneTime: { period: 'morning', progress: .18, weather: 'clear' },
    lastSavedAt: Date.now(),
  }
  return seedDrops(state)
}

function seedDrops(state: IslandState): IslandState {
  let next = state
  for (let index = 0; index < 7; index += 1) {
    next = spawnDrop(next, {
      kind: MATERIAL_KINDS[index % MATERIAL_KINDS.length],
      amount: index % 3 === 0 ? 2 : 1,
      source: index % 2 ? 'tide' : 'visitor',
    }, () => ((index * .137) % 1))
  }
  return next
}

export function addListeningMinutes(
  state: IslandState,
  minutes: number,
  random: () => number = Math.random,
  reportId?: string,
  options: ListeningProgressOptions = {},
): IslandState {
  if (reportId && state.processedMusicReports.includes(reportId)) return state
  const increment = Math.max(0, minutes)
  const totalRemainder = state.listeningRemainder + increment
  const legacyMaterialDrops = options.legacyMaterialDrops ?? LEGACY_LISTENING_DROPS_ENABLED
  const earned = legacyMaterialDrops ? Math.floor(totalRemainder / DROP_INTERVAL_MINUTES) : 0
  let next: IslandState = {
    ...state,
    listeningMinutes: state.listeningMinutes + increment,
    listeningRemainder: legacyMaterialDrops ? totalRemainder % DROP_INTERVAL_MINUTES : 0,
    processedMusicReports: reportId
      ? [...state.processedMusicReports.slice(-49), reportId]
      : state.processedMusicReports,
    lastSavedAt: Date.now(),
  }
  for (let index = 0; index < earned; index += 1) {
    next = spawnDrop(next, {
      kind: MATERIAL_KINDS[Math.floor(random() * MATERIAL_KINDS.length)],
      amount: random() > .82 ? 2 : 1,
      source: 'music',
    }, random)
  }
  return next
}

export function spawnNaturalDrop(
  state: IslandState,
  source: Exclude<DropSource, 'music'>,
  random: () => number = Math.random,
) {
  return spawnDrop(state, {
    kind: MATERIAL_KINDS[Math.floor(random() * MATERIAL_KINDS.length)],
    amount: random() > .75 ? 2 : 1,
    source,
  }, random)
}

function spawnDrop(state: IslandState, pending: PendingDrop, random: () => number): IslandState {
  if (state.worldDrops.length >= MAX_VISIBLE_DROPS) {
    return { ...state, pendingDrops: [...state.pendingDrops, pending] }
  }
  const unlocked = (Object.keys(state.islands) as IslandId[]).filter((id) => state.islands[id].unlocked)
  const islandId = unlocked[Math.min(unlocked.length - 1, Math.floor(random() * unlocked.length))]
  const definition = ISLANDS[islandId]
  const angle = random() * Math.PI * 2
  const radiusX = islandId === 'main' ? 1350 : 420
  const radiusY = islandId === 'main' ? 900 : 300
  const drop: WorldDrop = {
    id: `drop-${Date.now()}-${state.worldDrops.length}-${Math.floor(random() * 100000)}`,
    ...pending,
    islandId,
    x: definition.centerX + Math.cos(angle) * radiusX * (.35 + random() * .6),
    y: definition.centerY + Math.sin(angle) * radiusY * (.35 + random() * .6),
    createdAt: Date.now(),
  }
  return { ...state, worldDrops: [...state.worldDrops, drop] }
}

export function selectBuildSite(state: IslandState, id: BuildSiteId): IslandState {
  if (!state.islands[BUILD_SITES[id].islandId].unlocked) return state
  return { ...state, selectedBuildSiteId: id, lastSavedAt: Date.now() }
}

export function collectDrop(state: IslandState, dropId: string): IslandState {
  const drop = state.worldDrops.find((item) => item.id === dropId)
  if (!drop) return state
  const remainingDrops = state.worldDrops.filter((item) => item.id !== dropId)
  const selected = state.buildSites[state.selectedBuildSiteId]
  const requirement = LEVEL_BUILD_REQUIREMENT[Math.min(7, selected.level)]
  const siteCanReceive = selected.level < selected.maxLevel && selected.buildProgress < 100
  const contribution = Math.ceil(drop.amount * (100 / requirement) * materialAffinity(drop.kind, state.selectedBuildSiteId))
  const inventory = { ...state.inventory }
  const buildSites = { ...state.buildSites }
  if (siteCanReceive) {
    buildSites[state.selectedBuildSiteId] = {
      ...selected,
      buildProgress: Math.min(100, selected.buildProgress + contribution),
    }
  } else {
    inventory[drop.kind] += drop.amount
  }
  let next: IslandState = {
    ...state,
    inventory,
    buildSites,
    worldDrops: remainingDrops,
    lastSavedAt: Date.now(),
  }
  next = flushPendingDrops(next)
  return next
}

function materialAffinity(kind: MaterialKind, id: BuildSiteId) {
  return BUILD_SITES[id].preferred.includes(kind) ? 1.35 : .88
}

function flushPendingDrops(state: IslandState): IslandState {
  let next = state
  while (next.pendingDrops.length && next.worldDrops.length < MAX_VISIBLE_DROPS) {
    const [pending, ...rest] = next.pendingDrops
    next = spawnDrop({ ...next, pendingDrops: rest }, pending, Math.random)
  }
  return next
}

export function buildSelectedSite(state: IslandState): IslandState {
  const id = state.selectedBuildSiteId
  const selected = state.buildSites[id]
  if (selected.level >= selected.maxLevel || selected.buildProgress < 100) return state
  const level = selected.level + 1
  const prosperity = state.prosperity + 18 + level * 6
  const buildSites = {
    ...state.buildSites,
    [id]: {
      ...selected,
      level,
      buildProgress: 0,
      visualStage: visualStageForLevel(level),
      decorStage: decorStageForLevel(level),
    },
  }
  return {
    ...state,
    prosperity,
    buildSites,
    islands: unlockIslands(state.islands, prosperity),
    discoveredViews: level === 1
      ? [...state.discoveredViews, `${BUILD_SITES[id].name}新景`]
      : state.discoveredViews,
    lastSavedAt: Date.now(),
  }
}

function unlockIslands(islands: IslandState['islands'], prosperity: number) {
  return Object.fromEntries(
    (Object.keys(ISLANDS) as IslandId[]).map((id) => {
      const required = ISLANDS[id].unlockProsperity
      return [id, {
        ...islands[id],
        unlocked: id === 'main' || prosperity >= required,
        routeProgress: required === 0 ? 100 : Math.min(100, Math.round(prosperity / required * 100)),
      }]
    }),
  ) as IslandState['islands']
}

export function resolveAmbientEvent(state: IslandState, eventId: string, choice: number): IslandState {
  const event = state.ambientEvents.find((item) => item.id === eventId)
  if (!event) return state
  const view = choice === 0 ? `${event.title} · 相遇` : `${event.title} · 等待`
  return {
    ...state,
    ambientEvents: state.ambientEvents.filter((item) => item.id !== eventId).slice(0, 3),
    discoveredViews: state.discoveredViews.includes(view)
      ? state.discoveredViews
      : [...state.discoveredViews, view],
    lastSavedAt: Date.now(),
  }
}

export function advanceSceneTime(state: IslandState, amount = .03): IslandState {
  const progress = (state.sceneTime.progress + amount) % 1
  const period = progress < .32 ? 'morning' : progress < .72 ? 'day' : 'dusk'
  return { ...state, sceneTime: { ...state.sceneTime, progress, period } }
}

export function generateOfflineReturn(state: IslandState, days: number): IslandState {
  if (days <= 0) return state
  let next = { ...state, day: state.day + days }
  for (let index = 0; index < Math.min(5, days * 2); index += 1) {
    next = spawnNaturalDrop(next, index % 2 ? 'visitor' : 'weather', () => ((index * .23) % 1))
  }
  return {
    ...next,
    letters: [{
      id: `return-${Date.now()}`,
      title: '离岛时发生的小事',
      body: '风吹过稻田，潮水送来几份材料。小镇没有衰败，只是多了些等你发现的新动静。',
      day: next.day,
      read: false,
    }, ...state.letters],
    lastSavedAt: Date.now(),
  }
}
