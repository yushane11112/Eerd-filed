import { describe, expect, it } from 'vitest'
import {
  addListeningMinutes,
  buildSelectedSite,
  collectDrop,
  createInitialState,
  LEGACY_LISTENING_DROPS_ENABLED,
  resolveAmbientEvent,
  selectBuildSite,
  spawnNaturalDrop,
} from './engine'
import { BUILD_SITE_IDS } from './config'

describe('archived listening material drops', () => {
  it('does not spawn ordinary materials from listening by default', () => {
    const state = createInitialState()
    const next = addListeningMinutes(state, 12, () => 0)

    expect(LEGACY_LISTENING_DROPS_ENABLED).toBe(false)
    expect(next.listeningMinutes).toBe(12)
    expect(next.worldDrops).toHaveLength(state.worldDrops.length)
    expect(next.listeningRemainder).toBe(0)
  })

  it('keeps the old material-drop behavior only behind an explicit legacy option', () => {
    const state = createInitialState()
    const next = addListeningMinutes(state, 12, () => 0, undefined, {
      legacyMaterialDrops: true,
    })

    expect(next.worldDrops).toHaveLength(state.worldDrops.length + 3)
    expect(next.worldDrops.slice(-3).every((drop) => drop.source === 'music')).toBe(true)
    expect(next.listeningRemainder).toBe(0)
  })

  it('does not double count a repeated music report', () => {
    const state = createInitialState()
    const first = addListeningMinutes(state, 8, () => 0, 'report-1', {
      legacyMaterialDrops: true,
    })
    const repeated = addListeningMinutes(first, 8, () => 0, 'report-1', {
      legacyMaterialDrops: true,
    })

    expect(repeated.listeningMinutes).toBe(8)
    expect(repeated.worldDrops).toHaveLength(state.worldDrops.length + 2)
  })

  it('queues rewards instead of losing them when thirty nodes are visible', () => {
    let state = createInitialState()
    state = { ...state, worldDrops: Array.from({ length: 30 }, (_, index) => ({
      id: `full-${index}`,
      kind: 'wood' as const,
      amount: 1,
      x: 1200 + index,
      y: 900,
      islandId: 'main' as const,
      source: 'music' as const,
      createdAt: index,
    })) }

    const next = addListeningMinutes(state, 8, () => 0, undefined, {
      legacyMaterialDrops: true,
    })
    expect(next.worldDrops).toHaveLength(30)
    expect(next.pendingDrops).toHaveLength(2)
  })
})

describe('pickup and automatic construction', () => {
  it('collects a drop and automatically fills the selected build site', () => {
    let state = createInitialState()
    state = selectBuildSite(state, 'main-pier')
    const drop = state.worldDrops[0]
    const next = collectDrop(state, drop.id)

    expect(next.worldDrops.some((item) => item.id === drop.id)).toBe(false)
    expect(next.buildSites['main-pier'].buildProgress).toBeGreaterThan(0)
    expect(next.inventory[drop.kind]).toBe(0)
  })

  it('refills the map from the pending queue after pickup', () => {
    let state = createInitialState()
    state = {
      ...state,
      worldDrops: Array.from({ length: 30 }, (_, index) => ({
        id: `full-${index}`,
        kind: 'stone' as const,
        amount: 1,
        x: 1000,
        y: 1000,
        islandId: 'main' as const,
        source: 'music' as const,
        createdAt: index,
      })),
      pendingDrops: [{ kind: 'cloth', amount: 2, source: 'music' }],
    }
    const next = collectDrop(state, 'full-0')
    expect(next.worldDrops).toHaveLength(30)
    expect(next.pendingDrops).toHaveLength(0)
    expect(next.worldDrops.some((item) => item.kind === 'cloth')).toBe(true)
  })

  it('upgrades with one tap when progress is complete', () => {
    let state = createInitialState()
    state = {
      ...state,
      buildSites: {
        ...state.buildSites,
        'main-pier': { ...state.buildSites['main-pier'], buildProgress: 100 },
      },
    }
    const next = buildSelectedSite(state)
    expect(next.buildSites['main-pier'].level).toBe(1)
    expect(next.buildSites['main-pier'].buildProgress).toBe(0)
    expect(next.prosperity).toBeGreaterThan(state.prosperity)
  })
})

describe('archipelago progression', () => {
  it('defines twenty-eight sites with eight levels each', () => {
    const state = createInitialState()
    expect(BUILD_SITE_IDS).toHaveLength(28)
    expect(Object.keys(state.buildSites)).toHaveLength(28)
    expect(Object.values(state.buildSites).every((site) => site.maxLevel === 8)).toBe(true)
  })

  it('uses prosperity only to unlock islands, not to block an available site upgrade', () => {
    let state = createInitialState()
    state = {
      ...state,
      prosperity: 0,
      buildSites: {
        ...state.buildSites,
        'main-pier': { ...state.buildSites['main-pier'], buildProgress: 100 },
      },
    }
    expect(buildSelectedSite(state).buildSites['main-pier'].level).toBe(1)
  })

  it('unlocks the first theme island when prosperity reaches its route threshold', () => {
    let state = createInitialState()
    state = {
      ...state,
      prosperity: 160,
      buildSites: {
        ...state.buildSites,
        'main-pier': { ...state.buildSites['main-pier'], buildProgress: 100 },
      },
    }
    const next = buildSelectedSite(state)
    expect(next.islands.windfield.unlocked).toBe(true)
  })
})

describe('ambient island life', () => {
  it('keeps at most three optional events and resolves one without failure', () => {
    let state = createInitialState()
    state = resolveAmbientEvent(state, state.ambientEvents[0].id, 0)
    expect(state.ambientEvents.length).toBeLessThanOrEqual(3)
    expect(state.discoveredViews.length).toBeGreaterThan(0)
  })

  it('can create a natural material drop without listening', () => {
    const state = createInitialState()
    const next = spawnNaturalDrop(state, 'weather', () => 0)
    expect(next.worldDrops.length).toBe(state.worldDrops.length + 1)
    expect(next.worldDrops.at(-1)?.source).toBe('weather')
  })
})
