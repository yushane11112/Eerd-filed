import { describe, expect, it } from 'vitest'
import type { CityTimelineRecord, SimulationEvent } from '../simulation/contracts'
import { appendCityTimelineEvents, MAX_CITY_TIMELINE_RECORDS } from './cityTimeline'

const context = {
  buildingName: (buildingId: string) => buildingId === 'market-1' ? '东市' : buildingId,
  resourceName: (resource: string) => resource === 'food' ? '粮食' : resource,
}

describe('city timeline', () => {
  it('persists service, population and finance events with useful targets', () => {
    const events: SimulationEvent[] = [
      { type: 'service-delivered', buildingId: 'clinic-1', householdId: 'household-1', need: 'health', needBefore: 32, needAfter: 68 },
      { type: 'purchase-completed', buildingId: 'market-1', householdId: 'household-1', resource: 'food', amount: 2, taxPaid: 3 },
      { type: 'migration-candidate-arrived', candidateId: 'migrant-1', members: 3, attraction: 64 },
      { type: 'household-migrated', householdId: 'household-2', direction: 'out', reason: 'low-satisfaction' },
    ]

    expect(appendCityTimelineEvents([], events, 120, context)).toEqual([
      expect.objectContaining({ kind: 'service', source: 'service-delivered', buildingId: 'clinic-1' }),
      expect.objectContaining({ kind: 'finance', source: 'purchase-completed', buildingId: 'market-1', detail: '东市售出粮食×2，税收 +3。' }),
      expect.objectContaining({ kind: 'population', source: 'migration-candidate-arrived' }),
      expect.objectContaining({ kind: 'population', source: 'household-migrated' }),
    ])
  })

  it('audits service recovery before and after the latest fiscal settlement', () => {
    const records = appendCityTimelineEvents([], [
      { type: 'service-delivered', buildingId: 'clinic-1', householdId: 'household-1', need: 'health', needBefore: 32, needAfter: 68 },
    ], 121, {
      ...context,
      fiscalSnapshot: () => ({ treasury: 88, treasuryBefore: 85, taxIncome: 12, maintenanceCost: 9, serviceMaintenanceCost: 4, settlementTick: 120 }),
    })

    expect(records[0]).toMatchObject({
      fiscal: { treasuryBefore: 85, treasury: 88, serviceMaintenanceCost: 4, settlementTick: 120 },
      detail: expect.stringContaining('需求 32→68'),
      serviceDelivery: { need: 'health', needBefore: 32, needAfter: 68 },
    })
  })

  it('renders a bottleneck-cleared event as an actionable recovery record', () => {
    const records = appendCityTimelineEvents([], [
      {
        type: 'service-bottleneck-cleared',
        buildingId: 'clinic-1',
        need: 'health',
        previousCause: 'missing-resource',
        pressureClearedHouseholds: 1,
        maxPressureTicks: 4,
        buildingStatusBefore: 'blocked',
        buildingStatusAfter: 'serving',
      },
    ], 122, context)

    expect(records[0]).toMatchObject({
      kind: 'service',
      title: '服务瓶颈解除',
      detail: expect.stringContaining('最长持续 4 刻'),
      serviceRecovery: {
        need: 'health',
        buildingStatusBefore: 'blocked',
        buildingStatusAfter: 'serving',
        pressureClearedHouseholds: 1,
        maxPressureTicks: 4,
      },
    })
  })

  it('keeps the start and recovery of a non-service blockage on one inspectable event shape', () => {
    const records = appendCityTimelineEvents([], [
      { type: 'building-blockage-started', buildingId: 'workshop-1', reason: 'missing-input:wood', blockedSinceTick: 30, consequences: { absentWorkers: 1, relatedLogisticsOrders: 2, inventoryTotal: 4, inventoryCapacity: 10, pressuredHouseholds: 3 } },
      { type: 'building-blockage-cleared', buildingId: 'workshop-1', reason: 'missing-input:wood', blockedSinceTick: 30, durationTicks: 5, resolvedStatus: 'working', consequences: { absentWorkers: 0, relatedLogisticsOrders: 1, inventoryTotal: 6, inventoryCapacity: 10, pressuredHouseholds: 0 }, consequencesAtStart: { absentWorkers: 1, relatedLogisticsOrders: 2, inventoryTotal: 4, inventoryCapacity: 10, pressuredHouseholds: 3 }, consequenceDelta: { absentWorkersDelta: -1, relatedLogisticsOrdersDelta: -1, inventoryDelta: 2, pressuredHouseholdsDelta: -3 } },
    ], 35, context)
    expect(records).toMatchObject([
      { kind: 'operations', source: 'building-blockage-started', detail: expect.stringContaining('库存 4/10'), blockage: { reason: 'missing-input:wood', durationTicks: 0, consequences: { pressuredHouseholds: 3 } } },
      { kind: 'operations', source: 'building-blockage-cleared', detail: expect.stringContaining('期间变化：库存 +2'), blockage: { durationTicks: 5, resolvedStatus: 'working', consequences: { inventoryTotal: 6 }, consequenceDelta: { inventoryDelta: 2 } } },
    ])
  })

  it('projects fiscal settlement pressure changes into a finance timeline record', () => {
    const records = appendCityTimelineEvents([], [{
      type: 'fiscal-settlement',
      settlementTick: 120,
      treasuryBefore: 80,
      treasuryAfter: 72,
      taxIncome: 12,
      maintenanceCost: 20,
      serviceMaintenanceCost: 8,
      operationalPressure: { blockedBuildings: 2, logisticsBacklog: 3, inventoryPressureBuildings: 1, pressuredHouseholds: 4 },
      operationalPressureDelta: { blockedBuildingsDelta: 1, logisticsBacklogDelta: 2, inventoryPressureBuildingsDelta: 1, pressuredHouseholdsDelta: 3 },
    }], 120, context)

    expect(records[0]).toMatchObject({
      kind: 'finance',
      source: 'fiscal-settlement',
      fiscalPressure: {
        current: { blockedBuildings: 2, pressuredHouseholds: 4 },
        delta: { blockedBuildingsDelta: 1, pressuredHouseholdsDelta: 3 },
      },
    })
    expect(records[0].detail).toContain('较上周期阻塞 +1')
  })

  it('projects employment and attendance changes as labor records', () => {
    const records = appendCityTimelineEvents([], [
      { type: 'worker-employment-changed', workerId: 'worker-1', householdId: 'household-1', buildingId: 'workshop-1' },
      { type: 'worker-attendance-changed', workerId: 'worker-1', householdId: 'household-1', buildingId: 'workshop-1', status: 'absent', reason: 'low-health' },
    ], 12, {
      ...context,
      residentProfile: () => ({ phase: 'settled', origin: '外来家庭', members: 3, workerCount: 1, employedCount: 1, occupations: ['木作坊'] }),
    })
    expect(records).toMatchObject([
      { kind: 'labor', title: '居民获得岗位', buildingId: 'workshop-1' },
      { kind: 'labor', title: '居民缺勤', detail: expect.stringContaining('健康状况不佳') },
    ])
  })

  it('explains the concrete pressure behind a household leaving', () => {
    const records = appendCityTimelineEvents([], [
      {
        type: 'household-migrated',
        householdId: 'household-1',
        direction: 'out',
        reason: 'critical-needs',
        need: 'health',
        needCause: 'missing-resource',
        serviceBuildingId: 'clinic-1',
      },
      {
        type: 'household-migrated',
        householdId: 'household-2',
        direction: 'out',
        reason: 'chronic-absence',
        absenceTicks: 4,
      },
    ], 18, {
      ...context,
      fiscalSnapshot: () => ({ treasury: 88, treasuryBefore: 85, taxIncome: 12, maintenanceCost: 9, serviceMaintenanceCost: 4, settlementTick: 10 }),
    })

    expect(records[0].detail).toContain('医疗')
    expect(records[0].detail).toContain('服务库存缺少所需资源')
    expect(records[1].detail).toContain('连续4刻')
    expect(records[0].fiscal).toMatchObject({ treasury: 88, treasuryBefore: 85, serviceMaintenanceCost: 4, settlementTick: 10 })
    expect(records[0].detail).toContain('公共服务 4')
    expect(records[0].detail).toContain('85→88')
  })

  it('keeps the departed household profile instead of reducing it to an empty placeholder', () => {
    const records = appendCityTimelineEvents([], [
      { type: 'household-migrated', householdId: 'household-1', direction: 'out', reason: 'unemployment' },
    ], 22, {
      ...context,
      departedResidentProfile: () => ({
        phase: 'departed', origin: '离城家庭', members: 5, workerCount: 2,
        employedCount: 0, occupations: ['待业'], homeBuildingId: 'house-1', satisfaction: 18,
      }),
    })

    expect(records[0].resident).toMatchObject({
      phase: 'departed', members: 5, workerCount: 2, occupations: ['待业'], satisfaction: 18,
    })
  })

  it('keeps a bounded recent window for long-running cities', () => {
    const history: CityTimelineRecord[] = Array.from({ length: MAX_CITY_TIMELINE_RECORDS }, (_, index) => ({
      id: `old-${index}`,
      tick: index,
      kind: 'population',
      source: 'household-migrated',
      title: '旧记录',
      detail: '旧记录',
    }))
    const next = appendCityTimelineEvents(history, [
      { type: 'household-migrated', householdId: 'new-household', direction: 'in' },
    ], 999, context)
    expect(next).toHaveLength(MAX_CITY_TIMELINE_RECORDS)
    expect(next[0].id).toBe('old-1')
    expect(next.at(-1)).toMatchObject({ tick: 999, title: '新家庭入住' })
  })
})
