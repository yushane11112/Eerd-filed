# 验收与性能基准

## 功能链路

- 道路未连接时，住宅不能获得可达岗位，生产建筑不能创建有效运输。
- 原料必须经过生产、订单、承运、逐格移动和交付后才能进入目标库存。
- 缺工、缺料、仓满、断路和财政不足必须提供明确停工原因。
- 暂停时模拟 Tick 不增长；倍速只改变执行频率，不改变单 Tick 结果。
- 普通材料不依赖听歌；歌曲完成事件只结算稀缺材料。
- 外来人口必须先进入候选状态，再根据城市吸引力、空房和等待时长决定入住或离开，不能凭空生成正式住户。

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
