import type {
  BuildingDefinition,
  ResourceKind,
} from '../simulation/contracts'
import {
  DEFAULT_CONSTRUCTION_ECONOMY_TABLE,
  buildingUpgradeCost,
  type ConstructionEconomyTable,
} from '../simulation/economy/construction'
import {
  effectiveBuildingDefinition,
} from '../simulation/economy/upgrades'
import {
  DEFAULT_SERVICE_RULES,
  serviceCapacityPerTick,
  type ServiceRule,
} from '../simulation/economy/service'

export interface UpgradeEconomyAuditAssumptions {
  fiscalSettlementTicks: number
  materialValue: Partial<Record<ResourceKind, number>>
  taxValuePerJobPerSettlement: number
  capacityValuePerUnitPerSettlement: number
  occupancyRate: number
  serviceRules: Readonly<Record<string, ServiceRule>>
}

export interface UpgradeEconomyAuditRow {
  buildingType: string
  buildingName: string
  category: BuildingDefinition['category']
  level: number
  nextLevel: number
  cost: Partial<Record<ResourceKind, number>>
  costValue: number
  capacityBefore: number
  capacityAfter: number
  capacityDelta: number
  jobsBefore: number
  jobsAfter: number
  jobsDelta: number
  productionValueBefore: number
  productionValueAfter: number
  productionValueDelta: number
  serviceCapacityBefore: number
  serviceCapacityAfter: number
  serviceCapacityDelta: number
  serviceValueDelta: number
  maintenanceDelta: number
  taxValueDelta: number
  netValuePerSettlement: number
  paybackSettlements: number | null
  verdict: 'healthy' | 'slow' | 'no-return'
  warnings: string[]
}

export interface UpgradeEconomyAuditReport {
  generatedFor: string
  assumptions: UpgradeEconomyAuditAssumptions
  rows: UpgradeEconomyAuditRow[]
  summary: {
    rows: number
    healthy: number
    slow: number
    noReturn: number
    serviceLinkedRows: number
    productionLinkedRows: number
  }
}

export const DEFAULT_UPGRADE_ECONOMY_AUDIT_ASSUMPTIONS: UpgradeEconomyAuditAssumptions = {
  fiscalSettlementTicks: 300,
  materialValue: {
    food: 4,
    fish: 5,
    wood: 10,
    stone: 12,
    clay: 8,
    brick: 18,
    cloth: 24,
    salt: 10,
    medicine: 28,
  },
  taxValuePerJobPerSettlement: 8,
  capacityValuePerUnitPerSettlement: 0.05,
  occupancyRate: 0.8,
  serviceRules: DEFAULT_SERVICE_RULES,
}

export function auditUpgradeEconomy(
  definitions: Readonly<Record<string, BuildingDefinition>>,
  table: ConstructionEconomyTable = DEFAULT_CONSTRUCTION_ECONOMY_TABLE,
  assumptions: UpgradeEconomyAuditAssumptions = DEFAULT_UPGRADE_ECONOMY_AUDIT_ASSUMPTIONS,
): UpgradeEconomyAuditReport {
  const rows = Object.values(definitions)
    .sort((left, right) => left.type.localeCompare(right.type))
    .flatMap((definition) => Array.from({ length: definition.maxLevel }, (_, level) => (
      auditUpgradeRow(definition, level, table, assumptions)
    )))
  return {
    generatedFor: 'runtime-building-catalog',
    assumptions,
    rows,
    summary: {
      rows: rows.length,
      healthy: rows.filter((row) => row.verdict === 'healthy').length,
      slow: rows.filter((row) => row.verdict === 'slow').length,
      noReturn: rows.filter((row) => row.verdict === 'no-return').length,
      serviceLinkedRows: rows.filter((row) => row.serviceCapacityDelta > 0).length,
      productionLinkedRows: rows.filter((row) => row.productionValueDelta > 0).length,
    },
  }
}

export function auditUpgradeForBuilding(
  definition: BuildingDefinition,
  level: number,
  table: ConstructionEconomyTable = DEFAULT_CONSTRUCTION_ECONOMY_TABLE,
  assumptions: UpgradeEconomyAuditAssumptions = DEFAULT_UPGRADE_ECONOMY_AUDIT_ASSUMPTIONS,
): UpgradeEconomyAuditRow {
  return auditUpgradeRow(definition, level, table, assumptions)
}

export function formatUpgradeEconomyAudit(report: UpgradeEconomyAuditReport): string {
  const lines = [
    `升级经济审计：${report.rows.length} 个升级节点`,
    `健康 ${report.summary.healthy} · 慢回本 ${report.summary.slow} · 无回报 ${report.summary.noReturn}`,
    `服务吞吐联动 ${report.summary.serviceLinkedRows} · 生产产值联动 ${report.summary.productionLinkedRows}`,
  ]
  for (const row of report.rows) {
    const payback = row.paybackSettlements === null ? '不可回本' : `${row.paybackSettlements} 个财政周期`
    lines.push(`${row.buildingName} Lv.${row.level}→${row.nextLevel}：${payback}；${row.warnings.join('、') || '联动正常'}`)
  }
  return lines.join('\n')
}

function auditUpgradeRow(
  definition: BuildingDefinition,
  level: number,
  table: ConstructionEconomyTable,
  assumptions: UpgradeEconomyAuditAssumptions,
): UpgradeEconomyAuditRow {
  const before = effectiveBuildingDefinition(definition, { level })
  const after = effectiveBuildingDefinition(definition, { level: level + 1 })
  const cost = buildingUpgradeCost({ level }, table, definition)
  const costValue = Object.entries(cost).reduce(
    (total, [resource, amount]) => total + (assumptions.materialValue[resource as ResourceKind] ?? 0) * (amount ?? 0),
    0,
  )
  const serviceRule = assumptions.serviceRules[definition.type]
  const serviceCapacityBefore = serviceRule ? serviceCapacityPerTick(serviceRule, level) : 0
  const serviceCapacityAfter = serviceRule ? serviceCapacityPerTick(serviceRule, level + 1) : 0
  const productionValueBefore = productionValuePerSettlement(definition, before.production, assumptions)
  const productionValueAfter = productionValuePerSettlement(definition, after.production, assumptions)
  const capacityDelta = after.capacity - before.capacity
  const jobsDelta = after.jobs - before.jobs
  const serviceCapacityDelta = serviceCapacityAfter - serviceCapacityBefore
  const serviceValueDelta = serviceRule
    ? serviceCapacityDelta * (serviceRule.saleValuePerHousehold ?? 0) * assumptions.fiscalSettlementTicks
    : 0
  const maintenanceDelta = 1
  const taxValueDelta = jobsDelta * assumptions.taxValuePerJobPerSettlement * assumptions.occupancyRate
  const netValuePerSettlement = round(
    capacityDelta * assumptions.capacityValuePerUnitPerSettlement
      + taxValueDelta
      + (productionValueAfter - productionValueBefore)
      + serviceValueDelta
      - maintenanceDelta,
  )
  const paybackSettlements = netValuePerSettlement > 0
    ? round(costValue / netValuePerSettlement)
    : null
  const warnings: string[] = []
  if (capacityDelta <= 0) warnings.push('容量无增量')
  if (definition.production && productionValueAfter <= productionValueBefore) warnings.push('产能价值无增量')
  if (serviceRule && serviceCapacityDelta <= 0) warnings.push('服务吞吐无增量')
  if (paybackSettlements === null) warnings.push('维护费抵消全部增益')

  return {
    buildingType: definition.type,
    buildingName: definition.name,
    category: definition.category,
    level,
    nextLevel: level + 1,
    cost,
    costValue: round(costValue),
    capacityBefore: before.capacity,
    capacityAfter: after.capacity,
    capacityDelta,
    jobsBefore: before.jobs,
    jobsAfter: after.jobs,
    jobsDelta,
    productionValueBefore: round(productionValueBefore),
    productionValueAfter: round(productionValueAfter),
    productionValueDelta: round(productionValueAfter - productionValueBefore),
    serviceCapacityBefore,
    serviceCapacityAfter,
    serviceCapacityDelta,
    serviceValueDelta: round(serviceValueDelta),
    maintenanceDelta,
    taxValueDelta: round(taxValueDelta),
    netValuePerSettlement,
    paybackSettlements,
    verdict: paybackSettlements === null ? 'no-return' : paybackSettlements <= 12 ? 'healthy' : 'slow',
    warnings,
  }
}

function productionValuePerSettlement(
  definition: BuildingDefinition,
  production: BuildingDefinition['production'],
  assumptions: UpgradeEconomyAuditAssumptions,
): number {
  if (!production || production.durationTicks <= 0) return 0
  const outputValue = Object.entries(production.outputs).reduce(
    (total, [resource, amount]) => total + (assumptions.materialValue[resource as ResourceKind] ?? 0) * (amount ?? 0),
    0,
  )
  return outputValue * assumptions.fiscalSettlementTicks / production.durationTicks
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}
