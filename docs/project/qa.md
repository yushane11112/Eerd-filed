# 验收与性能基准

## 2026-08-10 第二百一十四轮验证

- 验证等级：Tier 3，运行时通知路径、URL 诊断参数、App profile、浏览器 E2E runner、渲染差分模式和性能基线聚合均有变更。
- 定向测试：`npm test -- src/integration/GameRuntime.test.ts src/ui/runtimeOptions.test.ts src/qa/performanceBaseline.test.ts src/qa/browserE2eScenarios.test.ts` 通过，4 个测试文件、47 项测试。
- 完整测试：`npm test` 通过，57 个测试文件、361 项测试，耗时约 212 秒。已知 jsdom `HTMLCanvasElement.getContext` warning 仍存在但不影响退出码；最慢项仍是多日文明压力场景。
- 生产构建：`npm run build` 通过，Vite 构建 2363 个模块。现有大 chunk warning 仍存在，非本轮新增阻断。
- 目标规模 React commit 对照：`RENDER_ABLATION_SCENARIO=civilization-scale RENDER_ABLATION_MODES=full,no-react-commit RENDER_ABLATION_REPEATS=1 npm run qa:render-ablation` 通过。
- `full`：空白页 rAF 16.66/16.8/16.8ms，游戏页 rAF 295.82/333.4/333.4ms；render sync P95 21.5ms，renderer P95 40.4ms，ticker elapsed P95 400ms，React commit interval P95 635ms。
- `no-react-commit`：空白页 rAF 16.54/16.7/16.8ms，游戏页 rAF 246.66/266.7/266.7ms；render sync P95 0ms，renderer P95 0.4ms，ticker elapsed P95 283.3ms，React commit interval 无样本，`advanceEmitSuppressed=true`。
- 结论：诊断开关证明 React tick 通知会制造可见 scene/renderer 成本，但抑制后 rAF 仍红灯；下一步继续排查 Pixi/browser 调度和 WebGL GPU stall。该模式不能作为生产玩法方案。
- 差异检查：`git diff --check` 通过。

## 2026-08-10 第二百一十三轮验证

- 验证等级：Tier 3，`GameRuntime.advance` 阶段 profile、App 采集、浏览器 E2E runner、渲染差分报告和性能基线聚合结构均有变更。
- 定向测试：`npm test -- src/integration/GameRuntime.test.ts src/qa/performanceBaseline.test.ts src/qa/browserE2eScenarios.test.ts` 通过，3 个测试文件、37 项测试。
- 完整测试：`npm test` 通过，57 个测试文件、359 项测试，耗时约 161 秒。已知 jsdom `HTMLCanvasElement.getContext` warning 仍存在但不影响退出码；最慢项仍是多日文明压力场景。
- 生产构建：`npm run build` 通过，Vite 构建 2363 个模块。现有大 chunk warning 仍存在，非本轮新增阻断。
- 目标规模 runtime 阶段 profile：`RENDER_ABLATION_SCENARIO=civilization-scale RENDER_ABLATION_MODES=full RENDER_ABLATION_REPEATS=1 npm run qa:render-ablation` 通过。
- 同一 Playwright page 空白页 rAF 为 16.45/16.7/16.8ms；游戏页 rAF 为 169.42/233.2/233.2ms，render sync P95 18.6ms，renderer P95 21.3ms，ticker elapsed P95 233.2ms。
- 应用层阶段样本：`runtime.advance` P95/最大 13/13ms，engine advance P95 8.5ms，snapshot clone P95 4.2ms，timeline/drops/rebuild P95 0ms，cache/emit P95 0.4ms；React commit interval P95/最大 446.1/446.1ms。
- 结论：`GameRuntime.advance` 阶段拆分已进入浏览器报告。当前样本显示运行时推进不是 200ms+ 帧间隔的主要来源，性能门禁继续 RED；下一步应聚焦 Pixi/browser 帧调度、WebGL GPU stall 和 React commit 节奏。
- 差异检查：`git diff --check` 通过。

## 2026-08-10 第二百一十二轮验证

- 验证等级：Tier 3，App renderProfile 采集、浏览器 E2E runner、渲染差分报告和性能基线聚合结构均有变更。
- 定向测试：`npm test -- src/qa/performanceBaseline.test.ts src/qa/browserE2eScenarios.test.ts` 通过，2 个测试文件、9 项测试。
- 完整测试：`npm test` 通过，57 个测试文件、358 项测试，耗时约 213 秒。已知 jsdom `HTMLCanvasElement.getContext` warning 仍存在但不影响退出码；最慢项仍是多日文明压力场景。
- 生产构建：`npm run build` 通过，Vite 构建 2363 个模块。现有大 chunk warning 仍存在，非本轮新增阻断。
- 目标规模应用层 profile：`RENDER_ABLATION_SCENARIO=civilization-scale RENDER_ABLATION_MODES=full RENDER_ABLATION_REPEATS=1 npm run qa:render-ablation` 通过。
- 同一 Playwright page 空白页 rAF 为 16.61/16.7/16.8ms；游戏页 rAF 为 816.65/866.7/866.7ms，render sync P95 73.7ms，renderer P95 96.9ms，ticker elapsed P95 1850ms。
- 应用层样本：`runtime.advance` 平均/P95/最大 25.16/63.2/63.2ms；React commit interval P95/最大 3511.5/3511.5ms；最后快照 tick 为 8。
- 结论：应用层推进已进入可观测报告。单样本波动很大，性能门禁继续 RED；下一步应拆分 `GameRuntime.advance` 内部阶段。
- 差异检查：`git diff --check` 通过。

## 2026-08-10 第二百一十一轮验证

- 验证等级：Tier 3，浏览器 E2E runner、渲染差分报告和性能基线聚合结构有变更。
- 定向测试：`npm test -- src/qa/performanceBaseline.test.ts src/qa/browserE2eScenarios.test.ts` 通过，2 个测试文件、9 项测试。
- 完整测试：`npm test` 通过，57 个测试文件、358 项测试。已知 jsdom `HTMLCanvasElement.getContext` warning 仍存在但不影响退出码。
- 生产构建：`npm run build` 通过，Vite 构建 2363 个模块。现有大 chunk warning 仍存在，非本轮新增阻断。
- 目标规模空白页基线：`RENDER_ABLATION_SCENARIO=civilization-scale RENDER_ABLATION_MODES=full RENDER_ABLATION_REPEATS=1 npm run qa:render-ablation` 通过。
- 同一 Playwright page 的空白页 rAF 为 16.45/16.7/16.8ms；加载游戏目标规模后 rAF 为 150/183.3/183.3ms，render sync P95 19.2ms，renderer P95 24ms，ticker callback/elapsed P95 19.3/183.3ms。
- 结论：runner/headless 的基础 rAF 没有全局节流，红灯发生在游戏页加载 Pixi/WebGL/主应用之后；商业帧率门禁继续 RED。
- 差异检查：`git diff --check` 通过。

## 2026-08-10 第二百一十轮验证

- 验证等级：Tier 3，渲染诊断参数、Pixi ticker 设置、浏览器报告和性能聚合口径均有变更。
- 定向测试：`npm test -- src/rendering/renderDiagnostics.test.ts src/qa/performanceBaseline.test.ts src/qa/browserE2eScenarios.test.ts` 通过，3 个测试文件、11 项测试。
- 完整测试：`npm test` 通过，57 个测试文件、358 项测试。已知 jsdom `HTMLCanvasElement.getContext` warning 仍存在但不影响退出码；本轮压力长跑耗时约 305 秒，需后续关注测试时长波动。
- 生产构建：`npm run build` 通过，Vite 构建 2363 个模块。现有大 chunk warning 仍存在，非本轮新增阻断。
- 目标规模 minFPS 对照：`RENDER_ABLATION_SCENARIO=civilization-scale RENDER_ABLATION_MODES=full,no-ticker-min-fps RENDER_ABLATION_REPEATS=1 npm run qa:render-ablation` 通过。
- 默认 `full`：`tickerMinFps=10`，ticker delta/elapsed P95 100/316.6ms，rAF 258.35/300/300ms，renderer P95 27.8ms，readPixels=0。
- `tickerMinFps=0`：ticker delta/elapsed P95 316.6/316.6ms，rAF 258.33/300/300ms，renderer P95 34.6ms，readPixels=0。
- 结论：`minFPS=10` 解释 `deltaMS=100ms` 封顶，但关闭 cap 不改善实际 rAF；商业帧率门禁继续 RED。
- 差异检查：`git diff --check` 通过。

## 2026-08-10 第二百零九轮验证

- 验证等级：Tier 3，性能基线聚合口径和三环境目标规模报告结构有变更。
- 定向测试：`npm test -- src/qa/performanceBaseline.test.ts src/qa/browserE2eScenarios.test.ts` 通过，2 个测试文件、9 项测试。
- 完整测试：`npm test` 通过，57 个测试文件、358 项测试。已知 jsdom `HTMLCanvasElement.getContext` warning 仍存在但不影响退出码。
- 生产构建：`npm run build` 通过，Vite 构建 2363 个模块。现有大 chunk warning 仍存在，非本轮新增阻断。
- 三环境目标规模矩阵：`PERF_BASELINE_SCENARIO=civilization-scale PERF_BASELINE_REPEATS=1 npm run qa:performance-baseline` 通过执行，报告 `ok=false`，因为商业帧率门禁仍 RED。
- 桌面 GPU：300 buildings、135 residents、15 transport、96 detailed / 204 reduced；rAF 150/183.3/183.3ms，render sync P95 11.3ms，renderer P95 17.3ms，ticker callback/elapsed P95 12/183.3ms，readPixels=0。
- 软件渲染：rAF 150/183.4/183.4ms，render sync P95 10.9ms，renderer P95 18.1ms，ticker callback/elapsed P95 10.9/183.4ms，readPixels=0。
- 嵌入容器代理：rAF 143.74/166.7/166.7ms，render sync P95 16.6ms，renderer P95 18.7ms，ticker callback/elapsed P95 16.6/166.7ms，readPixels=0。
- 结论：三环境均红灯，且桌面 GPU 与软件渲染接近；下一步优先排查 Pixi ticker 设置、浏览器调度、runner 采样和 GPU stall 警告，而不是继续只削减建筑视觉更新。
- 差异检查：`git diff --check` 通过。

## 2026-08-10 第二百零八轮验证

- 验证等级：Tier 3，主画布 renderProfile 采集、浏览器 E2E 报告和渲染差分汇总结构均有变更。
- 定向测试：`npm test -- src/qa/browserE2eScenarios.test.ts src/rendering/DynamicScene.test.ts src/rendering/renderDiagnostics.test.ts` 通过，3 个测试文件、23 项测试。
- 完整测试：`npm test` 通过，57 个测试文件、358 项测试。已知 jsdom `HTMLCanvasElement.getContext` warning 仍存在但不影响退出码。
- 生产构建：`npm run build` 通过，Vite 构建 2363 个模块。现有大 chunk warning 仍存在，非本轮新增阻断。
- 目标规模 ticker 对照：`RENDER_ABLATION_SCENARIO=civilization-scale RENDER_ABLATION_MODES=full,no-building-lod RENDER_ABLATION_REPEATS=1 npm run qa:render-ablation` 通过。
- `full` 样本：96 detailed / 204 reduced，render sync P95 10.9ms，renderer 6.96/17.4/17.4ms，ticker callback/sceneSync P95 10.9/10.9ms，ticker delta/elapsed P95 100/200ms，rAF 157.14/200/200ms。
- `no-building-lod` 样本：300 detailed / 0 reduced，render sync P95 11.6ms，renderer 7.08/23.6/23.6ms，ticker callback/sceneSync P95 11.7/11.6ms，ticker delta/elapsed P95 100/183.3ms，rAF 161.9/183.3/183.3ms。
- 两个模式应用层 `readPixels=0`，无 console error；浏览器仍出现 WebGL GPU stall warning。结论：主场景同步不是当前 160ms+ rAF 的主要来源，性能门禁继续 RED。
- 差异检查：`git diff --check` 通过。

## 2026-08-10 第二百零七轮验证

- 验证等级：Tier 3，浏览器性能采样边界和渲染差分报告结构有变更。
- 定向测试：`npm test -- src/qa/browserE2eScenarios.test.ts src/rendering/DynamicScene.test.ts src/rendering/renderDiagnostics.test.ts` 通过，3 个测试文件、23 项测试。
- 完整测试：`npm test` 通过，57 个测试文件、358 项测试。已知 jsdom `HTMLCanvasElement.getContext` warning 仍存在但不影响退出码。
- 生产构建：`npm run build` 通过，Vite 构建 2363 个模块。现有大 chunk warning 仍存在，非本轮新增阻断。
- 稳态目标规模对照：`RENDER_ABLATION_SCENARIO=civilization-scale RENDER_ABLATION_MODES=full,no-building-lod RENDER_ABLATION_REPEATS=1 npm run qa:render-ablation` 通过，输出 `profileWindow: steady-state-after-assertions`。
- 稳态样本：`full` 为 96 detailed / 204 reduced，render sync P95 13.2ms，renderer 6.211/19.2/19.2ms，rAF 175.02/216.8/216.8ms；`no-building-lod` 为 300 detailed / 0 reduced，render sync P95 13.1ms，renderer 6.05/22.5/22.5ms，rAF 164.27/266.6/266.6ms。
- 两个模式应用层 `readPixels=0`，无 console error；浏览器仍出现 WebGL GPU stall warning。结论：稳态 renderer 长尾已可与初始化长尾分离，但商业帧率门禁继续 RED。
- 差异检查：`git diff --check` 通过。

## 2026-08-10 第二百零六轮验证

- 验证等级：Tier 3，浏览器 E2E 契约、渲染差分工具和 reduced 建筑更新路径均有变更。
- 定向测试：`npm test -- src/rendering/DynamicScene.test.ts src/qa/browserE2eScenarios.test.ts src/rendering/renderDiagnostics.test.ts` 通过，3 个测试文件、23 项测试。
- 完整测试：`npm test` 通过，57 个测试文件、358 项测试。已知 jsdom `HTMLCanvasElement.getContext` warning 仍存在但不影响退出码。
- 生产构建：`npm run build` 通过，Vite 构建 2363 个模块。现有大 chunk warning 仍存在，非本轮新增阻断。
- 目标规模 LOD 对照：`RENDER_ABLATION_SCENARIO=civilization-scale RENDER_ABLATION_MODES=full,no-building-lod RENDER_ABLATION_REPEATS=1 npm run qa:render-ablation` 通过。
- 对照样本：`full` 为 300 buildings、135 residents、15 transport、96 detailedBuildings、204 reducedBuildings、rAF 149.99/183.3/183.3ms、renderer 19.633/46.2/345.7ms；`no-building-lod` 为 300 detailedBuildings、0 reducedBuildings、rAF 159.51/200/200ms、renderer 17.156/45.7/309.6ms。
- 两个模式应用层 `readPixels=0`，无 console error；浏览器仍出现 WebGL GPU stall warning。结论：LOD 对照矩阵可复跑，但 renderer 长尾仍 RED。
- 差异检查：`git diff --check` 通过。

## 2026-08-10 第二百零五轮验证

- 验证等级：Tier 3，目标规模渲染策略、浏览器性能采集字段和 QA 场景契约均有变更。
- 定向测试：`npm test -- src/rendering/DynamicScene.test.ts src/rendering/renderDiagnostics.test.ts src/qa/civilizationScale.test.ts src/qa/browserE2eScenarios.test.ts` 通过，4 个测试文件、25 项测试。已知 jsdom `HTMLCanvasElement.getContext` warning 不影响退出码。
- 完整测试：`npm test` 通过，57 个测试文件、358 项测试。已知 jsdom `HTMLCanvasElement.getContext` warning 仍存在但不影响退出码。
- 生产构建：`npm run build` 通过，Vite 构建 2363 个模块。现有大 chunk warning 仍存在，非本轮新增阻断。
- 差异检查：`git diff --check` 通过。
- 本机环境修复：家用电脑首次执行浏览器 E2E 时缺少 Playwright Chromium；已通过 `npx playwright install chromium` 安装本机浏览器运行时。
- 真实浏览器目标规模 E2E：`BROWSER_E2E_SCENARIO=civilization-scale BROWSER_E2E_RENDER_QUERY='renderProfile=1' npm run qa:browser-e2e` 通过；300 buildings、135 residents、15 transport、visible 331-349、detailedBuildings 96、reducedBuildings 204、应用层 `readPixels=0`、无 console error。
- 同次性能样本：render sync 平均/P95 6.481/36.1ms，建筑阶段平均/P95 5.565/33.4ms；rAF 平均/P95/最大 135.41/183.4/183.4ms；renderer 平均/P95/最大 14.297/39/293.5ms。
- 限制：浏览器仍出现 WebGL GPU stall warning，且帧时间远高于 16.7ms 商业目标；本轮只证明 LOD 生效和可统计，性能门禁继续 RED。

## 功能链路

- 道路未连接时，住宅不能获得可达岗位，生产建筑不能创建有效运输。
- 原料必须经过生产、订单、承运、逐格移动和交付后才能进入目标库存。
- 缺工、缺料、仓满、断路和财政不足必须提供明确停工原因。
- 暂停时模拟 Tick 不增长；倍速只改变执行频率，不改变单 Tick 结果。
- 普通材料不依赖听歌；歌曲完成事件只结算稀缺材料。
- 外来人口必须先进入候选状态，再根据城市吸引力、空房和等待时长决定入住或离开，不能凭空生成正式住户。

## 2026-07-14 真实游戏持续预览站验证

- 验证等级：Tier 2，变更仅涉及托管配置与项目记录，不改变游戏运行逻辑。
- 完整测试：`npm test` 通过，41 个测试文件、267 项测试。
- 生产构建：`npm run build` 通过，Vite 生成真实游戏入口和 React、Pixi、主逻辑、图标、样式等生产资源。
- 公网入口：`https://little-ear-island-game-preview.netlify.app/` 返回 HTTP 200，HTTPS 证书校验通过，页面标题为“小耳岛”。
- 公网资源：入口引用的 5 个主要 JS/CSS 资源全部返回 HTTP 200；首次发布状态为 ready。
- 持续部署：Netlify 成功添加 GitHub deploy key 和 notification hooks，确认分支与 PR 推送可触发自动构建。
- 差异检查：`git diff --check` 通过。
- 限制：预览站更新以 GitHub 推送为边界，本地未提交/未推送代码不会出现在站点上。

## 2026-07-13 第一百一十四轮验证

- 验证等级：Tier 3，物流队列契约、卸货模拟解释、治理卡、建筑详情面板和浏览器场景契约均有变更。
- 定向测试：`npm test -- src/simulation/economy/economy.test.ts src/integration/stageAdvisor.test.ts src/ui/cityAdvisorUi.test.ts src/qa/browserE2eScenarios.test.ts` 通过，4 个测试文件、62 项测试。
- 单场景真实浏览器 E2E：`BROWSER_E2E_SCENARIO=logistics-storage-build npm run qa:browser-e2e` 通过；场景可见“每刻卸货 2 单”，点击“分流卸货压力”后 toast 显示“粮仓已作为物流缓冲落成”。
- 完整测试：`npm test` 通过，41 个测试文件、267 项测试。
- 生产构建：`npm run build` 通过。
- 完整浏览器 E2E：`npm run qa:browser-e2e` 通过，7 个固定场景全部通过；覆盖道路补线、财政不足、桥梁缺口、物流热点、物流扩仓建造、来源库存检查和服务治理。
- 差异检查：`git diff --check` 通过。
- TDD/QA 过程发现：原 `logistics-storage-build` 场景用手写固定 1 单能力，页面运行后会被真实引擎刷新为市场自身 2 单能力，且 18 单排队会在 QA 点击前消化；本轮改为真实能力文本并扩大排队压力窗口，避免测试只验证瞬时假状态。
- 限制：本轮完成治理卡和建筑详情的文本解释，还没有把卸货能力来源短标签直接绘制到物流图层热点旁。

## 2026-07-13 第一百一十三轮验证

- 验证等级：Tier 3，新增真实浏览器治理场景并覆盖物流仓储建造动作，影响 URL 调试入口、QA 契约和浏览器点击链路。
- 定向测试：`npm test -- src/qa/browserE2eScenarios.test.ts src/ui/runtimeOptions.test.ts` 通过，2 个测试文件、11 项测试。
- 运行时诊断脚本：`logistics-storage-build` 初始治理卡包含“物流热点拥堵 / 分流卸货压力 / split-unload / buildable=true”，确认场景能稳定生成仓储候选。
- 单场景真实浏览器 E2E：`BROWSER_E2E_SCENARIO=logistics-storage-build npm run qa:browser-e2e` 通过；点击“分流卸货压力”后 toast 显示“粮仓已作为物流缓冲落成”。
- TDD 红例：复用旧 `logistics-hotspot` 场景时，页面运行数 tick 后会被诊断为“没有空闲承运人”，点击器找不到仓储按钮；本轮因此新增专门的卸货排队建仓场景，并稳定旧热点场景的承运状态。
- 完整浏览器 E2E：`npm run qa:browser-e2e` 通过，7 个固定场景全部通过；覆盖道路补线、财政不足、桥梁缺口、物流热点、物流扩仓建造、来源库存检查和服务治理。
- 完整测试：`npm test` 通过，41 个测试文件、266 项测试。
- 生产构建：`npm run build` 通过。
- 差异检查：`git diff --check` 通过。
- 限制：浏览器场景证明真实点击建仓成功，但队列改善、承运释放和订单重置的细节仍需后续在 UI 中解释。

## 2026-07-13 第一百一十二轮验证

- 验证等级：Tier 3，升级经济表结构变化会影响运行时升级报价、材料缺口和城市仓储扣料。
- 定向测试：`npm test -- src/simulation/economy/constructionTable.test.ts src/simulation/economy/upgrades.test.ts` 通过，2 个测试文件、16 项测试。
- 运行时回归：`npm test -- src/integration/GameRuntime.test.ts src/simulation/economy/economy.test.ts` 通过，2 个测试文件、59 项测试。
- 开发构建：`npm run build -- --mode development` 通过。
- 完整测试：`npm test` 通过，41 个测试文件、265 项测试。
- 生产构建：`npm run build` 通过。
- 差异检查：`git diff --check` 通过。
- 限制：本轮完成分类型升级曲线的结构和运行时接入，但仍未完成按容量、产能、维护费、服务价值和回本周期校准的商业级经济平衡。

## 2026-07-13 第一百一十一轮验证

- 验证等级：Tier 3，新增真实浏览器治理场景和点击后面板断言，影响 QA 契约、URL 调试入口和 E2E runner。
- 定向测试：`npm test -- src/ui/cityAdvisorUi.test.ts src/qa/browserE2eScenarios.test.ts src/ui/runtimeOptions.test.ts src/integration/GameRuntime.test.ts` 通过，4 个测试文件、39 项测试。
- 单场景真实浏览器 E2E：`BROWSER_E2E_SCENARIO=logistics-source-shortage npm run qa:browser-e2e` 通过；点击“检查来源库存”后 toast 显示“已定位到「粮仓」。”，并验证“物流执行计划：来源库存”面板可见。
- 完整测试：`npm test` 通过，41 个测试文件、265 项测试。
- 生产构建：`npm run build` 通过。
- 差异检查：`git diff --check` 通过。
- 限制：本轮加固来源库存治理的浏览器回归，不新增物流调度算法；物流仓储建造成功点击 E2E 仍需后续补齐。

## 2026-07-12 第一百一十轮验证

- 验证等级：Tier 3，物流卸货吞吐规则变化，影响订单交付、卸货队列和长跑压力读数。
- 目标测试：`npm test -- src/simulation/economy/economy.test.ts` 通过，1 个测试文件、33 项测试，覆盖显式低吞吐排队和默认建筑分层卸货能力。
- 完整测试：`npm test` 通过。
- 开发构建：`npm run build -- --mode development` 通过。
- 生产构建：`npm run build` 通过。
- 差异检查：`git diff --check` 通过。
- 限制：本轮没有新增 UI 解释层；玩家仍主要通过卸货队列结果感知差异，后续应在建筑详情或物流图层展示卸货能力来源。

## 2026-07-12 第一百零九轮验证

- 验证等级：Tier 3，物流仓储执行计划接入真实运行时动作，影响财政、库存、订单、承运和 UI 治理卡入口。
- 目标测试：`npm test -- src/integration/GameRuntime.test.ts` 通过，1 个测试文件、26 项测试，覆盖建仓扣费、订单重置、承运释放和卸货队列清理。
- 完整测试：`npm test` 通过。
- 开发构建：`npm run build -- --mode development` 通过。
- 生产构建：`npm run build` 通过。
- 差异检查：`git diff --check` 通过。
- 限制：本轮没有新增浏览器真实点击 E2E；运行时和 UI 入口已接通，后续应补物流仓储建造点击场景，并继续推进卸货能力分层。

## 2026-07-12 第一百零八轮验证

- 验证等级：Tier 2，主画布 agent 活动与状态反馈改动。
- 目标测试：`npm test -- src/rendering/DynamicScene.test.ts` 通过，1 个测试文件、12 项测试，覆盖通勤、服务访问、取货和送货 agent 的稳定活动层。
- 开发构建：`npm run build -- --mode development` 通过。
- 生产构建：`npm run build` 通过。
- 浏览器截图验收：本机 Chrome 打开 `http://127.0.0.1:5174/`，canvas 为 1440×900，截图 `/tmp/eerd-visual-slice-108-activity.png`。console 仅出现一个资源 404，未发现游戏脚本错误或空白画布。
- 限制：本轮没有增加模拟实体数量，只增强现有 agent 的可读性；下一轮应推进物流扩仓/分流卸货真实动作。

## 2026-07-12 第一百零七轮验证

- 验证等级：Tier 2，主画布道路与地形质感改动。
- 目标测试：`npm test -- src/rendering/roads.test.ts` 通过，1 个测试文件、2 项测试，覆盖土路、石路和桥梁铺装模式差异。
- 开发构建：`npm run build -- --mode development` 通过。
- 生产构建：`npm run build` 通过。
- 浏览器截图验收：本机 Chrome 打开 `http://127.0.0.1:5174/`，canvas 为 1440×900，截图 `/tmp/eerd-visual-slice-107-streets.png`。console 仅出现一个资源 404，未发现游戏脚本错误或空白画布。
- 限制：本轮验证主画布可见纹理和构建健康，不等于最终美术资产验收；活动密度和状态反馈仍需下一轮继续。

## 2026-07-12 第一百零六轮验证

- 验证等级：Tier 2，主画布 starter 视觉改动。
- 目标测试：`npm test -- src/rendering/DynamicScene.test.ts src/rendering/prefab/registry.test.ts` 通过，2 个测试文件、15 项测试，覆盖 starter prefab registry 和 `windfield-rice` 稻田细节层。
- 开发构建：`npm run build -- --mode development` 通过。
- 生产构建：`npm run build` 通过。
- 浏览器截图验收：本机 Chrome 打开 `http://127.0.0.1:5174/`，canvas 为 1440×900，截图 `/tmp/eerd-visual-slice-105-starter.png`。Playwright 自带 Chromium 未安装，已改用系统 Google Chrome；console 仅出现一个资源 404，未发现游戏脚本错误或空白画布。
- 限制：本轮仍是程序化占位和临时 descriptor，不是最终商业美术；道路铺装、街区边界、水岸和活动密度仍需后续视觉轮处理。

## 2026-07-12 第一百零五轮验证

- 验证等级：Tier 0，纯项目目标、节奏和文档接续校准。
- `git diff --check`：通过。
- 未运行 `npm test` 和 `npm run build`：本轮没有修改运行时代码、构建配置、测试代码或依赖，完整测试和构建不会提供额外有效信号。
- 交付要求：文档更新后提交并推送 GitHub，保证其他电脑读取 `docs/project/execution-strategy.md`、`HANDOFF.md` 和 `progress-dashboard.md` 时目标稳定统一。

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

## 2026-07-16 第一百一十五轮验证

- 目标 GREEN：`npm test -- src/integration/GameRuntime.test.ts src/ui/cityAdvisorUi.test.ts src/qa/browserE2eScenarios.test.ts` 通过，35 项测试覆盖物流建成结果快照、文案和浏览器契约。
- 浏览器验收：`BROWSER_E2E_SCENARIO=logistics-storage-build npm run qa:browser-e2e` 通过；真实点击“分流卸货压力”后验证 toast 与“建成后的物流变化”详情均出现。
- 生产构建：浏览器命令内置 `npm run build` 通过，Vite 产物正常生成。
- 浏览器仅记录 Chromium/WebGL 驱动 warning，无应用 console error。
- 本轮变更尚未完成全量回归；提交前将继续运行 `npm test`、`npm run build` 和 `git diff --check`。

## 2026-07-16 第一百一十六轮验证

- 目标 GREEN：`npm test -- src/qa/upgradeEconomyAudit.test.ts src/simulation/economy/economy.test.ts src/simulation/economy/upgrades.test.ts` 通过，49 项测试覆盖升级审计、服务吞吐联动和既有经济行为。
- 审计命令：`npm run qa:upgrade-economy-audit` 通过，覆盖 5 类建筑、40 个升级节点，输出健康/慢回本/无回报分类及生产联动缺口。
- 服务联动：服务队列容量由等级函数驱动，1 级兼容旧口径；现有经济测试通过。
- 全量回归：`npm test` 通过，42 个测试文件、272 项测试；长稳文明场景通过。
- 生产构建：`npm run build` 通过；`git diff --check` 通过。

## 2026-07-17 第一百一十七轮验证

- 目标 GREEN：`npm test -- src/integration/GameRuntime.test.ts src/qa/upgradeEconomyAudit.test.ts src/simulation/economy/upgrades.test.ts` 通过，43 项测试覆盖经济摘要、升级运行时和审计口径。
- 生产构建：`npm run build` 通过，升级详情 UI 和新增样式可打包。
- 差异检查：`git diff --check` 通过。
- 浏览器 QA：`npm run qa:browser-e2e` 重试 2 次均在本地预览服务启动后等待 `http://127.0.0.1:4173` 超时；构建本身成功，未取得浏览器交互证据，因此本轮不宣称浏览器验收通过。

## 2026-07-17 第一百一十八轮验证

- 目标 GREEN：`npm test -- src/integration/GameRuntime.test.ts src/qa/upgradeEconomyAudit.test.ts src/integration/stageAdvisor.test.ts` 通过，50 项测试覆盖顾问依赖的运行时快照、升级审计和城市治理逻辑。
- 生产构建：`npm run build` 通过，城市顾问新增“升级经济风险”卡可打包。
- 差异检查：`git diff --check` 通过。
- 浏览器验收：调试日志确认 Vite preview 在监听 `127.0.0.1:4173` 时返回 `listen EPERM: operation not permitted`；当前沙箱禁止本地 socket 监听，不能把静态构建当作真实交互证据，需在允许本地监听的环境补跑。

## 2026-07-17 第一百一十九轮验证

- 目标 GREEN：`npm test -- src/integration/stageAdvisor.test.ts src/rendering/DynamicScene.test.ts` 通过，34 项测试覆盖物流图层徽标、治理叠加层和动态场景同步。
- 全量回归：`npm test` 通过，当前测试集全部通过。
- 生产构建：`npm run build` 通过；`git diff --check` 通过。
- 浏览器验收：本轮不宣称通过；当前环境仍需允许 `127.0.0.1:4173` 本地监听后补跑真实场景。

## 2026-07-17 第一百二十轮验证

- 目标 GREEN：`npm test -- src/qa/logisticsStorageInterventionAudit.test.ts src/integration/GameRuntime.test.ts src/simulation/core/SimulationEngine.test.ts` 通过，43 项测试覆盖历史审计、扩仓运行时结果和模拟重建。
- 全量回归：`npm test` 通过，当前测试集全部通过。
- 审计命令：`npm run qa:logistics-storage-audit` 通过，输出当前快照历史有效；初始场景无干预记录属于预期。
- 生产构建：`npm run build` 通过；`git diff --check` 通过。
- 浏览器验收：仍未取得真实交互证据，原因仍是当前环境禁止本地预览服务监听。

## 2026-07-17 第一百二十一轮验证

- 目标 GREEN：`npm test -- src/ui/cityAdvisorUi.test.ts src/integration/GameRuntime.test.ts` 通过，32 项测试覆盖物流历史汇总和建筑详情既有动作链路。
- 生产构建：`npm run build` 通过，历史记录卡和样式正常打包。
- 浏览器验收：尚未取得真实点击证据；本地预览监听限制仍未解除。

## 2026-07-17 第一百二十二轮验证

- 目标 GREEN：`npm test -- src/simulation/economy/logisticsInterventions.test.ts src/qa/logisticsStorageInterventionAudit.test.ts src/integration/GameRuntime.test.ts` 通过，31 项测试覆盖 205 条事件保留边界、归档审计和扩仓运行时。
- 生产构建：`npm run build` 通过，新增归档契约和运行时策略正常打包。
- 浏览器验收：本轮未取得真实交互证据；当前环境仍禁止本地预览监听。

## 2026-07-17 第一百二十三轮验证

- 目标 GREEN：`npm test -- src/ui/cityAdvisorUi.test.ts src/simulation/economy/logisticsInterventions.test.ts src/qa/logisticsStorageInterventionAudit.test.ts src/integration/GameRuntime.test.ts` 通过，38 项测试覆盖城市管理归档文案、归档边界审计和运行时持久化。
- 全量回归：`npm test` 通过，44 个测试文件、280 项测试全部通过；其中包含多日压力场景。
- 生产构建：`npm run build` 通过，2353 个模块正常打包；`git diff --check` 通过。
- 浏览器验收：本轮仍未取得真实点击证据；当前环境禁止 `127.0.0.1:4173` 本地监听，需在允许本地 socket 的环境补跑。

## 2026-07-17 第一百二十四轮验证

- 目标 GREEN：`npm test -- src/ui/cityAdvisorUi.test.ts src/integration/GameRuntime.test.ts src/qa/logisticsStorageInterventionAudit.test.ts` 通过，38 项测试覆盖时间线格式、建筑定位依赖的运行时快照和归档审计。
- 全量回归：`npm test` 通过，44 个测试文件、281 项测试全部通过；多日压力场景通过。
- 生产构建：`npm run build` 通过；`git diff --check` 通过。
- 浏览器验收：本轮仍未取得真实点击证据；当前环境禁止 `127.0.0.1:4173` 本地监听，需在允许本地 socket 的环境补跑时间线点击场景。

## 2026-07-17 第一百二十五轮验证

- 目标 GREEN：`npm test -- src/integration/cityTimeline.test.ts src/ui/cityAdvisorUi.test.ts src/integration/GameRuntime.test.ts src/simulation/core/SimulationEngine.test.ts` 通过，51 项测试覆盖文明事件映射、窗口边界、UI 分类和运行时推进。
- 全量回归：`npm test` 通过，45 个测试文件、284 项测试全部通过；多日压力场景通过。
- 生产构建：`npm run build` 通过，2354 个模块正常打包；`git diff --check` 通过。
- 浏览器验收：本轮仍未取得真实点击证据；当前环境禁止 `127.0.0.1:4173` 本地监听，需在允许本地 socket 的环境补跑城市运行时间线场景。

## 2026-07-17 第一百二十六轮验证

- 目标 GREEN：`npm test -- --run src/integration/cityTimeline.test.ts src/ui/cityAdvisorUi.test.ts src/ui/runtimeOptions.test.ts src/qa/browserE2eScenarios.test.ts src/integration/GameRuntime.test.ts` 通过，49 项测试覆盖居民状态映射、文案、调试场景和运行时推进。
- 全量回归：`npm test` 通过，45 个测试文件、285 项测试全部通过；多日压力场景通过。
- 生产构建：`npm run build` 通过，2354 个模块正常打包；`git diff --check` 通过。
- 浏览器验收：新增 `civilization-resident-timeline` 场景契约，但本轮仍未取得真实点击证据；当前环境禁止 `127.0.0.1:4173` 本地监听，需在允许本地 socket 的环境补跑。

## 2026-07-17 第一百二十七轮验证

- 目标 GREEN：`npm test -- --run src/integration/residentGovernance.test.ts src/rendering/DynamicScene.test.ts src/ui/cityAdvisorUi.test.ts src/qa/browserE2eScenarios.test.ts` 通过，28 项测试覆盖居民生活摘要、职业活动和既有动态场景。
- 全量回归：`npm test` 通过，45 个测试文件、287 项测试；长时间文明压力场景保持通过。
- 生产构建：`npm run build` 通过，2355 个模块正常打包；`git diff --check` 通过。
- 浏览器验收：本轮没有取得真实点击证据；居民卡复用既有城市管理入口，待允许 `127.0.0.1:4173` 本地监听后补跑并留存截图/日志。
- 浏览器契约补强：`civilization-resident-timeline` 额外断言“居民生活”和“就业”文本，定向场景契约测试通过。

## 2026-07-17 第一百二十八轮验证

- 目标 GREEN：定向模拟、经济、时间线和居民治理测试通过，覆盖岗位变更、低健康缺勤、恢复出勤和有效劳动力计算。
- 全量回归：`npm test` 通过，46 个测试文件、289 项测试；长时间文明压力场景保持通过。
- 生产构建：`npm run build` 通过，2356 个模块正常打包；`git diff --check` 通过。
- 浏览器验收：居民治理场景契约已更新，但本轮仍未取得真实点击证据；当前环境禁止 `127.0.0.1:4173` 本地监听，需在允许本地 socket 的环境补跑。

## 2026-07-17 第一百二十九轮验证

- 目标 GREEN：定向迁移/时间线测试通过，覆盖关键需求、失业和低满意度三类离城原因及旧记录回退。
- 全量回归：`npm test` 通过，46 个测试文件、289 项测试；长时间文明压力场景通过。
- 生产构建：上一轮同一代码变更后的 `npm run build` 已通过，2356 个模块；本轮文档更新后的 `git diff --check` 已通过。
- 浏览器验收：仍未取得真实点击证据；本地 `127.0.0.1:4173` 监听限制未解除。

## 2026-07-17 第一百三十轮验证

- 目标 GREEN：定向模拟引擎与城市时间线测试通过，覆盖需求短板累计、具体需求类型、长期缺勤累计和迁出文案。
- 全量回归：`npm test` 通过，46 个测试文件、291 项测试；长时间文明压力场景通过。
- 生产构建：`npm run build` 通过，2356 个模块正常打包；`git diff --check` 通过。
- 浏览器验收：本轮仍未取得真实点击证据；当前环境禁止 `127.0.0.1:4173` 本地监听，待允许本地 socket 的环境补跑居民治理与迁出原因场景。

## 2026-07-17 第一百三十一轮验证

- 目标 GREEN：定向服务经济、居民治理、模拟引擎和城市时间线测试通过，覆盖五类服务短板原因、持续刻数、恢复清除和迁出解释。
- 全量回归：`npm test` 通过，46 个测试文件、292 项测试；长时间文明压力场景通过。
- 生产构建：`npm run build` 通过，2356 个模块正常打包；`git diff --check` 通过。
- 浏览器验收：本轮仍未取得真实点击证据；当前环境禁止 `127.0.0.1:4173` 本地监听，待允许本地 socket 的环境补跑。

## 2026-07-17 第一百三十二轮验证

- 目标 GREEN：`src/integration/stageAdvisor.test.ts` 23 项测试通过，覆盖无服务设施的城市级提示、住宅入口定位和服务图层建议。
- 全量回归：`npm test` 通过，46 个测试文件、293 项测试；长时间文明压力场景通过。
- 生产构建：`npm run build` 通过，2356 个模块正常打包；`git diff --check` 通过。
- 浏览器验收：本轮未取得真实点击证据；当前环境禁止 `127.0.0.1:4173` 本地监听，待允许本地 socket 的环境补跑。

## 2026-07-17 第一百三十七轮验证

- 定向回归：54 项通过，覆盖人口迁入账本、净迁入指标、居民治理派生和公共服务维护成本拆分。
- 全量回归：`npm test` 通过，47 个测试文件、300 项测试。
- 生产构建：`npm run build` 通过，2356 个模块正常打包。
- 变更检查：`git diff --check` 通过。
- 浏览器验收：当前环境仍无法监听 `127.0.0.1:4173`，居民治理卡的真实点击截图/日志保留到可监听环境执行。

## 2026-07-17 第一百三十八轮验证

- 定向回归：21 项通过，覆盖迁出结构账本和居民治理人口流动解释器。
- 全量回归：`npm test` 通过，47 个测试文件、301 项测试。
- 生产构建：`npm run build` 通过，2356 个模块正常打包。
- 变更检查：`git diff --check` 通过。
- 浏览器验收：当前环境仍无法监听 `127.0.0.1:4173`，结构审计面板真实点击证据待可监听环境补跑。

## 2026-07-17 第一百三十六轮验证

- 定向服务与模拟引擎回归通过：服务设施覆盖回升、公共服务短板降低覆盖和城市吸引力均有断言。
- 全量回归：`npm test` 通过，47 个测试文件、299 项测试。
- 生产构建：`npm run build` 通过，2356 个模块正常打包。
- 变更检查：`git diff --check` 通过。
- 浏览器验收：尚未取得真实点击画面，原因仍是当前环境禁止 `127.0.0.1:4173` 本地监听；下一轮保留浏览器层验证。

## 2026-07-17 第一百三十四轮验证

- 定向服务设施闭环：`src/qa/serviceFacilityScenarios.test.ts` 通过，覆盖药铺公共建造接口、配工、药材库存、服务访问和健康恢复。
- 新增 `npm run qa:service-facility-runtime`，作为后续浏览器场景的确定性灰盒基准。
- 代码层验证：`npm test` 通过，47 个测试文件、295 项测试；`npm run build` 通过，2356 个模块；`git diff --check` 通过。
- 浏览器验收：仍受当前环境禁止 `127.0.0.1:4173` 本地监听限制，暂未取得真实点击截图/日志。

## 2026-07-17 第一百三十五轮验证

- 定向服务设施回归：3 个场景通过，覆盖药铺、书院、戏台的建造、配工、服务事件和对应居民需求恢复；3 个故障夹具通过，覆盖缺工、缺药材和断路。
- 全量回归：`npm test` 通过，47 个测试文件、298 项测试。
- 生产构建：`npm run build` 通过，2356 个模块正常打包。
- 变更检查：`git diff --check` 通过。
- 浏览器验收：仍受当前环境禁止 `127.0.0.1:4173` 本地监听限制，尚未取得真实点击截图/日志；代码层 QA 已完成，浏览器层保留为下一轮验收项。

## 2026-07-17 第一百三十九轮验证

- 定向回归：48 项通过，覆盖离城居民档案生成、运行时桥接和时间线渲染。
- 全量回归：`npm test` 通过，47 个测试文件、302 项测试。
- 生产构建：`npm run build` 通过，2356 个模块正常打包。
- 变更检查：`git diff --check` 通过。
- 浏览器验收：当前环境仍无法监听 `127.0.0.1:4173`，离城居民卡片真实点击证据待可监听环境补跑。

## 2026-07-17 第一百四十轮验证

- 定向回归：65 项通过，覆盖财政结算刻度、迁出原因/服务瓶颈与财政快照时间线关联。
- 全量回归：`npm test` 通过，47 个测试文件、302 项测试。
- 生产构建：`npm run build` 通过，2356 个模块正常打包。
- 变更检查：`git diff --check` 通过。
- 浏览器验收：当前环境仍无法监听 `127.0.0.1:4173`，财政关联文本真实点击证据待可监听环境补跑。

## 2026-07-17 第一百四十一轮验证

- 定向回归：31 项通过，覆盖财政历史消费、运行时桥接和人口时间线兼容行为。
- 全量回归：`npm test` 通过，47 个测试文件、302 项测试。
- 生产构建：`npm run build` 通过，2356 个模块正常打包。
- 变更检查：`git diff --check` 通过。
- 浏览器验收：当前环境仍无法监听 `127.0.0.1:4173`，人口时间线财政前后变化的真实点击证据待可监听环境补跑。

## 2026-07-17 第一百四十二轮验证

- 定向回归：40 项通过，覆盖服务恢复前后值、财政快照关联和旧事件兼容。
- 全量回归：`npm test` 通过，47 个测试文件、303 项测试。
- 生产构建：`npm run build` 通过，2356 个模块正常打包。
- 变更检查：`git diff --check` 通过。
- 浏览器验收：当前环境仍无法监听 `127.0.0.1:4173`，服务恢复时间线的真实点击证据待可监听环境补跑。

## 2026-07-17 第一百四十三轮验证

- 定向回归：67 项通过，覆盖服务瓶颈解除事件、建筑 `blocked→serving` 转换、压力清除和时间线展示。
- 全量回归：`npm test` 通过，47 个测试文件、304 项测试。
- 生产构建：`npm run build` 通过，2356 个模块正常打包。
- 变更检查：`git diff --check` 通过。
- 浏览器验收：当前环境仍无法监听 `127.0.0.1:4173`，服务恢复真实点击证据待可监听环境补跑。

## 2026-07-17 第一百四十四轮验证

- 定向回归：44 项通过，覆盖恢复记录共用文案、时间线消费、治理定位和建筑详情构建。
- 全量回归：`npm test` 通过，47 个测试文件、305 项测试。
- 生产构建：`npm run build` 通过，2356 个模块正常打包。
- 变更检查：`git diff --check` 通过。
- 浏览器验收：当前环境仍无法监听 `127.0.0.1:4173`，恢复面板真实点击证据待可监听环境补跑。

## 2026-07-17 第一百四十五轮验证

- 定向回归：78 项通过，覆盖服务系统恢复事件、时间线结构化映射、建筑状态与财政读数展示契约。
- 全量回归：`npm test` 通过，47 个测试文件、305 项测试。
- 生产构建：`npm run build` 通过，2356 个模块正常打包。
- 变更检查：`git diff --check` 通过。
- 浏览器验收：当前环境仍无法监听 `127.0.0.1:4173`，恢复详情的真实点击证据待可监听环境补跑。

## 2026-07-17 第一百四十六轮验证

- 定向回归：13 项通过，覆盖动态场景图层和服务恢复脉冲状态层。
- 全量回归：`npm test` 通过，47 个测试文件、306 项测试。
- 生产构建：`npm run build` 通过，2356 个模块正常打包。
- 变更检查：`git diff --check` 通过。
- 浏览器验收：当前环境仍无法监听 `127.0.0.1:4173`，画布动效与恢复详情的真实点击证据待可监听环境补跑。

## 2026-07-17 第一百四十七轮验证

- 定向回归：13 项通过，覆盖阻塞原因图形层、恢复脉冲和动态场景对象复用。
- 生产构建：`npm run build` 通过，2356 个模块正常打包。
- 变更检查：`git diff --check` 通过。
- 浏览器验收：当前环境仍无法监听 `127.0.0.1:4173`，阻塞/恢复画布动效的真实点击证据待可监听环境补跑。

## 2026-07-17 第一百四十八轮验证

- 定向回归：69 项通过，覆盖居民治理、生产、服务、物流、升级、模拟引擎和动态场景。
- 全量回归：`npm test -- --run` 通过，47 个测试文件、307 项测试。
- 生产构建：`npm run build` 通过，2356 个模块正常打包。
- 变更检查：`git diff --check` 通过。
- 浏览器验收：当前环境仍无法监听 `127.0.0.1:4173`，治理摘要的真实点击与画布反馈证据待可监听环境补跑。

## 2026-07-17 第一百四十九轮验证

- 定向回归：67 项通过，覆盖时间线、模拟引擎、运行时、居民治理和管理 UI。
- 全量回归：`npm test -- --run` 通过，47 个测试文件、308 项测试。
- 生产构建：`npm run build` 通过，2356 个模块正常打包。
- 变更检查：`git diff --check` 通过。
- 浏览器验收：当前环境仍无法监听 `127.0.0.1:4173`，阻塞生命周期的真实时间线与建筑详情点击证据待可监听环境补跑。

## 2026-07-17 第一百五十轮验证

- 定向回归：56 项通过，覆盖时间线、模拟引擎、运行时和居民治理。
- 全量回归：`npm test -- --run` 通过，47 个测试文件、308 项测试。
- 生产构建：`npm run build` 通过，2356 个模块正常打包。
- 变更检查：`git diff --check` 通过。
- 浏览器验收：当前环境仍无法监听 `127.0.0.1:4173`，因果链的真实时间线与建筑详情点击证据待可监听环境补跑。

## 2026-07-17 第一百五十一轮验证

- 定向回归：26 项通过，覆盖模拟引擎阻塞生命周期与城市时间线增量映射。
- 全量回归：`npm test -- --run` 通过，47 个测试文件、309 项测试。
- 生产构建：`npm run build` 通过，2356 个模块正常打包。
- 变更检查：`git diff --check` 通过。
- 浏览器验收：当前环境仍无法监听 `127.0.0.1:4173`，阻塞期间增量的真实时间线与建筑详情点击证据待可监听环境补跑。

## 2026-07-17 第一百五十二轮验证

- 定向回归：57 项通过，覆盖财政结算、居民治理和阻塞生命周期。
- 全量回归：`npm test -- --run` 通过，47 个测试文件、309 项测试。
- 生产构建：`npm run build` 通过，2356 个模块正常打包。
- 变更检查：`git diff --check` 通过。
- 浏览器验收：当前环境仍无法监听 `127.0.0.1:4173`，财政周期运营压力的真实面板点击证据待可监听环境补跑。

## 2026-07-17 第一百五十三轮验证

- 定向回归：27 项通过，覆盖原因变化时的引擎生命周期分段和时间线映射。
- 全量回归：`npm test -- --run` 通过，47 个测试文件、310 项测试；长时间文明压力场景通过。
- 生产构建：`npm run build` 通过，2356 个模块正常打包。
- 变更检查：`git diff --check` 通过。
- 浏览器验收：当前环境仍无法监听 `127.0.0.1:4173`，多段阻塞时间线的真实点击证据待可监听环境补跑。

## 2026-07-17 第一百五十四轮验证

- 定向回归：44 项通过，覆盖财政事件、结算历史、周期压力差值和城市时间线投影。
- 全量回归：`npm test -- --run` 通过，47 个测试文件、312 项测试；长时间文明压力场景通过。
- 生产构建：`npm run build` 通过，2356 个模块正常打包。
- 变更检查：`git diff --check` 通过。
- 浏览器验收：当前环境仍无法监听 `127.0.0.1:4173`，财政结算和多段阻塞时间线的真实点击证据待可监听环境补跑。

## 2026-07-17 第一百五十五轮验证

- 定向回归：54 项通过，覆盖财政压力差值、时间线投影、治理消费和可定位 finance 提示。
- 全量回归：`npm test -- --run` 通过，47 个测试文件、313 项测试；长时间文明压力场景通过。
- 生产构建：`npm run build` 通过，2356 个模块正常打包。
- 变更检查：`git diff --check` 通过。
- 浏览器验收：当前环境仍无法监听 `127.0.0.1:4173`，财政压力提示的真实点击、定位和消退证据待可监听环境补跑。

## 2026-07-17 第一百五十六轮验证

- 定向回归：12 项通过，覆盖财政提示重复抑制、压力消退和再次触发。
- 全量回归：`npm test -- --run` 通过，47 个测试文件、315 项测试；长时间文明压力场景通过。
- 生产构建：`npm run build` 通过，2356 个模块正常打包。
- 变更检查：`git diff --check` 通过。
- 浏览器验收：当前环境仍无法监听 `127.0.0.1:4173`，尚未取得财政提示生命周期的真实点击证据。

## 2026-07-17 第一百五十七轮验证

- 定向回归：15 项通过，覆盖粮食、物流、迁移和财政提示的生命周期去重与重新触发。
- 全量回归：`npm test -- --run` 通过，47 个测试文件、318 项测试；长时间文明压力场景通过。
- 生产构建：`npm run build` 通过，2356 个模块正常打包。
- 变更检查：`git diff --check` 通过。
- 浏览器验收：当前环境仍无法监听 `127.0.0.1:4173`，尚未取得城市提示流的真实点击证据。

## 2026-07-17 第一百五十八轮验证

- 定向回归：42 项通过，覆盖提示生命周期事件、GameRuntime 消费接口和界面确认接入。
- 全量回归：`npm test -- --run` 通过，47 个测试文件、319 项测试；长时间文明压力场景通过。
- 生产构建：`npm run build` 通过，2356 个模块正常打包。
- 变更检查：`git diff --check` 通过。
- 浏览器验收：当前环境仍无法监听 `127.0.0.1:4173`，提示分析事件的真实点击和浏览器确认链尚未取得证据。

## 2026-07-17 第一百五十九轮验证

- 定向回归：43 项通过，覆盖 durable outbox、稳定事件键、批次窥视/消费/确认和 GameRuntime 接线。
- 全量回归：`npm test -- --run` 通过，47 个测试文件、320 项测试；长时间文明压力场景通过。
- 生产构建：`npm run build` 通过，2356 个模块正常打包。
- 变更检查：`git diff --check` 通过。
- 浏览器验收：当前环境仍无法监听 `127.0.0.1:4173`，尚未取得重载恢复和批次消费的真实浏览器证据。

## 2026-07-17 第一百六十轮验证

- 定向回归：46 项通过，覆盖未配置传输器、全量确认、部分确认、失败保留和指数退避。
- 全量回归：`npm test -- --run` 通过，47 个测试文件、323 项测试；长时间文明压力场景通过。
- 生产构建：`npm run build` 通过，2356 个模块正常打包。
- 变更检查：`git diff --check` 通过。
- 浏览器验收：当前环境仍无法监听 `127.0.0.1:4173`，尚未取得真实网络确认与刷新恢复证据。

## 2026-07-17 第一百六十一轮验证

- 定向回归：35 项通过，覆盖 HTTP 批次请求、幂等键、超时中止、非 2xx 响应、非法响应和未知 ID过滤。
- 全量回归：`npm test -- --run` 通过，47 个测试文件、326 项测试；长时间文明压力场景通过。
- 生产构建：`npm run build` 通过，2357 个模块正常打包。
- 变更检查：`git diff --check` 通过。
- 浏览器验收：当前环境仍无法监听 `127.0.0.1:4173`，尚未取得真实网络确认与刷新恢复证据。

## 2026-07-17 第一百三十三轮验证

- 定向建筑/顾问/Prefab 测试：35 项通过，覆盖三类设施定义、阶段解锁、缺失设施建议和资产映射。
- 全量回归：`npm test` 通过，46 个测试文件、294 项测试；长时间文明压力场景通过。
- 生产构建：`npm run build` 通过，2356 个模块正常打包；`git diff --check` 通过。
- 升级经济审计：新增三类设施后覆盖 8 类运行时建筑、64 个升级节点；格式化审计测试通过。
- 浏览器验收：本轮未取得真实点击证据；当前环境禁止 `127.0.0.1:4173` 本地监听，待允许本地 socket 的环境补跑。
## 2026-07-17 第一百六十二轮验证

- 美术覆盖自检：`npm run asset:coverage-audit:self-test` 通过。
- 全量回归：`npm test -- --run` 通过，49 个测试文件、326 项测试；其中长时间文明压力场景通过。
- 生产构建：`npm run build` 通过，2357 个模块正常打包；`git diff --check` 通过。
- 生产美术门禁：`npm run asset:coverage-audit` 正确返回红灯：六类首批金样中 0 个达到生产绿灯；2 个仅有 manifest 契约，1 个缺 5 个等级，3 个缺完整样本目录。
- 严格等级验证：`npm run asset:validate:gold-samples:strict` 继续正确拒绝 `main-pier` 的 L2/L3/L5/L6/L7 缺失；没有通过放宽校验掩盖缺口。
- 浏览器验收：当前环境仍无法监听 `127.0.0.1:4173`，本轮未声称获得真实浏览器证据。
## 2026-07-17 第一百六十三轮验证

- 资产 validator 自检：通过，既有通用 fixture 保持兼容；新增完整视觉身份样本通过，L0/L8 轮廓复用会被拒绝。
- 美术覆盖自检：`npm run asset:coverage-audit:self-test` 通过。
- 全量回归：`npm test -- --run` 通过，49 个测试文件、326 项测试；长时间文明压力场景通过。
- 生产构建：`npm run build` 通过，2357 个模块正常打包；`git diff --check` 通过。
- 生产美术门禁：`npm run asset:coverage-audit` 按预期红灯；现有样本缺 `visualIdentity`，码头同时缺 L2/L3/L5/L6/L7，三类建筑完全缺金样目录。
- 浏览器验收：本轮未声称获得浏览器证据；本地 socket 限制仍在。

## 2026-07-17 第一百六十四轮验证

- 定向建筑内容回归：11 项通过，覆盖 28 类视觉身份、L0–L8 完整成长弧、运行时别名映射和等级读取边界。
- 资产 validator 自检：通过；跨建筑重复 `buildingClass`/`silhouetteFamily`/`functionalSignature` 会被拒绝。
- 美术覆盖审计：按预期红灯；当前 6 类金样为 0 个生产绿灯，缺口仍是 DCC 源文件、图集/二进制导出和部分 manifest 等级/视觉身份。
- 全量回归：`npm test -- --run` 通过，49 个测试文件、327 项测试；长时间文明压力场景通过。
- 生产构建：`npm run build` 通过，2358 个模块；`git diff --check` 通过。
- 浏览器验收：当前环境仍无法监听 `127.0.0.1:4173`，本轮未声称取得真实浏览器证据。

## 2026-07-17 第一百六十五轮验证

- 动态场景定向回归：13 项通过；未注册 Prefab 的 `main-pier` 按视觉身份目录显示可见 fallback，并正确读取 L4 `cross-berth-wharf`。
- 全量回归：`npm test -- --run` 通过，49 个测试文件、327 项测试；长时间文明压力场景通过。
- 生产构建：`npm run build` 通过，2358 个模块；`git diff --check` 通过。
- 资产覆盖门禁仍未转绿；本轮只是运行时身份化灰盒渲染，不代表模型、贴图、图集和动画交付完成。
- 浏览器验收：当前环境仍无法监听 `127.0.0.1:4173`，本轮未声称取得真实浏览器证据。

## 2026-07-17 第一百六十六轮验证

- 运行时美术审计：`npm run asset:runtime-artwork:audit` 通过；28 个建筑文件夹、252 个等级文件、252 个唯一 512×512 RGBA PNG。
- 定向回归：16 项通过，覆盖建筑 PNG 路径钳制、纹理缓存、等距 sprite footprint 和动态场景回退/接线。
- 全量回归：`npm test -- --run` 通过，50 个测试文件、330 项测试；长时间文明压力场景通过。
- 生产构建：`npm run build` 通过，2359 个模块正常打包；`git diff --check` 通过。
- 商业美术覆盖门禁：`npm run asset:coverage-audit` 仍按预期红灯，因为 DCC 源文件、完整 manifest 和动画二进制尚未交付；本轮未将 PNG 文件误判为商业级资产全链路完成。
- 浏览器验收：当前环境仍无法监听 `127.0.0.1:4173`，未取得真实像素渲染与加载证据。

## 2026-07-17 第一百六十八轮验证

- DCC 生产契约：`npm run asset:pipeline:contract` 通过，10 项脚本门禁、5 项规格门禁通过。
- 运行时美术覆盖：`npm run asset:runtime-artwork:audit` 通过，28 个建筑目录、252 个九级 PNG 保持唯一且为 512×512 RGBA。
- `git diff --check` 通过。
- 未执行 Blender 导出：当前机器无 Blender；因此没有新增真实 `.blend`、骨骼/序列动画、分层图集或浏览器像素证据。
- 商业美术覆盖审计仍保持红灯，符合“契约通过不等于资产交付”的验收口径。
- Prefab 动画计划定向回归：7 项通过，覆盖工作状态进度、施工状态确定性和 LOD-off 过滤。
- 全量回归：`npm test -- --run` 通过，51 个测试文件、333 项测试；压力场景通过。
- 生产构建：`npm run build` 通过，2359 个模块；`git diff --check` 通过。

## 2026-07-17 第一百六十九轮验证

- 动画计划接线定向回归：16 项通过，包含动态场景状态槽位消费和对象池复用清理。
- 全量回归：`npm test -- --run` 通过，51 个测试文件、333 项测试；长时间文明压力场景通过。
- 生产构建：`npm run build` 通过，2360 个模块；`git diff --check` 通过。
- DCC 生产契约：`npm run asset:pipeline:contract` 通过；运行时 PNG 审计通过。
- 商业美术覆盖仍未转绿：真实 Blender 源文件、分层图集、骨骼/序列动画和浏览器像素证据缺失。

## 2026-07-17 第一百七十轮验证

- 图集驱动定向回归：`src/rendering/artwork/buildingAnimation.test.ts` 3 项通过；动态场景回归 13 项通过。
- 全量回归：`npm test -- --run` 通过，52 个测试文件、336 项测试；长时间文明压力场景通过。
- 生产构建：`npm run build` 通过，2361 个模块；`git diff --check` 通过。
- DCC 生产契约：`npm run asset:pipeline:contract` 通过，10 项脚本门禁、5 项规格门禁通过。
- 运行时美术覆盖：`npm run asset:runtime-artwork:audit` 通过，28 个建筑目录、252 个九级 PNG，均为唯一 512×512 RGBA。
- 未执行 Blender 导出，未新增真实 `.blend`、spritesheet PNG/JSON、部件动画或浏览器像素/帧率证据；商业美术覆盖审计继续保持红灯。

## 2026-07-17 第一百七十一轮验证

- 图集加载定向回归：加载器 2 项、AnimatedSprite 驱动 3 项、动态场景 13 项通过。
- 全量回归：`npm test -- --run` 通过，53 个测试文件、338 项测试；长时间文明压力场景通过。
- 生产构建：`npm run build` 通过，2361 个模块；`git diff --check` 通过。
- DCC 生产契约：`npm run asset:pipeline:contract` 通过，10 项脚本门禁、5 项规格门禁通过。
- 运行时美术覆盖：`npm run asset:runtime-artwork:audit` 通过，28 个建筑目录、252 个九级 PNG，均为唯一 512×512 RGBA。
- 测试期间 Pixi/jsdom 输出既有 `HTMLCanvasElement.getContext` 警告，但测试本身通过；未执行真实浏览器、Blender 导出或帧率测量，商业美术覆盖仍保持红灯。

## 2026-07-17 第一百七十二轮验证

- 部件/粒子定向回归：`buildingAnimation.test.ts` 4 项、图集加载 2 项、动态场景 13 项、动画计划 3 项通过。
- 全量回归：`npm test -- --run` 通过，53 个测试文件、339 项测试；长时间文明压力场景通过。
- 生产构建：`npm run build` 通过，2361 个模块；`git diff --check` 通过。
- DCC 生产契约：`npm run asset:pipeline:contract` 通过，10 项脚本门禁、5 项规格门禁通过。
- 运行时美术覆盖：`npm run asset:runtime-artwork:audit` 通过，28 个建筑目录、252 个九级 PNG，均为唯一 512×512 RGBA。
- 未执行真实 Blender 部件/粒子导出、浏览器像素/帧率和显存基准；商业美术覆盖仍保持红灯。

## 2026-07-17 第一百七十三轮验证

- 资产预算自测：`npm run asset:validate:self-test` 通过，超预算动画清单被正确拒绝。
- gold sample 验证：`npm run asset:validate:gold-samples` 通过，main-eatery、main-homes、main-pier 均 0 warnings。
- 全量回归：`npm test -- --run` 通过，53 个测试文件、339 项测试；长时间文明压力场景通过。
- 生产构建：`npm run build` 通过，2361 个模块；`git diff --check` 通过。
- DCC 生产契约：10 项脚本门禁、5 项规格门禁通过；运行时 PNG 审计通过 28 个建筑目录、252 个唯一 512×512 RGBA PNG。
- 尚未取得真实 Blender、浏览器帧率、纹理内存和 300 栋建筑动画压力证据；预算门禁不能替代这些证据。

## 2026-07-17 第一百七十四轮验证

- 动画压力基准：`npm run qa:animation-runtime-budget` 通过；300 个动画宿主、150 个可见建筑，单建筑最多 5 个动画子节点，二次同步复用对象。
- 全量回归：`npm test -- --run` 通过，54 个测试文件、340 项测试；长时间文明压力场景通过。
- 生产构建：`npm run build` 通过，2361 个模块；`git diff --check` 通过。
- 资产与生产契约：资产自测、3 个 gold samples、10 项脚本/5 项规格门禁、28 个建筑 252 张运行时 PNG 审计均通过。
- 未完成：真实 Blender 部件/粒子资源、浏览器 GPU 帧率、显存和目标设备实测；jsdom canvas 警告仍为测试环境已知限制。

## 2026-07-17 第一百七十五轮验证

- 生产包自测：`npm run asset:production-package:self-test` 通过；完整临时包 GREEN，删除状态证据后 RED。
- 真实生产包审计：`npm run asset:production-package:audit` 正确报告六类金样均 RED，缺少 DCC 导出包、运行时图集、锚点清单、状态证据和九级导出预览。
- 该 RED 是当前项目真实状态的记录，不是测试失败；不得以 252 张运行时静态 PNG 或模板 manifest 代替商业资产交付。

## 2026-07-17 第一百七十六轮验证

- 居民生命周期定向回归：`src/simulation/core/SimulationEngine.test.ts` 20 项通过。
- 新增覆盖点：候选人尚未进入 `households`；入住后才创建家庭与 worker；就业家庭迁出前保存职业快照，离城 profile 的 `employedCount`、职业分类、岗位释放和 `populationFlow` 一致。
- 迁出场景使用关键需求压力触发，避免依赖人工直接修改“最终居民状态”；断言来自真实 `SimulationEngine` 事件和 snapshot。
- 本轮尚未取得真实浏览器人物动画、入住前后像素差异或目标设备帧率证据；商业级人物美术验收仍保持未完成。

## 2026-07-17 第一百六十七轮验证

- 定向动效/渲染回归：16 项通过，覆盖建筑状态层、对象池复用、PNG Provider 和动效层接线。
- 运行时美术审计：`npm run asset:runtime-artwork:audit` 通过；28 个建筑文件夹、252 个等级文件、252 个唯一 512×512 RGBA PNG。
- 全量回归：`npm test -- --run` 通过，50 个测试文件、330 项测试；长时间文明压力场景通过。
- 生产构建：`npm run build` 通过，2359 个模块正常打包；`git diff --check` 通过。
- 商业美术覆盖门禁仍保持红灯：代码动效不能替代 DCC 源文件、骨骼/粒子图集、碰撞和完整 manifest；浏览器真实帧率/像素证据尚未取得。

## 2026-07-17 第一百七十七轮验证

- 定向验证：`src/rendering/DynamicScene.test.ts` 与 `src/simulation/core/SimulationEngine.test.ts` 共 34 项通过。
- 全量验证：`npm test -- --run` 通过，54 个测试文件、342 项测试；既有 Pixi/jsdom Canvas `getContext` 警告不影响结果。
- 生产构建：`npm run build` 通过，2361 个模块；`git diff --check` 通过。
- 动画预算：`npm run qa:animation-runtime-budget` 通过；DCC 流水线契约、运行时 252 张 PNG 覆盖审计和生产包自测通过。
- 商业生产包真实审计仍保持 RED：六类金样缺少真实 `.blend`、atlas、锚点、状态证据和九级透明导出；浏览器人物视觉与实机性能证据也未取得。
## 2026-07-17 第一百七十八轮验证

- 定向居民/资源回归：34 项通过；`GameRuntime` 新增 live-engine 生命周期 fixture 断言。
- 全量回归：`npm test -- --run` 通过；测试环境仍输出 Pixi/jsdom `HTMLCanvasElement.getContext` 已知 warning。
- 真实浏览器：`BROWSER_E2E_SCENARIO=civilization-resident-timeline npm run qa:browser-e2e` 通过；已验证“城市运行”“居民生活”“就业”“居民状态：”“候选家庭”“外来家庭”均可见。
- 浏览器非阻断 warning：GPU stall due to ReadPixels、`WebGL: INVALID_VALUE: texImage2D: bad image data`；当前仅将其记录为渲染质量风险，未过滤或宣称商业级性能通过。
- 生产构建：`npm run build` 通过，2361 个模块；`git diff --check` 通过。
- 动画预算、DCC 流水线契约、运行时 252 张 PNG 审计和生产包自测通过。
- 生产包真实审计仍为 RED：六类金样缺 `.blend`、atlas、锚点、状态证据和九级透明导出。
## 2026-07-17 第一百七十九轮验证

- 定向回归：`buildingArtwork`、`DynamicScene`、`GameRuntime` 共 44 项通过。
- 生产构建：`npm run build` 通过，2361 个模块；`git diff --check` 通过。
- 真实浏览器：`BROWSER_E2E_SCENARIO=civilization-resident-timeline npm run qa:browser-e2e` 通过；居民状态文本证据保持有效。
- 资源质量观察：上一轮 `texImage2D: bad image data` 已不再出现；仍有 GPU `ReadPixels` stall warning，当前不能作为目标设备性能通过证据。
- 商业生产包真实审计仍为 RED：当前仓库没有真实 `.blend`、运行时 atlas、锚点和七类状态证据。

## 2026-07-17 第一百八十轮验证

- 定向回归：`buildingArtwork`、`DynamicScene`、`GameRuntime` 共 47 项通过。
- 生产构建：`npm run build` 通过，2361 个模块；`git diff --check` 通过。
- 新增门禁证据：重复建筑类型只生成一份九级资源清单；超过纹理预算和已取消信号均在网络加载前失败。
- 商业生产包真实审计仍为 RED；GPU `ReadPixels` stall 仍未完成真实设备性能验收。

- 真实浏览器复测：`BROWSER_E2E_SCENARIO=civilization-resident-timeline npm run qa:browser-e2e` 通过；“城市运行”“居民生活”“就业”“居民状态：”“候选家庭”“外来家庭”均可见。
- 复测仍有 GPU `ReadPixels` stall warning；没有 `texImage2D: bad image data`，但这不等于目标设备帧率验收通过。

## 2026-07-18 第一百八十一轮验证

- 真实浏览器场景通过：居民状态、候选家庭和外来家庭文本均可见。
- 帧时间基线：45 帧/约 1.03 秒，平均 23.48ms，P95 34.7ms，最大 67.6ms，画布 1366×768。
- WebGL 读回归因：应用层 `readPixels` 计数为 0；浏览器仍输出 GPU stall warning，暂定为浏览器/驱动合成层风险，待多环境复测。
- 当前结论：功能场景通过，商业级性能不通过；需继续做 DynamicScene 分段采样与目标设备基准。

## 2026-07-18 第一百八十二轮验证

- 定向回归：`DynamicScene`、`GameRuntime`、浏览器场景契约共 45 项通过。
- 生产构建：`npm run build` 通过，2361 个模块；`git diff --check` 通过。
- 真实浏览器：居民生命周期场景通过；107 次 DynamicScene 同步，总耗时平均 0.368ms/P95 0.500ms，建筑平均 0.237ms/P95 0.300ms。
- 同轮帧时间：54 帧/约 1.02 秒，平均 19.15ms，P95 33.6ms，最大 34.7ms，画布 1366×768；应用层 `readPixels` 为 0。
- 结论：CPU 同步阶段基线已建立，但 headless 帧时间和 GPU stall 仍不足以通过商业级验收；真实 DCC/atlas/粒子资源、多环境和目标设备测试仍为 RED。

## 2026-07-18 第一百八十三轮验证

- 定向回归：`DynamicScene` 与浏览器场景契约共 18 项通过。
- 生产构建：`npm run build` 通过，2361 个模块；`git diff --check` 通过。
- 真实浏览器：居民生命周期场景通过；88 次同步的实体范围为建筑 5、居民 3、运输 1、掉落物 1、可见 14、池化 63。
- 同轮 rAF：50 帧/约 1.02 秒，平均 20.75ms，P95 33.4ms，最大 33.4ms，画布 1366×768；应用层 `readPixels` 为 0。
- 结论：实体证据链已覆盖垂直切片，但不代表 500 户/300 栋/150 可见实体的生产规模验收；真实 DCC/atlas/粒子、多环境和目标设备仍为 RED。
- 全量回归：54 个测试文件、346 个测试全部通过；已知 jsdom 的 Pixi `HTMLCanvasElement.prototype.getContext` 警告不影响退出码，但仍应在真实浏览器和目标设备环境复测。

## 2026-07-18 第一百八十四轮验证

- 性能契约定向回归：3 项通过；生产构建通过，2361 个模块。
- `npm run qa:performance-baseline` 三环境均完成真实 Chromium 采样，居民生命周期场景和应用层 `readPixels=0` 均通过。
- 桌面 GPU：平均 19.90ms、P95 33.4ms、最大 35.2ms；软件渲染：平均 30.41ms、P95 48.6ms、最大 49.4ms；嵌入容器代理：平均 31.34ms、P95 50ms、最大 65.8ms。
- DynamicScene 同步 P95：0.5ms、0.8ms、1.1ms；说明当前采样场景的 JS 同步不是主要瓶颈，但不能排除纹理上传、渲染提交和浏览器合成层问题。
- 结论：三环境帧时间门禁均为 RED；本轮是性能证据与工具完成，不是商业级性能通过。
- 全量回归：55 个测试文件、349 个测试全部通过；已知 jsdom Pixi canvas 警告仍只出现在测试环境，不影响退出码。

## 2026-07-18 第一百八十五轮验证

- 静态视觉失效优化后的全量回归：55 个测试文件、349 个测试全部通过；已知 jsdom Pixi canvas 警告仍只出现在测试环境，不影响退出码。
- `npm run build` 通过，2361 个模块；`git diff --check` 通过。
- 三环境重复性能采样功能场景均通过，DynamicScene 同步 P95 为 0.5/0.8/0.5ms，应用层 `readPixels` 为 0。
- 帧时间门禁仍为 RED：桌面 GPU平均/P95/最大 36.96/51.9/98.1ms，软件渲染 29.05/35.2/35.4ms，嵌入容器代理 35.63/50.1/50.8ms；结果较上一轮波动，不能归因于优化有效或无效。
- 验收结论：缓存边界和功能正确性通过；商业级性能、真实目标设备、真实 DCC/atlas/粒子包仍未通过。

## 2026-07-18 第一百八十六轮验证

- 性能聚合定向测试：4 项通过；DynamicScene 定向回归共 18 项通过。
- 全量回归：55 个测试文件、350 个测试全部通过；已知 jsdom Pixi canvas 警告仍只出现在测试环境。
- `npm run build` 通过，2361 个模块；`git diff --check` 通过。
- 本轮只验证重复采样统计逻辑，没有重新运行完整三环境矩阵；上一轮真实三环境帧时间门禁继续保持 RED，不能据此宣称性能通过。

## 2026-07-19 第一百八十七轮验证

- `npm run qa:performance-baseline` 完成 3 环境 × 3 次真实 Chromium 采样；9 次场景均通过功能与 console error 门禁，应用层 `readPixels=0`。
- DynamicScene 同步 P95：桌面 GPU 0.6ms、软件渲染 1.1ms、嵌入代理 1.4ms，均低于 4ms 目标。
- 帧时间门禁全部 RED：桌面 GPU平均/P95/最大 42.37/66.6/68.2ms，软件 42.36/64.8/66.6ms，嵌入代理 53.57/67.1/67.1ms。
- 结论：当前证据排除应用主动读回和 JS 同步主瓶颈，但还不能区分 Pixi 提交、纹理上传、GPU 驱动与浏览器合成层；商业级性能仍未验收。

## 2026-07-19 第一百八十八轮验证

- 新增 renderer 提交采样后的单场景验证通过；桌面 GPU 场景功能通过，应用层 `readPixels=0`。
- DynamicScene 总同步 P95 0.8ms；Pixi `renderer.render` 平均 1.818ms、P95 4.3ms、最大 62.1ms。
- 该 profile 是 CPU 调用耗时，不等价于 GPU 完成时间；最大值只能作为长尾线索，不能直接当作根因证明。
- 下一步将 renderer profile 加入三环境重复矩阵，并补静态画布、纹理禁用/预加载、动画粒子开关对照；商业性能门禁继续 RED。
- 本轮最终全量回归：55 个测试文件、350 个测试全部通过；`git diff --check` 通过，构建已在本轮归因采样前后均通过。

## 2026-07-20 第一百八十九轮验证

- 新增渲染差分契约测试 2 项；定向渲染/性能聚合测试 6 项通过。
- 全量回归：55 个测试文件、352 个测试全部通过；已知 jsdom Pixi canvas `getContext` 警告仍只出现在测试环境，不影响退出码。
- `npm run build` 通过，2362 个模块；`git diff --check` 通过。
- 真实桌面 GPU `civilization-resident-timeline` 禁用 authored artwork 与 authored animation：场景通过，配置回传正确，DynamicScene P95 0.6ms，renderer 平均/P95/最大 1.732/2.4/74.3ms，应用层 `readPixels=0`。
- 验收结论：诊断链路通过；商业级帧率门禁仍 RED，单场景样本不能替代同场景多开关重复矩阵。
- 新增 `npm run qa:render-ablation`，可用 `RENDER_ABLATION_MODES`、`RENDER_ABLATION_REPEATS` 和 `RENDER_ABLATION_PROFILE` 控制差分矩阵；本轮只验证构建和执行器契约，未将未稳定返回的嵌套进程结果纳入性能结论。

## 2026-07-21 第一百九十轮验证

- 建筑原画按等级预加载测试通过；全量回归 55 个测试文件、353 个测试通过，已知 jsdom Pixi canvas 警告不影响退出码。
- `npm run build` 通过，2362 个模块；`git diff --check` 通过。
- 真实桌面 GPU 方向性样本：full 24.81/33.6/49.8ms，no-animation 19.19/33.4/34.3ms，no-terrain 16.67/17.6/17.8ms（平均/P95/最大）；三者场景、配置和 readPixels=0 均通过。
- 之前同场景两次 ablation 聚合中，full 42.37ms、no-artwork 17.84ms 平均帧耗时；headless 波动明显，不能视为稳定提升或商业级性能通过。
- 验收结论：贴图/地形差分已能提供归因方向，性能红线仍 RED；下一步做纹理尺寸、上传批次和真实 DCC 导出预算审计。

## 2026-07-21 第一百九十一轮验证

- `npm run asset:runtime-artwork:budget` 已执行：28 个建筑包、252 张 PNG；总下载 125,331,330 bytes，估算解码 RGBA 264,241,152 bytes。
- 门禁结果 RED：全量下载预算 96 MiB，实际约 119.5 MiB；单张纹理和单建筑九级包未超本轮阈值。
- `npm run build` 通过，2362 个模块；`git diff --check` 通过。
- 验收结论：资源预算现在有客观基线，但发行包尚未达到商业红线；后续必须验证 WebP/atlas/LOD 分层后的实际首屏和升级路径。

## 2026-07-21 第一百九十二轮验证

- `npm run asset:runtime-artwork:release-audit` 通过：28 个建筑文件夹、252 张唯一 384×384 RGBA 等级图。
- `npm run asset:runtime-artwork:budget` 通过：运行时发行包下载 51,926,857 bytes，估算解码 RGBA 148,635,648 bytes，低于 96 MiB/256 MiB 预算。
- 运行时 Provider 已切换到 `buildings-runtime-384`，源 512px 资产保留为源素材层；构建和前一轮全量测试结果仍通过。
- 验收结论：运行时发行包预算 GREEN，但真实 DCC/atlas/粒子、目标设备帧率和视觉质量仍未完成验收。
- 真实桌面 GPU 回归：场景通过，5 建筑、居民/运输实体和运行时配置正常，DynamicScene P95 0.6ms，renderer 平均/P95/最大 1.679/3.7/74.4ms，应用层 `readPixels=0`；rAF 平均/P95/最大 36.34/50.9/66ms，商业帧率仍 RED。

## 2026-07-21 第一百九十三轮验证

- `npm run asset:runtime-artwork:build` 已生成 252 张运行时派生图和 provenance manifest。
- `npm run asset:runtime-artwork:release-audit` 通过：252 张唯一 384×384 RGBA 图，manifest 文件数和尺寸匹配。
- `npm run asset:runtime-artwork:budget` 通过：51,926,857 bytes 下载，148,635,648 bytes 解码 RGBA。
- `npm run build` 通过，2362 个模块；`git diff --check` 通过。
- 验收结论：运行时发行工程可重复验证；Blender/DCC/atlas/粒子/目标设备帧率仍未完成，项目不能收口。

## 2026-07-21 第一百九十四轮验证

- `npm run qa:civilization-scale` 通过：2 个测试；实际快照为 500 户、300 栋、150 初始 agent；连续两次动态场景同步均为 300 building、135 resident、15 transport、450 visible。
- `npm run qa:civilization-long-run` 通过：7,200 tick；三层快照均保持 500 户/300 栋，最终 226 agents；人口 1,750，物流效率 99.998%，数值字段无效项 0，最终阻塞建筑 172，服务队列 42。
- jsdom 测试仍会输出 Pixi `HTMLCanvasElement.prototype.getContext` 的已知 warning，但退出码为 0；这不是浏览器性能证据。
- 验收结论：模拟规模和动态实体生命周期首次有直接证据；真实浏览器 300 栋规模帧时间、真实 DCC/atlas/动画/粒子和商业级性能仍未通过。

## 2026-07-21 第一百九十五轮验证

- `npm run qa:browser-e2e`（`BROWSER_E2E_SCENARIO=civilization-scale`）真实桌面 GPU 运行通过：页面文案和 console error 门禁通过，300 buildings、135 residents、15 transport，visible entity min/max/last 为 335/351/344。
- 应用层 `readPixels=0`，但浏览器控制台仍报告 GPU stall due to ReadPixels；该警告来自浏览器/驱动路径，不应被应用层计数为 0 掩盖。
- 性能门禁 RED：rAF 平均/P95/最大 118.52/166.4/166.4ms；DynamicScene 平均/P95 7.66/10.9ms；renderer 平均/P95/最大 15.09/17.2/117.7ms。
- 结论：规模实体真实进入浏览器渲染链路，规模验收通过；商业级流畅度未通过。下一步应在同一压力场景下做建筑纹理、对象提交、动画和地形的成组差分，并定位 GPU stall/renderer 长尾。

## 2026-07-21 第一百九十六轮验证

- 定向测试：`src/rendering/DynamicScene.test.ts` 与 `src/qa/civilizationScale.test.ts` 共 16 项通过；构建和 `git diff --check` 通过。
- 真实桌面 GPU `civilization-scale`：实体门禁通过，visible 335–349；应用层 `readPixels=0`，但 GPU stall 警告仍出现。
- 优化后 profile：DynamicScene 平均/P95 2.78/12.6ms；renderer 平均/P95/最大 6.885/18.4/123.9ms；rAF 平均/P95/最大 129.14/216.7/216.7ms。
- 验收结论：缓存优化对应用层提交有明确方向性收益，但总帧时间没有通过，且本次 rAF 长尾恶化；不能把该优化描述为商业性能达标。下一轮需做分辨率、抗锯齿、纹理/画布上传和浏览器合成差分。

## 2026-07-21 第一百九十七轮验证

- 定向测试 16 项通过；`npm run build`、`npm test -- --run`、`git diff --check` 通过。
- 真实桌面 GPU `civilization-scale` 使用 `disableAntialias=1&resolution=1`：实体门禁通过，300 buildings、135 residents、15 transport，visible 331–348；应用层 `readPixels=0`，浏览器仍报告 GPU stall due to ReadPixels。
- 差分 profile：DynamicScene 平均/P95 2.236/11.8ms；renderer 平均/P95/最大 5.26/18.1/114.7ms；rAF 平均/P95/最大 54.35/83.3/83.3ms。
- 结论：降低像素负载和关闭抗锯齿能显著降低本次采样的帧时间，但 P95 仍远高于 16.7ms，且会牺牲正式画质；只作为定位证据，不作为发行配置。

## 2026-07-21 第一百九十八轮验证

- 静态建筑缓存实验使用正式原画、动画、地形全开和相同 `civilization-scale` 压力场景，实体门禁通过，visible 331–349。
- 开启 `staticBuildingCache=1` 后：DynamicScene 平均/P95 3.753/24.5ms；renderer 平均/P95/最大 8.953/31.8/160ms；rAF 平均/P95/最大 122.26/166.4/166.4ms。
- 无缓存全画质基线为 DynamicScene 2.58/8.1ms、renderer 5.889/18.2/114.2ms、rAF 91.63/133.3/133.3ms；实验结果明确为负收益。
- 结论：独立建筑缓存纹理在当前环境产生更高初始化和合成成本，保留开关但关闭默认；商业优化转向共享 atlas、纹理批次、视口 LOD 与合成提交控制。
- 全量测试 57 文件/355 测试通过；已知 jsdom Canvas warning 仍存在但无失败。

## 2026-07-21 第一百九十九轮验证

- `npm run asset:runtime-artwork:atlas` 通过：28 张共享 atlas、252 个等级帧；运行时完整性与预算审计通过。
- `npm run build` 通过；建筑 artwork 与 render diagnostics 定向测试 9 项通过；已知 jsdom Canvas warning 不影响退出码；`git diff --check` 通过。
- 桌面 GPU 单次差分：full 为 rAF 41.36/66/83.3ms、renderer 1.714/3/74ms；atlas 为 37.66/50/50.2ms、renderer 1.497/3/69.3ms（平均/P95/最大）。功能门禁通过，但两者均超过商业目标，GPU stall 警告仍存在。
- 验收结论：atlas 是有实测收益的候选路径，但证据只够进入下一轮扩大验证，不能切换为默认发行方案。

## 2026-07-22 第二百轮验证

- 默认渲染配置回归：`buildingAtlas=true`；`?disableAtlas=1` 可显式验证独立 PNG 回退；配置解析和 provider 定向测试共 9 项通过。
- `npm run build` 通过，`git diff --check` 通过。atlas 资源仍通过生成器、完整性审计和预算审计。
- 本轮尝试重复/多环境浏览器差分时，子进程没有稳定返回 JSON，因此没有新增性能数值，也没有宣称性能改善已被多环境证实。
- 验收结论：共享 atlas 已成为正式默认发行路径，但商业帧率门禁仍 RED；下一轮优先修复 QA runner 生命周期并重跑完整矩阵。

## 2026-07-22 第二百零一轮验证

- `npm run asset:runtime-artwork:atlas` 与 `npm run asset:runtime-artwork:atlas:audit` 通过：28 张 WebP atlas、252 帧、约 16.80 MiB；PNG 对照包约 52 MiB。
- `npm run build`、建筑 artwork/diagnostics 定向测试 9 项和 `git diff --check` 通过；已知 jsdom Canvas warning 不影响退出码。
- 默认 WebP atlas 桌面浏览器场景功能门禁通过：5 buildings、3 residents、1 transport、14 visible、readPixels=0；rAF 平均/P95/最大 32.79/49.3/66.7ms，renderer 1.15/2.2/69.6ms。
- 结论：WebP 明显降低发行资源体积并已成为默认路径，但帧率仍未达到 16.7ms 商业目标；独立 PNG 对照本轮未稳定返回，不能纳入性能结论。

## 2026-07-23 第二百零二轮验证

- 构建与渲染定向测试通过；差分执行器在桌面 GPU `full/no-atlas × 2` 下稳定返回完整 JSON。
- 软件渲染与嵌入容器各完成 5 模式 × 1：full、no-atlas、no-artwork、no-animation、no-terrain；每个结果 `ok=true`、配置开关回传正确、readPixels=0。
- 垂直切片矩阵的 rAF 汇总约 16.65–16.68ms，renderer 平均约 0.34–0.75ms；这只是小场景生命周期和功能证据，不是 300 栋商业性能证据。GPU stall 警告在桌面环境仍可能出现。
- 验收结论：`QA-RENDER-ABLATION-LIFECYCLE-01` 关闭；`RENDER-SCALE-LONGTAIL-01`、`RENDER-GPU-COMPOSITOR-01` 和 `RENDER-ATLAS-PRODUCTION-GATE-01` 继续 RED/进行中，下一步必须跑目标规模矩阵。

## 2026-07-23 第二百零三轮验证

- 修正压力夹具后，`civilization-scale` 默认配置确认开启 authoredArtwork、authoredAnimation、terrain 和 buildingAtlas；契约测试、`npm run build`、定向测试和 `git diff --check` 通过。
- 完整回归：57 个测试文件、356 个测试全部通过；`npm run build` 通过。`npm run lint` 未执行成功，原因是仓库当前 ESLint 9 缺少 `eslint.config.*`，属于既有工程配置门禁问题，不是本轮规则错误。
- 桌面 GPU `full` 目标规模：300 buildings、135 residents、15 transport、至少 150 visible，`ok=true`、readPixels=0；rAF 平均/P95/最大 41.33/66.6/66.6ms，renderer 平均/P95/最大 3.783/10.6/97.4ms，render sync P95 6.1ms。
- 同规模 `no-atlas`：46.39/66.8/66.9ms，renderer 3.828/10.5/102.7ms；`no-artwork` 50.83/83/83ms，`no-animation` 42.39/66.7/67.1ms，`no-terrain` 32.79/50/50ms；全部 `ok=true`、readPixels=0，配置差异与模式一致。
- 验收结论：目标规模动态场景可以稳定运行，生命周期和功能门禁 GREEN；商业 16.7ms 帧预算仍 RED，且 GPU/合成长尾最大约 97–103ms。后续必须优化视口裁剪、纹理上传节流、提交批次和目标设备实测，不能将本轮称为商业级性能通过。

## 2026-07-23 第二百零四轮验证

- 定向验证：`src/rendering/DynamicScene.test.ts`、`src/rendering/culling.test.ts`、`src/qa/civilizationScale.test.ts` 共 20 项通过；全量 `npm test` 为 57 个测试文件、357 项通过；`npm run build` 与 `git diff --check` 通过。
- 视口裁剪回归确认：远端建筑在当前镜头下保持隐藏且不执行完整视觉重建；镜头进入远端区域后恢复显示并刷新视觉。
- 桌面 GPU 目标规模 full 复测：300 buildings、135 residents、15 transport、150+ visible、readPixels=0；rAF 平均/P95/最大 41.02/66.6/66.7ms，renderer 3.146/8.1/93ms，render sync P95 6.2ms。
- 验收结论：应用层 renderer 平均/P95 有方向性改善，但 16.7ms 商业帧预算仍 RED；当前需继续做可见区域 LOD、纹理上传节流、提交批次和目标设备矩阵。已知 jsdom Canvas warning 仍不影响退出码。
