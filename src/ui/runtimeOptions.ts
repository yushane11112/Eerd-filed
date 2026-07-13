import type { GameRuntimeOptions } from '../integration/GameRuntime'

const DEBUG_SCENARIOS = new Set<GameRuntimeOptions['debugScenario']>([
  'isolated-road-network',
  'isolated-road-network-low-treasury',
  'bridge-gap',
  'logistics-hotspot',
  'logistics-source-shortage',
])

export function runtimeOptionsFromSearch(search: string): GameRuntimeOptions {
  const params = new URLSearchParams(search)
  const debugScenario = params.get('debugScenario') as GameRuntimeOptions['debugScenario'] | null
  if (debugScenario && DEBUG_SCENARIOS.has(debugScenario)) {
    return { debugScenario }
  }
  return {}
}
