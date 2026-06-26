import { describe, expect, it } from 'vitest'
import type { BuildingDefinition, BuildingEntity } from '../contracts'
import {
  effectiveBuildingDefinition,
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
})
