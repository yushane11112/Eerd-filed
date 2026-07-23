import { describe, expect, it } from 'vitest'
import {
  runServiceFacilityFailureScenarios,
  runServiceFacilityQaScenario,
  runServiceFacilityQaScenarios,
} from './serviceFacilityScenarios'

describe('service facility QA scenarios', () => {
  it('runs pharmacy construction, staffing and resident health recovery end to end', () => {
    const summary = runServiceFacilityQaScenario()

    expect(summary.build).toMatchObject({ ok: true })
    expect(summary.build.buildingId).toMatch(/^pharmacy-/)
    expect(summary.staffing.assigned).toBe(true)
    expect(summary.recovery.serviceDelivered).toBe(true)
    expect(summary.recovery.healthAfter).toBeGreaterThan(summary.recovery.healthBefore)
  })

  it('runs pharmacy, academy and theatre through resident service recovery', () => {
    const summaries = runServiceFacilityQaScenarios()

    expect(summaries).toHaveLength(3)
    expect(summaries.map((summary) => summary.title)).toEqual([
      'pharmacy服务恢复闭环',
      'academy服务恢复闭环',
      'theatre服务恢复闭环',
    ])
    for (const summary of summaries) {
      expect(summary.build.ok).toBe(true)
      expect(summary.staffing.assigned).toBe(true)
      expect(summary.recovery.serviceDelivered).toBe(true)
      expect(summary.recovery.needAfter).toBeGreaterThan(summary.recovery.needBefore)
      expect(summary.recovery.publicServiceCoverageAfter).toBeGreaterThan(summary.recovery.publicServiceCoverageBefore)
    }
  })

  it('keeps worker, resource and route failures visible in the service state', () => {
    const summaries = runServiceFacilityFailureScenarios()

    expect(summaries.map((summary) => summary.failure)).toEqual([
      'no-workers',
      'missing-resource',
      'no-route',
    ])
    expect(summaries[0]).toMatchObject({
      statusReason: 'no-workers',
      pressureCause: 'no-workers',
    })
    expect(summaries[1]).toMatchObject({
      statusReason: 'missing-service-resource:medicine',
      pressureCause: 'missing-resource',
    })
    expect(summaries[2]).toMatchObject({
      statusReason: 'no-service-route',
      pressureCause: 'no-route',
    })
  })
})
