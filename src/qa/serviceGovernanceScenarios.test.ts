import { describe, expect, it } from 'vitest'
import { runServiceGovernanceQaScenarios } from './serviceGovernanceScenarios'

describe('service governance QA scenarios', () => {
  it('reports a buildable market recommendation that reduces service gaps', () => {
    const [summary] = runServiceGovernanceQaScenarios()

    expect(summary).toMatchObject({
      id: 'default-service-gap-market',
      title: '服务缺口补市场',
      before: {
        serviceGaps: expect.any(Number),
        treasury: 2400,
        recommendedBuilding: 'market',
        buildable: true,
        constructionCost: {
          treasury: 180,
          materials: { wood: 4, stone: 2 },
        },
      },
      action: {
        ok: true,
        message: expect.stringContaining('临河集市已落成'),
      },
      after: {
        serviceGaps: expect.any(Number),
        treasury: 2220,
      },
    })
    expect(summary.before.serviceGaps).toBeGreaterThan(0)
    expect(summary.after.serviceGaps).toBeLessThan(summary.before.serviceGaps)
  })
})
