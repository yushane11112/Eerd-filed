# 《小耳岛》项目产物索引

本文件记录每轮真实新增或修改的项目产物。只有写入这里的文件，才能算“项目内可检查产出”。

## 2026-08-10：第二百一十二轮应用层推进 Profile

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/App.tsx` | 应用层性能采集 | renderProfile 模式下记录 `runtime.advance` 耗时和 React commit 间隔 |
| `tools/browser-e2e/run-browser-e2e.cjs` | 浏览器执行器 | 稳态窗口重置并汇总 `__littleEarAppProfiles` |
| `tools/qa/run-render-ablation.ts` | 渲染差分工具 | 汇总输出 app advance 与 commit interval 指标 |
| `src/qa/performanceBaseline.ts` | 性能基线聚合 | 三环境性能样本保留应用层 profile |
| `src/qa/performanceBaseline.test.ts` | 自动测试 | 固定应用层 profile 中位数聚合 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 记录第二百一十二轮应用层证据 |
| `docs/project/integration-log.md` | 集成记录 | 记录应用层 profile 接入事实和限制 |
| `docs/project/qa.md` | QA 记录 | 记录定向测试、构建和目标规模浏览器证据 |
| `docs/project/task-board.md` | 任务看板 | 标记 `APP-RUNTIME-PROFILE-01` 已完成 |
| `docs/project/HANDOFF.md` | 跨电脑接续 | 更新下一轮默认诊断方向 |

## 2026-08-10：第二百一十一轮空白页 rAF 基线

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `tools/browser-e2e/run-browser-e2e.cjs` | 浏览器执行器 | 进入游戏 URL 前采集同 page 空白页 rAF 基线并输出 `browserFrameBaseline` |
| `tools/qa/run-render-ablation.ts` | 渲染差分工具 | 汇总输出空白页 rAF 平均/P95/最大 |
| `src/qa/performanceBaseline.ts` | 性能基线聚合 | 三环境性能样本保留空白页 rAF 基线 |
| `src/qa/performanceBaseline.test.ts` | 自动测试 | 固定空白页基线中位数聚合 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 记录第二百一十一轮空白页对照证据 |
| `docs/project/integration-log.md` | 集成记录 | 记录 runner 基线采集事实和限制 |
| `docs/project/qa.md` | QA 记录 | 记录定向测试、构建和目标规模浏览器证据 |
| `docs/project/task-board.md` | 任务看板 | 标记 `BROWSER-RAF-BASELINE-01` 已完成 |
| `docs/project/HANDOFF.md` | 跨电脑接续 | 更新下一轮默认诊断方向 |

## 2026-08-10：第二百一十轮 Ticker minFPS 对照

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/rendering/renderDiagnostics.ts` | 诊断参数 | 新增 `tickerMinFps` 非负数参数解析 |
| `src/rendering/renderDiagnostics.test.ts` | 自动测试 | 固定 `tickerMinFps=0/24` 与非法值回退契约 |
| `src/rendering/types.ts` | 性能统计契约 | ticker profile 增加实际 `tickerMinFps` / `tickerMaxFps` |
| `src/components/SimulationCanvas.tsx` | 运行时接入 | QA 参数存在时设置 `app.ticker.minFPS` 并回传实际 ticker FPS 设置 |
| `tools/browser-e2e/run-browser-e2e.cjs` | 浏览器执行器 | 汇总 ticker min/max FPS 字段 |
| `tools/qa/run-render-ablation.ts` | 渲染差分工具 | 新增 `no-ticker-min-fps` 模式和 ticker FPS 汇总字段 |
| `src/qa/performanceBaseline.ts` | 性能基线聚合 | 三环境聚合保留 ticker FPS 设置字段 |
| `src/qa/performanceBaseline.test.ts` | 自动测试 | 固定 ticker FPS 字段聚合 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 记录第二百一十轮 minFPS 对照证据 |
| `docs/project/integration-log.md` | 集成记录 | 记录 minFPS 对照和限制 |
| `docs/project/qa.md` | QA 记录 | 记录定向测试、构建和浏览器对照 |
| `docs/project/task-board.md` | 任务看板 | 标记 `RENDER-TICKER-MINFPS-ABLATION-01` 已完成 |
| `docs/project/HANDOFF.md` | 跨电脑接续 | 更新下一轮默认诊断方向 |

## 2026-08-10：第二百零九轮三环境目标规模 Ticker 矩阵

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/qa/performanceBaseline.ts` | 性能基线聚合 | 三环境性能样本纳入 ticker callback、sceneSync、delta 和 elapsed 指标 |
| `src/qa/performanceBaseline.test.ts` | 自动测试 | 固定 ticker 指标中位数聚合与 readPixels 最差值规则 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 记录第二百零九轮三环境目标规模矩阵 |
| `docs/project/integration-log.md` | 集成记录 | 记录性能矩阵接入事实与限制 |
| `docs/project/qa.md` | QA 记录 | 记录定向测试、构建和三环境矩阵证据 |
| `docs/project/task-board.md` | 任务看板 | 标记 `PERF-TICKER-MATRIX-01` 已完成 |
| `docs/project/HANDOFF.md` | 跨电脑接续 | 更新下一轮默认性能诊断方向 |

## 2026-08-10：第二百零八轮 Ticker 阶段计时诊断

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/rendering/types.ts` | 性能统计契约 | 新增 `SceneTickerPerformanceProfile`，描述 ticker callback、scene sync 和 delta/elapsed 指标 |
| `src/rendering/index.ts` | 类型导出 | 导出 ticker 性能统计类型 |
| `src/components/SimulationCanvas.tsx` | 运行时采集 | renderProfile 模式下记录 Pixi ticker callback/camera/scene sync/delta/elapsed |
| `tools/browser-e2e/run-browser-e2e.cjs` | 浏览器执行器 | 稳态窗口重置并汇总 `__littleEarTickerProfiles` |
| `tools/qa/run-render-ablation.ts` | 渲染差分工具 | 汇总输出 ticker callback、sceneSync、delta 和 elapsed 指标 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 记录第二百零八轮 ticker 证据和性能红灯判断 |
| `docs/project/integration-log.md` | 集成记录 | 记录 ticker 采集事实和限制 |
| `docs/project/qa.md` | QA 记录 | 记录定向测试、构建和目标规模浏览器证据 |
| `docs/project/task-board.md` | 任务看板 | 标记 `RENDER-TICKER-PROFILE-01` 已完成 |
| `docs/project/HANDOFF.md` | 跨电脑接续 | 更新下一轮默认诊断方向 |

## 2026-08-10：第二百零七轮稳态渲染采样窗口

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `tools/browser-e2e/run-browser-e2e.cjs` | 浏览器执行器 | 页面断言完成后重置 render/renderer profile，再采集稳态窗口样本 |
| `tools/qa/run-render-ablation.ts` | 渲染差分工具 | 汇总输出 `profileWindow`，标明样本来自稳态窗口 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 记录第二百零七轮稳态样本与性能红灯判断 |
| `docs/project/integration-log.md` | 集成记录 | 记录采样窗口调整和限制 |
| `docs/project/qa.md` | QA 记录 | 记录定向测试、构建和稳态浏览器对照 |
| `docs/project/task-board.md` | 任务看板 | 标记 `RENDER-STEADY-PROFILE-WINDOW-01` 已完成 |
| `docs/project/HANDOFF.md` | 跨电脑接续 | 更新下一轮默认诊断方向 |

## 2026-08-10：第二百零六轮 LOD 对照矩阵与 reduced 更新收敛

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `tools/qa/run-render-ablation.ts` | 渲染差分工具 | 新增 `no-building-lod` 模式，并在汇总中输出 detailed/reduced 建筑数量 |
| `tools/browser-e2e/run-browser-e2e.cjs` | 浏览器执行器 | 支持按渲染配置启用实体最小值门禁 |
| `src/qa/browserE2eScenarios.ts` | 浏览器 QA 契约 | 新增 `conditionalRenderEntityMinimums`，让默认 LOD 门禁与关闭 LOD 对照共存 |
| `src/qa/browserE2eScenarios.test.ts` | 自动测试 | 固定目标规模场景默认启用 LOD，并只在 `buildingLod=true` 时要求 reduced 建筑 |
| `src/rendering/visuals.ts` | 建筑视觉更新 | reduced 建筑不再每帧重复清空 artwork motion graphics |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 记录第二百零六轮对照样本和性能红灯判断 |
| `docs/project/integration-log.md` | 集成记录 | 记录 LOD 对照矩阵、条件门禁和实现限制 |
| `docs/project/qa.md` | QA 记录 | 记录定向测试、构建、浏览器对照和差异检查 |
| `docs/project/task-board.md` | 任务看板 | 标记 `RENDER-BUILDING-LOD-ABLATION-01` 已完成 |
| `docs/project/HANDOFF.md` | 跨电脑接续 | 更新下一轮默认任务与 LOD 结论 |

## 2026-08-10：第二百零五轮目标规模建筑细节 LOD

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/rendering/DynamicScene.ts` | 目标规模渲染策略 | 可见建筑超过阈值时按相机距离选择 96 栋 full detail，其余降为 reduced detail，并输出统计 |
| `src/rendering/visuals.ts` | 建筑视觉 LOD | reduced 建筑保留静态主体/原画/状态，但关闭高频建筑动效和原画动态层 |
| `src/rendering/types.ts` | 性能统计契约 | `SceneSyncStats` / `SceneSyncPerformanceProfile` 增加 full/reduced 建筑计数 |
| `src/rendering/renderDiagnostics.ts` | QA 诊断开关 | 新增 `buildingLod` 配置与 `disableBuildingLod=1` 回退参数 |
| `src/components/SimulationCanvas.tsx` | 生产接入 | 将渲染诊断配置传入 `DynamicScene` |
| `src/rendering/DynamicScene.test.ts` | 自动测试 | 覆盖 140 栋可见建筑时远景 reduced，以及关闭 LOD 后全量 full |
| `src/rendering/renderDiagnostics.test.ts` | 自动测试 | 固定 LOD 默认开启和 URL 关闭契约 |
| `src/qa/browserE2eScenarios.ts` | 浏览器 QA 契约 | 目标规模场景要求观察到 detailed/reduced 建筑统计 |
| `src/qa/browserE2eScenarios.test.ts` | 自动测试 | 固定目标规模场景不会默认关闭 LOD，且包含 full/reduced 最小统计 |
| `tools/browser-e2e/run-browser-e2e.cjs` | 浏览器性能采集 | render profile 采集 detailedBuildings / reducedBuildings 区间 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 记录本轮目标规模 LOD 事实、浏览器样本和红灯结论 |
| `docs/project/integration-log.md` | 集成记录 | 记录 LOD 接入、回退开关、统计证据和限制 |
| `docs/project/qa.md` | QA 记录 | 记录定向测试、构建、浏览器验收和完整门禁 |
| `docs/project/task-board.md` | 任务看板 | 标记 `RENDER-BUILDING-LOD-01` 已完成 |
| `docs/project/HANDOFF.md` | 跨电脑接续 | 更新最新可信进度与下一步默认任务 |

## 2026-07-14：真实游戏持续预览站

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `netlify.toml` | 持续部署配置 | 使用 `npm run build` 构建并发布 `dist` 中的真实游戏产物 |
| `.gitignore` | 本地状态隔离 | 忽略 Netlify 本地项目绑定目录 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 记录真实游戏预览地址和自动更新口径 |
| `docs/project/task-board.md` | 任务看板 | 标记 `PREVIEW-CONTINUOUS-DEPLOY-01` 已完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录部署方式、资源校验和实时更新边界 |
| `docs/project/qa.md` | QA 记录 | 记录完整测试、构建和公网资源验证 |
| `docs/project/HANDOFF.md` | 跨电脑接续 | 固化预览入口和推送后自动更新规则 |

## 2026-07-13：第一百一十四轮卸货能力可视化解释

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/contracts.ts` | 公共状态契约 | 新增 `LogisticsUnloadCapacityBreakdown`，让物流队列能携带卸货能力来源拆解 |
| `src/simulation/economy/logistics.ts` | 物流模拟规则 | 输出建筑卸货能力拆解，并保持 QA 覆盖能力值的解释来源 |
| `src/integration/stageAdvisor.ts` | 治理诊断 | 卸货排队治理卡说明最拥堵建筑的卸货能力、排队和来源构成 |
| `src/ui/cityAdvisorUi.ts` | UI 文案格式化 | 建筑详情物流面板生成“卸货口”解释文案 |
| `src/App.tsx` | 主界面接入 | 在建筑详情物流执行计划卡中展示卸货能力来源说明 |
| `src/integration/GameRuntime.ts` | 调试场景稳定性 | 延长 `logistics-storage-build` 的排队压力窗口，并避免调试承运人污染活动压力卡 |
| `src/simulation/economy/economy.test.ts` | 自动测试 | 覆盖普通市场和升级仓储的卸货能力来源拆解 |
| `src/integration/stageAdvisor.test.ts` | 自动测试 | 覆盖卸货排队治理卡包含能力来源说明 |
| `src/ui/cityAdvisorUi.test.ts` | 自动测试 | 覆盖建筑详情卸货口解释文案 |
| `src/qa/browserE2eScenarios.ts` | 浏览器 E2E 契约 | 物流扩仓建造场景校准为真实建筑卸货能力“每刻卸货 2 单” |
| `src/qa/browserE2eScenarios.test.ts` | 自动测试 | 固定浏览器契约中的真实卸货能力文本 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 记录第一百一十四轮进展、完成度和下一轮默认任务 |
| `docs/project/task-board.md` | 任务看板 | 标记 `LOGISTICS-UNLOAD-CAPACITY-EXPLAIN-01` 已完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮能力解释、QA 场景校准和限制 |
| `docs/project/qa.md` | QA 记录 | 记录目标测试、浏览器场景、完整测试、构建和差异检查 |
| `docs/project/HANDOFF.md` | 跨电脑接续 | 更新最近完成事项和下一轮默认任务 |

## 2026-07-13：第一百一十三轮物流仓储建造浏览器场景

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/GameRuntime.ts` | 调试场景 | 新增 `logistics-storage-build`，稳定制造卸货排队并保证正式建仓成本可支付 |
| `src/ui/runtimeOptions.ts` | URL 场景入口 | 允许通过 `?debugScenario=logistics-storage-build` 打开该浏览器场景 |
| `src/ui/runtimeOptions.test.ts` | 自动测试 | 覆盖新增 URL 调试参数不会被过滤 |
| `src/qa/browserE2eScenarios.ts` | 浏览器 E2E 契约 | 新增物流扩仓建造场景，声明可见文案和真实点击断言 |
| `src/qa/browserE2eScenarios.test.ts` | 自动测试 | 固定新场景 id、URL、文案和 interaction 元数据 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 记录第一百一十三轮进展、QA 完成度和下一轮默认任务 |
| `docs/project/task-board.md` | 任务看板 | 标记 `BROWSER-E2E-LOGISTICS-STORAGE-BUILD-01` 已完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮浏览器场景、过程发现和限制 |
| `docs/project/qa.md` | QA 记录 | 记录定向测试、真实浏览器场景、完整测试、构建和差异检查 |
| `docs/project/HANDOFF.md` | 跨电脑接续 | 更新最近完成事项和下一轮默认任务 |

## 2026-07-13：第一百一十二轮分类型升级曲线

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/economy/construction.ts` | 经济表与校验 | 新增 `BuildingUpgradeCostCurve`，支持默认、类别、类型三层升级曲线和里程碑材料校验 |
| `src/simulation/economy/upgrades.ts` | 运行时升级扣料 | 升级报价/扣料传入建筑定义，按类型/类别曲线计算材料缺口 |
| `src/simulation/economy/constructionTable.test.ts` | 自动测试 | 覆盖默认兜底曲线、住宅/生产类别曲线、自定义类型曲线和非法曲线诊断 |
| `src/simulation/economy/upgrades.test.ts` | 自动测试 | 固定升级扣料 wrapper 对新经济表结构的兼容性 |
| `src/integration/GameRuntime.test.ts` | 运行时回归 | 覆盖建筑升级报价、连续升级和缺料提示在新曲线下仍能持久运行 |
| `docs/project/economy-balancing.md` | 平衡审计 | 记录分层升级曲线能力和仍未满足商业级经济的缺口 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 记录第一百一十二轮进展、完成度和下一轮默认任务 |
| `docs/project/task-board.md` | 任务看板 | 标记 `UPGRADE-CATEGORY-CURVES-01` 已完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮经济表接入事实和限制 |
| `docs/project/qa.md` | QA 记录 | 记录目标测试、构建和后续完整门禁 |
| `docs/project/HANDOFF.md` | 跨电脑接续 | 更新最近完成事项和下一轮默认任务 |

## 2026-07-13：第一百一十一轮来源库存治理浏览器场景

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/GameRuntime.ts` | 调试场景 | 新增 `logistics-source-shortage`，稳定制造来源库存不足与可调拨备用库存 |
| `src/ui/runtimeOptions.ts` | URL 场景入口 | 允许通过 `?debugScenario=logistics-source-shortage` 打开该浏览器场景 |
| `src/qa/browserE2eScenarios.ts` | 浏览器 E2E 契约 | 新增来源库存检查场景，并声明点击后必须出现物流执行计划面板 |
| `tools/browser-e2e/run-browser-e2e.cjs` | 浏览器执行器 | 支持 interaction 后的 `expectVisibleText` 断言 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 记录第一百一十一轮 QA 场景进展与完成度变化 |
| `docs/project/task-board.md` | 任务看板 | 标记 `BROWSER-E2E-LOGISTICS-SOURCE-STOCK-01` 已完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮浏览器场景和合并取舍 |
| `docs/project/qa.md` | QA 记录 | 记录定向测试、真实浏览器场景、完整测试、构建和差异检查 |
| `docs/project/HANDOFF.md` | 跨电脑接续 | 记录最近完成事项，保持下一轮默认任务稳定 |

## 2026-07-12：第一百一十轮卸货能力分层

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/economy/logistics.ts` | 物流模拟规则 | 默认按目的建筑类型、等级、工人和入口道路数计算卸货能力，保留 QA 覆盖参数 |
| `src/simulation/economy/economy.test.ts` | 自动测试 | 覆盖显式低吞吐排队和默认建筑分层卸货能力 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 记录第一百一十轮模拟规则进展、完成度和下一轮任务 |
| `docs/project/task-board.md` | 任务看板 | 标记 `LOGISTICS-UNLOAD-CAPACITY-TIER-01` 已完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮卸货能力分层事实和限制 |
| `docs/project/qa.md` | QA 记录 | 记录目标测试、完整测试、构建和差异检查 |
| `docs/project/HANDOFF.md` | 跨电脑接续 | 更新下一轮默认任务为升级经济表分类型曲线 |

## 2026-07-12：第一百零九轮物流仓储执行计划真实建造动作

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/GameRuntime.ts` | 运行时动作 | 新增物流仓储计划建造入口，复用正式营造成本并重置关联订单/承运/队列 |
| `src/App.tsx` | 治理卡交互 | 将扩仓、分流卸货和缓冲仓计划接入一键建仓执行链路 |
| `src/integration/GameRuntime.test.ts` | 自动测试 | 覆盖建仓扣费、订单重置、承运释放和卸货队列清理 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 记录第一百零九轮运行时闭环进展、完成度和下一轮任务 |
| `docs/project/task-board.md` | 任务看板 | 标记 `LOGISTICS-STORAGE-BUILD-ACTION-01` 已完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮物流仓储执行动作事实和限制 |
| `docs/project/qa.md` | QA 记录 | 记录目标测试、完整测试、构建和差异检查 |
| `docs/project/HANDOFF.md` | 跨电脑接续 | 更新下一轮默认任务为卸货能力分层 |

## 2026-07-12：第一百零八轮活动密度与状态反馈增强

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/rendering/visuals.ts` | agent 动态渲染 | 为居民、工人、货车和船只增加活动尾迹、主体和状态标记层 |
| `src/rendering/DynamicScene.test.ts` | 自动测试 | 固定通勤、服务访问、取货和送货 agent 的可视层标签稳定输出 |
| `/tmp/eerd-visual-slice-108-activity.png` | 本地验收截图 | Chrome 截图确认主画布可加载且活动标记不遮挡 UI |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 记录第一百零八轮动态表现进展、完成度和下一轮任务 |
| `docs/project/task-board.md` | 任务看板 | 标记 `VISUAL-ACTIVITY-FEEDBACK-01` 已完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮 agent 活动表现增强事实和限制 |
| `docs/project/qa.md` | QA 记录 | 记录目标测试、构建和截图验收 |
| `docs/project/HANDOFF.md` | 跨电脑接续 | 更新下一轮默认任务为物流扩仓/分流卸货真实动作 |

## 2026-07-12：第一百零七轮道路与街区质感增强

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/rendering/roads.ts` | 道路视觉配置 | 为土路、石路和桥梁增加阴影、纹理线和铺装模式元数据 |
| `src/rendering/roads.test.ts` | 自动测试 | 固定三类道路铺装模式和纹理配置差异 |
| `src/components/SimulationCanvas.tsx` | 主画布地形渲染 | 绘制土路车辙、石路板缝、桥面木板、水波、岸线和田地纹理 |
| `/tmp/eerd-visual-slice-107-streets.png` | 本地验收截图 | Chrome 截图确认道路、水岸和地表纹理进入主画布 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 记录第一百零七轮地图质感进展、完成度和下一轮任务 |
| `docs/project/task-board.md` | 任务看板 | 标记 `VISUAL-STREET-DISTRICT-01` 已完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮道路与街区质感增强事实和限制 |
| `docs/project/qa.md` | QA 记录 | 记录目标测试、构建和截图验收 |
| `docs/project/HANDOFF.md` | 跨电脑接续 | 更新下一轮默认任务为活动密度与状态反馈 |

## 2026-07-12：第一百零六轮 Starter 建筑第一眼改观

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/rendering/visuals.ts` | 主画布建筑视觉 | 增强民居、集市、粮仓、码头和稻田的程序化轮廓与稻田细节层 |
| `src/rendering/prefab/defaultRegistry.ts` | 默认 prefab registry | 注册 `windfield-rice` 临时 descriptor，让稻田进入主画布占位视觉 |
| `src/rendering/DynamicScene.test.ts` | 自动测试 | 覆盖 `windfield-rice` L0/L4/L8 程序化细节层稳定输出 |
| `src/rendering/prefab/registry.test.ts` | 自动测试 | 验证默认 registry 覆盖 `windfield-rice` |
| `/tmp/eerd-visual-slice-105-starter.png` | 本地验收截图 | Chrome 截图确认主画布可加载，starter 建筑轮廓已增强 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 记录第一百零六轮视觉进展、完成度和下一轮任务 |
| `docs/project/task-board.md` | 任务看板 | 标记 `VISUAL-SLICE-STARTER-01` 已完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮 starter 视觉增强事实和限制 |
| `docs/project/qa.md` | QA 记录 | 记录目标测试、构建和截图验收 |
| `docs/project/HANDOFF.md` | 跨电脑接续 | 更新下一轮默认任务为道路与街区质感 |

## 2026-07-12：第一百零五轮目标与执行节奏校准

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `docs/project/execution-strategy.md` | 项目执行策略 | 固化最终总目标、P1.5 当前阶段、近期优先级、低收益事项和 Tier 0-4 验证分级 |
| `docs/project/README.md` | 项目中枢入口 | 将当前阶段从 P0 更新为 P1.5，并加入执行策略索引 |
| `docs/project/HANDOFF.md` | 跨电脑接续 | 让其他电脑或新对话优先读取执行策略，按可见垂直切片和验证分级继续 |
| `docs/project/commercial-launch-master-plan.md` | 上线总计划 | 增补 2026-07-12 执行节奏校准，保持长期商业级总目标不变 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新当前阶段、风险、下一轮默认任务和每轮更新要求 |
| `docs/project/task-board.md` | 任务看板 | 新增目标校准任务和后三轮视觉垂直切片任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录第一百零五轮目标与节奏校准事实 |
| `docs/project/qa.md` | QA 记录 | 记录本轮文档级验证和跳过代码测试原因 |

## 2026-07-12：第一百零一轮物流承运重新调度

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/GameRuntime.ts` | 运行时入口 | 增加物流订单重新调度动作，释放承运人并重置订单 |
| `src/integration/GameRuntime.test.ts` | 自动测试 | 验证订单重置、承运释放、失败状态清理和队列清空 |
| `src/App.tsx` | 主界面 | `add-carrier-dispatch` 治理计划调用运行时重新调度动作 |
| `docs/project/task-board.md` | 任务看板 | 记录 `LOGISTICS-REDISPATCH-ACTION-01` 已完成 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第一百零一轮进展、城市模拟/UI 完成度和下一轮任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮实现和限制 |
| `docs/project/qa.md` | QA 记录 | 记录目标测试、构建和后续全量验证 |

## 2026-07-12：第一百轮物流执行计划详情面板

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/App.tsx` | 主界面 | 选中物流计划相关建筑时显示库存、订单和承运调度状态 |
| `src/ui/cityAdvisorUi.ts` | UI 文案工具 | 生成物流执行计划详情面板文案 |
| `src/ui/cityAdvisorUi.test.ts` | 自动测试 | 固定物流库存与调度状态文案 |
| `src/styles.css` | 界面样式 | 增加物流执行计划卡样式 |
| `docs/project/task-board.md` | 任务看板 | 记录 `LOGISTICS-INSPECTOR-PANEL-01` 已完成 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第一百轮进展、UI 完成度和下一轮任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮实现和限制 |
| `docs/project/qa.md` | QA 记录 | 记录目标测试、构建和后续全量验证 |

## 2026-07-03：第八十九轮可调营造经济表

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/economy/construction.ts` | 经济系统 | 导出默认营造经济表、表校验器，并支持自定义表报价 |
| `src/simulation/economy/constructionTable.test.ts` | 自动测试 | 覆盖默认表兼容、自定义表报价和非法表校验 |
| `docs/project/economy-balancing.md` | 平衡审计 | 记录当前经济表、已完成门禁、商业级平衡缺口和后续任务 |
| `docs/project/task-board.md` | 任务看板 | 记录 `CONSTRUCTION-ECONOMY-TABLE-01` 已完成 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第八十九轮进展、城市模拟完成度和下一轮任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮实现、验证和限制 |
| `docs/project/qa.md` | QA 记录 | 记录 TDD RED/GREEN 和目标回归 |
| `docs/project/artifact-index.md` | 产物索引 | 记录本轮真实新增/修改文件 |

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

## 2026-07-03：第九十轮服务容量与排队状态

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/contracts.ts` | 模拟契约 | 新增 `ServiceQueueEntry`、`ServiceQueueState` 和 `SimulationSnapshot.serviceQueues` |
| `src/simulation/economy/service.ts` | 服务模拟系统 | 记录服务吞吐、排队家庭、等待 tick，并避免已派出服务访问重复占用容量/重复扣分 |
| `src/simulation/economy/economy.test.ts` | 自动测试 | 固定服务容量、排队持久化和等待压力行为 |
| `src/integration/stageAdvisor.ts` | 治理图层 | 服务图层显示排队热点并输出队列指标 |
| `src/integration/stageAdvisor.test.ts` | 自动测试 | 验证服务图层能读取 `serviceQueues` 并标出 `排队xN` |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第九十轮进展、完成度和下一轮任务 |
| `docs/project/task-board.md` | 任务看板 | 记录 `SERVICE-QUEUE-CAPACITY-01` 已完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮服务容量与排队状态接入事实 |
| `docs/project/qa.md` | QA 记录 | 记录本轮测试、构建和限制 |

## 2026-07-03：第九十一轮目的建筑卸货吞吐与物流积压

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/contracts.ts` | 模拟契约 | 新增 `destination-throughput`、`throughputQueuedSinceTick` 和 `LogisticsQueueState` |
| `src/simulation/economy/logistics.ts` | 物流模拟系统 | 增加 `unloadCapacityPerTick`，限制同 tick 目的建筑卸货量，并记录等待卸货队列 |
| `src/simulation/economy/economy.test.ts` | 自动测试 | 固定两辆车同 tick 到达同一建筑时的卸货吞吐、等待、下一 tick 继续卸货行为 |
| `src/integration/stageAdvisor.ts` | 治理图层 | 物流图层显示 `卸货排队xN`，输出卸货积压与最长等待指标 |
| `src/integration/stageAdvisor.test.ts` | 自动测试 | 验证物流图层能读取 `logisticsQueues` 并保留热点/卸货排队双重诊断 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第九十一轮进展、完成度和下一轮任务 |
| `docs/project/task-board.md` | 任务看板 | 记录 `LOGISTICS-UNLOAD-QUEUE-01` 已完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮卸货吞吐与物流积压接入事实 |
| `docs/project/qa.md` | QA 记录 | 记录本轮 TDD、回归和限制 |

## 2026-07-03：第九十二轮物流治理分因建议

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/stageAdvisor.ts` | 城市顾问数据层 | 物流治理卡按无车、断路、仓满、来源不足、卸货排队输出不同建议 |
| `src/integration/stageAdvisor.test.ts` | 自动测试 | 固定 5 类物流失败原因的推荐工具、标签、指标和行动文案 |
| `src/qa/logisticsHotspotScenarios.ts` | QA 场景摘要 | 物流热点 QA 摘要可审计订单失败原因，避免只看聚合卡片 |
| `src/integration/GameRuntime.ts` | 调试场景数据 | 物流热点场景补足食物库存，避免误把通用热点场景识别为来源不足 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第九十二轮进展、UI 完成度和下一轮任务 |
| `docs/project/task-board.md` | 任务看板 | 记录 `LOGISTICS-GOVERNANCE-CAUSE-01` 已完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮分因治理接入事实 |
| `docs/project/qa.md` | QA 记录 | 记录本轮 TDD、回归和限制 |

## 2026-07-04：第九十三轮升级成本接入统一经济表

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/economy/construction.ts` | 经济表实现 | `ConstructionEconomyTable` 新增 `upgradeCosts`，导出统一 `buildingUpgradeCost` 并校验升级参数 |
| `src/simulation/economy/upgrades.ts` | 升级系统 | 升级、城市仓储升级和排队升级支持可选自定义经济表，默认兼容旧曲线 |
| `src/simulation/economy/index.ts` | 模块出口 | 聚合出口保留高层 `buildingUpgradeCost`，将低层经济表函数别名为 `constructionTableBuildingUpgradeCost`，避免运行时签名冲突 |
| `src/simulation/economy/constructionTable.test.ts` | 自动测试 | 验证默认升级成本、自定义升级成本和非法升级参数校验 |
| `src/simulation/economy/upgrades.test.ts` | 自动测试 | 验证自定义经济表会影响排队升级扣料 |
| `docs/project/economy-balancing.md` | 平衡审计 | 更新经济表范围，移除“升级成本尚未统一”的旧风险 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第九十三轮进展、城市模拟完成度和下一轮任务 |
| `docs/project/task-board.md` | 任务看板 | 记录 `UPGRADE-ECONOMY-TABLE-01` 已完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮升级经济表接入事实 |
| `docs/project/qa.md` | QA 记录 | 记录本轮 TDD、回归和限制 |

## 2026-07-04：第九十四轮长跑队列压力读数

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/qa/civilizationLongRun.ts` | 长跑 QA 执行器 | 分层报告新增 `queuePressure`，并输出真实物流卸货吞吐探针 |
| `src/qa/civilizationLongRunCheck.ts` | QA 命令入口 | 校验队列压力字段为有限数、最终服务排队大于 0、探针物流积压大于 0 |
| `src/qa/civilizationLongRun.test.ts` | 自动测试 | 固定服务/物流队列汇总逻辑和真实卸货吞吐探针行为 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第九十四轮进展、QA 完成度和下一轮任务 |
| `docs/project/task-board.md` | 任务看板 | 记录 `LONG-RUN-QUEUE-PRESSURE-01` 已完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮队列压力报告接入事实 |
| `docs/project/qa.md` | QA 记录 | 记录本轮 TDD、7200 QA、全量回归和限制 |
| `docs/project/HANDOFF.md` | 跨电脑接续 | 更新下一轮默认任务，避免新会话重复本轮 |

## 2026-07-10：第九十五轮主长跑物流卸货压力

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/economy/EconomySystem.ts` | 组合经济系统接口 | 透传 `serviceTargetBatches` 与 `unloadCapacityPerTick`，让长跑通过正式经济系统配置物流吞吐 |
| `src/qa/civilizationLongRun.ts` | 长跑 QA 执行器 | 新增 `LongRunLogisticsPressureSystem`，定期注入真实在途订单和货车并清理完成货车 |
| `src/qa/civilizationLongRunCheck.ts` | QA 命令入口 | 将主长跑最终 `unloadBacklog >= 1` 纳入硬门禁 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第九十五轮进展、城市模拟/QA 完成度和下一轮任务 |
| `docs/project/task-board.md` | 任务看板 | 记录 `LONG-RUN-LOGISTICS-PRESSURE-01` 已完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮主长跑物流压力接入事实 |
| `docs/project/qa.md` | QA 记录 | 记录本轮 RED、调参失败、7200 QA、全量回归和限制 |
| `docs/project/HANDOFF.md` | 跨电脑接续 | 更新下一轮默认任务，避免新会话重复本轮 |

## 2026-07-10：第九十六轮物流治理结构化执行计划

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/stageAdvisor.ts` | 治理数据层 | `StageGovernanceRecommendation` 新增 `logisticsPlan`，五类物流分因输出结构化执行计划 |
| `src/integration/stageAdvisor.test.ts` | 自动测试 | 验证每类物流失败原因都携带计划类型、订单样本、来源、目的地和资源 |
| `src/App.tsx` | 城市治理 UI | 治理卡显示物流执行计划摘要，暴露订单数、资源、来源和目的地 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第九十六轮进展、UI 完成度和下一轮任务 |
| `docs/project/task-board.md` | 任务看板 | 记录 `LOGISTICS-EXECUTION-PLAN-01` 已完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮结构化计划接入事实 |
| `docs/project/qa.md` | QA 记录 | 记录本轮 RED、目标回归、构建和限制 |
| `docs/project/HANDOFF.md` | 跨电脑接续 | 更新下一轮默认任务，避免新会话重复本轮 |

## 2026-07-10：第九十七轮物流执行计划聚焦目标

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/stageAdvisor.ts` | 治理数据层 | `LogisticsExecutionPlan` 新增 `focusRole/focusBuildingId`，为后续自动执行动作提供聚焦契约 |
| `src/integration/stageAdvisor.test.ts` | 自动测试 | 验证五类物流失败原因的计划聚焦角色和聚焦建筑 |
| `src/App.tsx` | 城市治理 UI | 治理卡定位与 inspect 类执行优先选中物流计划中的真实相关建筑 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第九十七轮进展、UI 完成度和下一轮任务 |
| `docs/project/task-board.md` | 任务看板 | 记录 `LOGISTICS-EXECUTION-FOCUS-01` 已完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮计划聚焦入口接入事实 |
| `docs/project/qa.md` | QA 记录 | 记录本轮定向测试、相关回归、全量回归、构建和限制 |
| `docs/project/HANDOFF.md` | 跨电脑接续 | 更新下一轮默认任务，避免新会话重复本轮 |

## 2026-07-10：第九十八轮物流断路执行计划

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/stageAdvisor.ts` | 治理数据层 | `build-road-link` 物流计划根据订单来源/目的入口生成 `roadPlan` |
| `src/integration/stageAdvisor.test.ts` | 自动测试 | 验证 `no-route` 物流分因会输出施工格、成本和可支付状态，其他物流分因不会误带 roadPlan |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第九十八轮进展、地图建造完成度和下一轮任务 |
| `docs/project/task-board.md` | 任务看板 | 记录 `LOGISTICS-ROAD-PLAN-01` 已完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮物流断路 roadPlan 接入事实 |
| `docs/project/qa.md` | QA 记录 | 记录本轮定向测试、相关回归、全量回归、构建和限制 |
| `docs/project/HANDOFF.md` | 跨电脑接续 | 更新下一轮默认任务，避免新会话重复本轮 |

## 2026-07-10：第九十九轮物流仓储候选落点

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/stageAdvisor.ts` | 治理数据层 | 仓储类物流计划生成贴近热点建筑、入口邻路且通过资源校验的粮仓 footprint 候选 |
| `src/integration/stageAdvisor.test.ts` | 自动测试 | 验证仓满物流建议会选择热点旁仓储候选，并保留计划聚焦目标 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第九十九轮进展、地图建造/UI 完成度和下一轮任务 |
| `docs/project/task-board.md` | 任务看板 | 记录 `LOGISTICS-STORAGE-CANDIDATE-01` 已完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮仓储候选选址接入事实 |
| `docs/project/qa.md` | QA 记录 | 记录本轮定向测试、相关回归、全量回归、构建和限制 |
| `docs/project/HANDOFF.md` | 跨电脑接续 | 更新下一轮默认任务，避免新会话重复本轮 |

## 2026-07-12：第一百轮物流执行计划详情面板

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/App.tsx` | 城市治理 UI | 建筑详情展示物流执行计划、来源/目的库存、订单和承运状态 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 记录第一百轮物流计划可见诊断入口 |
| `docs/project/integration-log.md` | 集成记录 | 记录计划详情面板接入事实 |

## 2026-07-12：第一百零一轮物流承运重新调度动作

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/GameRuntime.ts` | 运行时动作 | 新增 `redispatchLogisticsOrders`，释放承运人并重置关联订单 |
| `src/App.tsx` | 城市治理 UI | `add-carrier-dispatch` 计划点击后调用运行时动作并刷新物流图层 |
| `src/integration/GameRuntime.test.ts` | 自动测试 | 固定承运重新调度会清空 carrier cargoIntent、失败原因和卸货队列 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 记录第一百零一轮承运调度入口 |
| `docs/project/task-board.md` | 任务看板 | 记录 `LOGISTICS-REDISPATCH-ACTION-01` 已完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮承运重新调度动作 |

## 2026-07-12：第一百零二轮物流来源库存调拨动作

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/GameRuntime.ts` | 运行时动作 | 新增 `transferSourceInventoryForLogisticsPlan`，从备用库存调入缺货源建筑并重置订单 |
| `src/App.tsx` | 城市治理 UI | `inspect-source-stock` 计划优先执行库存调拨，失败时回退定位建筑 |
| `src/integration/GameRuntime.test.ts` | 自动测试 | 固定备用库存调拨、订单重置、承运释放和物流队列清理 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第一百零二轮进展、完成度和下一轮任务 |
| `docs/project/task-board.md` | 任务看板 | 记录 `LOGISTICS-SOURCE-STOCK-TRANSFER-01` 已完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮来源库存调拨动作 |
| `docs/project/qa.md` | QA 记录 | 记录本轮目标测试、开发构建、全量回归和限制 |
| `docs/project/HANDOFF.md` | 跨电脑接续 | 更新下一轮默认任务，避免新会话重复本轮 |

## 2026-07-12：第一百零三轮物流承运容量补充动作

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/GameRuntime.ts` | 运行时动作 | 新增 `addCarrierForLogisticsPlan`，按物流计划在来源建筑入口补一名 `cart` 承运人并重置订单 |
| `src/App.tsx` | 城市治理 UI | `add-carrier-dispatch` 计划改为新增承运容量，成功后刷新物流图层 |
| `src/integration/GameRuntime.test.ts` | 自动测试 | 验证新承运人会被正式 `EconomySystem` 派给缺车订单 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第一百零三轮进展、完成度和下一轮任务 |
| `docs/project/task-board.md` | 任务看板 | 记录 `LOGISTICS-CARRIER-CAPACITY-01` 已完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮承运容量补充动作 |
| `docs/project/qa.md` | QA 记录 | 记录本轮目标测试、开发构建、全量回归和限制 |
| `docs/project/HANDOFF.md` | 跨电脑接续 | 更新下一轮默认任务，避免新会话重复本轮 |

## 2026-07-12：第一百零四轮金标占位视觉接入主画布

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/rendering/prefab/defaultRegistry.ts` | 渲染运行时配置 | 默认创建 starter 金标占位 registry，注册民居、食肆、粮仓和码头 descriptor |
| `src/components/SimulationCanvas.tsx` | 主画布接入 | `DynamicScene` 默认加载 prefab registry，让程序化细节进入真实游戏画面 |
| `src/rendering/visuals.ts` | 建筑占位视觉 | prefab 占位按等距建筑尺寸缩放，避免 manifest 像素 bounds 生成巨型透明框 |
| `src/rendering/prefab/registry.test.ts` | 自动测试 | 验证默认 registry 覆盖 `main-homes`、`main-eatery`、`main-granary` 和 `main-pier` |
| `/tmp/eerd-visual-slice-104-fixed.png` | 本地验收截图 | Chrome 截图确认主画布可加载且巨型占位框已消失 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第一百零四轮视觉进展、完成度和下一轮任务 |
| `docs/project/task-board.md` | 任务看板 | 记录 `GOLD-VISUAL-RUNTIME-REGISTRY-01` 已完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮视觉 registry 接入事实 |
| `docs/project/qa.md` | QA 记录 | 记录本轮目标测试、开发构建、截图验证、全量回归和限制 |
| `docs/project/HANDOFF.md` | 跨电脑接续 | 更新下一轮默认任务，避免新会话重复本轮 |

## 2026-07-16：第一百一十五轮物流仓储建成后结果解释

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/contracts.ts` | 运行时契约 | 新增 `LogisticsStorageIntervention` 与快照持久化字段 |
| `src/integration/GameRuntime.ts` | 运行时动作 | 建成缓冲仓时记录重置订单、释放承运人和清理队列的真实数量 |
| `src/ui/cityAdvisorUi.ts` | UI 文案 | 统一生成建成后物流结果解释 |
| `src/App.tsx` | 建筑详情 | 建成后自动选中新粮仓并持续显示结果面板 |
| `src/integration/GameRuntime.test.ts` | 自动测试 | 固定运行时结果写入快照 |
| `src/qa/browserE2eScenarios.ts` | 浏览器 QA | 物流建造场景新增建成后详情可见断言 |

## 2026-07-16：第一百一十六轮升级经济回本与容量联动审计

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/qa/upgradeEconomyAudit.ts` | 审计引擎 | 计算 64 个升级节点的成本价值、容量/岗位/生产/服务增益、维护费和回本周期 |
| `src/qa/upgradeEconomyAuditCheck.ts` | QA 命令入口 | `npm run qa:upgrade-economy-audit` 输出平衡报告并检查覆盖与数值有效性 |
| `src/qa/upgradeEconomyAudit.test.ts` | 自动测试 | 验证全建筑覆盖、服务等级联动和生产联动缺口可见 |
| `src/simulation/economy/service.ts` | 运行时经济 | 服务建筑等级提升后真实增加每刻接待吞吐 |
| `docs/project/audits/upgrade-economy.md` | 平衡审计文档 | 固化本轮假设、结果和下一轮修复范围 |

## 2026-07-17：第一百一十七轮升级经济结果可见化

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/GameRuntime.ts` | 运行时接口 | 升级报价携带统一审计结果摘要 |
| `src/App.tsx` | 建筑详情 UI | 显示容量/岗位、生产/服务增益、维护影响和回本周期 |
| `src/styles.css` | 视觉状态 | 健康、慢回本和不可回本提示使用不同颜色层级 |
| `src/integration/GameRuntime.test.ts` | 自动测试 | 验证升级报价包含经济结果且不改变存档库存 |
| `docs/project/integration-log.md` | 集成记录 | 记录真实 UI 接入与浏览器环境失败 |

## 2026-07-17：第一百一十八轮升级经济风险顾问

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/App.tsx` | 城市顾问 | 只提示最高风险升级节点，并定位到目标建筑 |
| `src/qa/upgradeEconomyAudit.ts` | 共享审计 | 顾问与建筑详情复用同一回本/收益口径 |
| `docs/project/progress-dashboard.md` | 进度记录 | 更新 UI 完成度与下一轮浏览器复验任务 |

## 2026-07-17：第一百一十九轮物流热点能力来源短标签

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/stageAdvisor.ts` | 物流图层协议 | 输出卸货能力来源徽标，并兼容旧队列快照 |
| `src/components/SimulationCanvas.tsx` | 场景交互 | 在物流热点建筑入口附近渲染轻量能力标签 |
| `src/styles.css` | 视觉样式 | 统一徽标尺寸、层级、颜色和不拦截交互行为 |
| `src/integration/stageAdvisor.test.ts` | 自动测试 | 验证徽标生成、边界和能力来源格式化 |

## 2026-07-17：第一百二十轮物流干预事件与存档审计

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/contracts.ts` | 存档契约 | 定义物流干预历史记录和快照字段 |
| `src/integration/GameRuntime.ts` | 运行时落盘 | 扩仓动作完成后追加唯一事件记录 |
| `src/qa/logisticsStorageInterventionAudit.ts` | QA 审计器 | 校验事件引用、计数和累计结果 |
| `src/qa/logisticsStorageInterventionAuditCheck.ts` | QA 命令 | 提供可重复的干预历史审计入口 |
| `src/qa/logisticsStorageInterventionAudit.test.ts` | 自动测试 | 验证有效历史、重复事件和无效建筑边界 |

## 2026-07-17：第一百二十一轮物流干预历史可见化

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/App.tsx` | 建筑详情 UI | 显示当前缓冲建筑的历史干预累计和最近事件 |
| `src/ui/cityAdvisorUi.ts` | UI 口径函数 | 汇总多次物流干预结果 |
| `src/ui/cityAdvisorUi.test.ts` | 自动测试 | 锁定历史累计文案和既有物流面板文案 |
| `src/styles.css` | 视觉样式 | 为历史记录卡提供低干扰详情层级 |

## 2026-07-17：第一百二十二轮物流干预历史有界归档

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/economy/logisticsInterventions.ts` | 存档策略 | 实现最近 200 条保留和旧事件累计归档 |
| `src/simulation/economy/logisticsInterventions.test.ts` | 长跑边界测试 | 用 205 条事件验证窗口和归档结果 |
| `src/simulation/contracts.ts` | 存档契约 | 增加干预归档累计字段 |
| `src/qa/logisticsStorageInterventionAudit.ts` | QA 审计 | 汇总明细历史与累计归档并检查非法数据 |

## 2026-07-17：第一百二十三轮物流干预归档城市管理可见化

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/App.tsx` | 城市管理 UI | 在瓶颈/治理抽屉显示全城物流干预存档摘要和最近归档刻数 |
| `src/ui/cityAdvisorUi.ts` | UI 口径函数 | 统一近期明细与归档累计的展示文案 |
| `src/ui/cityAdvisorUi.test.ts` | 自动测试 | 锁定归档统计和城市管理摘要格式 |
| `src/styles.css` | 视觉样式 | 为治理存档卡提供独立但低干扰的层级 |

## 2026-07-17：第一百二十四轮物流治理时间线可定位

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/App.tsx` | 城市管理交互 | 显示最近三条物流干预并触发建筑定位/详情查看 |
| `src/ui/cityAdvisorUi.ts` | 时间线口径函数 | 统一治理记录的刻数、建筑和结果摘要 |
| `src/ui/cityAdvisorUi.test.ts` | 自动测试 | 锁定时间线记录格式和治理统计文案 |
| `src/styles.css` | 视觉样式 | 为可点击时间线提供低干扰按钮和聚焦反馈 |

## 2026-07-17：第一百二十五轮城市运行文明时间线

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/contracts.ts` | 文明事件契约 | 增加城市时间线分类、来源和快照字段 |
| `src/integration/cityTimeline.ts` | 事件归档数据层 | 将服务、财政和人口事件映射为可读且有界的历史记录 |
| `src/integration/cityTimeline.test.ts` | 自动测试 | 覆盖六类事件映射、建筑目标和 200 条窗口边界 |
| `src/integration/GameRuntime.ts` | 运行时接入 | 每次模拟推进后持久化本轮文明事件 |
| `src/App.tsx` | 城市管理 UI | 显示城市运行时间线并支持建筑事件定位 |
| `src/ui/cityAdvisorUi.ts` | UI 口径函数 | 统一系统分类和时间线标题文案 |
## 2026-07-17：第一百二十六轮居民身份与职业状态

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/contracts.ts` | 居民状态契约 | 定义时间线中的候选、入住、离城家庭身份和就业快照 |
| `src/integration/cityTimeline.ts` | 事件映射 | 将迁移事件转为带居民状态的城市运行记录 |
| `src/integration/GameRuntime.ts` | 真实状态投影 | 从家庭、工人代理和雇佣建筑派生职业与就业状态 |
| `src/ui/cityAdvisorUi.ts` | 居民状态文案 | 统一成员、劳动力、职业和满意度展示 |
| `src/App.tsx` | 城市管理 UI | 在人口时间线显示居民状态并保留住房定位 |
| `src/qa/browserE2eScenarios.ts` | 浏览器验收契约 | 固化候选家庭与入住家庭的可见差异场景 |

## 2026-07-17：第一百二十七轮居民生活运行反馈

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/residentGovernance.ts` | 居民治理派生层 | 从真实模拟快照计算住房、就业、职业、活动和民需摘要 |
| `src/integration/residentGovernance.test.ts` | 自动测试 | 验证住房、就业、待业、职业和活动统计口径 |
| `src/App.tsx` | 城市管理与住房详情 | 展示居民生活卡和单栋住房实际入住人数 |
| `src/styles.css` | 面板样式 | 为居民生活摘要提供紧凑信息层级 |
| `src/rendering/visuals.ts` | 动态地图反馈 | 让工人服色随职业建筑类别变化 |
| `src/qa/browserE2eScenarios.ts`, `src/qa/browserE2eScenarios.test.ts` | 浏览器验收契约 | 城市运行场景同时检查居民生活卡的居民生活与就业读数 |

## 2026-07-17：第一百二十八轮岗位与缺勤后果

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/core/SimulationEngine.ts` | 居民劳动力模拟 | 生成岗位变更、缺勤和恢复出勤事件，并驱动工作路线 |
| `src/simulation/core/workforce.ts` | 有效劳动力口径 | 统一区分岗位分配人数与实际出勤人数，兼容旧存档岗位 ID |
| `src/simulation/economy/production.ts`, `src/simulation/economy/service.ts`, `src/simulation/economy/logistics.ts` | 建筑运行反馈 | 生产、服务、卸货能力按实际出勤人数计算 |
| `src/integration/cityTimeline.ts`, `src/ui/cityAdvisorUi.ts` | 城市劳务时间线 | 展示居民获得岗位、失去岗位、缺勤及恢复原因 |
| `src/integration/residentGovernance.ts`, `src/App.tsx` | 居民治理读数 | 显示当前缺勤人数 |

## 2026-07-17：第一百二十九轮居民迁出原因

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/contracts.ts` | 迁移原因契约 | 定义关键需求、失业和低满意度三类离城原因 |
| `src/simulation/core/SimulationEngine.ts` | 迁出判定 | 从家庭需求、就业和满意度真实状态计算离城原因 |
| `src/integration/cityTimeline.ts` | 因果文案投影 | 将迁出原因转换为城市运行时间线可读事实 |
| `src/integration/cityTimeline.test.ts`, `src/simulation/core/SimulationEngine.test.ts` | 自动验证 | 覆盖离城原因生成和历史时间线兼容 |

## 2026-07-17：第一百三十轮需求短板与长期缺勤

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/contracts.ts` | 家庭压力状态契约 | 持久化各项需求短板刻数和家庭缺勤累计刻数 |
| `src/simulation/core/SimulationEngine.ts` | 居民压力累计 | 从真实需求与工人出勤状态累计可解释的长期压力 |
| `src/integration/cityTimeline.ts` | 因果解释投影 | 显示具体需求类型和连续缺勤时长 |
| `src/integration/cityTimeline.test.ts`, `src/simulation/core/SimulationEngine.test.ts` | 自动验证 | 覆盖需求短板、长期缺勤迁出和时间线文案 |

## 2026-07-17：第一百三十一轮服务短板来源

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/economy/service.ts` | 服务压力记录器 | 将真实服务工人、库存、道路、容量和家庭收入状态转为需求压力 |
| `src/simulation/contracts.ts` | 服务压力契约 | 定义短板原因、持续刻数和关联服务建筑 |
| `src/integration/residentGovernance.ts`, `src/App.tsx` | 居民治理反馈 | 展示持续时间最长的服务短板及原因 |
| `src/integration/cityTimeline.ts` | 迁出因果时间线 | 展示具体需求、瓶颈原因和服务建筑 |
| `src/simulation/economy/economy.test.ts`, `src/integration/residentGovernance.test.ts`, `src/integration/cityTimeline.test.ts` | 自动验证 | 覆盖服务短板累计、恢复清除和可读投影 |

## 2026-07-17：第一百三十二轮城市级缺失服务设施

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/stageAdvisor.ts` | 城市服务覆盖分析 | 识别低需求且完全没有对应服务设施的城市级短板，并生成治理建议与营造候选 |
| `src/integration/stageAdvisor.test.ts` | 自动验证 | 覆盖缺少医疗设施时的顾问卡、住宅定位和服务图层回退 |

## 2026-07-17：第一百三十三轮运行时服务设施

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/content/runtimeBuildings.ts` | 运行时建筑定义与菜单 | 将药铺、书院、戏台接入时代解锁、建造报价、岗位、容量和升级体系 |
| `src/rendering/prefab/assetMapping.ts` | 动态资产映射 | 将三类运行时建筑映射到对应的原创分层 Prefab 资产 |
| `src/content/buildings.test.ts` | 建筑体系验证 | 验证三类设施的时代一致性、服务类别、解锁阶段和运行时定义 |
| `src/qa/upgradeEconomyAudit.test.ts`, `docs/project/audits/upgrade-economy.md` | 升级经济审计 | 验证新增设施纳入 64 个 0–8 级升级节点和回本分析 |

## 2026-07-17：第一百三十四轮服务设施闭环

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/GameRuntime.ts` | 可重复服务调试场景 | 生成商贸镇人口与健康短板，供建造到服务恢复验收复用 |
| `src/qa/serviceFacilityScenarios.ts` | 运行时 QA 场景 | 真实调用药铺预览、建造、配工、库存和服务访问，并输出健康恢复摘要 |
| `src/qa/serviceFacilityScenarios.test.ts` | 自动验收 | 验证药铺落成、工人绑定、服务事件和居民健康上升 |
| `src/ui/runtimeOptions.ts`, `package.json` | 场景入口 | 接入 URL 调试参数与 `qa:service-facility-runtime` 命令 |

## 2026-07-17：第一百三十五轮三类服务与故障审计

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/qa/serviceFacilityScenarios.ts` | 多设施运行时 QA | 统一验证药铺/书院/戏台从营造、配工到居民需求恢复 |
| `src/qa/serviceFacilityScenarios.test.ts` | 服务故障回归 | 验证缺工、缺药材、断路均留下建筑与居民侧可解释状态 |
| `src/integration/GameRuntime.ts` | QA 阶段夹具 | 仅为确定性服务场景提供时代入口，不旁路生产阶段推导 |
| `src/ui/runtimeOptions.test.ts` | 调试入口回归 | 验证 `service-facility-runtime` URL 场景可被稳定解析 |

## 2026-07-17：第一百三十六轮公共服务城市反馈

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/contracts.ts` | 城市服务指标契约 | 持久化可选的 `publicServiceCoverage`，兼容旧存档和旧测试快照 |
| `src/simulation/core/SimulationEngine.ts` | 城市吸引力运行规则 | 从三类公共服务需求计算覆盖并参与迁入吸引力 |
| `src/simulation/core/SimulationEngine.test.ts` | 因果回归 | 验证服务需求短板降低覆盖和城市吸引力 |
| `src/App.tsx` | 城市指标可视化 | 在指标栏显示公共服务覆盖率 |

## 2026-07-17：第一百三十七轮人口财政反馈

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/contracts.ts` | 人口流动/财政契约 | 定义可迁移的 `PopulationFlowLedger`、迁移指标和服务维护读数 |
| `src/simulation/core/SimulationEngine.ts` | 人口流动运行账本 | 在落户和离城的真实状态变更点累计户数与人口数 |
| `src/simulation/economy/fiscal.ts` | 服务维护成本核算 | 在财政结算时按服务建筑类别拆分维护成本 |
| `src/integration/residentGovernance.ts` | 居民治理派生 | 汇总净迁入、服务覆盖和服务维护成本 |
| `src/App.tsx` | 治理面板反馈 | 显示净迁入与公共服务财政压力 |
| `src/integration/residentGovernance.test.ts` / `src/simulation/economy/economy.test.ts` | 回归证据 | 验证治理读数和服务维护成本不会脱离模拟状态 |

## 2026-07-17：第一百三十八轮人口流动结构审计

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/contracts.ts` | 流动结构契约 | 扩展人口账本的住房、原因、职业和就业状态维度 |
| `src/simulation/core/SimulationEngine.ts` | 迁移审计写入器 | 在家庭实体变更的原子边界写入结构统计 |
| `src/integration/residentGovernance.ts` | 流动解释器 | 将结构统计转换成居民治理可读摘要 |
| `src/App.tsx` | 居民治理反馈 | 显示主要迁出原因、离城职业与劳动力构成 |
| `src/simulation/core/SimulationEngine.test.ts` / `src/integration/residentGovernance.test.ts` | 结构回归 | 验证迁出同 tick 的原因、住房和职业数据完整 |

## 2026-07-17：第一百三十九轮离城居民生命周期档案

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/core/SimulationEngine.ts` | 离城档案生成器 | 在家庭删除前保存完整居民状态，并通过推进结果传递 |
| `src/integration/GameRuntime.ts` | 运行时桥接 | 将离城档案注入城市时间线事件上下文 |
| `src/integration/cityTimeline.ts` | 时间线档案消费 | 显示真实离城家庭资料，兼容旧事件回退 |
| `src/integration/cityTimeline.test.ts` / `src/simulation/core/SimulationEngine.test.ts` | 生命周期回归 | 验证离城档案跨引擎与时间线边界不丢失 |

## 2026-07-17：第一百四十轮人口事件财政链路

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/contracts.ts` | 财政时间线契约 | 定义可选财政快照和最近结算刻度 |
| `src/simulation/economy/fiscal.ts` | 财政结算标记 | 在真实结算发生时写入结算刻度 |
| `src/integration/cityTimeline.ts` | 事件链拼接 | 将迁出原因、服务瓶颈和财政快照合并到人口记录 |
| `src/integration/GameRuntime.ts` | 运行时桥接 | 将当前存档财政状态提供给时间线映射器 |
| `src/integration/cityTimeline.test.ts` | 财政链路回归 | 验证公共服务维护成本和财政快照出现在迁出记录 |

## 2026-07-17：第一百四十一轮财政结算历史与周期对比

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/contracts.ts` | 财政历史契约 | 定义结算前后库银、税收、维护和公共服务维护记录，并限制历史窗口 |
| `src/simulation/economy/fiscal.ts` | 财政历史写入 | 在真实结算时写入可供人口事件引用的周期事实 |
| `src/integration/GameRuntime.ts` | 事实桥接 | 仅把最近真实财政结算注入时间线，不伪造未发生结算 |
| `src/integration/cityTimeline.ts` / `src/integration/cityTimeline.test.ts` | 周期审计消费与回归 | 在迁出事件显示财政前后变化，并验证无财政历史时的兼容行为 |

## 2026-07-17：第一百四十二轮服务恢复前后审计

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/contracts.ts` | 服务事件契约 | 为服务完成事件增加可选需求前后值 |
| `src/simulation/economy/service.ts` | 恢复事实采集 | 在真实服务完成时捕获居民需求恢复前后状态 |
| `src/integration/cityTimeline.ts` | 服务审计视图 | 展示恢复幅度并关联最近财政结算事实 |
| `src/integration/cityTimeline.test.ts` / `src/simulation/economy/economy.test.ts` | 回归产物 | 验证新字段、旧事件兼容和服务链路不回归 |

## 2026-07-17：第一百四十三轮服务瓶颈解除与建筑恢复审计

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/contracts.ts` | 恢复事件契约 | 定义服务瓶颈解除事件及其压力审计字段 |
| `src/simulation/economy/service.ts` | 建筑恢复事实 | 从阻塞状态恢复服务时写入真实解除原因和压力统计 |
| `src/integration/cityTimeline.ts` | 恢复时间线 | 将建筑恢复和居民压力清除转成可读城市事件 |
| `src/simulation/economy/economy.test.ts` / `src/integration/cityTimeline.test.ts` | 恢复回归 | 验证缺资源阻塞恢复、状态切换和时间线显示 |

## 2026-07-17：第一百四十四轮恢复事件界面消费

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/App.tsx` | 治理/详情消费 | 将最近恢复事件接入瓶颈面板与建筑详情抽屉，并支持定位 |
| `src/ui/cityAdvisorUi.ts` | 共用文案 | 格式化服务恢复时间线事实 |
| `src/styles.css` | 视觉组件 | 为恢复链接和详情审计卡提供清晰的状态层级 |
| `src/ui/cityAdvisorUi.test.ts` | UI 回归 | 验证恢复记录文案不会脱离运行时事实 |

## 2026-07-17：第一百四十五轮恢复审计结构化数据

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/contracts.ts` | 时间线审计契约 | 定义服务恢复状态、压力和服务需求前后值的结构化字段 |
| `src/integration/cityTimeline.ts` | 事实映射 | 将真实服务事件转为可供治理与详情面板消费的审计对象 |
| `src/App.tsx` / `src/styles.css` | 审计 UI | 展示建筑状态、压力、财政影响和居民需求前后变化 |
| `src/integration/cityTimeline.test.ts` / `src/simulation/economy/economy.test.ts` | 集成回归 | 验证结构化字段来自真实服务恢复路径并保持旧事件兼容 |

## 2026-07-17：第一百四十六轮服务恢复动态渲染

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/rendering/visuals.ts` | 动态建筑反馈 | 从城市时间线读取服务恢复事件，绘制按模拟刻衰减的恢复脉冲 |
| `src/rendering/DynamicScene.test.ts` | 渲染回归 | 验证恢复记录能够驱动画布建筑状态层 |

## 2026-07-17：第一百四十七轮阻塞原因动态反馈

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/rendering/visuals.ts` | 阻塞反馈动画 | 为真实阻塞原因的运动层加入模拟时钟驱动的呼吸强度 |
| `src/rendering/DynamicScene.test.ts` | 阻塞渲染回归 | 保证四类阻塞符号和状态图层持续可见 |

## 2026-07-17：第一百四十八轮运行阻塞持续时间与治理后果

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/contracts.ts` | 阻塞生命周期契约 | 为建筑保存当前运行阻塞的起始模拟刻 |
| `src/simulation/economy/production.ts` / `service.ts` / `logistics.ts` | 状态写入与恢复清理 | 由真实生产、服务、物流原因维护阻塞起始刻 |
| `src/simulation/economy/upgrades.ts` | 状态边界修正 | 升级过程清除旧阻塞标记，避免治理误报 |
| `src/integration/residentGovernance.ts` / `src/App.tsx` | 治理摘要与界面 | 展示阻塞、最长持续、物流积压和库存压力后果 |
| `src/integration/residentGovernance.test.ts` | 结构回归 | 验证仓满阻塞持续时间和后果归因 |

## 2026-07-17：第一百四十九轮阻塞生命周期时间线审计

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/core/SimulationEngine.ts` | 状态边沿事件 | 从真实建筑状态变化生成阻塞开始与恢复事件 |
| `src/simulation/contracts.ts` | 时间线事件契约 | 定义运行事件、原因、起始刻、持续刻数和恢复状态 |
| `src/integration/cityTimeline.ts` | 事实映射 | 将阻塞生命周期写入可追溯城市时间线 |
| `src/App.tsx` / `src/styles.css` | 建筑详情审计 UI | 展示选中建筑的运行阻塞生命周期 |
| `src/integration/cityTimeline.test.ts` | 时间线回归 | 验证缺料阻塞的开始与恢复记录结构 |

## 2026-07-17：第一百五十轮阻塞同刻后果因果链

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/contracts.ts` | 后果审计契约 | 定义缺勤、物流、库存和居民压力的结构化读数 |
| `src/simulation/core/SimulationEngine.ts` | 运行时采集 | 在阻塞开始/恢复边沿从真实城市状态采集同刻后果 |
| `src/integration/cityTimeline.ts` | 因果链映射 | 将后果写入阻塞开始与恢复事件详情 |
| `src/App.tsx` | 建筑治理 UI | 在建筑详情中显示同刻后果和库存占用 |
| `src/integration/cityTimeline.test.ts` | 数据回归 | 验证缺料事件保留库存、物流和压力数据 |

## 2026-07-17：第一百五十一轮阻塞持续期间增量审计

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/contracts.ts` | 增量契约 | 定义阻塞起始/恢复后果与期间增量的数据结构 |
| `src/simulation/core/SimulationEngine.ts` | 生命周期计算 | 回写阻塞起始刻、保存基线并在恢复时计算增量 |
| `src/simulation/core/SimulationEngine.test.ts` | 引擎回归 | 验证真实 `step()` 产生 2→5 库存的 `+3` 阻塞增量 |
| `src/integration/cityTimeline.ts` | 时间线投影 | 将库存、物流和居民压力变化方向写入城市运行记录 |
| `src/App.tsx` | 建筑治理界面 | 在运行状态审计卡显示阻塞期间变化 |

## 2026-07-17：第一百五十二轮阻塞增量接入财政周期

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/contracts.ts` | 财政压力契约 | 为财政结算记录增加运营压力快照并保持旧存档可选兼容 |
| `src/simulation/economy/fiscal.ts` | 财政周期采集 | 在真实结算刻统计阻塞建筑、物流积压、库存压力和居民压力 |
| `src/integration/residentGovernance.ts` | 治理派生 | 从最近财政历史读取运营压力，不创建并行状态 |
| `src/App.tsx` | 治理面板 | 展示最近财政结算刻的运营压力摘要 |
| `src/simulation/economy/economy.test.ts` | 财政回归 | 验证结算历史保留运营压力快照 |

## 2026-07-17：第一百五十三轮阻塞原因变化生命周期分段

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/core/SimulationEngine.ts` | 生命周期分段逻辑 | 原因变化时闭合上一段并开启新段，避免审计链断裂 |
| `src/simulation/core/SimulationEngine.test.ts` | 多段状态回归 | 验证缺料→断路→恢复的起始刻、持续时长和增量 |
| `src/simulation/contracts.ts` | 兼容事件契约 | 保持每个阻塞段使用同一结构化事件数据 |
| `src/integration/cityTimeline.ts` | 多段时间线投影 | 让每个原因段独立显示在城市运行时间线 |

## 2026-07-17：第一百五十四轮财政压力周期对比与时间线事件

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/contracts.ts` | 财政事件/差值契约 | 定义结算事件、运营压力快照和相邻周期差值 |
| `src/simulation/economy/fiscal.ts` | 财政运行事件 | 在真实结算刻计算压力变化并发出 `fiscal-settlement` |
| `src/integration/cityTimeline.ts` | 财政时间线投影 | 将结算事实投影为可追溯的 finance 记录 |
| `src/integration/residentGovernance.ts` / `src/App.tsx` | 治理消费 | 显示最近财政周期的压力及变化方向 |
| `src/simulation/economy/economy.test.ts` / `src/integration/cityTimeline.test.ts` | 交叉模块回归 | 验证财政差值计算和时间线投影 |

## 2026-07-17：第一百五十五轮财政压力治理提示

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/cityNotices.ts` | 财政治理提示 | 将财政周期压力上升投影成可定位的 finance 城市提示 |
| `src/integration/cityNotices.test.ts` | 定位回归 | 验证压力提示优先指向真实阻塞建筑 |
| `docs/project/task-board.md` | 任务状态 | 记录治理提示完成项及浏览器证据后续项 |

## 2026-07-17：第一百五十六轮财政提示生命周期

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/cityNotices.ts` | 通知生命周期机制 | 维护活动通知集合，抑制同周期重复提示并在状态解除后重新武装 |
| `src/integration/cityNotices.test.ts` | 生命周期回归 | 覆盖同周期静默、压力消退和再次上升重触发 |

## 2026-07-17：第一百五十七轮高优先级提示审计

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/cityNotices.test.ts` | 跨类型生命周期回归 | 覆盖粮食、物流、迁移和财政提示的静默、恢复与再次触发 |
| `src/integration/cityNotices.ts` | 统一提示边沿 | 所有城市提示共享活动集合去重和恢复后重新武装机制 |

## 2026-07-17：第一百五十八轮城市提示分析事件

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/cityNotices.ts` | 分析事件协议 | 定义提示生命周期事件、事件队列和确认动作 |
| `src/integration/GameRuntime.ts` | 运行时消费接口 | 暴露批量消费与界面确认入口 |
| `src/App.tsx` | 产品动作接入 | 将“看一眼/知道了”连接到 acknowledged 事件 |
| `src/integration/cityNotices.test.ts` | 生命周期审计 | 验证四阶段事件顺序、去重和恢复后重触发 |

## 2026-07-17：第一百五十九轮分析队列持久化

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/cityNotices.ts` | durable outbox | 持久化、恢复、稳定键去重和批次确认 |
| `src/integration/GameRuntime.ts` | 运行时接线 | 在模拟刷新和重建时捕获分析事件，暴露批次接口 |
| `src/integration/cityNotices.test.ts` | 存档恢复回归 | 验证跨实例恢复、重复入队去重和确认删除 |

## 2026-07-17：第一百六十轮分析批次传输

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/analyticsTransport.ts` | 传输协议与调度器 | 批次发送、部分确认、失败保留和有界退避 |
| `src/integration/analyticsTransport.test.ts` | 传输回归 | 验证离线、部分确认和失败重试行为 |
| `src/integration/GameRuntime.ts` | 运行时入口 | 注入可选分析传输器并提供批量 flush 接口 |

## 2026-07-17：第一百六十一轮 HTTP 分析适配器

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/analyticsHttpTransport.ts` | HTTP 传输适配器 | 批次 POST、超时、响应校验和确定性幂等键 |
| `src/integration/analyticsHttpTransport.test.ts` | HTTP 回归 | 验证成功、非 2xx、非法响应、超时和未知 ID过滤 |
## 2026-07-17：第一百六十二轮商业美术覆盖审计

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `tools/asset-validator/asset-coverage-audit.js` | 生产门禁 | 区分契约 manifest 与真实 DCC/运行时资产，逐项输出六类金样的 L0–L8 和交付缺口 |
| `tools/asset-validator/asset-coverage-audit.self-test.js` | 门禁自检 | 锁定当前真实红灯状态，防止未来误删缺口检查 |
| `package.json` | 项目命令 | 提供 `asset:coverage-audit` 与 `asset:coverage-audit:self-test` |
## 2026-07-17：第一百六十三轮建筑视觉成长契约

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `tools/asset-validator/asset-validator.js` | 视觉生产契约 | 校验建筑独特身份、L0–L8 视觉成长、主体轮廓里程碑及 L0/L8 语义 |
| `tools/asset-validator/asset-coverage-audit.js` | 门禁接入 | 对六类金样启用视觉身份与繁荣成长检查 |
| `tools/asset-validator/asset-coverage-audit.self-test.js` | 契约回归 | 验证完整视觉身份可通过，L0/L8 轮廓复用会失败 |
| `docs/project/gold-slice/sample-manifests/README.md` | 资产交付说明 | 记录美术导出必须提供的 visualIdentity 和 levelArc 字段 |

## 2026-07-17：第一百六十四轮全建筑视觉身份目录

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/content/buildingVisualIdentity.ts` | 建筑视觉身份目录 | 28 类建筑的独立轮廓、功能、材质、动态元素与 L0–L8 成长弧 |
| `src/simulation/contracts.ts` | 公共类型契约 | 声明建筑视觉阶段、等级视觉记录和视觉身份结构 |
| `src/content/buildings.ts` | 内容运行时接入 | 将视觉身份注入全部建筑定义 |
| `src/content/runtimeBuildings.ts` | 运行时别名接入 | 保证 house/market 等运行时建筑沿用对应金标身份 |
| `tools/asset-validator/asset-validator.js` | 跨资产门禁 | 拒绝生产 manifest 共享建筑类别、轮廓族或功能识别 |
| `tools/asset-validator/asset-coverage-audit.js` | 覆盖审计接入 | 在金样覆盖报告中输出跨资产视觉重复问题 |

## 2026-07-17：第一百六十五轮动态视觉身份渲染

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/rendering/visuals.ts` | 动态渲染适配 | 使用建筑身份和等级阶段绘制可见的类别化灰盒轮廓；真实 Prefab 缺失时仍保留功能识别 |
| `src/rendering/DynamicScene.test.ts` | 渲染回归 | 验证未注册 Prefab 的建筑不会被隐藏，并显示对应等级轮廓语义 |

## 2026-07-17：第一百六十六轮运行时建筑美术接入

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/rendering/artwork/buildingArtwork.ts` | 运行时美术 Provider | 解析 28 类建筑的九级 PNG 路径、缓存 Pixi 纹理并统一等距精灵锚点/比例 |
| `src/rendering/visuals.ts` | Pixi 场景接线 | 按建筑类型和等级显示真实透明建筑图，Provider 不可用时保留身份化灰盒降级 |
| `src/components/SimulationCanvas.tsx` | 生产入口 | 启用运行时建筑美术 Provider |
| `tools/asset-validator/runtime-artwork-audit.js` | 运行时资产审计 | 检查 28 个目录、252 个等级文件、PNG/尺寸/RGBA/字节级重复 |
| `src/rendering/artwork/buildingArtwork.test.ts` | 运行时契约回归 | 覆盖九级边界、纹理缓存和等距精灵 footprint |

## 2026-07-17：第一百六十七轮建筑差异化动效

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/rendering/visuals.ts` | 建筑动效层 | 按模拟 tick、建筑状态和视觉身份绘制施工、生产、农业、水面、灯塔、水车、炊烟等差异化动效 |
| `src/rendering/DynamicScene.test.ts` | 动效运行时回归 | 验证动效层进入对象池视觉、状态层不被破坏且复用时子层数量稳定 |

## 2026-07-17：第一百六十八轮 DCC 生产流水线

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `tools/art-pipeline/blender/build-gold-slice.py` | Blender 执行脚本 | 校验九级集合、命名、锚点、动画 action、碰撞/遮挡和关键视觉里程碑，并导出透明预览与 provenance |
| `tools/art-pipeline/validate-pipeline-contract.js` | 生产契约门禁 | 防止 Blender 脚本与建模规格漂移 |
| `docs/project/gold-slice/dcc-export-runbook.md` | 美术机执行手册 | 明确模型、分层图集、动画、碰撞、LOD 与浏览器验收交付物 |
| `src/rendering/prefab/animationRuntime.ts` | Prefab 动画播放计划 | 将 manifest 状态槽位、进度源和 LOD 策略转换成渲染器可消费的确定性计划 |
| `src/rendering/prefab/animationRuntime.test.ts` | 动画计划回归 | 覆盖生产进度、施工确定性和 LOD-off 过滤 |
| `src/rendering/visuals.ts` | 动画计划消费 | 将 Prefab slots 接入 BuildingVisual 动态层，并在对象池 reset 时清理旧计划 |
| `src/rendering/DynamicScene.test.ts` | 状态槽位渲染回归 | 断言仓满、生产状态的真实槽位进入动态层 |

## 2026-07-17：第一百七十轮真实图集播放驱动

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/rendering/artwork/buildingAnimation.ts` | 图集 Provider 与 AnimatedSprite 驱动 | 按建筑等级、Prefab 槽位和 clip 查询帧，确定性播放并复用槽位显示对象 |
| `src/rendering/artwork/buildingAnimation.test.ts` | 图集驱动回归 | 验证帧选择、缺失 clip 的显式回退和 reset 清理 |
| `src/rendering/DynamicScene.ts` | 场景注入接口 | 为真实图集 Provider 保留可插拔注入点 |
| `src/rendering/visuals.ts` | BuildingVisual 图集接线 | 在状态计划解析后驱动图集层；无资源时隐藏图集层并保留程序化降级 |

## 2026-07-17：第一百七十一轮图集加载接线

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/rendering/artwork/buildingAnimation.ts` | atlas manifest 加载器 | 校验建筑/等级清单、并行加载 Pixi Spritesheet 并建立 Provider 索引 |
| `src/rendering/artwork/buildingAnimationLoader.test.ts` | 加载契约回归 | 验证异步 URL 加载、clip 查询、重复键拒绝和字段校验 |
| `src/components/SimulationCanvas.tsx` | 运行时注入接线 | 允许美术交付的 manifest 启用图集，失败时安全回退程序化渲染 |

## 2026-07-17：第一百七十二轮部件与粒子运行时

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/rendering/artwork/buildingAnimation.ts` | 部件/粒子驱动 | 消费 `part-transform` 和 `particle` 槽位，按锚点和确定性进度更新对象池 |
| `src/rendering/artwork/buildingAnimation.test.ts` | 部件/粒子回归 | 验证部件纹理、锚点定位、轮轴进度和粒子槽位显示 |
| `src/rendering/DynamicScene.ts` | 动画选项传递 | 将部件、锚点、粒子 Provider 传递到 BuildingVisual |
| `src/components/SimulationCanvas.tsx` | 运行时资源入口 | 暴露 atlas manifest 与部件/粒子 Provider 注入接口 |

## 2026-07-17：第一百七十三轮动画预算门禁

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `tools/asset-validator/asset-validator.js` | 动画资源预算门禁 | 检查槽位、部件、粒子、锚点数量和粒子 LOD 降级策略 |
| `tools/asset-validator/self-test.js` | 超预算自测 | 构造超出槽位预算的清单，证明门禁会失败 |
| `tools/asset-validator/README.md` | 门禁文档 | 记录运行时预算与真实设备性能验证的边界 |

## 2026-07-17：第一百七十四轮动画压力基准

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/rendering/artwork/buildingAnimation.ts` | 运行时诊断接口 | 暴露动画对象池和可见节点计数，供压力回归和后续设备采样复用 |
| `src/qa/animationRuntimeBudget.test.ts` | 灰盒压力回归 | 覆盖 300 个宿主、150 个可见建筑、5 节点上限和二次同步对象复用 |
| `package.json` | QA 命令 | 提供 `npm run qa:animation-runtime-budget` |

## 2026-07-17：第一百七十五轮商业资源包门禁

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `tools/asset-validator/production-package-audit.js` | 生产包审计器 | 验证九级预览、DCC provenance、运行时图集、锚点和七状态证据的完整交付 |
| `docs/project/gold-slice/dcc-export-runbook.md` | 美术机交付手册 | 规定真实 DCC 导出后必须生成的资源包文件和验收命令 |
| `package.json` | 资产门禁命令 | 提供 `asset:production-package:audit` 与 `asset:production-package:self-test` |

## 2026-07-17：第一百七十六轮居民生命周期审计

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/core/SimulationEngine.ts` | 生命周期状态修复 | 迁出前快照居民职业和就业状态，避免删除 agent 后丢失离城事实 |
| `src/simulation/core/SimulationEngine.test.ts` | 居民生命周期回归 | 验证就业家庭迁出后的离城档案、职业分类、岗位释放与人口流动账本 |

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/contracts.ts` | 生命周期契约 | 保存迁入来源与入住结算 tick，供场景投影使用 |
| `src/simulation/core/SimulationEngine.ts` | 真实状态写入 | 迁入结算时写入 `origin: migrated` 与 `settledTick` |
| `src/rendering/visuals.ts` | 居民动态视觉层 | 候选状态色、状态点、新入住旗标与脉冲高亮，复用现有对象池 |
| `src/rendering/DynamicScene.test.ts` | 渲染回归证据 | 验证 walking 候选人与新入住居民在同一场景快照中的可区分状态 |
## 2026-07-17 第一百七十八轮：浏览器生命周期验收与资源加载

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/GameRuntime.ts` | 调试场景注入修复 | 将居民生命周期 fixture 重新注入 live engine，确保浏览器可见候选/入住差异 |
| `src/integration/GameRuntime.test.ts` | 集成回归 | 断言居民生命周期场景的候选与入住状态同时存在 |
| `src/qa/browserE2eScenarios.ts` | 浏览器验收场景 | 声明居民时间线必须显示候选家庭、外来家庭和居民状态 |
| `tools/browser-e2e/run-browser-e2e.cjs` | 浏览器 runner 幂等修复 | 避免重复切换已打开的城市瓶颈抽屉 |
| `src/rendering/artwork/buildingArtwork.ts` | 浏览器资源加载修正 | 以 Image resource 创建惰性纹理，避免字符串 Cache miss；仍需处理真实图像数据警告 |
## 2026-07-17 第一百七十九轮：建筑资源预加载

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/rendering/artwork/buildingArtwork.ts` | 资源预加载 Provider | 通过 Pixi Assets 预加载当前城市需要的建筑九级纹理，返回解码后的纹理 Provider |
| `src/rendering/index.ts` | 渲染 API 导出 | 暴露建筑资源预加载入口 |
| `src/components/SimulationCanvas.tsx` | 场景初始化接线 | 在 DynamicScene 创建前等待建筑资源准备完成，并保留取消后的安全销毁 |

## 2026-07-17 第一百八十轮：建筑资源预加载安全门禁

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/rendering/artwork/buildingArtwork.ts` | 加载安全契约 | 生成去重资源清单，限制纹理规模，支持超时与 AbortSignal 取消 |
| `src/rendering/artwork/buildingArtwork.test.ts` | 资源门禁回归 | 验证九级清单去重、预算失败与取消前置判断 |
| `src/components/SimulationCanvas.tsx` | 生命周期回退 | 建筑资源失败或场景销毁时安全使用程序化 Provider |

## 2026-07-18 第一百八十一轮：浏览器帧时间基线

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `tools/browser-e2e/run-browser-e2e.cjs` | 浏览器性能采样器 | 记录真实 rAF 帧时间、P95/最大长帧、画布尺寸和 WebGL readPixels 次数 |
| `docs/project/qa.md` | 性能证据记录 | 固化 headless 浏览器基线及 GPU stall 的归因边界 |

## 2026-07-18 第一百八十二轮：DynamicScene 分段性能采样

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/rendering/types.ts` | 性能契约 | 定义同步总耗时及地块、建筑、居民、掉落物、清理、排序阶段字段 |
| `src/rendering/DynamicScene.ts` | 运行时采样点 | 在场景同步过程中按阶段记录可选性能 profile |
| `src/components/SimulationCanvas.tsx` | 查询参数接线 | 仅在 `renderProfile=1` 时收集最多 120 条 profile，生产默认关闭 |
| `tools/browser-e2e/run-browser-e2e.cjs` | 统计输出 | 计算各阶段平均值和 P95，并与 rAF/readPixels 结果一起输出 |

## 2026-07-18 第一百八十三轮：动态实体数量证据

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/rendering/types.ts` | 实体计数契约 | 定义建筑、居民、运输、掉落物、可见和池化实体字段 |
| `src/rendering/DynamicScene.ts` | 场景实体采样点 | 将当前动态场景实体数量随同步 profile 输出 |
| `tools/browser-e2e/run-browser-e2e.cjs` | 浏览器证据聚合器 | 计算实体计数的最小值、最大值和末值，避免只看页面文本 |

## 2026-07-18 第一百八十四轮：多环境性能基线

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/qa/performanceBaseline.ts` | 性能环境与阈值契约 | 定义桌面 GPU、软件渲染、嵌入容器代理及平均/P95/最大帧时间门禁 |
| `src/qa/performanceBaseline.test.ts` | 性能契约测试 | 防止环境矩阵缺项、阈值弱化或红线结果被错误判为通过 |
| `tools/qa/run-performance-baseline.ts` | 可重复基线执行器 | 顺序启动三种 Chromium 配置，汇总场景、同步、帧时间和读回证据 |
| `tools/browser-e2e/run-browser-e2e.cjs` | 环境参数接入 | 根据 `BROWSER_E2E_PROFILE` 选择视口、设备像素比和 Chromium 图形参数 |

## 2026-07-18 第一百八十五轮：静态视觉失效优化

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/rendering/visuals.ts` | 建筑静态失效缓存 | 按建筑等级、状态和资源身份避免稳定主体与占位几何每帧重复重建，同时保持动态状态更新 |
| `src/rendering/DynamicScene.test.ts` | 渲染回归证据 | 覆盖动态场景同步与对象复用，防止缓存优化破坏视觉实体生命周期 |
| `docs/project/progress-dashboard.md` | 性能结论记录 | 记录优化后真实三环境结果，明确本轮未证明帧率改善 |

## 2026-07-18 第一百八十六轮：重复性能采样

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/qa/performanceBaseline.ts` | 稳健聚合契约 | 对多次样本按中位数评估帧时间、按最差值守护像素读回 |
| `src/qa/performanceBaseline.test.ts` | 聚合规则测试 | 防止性能统计因离群值或读回中位数而误报通过 |
| `tools/qa/run-performance-baseline.ts` | 多次执行器 | 默认每环境运行 3 次并保留原始结果，可通过 `PERF_BASELINE_REPEATS` 调整 |

## 2026-07-19 第一百八十七轮：重复矩阵实测证据

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `tools/qa/run-performance-baseline.ts` | 3×3 浏览器矩阵结果 | 真实采样桌面 GPU、软件渲染和嵌入容器代理，聚合中位数并保留原始运行证据 |
| `docs/project/qa.md` | 性能验收记录 | 记录场景、同步、readPixels 与帧时间的分项结果，明确门禁未通过 |

## 2026-07-19 第一百八十八轮：渲染提交归因

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/components/SimulationCanvas.tsx` | renderer.render 采样接线 | 仅在 `renderProfile=1` 时测量 Pixi renderer CPU 调用耗时 |
| `tools/browser-e2e/run-browser-e2e.cjs` | 渲染提交证据聚合 | 输出 renderer 平均/P95/最大耗时，与 rAF 和 DynamicScene 分开 |
| `src/qa/performanceBaseline.ts` | 渲染提交聚合契约 | 将多次 renderer profile 纳入中位数聚合并保留性能证据 |

## 2026-07-20 第一百八十九轮：渲染差分诊断

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/rendering/renderDiagnostics.ts` | 渲染差分配置解析器 | 默认保持完整渲染，按查询参数独立关闭地形、建筑 authored artwork 或图集动画 |
| `src/rendering/renderDiagnostics.test.ts` | 差分配置契约测试 | 验证默认配置和多个独立开关组合 |
| `tools/browser-e2e/run-browser-e2e.cjs` | 差分参数注入与回传 | 通过环境变量注入诊断参数，并输出实际运行时配置 |
| `tools/qa/run-render-ablation.ts` | 四模式差分执行器 | 对同一浏览器场景按模式重复采样并汇总帧时间、同步、renderer 提交与 readPixels |
| `src/rendering/artwork/buildingArtwork.ts` | 按等级建筑原画预加载 | 支持只加载当前快照需要的等级，保留未加载等级的运行时懒加载 |
| `src/rendering/artwork/buildingArtwork.test.ts` | 预加载清单契约测试 | 验证默认九级兼容行为和按等级去重行为 |
| `tools/asset-validator/runtime-artwork-budget-audit.js` | 运行时资源预算门禁 | 量化 PNG 下载体积、单包体积和估算 RGBA 显存；当前全量下载预算为 RED |
| `public/assets/buildings-runtime-384/**` | 384px 运行时发行包 | 由 512px 源 PNG 派生，供 Pixi 运行时使用；252 张、约 49.5 MiB |
| `tools/asset-validator/runtime-artwork-audit.js` | 运行时发行包完整性审计 | `--runtime` 模式检查 384×384、RGBA、九级覆盖和唯一性 |
| `tools/art-pipeline/build-runtime-artwork-derivatives.js` | 运行时派生包生产脚本 | 从源 PNG 批量生成 384px 发行层并写入 provenance manifest |
| `public/assets/buildings-runtime-384/runtime-artwork-manifest.json` | 派生包 provenance | 记录 252 个源文件哈希、源体积、产物体积和尺寸 |

## 2026-07-21 第一百九十四轮：文明规模验收

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/qa/civilizationScale.test.ts` | 规模场景与动态同步测试 | 实际验证 500 户、300 栋、150 初始 agent，以及 300 栋/450 可见实体的连续同步与对象保留 |
| `src/qa/civilizationLongRun.ts` | 长跑规模基线 | 在报告中记录目标规模基线，避免只用最大容量约束冒充规模覆盖 |
| `src/qa/civilizationLongRunCheck.ts` | 文明长跑验收命令 | 运行 7,200 tick 压力模拟并检查规模、人口、物流、阻塞和数值完整性 |
| `package.json` | `qa:civilization-scale` 命令 | 复现规模动态场景定向验收 |

## 2026-07-21 第一百九十五轮：真实浏览器规模验收

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/qa/stressScenario.ts` | 浏览器压力视口夹具 | 将 150 个移动实体和 300 栋压力建筑固定到可复现首屏区域，避免相机漂移污染规模断言 |
| `src/integration/GameRuntime.ts` | 规模调试场景接入 | 浏览器实际启动 500 户/300 栋/150 agent 快照，并合并压力建筑定义 |
| `src/qa/browserE2eScenarios.ts` | 实体规模验收契约 | 对真实浏览器 profile 增加 300 buildings、135 residents、15 transport、150 visible 最小值 |
| `tools/browser-e2e/run-browser-e2e.cjs` | 运行时实体门禁 | 消费真实渲染 profile 并对规模场景执行最小值检查 |
| `docs/project/qa.md` | 真实浏览器压力证据 | 记录规模通过与 118.52/166.4/166.4ms 帧时间红线 |

## 2026-07-21 第一百九十九轮：共享建筑 atlas

| 路径 | 产物类型 | 用途 |
| --- | --- | --- |
| `tools/art-pipeline/build-runtime-artwork-atlases.js` | 可重复图集生成器 | 将 28 类建筑的 9 级 384px PNG 按 3×3 排列为共享 atlas，并生成帧清单 |
| `public/assets/buildings-runtime-atlas/**` | 发行候选 atlas | 28 张 1152×1152 RGBA atlas，252 个精确等级帧；当前由诊断开关消费 |
| `src/rendering/artwork/buildingArtwork.ts` | atlas provider/manifest contract | 根据 assetId 和 level 创建共享纹理源上的 Rectangle 子纹理，并保留独立 PNG 回退 |
| `tools/qa/run-render-ablation.ts` | atlas 差分模式 | 支持 `atlas` 模式，与 full 模式输出可比浏览器帧时间 |

## 2026-07-22 第二百轮：默认发行路径

| 路径 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/rendering/renderDiagnostics.ts` | 默认渲染配置 | 默认启用共享建筑 atlas；`disableAtlas=1` 仅用于回归与降级 |
| `src/components/SimulationCanvas.tsx` | 运行时安全回退 | atlas 加载失败时使用独立 PNG provider，避免资产问题阻塞场景启动 |
| `tools/qa/run-render-ablation.ts` | 差分执行器待修复 | 支持 full/no-atlas/no-artwork/no-animation/no-terrain 差分；多次子进程本轮未稳定返回结果，下一轮修复生命周期后再恢复矩阵证据 |

## 2026-07-22 第二百零一轮：WebP atlas 发行优化

| 文件/目录 | 产物类型 | 用途 |
| --- | --- | --- |
| `public/assets/buildings-runtime-atlas-webp/**` | WebP 共享建筑图集 | 28 类建筑 × 9 级，共 252 帧；默认正式 atlas 发行资源 |
| `public/assets/buildings-runtime-atlas-webp/runtime-artwork-atlas-manifest.json` | 图集 manifest | 记录 WebP 格式、质量、帧矩形、源帧和资源版本 |
| `tools/art-pipeline/build-runtime-artwork-atlases.js` | 可重复图集生成器 | 从 384px 运行时派生层生成 WebP；可通过 `ATLAS_FORMAT=png` 生成对照包 |
| `tools/asset-validator/runtime-artwork-atlas-audit.js` | 图集完整性审计 | 校验 28 张 atlas、252 帧、扩展名、manifest 和文件体积 |
| `src/rendering/artwork/buildingArtwork.ts` | WebP atlas provider | 加载共享图集并按等级创建帧纹理，异常时回退独立 PNG |

## 2026-07-23 第二百零二轮：渲染差分生命周期

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `tools/qa/run-render-ablation.ts` | 稳定差分执行器 | 等待 `close`、清理进程组、处理超时与重复执行，避免无 JSON 或残留端口 |
| `tools/browser-e2e/run-browser-e2e.cjs` | 浏览器/Vite 生命周期清理 | 统一关闭浏览器和 preview 服务，并提供超时强杀兜底 |
| 三环境渲染矩阵 | 运行证据 | 桌面 GPU full/no-atlas 各 2 次；软件和嵌入容器五模式各 1 次，全部返回 JSON 且 readPixels=0 |

## 2026-07-21 第一百九十六轮：场景同步缓存优化

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/rendering/DynamicScene.ts` | 快照边界缓存 | 避免同一不可变快照在每个 ticker 帧重复重建建筑、居民和掉落图形 |
| `src/rendering/DynamicScene.test.ts` | 缓存兼容回归 | 验证 tick、集合引用和原地状态变更仍触发正确视觉更新 |
| `docs/project/progress-dashboard.md` | 方向性性能证据 | 记录同步/renderer 平均耗时下降与 rAF 长尾仍未通过 |

## 2026-07-21 第一百九十七轮：合成路径差分

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/rendering/renderDiagnostics.ts` | QA 渲染配置契约 | 解析 `disableAntialias=1` 与 `resolution=1`，生产默认画质不变 |
| `src/components/SimulationCanvas.tsx` | Pixi renderer 初始化开关 | 将诊断配置传递给抗锯齿和分辨率设置 |
| `src/rendering/renderDiagnostics.test.ts` | 配置解析回归 | 覆盖默认生产配置与 1x/无抗锯齿诊断配置 |
| `docs/project/qa.md` | 浏览器差分证据 | 记录 1x/无抗锯齿后 54.35/83.3/83.3ms 帧时间与 RED 结论 |

## 2026-07-21 第一百九十八轮：静态缓存实验

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/rendering/visuals.ts` | 建筑静态层拆分 | 将建筑主体/原画与状态动效分层，为后续批次优化提供边界 |
| `src/rendering/renderDiagnostics.ts` | 静态缓存诊断开关 | 通过 `staticBuildingCache=1` 复现实验，不改变正式默认 |
| `docs/project/integration-log.md` | 实验否证记录 | 记录缓存导致 renderer 与 rAF 恶化，避免重复走错路径 |

## 2026-07-23 第二百零三轮：目标规模全画质证据

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/qa/browserE2eScenarios.ts` | 压力场景契约 | 目标规模默认保留 authored artwork、animation、terrain，差分开关由 runner 显式注入 |
| `src/qa/browserE2eScenarios.test.ts` | 回归测试 | 防止 civilization-scale 压力场景再次被默认降级为模拟专用夹具 |
| `tools/qa/run-render-ablation.ts` | 目标规模运行证据 | 桌面 GPU full/no-atlas 与三种禁用层差分均稳定返回 JSON，readPixels=0 |
| `docs/project/qa.md` | 商业门禁记录 | 记录 300 栋全画质帧时间，明确功能通过但 60fps 门禁仍 RED |

## 2026-07-23 第二百零四轮：视口预裁剪

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/rendering/DynamicScene.ts` | 视口预裁剪实现 | 在更新 Graphics 前过滤不可见建筑、区域、居民、迁移候选和掉落，镜头移入时恢复视觉 |
| `src/rendering/DynamicScene.test.ts` | 裁剪回归测试 | 验证远端建筑不重建、镜头移入后恢复可见 |
| `docs/project/qa.md` | 性能验收证据 | 记录目标规模裁剪后的 renderer 与 rAF 数据，商业帧率继续 RED |
