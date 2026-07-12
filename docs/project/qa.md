# 验收与性能基准

## 功能链路

- 道路未连接时，住宅不能获得可达岗位，生产建筑不能创建有效运输。
- 原料必须经过生产、订单、承运、逐格移动和交付后才能进入目标库存。
- 缺工、缺料、仓满、断路和财政不足必须提供明确停工原因。
- 暂停时模拟 Tick 不增长；倍速只改变执行频率，不改变单 Tick 结果。
- 普通材料不依赖听歌；歌曲完成事件只结算稀缺材料。
- 外来人口必须先进入候选状态，再根据城市吸引力、空房和等待时长决定入住或离开，不能凭空生成正式住户。

## 2026-07-12 第一百轮验证

- TDD GREEN：`npm test -- src/ui/cityAdvisorUi.test.ts` 通过，1 个测试文件、3 项测试，覆盖道路计划摘要和物流执行计划详情文案。
- `npm run build -- --mode development`：TypeScript 与 Vite 构建通过，验证建筑详情面板接入物流计划状态。
- 全量回归：`npm test` 通过，41 个测试文件、256 项测试；长稳用例耗时约 71.20 秒。
- `npm run build`：TypeScript 与 Vite 生产构建通过，`dist/` 产物生成。
- `git diff --check`：通过。

## 2026-07-12 第一百零一轮验证

- TDD GREEN：`npm test -- src/integration/GameRuntime.test.ts src/ui/cityAdvisorUi.test.ts` 通过，2 个测试文件、26 项测试，覆盖承运重新调度运行时动作和治理 UI 文案。
- `npm run build -- --mode development`：TypeScript 与 Vite 构建通过，验证 `add-carrier-dispatch` 治理按钮接入运行时动作。
- 全量回归：`npm test` 通过，41 个测试文件、257 项测试；长稳用例耗时约 71.14 秒。
- `npm run build`：TypeScript 与 Vite 生产构建通过，`dist/` 产物生成。
- `git diff --check`：通过。

## 2026-07-10 第九十六轮验证

- TDD RED：`npx vitest run src/integration/stageAdvisor.test.ts -t "recommends a specific logistics fix"` 先失败；5 类物流分因治理卡均缺少 `recommendation.logisticsPlan`，证明上一轮仍主要停留在文案和工具入口。
- TDD GREEN：`StageGovernanceRecommendation` 新增 `logisticsPlan`，覆盖缺车、断路、仓满、缺货源和卸货排队五类计划；同一目标测试通过，1 个测试文件、5 项测试。
- 目标回归：`npx vitest run src/integration/stageAdvisor.test.ts src/qa/logisticsHotspotScenarios.test.ts src/qa/browserE2eScenarios.test.ts` 通过，3 个测试文件、25 项测试。
- 全量回归：`npm test` 通过，41 个测试文件、254 项测试；长稳用例耗时约 36.56 秒。
- `npm run build`：TypeScript 与 Vite 生产构建通过，`dist/` 产物生成。
- `git diff --check`：通过。

限制：结构化计划只是把治理建议变成可消费数据，并在 UI 中展示摘要；它还没有全部接入一键执行。下一步需要把 `logisticsPlan` 驱动到来源/目的地定位、道路计划生成、补仓储候选和承运调度入口。

## 2026-07-10 第九十五轮验证

- TDD RED：给 `civilizationLongRunCheck.ts` 增加主长跑最终 `unloadBacklog >= 1` 后，`npm run qa:civilization-long-run` 失败于 `final unload backlog: expected >= 1, got 0`，证明第九十四轮仍只是探针有物流积压，主 7200 城市没有。
- 失败尝试：曾尝试把食肆改成多输入生产建筑并压低全局卸货能力，但 `npm run qa:civilization-long-run` 失败于 `satisfaction @4800: expected >= 8, got 5.113...`；该方案会破坏居民服务稳定性，已撤回。
- TDD GREEN：`EconomySystem` 透传 `unloadCapacityPerTick`，`runCivilizationLongRunScenario` 新增 `LongRunLogisticsPressureSystem`，每 120 tick 注入两条真实在途订单和货车，由正式 `LogisticsSystem` 形成卸货积压，并清理完成后的压力货车。
- 7200 tick QA：`npm run qa:civilization-long-run` 通过；主长跑最终 tick 7200、人口 1750、满意度约 40.39、物流效率约 99.996、服务队列 43、排队家庭 736、物流队列 2、卸货积压 2、最长卸货等待 1 tick、agent 表 208、订单表 541、非法数值 0。
- 目标回归：`npx vitest run src/qa/civilizationLongRun.test.ts` 通过，1 个测试文件、2 项测试。
- 全量回归：`npm test` 通过，41 个测试文件、254 项测试；长稳用例耗时约 38.18 秒。
- `npm run build`：TypeScript 与 Vite 生产构建通过，`dist/` 产物生成。
- `git diff --check`：通过。

限制：主长跑现在能稳定观测卸货积压，但压力来源仍是 QA 负载生成器，不是完整产业链自然演化。商业级后续必须让卸货能力和拥堵由建筑等级、工人、入口、道路容量、港口/车船类型共同决定。

## 2026-07-04 第九十四轮验证

- TDD RED：`npx vitest run src/qa/civilizationLongRun.test.ts` 先失败；原因是 `summarizeCivilizationLongRunLayer` 未导出，且长跑层摘要没有 `queuePressure` 字段。
- TDD GREEN：`CivilizationLongRunLayerSummary` 新增 `queuePressure`，汇总服务队列数量、排队家庭、最长服务等待、物流队列数量、卸货积压和最长卸货等待；同一测试 1 个文件、1 项通过。
- 叠层 RED：给 `civilizationLongRunCheck.ts` 增加最终卸货积压门禁后，`npm run qa:civilization-long-run` 失败于 `final unload backlog: expected >= 1, got 0`，证明当前 7200 主长跑没有自然形成卸货排队。
- TDD GREEN：新增 `runCivilizationQueuePressureProbe`，用真实 `LogisticsSystem` 构造两个在途订单同 tick 抵达同一目的建筑、卸货能力为 1 的确定性探针；`npx vitest run src/qa/civilizationLongRun.test.ts`：1 个测试文件、2 项通过。
- 7200 tick QA：`npm run qa:civilization-long-run` 通过；主长跑最终 tick 7200、人口 1750、满意度约 40.39、服务队列 43、排队家庭 644、最长服务等待 1 tick、主长跑物流卸货积压 0；探针物流队列 1、卸货积压 1、最长卸货等待 3 tick。
- 全量回归：`npm test` 通过，41 个测试文件、254 项测试；长稳用例耗时约 38.10 秒。
- `npm run build`：TypeScript 与 Vite 生产构建通过，`dist/` 产物生成。
- `git diff --check`：通过。

限制：本轮解决的是“长跑报告能看见队列压力”和“QA 命令能验证卸货吞吐模型”，但主 7200 城市仍没有自然产生物流卸货积压。下一步必须把多资源/多订单/目的地集中度纳入长跑主场景，而不是长期依赖探针。

## 2026-07-04 第九十三轮验证

- TDD RED：`npx vitest run src/simulation/economy/constructionTable.test.ts src/simulation/economy/upgrades.test.ts` 先失败；原因是 `DEFAULT_CONSTRUCTION_ECONOMY_TABLE` 缺少 `upgradeCosts`，`construction.ts` 未导出统一的 `buildingUpgradeCost`，非法升级参数未被校验，且自定义经济表不能影响排队升级扣料。
- TDD GREEN：新增 `ConstructionEconomyTable.upgradeCosts`、统一导出的 `buildingUpgradeCost`，并让 `buildingUpgradeCost`、`upgradeBuildingFromCityStorage` 和 `startBuildingUpgradeFromCityStorage` 支持传入自定义经济表。
- 兼容验证：默认升级曲线保持旧行为；例如 3 级建筑升 4 级仍消耗木料 4、石料 2。
- 目标回归：`npx vitest run src/simulation/economy/constructionTable.test.ts src/simulation/economy/upgrades.test.ts`：2 个测试文件、16 项通过。
- 集成回归：`npx vitest run src/integration/GameRuntime.test.ts src/simulation/economy/economy.test.ts src/simulation/economy/constructionTable.test.ts src/simulation/economy/upgrades.test.ts`：4 个测试文件、70 项通过。
- 构建修正：首次全量门禁中 `npm test` 已通过 40 个测试文件、252 项测试，但 `npm run build` 暴露 `simulation/economy` 聚合出口中两个 `buildingUpgradeCost` 重名；已将低层经济表函数在聚合出口中别名为 `constructionTableBuildingUpgradeCost`，保留高层升级报价函数名供运行时使用。
- 全量回归：`npm test` 通过，40 个测试文件、252 项测试；长稳用例耗时约 37.00 秒。
- `npm run build`：TypeScript 与 Vite 生产构建通过，`dist/` 产物生成。
- `git diff --check`：通过。

限制：升级成本只是进入统一经济表，仍是统一等级倍数；还不是商业级平衡。后续必须继续拆成按建筑类别、文明阶段、产能、服务容量和投资回收周期分层的成本曲线。

## 2026-07-03 第八十九轮验证

- TDD RED：`npx vitest run src/simulation/economy/constructionTable.test.ts` 先失败；原因是 `validateConstructionEconomyTable` 不存在，且自定义道路经济表没有影响桥梁报价。
- TDD GREEN：新增 `ConstructionEconomyTable`、`DEFAULT_CONSTRUCTION_ECONOMY_TABLE`、`validateConstructionEconomyTable`，并让建筑/道路报价函数支持传入自定义经济表。
- 兼容验证：默认市场仍为银两 180、木料×4、石料×2；默认道路仍为泥路 2、石板路 6、桥路 18。
- 目标回归：`npx vitest run src/simulation/economy/constructionTable.test.ts src/content/buildings.test.ts src/integration/GameRuntime.test.ts src/qa/serviceGovernanceScenarios.test.ts`：4 个测试文件、35 项通过。
- 全量回归：`npm test`：40 个测试文件、244 项测试通过，其中 2400 tick 多日文明稳定性测试耗时约 52.7 秒。
- `npm run build`：TypeScript 与 Vite 生产构建通过，`dist/` 产物生成。
- `git diff --check`：通过。

限制：经济表只是可调化，尚未把升级成本、服务容量、排队、仓储吞吐和道路维护纳入统一平衡。

## 2026-07-03 第八十八轮验证

- TDD RED：`npx vite-node src/qa/civilizationLongRunCheck.ts` 先失败，原因是 `src/qa/civilizationLongRun.ts` 不存在；此前曾尝试 `.longrun.ts` 由 Vitest 运行，但失败点是文件名不被默认 include 捕获，已改为独立 `vite-node` QA 检查脚本。
- TDD GREEN：新增 `runCivilizationLongRunScenario`、7200 tick 常量、2400/4800/7200 分层采样和主快照规模阈值检查。
- 新增固定 QA 命令：`npm run qa:civilization-long-run`。
- 7200 tick 长跑实测通过：最终 tick 7200、人口 1750、满意度约 40.39、物流效率 100、停工建筑 161、活跃订单 39、主订单表 539、归档订单 53462、最大建筑库存 855、非法数值 0。
- 分层快照规模有界：2400/4800/7200 tick 的 households 500、buildings 300、agents 206、logisticsOrders 539、worldDrops 0，未随归档订单增长。
- 目标回归：`npm run qa:civilization-long-run && npx vitest run src/qa/stressScenario.test.ts` 通过；现有 2400 tick 长稳测试 1 个文件、2 项通过。
- 全量回归：`npm test`：39 个测试文件、241 项测试通过，其中 2400 tick 多日文明稳定性测试耗时约 53.2 秒。
- `npm run build`：TypeScript 与 Vite 生产构建通过，`dist/` 产物生成。
- `git diff --check`：通过。

限制：长跑仍是灰盒压力城市，不等于完整商业关卡容量/排队/道路拥堵压力。

## 2026-07-03 第八十七轮验证

- TDD RED：`npx vitest run src/qa/browserE2eScenarios.test.ts` 先失败，原因是 `logistics-hotspot` 没有 interaction 元数据。
- TDD GREEN：为 `logistics-hotspot` 增加 interaction，点击“打开物流图层并补仓储”后等待“物流热点拥堵：打开物流图层并补仓储。”。
- 单场景真实浏览器 E2E：`BROWSER_E2E_SCENARIO=logistics-hotspot npm run qa:browser-e2e` 通过，确认物流热点推荐动作实际触发 toast。
- 完整真实浏览器 E2E：`npm run qa:browser-e2e` 运行 5 个场景，5/5 通过；road-plan-success、road-plan-low-treasury、bridge-gap、logistics-hotspot 与 service-governance 均执行真实点击。
- 目标回归：`npm run qa:browser-e2e:contract && npx vitest run src/qa/browserE2eScenarios.test.ts src/ui/runtimeOptions.test.ts src/qa/roadPlanScenarios.test.ts src/qa/bridgeGapScenarios.test.ts src/qa/logisticsHotspotScenarios.test.ts src/qa/serviceGovernanceScenarios.test.ts`：6 个测试文件、13 项通过。
- 全量回归：`npm test`：39 个测试文件、241 项测试通过，其中 2400 tick 多日文明稳定性测试耗时约 50.7 秒。
- `npm run build`：TypeScript 与 Vite 生产构建通过，`dist/` 产物生成。
- `git diff --check`：通过。

限制：物流热点真实点击只证明推荐动作进入建造/图层流程，不证明仓储容量、排队和道路容量模型完整。

## 2026-07-03 第八十六轮验证

- TDD RED：`npx vitest run src/qa/browserE2eScenarios.test.ts` 先失败，原因是 `bridge-gap` 没有 interaction 元数据。
- TDD GREEN：为 `bridge-gap` 增加 interaction，点击“打开道路图层并接回主路网”后等待“道路未连通：补线施工完成：桥梁 2 格，花费银两36。”。
- 单场景真实浏览器 E2E：`BROWSER_E2E_SCENARIO=bridge-gap npm run qa:browser-e2e` 通过，确认桥梁缺口推荐动作实际执行补桥并触发 toast。
- 完整真实浏览器 E2E：`npm run qa:browser-e2e` 运行 5 个场景，5/5 通过；road-plan-success、road-plan-low-treasury、bridge-gap 与 service-governance 均执行真实点击，logistics-hotspot 仍完成可见文案和 console error 检查。
- 目标回归：`npm run qa:browser-e2e:contract && npx vitest run src/qa/browserE2eScenarios.test.ts src/ui/runtimeOptions.test.ts src/qa/roadPlanScenarios.test.ts src/qa/bridgeGapScenarios.test.ts src/qa/logisticsHotspotScenarios.test.ts src/qa/serviceGovernanceScenarios.test.ts`：6 个测试文件、13 项通过。
- 全量回归：`npm test`：39 个测试文件、241 项测试通过，其中 2400 tick 多日文明稳定性测试耗时约 51.6 秒。
- `npm run build`：TypeScript 与 Vite 生产构建通过，`dist/` 产物生成。
- `git diff --check`：通过。

限制：物流热点还没有真实点击/定位动作断言。

## 2026-07-03 第八十五轮验证

- TDD RED：`npx vitest run src/qa/browserE2eScenarios.test.ts` 先失败，原因是 `service-governance` 没有 interaction 元数据。
- TDD GREEN：为 `service-governance` 增加 interaction，点击“打开服务图层并营造市场”后等待“服务覆盖缺口：打开服务图层并营造市场。”。
- 单场景真实浏览器 E2E：`BROWSER_E2E_SCENARIO=service-governance npm run qa:browser-e2e` 通过，确认服务治理推荐动作实际触发 toast。
- 完整真实浏览器 E2E：`npm run qa:browser-e2e` 运行 5 个场景，5/5 通过；road-plan-success、road-plan-low-treasury 与 service-governance 均执行真实点击，bridge-gap 与 logistics-hotspot 仍完成可见文案和 console error 检查。
- 目标回归：`npm run qa:browser-e2e:contract && npx vitest run src/qa/browserE2eScenarios.test.ts src/ui/runtimeOptions.test.ts src/qa/roadPlanScenarios.test.ts src/qa/bridgeGapScenarios.test.ts src/qa/logisticsHotspotScenarios.test.ts src/qa/serviceGovernanceScenarios.test.ts`：6 个测试文件、13 项通过。
- 全量回归：`npm test`：39 个测试文件、241 项测试通过，其中 2400 tick 多日文明稳定性测试耗时约 50.1 秒。
- `npm run build`：TypeScript 与 Vite 生产构建通过，`dist/` 产物生成。
- `git diff --check`：通过。

限制：桥梁缺口和物流热点还没有真实点击/定位动作断言。

## 2026-07-01 第八十四轮验证

- TDD RED：`npx vitest run src/qa/browserE2eScenarios.test.ts` 先失败，原因是 `road-plan-low-treasury` 没有 interaction 元数据。
- TDD GREEN：为 `road-plan-low-treasury` 增加 interaction，点击“打开道路图层并接回主路网”后等待“银两不足2，无法执行补线施工”。
- 单场景真实浏览器 E2E：`BROWSER_E2E_SCENARIO=road-plan-low-treasury npm run qa:browser-e2e` 通过，确认失败路径点击动作实际触发 toast。
- 完整真实浏览器 E2E：`npm run qa:browser-e2e` 运行 5 个场景，5/5 通过；road-plan-success 与 road-plan-low-treasury 均执行真实点击，其他场景完成可见文案和 console error 检查。
- 目标回归：`npm run qa:browser-e2e:contract && npx vitest run src/qa/browserE2eScenarios.test.ts src/ui/runtimeOptions.test.ts src/qa/roadPlanScenarios.test.ts src/qa/bridgeGapScenarios.test.ts src/qa/logisticsHotspotScenarios.test.ts src/qa/serviceGovernanceScenarios.test.ts`：6 个测试文件、13 项通过。
- 全量回归：`npm test`：39 个测试文件、241 项测试通过，其中 2400 tick 多日文明稳定性测试耗时约 49.4 秒。
- `npm run build`：TypeScript 与 Vite 生产构建通过，`dist/` 产物生成。
- `git diff --check`：通过。

限制：服务治理、桥梁缺口和物流热点还没有真实点击/定位动作断言。

## 2026-07-01 第八十三轮验证

- TDD RED：`npx vitest run src/qa/browserE2eScenarios.test.ts` 先失败，原因是浏览器 E2E 场景没有任何真实点击 interaction。
- TDD GREEN：为 `road-plan-success` 增加 interaction，点击“打开道路图层并接回主路网”后等待“补线施工完成”；同时修复 contract runner 输出 interaction 元数据。
- 新增固定 QA 命令：`npm run qa:browser-e2e`，实际构建生产包、启动 Vite preview、用 Playwright Chromium 打开浏览器并执行场景。
- 真实浏览器 E2E：`npm run qa:browser-e2e` 运行 5 个场景，5/5 通过；road-plan-success 完成真实点击，其他场景完成可见文案和 console error 检查。
- 单场景验证：`BROWSER_E2E_SCENARIO=road-plan-success npm run qa:browser-e2e` 通过，确认点击动作实际触发 toast。
- 目标回归：`npm run qa:browser-e2e:contract && npx vitest run src/qa/browserE2eScenarios.test.ts src/ui/runtimeOptions.test.ts src/qa/roadPlanScenarios.test.ts src/qa/bridgeGapScenarios.test.ts src/qa/logisticsHotspotScenarios.test.ts src/qa/serviceGovernanceScenarios.test.ts`：6 个测试文件、13 项通过。
- `npm run build`：TypeScript 与 Vite 生产构建通过，`dist/` 产物生成。
- `npm test`：39 个测试文件、241 项通过；其中 `src/qa/stressScenario.test.ts` 长稳用例通过，耗时约 48.04 秒，总耗时约 52.42 秒。

限制：真实 E2E 依赖本机 Playwright Chromium，另一台电脑首次运行需执行 `npx playwright install chromium`。当前只有 road-plan-success 有点击动作，其他场景仍需补交互断言。

## 2026-07-01 第八十二轮验证

- TDD RED：`npx vitest run src/qa/browserE2eScenarios.test.ts` 先失败，原因是 `src/qa/browserE2eScenarios.ts` 不存在。
- TDD GREEN：新增浏览器 E2E 场景契约后，同一测试通过；固定 5 个场景的 URL、可见文案和 console error 门禁。
- 新增固定 QA 命令：`npm run qa:browser-e2e:contract`，实际运行 1 个测试文件、2 项通过，并输出 5 个浏览器场景的 JSON 契约。
- 目标回归：`npm run qa:browser-e2e:contract && npx vitest run src/qa/browserE2eScenarios.test.ts src/ui/runtimeOptions.test.ts src/qa/roadPlanScenarios.test.ts src/qa/bridgeGapScenarios.test.ts src/qa/logisticsHotspotScenarios.test.ts src/qa/serviceGovernanceScenarios.test.ts`：6 个测试文件、11 项通过。
- `npm run build`：TypeScript 与 Vite 生产构建通过，`dist/` 产物生成。
- `npm test`：39 个测试文件、239 项通过；其中 `src/qa/stressScenario.test.ts` 长稳用例通过，耗时约 48.55 秒，总耗时约 52.90 秒。

限制：本轮只是浏览器 E2E 契约，不是实际浏览器驱动执行器；它不能证明 DOM 真的渲染了这些文案，也不能捕获真实 console error。

## 2026-07-01 第八十一轮验证

- TDD RED：`npx vitest run src/qa/logisticsHotspotScenarios.test.ts` 先失败，原因是 `src/qa/logisticsHotspotScenarios.ts` 不存在。
- TDD GREEN 前暴露真实问题：物流调试订单若在预热前注入，会被 45 tick 启动预热全部送达；修复为预热后注入并重建运行时引擎。
- TDD GREEN 前暴露治理质量问题：源仓和市场同为 3 条订单热点时，原排序按 id 偶然定位源仓；修复为同等压力下优先定位入货端。
- 新增固定 QA 命令：`npm run qa:logistics-hotspots`，实际运行 1 个测试文件、1 项通过。
- 目标回归：`npx vitest run src/qa/logisticsHotspotScenarios.test.ts src/qa/bridgeGapScenarios.test.ts src/qa/roadPlanScenarios.test.ts src/qa/serviceGovernanceScenarios.test.ts src/integration/stageAdvisor.test.ts src/integration/GameRuntime.test.ts src/ui/runtimeOptions.test.ts`：7 个测试文件、46 项通过。
- `npm run build`：TypeScript 与 Vite 生产构建通过，`dist/` 产物生成。
- `npm test`：38 个测试文件、237 项通过；其中 `src/qa/stressScenario.test.ts` 长稳用例通过，耗时约 46.31 秒，总耗时约 50.48 秒。

限制：物流热点仍只是治理卡/图层诊断，不等于完整仓储容量、货车排队和道路容量模型。

## 2026-07-01 第八十轮验证

- TDD RED：`npx vitest run src/qa/bridgeGapScenarios.test.ts` 先失败，原因是 `src/qa/bridgeGapScenarios.ts` 不存在。
- TDD GREEN：新增 `bridge-gap` 场景与 `npm run qa:bridge-gaps` 后，固定验证水面断点产生 2 格桥梁 roadPlan、施工花费 36 银两、施工后孤立路网下降。
- URL 调试入口：`runtimeOptionsFromSearch('?debugScenario=bridge-gap')` 有独立测试覆盖，避免桥梁场景只存在于运行时无法浏览器打开。
- 目标回归：`npm run qa:bridge-gaps && npx vitest run src/qa/bridgeGapScenarios.test.ts src/qa/roadPlanScenarios.test.ts src/ui/runtimeOptions.test.ts src/integration/GameRuntime.test.ts src/integration/stageAdvisor.test.ts`：5 个测试文件、43 项通过。
- `npm run build`：TypeScript 与 Vite 生产构建通过，`dist/` 产物生成。
- `npm test`：37 个测试文件、235 项通过；其中 `src/qa/stressScenario.test.ts` 长稳用例通过，耗时约 45.77 秒，总耗时约 51.76 秒。

限制：本轮是运行时/治理 QA 命令，不是浏览器脚本化 E2E；桥头吸附、桥梁施工动画和正式桥梁资产仍未完成。

## 2026-07-01 第七十九轮验证

- TDD RED：`npx vitest run src/qa/serviceGovernanceScenarios.test.ts` 先失败，原因是 `src/qa/serviceGovernanceScenarios.ts` 不存在。
- TDD GREEN 前暴露真实问题：服务推荐市场可建但建完没有降低服务缺口；修复 `stageAdvisor` 后，同一测试通过。
- 新增固定 QA 命令：`npm run qa:service-governance`，实际运行 1 个测试文件、1 项通过。
- 目标回归：`npx vitest run src/qa/serviceGovernanceScenarios.test.ts src/qa/roadPlanScenarios.test.ts src/integration/stageAdvisor.test.ts src/integration/GameRuntime.test.ts`：4 个测试文件、39 项通过。
- `npm run build`：TypeScript 与 Vite 生产构建通过，`dist/` 产物生成。
- `npm test`：36 个测试文件、233 项通过；其中 `src/qa/stressScenario.test.ts` 长稳用例通过，耗时约 47.46 秒，总耗时约 51.59 秒。

限制：服务治理已有运行时 QA 命令，但尚未补浏览器驱动 E2E；下一步仍需要物流拥堵、桥梁缺口和浏览器脚本化。

## 2026-07-01 第七十八轮验证

- TDD RED：`npx vitest run src/qa/roadPlanScenarios.test.ts` 先失败，原因是 `src/qa/roadPlanScenarios.ts` 还不存在。
- TDD GREEN：同一测试通过；覆盖 `isolated-road-network` 成功施工场景和 `isolated-road-network-low-treasury` 财政不足失败场景的 before/action/after 摘要。
- 新增固定 QA 命令：`npm run qa:road-plans`，实际运行 1 个测试文件、1 项通过。
- 目标回归：`npx vitest run src/qa/roadPlanScenarios.test.ts src/integration/GameRuntime.test.ts src/integration/stageAdvisor.test.ts src/ui/runtimeOptions.test.ts`：4 个测试文件、41 项通过。
- `npm run build`：TypeScript 与 Vite 生产构建通过，`dist/` 产物生成。
- `npm test`：35 个测试文件、232 项通过；其中 `src/qa/stressScenario.test.ts` 长稳用例通过，耗时约 45.69 秒，总耗时约 50.05 秒。

限制：`qa:road-plans` 是运行时/治理链路场景命令，不是完整浏览器驱动脚本；它补齐可重复 QA 入口，但不能替代后续浏览器 E2E 自动化。

## 2026-07-01 第七十七轮验证

- TDD RED：`npx vitest run src/integration/GameRuntime.test.ts src/ui/runtimeOptions.test.ts -t "low treasury|runtime URL|debug scenario"` 先失败，原因是低财政调试场景未被识别，财政仍为默认 2400，URL 参数也被忽略。
- TDD GREEN：同一目标测试通过；`isolated-road-network-low-treasury` 生成不可支付 roadPlan，`treasuryCost: 6`、`missingTreasury: 2`、`canAfford: false`，执行补线失败且财政保持 4。
- 目标回归：`npx vitest run src/integration/GameRuntime.test.ts src/integration/stageAdvisor.test.ts src/ui/runtimeOptions.test.ts src/ui/cityAdvisorUi.test.ts src/integration/cityNotices.test.ts`：5 个测试文件、51 项通过。
- `npm run build`：TypeScript 与 Vite 生产构建通过，`dist/` 产物生成。
- `npm test`：34 个测试文件、231 项通过；其中 `src/qa/stressScenario.test.ts` 长稳用例通过，耗时约 46.31 秒，总耗时约 50.78 秒。
- 浏览器 E2E：`http://localhost:5173/?debugScenario=isolated-road-network-low-treasury` 横屏打开后，瓶颈面板出现“补线计划：道路 1 格，预计银两 6，还缺银两 2”；点击推荐后 toast 显示“银两不足2，无法执行补线施工”，财政仍为 4，补线 overlay 保留，console error 为 0。

限制：低财政 E2E 已覆盖失败路径，但浏览器步骤仍未脚本化；下一轮要把成功/失败两个场景固化为可重复命令。

## 2026-07-01 第七十六轮验证

- TDD RED：`npx vitest run src/integration/GameRuntime.test.ts -t "debug scenario"` 先失败，原因是 `debugScenario: "isolated-road-network"` 还不能稳定生成带 `roadPlan` 的道路未连通治理卡。
- TDD RED：`npx vitest run src/ui/runtimeOptions.test.ts` 先失败，原因是 URL 参数解析模块不存在。
- TDD GREEN：目标测试通过；调试场景会生成 roadPlan，执行后道路图层的 `disconnectedEntrances` 与 `isolatedRoadNetworks` 均下降。
- 目标回归：`npx vitest run src/integration/GameRuntime.test.ts src/integration/stageAdvisor.test.ts src/ui/runtimeOptions.test.ts src/ui/cityAdvisorUi.test.ts src/integration/cityNotices.test.ts`：5 个测试文件、49 项通过。
- `npm run build`：TypeScript 与 Vite 生产构建通过，`dist/` 产物生成。
- `npm test`：34 个测试文件、229 项通过；其中 `src/qa/stressScenario.test.ts` 长稳用例通过，耗时约 49.20 秒，总耗时约 54.21 秒。
- 浏览器 E2E：`http://localhost:5173/?debugScenario=isolated-road-network` 横屏打开后，瓶颈面板出现“道路未连通”和“补线计划：道路 1 格，预计银两 6，可直接施工”；点击推荐后 toast 显示“补线施工完成”，财政下降，过期“补线 1 格”overlay 摘要消失，console error 为 0。

限制：浏览器步骤目前仍由本轮手动自动化代码执行，没有沉淀成可复用脚本；下一轮应把调试场景与浏览器验证步骤脚本化。

## 2026-07-01 第七十五轮验证

- TDD RED：`npx vitest run src/integration/GameRuntime.test.ts -t "mixed road plan"` 先失败，原因是 `runtime.buildRoadPlan` 不存在。
- TDD GREEN：同一目标测试通过；覆盖混合 roadPlan 中 1 格石板路、2 格桥梁在 40 银两下只完成 1 路 1 桥，花费 24、跳过 1、缺口 2，且真实地图道路状态正确更新。
- 目标回归：`npx vitest run src/integration/GameRuntime.test.ts src/integration/stageAdvisor.test.ts src/ui/cityAdvisorUi.test.ts`：3 个测试文件、37 项通过。
- `npm run build`：TypeScript 与 Vite 生产构建通过，`dist/` 产物生成。
- `npm test`：33 个测试文件、226 项通过；其中 `src/qa/stressScenario.test.ts` 长稳用例通过，耗时约 46.13 秒，总耗时约 50.45 秒。
- 浏览器 QA：`http://localhost:5173/` 横屏打开正常，瓶颈面板可展开，console error 日志为 0。

限制：默认浏览器场景仍没有稳定制造孤立路网，因此 UI 的真实 roadPlan 一键施工点击尚未 E2E 覆盖；下一轮必须补可控孤立路网调试 fixture。

## 2026-07-01 第七十四轮验证

- TDD RED：`npx vitest run src/ui/cityAdvisorUi.test.ts src/integration/stageAdvisor.test.ts -t "road plan|construction plans|treasury gaps"` 先失败；原因分别是 `cityAdvisorUi` 模块不存在，以及 `withRecommendationExecutionOverlay` 遇到 `roadPlan` 时返回 `undefined`。
- TDD GREEN：同一目标测试通过；覆盖治理卡文案能显示桥梁/道路格数、预计银两和财政缺口，并覆盖 roadPlan 注入 overlay cells，桥梁格使用独立 `bridge` 状态。
- 目标回归：`npx vitest run src/ui/cityAdvisorUi.test.ts src/integration/stageAdvisor.test.ts src/integration/cityNotices.test.ts src/integration/GameRuntime.test.ts`：4 个测试文件、45 项通过。
- `npm run build`：TypeScript 与 Vite 生产构建通过，`dist/` 产物生成。
- `npm test`：33 个测试文件、225 项通过；其中 `src/qa/stressScenario.test.ts` 长稳用例通过，耗时约 45.88 秒，总耗时约 50.01 秒。
- 浏览器 QA：`http://localhost:5173/` 横屏刷新后打开瓶颈面板，页面出现“优先处理最影响运转的 3 件事”和 3 条瓶颈治理卡；console error 日志为 0。

限制：默认浏览器场景没有稳定制造孤立路网，因此补线计划 UI 的精确出现由单元测试覆盖；下一轮需要可控孤立路网 fixture 或一键施工 E2E。

## 2026-07-01 第七十三轮验证

- TDD RED：`npx vitest run src/integration/stageAdvisor.test.ts -t "disconnected road networks"` 先失败，原因是“道路未连通”治理卡只有补线文案和图层推荐，没有 `roadPlan` 施工格序列与成本预览。
- TDD GREEN：同一目标测试通过；隔水孤立路网到主路网的补线计划输出 2 个桥梁格、总成本 36、财政缺口 0、`canAfford: true`，并保留起点/终点。
- 目标回归：`npx vitest run src/integration/stageAdvisor.test.ts src/integration/cityNotices.test.ts src/integration/GameRuntime.test.ts`：3 个测试文件、42 项通过。
- `npm test`：32 个测试文件、222 项通过；其中 `src/qa/stressScenario.test.ts` 长稳用例通过，耗时约 45.98 秒，总耗时约 50.22 秒。
- `npm run build`：TypeScript 与 Vite 生产构建通过，`dist/` 产物生成。
- 浏览器 QA：`http://localhost:5173/` 横屏打开正常，阶段面板“道路”图层按钮存在且可点击；点击后页面出现“道路连通”和“道路点 56”读数，说明真实页面没有被新增推荐数据破坏。

限制：本轮浏览器环境没有拿到整页截图和 console hook，因此浏览器 QA 只算 DOM/交互级冒烟；`roadPlan` 精确内容由 `stageAdvisor` 单元测试覆盖。下一轮必须把 `roadPlan` 接入治理卡 UI，并补可控孤立路网 E2E fixture。

## 2026-07-01 第七十二轮验证

- TDD RED：`npx vitest run src/integration/stageAdvisor.test.ts -t "isolated roads|not connected"` 先失败，原因是道路图层能识别未连通入口和孤立路网，但没有输出建议补线 `paths` 或 `suggestedRoadLinks` 指标。
- TDD GREEN：同一目标测试通过；覆盖孤立路网和主路网之间隔水时，输出 `paths: [{ kind: "road", label: "建议补桥", from: {x:1,y:1}, to: {x:4,y:1} }]`，并记录 `suggestedRoadLinks: 1`。
- 目标回归：`npx vitest run src/integration/stageAdvisor.test.ts src/integration/cityNotices.test.ts src/components/SimulationCanvas.test.ts` 实际运行现有匹配文件 2 个、23 项通过；当前仓库没有 `SimulationCanvas.test.ts`。
- `npm test`：32 个测试文件、222 项通过；其中 `src/qa/stressScenario.test.ts` 长稳用例通过，耗时约 44.87 秒，总耗时约 49.12 秒。
- `npm run build`：TypeScript 与 Vite 生产构建通过，`dist/` 产物生成。
- 浏览器 QA：`http://localhost:5173/` 横屏打开正常，标题为《小耳岛》，页面非空，无 Vite 报错覆盖层，console 无 error/warn。点击阶段面板“道路”图层后按钮 active，页面出现“道路连通”和“道路点”读数。

限制：浏览器默认场景没有稳定制造孤立路网，因此浏览器层验证道路图层入口和 overlay 交互健康；建议补桥路径的精确输出由 `stageAdvisor` 单元测试覆盖。后续需要可控 E2E fixture 或调试场景。

## 2026-06-30 第七十一轮验证

- TDD RED：`npx vitest run src/integration/stageAdvisor.test.ts -t "disconnected road networks"` 先失败，原因是未连通入口/孤立路网存在时，首张治理卡仍是普通 `governance-road-gaps`，没有生成“道路未连通”卡。
- TDD GREEN：同一目标测试通过；新增 `governance-road-disconnected`，覆盖未连通入口和孤立路网会生成高优先级治理卡、目标点指向 `未连通住宅`、推荐动作打开道路图层并接回主路网。
- 目标回归：`npx vitest run src/integration/stageAdvisor.test.ts src/integration/cityNotices.test.ts`：2 个测试文件、23 项通过。
- `npm test`：32 个测试文件、222 项通过；其中 `src/qa/stressScenario.test.ts` 长稳用例通过，耗时约 51.20 秒，总耗时约 55.53 秒。
- `npm run build`：TypeScript 与 Vite 生产构建通过，`dist/` 产物生成。
- 浏览器 QA：`http://localhost:5173/` 横屏打开正常，瓶颈面板可展开，道路图层可 active，页面显示“道路连通/道路点”读数，console 无 error/warn。

限制：浏览器默认场景没有稳定制造未连通路网，因此浏览器层验证治理面板和道路图层交互健康；未连通卡精确排序与文案由 `stageAdvisor` 单元测试覆盖。后续需要可控调试场景或 E2E fixture。

## 2026-06-30 第七十轮验证

- TDD RED：`npx vitest run src/integration/stageAdvisor.test.ts -t "isolated roads|not connected"` 先失败，原因是道路图层只输出 `道路点/缺路`，没有识别建筑入口贴着孤立路网但未连到主路网。
- TDD GREEN：同一目标测试通过；新增道路连通分量诊断，覆盖右侧主路网被水面断开、住宅入口贴着左侧孤立道路时，输出 `未连通住宅`、`disconnectedEntrances: 1` 和 `isolatedRoadNetworks: 1`。
- 目标回归：`npx vitest run src/integration/stageAdvisor.test.ts src/integration/GameRuntime.test.ts`：2 个测试文件、32 项通过。
- `npm test`：32 个测试文件、221 项通过；其中 `src/qa/stressScenario.test.ts` 长稳用例通过，耗时约 52.32 秒，总耗时约 57.26 秒。
- `npm run build`：TypeScript 与 Vite 生产构建通过，`dist/` 产物生成。
- 浏览器 QA：`http://localhost:5173/` 横屏打开正常，标题为《小耳岛》，页面非空，无 Vite 报错覆盖层，console 无 error/warn。点击阶段面板“道路”图层后按钮 active，页面出现“道路连通”和“道路点”读数，地图显示道路标记。

限制：浏览器当前默认场景没有稳定制造“孤立路网”状态，因此浏览器层验证道路图层入口和读数渲染；孤立路网/未连通入口的精确判断由 `stageAdvisor` 单元测试覆盖。后续应增加可控 E2E 调试场景或测试钩子。

## 2026-06-30 第六十九轮验证

- TDD RED：`npx vitest run src/rendering/roads.test.ts` 先失败，原因是 `src/rendering/roads.ts` 尚不存在，桥梁视觉没有独立样式入口。
- TDD GREEN：新增 `roadVisualStyle` 后，目标测试通过；覆盖桥梁样式输出 `kind: "bridge"`、专属填色/描边/桥墩色/桥面宽度，并确认桥梁样式不同于普通石板路。
- 目标测试：`npx vitest run src/rendering/roads.test.ts src/integration/GameRuntime.test.ts -t "bridge|bridges|roadVisualStyle"`：2 个测试文件、3 项通过，17 项按过滤跳过。
- `npm test`：32 个测试文件、220 项通过；其中 `src/qa/stressScenario.test.ts` 长稳用例通过，耗时约 45.17 秒，总耗时约 49.30 秒。
- `npm run build`：TypeScript 与 Vite 生产构建通过，`dist/` 产物生成。
- 浏览器 QA：`http://localhost:5173/` 横屏打开正常，标题为《小耳岛》，页面非空，无 Vite 报错覆盖层，console 无 error/warn。城建面板出现“桥梁 银两18/格”；点击后按钮 active，拖拽水岸后桥梁模式提示保持可见，截图完成。

限制：截图只能证明真实页面可打开、桥梁工具可选中交互且无运行时错误；桥梁像素级差异由 `roadVisualStyle` 单测和 Pixi 绘制代码保证。正式桥梁美术、施工动画、桥头吸附和连通诊断仍未实现。

## 2026-06-30 第六十八轮验证

- TDD RED：`npx vitest run src/integration/GameRuntime.test.ts -t "bridges|bridge"` 先失败，原因是 `runtime.placeBridgePath` 不存在。
- TDD GREEN：同一目标测试通过；新增 Runtime 测试覆盖桥梁可铺在水/岸、按 18 银两/格扣费、余额不足跳过，以及普通陆地拒绝架桥且不扣费。
- 目标测试：`npx vitest run src/integration/GameRuntime.test.ts src/ui/placement/runtimePlacement.test.ts`：2 个测试文件、21 项通过。
- `npm test`：31 个测试文件、219 项通过；其中 `src/qa/stressScenario.test.ts` 长稳用例通过，耗时约 44.84 秒，总耗时 48.92 秒。
- `npm run build`：TypeScript 与 Vite 生产构建通过，`dist/` 产物生成。
- 浏览器 QA：`http://localhost:5173/` 横屏打开正常，标题为《小耳岛》，页面非空，无 Vite 报错覆盖层，console 无 error/warn。城建面板出现“桥梁 银两18/格”；点击后按钮 active，拖拽水岸后财政下降并保持桥梁工具提示可见。

限制：浏览器层只验证工具入口、选中态、财政变化和无控制台错误；桥梁是否按格落在水/岸由 Runtime 测试精确覆盖。专属桥梁美术、桥头吸附和连通诊断仍未实现。

## 2026-06-30 第六十七轮验证

- TDD RED：`npx vitest run src/integration/GameRuntime.test.ts -t "demolishes|cancels logistics"` 先失败，原因是 `runtime.demolishBuilding` 不存在。
- TDD GREEN：同一目标测试通过；新增 Runtime 测试覆盖拆住宅会迁出家庭、移除 household agent、释放地块，以及拆仓储会取消关联物流订单并释放承运人。
- 目标测试：`npx vitest run src/integration/GameRuntime.test.ts`：1 个测试文件、17 项通过。
- `npm test`：31 个测试文件、217 项通过；其中 `src/qa/stressScenario.test.ts` 长稳用例通过，耗时约 48.17 秒，总耗时 52.35 秒。
- `npm run build`：TypeScript 与 Vite 生产构建通过，`dist/` 产物生成。
- 浏览器 QA：`http://localhost:5173/` 横屏打开正常，标题为《小耳岛》，页面非空，无 Vite 报错覆盖层，console 无 error/warn。点击地图建筑后详情面板出现“拆除建筑”；点击后详情关闭，人口/住房变为 12/12，toast 显示“已拆除「江南民居」…迁出 4 户…取消 0 条物流”。

限制：尚未验证拆除生产/仓储建筑的浏览器链路；该一致性由 Runtime 测试覆盖。二次确认、退款/回收比例、拆除动画和批量拆除仍未实现。

## 2026-06-30 第六十六轮验证

- TDD RED：`npx vitest run src/integration/GameRuntime.test.ts -t "roads|road construction|places roads|lays roads"` 先失败，原因是道路铺设不扣财政且余额不足仍可继续铺路。
- 边缘 RED：`npx vitest run src/integration/GameRuntime.test.ts -t "existing roads"` 先失败，原因是余额不足时拖过已有道路被误判为 `unaffordable`。
- TDD GREEN：道路目标测试通过；新增/更新 Runtime 测试覆盖铺路扣银两、拖拽路径按可用财政部分铺设、已有道路不重复扣费。
- 目标测试：`npx vitest run src/integration/GameRuntime.test.ts`：1 个测试文件、15 项通过。
- `npm test`：31 个测试文件、215 项通过；其中 `src/qa/stressScenario.test.ts` 长稳用例通过，耗时约 46.62 秒，总耗时 50.71 秒。
- `npm run build`：TypeScript 与 Vite 生产构建通过，`dist/` 产物生成。
- 浏览器 QA：`http://localhost:5173/` 横屏打开正常，标题为《小耳岛》，页面非空，无 Vite 报错覆盖层，console 无 error/warn。选择道路工具并拖拽地图后，财政从 2400 变为 2394，验证真实 UI 路径已扣 1 格石板路成本。

限制：尚未实现桥梁专门工具、道路维护费、拆路退款和道路容量成本；本轮只验证铺设成本进入财政闭环。

## 2026-06-30 第六十五轮验证

- TDD RED：`npx vitest run src/integration/GameRuntime.test.ts -t "removes roads along a dragged path"` 先失败，原因是 `runtime.removeRoadPath` 不存在。
- TDD GREEN：同一命令通过；新增 Runtime 测试覆盖拆除 3 格已有道路，并对 1 格无路、1 格越界做跳过统计。
- 目标测试：`npx vitest run src/integration/GameRuntime.test.ts`：1 个测试文件、13 项通过。
- `npm run build`：TypeScript 与 Vite 生产构建通过，`dist/` 产物生成。
- `npm test`：31 个测试文件、213 项通过；其中 `src/qa/stressScenario.test.ts` 长稳用例通过，耗时约 55.98 秒，总耗时 60.95 秒。
- 浏览器 QA：`http://127.0.0.1:5173/` 打开正常，标题为《小耳岛》，页面非空，无 Vite 报错覆盖层，console 无 error/warn。DOM 出现“拆路”按钮；点击后拖拽地图出现“拆除 1 格道路，跳过 1 格。”反馈，截图显示拆路工具处于选中态。

限制：本轮只验证道路拆除，未实现建筑拆除；浏览器自动拖拽仍只能证明交互入口和单格反馈，多格拆除由 Runtime 测试证明。

## 2026-06-30 第六十四轮验证

- TDD RED：`npx vitest run src/integration/GameRuntime.test.ts -t "lays roads along a dragged path"` 先失败，原因是 `runtime.placeRoadPath` 不存在。
- TDD GREEN：同一命令通过；新增 Runtime 测试覆盖一条路径连续铺设 5 格石板路，并在遇到已有建筑时跳过 1 格且保留有效路段。
- 目标测试：`npx vitest run src/integration/GameRuntime.test.ts`：1 个测试文件、12 项通过。
- `npm test`：31 个测试文件、212 项通过；其中 `src/qa/stressScenario.test.ts` 长稳用例通过，耗时约 52.03 秒，总耗时 56.74 秒。
- `npm run build`：TypeScript 与 Vite 生产构建通过，`dist/` 产物生成。
- 浏览器 QA：启动 `npm run dev -- --host 0.0.0.0` 后访问 `http://127.0.0.1:5173/`，标题为《小耳岛》，页面非空，无 Vite 报错覆盖层，console 无 error/warn。选择城建面板“道路”并拖拽地图后，DOM 出现“连续铺设 1 格石板路，跳过 1 格。”反馈，道路工具保持选中。

限制：浏览器自动拖拽的坐标命中仍不稳定，未能在浏览器层精确断言新增多格道路；多格连续铺设由 Runtime 测试证明。后续需要补坐标级 E2E 钩子或可读的路网调试计数。

## 2026-06-30 第六十三轮验证

- TDD RED：`npx vitest run src/integration/GameRuntime.test.ts -t "marks otherwise valid placement previews invalid"` 先失败，原因是资源耗尽后 `previewBuildingPlacement` 仍返回 `valid: true` 且没有 `construction` 缺口。
- TDD GREEN：同一命令通过，资源不足住宅试放返回 `valid: false`、`reason: "材料不足：木料×2"`，并保留 footprint cells。
- 目标回归：`npx vitest run src/integration/GameRuntime.test.ts src/ui/placement/runtimePlacement.test.ts src/ui/placement/placementMachine.test.ts`：3 个测试文件、17 项通过。
- `npm test`：31 个测试文件、211 项通过；其中 `src/qa/stressScenario.test.ts` 长稳用例通过，耗时约 44.43 秒，总耗时 48.50 秒。
- `npm run build`：TypeScript 与 Vite 生产构建通过，`dist/` 产物生成。

限制：本轮尚未完成浏览器自动化复验；资源不足红态通过运行时 preview 和现有 Runtime placement adapter 传导到 UI，但仍需后续覆盖真实浏览器交互截图。

## 2026-06-30 第六十二轮验证

- TDD RED：`npx vitest run src/ui/placement/runtimePlacement.test.ts` 先失败，原因是 `./runtimePlacement` 模块不存在。
- TDD GREEN：`npx vitest run src/ui/placement/runtimePlacement.test.ts`：1 个测试文件、2 项通过，覆盖 Runtime preview 作为 `PlacementValidator` 以及从 placing 状态派生 preview。
- 目标回归：`npx vitest run src/ui/placement/runtimePlacement.test.ts src/ui/placement/placementMachine.test.ts src/integration/GameRuntime.test.ts`：3 个测试文件、16 项通过。
- `npm test`：31 个测试文件、210 项通过；其中 `src/qa/stressScenario.test.ts` 长稳用例通过，耗时约 47.32 秒，总耗时 49.37 秒。
- `npm run build`：TypeScript 与 Vite 生产构建通过，`dist/` 产物生成。
- 服务连通性：`curl -I http://127.0.0.1:5173/` 与 `curl -I http://localhost:5173/` 均返回 `HTTP/1.1 200 OK`，Vite 进程监听 5173；用户若看到 `ERR_CONNECTION_REFUSED`，优先刷新页面或改用 `http://127.0.0.1:5173/`。
- 浏览器 QA：前置回归中 `http://127.0.0.1:5173/` 打开正常，无 Vite 报错覆盖层，console 无 error/warn；选择“民居”后移动地图出现 5 个 preview cell，按 R 后 preview 仍保留，右键取消后工具回到“查看”且 preview cell 清零。本次用户反馈后复验时，Codex 内置浏览器自动化在导航阶段超时，未作为失败判定项目代码的依据。

限制：本轮浏览器 QA 仍主要覆盖冲突红态和状态机交互；可营造绿态、确认成功后连续放置、道路拖拽/连续铺设和拆除入口未完成。

## 2026-06-30 第六十一轮验证

- TDD RED：`npx vitest run src/integration/GameRuntime.test.ts` 先失败，原因是 `runtime.previewBuildingPlacement` 不存在。
- TDD GREEN：`npx vitest run src/integration/GameRuntime.test.ts`：1 个测试文件、10 项通过，覆盖建筑试放 preview 输出 footprint、入口、道路占用冲突、入口未连路冲突，并验证 preview 不改变建筑表和财政。
- `npm test`：30 个测试文件、208 项通过；其中 `src/qa/stressScenario.test.ts` 长稳用例通过，耗时约 51.37 秒。
- `npm run build`：TypeScript 与 Vite 生产构建通过，`dist/` 产物生成。
- 浏览器 QA：`http://127.0.0.1:5173/` 打开正常，无 Vite 报错覆盖层，console 无 error/warn；点击“民居”并移动到地图后，DOM 验证 `.placement-preview-cell` 为 5、footprint 为 4、blocked 为 1，状态条显示“不可营造入口必须紧邻道路”，建造菜单“民居”处于 active。

限制：本轮浏览器 QA 覆盖冲突红态；可营造绿态由 Runtime 测试证明。下一轮需要在浏览器中稳定覆盖绿态、旋转入口和重复放置。

## 2026-06-30 第六十轮验证

- TDD RED：`npx vitest run src/integration/stageAdvisor.test.ts` 先失败，原因是推荐执行结果尚未输出 `footprint`。
- TDD GREEN：`npx vitest run src/integration/stageAdvisor.test.ts`：1 个测试文件、12 项通过，覆盖建筑类治理推荐输出 3×2 集市 footprint、入口 cell 和 overlay cells。
- `npm test`：30 个测试文件、207 项通过；其中 `src/qa/stressScenario.test.ts` 长稳用例通过，耗时约 43.95 秒。
- `npm run build`：TypeScript 与 Vite 生产构建通过，`dist/` 产物生成。
- 浏览器 QA：`http://127.0.0.1:5173/` 打开正常，无 Vite 报错覆盖层，console 无 error/warn；点击“瓶颈 → 打开服务图层并营造市场”后，DOM 验证 `.stage-overlay-cell--footprint` 为 6、`.stage-overlay-cell--entrance` 为 1、`.stage-overlay-marker--placement` 为 2，建造菜单高亮“集市”。

限制：本轮验证的是推荐预览链路，不代表完整建造试放系统。冲突格、旋转方向、鼠标跟随预览和确认/取消流尚未实现。

## 2026-06-29 第三十七轮验证

- `vitest run src/legacy/game/legacy.test.ts`：覆盖旧群岛渲染开关和归档组件路径边界，要求旧 `IslandCanvas`、旧 `MaterialRow` 和旧 `src/game` 不再存在于正式入口目录。
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

## 2026-06-29 第四十一轮验证

- `vitest run src/simulation/economy/economy.test.ts`：先红后绿，新增测试确认货运不会穿越普通水面或建筑占用道路格。
- `vitest run src/simulation/world/movementPath.test.ts src/simulation/economy/economy.test.ts`：2 个测试文件、33 项通过，覆盖共享路径严格失败、桥路过水和物流复用。
- `npm test`：30 个测试文件、192 项测试通过。
- `npm run build`：TypeScript 与 Vite 生产构建通过，`dist/` 产物生成。
- `git diff --check`：通过，无空白或补丁格式问题。

## 2026-06-29 第四十二轮验证

- `vitest run src/simulation/core/SimulationEngine.test.ts`：先红后绿，新增测试确认工人就业后会获得共享道路通勤路径，并逐 tick 移动到雇主入口后进入 working 状态。
- `vitest run src/simulation/world/movementPath.test.ts src/simulation/core/SimulationEngine.test.ts`：2 个测试文件、19 项通过，覆盖共享路径兼容和工人通勤路径。
- `npm test`：30 个测试文件、193 项测试通过。
- `npm run build`：TypeScript 与 Vite 生产构建通过，`dist/` 产物生成。

## 2026-06-29 第四十三轮验证

- `vitest run src/simulation/core/SimulationEngine.test.ts`：先红后绿，扩展工人路径测试为上班、工作、返家、回家完整链路。
- `vitest run src/simulation/world/movementPath.test.ts src/simulation/economy/economy.test.ts src/rendering/DynamicScene.test.ts src/qa/stressScenario.test.ts`：4 个测试文件、46 项通过，覆盖共享路径、经济物流、动态场景和 2400 tick 长稳兼容。
- `npm test`：30 个测试文件、193 项测试通过。
- `npm run build`：TypeScript 与 Vite 生产构建通过，`dist/` 产物生成。

## 2026-06-29 第四十四轮验证

- `vitest run src/simulation/economy/economy.test.ts`：先红后绿，新增测试确认服务成功会生成居民购物/服务访问 agent，并沿路径前进、返家和清理。
- `vitest run src/simulation/economy/economy.test.ts src/rendering/DynamicScene.test.ts src/qa/stressScenario.test.ts`：3 个测试文件、41 项通过，覆盖服务访问、动态场景兼容和 2400 tick 长稳兼容。
- `npm test`：30 个测试文件、193 项测试通过。
- `npm run build`：TypeScript 与 Vite 生产构建通过，`dist/` 产物生成。

## 2026-06-29 第四十五轮验证

- `npm test -- src/simulation/economy/economy.test.ts`：1 个测试文件、28 项测试通过，覆盖居民出发后不即时结算、抵达市场/服务建筑后才完成购买/服务、服务容量和综合物流-市场闭环。
- `npm test -- src/simulation/core/SimulationEngine.test.ts src/simulation/economy/economy.test.ts src/qa/stressScenario.test.ts`：3 个测试文件、44 项测试通过；长稳压力测试通过。
- `npm test`：30 个测试文件、193 项测试通过。
- `npm run build`：TypeScript 与 Vite 生产构建通过。

本轮长稳语义调整：

- `migrationOutThreshold: 0` 明确表示禁用迁出，用于验证 500 户、300 建筑、150 可见实体的满规模吞吐；默认游戏阈值仍会触发低满意度迁出。
- 500 户满规模稳定后历史订单曾达到约 18000 条，因此第四十五轮灰盒上限从 10000 调整为 20000；第四十九轮已实现归档并将当前订单表上限收紧到 2000。后续仍需用更长商业级长跑继续验证。

## 2026-06-29 第四十六轮验证

- `npm test -- src/simulation/districts/prosperity.test.ts`：1 个测试文件、4 项测试通过，覆盖真实居民服务访问驱动街区繁荣和 footTraffic。
- `npm test -- src/simulation/districts/prosperity.test.ts src/integration/GameRuntime.test.ts src/rendering/DynamicScene.test.ts src/qa/stressScenario.test.ts`：4 个测试文件、25 项测试通过，覆盖街区繁荣、运行时集成、动态场景兼容和 2400 tick 长稳。
- `npm test`：30 个测试文件、194 项测试通过。
- `npm run build`：TypeScript 与 Vite 生产构建通过。

## 2026-06-29 第四十七轮验证

- `npm test -- src/integration/stageAdvisor.test.ts`：1 个测试文件、4 项测试通过，覆盖治理卡原因与推荐操作数据。
- `npm test`：30 个测试文件、194 项测试通过。
- `npm run build`：TypeScript 与 Vite 生产构建通过。

## 2026-06-29 第四十八轮验证

- `npm test -- src/simulation/economy/economy.test.ts`：1 个测试文件、29 项测试通过，覆盖承运人取货/送货货运意图和交付清理。
- `npm test -- src/simulation/economy/economy.test.ts src/rendering/DynamicScene.test.ts src/qa/stressScenario.test.ts`：3 个测试文件、42 项测试通过，覆盖物流、动态场景兼容和 2400 tick 长稳。
- `npm test`：30 个测试文件、195 项测试通过。
- `npm run build`：TypeScript 与 Vite 生产构建通过。

## 2026-06-29 第四十九轮验证

- `npm test -- src/simulation/economy/economy.test.ts src/qa/stressScenario.test.ts`：2 个测试文件、32 项测试通过，覆盖历史订单归档、取消原因计数、效率统计和 2400 tick 长稳归档发生。
- `npm test`：30 个测试文件、196 项测试通过。
- `npm run build`：TypeScript 与 Vite 生产构建通过。

## 2026-06-29 第五十轮验证

- `npm test -- src/legacy/game/legacy.test.ts src/legacy/game/engine.test.ts src/legacy/game/storage.test.ts`：3 个测试文件、18 项通过，覆盖 legacy 开关、旧引擎兼容、旧存档迁移和正式目录防回流。
- `npm test`：30 个测试文件、197 项测试通过。
- `npm run build`：TypeScript 与 Vite 生产构建通过。

## 2026-06-29 第五十一轮验证

- `npm test -- src/integration/stageAdvisor.test.ts`：1 个测试文件、5 项通过，覆盖活动热力图层。
- `npm test`：30 个测试文件、198 项测试通过。
- `npm run build`：TypeScript 与 Vite 生产构建通过。

## 2026-06-29 第五十二轮验证

- `npm test -- src/integration/stageAdvisor.test.ts`：1 个测试文件、6 项通过，覆盖活动压力读数和“城市活动压力”治理卡。
- `npm test`：30 个测试文件、199 项测试通过。
- `npm run build`：TypeScript 与 Vite 生产构建通过。

## 2026-06-29 第五十三轮验证

- `npm test -- src/integration/stageAdvisor.test.ts`：1 个测试文件、7 项通过，覆盖道路格活动压力投射。
- `npm test`：30 个测试文件、200 项测试通过。
- `npm run build`：TypeScript 与 Vite 生产构建通过。

## 2026-06-29 第五十四轮验证

- `npm test -- src/integration/stageAdvisor.test.ts`：1 个测试文件、8 项通过，覆盖货拥、服务热和道压三类活动压力推荐。
- `npm test`：30 个测试文件、201 项测试通过。
- `npm run build`：TypeScript 与 Vite 生产构建通过。

## 2026-06-29 第五十五轮验证

- `npm test -- src/integration/stageAdvisor.test.ts`：1 个测试文件、9 项通过，覆盖治理卡推荐建筑的阶段可用性解释。
- `npm test`：30 个测试文件、202 项测试通过。
- `npm run build`：TypeScript 与 Vite 生产构建通过。

## 2026-06-29 第五十六轮验证

- `npm test -- src/integration/stageAdvisor.test.ts`：1 个测试文件、10 项通过，覆盖推荐建筑的连续空地和入口道路诊断。
- `npm test`：30 个测试文件、203 项测试通过。
- `npm run build`：TypeScript 与 Vite 生产构建通过。

## 2026-06-29 第五十七轮验证

- `npm test -- src/integration/GameRuntime.test.ts src/integration/stageAdvisor.test.ts`：2 个测试文件、19 项通过，覆盖正式营造成本扣除、材料不足拒绝和治理卡资源缺口诊断。
- `npm test`：30 个测试文件、204 项测试通过。
- `npm run build`：TypeScript 与 Vite 生产构建通过。

## 2026-06-29 第五十八轮验证

- `npm test -- src/content/buildings.test.ts src/integration/GameRuntime.test.ts`：2 个测试文件、18 项通过，覆盖建造菜单成本、缺口和营造成本运行时兼容。
- `npm test`：30 个测试文件、205 项测试通过。
- `npm run build`：TypeScript 与 Vite 生产构建通过。

## 2026-06-29 第五十九轮验证

- `npm test -- src/integration/stageAdvisor.test.ts src/content/buildings.test.ts`：2 个测试文件、20 项通过，覆盖推荐落点注入和建造菜单成本状态。
- `npm run build`：TypeScript 与 Vite 生产构建通过。
- 浏览器 QA：`http://localhost:5173/` 打开正常，无 console error/warn；建造菜单显示银两/材料成本；点击“打开服务图层并营造市场”后，地图显示“建议落点/入口”，建造菜单标出“集市”为推荐建筑。
- `npm test`：30 个测试文件、206 项测试通过。

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

- `vitest run src/legacy/game/engine.test.ts src/simulation/rewards/music.test.ts src/simulation/rewards/drops.test.ts`：3 个测试文件、23 项通过，覆盖旧群岛引擎默认不再听歌刷普通材料、legacy 兼容选项、音乐稀缺奖励和普通掉落来源。
- `tsc -b`：类型检查通过。
- `vitest run`：27 个测试文件、177 项测试通过。
- `vite build`：生产构建通过，`dist/` 产物生成。

## 2026-06-27 第二十二轮验证

- `vitest run src/legacy/game/legacy.test.ts src/legacy/game/engine.test.ts src/legacy/game/storage.test.ts`：3 个测试文件、16 项通过，覆盖旧群岛渲染开关、旧引擎兼容和旧存档迁移。
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
- 当前订单表总量不超过 2000，且长稳期间必须产生归档订单。
- 单建筑库存总量不超过 1500。
- 人口、满意度、财政、库存、订单等关键数值不得出现 `NaN` 或无穷大。

这些阈值是当前系统可承受的灰盒阈值，不代表商业级目标。商业级目标应提升为：

- 至少连续 30 个模拟日稳定运行，且常规 CI 可在可接受时间内执行分层版本。
- 人口留存不低于 95%，非剧情/灾害场景不得自然归零。
- 平均满意度长期保持在 60 以上，P10 家庭满意度不低于 40。
- 物流效率长期不低于 85，活跃订单规模随城市规模线性有界。
- 停工建筑低于建筑总数的 5%，且停工原因集中在真实资源/道路/财政问题，而不是调度器饥饿。
- 库存必须受建筑容量硬约束，历史订单归档必须在更长窗口中继续证明主快照有界。

当前限制与风险：

- 2026-06-27 性能审计前，2400 tick 长稳测试本机耗时约 45.64 秒（长稳用例 44.17 秒），已经明显重于普通单元测试；7200 tick 在本机超过 90 秒仍未结束，暂不适合作为默认 Vitest 基准。
- 物流系统已将超出保留窗口的 delivered/cancelled 订单归档到 `logisticsArchive`；当前只能证明 2400 tick 灰盒窗口有界，尚不能证明 30 日商业级窗口有界。
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

- 历史订单已有 `logisticsArchive` 归档；仍需继续验证更长窗口下归档汇总、效率统计和 UI 诊断都保持稳定。
- `assignWaitingOrders()`、`advanceCarriers()`、`updateEfficiency()` 仍会枚举订单集合；当前 2400 tick 已可接受，但更长窗口或更大城市仍需要分层 benchmark。

## 2026-07-03 第九十轮验证

- TDD RED：`npx vitest run src/simulation/economy/economy.test.ts -t "records excess service demand"` 首次失败于 `state.serviceQueues?.['market-1:food']` 为 `undefined`，证明旧系统没有可观察服务队列。
- TDD GREEN：补充 `ServiceQueueState`、`SimulationSnapshot.serviceQueues` 和 `ServiceSystem` 排队记录后，同一目标测试通过。
- 回归修正：全经济测试首次暴露已派出服务访问仍被重复算作未满足需求压力；修正后 `npx vitest run src/simulation/economy/economy.test.ts` 通过，31 项测试全部通过。
- 叠层 RED/GREEN：`npx vitest run src/integration/stageAdvisor.test.ts -t "derives switchable housing"` 首次失败于服务图层缺少 `queuedHouseholds/longestServiceWait`，接入 `serviceQueues` 后通过。

- 目标回归：`npx vitest run src/simulation/economy/economy.test.ts src/integration/stageAdvisor.test.ts` 通过，2 个测试文件、46 项测试。
- 压力回归：`npx vitest run src/qa/stressScenario.test.ts` 通过，2 项测试；长稳用例耗时约 36.68 秒。
- 7200 tick 分层长跑：`npm run qa:civilization-long-run` 通过，最终人口 1750、满意度约 40.39、物流效率 100、停工 161、活跃订单 39、订单表 539、归档 53462、可见 agent 206、无非法数值。
- 全量回归：`npm test` 通过，40 个测试文件、245 项测试。
- 生产构建：`npm run build` 通过。
- 补丁检查：`git diff --check` 通过，无空白错误输出。

当前限制：

- 服务队列已可观察，但仍未模拟建筑内部处理时间、员工效率差异、服务优先级策略。
- 仓储容量目前主要表现为库存容量和物流订单，尚未形成装卸吞吐、仓库排队和订单积压诊断。
- 本轮服务队列让 2400 tick 长稳用例耗时处于约 36–37 秒级，虽未超出当前门禁，但相比理想灰盒速度偏慢；后续必须继续优化服务候选筛选、路线缓存和队列统计，而不是继续在主循环堆全量扫描。

## 2026-07-03 第九十一轮验证

- TDD RED：`npx vitest run src/simulation/economy/economy.test.ts -t "limits same-tick unloading"` 首次失败于第二个订单也被立即标记为 `delivered`，证明旧物流系统没有目的建筑卸货吞吐限制。
- TDD GREEN：补充 `destination-throughput`、`LogisticsQueueState`、`unloadCapacityPerTick` 与卸货队列记录后，同一目标测试通过。
- 叠层 RED/GREEN：`npx vitest run src/integration/stageAdvisor.test.ts -t "derives switchable housing"` 首次失败于物流图层缺少 `unloadBacklog/longestUnloadWait`，接入 `logisticsQueues` 后通过。
- 回归修正：物流图层允许同点位保留“物流热点”和“卸货排队”双重诊断，但该行为只收窄在物流图层，避免吸引力图层重复显示同建筑多标签噪声。
- 目标回归：`npx vitest run src/simulation/economy/economy.test.ts src/integration/stageAdvisor.test.ts src/qa/logisticsHotspotScenarios.test.ts src/integration/GameRuntime.test.ts` 通过，4 个测试文件、70 项测试。

- 全量回归：`npm test` 通过，40 个测试文件、246 项测试；长稳用例耗时约 35.61 秒。
- 生产构建：`npm run build` 通过。
- 补丁检查：`git diff --check` 通过，无空白错误输出。

当前限制：

- `unloadCapacityPerTick` 仍是物流系统参数，尚未由建筑等级、工人数量、仓库/市场/码头类型和道路入口数动态计算。
- 物流治理卡还没有区分无车、断路、仓满、来源不足和卸货吞吐不足的不同操作建议。

## 2026-07-03 第九十二轮验证

- TDD RED：`npx vitest run src/integration/stageAdvisor.test.ts -t "recommends a specific logistics fix"` 首次失败，5 类物流原因全部仍被旧逻辑归为 `打开物流图层并补仓储`，证明治理建议没有分因能力。
- TDD GREEN：新增物流分因诊断后，同一目标测试通过，覆盖 `no-carrier`、`no-route`、`destination-capacity`、`source-inventory-insufficient`、`destination-throughput`。
- 回归修正：`logistics-hotspot` QA 场景被建筑残留 `statusReason` 带偏为来源不足；修正后物流分因只依据当前订单失败原因和 `logisticsQueues`，通用热点场景继续保持补仓储建议。
- 目标回归：`npx vitest run src/integration/stageAdvisor.test.ts src/qa/logisticsHotspotScenarios.test.ts src/qa/browserE2eScenarios.test.ts src/integration/GameRuntime.test.ts` 通过，4 个测试文件、47 项测试。

- 全量回归：`npm test` 通过，40 个测试文件、251 项测试；长稳用例耗时约 35.83 秒。
- 生产构建：`npm run build` 通过。
- 补丁检查：`git diff --check` 通过，无空白错误输出。

当前限制：

- 分因建议仍以卡片文案和工具入口为主，尚未自动生成具体可执行计划。
- “补充承运人调度”和“检查来源库存”目前是 inspect 级建议，缺少对应的车船生产/调度面板和来源定位交互。

## 2026-07-10 第九十七轮验证

- 目标 GREEN：`npx vitest run src/integration/stageAdvisor.test.ts -t "recommends a specific logistics fix"` 通过，5 类物流失败原因均携带 `focusRole` 和 `focusBuildingId`。
- 相关回归：`npx vitest run src/integration/stageAdvisor.test.ts src/qa/logisticsHotspotScenarios.test.ts src/qa/browserE2eScenarios.test.ts` 通过，3 个测试文件、25 项测试。
- 全量回归：`npm test` 通过，41 个测试文件、254 项测试。
- 生产构建：`npm run build` 通过。
- 补丁检查：`git diff --check` 通过，无空白错误输出。

当前限制：

- `logisticsPlan` 已可定位来源/目的相关建筑，但尚未自动生成 `build-road-link` 的道路计划。
- `add-carrier-dispatch` 仍没有正式承运调度入口；需要先定义承运容量、车船来源和财政/材料成本。
- `expand-storage` / `add-buffer-storage` 仍没有从计划直接生成候选仓储 footprint；下一轮应复用现有营造推荐执行链路。

## 2026-07-10 第九十八轮验证

- 目标 GREEN：`npx vitest run src/integration/stageAdvisor.test.ts -t "recommends a specific logistics fix"` 通过，`no-route` 物流分因会输出 roadPlan，其余物流分因不误带 roadPlan。
- 相关回归：`npx vitest run src/integration/stageAdvisor.test.ts src/qa/logisticsHotspotScenarios.test.ts src/qa/browserE2eScenarios.test.ts src/integration/GameRuntime.test.ts` 通过，4 个测试文件、47 项测试。
- 全量回归：`npm test` 通过，41 个测试文件、254 项测试。
- 生产构建：`npm run build` 通过。
- 补丁检查：`git diff --check` 通过，无空白错误输出。

当前限制：

- `build-road-link` 现可生成直连 roadPlan，但不是智能道路规划器；它尚未避让建筑、绕开高成本水面、选择最短路网连接点或聚合多个订单。
- `add-carrier-dispatch`、`expand-storage`、`add-buffer-storage`、`inspect-source-stock` 仍需要继续接入正式运行时动作/面板。

## 2026-07-10 第九十九轮验证

- 目标 RED/GREEN：`npm test -- src/integration/stageAdvisor.test.ts` 首次暴露仓储建议仍返回通用第一块空地；修正后 21 项测试通过，仓满物流建议会选择热点旁粮仓 footprint。
- 回归修正：统一建筑可用性校验会二次覆盖定制 `execution`，导致物流热点候选丢失；已改为保留已有 execution，只在缺失时生成通用建筑落点。
- 相关回归：`npm test -- src/integration/stageAdvisor.test.ts src/integration/GameRuntime.test.ts src/qa/logisticsHotspotScenarios.test.ts` 通过，3 个测试文件、44 项测试。
- 全量回归：`npm test` 通过，41 个测试文件、255 项测试。
- 生产构建：`npm run build` 通过。
- 补丁检查：`git diff --check` 通过，无空白错误输出。

当前限制：

- 仓储候选是“离当前热点最近的可建粮仓”启发式，不是商业级仓储选址 AI；尚未评估道路容量、服务半径、多资源流向、未来扩建空间和多订单聚合收益。
- `add-carrier-dispatch` 和 `inspect-source-stock` 仍缺正式运行时动作/面板；下一轮应继续把结构化计划落到可点击执行入口。

## 2026-07-12 第一百零一轮验证

- 目标 GREEN：`npm test -- src/integration/GameRuntime.test.ts` 通过，承运重新调度会释放承运人、清空 cargoIntent、把订单重置为 waiting 并清理物流队列。
- 全量回归：`npm test` 通过，41 个测试文件、257 项测试。
- 生产构建：`npm run build` 通过。
- 补丁检查：`git diff --check` 通过，无空白错误输出。

当前限制：

- 承运重新调度只是把卡住的订单放回正式调度队列，并不新增车船，也不改变承运容量或路线优先级。

## 2026-07-12 第一百零二轮验证

- 目标 GREEN：`npm test -- src/integration/GameRuntime.test.ts` 通过，24 项运行时测试覆盖来源库存调拨、订单重置、承运释放和物流队列清理。
- 开发构建：`npm run build -- --mode development` 通过，确认 `App` 调用新运行时动作没有类型或打包问题。
- 全量回归：`npm test` 通过，41 个测试文件、258 项测试；长稳用例耗时约 70.95 秒。
- 生产构建：`npm run build` 通过。
- 补丁检查：`git diff --check` 通过，无空白错误输出。

当前限制：

- 来源库存调拨只在已有备用库存之间搬运资源；它不是生产排程、跨仓储路径优化或需求预测系统。
- 调拨会排除本次订单的来源和目的建筑，避免从收货点倒搬回发货点，但尚未按距离、道路通达、库存安全线或资源优先级选择最优仓储。

## 2026-07-12 第一百零三轮验证

- 目标 GREEN：`npm test -- src/integration/GameRuntime.test.ts` 通过，25 项运行时测试覆盖新增承运人、订单重置和正式经济系统派单。
- 开发构建：`npm run build -- --mode development` 通过，确认 `App` 的缺车治理卡可调用新增承运容量动作。
- 全量回归：`npm test` 通过，41 个测试文件、259 项测试；长稳用例耗时约 84.72 秒。
- 生产构建：`npm run build` 通过。
- 补丁检查：`git diff --check` 通过，无空白错误输出。

当前限制：

- 新增承运人当前是免费、即时生成的 `cart`，尚未绑定车行/码头、银两/材料成本、维护费、运力上限或船运路线。
- 本轮只证明新增运力能进入正式物流系统；还没有给承运容量建立长期平衡、人口/岗位来源或 UI 侧车船管理面板。

## 2026-07-12 第一百零四轮验证

- 目标 GREEN：`npm test -- src/rendering/prefab/registry.test.ts src/rendering/DynamicScene.test.ts` 通过，2 个渲染测试文件、15 项测试覆盖默认 registry 与金标占位细节层。
- 开发构建：`npm run build -- --mode development` 通过，确认主画布引入样例 manifest 后仍可打包。
- 浏览器验收：本机 Chrome 打开 `http://127.0.0.1:5174/`，canvas 为 1440×900，截图 `/tmp/eerd-visual-slice-104-fixed.png` 确认巨大透明占位框已消失。
- 全量回归：`npm test` 通过，41 个测试文件、260 项测试；长稳用例耗时约 71.07 秒。
- 生产构建：`npm run build` 通过。
- 补丁检查：`git diff --check` 通过，无空白错误输出。

当前限制：

- 当前仍是程序化占位细节，不是最终手绘/建模资产；但它已经进入真实主画布，不再只存在于测试 registry。
- `main-granary` 暂用现有完整样例生成运行时 descriptor，以便显示粮仓程序化细节；正式粮仓 manifest 仍需后续补齐。
- 主包增加了样例 manifest 数据，后续应评估是否把 registry 拆成懒加载或压缩后的生产 manifest。
