# 验收与性能基准

## 功能链路

- 道路未连接时，住宅不能获得可达岗位，生产建筑不能创建有效运输。
- 原料必须经过生产、订单、承运、逐格移动和交付后才能进入目标库存。
- 缺工、缺料、仓满、断路和财政不足必须提供明确停工原因。
- 暂停时模拟 Tick 不增长；倍速只改变执行频率，不改变单 Tick 结果。
- 普通材料不依赖听歌；歌曲完成事件只结算稀缺材料。
- 外来人口必须先进入候选状态，再根据城市吸引力、空房和等待时长决定入住或离开，不能凭空生成正式住户。

## 2026-06-29 第三十七轮验证

- `vitest run src/game/legacy.test.ts`：覆盖旧群岛渲染开关和归档组件路径边界，要求旧 `IslandCanvas` 不再存在于正式 `src/components` 目录。
- `npm test`：29 个测试文件、184 项测试通过。
- `npm run build`：TypeScript 与 Vite 生产构建通过，`dist/` 产物生成。

## 2026-06-29 第三十八轮验证

- `vitest run src/simulation/world/movementPath.test.ts src/simulation/core/SimulationEngine.test.ts`：2 个测试文件、16 项通过，覆盖共享移动路径服务和候选外来人口迁入路径兼容。
- `npm test`：30 个测试文件、187 项测试通过。
- `npm run build`：TypeScript 与 Vite 生产构建通过，`dist/` 产物生成。

## 2026-06-29 第三十九轮验证

- `vitest run src/integration/stageAdvisor.test.ts`：1 个测试文件、4 项通过，覆盖图层指标、治理卡排序、物流热点定位和服务/道路缺口卡片。
- `npm test`：30 个测试文件、188 项测试通过。
- `npm run build`：TypeScript 与 Vite 生产构建通过，`dist/` 产物生成。

## 2026-06-29 第四十轮验证

- `vitest run src/simulation/districts/prosperity.test.ts`：1 个测试文件、3 项通过，覆盖街区繁荣接入服务覆盖、道路访问和真实物流活动。
- `npm test`：30 个测试文件、189 项测试通过。
- `npm run build`：TypeScript 与 Vite 生产构建通过，`dist/` 产物生成。

## 2026-06-27 第十二轮验证

- `pnpm vitest run src/simulation/core/SimulationEngine.test.ts`：12 项通过，覆盖候选抵达、正式入住、低吸引力拒绝、无房离开、迁出和满意度压力。
- `pnpm test`：26 个测试文件、163 项测试通过。
- `pnpm run build`：TypeScript 与 Vite 生产构建通过，`dist/` 产物生成。
- 说明：当前执行环境没有系统 `npm`，本轮使用 Codex 内置 `pnpm` 和内置 Node 运行等价脚本。

## 2026-06-27 第十三轮验证

- `vitest run src/simulation/core/SimulationEngine.test.ts src/integration/cityNotices.test.ts src/rendering/DynamicScene.test.ts`：3 个测试文件、30 项通过，覆盖候选停留点、迁入小事和居民层渲染。
- `vitest run`：26 个测试文件、165 项测试通过。
- `tsc -b`：类型检查通过。
- `vite build`：生产构建通过，`dist/` 产物生成。
- 说明：由于当前依赖目录由 pnpm 创建但仓库保留 npm lockfile，本轮验证直接调用 `node_modules/.bin` 下的本地工具，避免 pnpm 在非交互环境触发依赖目录清理。

## 2026-06-27 第十四轮验证

- `vitest run src/content/buildings.test.ts src/integration/GameRuntime.test.ts src/rendering/prefab/assetMapping.test.ts`：3 个测试文件、14 项通过，覆盖建筑分类元数据、starter 运行时定义、运行时放置/升级兼容和 prefab 映射。
- `vitest run`：26 个测试文件、168 项测试通过。
- `tsc -b`：类型检查通过。
- `vite build`：生产构建通过，`dist/` 产物生成。

## 2026-06-27 第十五轮验证

- `vitest run src/simulation/districts/prosperity.test.ts src/integration/GameRuntime.test.ts src/rendering/DynamicScene.test.ts`：3 个测试文件、20 项通过，覆盖街区推导、运行时快照指标和地图视觉层。
- `vitest run`：27 个测试文件、171 项测试通过。
- `tsc -b`：类型检查通过。
- `vite build`：生产构建通过，`dist/` 产物生成。

## 2026-06-27 第十六轮验证

- `vitest run src/simulation/core/SimulationEngine.test.ts src/integration/cityNotices.test.ts src/rendering/DynamicScene.test.ts`：3 个测试文件、32 项通过，覆盖候选外来人口等待、进城路径、抵达入住、小事流定位和动态场景同步。
- `vitest run`：27 个测试文件、172 项测试通过。
- `tsc -b`：类型检查通过。
- `vite build`：生产构建通过，`dist/` 产物生成。

## 2026-06-27 第十七轮验证

- `vitest run src/content/buildings.test.ts src/integration/GameRuntime.test.ts`：2 个测试文件、14 项通过，覆盖阶段菜单推导、建筑解锁判断和运行时拒绝未解锁放置。
- `tsc -b`：类型检查通过。
- `vitest run`：27 个测试文件、174 项测试通过。
- `vite build`：生产构建通过，`dist/` 产物生成。

## 2026-06-27 第十八轮验证

- `vitest run src/simulation/core/SimulationEngine.test.ts`：1 个测试文件、13 项通过，覆盖候选外来人口道路优先进城路径和原有迁入状态机。
- `tsc -b`：类型检查通过。
- `vitest run`：27 个测试文件、175 项测试通过。
- `vite build`：生产构建通过，`dist/` 产物生成。

## 2026-06-27 第十九轮验证

- `vitest run src/content/buildings.test.ts`：1 个测试文件、7 项通过，覆盖阶段目标解释和原有建筑分类/阶段解锁规则。
- `tsc -b`：类型检查通过。
- `vitest run`：27 个测试文件、176 项测试通过。
- `vite build`：生产构建通过，`dist/` 产物生成。

## 2026-06-27 第二十轮验证

- `tsc -b`：类型检查通过，覆盖主界面轻奖励入口状态和样式引用。
- `vitest run`：27 个测试文件、176 项测试通过。
- `vite build`：生产构建通过，`dist/` 产物生成。

## 2026-06-27 第二十一轮验证

- `vitest run src/game/engine.test.ts src/simulation/rewards/music.test.ts src/simulation/rewards/drops.test.ts`：3 个测试文件、23 项通过，覆盖旧群岛引擎默认不再听歌刷普通材料、legacy 兼容选项、音乐稀缺奖励和普通掉落来源。
- `tsc -b`：类型检查通过。
- `vitest run`：27 个测试文件、177 项测试通过。
- `vite build`：生产构建通过，`dist/` 产物生成。

## 2026-06-27 第二十二轮验证

- `vitest run src/game/legacy.test.ts src/game/engine.test.ts src/game/storage.test.ts`：3 个测试文件、16 项通过，覆盖旧群岛渲染开关、旧引擎兼容和旧存档迁移。
- `tsc -b`：类型检查通过。
- `vitest run`：28 个测试文件、179 项测试通过。
- `vite build`：生产构建通过，`dist/` 产物生成。

## 2026-06-27 第二十三轮验证

- `vitest run src/content/buildings.test.ts`：1 个测试文件、7 项通过，覆盖阶段目标建议和原有建筑阶段规则。
- `tsc -b`：类型检查通过。
- `vitest run`：28 个测试文件、179 项测试通过。
- `vite build`：生产构建通过，`dist/` 产物生成。

## 2026-06-27 第二十四轮验证

- `vitest run src/content/buildings.test.ts`：1 个测试文件、8 项通过，覆盖阶段目标建议、住房/吸引/街区卡点诊断和原有建筑阶段规则。
- `tsc -b`：类型检查通过。
- `vitest run`：28 个测试文件、180 项测试通过。
- `vite build`：生产构建通过，`dist/` 产物生成。

## 2026-06-27 第二十五轮验证

- `vitest run src/integration/stageAdvisor.test.ts src/content/buildings.test.ts`：2 个测试文件、10 项通过，覆盖阶段顾问地图覆盖点和原有阶段目标诊断。
- `tsc -b`：类型检查通过。
- `vitest run`：29 个测试文件、182 项测试通过。
- `vite build`：生产构建通过，`dist/` 产物生成。

## 2026-06-27 第二十六轮验证

- `vitest run src/integration/stageAdvisor.test.ts`：1 个测试文件、2 项通过，覆盖阶段覆盖点类型、短标签和去重规则。
- `tsc -b`：类型检查通过。
- `vitest run`：29 个测试文件、182 项测试通过。
- `vite build`：生产构建通过，`dist/` 产物生成。

## 2026-06-27 第二十七轮验证

- `vitest run src/integration/stageAdvisor.test.ts`：1 个测试文件、3 项通过，覆盖阶段覆盖点、分层类型和四类可切换图层。
- `tsc -b`：类型检查通过。
- `vitest run`：29 个测试文件、183 项测试通过。
- `vite build`：生产构建通过，`dist/` 产物生成。

## 2026-06-27 第二十八轮验证

- `vitest run src/integration/stageAdvisor.test.ts`：1 个测试文件、3 项通过，覆盖阶段覆盖点、图层类型和物流线路。
- `tsc -b`：类型检查通过。
- `vitest run`：29 个测试文件、183 项测试通过。
- `vite build`：生产构建通过，`dist/` 产物生成。

## 2026-06-27 第二十九轮验证

- `vitest run src/integration/stageAdvisor.test.ts`：1 个测试文件、3 项通过，覆盖阶段覆盖点、物流线路和服务范围。
- `tsc -b`：类型检查通过。
- `vitest run`：29 个测试文件、183 项测试通过。
- `vite build`：生产构建通过，`dist/` 产物生成。

## 2026-06-27 第三十轮验证

- `vitest run src/integration/stageAdvisor.test.ts`：1 个测试文件、3 项通过，覆盖阶段覆盖点、物流线路、服务范围和未覆盖住宅。
- `tsc -b`：类型检查通过。
- `vitest run`：29 个测试文件、183 项测试通过。
- `vite build`：生产构建通过，`dist/` 产物生成。

## 2026-06-28 第三十一轮验证

- `vitest run src/integration/stageAdvisor.test.ts`：1 个测试文件、3 项通过，覆盖阶段覆盖点、物流线路、服务范围、服务缺口和道路缺口分类。
- `tsc -b`：类型检查通过。
- `vitest run`：29 个测试文件、183 项测试通过。
- `vite build`：生产构建通过，`dist/` 产物生成。

## 2026-06-28 第三十二轮验证

- `vitest run src/integration/stageAdvisor.test.ts`：1 个测试文件、3 项通过，覆盖阶段覆盖点、物流线路、服务/道路缺口和物流热点。
- `tsc -b`：类型检查通过。
- `vitest run`：29 个测试文件、183 项测试通过。
- `vite build`：生产构建通过，`dist/` 产物生成。

## 2026-06-28 第三十三轮验证

- `vitest run src/integration/stageAdvisor.test.ts`：1 个测试文件、3 项通过，覆盖阶段覆盖点、四类图层摘要、服务/道路缺口和物流热点。
- `tsc -b`：类型检查通过。
- `vitest run`：29 个测试文件、183 项测试通过。
- `vite build`：生产构建通过，`dist/` 产物生成。

## 2026-06-28 第三十四轮验证

- `vitest run src/integration/stageAdvisor.test.ts`：1 个测试文件、3 项通过，覆盖阶段覆盖点、图层摘要和四类结构化指标。
- `tsc -b`：类型检查通过。
- `vitest run`：29 个测试文件、183 项测试通过。
- `vite build`：生产构建通过，`dist/` 产物生成。

## 2026-06-28 第三十五轮验证

- `vitest run src/integration/stageAdvisor.test.ts`：1 个测试文件、3 项通过，确认图层指标数据仍稳定。
- `tsc -b`：类型检查通过，覆盖阶段面板指标读数接入。
- `vitest run`：29 个测试文件、183 项测试通过。
- `vite build`：生产构建通过，`dist/` 产物生成。

## 2026-06-28 第三十六轮验证

- `vitest run src/integration/stageAdvisor.test.ts`：1 个测试文件、3 项通过，确认图层指标数据仍稳定。
- `tsc -b`：类型检查通过，覆盖阶段面板图层指标定位接入。
- `vitest run`：29 个测试文件、183 项测试通过。
- `vite build`：生产构建通过，`dist/` 产物生成。

## 压力基准

- 500 户家庭。
- 300 栋建筑。
- 150 个同时可见的居民、搬运工、货车或船只。
- 80×60 等距网格。
- 连续运行 8 个模拟小时无数值爆炸、订单死锁和存档损坏。

`src/qa/stressScenario.ts` 提供确定性压力快照。每次引擎或渲染改动都应以相同快照比较 Tick 耗时、渲染耗时、活动订单数量和内存趋势。

## 长稳文明模拟 QA

`src/qa/stressScenario.test.ts` 现在包含长稳基准：从确定性压力快照启动 `SimulationEngine + EconomySystem`，连续推进 `LONG_RUN_TICKS = 2400` tick。QA 约定该测试代表 3 个灰盒模拟日（800 tick/日），用于覆盖普通短单元测试无法发现的慢性失稳。

当前断言覆盖：

- 人口保持在 1200 到 2000 之间，避免短期内归零或无限增长。
- 平均满意度不低于 8，先保证没有数值崩塌；这不是商业级体验目标。
- 物流效率不低于 45。
- 停工建筑不超过 260。
- 活跃物流订单不超过 240。
- 历史订单总量不超过 10000。
- 单建筑库存总量不超过 1500。
- 人口、满意度、财政、库存、订单等关键数值不得出现 `NaN` 或无穷大。

这些阈值是当前系统可承受的灰盒阈值，不代表商业级目标。商业级目标应提升为：

- 至少连续 30 个模拟日稳定运行，且常规 CI 可在可接受时间内执行分层版本。
- 人口留存不低于 95%，非剧情/灾害场景不得自然归零。
- 平均满意度长期保持在 60 以上，P10 家庭满意度不低于 40。
- 物流效率长期不低于 85，活跃订单规模随城市规模线性有界。
- 停工建筑低于建筑总数的 5%，且停工原因集中在真实资源/道路/财政问题，而不是调度器饥饿。
- 库存必须受建筑容量硬约束，历史订单需要归档、压缩或分窗，不能无限积累在主快照中。

当前限制与风险：

- 2026-06-27 性能审计前，2400 tick 长稳测试本机耗时约 45.64 秒（长稳用例 44.17 秒），已经明显重于普通单元测试；7200 tick 在本机超过 90 秒仍未结束，暂不适合作为默认 Vitest 基准。
- 物流系统会保留 delivered/cancelled 历史订单，当前只能断言固定长跑窗口内不超过灰盒上限，尚不能证明无限时间有界。
- 压力场景只有 150 个可见 agent，但 500 户家庭的就业/服务需求更大；该基准能暴露拥堵和服务覆盖问题，但还不是完整商业城市人口模型。
- 当前允许较高停工建筑数和库存峰值，是为了让长稳测试先落地并持续暴露趋势；后续经济、物流和服务系统改进后应收紧阈值。

## 2026-06-27 长稳性能审计

`node --cpu-prof --cpu-prof-dir=src/qa ./node_modules/vitest/vitest.mjs run src/qa/stressScenario.test.ts` 的 worker profile 显示主要热点在物流下单阶段，而不是 Vitest 或路线规划本身：约 32k 个 CPU samples 中，`createStockOrder` 约 10.5k、`findSource` 约 7.3k、`isActive` 约 3.2k。根因是每个目的建筑/资源组合都会重复枚举 `snapshot.logisticsOrders`，并在 `findSource` 中对每个候选来源再次扫描订单；随着历史订单增长，这会把长稳测试推向重复全表扫描热点。

已做的安全优化：

- `LogisticsSystem.createOrders()` 每 tick 构建一次 active order 索引，并在本 tick 新建订单时增量更新索引。
- 索引只缓存等价聚合值：目的地+资源 inbound 数量、目的地 inbound 总容量、来源+资源 reserved 数量；不改变订单创建顺序、优先级、容量阈值或活跃订单定义。

优化后验证：

- `npm test -- src/qa/stressScenario.test.ts`：总耗时 11.56 秒，长稳用例 9.57 秒。
- `npm test -- src/simulation/economy/economy.test.ts`：24 个经济系统测试通过，总耗时 1.93 秒。

仍需继续关注：

- 历史订单仍保留在主快照中；本次优化减少 active 订单聚合的重复扫描，但没有解决 delivered/cancelled 长期归档问题。
- `assignWaitingOrders()`、`advanceCarriers()`、`updateEfficiency()` 仍会枚举订单集合；当前 2400 tick 已可接受，但更长窗口或更大城市仍需要分层 benchmark。
