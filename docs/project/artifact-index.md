# 《小耳岛》项目产物索引

本文件记录每轮真实新增或修改的项目产物。只有写入这里的文件，才能算“项目内可检查产出”。

## 2026-07-03：第八十八轮 7200 tick 分层文明长跑

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/qa/civilizationLongRun.ts` | 长跑 QA 执行器 | 运行 7200 tick 压力城市，并在 2400/4800/7200 tick 采样稳定性和快照规模 |
| `src/qa/civilizationLongRunCheck.ts` | QA 命令入口 | 输出长跑 JSON 报告，并在任一阈值不满足时抛错失败 |
| `package.json` | QA 命令 | 新增 `npm run qa:civilization-long-run` |
| `docs/project/task-board.md` | 任务看板 | 记录 `LONG-RUN-CIV-QA-02` 已完成 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第八十八轮进展、QA 完成度和下一轮任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮实现、验证和限制 |
| `docs/project/qa.md` | QA 记录 | 记录 TDD RED/GREEN、7200 tick 实测和目标回归 |
| `docs/project/artifact-index.md` | 产物索引 | 记录本轮真实新增/修改文件 |

## 2026-07-03：第八十七轮物流热点浏览器交互

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/qa/browserE2eScenarios.ts` | 浏览器 E2E 场景契约 | 为 logistics-hotspot 增加点击物流治理卡和 toast 断言 |
| `src/qa/browserE2eScenarios.test.ts` | 自动测试 | 固定物流热点场景 interaction 元数据，确保 runner payload 可读取 |
| `docs/project/task-board.md` | 任务看板 | 记录 `BROWSER-E2E-LOGISTICS-HOTSPOT-01` 已完成 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第八十七轮进展、UI/QA 完成度和下一轮任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮实现、验证和限制 |
| `docs/project/qa.md` | QA 记录 | 记录 TDD RED/GREEN、真实浏览器 E2E、目标测试和构建 |
| `docs/project/artifact-index.md` | 产物索引 | 记录本轮真实新增/修改文件 |

## 2026-07-03：第八十六轮桥梁缺口浏览器交互

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/qa/browserE2eScenarios.ts` | 浏览器 E2E 场景契约 | 为 bridge-gap 增加点击补桥治理卡和完成 toast 断言 |
| `src/qa/browserE2eScenarios.test.ts` | 自动测试 | 固定桥梁缺口场景 interaction 元数据，确保 runner payload 可读取 |
| `docs/project/task-board.md` | 任务看板 | 记录 `BROWSER-E2E-BRIDGE-GAP-01` 已完成 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第八十六轮进展、地图建造/QA 完成度和下一轮任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮实现、验证和限制 |
| `docs/project/qa.md` | QA 记录 | 记录 TDD RED/GREEN、真实浏览器 E2E、目标测试和构建 |
| `docs/project/artifact-index.md` | 产物索引 | 记录本轮真实新增/修改文件 |

## 2026-07-03：第八十五轮服务治理浏览器交互

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/qa/browserE2eScenarios.ts` | 浏览器 E2E 场景契约 | 为 service-governance 增加点击治理卡和服务治理 toast 断言 |
| `src/qa/browserE2eScenarios.test.ts` | 自动测试 | 固定服务治理场景 interaction 元数据，确保 runner payload 可读取 |
| `docs/project/task-board.md` | 任务看板 | 记录 `BROWSER-E2E-SERVICE-GOVERNANCE-01` 已完成 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第八十五轮进展、QA 完成度和下一轮任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮实现、验证和限制 |
| `docs/project/qa.md` | QA 记录 | 记录 TDD RED/GREEN、真实浏览器 E2E、目标测试和构建 |
| `docs/project/artifact-index.md` | 产物索引 | 记录本轮真实新增/修改文件 |

## 2026-07-01：第八十四轮低财政补线失败浏览器交互

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/qa/browserE2eScenarios.ts` | 浏览器 E2E 场景契约 | 为 road-plan-low-treasury 增加点击治理卡和失败 toast 断言 |
| `src/qa/browserE2eScenarios.test.ts` | 自动测试 | 固定低财政场景 interaction 元数据，确保 runner payload 可读取 |
| `docs/project/task-board.md` | 任务看板 | 记录 `BROWSER-E2E-LOW-TREASURY-01` 已完成 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第八十四轮进展、QA 完成度和下一轮任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮实现、验证和限制 |
| `docs/project/qa.md` | QA 记录 | 记录 TDD RED/GREEN、真实浏览器 E2E、目标测试和构建 |
| `docs/project/artifact-index.md` | 产物索引 | 记录本轮真实新增/修改文件 |

## 2026-07-01：第八十三轮真实浏览器 E2E 执行器

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `tools/browser-e2e/run-browser-e2e.cjs` | 浏览器 E2E 执行器 | 构建后启动 Vite preview，用 Playwright Chromium 打开场景、检查文案/console，并执行声明的点击动作 |
| `src/qa/browserE2eScenarios.ts` | 浏览器 E2E 场景契约 | 为 road-plan-success 增加点击动作；修正物流热点 UI 可见文案 |
| `src/qa/browserE2eScenarios.test.ts` | 自动测试 | 覆盖至少一个真实 interaction，并验证 runner payload 输出 interaction |
| `src/qa/browserE2eRunner.ts` | 契约输出器 | 导出 `browserE2eContractPayload`，CLI 输出包含 interaction 的 JSON |
| `package.json`, `package-lock.json` | QA 命令与依赖 | 新增 Playwright devDependency 和 `npm run qa:browser-e2e` |
| `docs/project/task-board.md` | 任务看板 | 记录 `BROWSER-E2E-RUNNER-01` 已完成 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第八十三轮进展、QA 完成度和下一轮任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮实现、验证和限制 |
| `docs/project/qa.md` | QA 记录 | 记录 TDD RED/GREEN、真实浏览器 E2E、目标测试和构建 |
| `docs/project/artifact-index.md` | 产物索引 | 记录本轮真实新增/修改文件 |

## 2026-07-01：第八十二轮浏览器 E2E 场景契约

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/qa/browserE2eScenarios.ts` | 浏览器 E2E 场景契约 | 集中声明 5 个治理场景的 URL、可见文案断言和 console error 门禁 |
| `src/qa/browserE2eScenarios.test.ts` | 自动测试 | 固定场景清单、URL 和断言，防止契约漂移 |
| `src/qa/browserE2eRunner.ts` | QA 命令入口 | 输出浏览器 E2E 场景契约 JSON，供后续真实浏览器驱动器复用 |
| `package.json` | QA 命令入口 | 新增 `npm run qa:browser-e2e:contract` |
| `docs/project/task-board.md` | 任务看板 | 记录 `BROWSER-E2E-CONTRACT-01` 已完成 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第八十二轮进展、QA 完成度和下一轮任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮实现、验证和限制 |
| `docs/project/qa.md` | QA 记录 | 记录 TDD RED/GREEN、目标测试和构建 |
| `docs/project/artifact-index.md` | 产物索引 | 记录本轮真实新增/修改文件 |

## 2026-07-01：第八十一轮物流热点治理 QA 命令

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/GameRuntime.ts` | 运行时调试场景 | 新增 `logistics-hotspot`，预热后稳定注入市场入货拥堵订单 |
| `src/integration/stageAdvisor.ts` | 治理推荐逻辑 | 同等热点压力下优先定位入货端，避免入货拥堵误指源仓 |
| `src/ui/runtimeOptions.ts` | UI 启动参数 | URL 支持 `?debugScenario=logistics-hotspot` |
| `src/ui/runtimeOptions.test.ts` | 自动测试 | 覆盖物流热点调试场景 URL 参数解析 |
| `src/qa/logisticsHotspotScenarios.ts` | QA 场景模块 | 验证未完成订单、热点指标、治理目标和推荐建筑 |
| `src/qa/logisticsHotspotScenarios.test.ts` | 自动测试 | 固定市场入货物流热点场景的可审计结果 |
| `package.json` | QA 命令入口 | 新增 `npm run qa:logistics-hotspots` |
| `docs/project/task-board.md` | 任务看板 | 记录 `LOGISTICS-HOTSPOT-QA-01` 已完成 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第八十一轮进展、完成度和下一轮任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮实现、验证和限制 |
| `docs/project/qa.md` | QA 记录 | 记录 TDD RED/GREEN、目标测试和构建 |
| `docs/project/artifact-index.md` | 产物索引 | 记录本轮真实新增/修改文件 |

## 2026-07-01：第八十轮桥梁缺口治理 QA 命令

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/GameRuntime.ts` | 运行时调试场景 | 新增 `bridge-gap`，稳定制造隔水孤立路网并触发桥梁 roadPlan |
| `src/ui/runtimeOptions.ts` | UI 启动参数 | URL 支持 `?debugScenario=bridge-gap` |
| `src/ui/runtimeOptions.test.ts` | 自动测试 | 覆盖桥梁缺口调试场景 URL 参数解析 |
| `src/qa/bridgeGapScenarios.ts` | QA 场景模块 | 验证水面断点、桥梁施工计划、执行结果和孤立路网下降 |
| `src/qa/bridgeGapScenarios.test.ts` | 自动测试 | 固定桥梁缺口补桥场景的可审计结果 |
| `package.json` | QA 命令入口 | 新增 `npm run qa:bridge-gaps` |
| `docs/project/task-board.md` | 任务看板 | 记录 `BRIDGE-GAP-QA-01` 已完成 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第八十轮进展、完成度和下一轮任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮实现、验证和限制 |
| `docs/project/qa.md` | QA 记录 | 记录 TDD RED/GREEN、目标测试和构建 |
| `docs/project/artifact-index.md` | 产物索引 | 记录本轮真实新增/修改文件 |

## 2026-07-01：第七十九轮服务缺口治理 QA 命令

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/stageAdvisor.ts` | 治理推荐逻辑 | 服务缺口推荐优先选择建成后能减少缺口的市场落点 |
| `src/qa/serviceGovernanceScenarios.ts` | QA 场景模块 | 验证服务缺口治理卡、市场推荐、营造成本、执行结果和缺口下降 |
| `src/qa/serviceGovernanceScenarios.test.ts` | 自动测试 | 固定服务缺口补市场场景的可审计结果 |
| `package.json` | QA 命令入口 | 新增 `npm run qa:service-governance` |
| `docs/project/task-board.md` | 任务看板 | 记录 `SERVICE-GOVERNANCE-QA-01` 已完成 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第七十九轮进展、完成度和下一轮任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮实现、验证和限制 |
| `docs/project/qa.md` | QA 记录 | 记录 TDD RED/GREEN、QA 命令、目标测试、全量测试和构建 |
| `docs/project/artifact-index.md` | 产物索引 | 记录本轮真实新增/修改文件 |

## 2026-07-01：第七十八轮道路补线场景 QA 命令

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/qa/roadPlanScenarios.ts` | QA 场景模块 | 统一运行道路补线成功/失败两个场景，并输出 before/action/after 摘要 |
| `src/qa/roadPlanScenarios.test.ts` | 自动测试 | 固定 roadPlan 成功施工与财政不足失败场景的可审计结果 |
| `package.json` | QA 命令入口 | 新增 `npm run qa:road-plans` |
| `docs/project/task-board.md` | 任务看板 | 记录 `ROAD-LINK-QA-COMMAND-01` 已完成 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第七十八轮进展、完成度和下一轮任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮实现、验证和限制 |
| `docs/project/qa.md` | QA 记录 | 记录 TDD RED/GREEN、QA 命令、目标测试、全量测试和构建 |
| `docs/project/artifact-index.md` | 产物索引 | 记录本轮真实新增/修改文件 |

## 2026-07-01：第七十七轮补线财政不足调试场景

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/GameRuntime.ts` | 运行时调试场景 | 新增 `isolated-road-network-low-treasury`，稳定制造不可支付 roadPlan |
| `src/integration/GameRuntime.test.ts` | 自动测试 | 覆盖低财政 roadPlan 显示缺口、执行失败、不扣财政 |
| `src/ui/runtimeOptions.ts` | UI 启动参数 | URL 支持低财政调试场景 |
| `src/ui/runtimeOptions.test.ts` | 自动测试 | 覆盖低财政调试场景 URL 参数解析 |
| `docs/project/task-board.md` | 任务看板 | 记录 `ROAD-LINK-LOW-TREASURY-E2E-01` 已完成 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第七十七轮进展、完成度和下一轮任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮实现、浏览器 E2E 和限制 |
| `docs/project/qa.md` | QA 记录 | 记录 TDD RED/GREEN、目标测试、全量测试、构建和浏览器 E2E |
| `docs/project/artifact-index.md` | 产物索引 | 记录本轮真实新增/修改文件 |

## 2026-07-01：第七十六轮孤立路网调试/E2E 场景

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/GameRuntime.ts` | 运行时调试场景 | 新增 `debugScenario: "isolated-road-network"`，稳定制造道路未连通治理卡和 roadPlan |
| `src/integration/GameRuntime.test.ts` | 自动测试 | 覆盖调试场景能生成 roadPlan，并在执行补线后降低未连通/孤立路网读数 |
| `src/ui/runtimeOptions.ts` | UI 启动参数 | 将 `?debugScenario=isolated-road-network` 转成运行时选项 |
| `src/ui/runtimeOptions.test.ts` | 自动测试 | 覆盖合法调试场景启用、未知参数忽略 |
| `src/App.tsx` | UI 入口 | 接入 URL 调试场景，并在 roadPlan 施工成功后清理过期 overlay |
| `docs/project/task-board.md` | 任务看板 | 记录 `ROAD-LINK-E2E-SCENARIO-01` 已完成 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第七十六轮进展、完成度和下一轮任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮实现、浏览器 E2E 和限制 |
| `docs/project/qa.md` | QA 记录 | 记录 TDD RED/GREEN、目标测试、全量测试、构建和浏览器 E2E |
| `docs/project/artifact-index.md` | 产物索引 | 记录本轮真实新增/修改文件 |

## 2026-07-01：第七十五轮补线计划一键施工

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/GameRuntime.ts` | 运行时接口 | 新增 `buildRoadPlan`，一次执行混合道路/桥梁施工计划并返回统一统计与反馈 |
| `src/integration/GameRuntime.test.ts` | 自动测试 | 覆盖混合 roadPlan 在财政不足时按顺序完成可支付格、跳过缺钱格，并更新真实路网 |
| `src/App.tsx` | UI 入口 | 道路治理卡存在 `roadPlan` 时直接执行一键施工，失败时保留施工格提示并切回手动工具 |
| `docs/project/task-board.md` | 任务看板 | 记录 `ROAD-LINK-ONE-CLICK-01` 已完成 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第七十五轮进展、完成度和下一轮任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮实现、浏览器 QA 和限制 |
| `docs/project/qa.md` | QA 记录 | 记录 TDD RED/GREEN、目标测试、全量测试、构建和浏览器验证 |
| `docs/project/artifact-index.md` | 产物索引 | 记录本轮真实新增/修改文件 |

## 2026-07-01：第七十四轮补线施工计划 UI 摘要

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/ui/cityAdvisorUi.ts` | UI 文案工具 | 格式化 roadPlan 摘要，显示道路/桥梁格数、预计银两和财政缺口 |
| `src/ui/cityAdvisorUi.test.ts` | 自动测试 | 覆盖补线摘要文案和财政不足提示 |
| `src/integration/stageAdvisor.ts` | 城市顾问数据层 | `withRecommendationExecutionOverlay` 支持 roadPlan cells，将待施工道路/桥梁格注入地图 overlay |
| `src/integration/stageAdvisor.test.ts` | 自动测试 | 覆盖 roadPlan 会生成推荐补线 overlay 和道路/桥梁待施工格 |
| `src/App.tsx` | UI 入口 | 瓶颈治理卡显示补线计划摘要，并复用公共推荐类型 |
| `src/styles.css` | UI 样式 | 新增待施工道路格和桥梁格 overlay 样式 |
| `docs/project/task-board.md` | 任务看板 | 记录 `ROAD-LINK-PLAN-UI-01` 已完成 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第七十四轮进展、完成度和下一轮任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮实现、浏览器 QA 和限制 |
| `docs/project/qa.md` | QA 记录 | 记录 TDD RED/GREEN、目标测试、全量测试、构建和浏览器验证 |
| `docs/project/artifact-index.md` | 产物索引 | 记录本轮真实新增/修改文件 |

## 2026-07-01：第七十三轮道路/桥梁补线施工计划

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/stageAdvisor.ts` | 城市顾问数据层 | “道路未连通”治理卡新增 `roadPlan`，输出补线起终点、待施工格、道路/桥梁类型、成本、缺口和可支付状态 |
| `src/integration/stageAdvisor.test.ts` | 自动测试 | 覆盖隔水孤立路网的补线计划会生成 2 个桥梁格、36 银两成本和 `canAfford: true` |
| `docs/project/task-board.md` | 任务看板 | 记录 `ROAD-LINK-CONSTRUCTION-PLAN-01` 已完成 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第七十三轮进展、完成度和下一轮任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮实现、浏览器 QA 和限制 |
| `docs/project/qa.md` | QA 记录 | 记录 TDD RED/GREEN、目标测试、全量测试、构建和浏览器验证 |
| `docs/project/artifact-index.md` | 产物索引 | 记录本轮真实新增/修改文件 |

## 2026-07-01：第七十二轮道路/桥梁补线建议

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/stageAdvisor.ts` | 城市顾问数据层 | 道路图层为孤立路网输出到主路网最近边界的建议接路/补桥路径 |
| `src/integration/stageAdvisor.test.ts` | 自动测试 | 覆盖隔水孤立路网会输出“建议补桥”路径和 `suggestedRoadLinks` 指标 |
| `docs/project/task-board.md` | 任务看板 | 记录 `ROAD-LINK-RECOMMENDATION-01` 已完成 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第七十二轮进展、完成度和下一轮任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮实现、浏览器 QA 和限制 |
| `docs/project/qa.md` | QA 记录 | 记录 TDD RED/GREEN、目标测试、全量测试、构建和浏览器验证 |
| `docs/project/artifact-index.md` | 产物索引 | 记录本轮真实新增/修改文件 |

## 2026-06-30：第七十一轮道路未连通治理卡

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/stageAdvisor.ts` | 城市顾问数据层 | 新增 `governance-road-disconnected`，将未连通入口/孤立路网转成高优先级治理卡 |
| `src/integration/stageAdvisor.test.ts` | 自动测试 | 覆盖未连通路网治理卡排序、文案、推荐动作和目标点 |
| `docs/project/task-board.md` | 任务看板 | 记录 `ROAD-CONNECTIVITY-GOVERNANCE-01` 已完成 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第七十一轮进展、完成度和下一轮任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮实现、浏览器 QA 和限制 |
| `docs/project/qa.md` | QA 记录 | 记录 TDD RED/GREEN、目标测试、全量测试、构建和浏览器验证 |
| `docs/project/artifact-index.md` | 产物索引 | 记录本轮真实新增/修改文件 |

## 2026-06-30：第七十轮道路/桥梁连通诊断

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/stageAdvisor.ts` | 城市顾问数据层 | 道路图层新增道路连通分量诊断、未连通入口点、孤立路网指标 |
| `src/integration/stageAdvisor.test.ts` | 自动测试 | 覆盖建筑入口贴着孤立道路但未连到主路网时，应输出未连通住宅和孤立路网读数 |
| `src/App.tsx` | UI 指标层 | 阶段面板道路图层显示未连通/孤立读数，并支持点击未连通定位 |
| `docs/project/task-board.md` | 任务看板 | 记录 `ROAD-CONNECTIVITY-DIAGNOSIS-01` 已完成 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第七十轮进展、完成度和下一轮任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮实现、浏览器 QA 和限制 |
| `docs/project/qa.md` | QA 记录 | 记录 TDD RED/GREEN、目标测试、全量测试、构建和浏览器验证 |
| `docs/project/artifact-index.md` | 产物索引 | 记录本轮真实新增/修改文件 |

## 2026-06-30：第六十九轮桥梁专属道路视觉

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/rendering/roads.ts` | 渲染样式层 | 新增 `roadVisualStyle`，集中定义泥路、石板路和桥梁的程序化视觉参数 |
| `src/rendering/roads.test.ts` | 自动测试 | 固定桥梁样式必须不同于普通石板路，并包含桥墩、桥面宽度和专属描边 |
| `src/components/SimulationCanvas.tsx` | Pixi 渲染层 | 道路绘制改为读取样式层；桥梁格渲染更宽桥面和桥墩点 |
| `docs/project/task-board.md` | 任务看板 | 记录 `BRIDGE-VISUAL-STYLE-01` 已完成 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第六十九轮进展、完成度和下一轮任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮实现、浏览器 QA 和限制 |
| `docs/project/qa.md` | QA 记录 | 记录 TDD RED/GREEN、目标测试、全量测试、构建和浏览器验证 |
| `docs/project/artifact-index.md` | 产物索引 | 记录本轮真实新增/修改文件 |

## 2026-06-30：第六十八轮桥梁专门建造模式

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/GameRuntime.ts` | 运行时接口 | 新增 `bridge` 工具类型和 `placeBridgePath`，桥梁复用批量建造统计但使用桥路规则 |
| `src/integration/GameRuntime.test.ts` | 自动测试 | 覆盖桥梁可架设在水/岸、按 18 银两/格扣费、陆地拒绝且不扣费 |
| `src/components/SimulationCanvas.tsx` | UI 交互层 | 道路拖拽模式扩展为普通道路、桥梁和拆路三类 |
| `src/App.tsx` | UI 入口 | 城建面板新增“桥梁”按钮和桥梁模式提示 |
| `docs/project/task-board.md` | 任务看板 | 记录 `BRIDGE-BUILD-TOOL-01` 已完成 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第六十八轮进展、完成度和下一轮任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮实现、浏览器 QA 和限制 |
| `docs/project/qa.md` | QA 记录 | 记录 TDD RED/GREEN、目标测试、全量测试、构建和浏览器验证 |

## 2026-06-30：第六十七轮建筑拆除一致性

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/contracts.ts` | 模拟契约 | `LogisticsFailureReason` 新增 `building-demolished`，表达拆除导致的订单取消 |
| `src/integration/GameRuntime.ts` | 运行时接口 | 新增 `demolishBuilding`，统一清理建筑、地块、住户、agent、岗位和未完成物流 |
| `src/integration/GameRuntime.test.ts` | 自动测试 | 覆盖拆住宅迁出家庭/释放地块、拆物流引用建筑取消订单/释放承运人 |
| `src/App.tsx` | UI 入口 | 建筑详情新增“建筑拆除”卡片和拆除按钮 |
| `src/styles.css` | UI 样式 | 新增拆除卡片的危险操作视觉样式 |
| `docs/project/task-board.md` | 任务看板 | 记录 `BUILDING-DEMOLISH-CONSISTENCY-01` 已完成 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第六十七轮进展、完成度和下一轮任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮实现、浏览器 QA 和限制 |
| `docs/project/qa.md` | QA 记录 | 记录 TDD RED/GREEN、目标测试、全量测试、构建和浏览器验证 |

## 2026-06-30：第六十六轮道路铺设财政成本

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/economy/construction.ts` | 经济系统 | 新增道路财政成本与报价接口，区分泥路、石板路和桥路成本 |
| `src/integration/GameRuntime.ts` | 运行时接口 | `placeRoad`/`placeRoadPath` 接入财政扣款、余额不足跳过和已有道路不重复扣费 |
| `src/integration/GameRuntime.test.ts` | 自动测试 | 覆盖铺路扣银两、拖拽路径按可支付部分铺设、已有道路不要求财政 |
| `docs/project/task-board.md` | 任务看板 | 记录 `ROAD-FISCAL-COST-01` 已完成 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第六十六轮进展、完成度和下一轮任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮实现、浏览器 QA 和限制 |
| `docs/project/qa.md` | QA 记录 | 记录 TDD RED/GREEN、目标测试、全量测试、构建和浏览器验证 |

## 2026-06-30：第六十五轮道路拆除工具

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/GameRuntime.ts` | 运行时接口 | 新增 `removeRoadPath` 批量拆路 API，扩展 `BuildTool` 为 `demolish-road` |
| `src/integration/GameRuntime.test.ts` | 自动测试 | 覆盖批量拆除已有道路，并汇总无路和越界跳过格 |
| `src/App.tsx` | UI 工具入口 | 城建面板新增“拆路”按钮和模式提示，明确暂不拆建筑 |
| `src/components/SimulationCanvas.tsx` | UI 交互层 | 拆路工具拖拽时调用 `removeRoadPath`，复用格点插值和道路拖拽输入状态 |
| `docs/project/task-board.md` | 任务看板 | 记录 `ROAD-DEMOLISH-01` 已完成 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第六十五轮进展、完成度和下一轮任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮实现、浏览器 QA 和限制 |
| `docs/project/qa.md` | QA 记录 | 记录 TDD RED/GREEN、目标测试、全量测试、构建和浏览器验证 |

## 2026-06-30：第六十四轮道路拖拽连续铺设

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/GameRuntime.ts` | 运行时接口 | 新增 `placeRoadPath` 批量铺路 API，汇总成功、建筑占用、无效地形、越界和无变化格 |
| `src/integration/GameRuntime.test.ts` | 自动测试 | 覆盖拖拽路径能连续铺设多格，并在遇到建筑占用时保留有效路段 |
| `src/components/SimulationCanvas.tsx` | UI 交互层 | 道路工具拖拽时调用批量铺路入口，使用 `gridLine` 补齐中间格，不再触发相机平移 |
| `docs/project/task-board.md` | 任务看板 | 记录 `ROAD-DRAG-BUILD-01` 已完成 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第六十四轮进展、完成度和下一轮任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮实现、浏览器 QA 和限制 |
| `docs/project/qa.md` | QA 记录 | 记录 TDD RED/GREEN、目标测试、全量测试、构建和浏览器验证 |

## 2026-06-30：第六十三轮建筑试放资源门禁

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/GameRuntime.ts` | 运行时接口 | `previewBuildingPlacement` 接入正式营造成本报价，资源不足时返回不可营造、缺口原因和 construction quote |
| `src/integration/GameRuntime.test.ts` | 自动测试 | 覆盖地块可放但仓储材料不足时，preview 在规划阶段即变为 invalid 并保留 footprint |
| `docs/project/task-board.md` | 任务看板 | 记录 `BUILD-PLACEMENT-AFFORDABILITY-01` 已完成 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第六十三轮进展、完成度和下一轮任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮实现、限制和集成边界 |
| `docs/project/qa.md` | QA 记录 | 记录 TDD RED/GREEN 和目标回归结果 |

## 2026-06-30：第六十二轮建筑试放状态机接入

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/ui/placement/runtimePlacement.ts` | UI/运行时适配层 | 将 Runtime placement preview 包装为 `PlacementValidator`，并从 `PlacementState` 派生真实预览 |
| `src/ui/placement/runtimePlacement.test.ts` | 自动测试 | 覆盖 Runtime validator、placing preview、idle/no-anchor 无 preview |
| `src/ui/index.ts` | UI 导出边界 | 导出 runtime placement 适配层，供组件统一使用 |
| `src/components/SimulationCanvas.tsx` | UI 交互层 | 建筑试放 move/rotate/confirm/cancel/resume 改为 `PlacementController` 驱动 |
| `docs/project/task-board.md` | 任务看板 | 记录 `BUILD-PLACEMENT-CONTROLLER-01` 已完成 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第六十二轮进展、完成度和下一轮任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮实现、浏览器 QA 结论和限制 |
| `docs/project/qa.md` | QA 记录 | 记录 TDD RED/GREEN、目标回归、全量测试、构建和浏览器验证结果 |

## 2026-06-30：第六十一轮建筑工具动态试放预览

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/GameRuntime.ts` | 运行时接口 | 新增 `previewBuildingPlacement`，无副作用输出 footprint、入口、冲突格和中文原因 |
| `src/integration/GameRuntime.test.ts` | 自动测试 | 固定 preview 可营造、道路占用、入口未连路和无副作用行为 |
| `src/components/SimulationCanvas.tsx` | UI 交互层 | 建筑工具 hover 时调用 Runtime preview 并渲染试放层；R 旋转后重新校验原位置 |
| `src/styles.css` | 视觉样式 | 新增 placement preview 状态条、有效/无效 footprint 与 blocked cell 样式 |
| `docs/project/task-board.md` | 任务看板 | 记录 `BUILD-PLACEMENT-PREVIEW-01` 已完成 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第六十一轮进展、完成度和下一轮任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮实现、浏览器 QA 结论和限制 |
| `docs/project/qa.md` | QA 记录 | 记录 TDD RED/GREEN、全量测试、构建和浏览器验证结果 |

## 2026-06-30：第六十轮治理推荐 footprint 预览

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/stageAdvisor.ts` | 城市顾问数据层 | 推荐建筑执行结果新增真实 `footprint`、入口和旋转占位字段，overlay 新增 `cells` 表达占地/入口/后续冲突格 |
| `src/components/SimulationCanvas.tsx` | UI 渲染层 | 阶段顾问 overlay 开始渲染占地 cell，不再只有 marker/path/area |
| `src/styles.css` | 视觉样式 | 新增等距菱形 footprint、入口高亮、阻挡格预留样式与轻脉冲动效 |
| `src/integration/stageAdvisor.test.ts` | 自动测试 | 固定“营造集市”推荐输出 3×2 footprint、入口 cell 和 overlay cells |
| `docs/project/task-board.md` | 任务看板 | 记录 `GOVERNANCE-PLACEMENT-FOOTPRINT-01` 已完成 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第六十轮进展、完成度和下一轮任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮实现、浏览器 QA 结论和限制 |
| `docs/project/qa.md` | QA 记录 | 记录 TDD RED/GREEN、全量测试、构建和浏览器验证结果 |

## 2026-06-29：第五十九轮治理卡推荐落点提示

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/stageAdvisor.ts` | 城市顾问数据层 | 新增 placement 覆盖点和 `withRecommendationExecutionOverlay`，把建议落点/入口注入地图图层 |
| `src/integration/stageAdvisor.test.ts` | 自动测试 | 验证 placement 点优先进入覆盖图层，避免被热点点位裁掉 |
| `src/App.tsx` | 主界面 | 点击建筑类治理建议后保留推荐对象，地图显示建议落点，建造菜单标出推荐建筑 |
| `src/styles.css` | 界面样式 | 增加推荐落点 marker 与推荐建筑按钮样式 |
| `docs/project/task-board.md` | 任务看板 | 记录 `GOVERNANCE-PLACEMENT-FOCUS-01` 已完成 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第五十九轮进展、完成度和下一轮任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录推荐落点提示和浏览器 QA 修复事实 |
| `docs/project/qa.md` | QA 记录 | 记录本轮目标测试、浏览器验证、全量测试和构建结果 |

## 2026-06-29：第五十八轮建造菜单成本与缺口

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/content/runtimeBuildings.ts` | 内容/运行时菜单 | 新增 `getRuntimeBuildingMenuState`，根据当前财政和城市仓储输出成本、缺口和可建状态 |
| `src/content/buildings.test.ts` | 自动测试 | 验证菜单状态显示营造成本、材料缺口和银两缺口 |
| `src/App.tsx` | 主界面 | 建造菜单按钮显示银两/材料成本，资源不足时禁用并提示缺口 |
| `src/styles.css` | 界面样式 | 增加建造菜单成本和缺口文本样式 |
| `src/integration/GameRuntime.ts` | 运行时出口 | 重新导出 `getRuntimeBuildingMenuState` 供 UI 使用 |
| `docs/project/task-board.md` | 任务看板 | 记录 `BUILD-MENU-COST-01` 已完成 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第五十八轮进展、完成度和下一轮任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录建造菜单成本接入事实 |
| `docs/project/qa.md` | QA 记录 | 记录本轮目标测试、全量测试和构建结果 |

## 2026-06-29：第五十七轮正式建筑营造成本

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/economy/construction.ts` | 经济系统 | 新增建筑营造成本、报价、城市仓储材料缺口和扣费逻辑 |
| `src/simulation/economy/index.ts` | 经济模块出口 | 导出 construction 模块 |
| `src/integration/GameRuntime.ts` | 运行时集成 | 建筑放置先校验地块，再扣银两/材料，资源不足时拒绝落建筑 |
| `src/integration/GameRuntime.test.ts` | 自动测试 | 验证营造成功扣费、材料不足不落建筑且不扣银两 |
| `src/integration/stageAdvisor.ts` | 城市顾问数据层 | 治理卡营造条件读取营造成本，显示银两/材料缺口 |
| `src/integration/stageAdvisor.test.ts` | 自动测试 | 验证治理卡推荐建筑会显示中文材料缺口 |
| `docs/project/task-board.md` | 任务看板 | 记录 `CONSTRUCTION-COST-01` 已完成 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第五十七轮进展、完成度和下一轮任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录正式营造成本集成事实 |
| `docs/project/qa.md` | QA 记录 | 记录本轮目标测试、全量测试和构建结果 |

## 2026-06-29：第五十六轮治理卡推荐营造可执行性

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/stageAdvisor.ts` | 城市顾问数据层 | 已解锁建筑推荐继续诊断连续空地和入口道路，并输出营造条件 |
| `src/integration/stageAdvisor.test.ts` | 自动测试 | 验证推荐建筑有空地/道路时可执行、无道路入口时给出原因 |
| `src/App.tsx` | 主界面 | 治理卡显示营造条件，不可放置时点击推荐不会切换到建筑工具 |
| `docs/project/task-board.md` | 任务看板 | 记录 `CITY-RECOMMENDATION-EXECUTION-01` 已完成 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第五十六轮进展、完成度、限制和下一轮任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录推荐营造可执行性集成事实 |
| `docs/project/qa.md` | QA 记录 | 记录本轮目标测试、全量测试和构建结果 |

## 2026-06-29：第五十五轮治理卡推荐阶段可用性

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/stageAdvisor.ts` | 城市顾问数据层 | 推荐对象携带当前阶段、所需阶段和解锁状态；未解锁建筑推荐降级为查看图层 |
| `src/integration/stageAdvisor.test.ts` | 自动测试 | 验证木作坊在水乡镇被解释为未解锁，到商贸镇后恢复建筑推荐 |
| `src/App.tsx` | 主界面 | 治理卡显示阶段限制，点击推荐时二次检查建筑是否已解锁 |
| `docs/project/task-board.md` | 任务看板 | 记录 `CITY-RECOMMENDATION-UNLOCK-01` 已完成 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第五十五轮进展、完成度和下一轮任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录推荐阶段可用性集成事实 |
| `docs/project/qa.md` | QA 记录 | 记录本轮目标测试、全量测试和构建结果 |

## 2026-06-29：第五十四轮活动压力分因推荐

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/stageAdvisor.ts` | 城市顾问数据层 | 城市活动压力治理卡按货拥、服务热和道压分别推荐补仓储、补服务点或铺路分流 |
| `src/integration/stageAdvisor.test.ts` | 自动测试 | 覆盖货运拥堵、服务热度和通勤道压三类推荐动作 |
| `docs/project/task-board.md` | 任务看板 | 记录 `CITY-ACTIVITY-RECOMMENDATION-01` 已完成 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第五十四轮进展、完成度和下一轮任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录活动压力分因推荐集成事实 |
| `docs/project/qa.md` | QA 记录 | 记录本轮目标测试、全量测试和构建结果 |

## 2026-06-29：第五十三轮道路格活动压力投射

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/stageAdvisor.ts` | 城市顾问数据层 | 读取 agent 剩余路径，将活动压力聚合到真实道路格并输出 `货路/服路/通路/道压` 承压点 |
| `src/integration/stageAdvisor.test.ts` | 自动测试 | 验证多条服务/货运路径压到道路格时会生成可定位承压点和压力指标 |
| `src/App.tsx` | 主界面 | 阶段面板“道压”指标优先定位道路承压点 |
| `docs/project/task-board.md` | 任务看板 | 记录 `CITY-ROAD-PRESSURE-CELLS-01` 已完成 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第五十三轮进展、完成度和下一轮任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录道路格活动压力投射的集成事实 |
| `docs/project/qa.md` | QA 记录 | 记录本轮目标测试、全量测试和构建结果 |

## 2026-06-29：第五十二轮城市活动压力治理

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/stageAdvisor.ts` | 城市顾问数据层 | 活动图层新增道路压力、服务热度、货运拥堵指标，并在压力集中时生成治理卡 |
| `src/integration/stageAdvisor.test.ts` | 自动测试 | 覆盖集中服务访问和货运活动触发“城市活动压力”治理卡 |
| `src/App.tsx` | 主界面 | 阶段面板活动指标改为道压、货拥、服务热，并支持点击定位对应热区 |
| `docs/project/task-board.md` | 任务看板 | 记录 `CITY-ACTIVITY-PRESSURE-01` 已完成 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第五十二轮进展、完成度和下一轮任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录活动压力治理卡集成事实 |
| `docs/project/qa.md` | QA 记录 | 记录本轮阶段顾问目标测试结果 |

## 2026-06-29：第五十一轮城市活动热力图层

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/stageAdvisor.ts` | 城市顾问数据层 | 新增 `activity` 图层，汇总服务访问、通勤、返家和货运活动为热力点、路径和指标 |
| `src/integration/stageAdvisor.test.ts` | 自动测试 | 验证服务访问、工人通勤和货运路线会进入活动热力图层 |
| `src/App.tsx` | 主界面 | 阶段图层按钮和指标读数支持活动图层，并可点击定位活动/货运/服务热点 |
| `src/styles.css` | 界面样式 | 增加活动图层 marker 样式 |
| `docs/project/task-board.md` | 任务看板 | 记录 `CITY-ACTIVITY-HEATMAP-01` 已完成 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第五十一轮进展、完成度和下一轮任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录城市活动热力图层集成事实 |
| `docs/project/qa.md` | QA 记录 | 记录本轮目标测试、全量测试和构建结果 |

## 2026-06-29：第五十轮旧群岛引擎迁入 legacy

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/legacy/game/**` | legacy 旧原型 | 归档旧固定岛屿材料、掉落、建造、存档和静态视觉 QA 代码 |
| `src/legacy/game/MaterialRow.tsx` | legacy UI | 归档旧材料行组件，正式 `src/components` 不再保留旧材料 UI |
| `src/legacy/archipelago/IslandCanvas.tsx` | legacy 视图 | 改为引用 `src/legacy/game/**`，不再依赖正式 `src/game` 路径 |
| `src/legacy/game/legacy.test.ts` | 自动测试 | 防止 `src/game` 和正式 `src/components/MaterialRow.tsx` 回流 |
| `src/legacy/README.md` | legacy 边界说明 | 增加旧 game 引擎归档范围和禁止主线导入说明 |
| `docs/project/task-board.md` | 任务看板 | 记录 `LEGACY-GAME-SCOPE-01` 已完成 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第五十轮进展、旧方向风险和下一轮任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录旧群岛引擎迁入 legacy 的集成事实 |
| `docs/project/qa.md` | QA 记录 | 记录本轮目标测试、全量测试和构建结果 |

## 2026-06-29：第四十九轮历史物流订单归档

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/contracts.ts` | 公共契约 | 新增 `LogisticsArchiveState` 与 `SimulationSnapshot.logisticsArchive`，用于汇总归档订单 |
| `src/simulation/economy/logistics.ts` | 物流系统 | delivered/cancelled 订单按保留窗口进入归档汇总，效率统计读取当前订单与归档历史 |
| `src/simulation/economy/economy.test.ts` | 自动测试 | 验证历史订单归档、取消原因计数和效率统计保持正确 |
| `src/qa/stressScenario.ts` | 长稳 QA | 压力摘要新增 `archivedOrders` 和归档数值检查，当前订单表上限收紧到 2000 |
| `src/qa/stressScenario.test.ts` | 长稳测试 | 断言长稳期间归档确实发生 |
| `docs/project/task-board.md` | 任务看板 | 记录 `LOGISTICS-ORDER-ARCHIVE-01` 已完成 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第四十九轮进展、完成度和下一轮任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录历史订单归档集成事实 |
| `docs/project/qa.md` | QA 记录 | 记录本轮目标测试、长稳、全量测试和构建结果 |

## 2026-06-29：第四十八轮承运人货运生命周期

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/contracts.ts` | 公共契约 | `AgentEntity` 新增 `cargoIntent`，记录承运人订单、资源、数量、源/目的建筑和取货/送货阶段 |
| `src/simulation/economy/logistics.ts` | 物流系统 | 分配、取货、送货、交付和取消时维护承运人货运意图 |
| `src/simulation/economy/economy.test.ts` | 自动测试 | 验证承运人取货阶段、送货阶段和交付后清理行为 |
| `src/rendering/visuals.ts` | 动态渲染 | 运输工具根据 `cargoIntent.phase` 显示取货/载货状态符号 |
| `docs/project/task-board.md` | 任务看板 | 记录 `LOGISTICS-CARRIER-LIFECYCLE-01` 已完成 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第四十八轮进展、完成度和下一轮任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录承运人货运生命周期的集成事实 |
| `docs/project/qa.md` | QA 记录 | 记录本轮目标测试、长稳、全量测试和构建结果 |

## 2026-06-29：第四十七轮治理卡原因与推荐操作

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/stageAdvisor.ts` | 城市顾问数据层 | 治理卡新增原因与结构化推荐操作，包含推荐图层、工具和建筑类型 |
| `src/integration/stageAdvisor.test.ts` | 自动测试 | 验证服务缺口、道路缺口和物流热点治理卡包含推荐操作 |
| `src/App.tsx` | 主界面 | 瓶颈面板显示原因，并提供“定位”和“推荐操作”按钮，可切换图层、铺路或营造工具 |
| `src/styles.css` | 界面样式 | 增加瓶颈卡原因文本与操作按钮样式 |
| `docs/project/task-board.md` | 任务看板 | 记录 `CITY-GOVERNANCE-ACTION-01` 已完成 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第四十七轮进展、UI/UX 完成度和下一轮任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录治理卡可执行化的集成事实 |
| `docs/project/qa.md` | QA 记录 | 记录本轮目标测试、全量测试和构建结果 |

## 2026-06-29：第四十六轮服务访问驱动街区热度

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/districts/prosperity.ts` | 街区繁荣系统 | 读取真实居民 `service-visit` agent，将市场/药铺/书院/戏台等服务访问转化为街区繁荣和人流加成 |
| `src/simulation/districts/prosperity.test.ts` | 自动测试 | 验证相同建筑条件下，活跃居民服务访问会提高街区热度和 footTraffic |
| `docs/project/task-board.md` | 任务看板 | 记录 `DISTRICT-SERVICE-VISIT-HEAT-01` 已完成 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第四十六轮进展、完成度和下一轮任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录服务访问驱动街区热度的集成事实 |
| `docs/project/qa.md` | QA 记录 | 记录本轮目标测试、全量测试和构建结果 |

## 2026-06-29：第四十五轮居民抵达后服务结算

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/contracts.ts` | 公共契约 | `AgentEntity` 新增 `serviceIntent`，记录居民服务/购物出行抵达后需要完成的结算内容 |
| `src/simulation/economy/service.ts` | 经济服务系统 | 服务访问改为抵达目标建筑后才扣库存、扣家庭收入、增加税收、恢复需求并返家 |
| `src/simulation/economy/economy.test.ts` | 自动测试 | 覆盖市场购买、日用品购买、药铺、书院、戏台、服务容量和综合物流-市场闭环的新两段式行为 |
| `src/simulation/core/SimulationEngine.ts` | 模拟主循环 | 经济/服务系统更新后再迁出；`migrationOutThreshold: 0` 明确为禁用迁出 |
| `src/qa/stressScenario.ts` | 长稳 QA 基准 | 500 户满规模场景下历史订单灰盒上限校准为 20000；第四十九轮已进一步引入归档并收紧当前订单表上限 |
| `docs/project/task-board.md` | 任务看板 | 记录 `SERVICE-ARRIVAL-CHECKOUT-01` 已完成 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第四十五轮进展、完成度和下一轮任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮服务结算、主循环和长稳阈值调整 |
| `docs/project/qa.md` | QA 记录 | 记录本轮全量测试、构建和长稳结果 |

## 2026-06-29：第四十四轮居民服务/购物出行可视化

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/economy/service.ts` | 服务系统 | 服务成功时生成居民访问 agent，推进到服务点后返家并清理 |
| `src/simulation/economy/economy.test.ts` | 自动测试 | 验证服务访问生成、移动、返家、去重和清理 |
| `docs/project/task-board.md` | 任务看板 | 标记 SERVICE-VISIT-PATH-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第四十四轮启动、完成、验证和限制 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新城市模拟、动态引擎和人口生命周期完成度 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标测试和全量验证 |

## 2026-06-29：第四十三轮工人返家循环

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/contracts.ts` | 公共契约 | AgentEntity 增加 activityStartedTick，支持活动持续时间判断 |
| `src/simulation/core/SimulationEngine.ts` | 核心模拟 | 工人完成固定工作班次后生成返家路径并回到 home 状态 |
| `src/simulation/core/SimulationEngine.test.ts` | 自动测试 | 验证上班、工作、返家、回家完整路径循环 |
| `docs/project/task-board.md` | 任务看板 | 标记 WORKER-RETURN-HOME-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第四十三轮启动、完成、验证和限制 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新城市模拟、动态引擎和人口生命周期完成度 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标测试和全量验证 |

## 2026-06-29：第四十二轮工人通勤路径接入

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/core/SimulationEngine.ts` | 核心模拟 | 工人分配岗位后生成共享道路通勤路径，并逐 tick 移动到雇主入口 |
| `src/simulation/core/SimulationEngine.test.ts` | 自动测试 | 验证工人通勤路径、位置推进和抵达后 working 状态 |
| `docs/project/task-board.md` | 任务看板 | 标记 WORKER-COMMUTE-PATH-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第四十二轮启动、完成和行为边界 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新城市模拟、动态引擎和人口生命周期完成度 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标测试和全量验证 |

## 2026-06-29：第四十一轮物流共享路径接入

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/world/movementPath.ts` | 共享路径服务 | 新增严格寻路入口、无路不兜底选项和道路必需规则 |
| `src/simulation/world/movementPath.test.ts` | 自动测试 | 验证共享路径无路失败和桥路过水 |
| `src/simulation/economy/logistics.ts` | 物流系统 | RoadRoutePlanner 复用共享路径服务，不再自带分叉 BFS |
| `src/simulation/economy/economy.test.ts` | 自动测试 | 验证货运不能穿越普通水面或建筑占用格 |
| `docs/project/task-board.md` | 任务看板 | 标记 LOGISTICS-SHARED-PATH-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第四十一轮启动、完成和行为边界 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新城市模拟完成度和下一轮默认任务 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标测试和全量验证 |

## 2026-06-28：第三十六轮城市阶段图层指标定位

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/App.tsx` | 主界面 | 阶段面板图层指标可点击并定位对应覆盖点 |
| `src/styles.css` | 界面样式 | 将图层指标读数改为可交互按钮 |
| `docs/project/task-board.md` | 任务看板 | 标记 CITY-STAGE-OVERLAY-METRIC-FOCUS-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第三十六轮启动、完成和验证结果 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新 UI/UX 完成度和下一轮任务 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标测试和后续全量验证 |

## 2026-06-28：第三十五轮城市阶段面板图层指标

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/App.tsx` | 主界面 | 阶段面板显示当前打开图层的结构化指标 |
| `src/styles.css` | 界面样式 | 增加阶段图层指标读数样式 |
| `docs/project/task-board.md` | 任务看板 | 标记 CITY-STAGE-OVERLAY-PANEL-METRICS-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第三十五轮启动、完成和验证结果 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新 UI/UX 完成度和下一轮任务 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标测试和后续全量验证 |

## 2026-06-28：第三十四轮城市阶段覆盖图层结构化指标

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/stageAdvisor.ts` | 阶段顾问数据层 | 覆盖层增加结构化 metrics 字段 |
| `src/integration/stageAdvisor.test.ts` | 自动测试 | 验证四类图层输出结构化指标 |
| `docs/project/task-board.md` | 任务看板 | 标记 CITY-STAGE-OVERLAY-METRICS-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第三十四轮启动、完成和验证结果 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新 UI/UX 完成度和下一轮任务 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标测试和后续全量验证 |

## 2026-06-28：第三十三轮城市阶段覆盖图层摘要

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/stageAdvisor.ts` | 阶段顾问数据层 | 覆盖层增加摘要字段并为四类图层生成摘要 |
| `src/integration/stageAdvisor.test.ts` | 自动测试 | 验证住房、服务、物流和道路图层摘要 |
| `src/components/SimulationCanvas.tsx` | 地图画布 | 渲染覆盖图层摘要条 |
| `src/styles.css` | 界面样式 | 增加覆盖图层摘要条样式 |
| `docs/project/task-board.md` | 任务看板 | 标记 CITY-STAGE-OVERLAY-SUMMARY-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第三十三轮启动、完成和验证结果 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新 UI/UX 完成度和下一轮任务 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标测试和后续全量验证 |

## 2026-06-28：第三十二轮城市阶段物流热点诊断

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/stageAdvisor.ts` | 阶段顾问数据层 | 物流图层统计未完成订单端点并生成热点标记 |
| `src/integration/stageAdvisor.test.ts` | 自动测试 | 验证多条订单压到同一建筑时生成物流热点 |
| `docs/project/task-board.md` | 任务看板 | 标记 CITY-STAGE-LOGISTICS-HOTSPOT-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第三十二轮启动、完成和验证结果 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新 UI/UX 完成度和下一轮任务 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标测试和后续全量验证 |

## 2026-06-28：第三十一轮城市阶段道路缺口诊断

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/stageAdvisor.ts` | 阶段顾问数据层 | 道路图层按建筑功能细分缺路标签 |
| `src/integration/stageAdvisor.test.ts` | 自动测试 | 验证缺路住宅和缺路仓储标签 |
| `docs/project/task-board.md` | 任务看板 | 标记 CITY-STAGE-ROAD-GAP-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第三十一轮启动、完成和验证结果 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新 UI/UX 完成度和下一轮任务 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标测试和后续全量验证 |

## 2026-06-27：第三十轮城市阶段服务缺口诊断

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/stageAdvisor.ts` | 阶段顾问数据层 | 服务图层推导未被服务范围覆盖的住宅 |
| `src/integration/stageAdvisor.test.ts` | 自动测试 | 验证远离服务范围的住宅被标为“缺服务” |
| `docs/project/task-board.md` | 任务看板 | 标记 CITY-STAGE-SERVICE-GAP-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第三十轮启动、完成和验证结果 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新 UI/UX 完成度和下一轮任务 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标测试和后续全量验证 |

## 2026-06-27：第二十九轮城市阶段服务范围覆盖

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/stageAdvisor.ts` | 阶段顾问数据层 | 覆盖层支持范围区域，服务图层生成服务半径 |
| `src/integration/stageAdvisor.test.ts` | 自动测试 | 验证服务图层包含服务点和范围区域 |
| `src/components/SimulationCanvas.tsx` | 地图画布 | 渲染覆盖层范围椭圆和标签 |
| `src/styles.css` | 界面样式 | 增加服务范围半透明区域样式 |
| `docs/project/task-board.md` | 任务看板 | 标记 CITY-STAGE-SERVICE-RANGE-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第二十九轮启动、完成和验证结果 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新 UI/UX 完成度和下一轮任务 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标测试和后续全量验证 |

## 2026-06-27：第二十八轮城市阶段物流线路覆盖

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/stageAdvisor.ts` | 阶段顾问数据层 | 覆盖层支持路径线段，物流图层生成订单线路 |
| `src/integration/stageAdvisor.test.ts` | 自动测试 | 验证物流图层包含发货点、收货点和线路 |
| `src/components/SimulationCanvas.tsx` | 地图画布 | 渲染覆盖层路径、方向和标签 |
| `src/styles.css` | 界面样式 | 增加覆盖层线路、箭头和路径标签样式 |
| `docs/project/task-board.md` | 任务看板 | 标记 CITY-STAGE-LOGISTICS-PATH-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第二十八轮启动、完成和验证结果 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新 UI/UX 完成度和下一轮任务 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标测试和后续全量验证 |

## 2026-06-27：第二十七轮城市阶段覆盖图层开关

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/stageAdvisor.ts` | 阶段顾问数据层 | 新增住房、服务、物流、道路四类地图覆盖图层推导 |
| `src/integration/stageAdvisor.test.ts` | 自动测试 | 验证四类图层的关键覆盖点和标签 |
| `src/App.tsx` | 主界面 | 阶段面板增加图层开关，并随快照刷新打开的覆盖层 |
| `src/styles.css` | 界面样式 | 增加图层开关样式和服务/物流/道路标记颜色 |
| `docs/project/task-board.md` | 任务看板 | 标记 CITY-STAGE-LAYER-SWITCH-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第二十七轮启动、完成和验证结果 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新 UI/UX 完成度和下一轮任务 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标测试和后续全量验证 |

## 2026-06-27：第二十六轮城市阶段分层覆盖标记

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/stageAdvisor.ts` | 阶段顾问数据层 | 覆盖点增加类型、短标签和坐标，支持分层显示 |
| `src/integration/stageAdvisor.test.ts` | 自动测试 | 验证人口、吸引力和街区覆盖点的类型与标签 |
| `src/components/SimulationCanvas.tsx` | 地图画布 | 按覆盖点类型渲染分层标记 |
| `src/styles.css` | 界面样式 | 为住房、外来人口、瓶颈和街区核心设置不同标记颜色 |
| `docs/project/task-board.md` | 任务看板 | 标记 CITY-STAGE-LAYER-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第二十六轮启动、完成和验证结果 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新 UI/UX 完成度和下一轮任务 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标测试和后续全量验证 |

## 2026-06-27：第二十五轮城市阶段地图覆盖提示

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/stageAdvisor.ts` | 阶段顾问数据层 | 从快照按阶段条件推导地图覆盖点 |
| `src/integration/stageAdvisor.test.ts` | 自动测试 | 验证人口、吸引力和街区覆盖点推导 |
| `src/components/SimulationCanvas.tsx` | 地图画布 | 渲染阶段顾问覆盖标记 |
| `src/App.tsx` | 主界面 | 阶段顾问点击后设置地图覆盖 |
| `src/styles.css` | 界面样式 | 增加阶段覆盖标记样式 |
| `docs/project/task-board.md` | 任务看板 | 标记 CITY-STAGE-OVERLAY-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第二十五轮启动、完成和验证结果 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新 UI/UX 完成度和下一轮任务 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标测试和后续全量验证 |

## 2026-06-27：第二十四轮城市阶段原因诊断

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/content/runtimeBuildings.ts` | 内容运行时 | 阶段目标条件增加基于指标的具体诊断 |
| `src/content/buildings.test.ts` | 自动测试 | 验证普通阶段目标和具体卡点诊断 |
| `src/App.tsx` | 主界面 | 阶段顾问点击 toast 复用具体诊断原因 |
| `src/styles.css` | 界面样式 | 阶段按钮内显示诊断文本 |
| `docs/project/task-board.md` | 任务看板 | 标记 CITY-STAGE-DIAGNOSIS-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第二十四轮启动、完成和验证结果 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新 UI/UX 完成度和下一轮任务 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标测试和后续全量验证 |

## 2026-06-27：第二十三轮城市阶段可点击顾问

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/content/runtimeBuildings.ts` | 内容运行时 | 阶段目标条件增加顾问建议文案 |
| `src/content/buildings.test.ts` | 自动测试 | 验证阶段目标建议和条件仍保持一致 |
| `src/App.tsx` | 主界面 | 阶段条件可点击，按人口/吸引力/街区缺口触发下一步操作 |
| `src/styles.css` | 界面样式 | 阶段条件从静态块改为可交互按钮 |
| `docs/project/task-board.md` | 任务看板 | 标记 CITY-STAGE-ADVISOR-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第二十三轮启动、完成和验证结果 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新 UI/UX 完成度和下一轮任务 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标测试和后续全量验证 |

## 2026-06-27：第二十二轮旧群岛视图归档开关

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/legacy/game/legacy.ts` | 旧原型边界 | 定义旧群岛视图启用参数和静态 QA 参数 |
| `src/legacy/game/legacy.test.ts` | 自动测试 | 验证旧群岛渲染默认关闭，只能显式启用 |
| `src/legacy/archipelago/IslandCanvas.tsx` | 旧视图组件 | 默认显示归档提示，只有 legacy/QA 参数才启动旧 Pixi 渲染；第三十七轮后已迁出正式 components 目录 |
| `src/styles.css` | 界面样式 | 增加旧群岛归档提示样式 |
| `docs/project/task-board.md` | 任务看板 | 标记 LEGACY-ARCHIPELAGO-GATE-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第二十二轮启动、完成和验证结果 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新旧方向风险、UI/UX 完成度和下一轮任务 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标测试和后续全量验证 |

## 2026-06-27：第二十一轮旧听歌掉落原型隔离

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/legacy/game/engine.ts` | 旧原型兼容层 | 默认关闭听歌产生普通材料，保留显式 legacy 选项 |
| `src/legacy/game/engine.test.ts` | 自动测试 | 验证默认听歌不刷普通材料，旧行为只在 legacy 选项下可用 |
| `docs/project/task-board.md` | 任务看板 | 标记 LEGACY-LISTENING-DROPS-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第二十一轮启动、完成和验证结果 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新旧方向风险、UI/UX 完成度和下一轮任务 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标测试和后续全量验证 |

## 2026-06-27：第二十轮音乐奖励入口降级

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/App.tsx` | 主界面 | 听歌奖励从常驻卡片改为默认收起的“轻奖励”入口，展开后才可模拟 |
| `src/styles.css` | 界面样式 | 增加轻奖励收起/展开状态样式 |
| `docs/project/task-board.md` | 任务看板 | 标记 OPTIONAL-MUSIC-ENTRY-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第二十轮启动、完成和验证结果 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新旧方向风险、UI/UX 完成度和下一轮任务 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标检查和后续全量验证 |

## 2026-06-27：第十九轮城市阶段晋升提示

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/content/runtimeBuildings.ts` | 内容运行时 | 增加阶段阈值、阶段进度解释和下一阶段条件 |
| `src/content/buildings.test.ts` | 自动测试 | 验证阶段目标会列出人口、吸引力和街区要求 |
| `src/integration/GameRuntime.ts` | 运行时集成 | 统一导出阶段目标接口供 UI 使用 |
| `src/App.tsx` | 主界面 | 增加阶段目标面板，显示当前阶段、下一阶段和晋升条件 |
| `src/styles.css` | 界面样式 | 增加阶段目标面板样式 |
| `docs/project/task-board.md` | 任务看板 | 标记 CITY-STAGE-GOALS-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第十九轮启动、完成和验证结果 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新 UI/UX 完成度和下一轮任务 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标测试和后续全量验证 |

## 2026-06-27：第十八轮候选外来人口道路优先寻路

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/core/SimulationEngine.ts` | 模拟核心 | 候选人口进城路径改为读取网格、道路优先、避开水面和建筑占用，失败时退回直线 |
| `src/simulation/core/SimulationEngine.test.ts` | 自动测试 | 验证候选人口会绕到道路上进入住宅，而非横穿普通地块 |
| `docs/project/task-board.md` | 任务看板 | 标记 POP-MIGRATION-ROAD-PATH-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第十八轮启动、完成和验证结果 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新城市模拟和人口生命周期完成度 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标测试和后续全量验证 |

## 2026-06-27：第十七轮城建菜单阶段解锁

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/content/runtimeBuildings.ts` | 内容运行时 | 增加城市阶段标签、阶段推导、建筑解锁判断和菜单状态 |
| `src/content/buildings.test.ts` | 自动测试 | 验证 starter 菜单会按阶段锁定木作坊并在商贸镇解锁 |
| `src/integration/GameRuntime.ts` | 运行时集成 | 放置建筑前检查当前城市阶段，拒绝未解锁建筑 |
| `src/integration/GameRuntime.test.ts` | 自动测试 | 验证绕过 UI 放置未解锁建筑会失败 |
| `src/App.tsx` | 主界面 | 城建面板显示当前阶段，并把未解锁建筑置灰 |
| `src/styles.css` | 界面样式 | 增加锁定建筑按钮样式 |
| `docs/project/task-board.md` | 任务看板 | 标记 BUILD-MENU-STAGE-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第十七轮启动、完成和验证结果 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新建筑体系和 UI/UX 完成度 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标测试和后续全量验证 |

## 2026-06-27：第十六轮候选外来人口进城路径

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/contracts.ts` | 模拟公共契约 | 候选外来人口增加 `walking` 状态、路径和路径进度 |
| `src/simulation/core/SimulationEngine.ts` | 模拟核心 | 候选人从停留点走到目标住宅后才正式入住，并把路上家庭计入住房预占 |
| `src/simulation/core/SimulationEngine.test.ts` | 自动测试 | 验证候选人先等待、再沿路径移动，最终才生成家庭与就业 |
| `src/integration/cityNotices.ts` | 城市反馈 | 小事流区分“城口等房”和“正在进城”两种迁入状态 |
| `src/integration/cityNotices.test.ts` | 自动测试 | 验证正在进城的候选人可生成定位故事 |
| `docs/project/task-board.md` | 任务看板 | 标记 POP-MIGRATION-PATH-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第十六轮启动、完成和验证结果 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新人口生命周期、城市模拟和动态引擎完成度 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标测试和后续全量验证 |

## 2026-06-27：第十五轮街区繁荣系统

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/contracts.ts` | 模拟公共契约 | 增加街区繁荣状态、活动等级、视觉提示和城市街区指标 |
| `src/simulation/core/snapshot.ts` | 初始快照 | 初始化街区列表为空数组 |
| `src/simulation/districts/prosperity.ts` | 模拟数据层 | 按建筑街区亲和、等级、状态和相邻关系推导街区繁荣 |
| `src/simulation/districts/index.ts` | 模块出口 | 暴露街区繁荣推导方法 |
| `src/simulation/districts/prosperity.test.ts` | 自动测试 | 验证街区分组、繁荣评分、视觉提示和指标汇总 |
| `src/integration/GameRuntime.ts` | 运行时集成 | 每次快照刷新时派生街区数据并写入指标 |
| `src/integration/GameRuntime.test.ts` | 自动测试 | 验证启动城镇能产出街区与街区指标 |
| `src/rendering/types.ts` | 渲染契约 | 增加 `district` 可渲染实体和 `districts` 同步统计 |
| `src/rendering/layers.ts` | 渲染层级 | 增加道路之上、建筑之下的 `districts` 图层 |
| `src/rendering/visuals.ts` | 程序化视觉 | 增加街区地表暖光、灯点和人流轻表现 |
| `src/rendering/DynamicScene.ts` | 动态场景 | 同步并回收街区繁荣视觉对象 |
| `src/rendering/DynamicScene.test.ts` | 自动测试 | 验证街区视觉层级、标签和同步复用 |
| `docs/project/task-board.md` | 任务看板 | 标记 DISTRICT-PROSPERITY-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第十五轮启动、完成和验证结果 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新城市模拟、动态引擎、建筑体系完成度和下一轮任务 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标测试、全量测试和构建结果 |

## 2026-06-27：第十四轮建筑分类运行时

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/contracts.ts` | 模拟公共契约 | `BuildingDefinition` 增加城市阶段、功能、连接方式、年代标签和街区亲和 |
| `src/content/buildings.ts` | 建筑内容目录 | 为 28 类建筑补齐阶段/功能/连接/年代元数据，并提供阶段、功能和年代一致性查询 |
| `src/content/runtimeBuildings.ts` | 运行时建筑目录 | 新增 starter 运行时定义，保留旧类型兼容并映射到金标分类资产 |
| `src/content/buildings.test.ts` | 自动测试 | 验证元数据、阶段查询、功能查询、年代一致性和 starter 兼容 |
| `src/integration/GameRuntime.ts` | 运行时集成 | 主模拟运行时改为读取内容目录里的 starter 建筑定义 |
| `docs/project/task-board.md` | 任务看板 | 标记 TAXONOMY-RUNTIME-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第十四轮启动、完成和验证结果 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新建筑体系完成度和下一轮任务 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标测试、全量测试和构建结果 |

## 2026-06-27：第十三轮迁入可视反馈

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/contracts.ts` | 模拟公共契约 | 候选外来人口增加地图位置和目标住宅 |
| `src/simulation/core/SimulationEngine.ts` | 模拟核心 | 候选外来人口抵达时选择临时停留点，并在等待过程中更新目标住宅 |
| `src/simulation/core/SimulationEngine.test.ts` | 自动测试 | 验证候选人拥有停留点和目标住宅 |
| `src/rendering/DynamicScene.ts` | 动态渲染 | 将等待中的迁入候选人同步到居民层 |
| `src/rendering/visuals.ts` | 程序化视觉 | 为迁入候选人绘制小队式临时停留表现 |
| `src/rendering/DynamicScene.test.ts` | 自动测试 | 验证迁入候选人会渲染到居民层 |
| `src/integration/cityNotices.ts` | 城市反馈 | 增加等待迁入候选人的小事流提示与定位目标 |
| `src/integration/cityNotices.test.ts` | 自动测试 | 验证等待迁入小事可生成并定位 |
| `docs/project/task-board.md` | 任务看板 | 标记 POP-MIGRATION-VISUAL-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第十三轮启动、完成和验证结果 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新人口生命周期、动态引擎、UI 完成度和下一轮任务 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标测试、全量测试和构建结果 |

## 2026-06-27：第十二轮运行时生产

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/contracts.ts` | 模拟公共契约 | 增加候选外来人口状态和迁入/离开事件，城市指标增加开放住房、吸引力和等待人口 |
| `src/simulation/core/snapshot.ts` | 初始快照 | 初始化候选外来人口集合 |
| `src/simulation/core/SimulationEngine.ts` | 模拟核心 | 外来人口按城市吸引力抵达，等待住房，成功入住或因无房/低吸引力/超时离开 |
| `src/simulation/core/SimulationEngine.test.ts` | 自动测试 | 覆盖候选抵达、入住、低吸引力不来、无房离开和指标更新 |
| `src/App.tsx` | 主界面 | 城市指标栏显示吸引力评分 |
| `docs/project/task-board.md` | 任务看板 | 标记 POP-MIGRATION-ENGINE-01 与 CITY-ATTRACTION-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第十二轮启动、完成和验证结果 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新人口生命周期、城市模拟、UI 完成度和下一轮任务 |
| `docs/project/qa.md` | 验收记录 | 记录本轮测试与构建结果 |

## 2026-06-27：商业级完整上线总计划与美术全阶段计划

### 新增文档

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `docs/project/commercial-launch-master-plan.md` | 项目总规划 | 定义完整商业级上线目标、阶段、生产线、自动执行和产出记录机制 |
| `docs/project/design/world-bible.md` | 世界观/年代规范 | 约束建筑、交通、服饰、材料、产业和美术边界 |
| `docs/project/design/building-taxonomy.md` | 建筑体系 | 定义可扩展建筑分类、城市阶段和街区繁荣机制 |
| `docs/project/design/population-lifecycle.md` | 系统设计 | 定义外来人口、入住、生活、离城和城市吸引力 |
| `docs/project/design/art-production-roadmap.md` | 美术生产计划 | 定义从 ART-P0 到 ART-P11 的全阶段美术任务、分工和门禁 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 记录阶段、完成度、风险和下一轮默认任务 |
| `docs/project/artifact-index.md` | 产物索引 | 记录每轮真实项目产出 |

### 同步更新文档

| 文件 | 更新目的 |
| --- | --- |
| `docs/project/README.md` | 将项目中枢主目标改为东方水乡城市文明模拟 |
| `docs/project/commercial-civilization-target.md` | 废弃旧岛屿/听歌/28 类主线，更新商业级硬标准 |
| `docs/project/production-pipeline.md` | 在流水线顶部声明新的商业级上线方向 |
| `docs/project/gates.md` | 增加统一年代、可扩展建筑、人口生命周期和美术全阶段门禁 |
| `docs/project/task-board.md` | 增加 P0 中枢与商业级路线任务 |
| `docs/project/integration-log.md` | 记录本轮集成 |

### 补强更新

| 文件 | 更新目的 |
| --- | --- |
| `docs/project/commercial-launch-master-plan.md` | 将 ART-P0–P11 美术全阶段上线要求纳入总计划本体，而不只作为独立美术文档 |
| `docs/project/production-pipeline.md` | 清理 28×9、四岛、音乐奖励、拾取材料等旧主线冲突，改为可扩展建筑/街区和人口生命周期流水线 |
| `docs/project/gates.md` | 清理 G0/G2/G4/最终发布门禁中的旧范围，改为建筑/街区资产矩阵、人口生命周期和城市问题诊断 |
| `docs/project/task-board.md` | 增加 `DOC-SYNC-20260627B`，记录本轮完整上线计划一致性补强 |
| `docs/project/progress-dashboard.md` | 更新 P0 阶段完成度、当前风险和下一轮任务 |

## 2026-06-27：跨电脑 / 空对话接续手册

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `docs/project/HANDOFF.md` | 项目交接手册 | 说明另一台电脑如何 clone、checkout、测试、恢复新 Codex 对话上下文，以及回到当前电脑如何继续 |
| `docs/project/README.md` | 项目索引 | 增加 HANDOFF 入口，确保新会话能优先找到接续手册 |

## 2026-06-29：第三十七轮旧群岛 legacy 边界集中

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/legacy/README.md` | legacy 边界说明 | 明确 `src/legacy/**` 只保留归档原型、QA 对照和迁移工具，禁止新主线引用 |
| `src/legacy/archipelago/IslandCanvas.tsx` | 归档旧视图组件 | 旧群岛 Pixi 视图从正式 `src/components` 目录迁入 legacy 范围 |
| `src/legacy/archipelago/index.ts` | 归档导出边界 | 仅为显式 legacy/QA 入口暴露旧群岛组件 |
| `src/legacy/game/legacy.test.ts` | 自动测试 | 固定旧群岛渲染默认关闭，并验证旧组件不再位于正式 components 目录 |
| `docs/project/task-board.md` | 任务看板 | 记录 `LEGACY-ARCHIPELAGO-SCOPE-01` 已完成 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第三十七轮进展、UI/UX 完成度、风险和下一轮任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮 legacy 边界迁移事实 |
| `docs/project/qa.md` | QA 记录 | 记录本轮验证命令和结果 |

## 2026-06-29：第三十八轮共享移动路径服务

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/world/movementPath.ts` | 共享模拟工具 | 提供道路优先、避开水面/建筑占用且无网格时安全直线 fallback 的移动路径服务 |
| `src/simulation/world/movementPath.test.ts` | 自动测试 | 固定道路优先、fallback、避开阻挡/水面三类路径行为 |
| `src/simulation/core/SimulationEngine.ts` | 模拟核心 | 候选外来人口进城路径改为使用共享移动路径服务，移除内部重复寻路实现 |
| `docs/project/task-board.md` | 任务看板 | 记录 `SHARED-MOVEMENT-PATH-01` 已完成 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第三十八轮进展、城市模拟/人口生命周期完成度和下一轮任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮路径服务抽取事实 |
| `docs/project/qa.md` | QA 记录 | 记录本轮验证命令和结果 |

## 2026-06-29：第三十九轮图层指标治理卡

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/stageAdvisor.ts` | 城市顾问数据层 | 将服务缺口、道路缺口和物流热点等图层结构化指标派生为可排序治理卡 |
| `src/App.tsx` | 主界面 | 瓶颈面板合并治理卡，点击后可定位到对应服务缺口、道路缺口或物流热点 |
| `src/integration/stageAdvisor.test.ts` | 自动测试 | 验证治理卡排序、目标点和图层来源 |
| `docs/project/task-board.md` | 任务看板 | 记录 `CITY-GOVERNANCE-CARDS-01` 已完成 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第三十九轮进展、UI/UX 完成度和下一轮任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮治理卡接入事实 |
| `docs/project/qa.md` | QA 记录 | 记录本轮验证命令和结果 |

## 2026-06-29：第四十轮街区繁荣真实运行因子

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/districts/prosperity.ts` | 模拟系统 | 街区繁荣评分接入道路贴近、服务建筑和真实物流订单活动 |
| `src/simulation/districts/prosperity.test.ts` | 自动测试 | 验证相同建筑聚集下，服务覆盖、道路访问和物流活动会提高街区繁荣与人流表现 |
| `docs/project/task-board.md` | 任务看板 | 记录 `DISTRICT-PROSPERITY-RUNTIME-01` 已完成 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第四十轮进展、城市模拟/动态引擎完成度和下一轮任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮真实运行因子接入事实 |
| `docs/project/qa.md` | QA 记录 | 记录本轮验证命令和结果 |
