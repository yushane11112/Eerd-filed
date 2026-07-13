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

  it('enables the bridge gap debug scenario', () => {
    expect(runtimeOptionsFromSearch('?debugScenario=bridge-gap')).toEqual({
      debugScenario: 'bridge-gap',
    })
  })

  it('enables the logistics hotspot debug scenario', () => {
    expect(runtimeOptionsFromSearch('?debugScenario=logistics-hotspot')).toEqual({
      debugScenario: 'logistics-hotspot',
    })
  })

  it('enables the logistics source shortage debug scenario', () => {
    expect(runtimeOptionsFromSearch('?debugScenario=logistics-source-shortage')).toEqual({
      debugScenario: 'logistics-source-shortage',
    })
  })

  it('ignores unknown debug scenarios', () => {
    expect(runtimeOptionsFromSearch('?debugScenario=unknown')).toEqual({})
  })
})
