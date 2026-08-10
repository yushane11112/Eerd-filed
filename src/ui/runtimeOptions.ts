import type { GameRuntimeOptions } from '../integration/GameRuntime'

const DEBUG_SCENARIOS = new Set<GameRuntimeOptions['debugScenario']>([
  'isolated-road-network',
  'isolated-road-network-low-treasury',
  'bridge-gap',
  'logistics-hotspot',
  'logistics-storage-build',
  'logistics-source-shortage',
  'civilization-resident-timeline',
  'civilization-scale',
  'service-facility-runtime',
])

export function runtimeOptionsFromSearch(search: string): GameRuntimeOptions {
  const params = new URLSearchParams(search)
  const debugScenario = params.get('debugScenario') as GameRuntimeOptions['debugScenario'] | null
  const suppressAdvanceEmit = params.get('suppressReactCommit') === '1'
  const options: GameRuntimeOptions = suppressAdvanceEmit ? { suppressAdvanceEmit } : {}
  if (debugScenario && DEBUG_SCENARIOS.has(debugScenario)) {
    return { ...options, debugScenario }
  }
  return options
}
