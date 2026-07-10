import {
  CIVILIZATION_30_DAY_TICKS,
  CIVILIZATION_LONG_RUN_LAYER_TICKS,
  CIVILIZATION_LONG_RUN_SNAPSHOT_LIMITS,
  runCivilizationLongRunScenario,
} from './civilizationLongRun'

export function runCivilizationLongRunCheck(): void {
  const report = runCivilizationLongRunScenario()
  assertEqual(CIVILIZATION_30_DAY_TICKS, 7_200, '30-day long run ticks')
  assertDeepEqual(CIVILIZATION_LONG_RUN_LAYER_TICKS, [2_400, 4_800, 7_200], 'layer ticks')
  assertEqual(report.final.tick, CIVILIZATION_30_DAY_TICKS, 'final tick')
  assertDeepEqual(report.layers.map((layer) => layer.tick), CIVILIZATION_LONG_RUN_LAYER_TICKS, 'report layer ticks')
  assertEqual(report.layers.length, 3, 'layer count')

  for (const layer of report.layers) {
    assertAtLeast(layer.population, report.thresholds.minPopulation, `population @${layer.tick}`)
    assertAtMost(layer.population, report.thresholds.maxPopulation, `population @${layer.tick}`)
    assertAtLeast(layer.averageSatisfaction, report.thresholds.minAverageSatisfaction, `satisfaction @${layer.tick}`)
    assertAtLeast(layer.logisticsEfficiency, report.thresholds.minLogisticsEfficiency, `logistics @${layer.tick}`)
    assertAtMost(layer.blockedBuildings, report.thresholds.maxBlockedBuildings, `blocked buildings @${layer.tick}`)
    assertAtMost(layer.activeOrders, report.thresholds.maxActiveOrders, `active orders @${layer.tick}`)
    assertAtMost(layer.totalOrders, report.thresholds.maxHistoricalOrders, `retained orders @${layer.tick}`)
    assertAtMost(layer.maxBuildingInventory, report.thresholds.maxBuildingInventory, `max inventory @${layer.tick}`)
    assertDeepEqual(layer.invalidNumericFields, [], `invalid numeric fields @${layer.tick}`)
    assertAtMost(layer.snapshotSizes.households, CIVILIZATION_LONG_RUN_SNAPSHOT_LIMITS.households, `household table @${layer.tick}`)
    assertAtMost(layer.snapshotSizes.buildings, CIVILIZATION_LONG_RUN_SNAPSHOT_LIMITS.buildings, `building table @${layer.tick}`)
    assertAtMost(layer.snapshotSizes.agents, CIVILIZATION_LONG_RUN_SNAPSHOT_LIMITS.agents, `agent table @${layer.tick}`)
    assertAtMost(layer.snapshotSizes.logisticsOrders, CIVILIZATION_LONG_RUN_SNAPSHOT_LIMITS.logisticsOrders, `order table @${layer.tick}`)
    assertAtMost(layer.snapshotSizes.worldDrops, CIVILIZATION_LONG_RUN_SNAPSHOT_LIMITS.worldDrops, `world drop table @${layer.tick}`)
    assertFinite(layer.queuePressure.serviceQueues, `service queue count @${layer.tick}`)
    assertFinite(layer.queuePressure.queuedHouseholds, `queued households @${layer.tick}`)
    assertFinite(layer.queuePressure.longestServiceWaitTicks, `longest service wait @${layer.tick}`)
    assertFinite(layer.queuePressure.logisticsQueues, `logistics queue count @${layer.tick}`)
    assertFinite(layer.queuePressure.unloadBacklog, `unload backlog @${layer.tick}`)
    assertFinite(layer.queuePressure.longestUnloadWaitTicks, `longest unload wait @${layer.tick}`)
  }

  assertAtLeast(report.final.queuePressure.queuedHouseholds, 1, 'final queued households')
  assertAtLeast(report.final.queuePressure.unloadBacklog, 1, 'final unload backlog')
  assertAtLeast(report.queuePressureProbe.queuePressure.unloadBacklog, 1, 'probe unload backlog')
  assertAtLeast(report.queuePressureProbe.queuePressure.logisticsQueues, 1, 'probe logistics queues')
  assertAtLeast(report.layers[2].archivedOrders, report.layers[0].archivedOrders + 1, 'archive grows by final layer')
  assertAtLeast(report.final.archivedOrders, 1, 'final archived orders')
  console.log(JSON.stringify(report, null, 2))
}

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`)
  }
}

function assertDeepEqual(actual: unknown, expected: unknown, label: string): void {
  const actualJson = JSON.stringify(actual)
  const expectedJson = JSON.stringify(expected)
  if (actualJson !== expectedJson) {
    throw new Error(`${label}: expected ${expectedJson}, got ${actualJson}`)
  }
}

function assertAtLeast(actual: number, minimum: number, label: string): void {
  if (actual < minimum) {
    throw new Error(`${label}: expected >= ${minimum}, got ${actual}`)
  }
}

function assertAtMost(actual: number, maximum: number, label: string): void {
  if (actual > maximum) {
    throw new Error(`${label}: expected <= ${maximum}, got ${actual}`)
  }
}

function assertFinite(actual: number, label: string): void {
  if (!Number.isFinite(actual)) {
    throw new Error(`${label}: expected finite number, got ${String(actual)}`)
  }
}

runCivilizationLongRunCheck()
