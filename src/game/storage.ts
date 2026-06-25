import { createInitialState } from './engine'
import { ISLANDS } from './config'
import type { BuildSiteId, IslandId, IslandState, MaterialKind, PendingDrop } from './types'

const STORAGE_KEY = 'little-ear-island:save:v1'

export function loadState(fallback: IslandState): IslandState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? migrateState(JSON.parse(raw)) : fallback
  } catch {
    return fallback
  }
}

export function migrateState(value: unknown): IslandState {
  const fallback = createInitialState()
  if (!value || typeof value !== 'object') return fallback
  const raw = value as Record<string, unknown>
  if (raw.saveVersion === 5) {
    const prosperity = Number(raw.prosperity ?? fallback.prosperity)
    const savedIslands = { ...fallback.islands, ...(raw.islands as object ?? {}) }
    const islands = Object.fromEntries(
      (Object.keys(ISLANDS) as IslandId[]).map((id) => [
        id,
        {
          ...savedIslands[id],
          unlocked: id === 'main' || prosperity >= ISLANDS[id].unlockProsperity,
          routeProgress: ISLANDS[id].unlockProsperity === 0
            ? 100
            : Math.min(100, Math.round(prosperity / ISLANDS[id].unlockProsperity * 100)),
        },
      ]),
    ) as IslandState['islands']
    return {
      ...fallback,
      ...raw,
      prosperity,
      inventory: { ...fallback.inventory, ...(raw.inventory as object ?? {}) },
      buildSites: { ...fallback.buildSites, ...(raw.buildSites as object ?? {}) },
      islands,
    } as IslandState
  }

  const inventory = { ...fallback.inventory }
  const legacyInventory = (raw.inventory ?? {}) as Partial<Record<string, number>>
  inventory.wood = Number(legacyInventory.wood ?? 0)
  inventory.stone = Number(legacyInventory.stone ?? 0)
  inventory.rope = Number(legacyInventory.rope ?? 0)
  inventory.cloth = Number(legacyInventory.cloth ?? 0)
  inventory.brick = Number(legacyInventory.glass ?? legacyInventory.brick ?? 0)

  const buildSites = structuredClone(fallback.buildSites)
  const legacyLandmarks = (raw.landmarks ?? {}) as Record<string, { level?: number }>
  const mapping: Array<[string, BuildSiteId]> = [
    ['pier', 'main-pier'],
    ['cottage', 'main-inn'],
    ['windmill', 'windfield-mill'],
    ['lookout', 'mistgrove-pavilion'],
  ]
  for (const [legacyId, siteId] of mapping) {
    const level = Math.min(8, Math.max(0, Number(legacyLandmarks[legacyId]?.level ?? 0)))
    buildSites[siteId] = {
      ...buildSites[siteId],
      level,
      visualStage: level ? Math.ceil(level / 2) : 0,
      decorStage: Math.floor(level / 2),
    }
  }

  const compensationCount = Number(raw.explorationEnergy ?? 0)
    + ((raw.missions as Array<unknown> | undefined)?.length ?? 0)
  const pendingDrops: PendingDrop[] = Array.from({ length: compensationCount }, (_, index) => ({
    kind: (['wood', 'stone', 'brick', 'rope', 'cloth'] as MaterialKind[])[index % 5],
    amount: 2,
    source: 'visitor',
  }))

  return {
    ...fallback,
    prosperity: Number(raw.prosperity ?? fallback.prosperity),
    listeningMinutes: Number(raw.listeningMinutes ?? 0),
    inventory,
    buildSites,
    pendingDrops: [...fallback.pendingDrops, ...pendingDrops],
    lastSavedAt: Date.now(),
  }
}

export function saveState(state: IslandState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function clearState() {
  localStorage.removeItem(STORAGE_KEY)
}
