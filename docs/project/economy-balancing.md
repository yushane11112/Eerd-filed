# 《小耳岛》经济表与平衡审计

更新时间：2026-07-13

本文件记录当前已进入代码的经济表、可调入口和仍未满足商业级平衡的缺口。

## 1. 当前营造经济表

代码入口：`src/simulation/economy/construction.ts`

默认表：`DEFAULT_CONSTRUCTION_ECONOMY_TABLE`

| 类型 | 银两 | 材料 | 当前用途 |
| --- | ---: | --- | --- |
| 民居 `house` | 80 | 木料×2、石料×1 | 早期人口扩张 |
| 粮仓 `granary` | 140 | 木料×3、石料×2 | 仓储与物流缓冲 |
| 稻田 `riceField` | 60 | 木料×1 | 基础食物生产 |
| 市场 `market` | 180 | 木料×4、石料×2 | 服务覆盖与消费 |
| 木作坊 `woodshop` | 220 | 木料×5、石料×2、砖瓦×1 | 早期生产链扩展 |
| 泥路 `dirt` | 2 / 格 | 无 | 低成本道路 |
| 石板路 `stone` | 6 / 格 | 无 | 默认道路 |
| 桥路 `bridge` | 18 / 格 | 无 | 跨水交通 |
| 建筑升级 | 无 | `defaultCurve` 兜底兼容旧曲线；`categoryCurves` 按住宅、仓储、生产、市场、服务、港口、地标分层；`typeCurves` 可覆盖单栋建筑 | L0–L8 升级施工 |

未显式配置的建筑使用 fallback：

- 银两 = `baseTreasury + footprintSize × treasuryPerFootprint`
- 木料 = `ceil(footprintSize / woodPerTwoFootprint)`，至少 1
- 石料 = `floor(footprintSize / stonePerThreeFootprint)`

默认 fallback 保持旧逻辑：`50 + footprint × 20`，木料按 2 格向上取整，石料按 3 格向下取整。

升级曲线现在分三层读取：

1. `typeCurves[buildingDefinition.type]`：最高优先级，用于客栈、书院、码头等单体需要独立节奏的建筑。
2. `categoryCurves[buildingDefinition.category]`：中间层，用于住宅、仓储、生产、市场、服务、港口、地标等类别的默认成长曲线。
3. `defaultCurve`：兜底层，未传建筑定义或未配置类型/类别时使用，并保持旧首版木料/石料倍率兼容。

曲线支持 `base`、`perNextLevel`、`perTwoNextLevels` 和 `milestoneLevels`，因此能表达“每级稳定投入 + 奇偶/中后期递增 + 特定等级要布匹/砖瓦/盐等里程碑材料”的组合。

## 2. 已完成的工程门禁

- 默认经济表可导出，后续平衡工具、关卡配置或 QA 能读取。
- `validateConstructionEconomyTable` 会拒绝负数、非数值和无效 fallback 分母。
- `quoteBuildingConstruction`、`spendBuildingConstructionCost`、`quoteRoadConstruction` 支持传入自定义表。
- `buildingUpgradeCost`、`upgradeBuildingFromCityStorage`、`startBuildingUpgradeFromCityStorage` 支持传入自定义表；未传建筑定义时 `defaultCurve` 兼容旧数值，传入建筑定义后会按类型/类别曲线报价和扣料。
- 现有 UI、治理卡、建造菜单和运行时仍复用同一升级入口；传入建筑定义的正式升级会按类型/类别曲线变化，未传定义的兜底路径保持旧首版数值。
- 测试覆盖默认表、可调表报价、升级成本替换和非法表校验。

## 3. 当前不是商业级平衡的原因

必须直说：当前表只是“可调结构”，不是最终商业经济。

主要缺口：

1. 成本没有和建筑真实产能、服务容量、维护费、占地、道路可达性、工人数量形成统一公式。
2. 道路和桥梁只有一次性建设成本，没有维护、拥堵、损坏或财政预算压力。
3. 升级成本已有第一版类型/类别分层，但还没有按真实产能、服务容量、维护费、文明阶段和投资回收周期校准。
4. 仓储容量、服务排队、物流吞吐没有反向影响成本曲线。
5. 没有按城市阶段拆出早期、中期、成熟期的目标回本周期。
6. 没有按玩家操作频率验证“扩张节奏是否过快/过慢”。

## 4. 后续商业级平衡任务

| 任务 | 目标 | 产出 |
| --- | --- | --- |
| 新建/升级成本统一 | 建筑从 L0 到 L8 的投入曲线可解释 | 已完成第一版：`ConstructionEconomyTable.upgradeCosts` |
| 分类型升级曲线 | 不同建筑类别升级投入与收益匹配 | 已完成第一版：`defaultCurve` / `categoryCurves` / `typeCurves` |
| 容量反推成本 | 仓储、市场、服务建筑价格与吞吐/容量挂钩 | 成本公式和 QA 样本 |
| 道路维护与预算 | 道路不只是一次性花费 | 维护费、赤字后果、道路状态 |
| 回本周期审计 | 不同建筑的收益/服务价值有目标区间 | 平衡报表 |
| 30 日压力联动 | 7200 tick 长跑验证成本表不会导致过快膨胀或停摆 | `qa:civilization-long-run` 扩展 |

## 5. 当前结论

当前完成的是“从硬编码首版规则 → 可导出、可校验、可替换、可按类型/类别扩展的经济表”，并已覆盖建筑新建、道路和第一版分层升级成本。

不能把它表述为“经济系统已完成”。真正的商业级经济还必须继续接入服务容量、排队、仓储吞吐、道路维护、阶段目标、产能收益和回本周期审计。
