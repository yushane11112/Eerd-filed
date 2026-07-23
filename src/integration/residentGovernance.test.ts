import { describe, expect, it } from 'vitest'
import { BUILDING_DEFINITIONS } from '../content/runtimeBuildings'
import type { SimulationSnapshot } from '../simulation/contracts'
import { deriveResidentGovernance, formatResidentActivity, formatResidentMigrationAudit, formatResidentPressure } from './residentGovernance'

function snapshot(): SimulationSnapshot {
  return {
    version: 6,
    seed: 1,
    tick: 20,
    speed: 1,
    cells: [],
    buildings: {
      home: {
        id: 'home', type: 'house', origin: { x: 0, y: 0 }, rotation: 0,
        level: 2, entrance: { x: 0, y: 0 }, status: 'idle', workers: [], inventory: {}, productionProgress: 0,
      },
      shop: {
        id: 'shop', type: 'woodshop', origin: { x: 2, y: 0 }, rotation: 0,
        level: 1, entrance: { x: 2, y: 0 }, status: 'working', workers: ['worker-1'], inventory: {}, productionProgress: 4,
      },
    },
    households: {
      family: {
        id: 'family', homeBuildingId: 'home', members: 4, workerIds: ['worker-1', 'worker-2'], income: 10, satisfaction: 80,
        needs: { food: 80, goods: 60, health: 90, education: 90, entertainment: 80 },
      },
    },
    agents: {
      'worker-1': { id: 'worker-1', role: 'worker', householdId: 'family', employerBuildingId: 'shop', position: { x: 2, y: 0 }, path: [], pathIndex: 0, activity: 'working' },
      'worker-2': { id: 'worker-2', role: 'worker', householdId: 'family', position: { x: 0, y: 0 }, path: [], pathIndex: 0, activity: 'home' },
    },
    logisticsOrders: {},
    economy: { treasury: 100, resources: {}, taxRate: 0.1, lastServiceMaintenanceCost: 7 },
    populationFlow: {
      householdsIn: 3, householdsOut: 1, residentsIn: 10, residentsOut: 3,
      arrivalsByHousing: { house: 3 }, departuresByReason: { unemployment: 1 },
      departuresByHousing: { house: 1 }, departuresByOccupation: { unemployed: 1 },
      employedWorkersOut: 0, unemployedWorkersOut: 1,
    },
    metrics: { population: 4, households: 1, housingCapacity: 12, employedWorkers: 1, availableJobs: 0, cityAttraction: 60, satisfaction: 80, logisticsEfficiency: 100, publicServiceCoverage: 82, netMigration: 2 },
    worldDrops: [],
    rareRewards: { missesSinceReward: 0, rewardsToday: 0, dayKey: 'test', processedEventIds: [], inventory: {} },
  }
}

describe('resident governance summary', () => {
  it('derives housing, employment, occupation and needs from the live snapshot', () => {
    const result = deriveResidentGovernance(snapshot(), BUILDING_DEFINITIONS)
    expect(result).toMatchObject({
      households: 1,
      population: 4,
      housingCapacity: 12,
      workerCount: 2,
      employedWorkers: 1,
      unemployedWorkers: 1,
      absentWorkers: 0,
      migrationCandidates: 0,
      migrationIn: 3,
      migrationOut: 1,
      netMigration: 2,
      publicServiceCoverage: 82,
      serviceMaintenanceCost: 7,
      overcrowdedHouseholds: 0,
      lowestNeed: { label: '日用品', value: 60 },
    })
    expect(result.occupations).toEqual([{ label: '木作坊', count: 1 }, { label: '待业', count: 1 }])
  })

  it('summarizes real worker activities for the governance card', () => {
    const result = deriveResidentGovernance(snapshot(), BUILDING_DEFINITIONS)
    expect(formatResidentActivity(result)).toBe('工作 1、居家 1')
  })

  it('explains population flow using the persisted departure breakdown', () => {
    const result = deriveResidentGovernance(snapshot(), BUILDING_DEFINITIONS)
    expect(formatResidentMigrationAudit(result)).toBe('主要原因：长期失业 1 户；离城职业：待业 1')
  })

  it('surfaces the longest live service pressure', () => {
    const live = snapshot()
    live.households.family.needPressure = {
      goods: { ticks: 6, cause: 'missing-resource', buildingId: 'shop' },
    }
    const result = deriveResidentGovernance(live, BUILDING_DEFINITIONS)
    expect(result.servicePressure).toEqual({ label: '日用品', ticks: 6, cause: 'missing-resource' })
    expect(formatResidentPressure(result)).toContain('日用品')
    expect(formatResidentPressure(result)).toContain('服务库存缺资源')
  })

  it('tracks operational blockage duration and its logistics and inventory consequences', () => {
    const live = snapshot()
    live.tick = 32
    live.buildings.shop.status = 'blocked'
    live.buildings.shop.statusReason = 'output-full'
    live.buildings.shop.blockedSinceTick = 25
    const result = deriveResidentGovernance(live, BUILDING_DEFINITIONS)
    expect(result.blockedBuildings).toBe(1)
    expect(result.longestBlockage).toEqual({ buildingId: 'shop', label: '木作坊', ticks: 7, reason: '仓满' })
    expect(result.logisticsBacklog).toBe(0)
    expect(result.inventoryPressureBuildings).toBe(1)
  })
})
