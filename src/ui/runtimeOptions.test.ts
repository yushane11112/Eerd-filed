import { describe, expect, it } from 'vitest'
import { runtimeOptionsFromSearch } from './runtimeOptions'

describe('runtime URL options', () => {
  it('enables the isolated road network debug scenario from a query parameter', () => {
    expect(runtimeOptionsFromSearch('?debugScenario=isolated-road-network')).toEqual({
      debugScenario: 'isolated-road-network',
    })
  })

  it('enables the low treasury isolated road network debug scenario', () => {
    expect(runtimeOptionsFromSearch('?debugScenario=isolated-road-network-low-treasury')).toEqual({
      debugScenario: 'isolated-road-network-low-treasury',
    })
  })

  it('ignores unknown debug scenarios', () => {
    expect(runtimeOptionsFromSearch('?debugScenario=unknown')).toEqual({})
  })
})
