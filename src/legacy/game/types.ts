export type MaterialKind = 'wood' | 'stone' | 'brick' | 'rope' | 'cloth'
export type IslandId = 'main' | 'windfield' | 'mistgrove' | 'tide'
export type DropSource = 'music' | 'weather' | 'tide' | 'animal' | 'visitor' | 'building'
export type ScenePeriod = 'morning' | 'day' | 'dusk'
export type WeatherKind = 'clear' | 'drizzle' | 'breeze' | 'mist'

export type BuildSiteId =
  | 'main-pier' | 'main-ferry' | 'main-bridge' | 'main-inn'
  | 'main-teahouse' | 'main-eatery' | 'main-weavery' | 'main-carpentry'
  | 'main-kiln' | 'main-granary' | 'main-pharmacy' | 'main-academy'
  | 'main-theatre' | 'main-homes' | 'main-gate' | 'main-garden'
  | 'windfield-rice' | 'windfield-orchard' | 'windfield-mill' | 'windfield-barn'
  | 'mistgrove-tea' | 'mistgrove-herbs' | 'mistgrove-bamboo' | 'mistgrove-pavilion'
  | 'tide-harbor' | 'tide-salt' | 'tide-shipyard' | 'tide-lighthouse'

export type InventoryState = Record<MaterialKind, number>

export interface BuildSiteDefinition {
  id: BuildSiteId
  islandId: IslandId
  name: string
  subtitle: string
  category: 'harbor' | 'home' | 'shop' | 'craft' | 'civic' | 'farm' | 'scenic'
  x: number
  y: number
  scale: number
  preferred: MaterialKind[]
}

export interface BuildSiteProgress {
  id: BuildSiteId
  level: number
  maxLevel: 8
  buildProgress: number
  visualStage: number
  decorStage: number
}

export interface IslandDefinition {
  id: IslandId
  name: string
  subtitle: string
  centerX: number
  centerY: number
  unlockProsperity: number
}

export interface IslandProgress {
  id: IslandId
  unlocked: boolean
  routeProgress: number
}

export interface WorldDrop {
  id: string
  kind: MaterialKind
  amount: number
  x: number
  y: number
  islandId: IslandId
  source: DropSource
  createdAt: number
}

export interface PendingDrop {
  kind: MaterialKind
  amount: number
  source: DropSource
}

export interface AmbientEvent {
  id: string
  islandId: IslandId
  title: string
  description: string
  x: number
  y: number
  icon: 'cat' | 'kite' | 'boat'
  choices: [string, string]
}

export interface IslandLetter {
  id: string
  title: string
  body: string
  day: number
  read: boolean
}

export interface VisitorRecord {
  id: string
  name: string
  note: string
  discoveredAt: number
}

export interface SceneTime {
  period: ScenePeriod
  progress: number
  weather: WeatherKind
}

export interface IslandState {
  saveVersion: 5
  day: number
  prosperity: number
  listeningMinutes: number
  listeningRemainder: number
  processedMusicReports: string[]
  inventory: InventoryState
  worldDrops: WorldDrop[]
  pendingDrops: PendingDrop[]
  selectedBuildSiteId: BuildSiteId
  buildSites: Record<BuildSiteId, BuildSiteProgress>
  islands: Record<IslandId, IslandProgress>
  ambientEvents: AmbientEvent[]
  letters: IslandLetter[]
  visitors: VisitorRecord[]
  discoveredSpecies: string[]
  discoveredViews: string[]
  sceneTime: SceneTime
  lastSavedAt: number
}
