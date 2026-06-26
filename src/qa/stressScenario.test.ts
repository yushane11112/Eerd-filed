import { describe, expect, it } from 'vitest'
import { createStressScenario, TARGET_STRESS_SIZE } from './stressScenario'

describe('target stress scenario', () => {
  it('creates the agreed city scale deterministically', () => {
    const first = createStressScenario()
    const second = createStressScenario()

    expect(Object.keys(first.households)).toHaveLength(TARGET_STRESS_SIZE.households)
    expect(Object.keys(first.buildings)).toHaveLength(TARGET_STRESS_SIZE.buildings)
    expect(Object.keys(first.agents)).toHaveLength(TARGET_STRESS_SIZE.visibleAgents)
    expect(second).toEqual(first)
  })
})

