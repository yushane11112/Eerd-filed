import { describe, expect, it } from 'vitest'
import type { BuildingDefinition, BuildingEntity } from '../contracts'
import {
  type ConstructionEconomyTable,
} from './construction'
import {
  effectiveBuildingDefinition,
  advanceBuildingUpgrades,
  startBuildingUpgradeFromCityStorage,
  upgradeBuildingFromCityStorage,
  upgradeBuildingImmediately,
} from './upgrades'

const granaryDefinition: BuildingDefinition = {
  type: 'granary',
  name: '粮仓',
  category: 'storage',
  footprint: [{ x: 0, y: 0 }],
  entrance: { x: 0, y: 0 },
  maxLevel: 8,
  jobs: 2,
  capacity: 100,
}

function building(
  level: number,
  inventory: BuildingEntity['inventory'] = {},
  id = 'granary-1',
  type = 'granary',
): BuildingEntity {
  return {
    id,
    type,
    origin: { x: 0, y: 0 },
    rotation: 0,
    level,
    entrance: { x: 0, y: 0 },
    status: 'idle',
    workers: [],
    inventory: { ...inventory },
    productionProgress: 0,
  }
}

describe('building upgrades', () => {
  it('fails without enough upgrade materials', () => {
    const store = building(1, { wood: 1 })

    const result = upgradeBuildingImmediately(store, granaryDefinition)

    expect(result).toEqual({
      ok: false,
      reason: 'insufficient-materials',
      missing: { wood: 1, stone: 1 },
    })
    expect(store.level).toBe(1)
    expect(store.inventory).toEqual({ wood: 1 })
  })

  it('spends materials and increases the building level', () => {
    const store = building(1, { wood: 2, stone: 1, food: 20 })

    const result = upgradeBuildingImmediately(store, granaryDefinition)

    expect(result).toEqual({
      ok: true,
      previousLevel: 1,
      level: 2,
      cost: { wood: 2, stone: 1 },
      effect: {
        capacity: 115,
        jobs: 2,
      },
    })
    expect(store.level).toBe(2)
    expect(store.inventory).toEqual({ food: 20 })
  })

  it('upgrades a target with no materials by drawing from city storage', () => {
    const target = building(1, {}, 'house-1', 'house')
    const store = building(1, { wood: 2, stone: 1 }, 'granary-1')

    const result = upgradeBuildingFromCityStorage(
      target,
      granaryDefinition,
      { 'house-1': target, 'granary-1': store },
      { granary: granaryDefinition },
    )

    expect(result.ok).toBe(true)
    expect(target.level).toBe(2)
    expect(target.inventory).toEqual({})
    expect(store.inventory).toEqual({})
  })

  it('spends city storage materials in deterministic building id order', () => {
    const target = building(1, {}, 'house-1', 'house')
    const firstStore = building(1, { wood: 1, stone: 1 }, 'granary-a')
    const secondStore = building(1, { wood: 2, stone: 1 }, 'granary-b')

    const result = upgradeBuildingFromCityStorage(
      target,
      granaryDefinition,
      { 'granary-b': secondStore, 'house-1': target, 'granary-a': firstStore },
      { granary: granaryDefinition },
    )

    expect(result.ok).toBe(true)
    expect(firstStore.inventory).toEqual({})
    expect(secondStore.inventory).toEqual({ wood: 1, stone: 1 })
  })

  it('fails city storage upgrades atomically when materials are missing', () => {
    const target = building(1, {}, 'house-1', 'house')
    const store = building(1, { wood: 1, stone: 1 }, 'granary-1')

    const result = upgradeBuildingFromCityStorage(
      target,
      granaryDefinition,
      { 'house-1': target, 'granary-1': store },
      { granary: granaryDefinition },
    )

    expect(result).toEqual({
      ok: false,
      reason: 'insufficient-materials',
      missing: { wood: 1 },
    })
    expect(target.level).toBe(1)
    expect(target.inventory).toEqual({})
    expect(store.inventory).toEqual({ wood: 1, stone: 1 })
  })

  it('rejects upgrades above level 8', () => {
    const store = building(8, { wood: 99, stone: 99 })

    const result = upgradeBuildingImmediately(store, granaryDefinition)

    expect(result).toEqual({ ok: false, reason: 'max-level' })
    expect(store.level).toBe(8)
    expect(store.inventory).toEqual({ wood: 99, stone: 99 })
  })

  it('makes upgraded capacity observable through effective definitions', () => {
    const levelZero = building(0)
    const levelOne = building(1)
    const levelEight = building(8)

    expect(effectiveBuildingDefinition(granaryDefinition, levelZero).capacity).toBe(0)
    expect(effectiveBuildingDefinition(granaryDefinition, levelZero).jobs).toBe(0)
    expect(effectiveBuildingDefinition(granaryDefinition, levelOne).capacity).toBe(100)
    expect(effectiveBuildingDefinition(granaryDefinition, levelEight).capacity).toBe(205)
    expect(effectiveBuildingDefinition(granaryDefinition, levelEight).jobs).toBe(5)
  })

  it('starts an upgrade by spending city storage materials and reusing productionProgress as deterministic upgrade progress', () => {
    const target = building(1, {}, 'house-1', 'house')
    const store = building(1, { wood: 2, stone: 1 }, 'granary-1')

    const result = startBuildingUpgradeFromCityStorage(
      target,
      granaryDefinition,
      { 'house-1': target, 'granary-1': store },
      { granary: granaryDefinition },
    )

    expect(result).toEqual({
      ok: true,
      previousLevel: 1,
      targetLevel: 2,
      cost: { wood: 2, stone: 1 },
      durationTicks: 20,
    })
    expect(target.level).toBe(1)
    expect(target.status).toBe('upgrading')
    expect(target.productionProgress).toBe(0)
    expect(store.inventory).toEqual({})
  })

  it('uses a custom construction economy table for queued upgrade costs', () => {
    const target = building(2, {}, 'house-1', 'house')
    const store = building(1, { wood: 9, stone: 6 }, 'granary-1')
    const table: ConstructionEconomyTable = {
      buildingCosts: {},
      roadCosts: {
        dirt: { treasury: 2 },
        stone: { treasury: 6 },
        bridge: { treasury: 18 },
      },
      upgradeCosts: {
        woodPerNextLevel: 2,
        stonePerTwoNextLevels: 3,
      },
      fallback: {
        baseTreasury: 50,
        treasuryPerFootprint: 20,
        woodPerTwoFootprint: 2,
        stonePerThreeFootprint: 3,
      },
    }

    const result = startBuildingUpgradeFromCityStorage(
      target,
      granaryDefinition,
      { 'house-1': target, 'granary-1': store },
      { granary: granaryDefinition },
      table,
    )

    expect(result).toMatchObject({
      ok: true,
      previousLevel: 2,
      targetLevel: 3,
      cost: { wood: 6, stone: 3 },
    })
    expect(store.inventory).toEqual({ wood: 3, stone: 3 })
  })

  it('advances an upgrading building over multiple ticks before completing level increase', () => {
    const target = building(1, {}, 'house-1', 'house')
    const store = building(1, { wood: 2, stone: 1 }, 'granary-1')
    startBuildingUpgradeFromCityStorage(
      target,
      granaryDefinition,
      { 'house-1': target, 'granary-1': store },
      { granary: granaryDefinition },
    )

    const partial = advanceBuildingUpgrades({ 'house-1': target }, { house: granaryDefinition }, 19)
    expect(partial).toEqual([])
    expect(target.status).toBe('upgrading')
    expect(target.level).toBe(1)
    expect(target.productionProgress).toBe(19)

    const completed = advanceBuildingUpgrades({ 'house-1': target }, { house: granaryDefinition }, 1)
    expect(completed).toEqual([
      {
        buildingId: 'house-1',
        previousLevel: 1,
        level: 2,
        effect: { capacity: 115, jobs: 2 },
      },
    ])
    expect(target.status).toBe('idle')
    expect(target.level).toBe(2)
    expect(target.productionProgress).toBe(0)
  })

  it('does not start a queued upgrade when city storage materials are missing', () => {
    const target = building(1, {}, 'house-1', 'house')
    const store = building(1, { wood: 1, stone: 1 }, 'granary-1')

    const result = startBuildingUpgradeFromCityStorage(
      target,
      granaryDefinition,
      { 'house-1': target, 'granary-1': store },
      { granary: granaryDefinition },
    )

    expect(result).toEqual({
      ok: false,
      reason: 'insufficient-materials',
      missing: { wood: 1 },
    })
    expect(target.status).toBe('idle')
    expect(target.level).toBe(1)
    expect(store.inventory).toEqual({ wood: 1, stone: 1 })
  })

  it('rejects starting a queued upgrade while the building is already upgrading', () => {
    const target = building(1, {}, 'house-1', 'house')
    const store = building(1, { wood: 4, stone: 2 }, 'granary-1')
    startBuildingUpgradeFromCityStorage(
      target,
      granaryDefinition,
      { 'house-1': target, 'granary-1': store },
      { granary: granaryDefinition },
    )

    const result = startBuildingUpgradeFromCityStorage(
      target,
      granaryDefinition,
      { 'house-1': target, 'granary-1': store },
      { granary: granaryDefinition },
    )

    expect(result).toEqual({ ok: false, reason: 'already-upgrading' })
    expect(target.level).toBe(1)
    expect(target.status).toBe('upgrading')
    expect(store.inventory).toEqual({ wood: 2, stone: 1 })
  })

  it('rejects starting a queued upgrade for a max-level building', () => {
    const target = building(8, {}, 'house-1', 'house')
    const store = building(1, { wood: 99, stone: 99 }, 'granary-1')

    const result = startBuildingUpgradeFromCityStorage(
      target,
      granaryDefinition,
      { 'house-1': target, 'granary-1': store },
      { granary: granaryDefinition },
    )

    expect(result).toEqual({ ok: false, reason: 'max-level' })
    expect(target.status).toBe('idle')
    expect(target.level).toBe(8)
    expect(store.inventory).toEqual({ wood: 99, stone: 99 })
  })
})
