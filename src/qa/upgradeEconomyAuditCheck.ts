import { BUILDING_DEFINITIONS } from '../content/runtimeBuildings'
import { auditUpgradeEconomy, formatUpgradeEconomyAudit } from './upgradeEconomyAudit'

const report = auditUpgradeEconomy(BUILDING_DEFINITIONS)
if (report.rows.length !== Object.keys(BUILDING_DEFINITIONS).length * 8) {
  throw new Error('升级经济审计未覆盖全部运行时建筑等级。')
}
if (report.rows.some((row) => !Number.isFinite(row.costValue) || !Number.isFinite(row.netValuePerSettlement))) {
  throw new Error('升级经济审计出现非法数值。')
}
console.log(formatUpgradeEconomyAudit(report))
