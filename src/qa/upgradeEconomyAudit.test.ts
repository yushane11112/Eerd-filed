import { describe, expect, it } from 'vitest'
import { BUILDING_DEFINITIONS } from '../content/runtimeBuildings'
import { DEFAULT_CONSTRUCTION_ECONOMY_TABLE } from '../simulation/economy/construction'
import { DEFAULT_SERVICE_RULES, serviceCapacityPerTick } from '../simulation/economy/service'
import {
  auditUpgradeEconomy,
  DEFAULT_UPGRADE_ECONOMY_AUDIT_ASSUMPTIONS,
  formatUpgradeEconomyAudit,
} from './upgradeEconomyAudit'

describe('upgrade economy audit', () => {
  it('audits every runtime building level and exposes service capacity linkage', () => {
    const report = auditUpgradeEconomy(BUILDING_DEFINITIONS)
    expect(report.rows).toHaveLength(Object.keys(BUILDING_DEFINITIONS).length * 8)

    const marketLevel2 = report.rows.find((row) => (
      row.buildingType === 'market' && row.level === 2
    ))
    expect(marketLevel2).toMatchObject({
      nextLevel: 3,
      serviceCapacityBefore: serviceCapacityPerTick(DEFAULT_SERVICE_RULES.market, 2),
      serviceCapacityAfter: serviceCapacityPerTick(DEFAULT_SERVICE_RULES.market, 3),
      serviceCapacityDelta: 1,
      serviceValueDelta: 1500,
    })
  })

  it('keeps assumptions explicit and measures production value coupling', () => {
    const report = auditUpgradeEconomy(BUILDING_DEFINITIONS)
    expect(report.assumptions).toMatchObject({
      fiscalSettlementTicks: 300,
      occupancyRate: 0.8,
      materialValue: DEFAULT_UPGRADE_ECONOMY_AUDIT_ASSUMPTIONS.materialValue,
    })
    expect(report.summary.productionLinkedRows).toBeGreaterThan(0)
    expect(report.rows.find((row) => row.buildingType === 'riceField' && row.level === 1)).toMatchObject({
      productionValueDelta: 0,
      warnings: ['产能价值无增量', '维护费抵消全部增益'],
    })
    expect(report.rows.find((row) => row.buildingType === 'riceField' && row.level === 2)).toMatchObject({
      productionValueDelta: 22.86,
    })
  })

  it('formats a compact balancing report for production review', () => {
    const report = auditUpgradeEconomy(BUILDING_DEFINITIONS, DEFAULT_CONSTRUCTION_ECONOMY_TABLE)
    const text = formatUpgradeEconomyAudit(report)
    expect(text).toContain('升级经济审计：64 个升级节点')
    expect(text).toContain('服务吞吐联动')
    expect(text).toContain('水稻田 Lv.1→2')
  })
})
