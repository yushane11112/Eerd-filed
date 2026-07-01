# 集成记录

## 2026-07-01

- 启动并完成第七十七轮：`ROAD-LINK-LOW-TREASURY-E2E-01`。道路补线 E2E 从“成功施工”扩展到“财政不足失败”场景。
- `RuntimeDebugScenario` 新增 `isolated-road-network-low-treasury`：复用孤立路网缺口，但初始财政固定为 4，使 roadPlan 需要 6 银两时稳定显示缺口 2。
- `runtimeOptionsFromSearch` 支持 `?debugScenario=isolated-road-network-low-treasury`，未知参数仍忽略。
- `GameRuntime` 测试覆盖低财政 roadPlan：治理卡显示 `canAfford: false`、`missingTreasury: 2`；执行补线失败、不扣财政、保留缺钱统计。
- 浏览器 E2E 验证：低财政 URL 下，卡片显示“还缺银两 2”；点击推荐后 toast 显示“银两不足2，无法执行补线施工”，财政仍为 4，补线 overlay 保留供手动调整，console error 为 0。
- 限制：浏览器步骤仍是本轮临时代码执行，下一轮需要沉淀成可复用脚本或固定 QA 命令。

- 启动并完成第七十六轮：`ROAD-LINK-E2E-SCENARIO-01`。道路补线闭环获得可控调试/E2E 场景，不再依赖默认城市随机出现孤立路网。
- `GameRuntime` 新增 `debugScenario: 'isolated-road-network'` 选项：启动时制造一栋入口贴着孤立道路的调试民居，并在主路网旁留下一个明确缺口，使治理系统稳定生成 roadPlan。
- 新增 `src/ui/runtimeOptions.ts`：`?debugScenario=isolated-road-network` 会创建对应调试运行时；未知调试参数会被忽略。
- 修复一键施工后的 UI 残留：roadPlan 施工成功后清空 active recommendation，避免地图继续显示“补线 N 格/预计银两”的过期 overlay。
- 浏览器 E2E 验证：打开 `http://localhost:5173/?debugScenario=isolated-road-network`，瓶颈面板稳定出现“道路未连通”和“补线计划”；点击“打开道路图层并接回主路网”后财政扣费、toast 显示“补线施工完成”，且过期补线摘要被清理，console error 为 0。
- 限制：当前只是单一调试场景，不是完整 E2E 场景库；下一步应把服务缺口、物流拥堵、财政不足和桥梁缺口也纳入可控场景。

- 启动并完成第七十五轮：`ROAD-LINK-ONE-CLICK-01`。补线施工计划从 UI 摘要推进为运行时可执行动作。
- `GameRuntime` 新增 `buildRoadPlan`：输入 roadPlan cells 后，一次性执行混合石板路/桥梁施工，逐格校验越界、建筑占用、地形、已有道路和财政。
- 一键补线会合并统计 `placed/skipped/blocked/invalidTerrain/outOfBounds/unchanged/unaffordable/treasuryCost/missingTreasury`，并额外记录道路与桥梁实际完成格数，避免 UI 误报。
- `App.tsx` 在道路治理卡存在 `roadPlan` 时会直接调用 `runtime.buildRoadPlan`；施工成功给出完成 toast，失败则保留施工格提示并切换到道路或桥梁工具供玩家手动调整。
- 浏览器 QA 验证：横屏打开 `http://localhost:5173/`，瓶颈面板可展开，console error 日志为 0。
- 限制：默认场景没有稳定孤立路网，浏览器层未覆盖真实 roadPlan 卡点击；一键施工精确行为由 `GameRuntime` 单元测试覆盖。下一轮应补可控孤立路网 E2E/调试场景。

- 启动并完成第七十四轮：`ROAD-LINK-PLAN-UI-01`。补线施工计划不再只存在于数据层，瓶颈治理卡可以显示补线路/桥格数、预计银两和财政缺口。
- 新增 `src/ui/cityAdvisorUi.ts`，集中生成治理卡补线摘要文案，避免继续把 App 文案逻辑堆进 `App.tsx`。
- `withRecommendationExecutionOverlay` 支持 `roadPlan`：点击道路未连通推荐时，会把待施工道路格和桥梁格注入 overlay cells，分别使用 `planned` 与 `bridge` 状态高亮。
- `App.tsx` 的 `CityBottleneck.recommendation` 改为复用公共 `StageGovernanceRecommendation` 类型，避免 UI 侧手写窄类型漏掉后续治理卡字段。
- 浏览器 QA 验证：横屏打开 `http://localhost:5173/`，瓶颈面板可展开，页面显示 3 条瓶颈治理卡，console error 日志为 0。
- 限制：默认场景没有稳定制造孤立路网，因此浏览器层只验证面板健康；补线摘要和 roadPlan overlay 精确行为由单元测试覆盖。仍未实现一键施工和桥头吸附。

- 启动并完成第七十三轮：`ROAD-LINK-CONSTRUCTION-PLAN-01`。道路/桥梁补线不再只是地图路径建议，而是进入治理卡推荐数据，包含可施工格序列和成本预览。
- `StageGovernanceRecommendation` 新增 `roadPlan`：记录补线起点/终点、每个待新铺格子的坐标、道路类型、单格银两成本、道路格数、桥梁格数、总成本、财政缺口和 `canAfford`。
- `deriveStageGovernanceCards` 在生成“道路未连通”治理卡时，会读取道路图层第一条建议路径，并将中间缺失格拆成 `stone` 或 `bridge` 施工计划；已存在道路不会重复计费。
- 浏览器 QA 验证：横屏打开 `http://localhost:5173/`，阶段面板“道路”图层可点击，页面出现“道路连通”和“道路点 56”读数，真实页面交互没有阻塞。
- 限制：本轮只完成数据层施工计划，还没有把 `roadPlan` 渲染到治理卡 UI，也没有一键施工、桥头吸附或完整绕障路由；当前路径仍是两端之间的直线格序列。

- 启动并完成第七十二轮：`ROAD-LINK-RECOMMENDATION-01`。道路图层不再只标出孤立路网和未连通入口，而是输出一条建议补线/补桥路径。
- `deriveStageMapOverlay('roads')` 新增 `suggestRoadNetworkLinks`：对每个孤立道路连通分量，寻找其与主路网的最近边界道路格，并输出 `StageAdvisorOverlayPath`。
- 建议路径会根据两端之间的直线格是否经过水面或岸边标注为“建议补桥”或“建议接路”；地图现有 path overlay 会直接渲染该路径。
- 道路图层指标新增 `suggestedRoadLinks`，让后续 UI 或治理卡能知道当前有多少条可执行补线建议。
- 浏览器 QA 验证：横屏打开 `http://localhost:5173/`，点击阶段面板“道路”图层后出现“道路连通”和道路点读数，按钮 active，console 无 error/warn。默认场景未稳定制造孤立路网，因此建议补线路径由单元测试精确覆盖。
- 限制：建议路径目前是“最近道路边界到最近主路网边界”的一级建议，不会自动生成完整铺设格序列、报价、桥头吸附或一键施工；下一轮应把建议路径转为可执行工具预览。

## 2026-06-30

- 启动并完成第七十一轮：`ROAD-CONNECTIVITY-GOVERNANCE-01`。道路连通诊断进入瓶颈治理卡，不再只停留在道路图层读数。
- `deriveStageGovernanceCards` 新增 `governance-road-disconnected`：当道路图层存在 `disconnectedEntrances` 或 `isolatedRoadNetworks` 时，生成“道路未连通”高优先级卡片，目标点优先指向 `未连通*` 覆盖点。
- 治理卡文案明确区分“入口没路”和“道路/桥梁只铺到局部、没接回主路网”，推荐动作是打开道路图层并接回主路网。
- 浏览器 QA 验证：横屏打开 `http://localhost:5173/`，瓶颈面板可展开，道路图层可 active，console 无 error/warn；当前默认场景未稳定制造孤立路网，所以未连通卡的精确出现由单元测试覆盖。
- 限制：本轮仍没有自动给出“该从哪两格之间补桥/补路”的推荐落点；下一步需要把孤立路网边界和主路网最近边界转成可视化桥头/道路补线建议。

- 启动并完成第七十轮：`ROAD-CONNECTIVITY-DIAGNOSIS-01`。道路图层不再只判断建筑入口旁有没有道路，而是判断入口道路是否连到主路网。
- `deriveStageMapOverlay('roads')` 新增道路连通分量诊断：以最大连通分量作为当前主路网，入口贴着较小孤立路网的建筑会标为“未连通住宅/服务/仓储/生产”。
- 道路图层指标新增 `disconnectedEntrances` 与 `isolatedRoadNetworks`；阶段面板道路读数会优先显示“道路点/未连通/孤立/缺路”中的关键项，并支持点击“未连通”定位。
- 浏览器 QA 验证：横屏打开 `http://localhost:5173/`，点击阶段面板“道路”图层后出现“道路连通”和道路点读数，按钮 active，地图出现道路标记，console 无 error/warn。
- 限制：主路网目前按最大道路连通分量推断；这比“是否贴路”更真实，但还不是完整交通模型。后续仍需桥头吸附、玩家可理解的桥梁缺口提示、道路容量/拥堵成本和路线级可达性调试。

- 启动并完成第六十九轮：`BRIDGE-VISUAL-STYLE-01`。桥梁不再完全复用普通石板路视觉，而是抽出道路视觉样式层，给桥路独立桥面色、描边、透明度、桥面宽度和桥墩点。
- 新增 `src/rendering/roads.ts`，集中定义 `roadVisualStyle`，为后续道路材质、桥梁资产和不同道路等级扩展提供单一入口。
- `SimulationCanvas` 的地形/道路绘制改为读取道路视觉样式；桥梁格会绘制更宽桥面和桥墩，普通泥路/石板路行为保持原有灰盒表现。
- 浏览器 QA 验证：横屏打开 `http://localhost:5173/`，选择“桥梁 银两18/格”后按钮 active，拖拽水岸后仍无 console error/warn，并截图确认桥梁模式可见。
- 限制：本轮只完成程序化灰盒差异，不是正式桥梁美术。还缺桥头吸附、跨水连通诊断、桥梁专属施工动画、桥梁 LOD 和商业级桥梁资产 manifest。

- 启动并完成第六十八轮：`BRIDGE-BUILD-TOOL-01`。水乡城市新增桥梁专门建造模式，跨水交通不再依赖隐含道路规则。
- `BuildTool` 新增 `bridge`；`GameRuntime` 新增 `placeBridgePath`，复用道路批量建造统计，但使用桥路地形规则和 18 银两/格成本。
- `SimulationCanvas` 的道路拖拽模式扩展为 `build-road`、`build-bridge`、`remove` 三类，桥梁工具拖拽时调用 `runtime.placeBridgePath`，普通道路/拆路行为保持不变。
- 主城建面板新增“桥梁”按钮并显示 `银两18/格`，工具提示明确“拖拽水面/岸边架桥”。
- 浏览器 QA 验证：横屏打开 `http://localhost:5173/`，DOM 出现“桥梁 银两18/格”；选择后按钮 active，拖拽水岸后财政下降，console 无 error/warn。
- 限制：桥梁视觉仍复用普通道路/占位表现，尚未有专属桥梁美术、桥头吸附、跨水连通诊断或桥梁维护成本。

- 启动并完成第六十七轮：`BUILDING-DEMOLISH-CONSISTENCY-01`。建筑拆除不再是单纯擦除图块，而是进入运行时一致性链路。
- 新增 `GameRuntime.demolishBuilding`：拆除建筑会释放 `WorldGrid` 占用、删除建筑实体、迁出以该建筑为住宅的家庭、移除其 household agent、释放以该建筑为雇主的工人，并取消源/目的建筑引用该建筑的未完成物流订单。
- `LogisticsFailureReason` 新增 `building-demolished`，被拆建筑相关订单会进入 cancelled 状态并释放承运人，避免货车继续指向不存在建筑。
- 建筑详情面板新增“建筑拆除”卡片，明确拆除会迁出家庭、释放岗位、取消物流且暂不返还营造成本；点击后关闭详情并显示结果 toast。
- 浏览器 QA 验证：横屏打开 `http://localhost:5173/`，点击地图民居后详情出现“拆除建筑”；点击后详情关闭，人口/住房从 22/24 变为 12/12，toast 显示“已拆除「江南民居」…迁出 4 户…”，console 无 error/warn。
- 限制：本轮没有做二次确认、退款/回收比例、拆除施工动画、拆除对历史统计的归档和批量拆除工具；这些必须经过经济平衡和 UX 门禁后再做。

- 启动并完成第六十六轮：`ROAD-FISCAL-COST-01`。道路铺设不再免费，石板路每格消耗银两 6，避免玩家用无限道路绕开城市财政约束。
- `src/simulation/economy/construction.ts` 新增道路成本报价接口：泥路、石板路、桥路分别有独立财政成本，为后续桥梁专门模式和经济表外置打基础。
- `GameRuntime.placeRoadPath` 接入财政扣款：拖拽路径逐格处理，只对真正新增道路扣费；余额不足时跳过后续新增路格；已有道路、建筑占用、水面和越界仍按各自原因统计，不会重复扣费。
- 浏览器 QA 验证：横屏打开 `http://localhost:5173/`，页面标题为《小耳岛》，console 无 error/warn；道路工具拖拽后财政从 2400 降到 2394，证明真实 UI 路径已扣除 1 格石板路成本。
- 限制：本轮只把道路接入财政，不处理桥梁专门工具、道路维护费、拆路退款和道路容量/拥堵收费；这些属于后续城市经济平衡。

- 启动并完成第六十五轮：`ROAD-DEMOLISH-01`。新增拆路工具，玩家可以在地图上拖拽删除道路，作为完整城市规划工具链的第一步拆除能力。
- 新增 `GameRuntime.removeRoadPath`：批量删除道路、去重、一次 rebuild，并汇总 `removed/skipped/notRoad/outOfBounds`；路径中没有道路或越界不会导致已删除路段回滚。
- `BuildTool` 新增 `demolish-road`；城建面板新增“拆路”按钮；`SimulationCanvas` 复用道路拖拽状态，在铺路/拆路之间切换调用 `placeRoadPath` 或 `removeRoadPath`。
- 浏览器 QA 验证：`http://127.0.0.1:5173/` 打开正常，DOM 出现“拆路”按钮；选择拆路并拖拽地图后出现“拆除 1 格道路，跳过 1 格。”反馈，console 无 error/warn。
- 限制：本轮明确只拆道路，不拆建筑；建筑拆除必须先设计人口迁出、岗位释放、库存处置、物流订单取消和财政补偿，不能用删除格子的方式硬做。

- 启动并完成第六十四轮：`ROAD-DRAG-BUILD-01`。道路工具从单击铺一格推进为拖拽连续铺设，拖动道路时不再平移相机，而是沿格点路径批量修改真实路网。
- 新增 `GameRuntime.placeRoadPath`：支持一次传入多个格点，去重后批量铺设石板路，只 rebuild 一次，并汇总 `placed/skipped/blocked/invalidTerrain/outOfBounds/unchanged`，避免遇到建筑或水面时整条路径失败。
- `SimulationCanvas` 新增道路拖拽状态和格点插值 `gridLine`，快速拖动时会补齐中间格；道路工具优先铺路，不再被材料拾取或相机拖拽抢走输入。
- 浏览器 QA 验证：本地页面 `http://127.0.0.1:5173/` 可打开，标题为《小耳岛》，无 Vite 报错覆盖层，console 无 error/warn；选择城建面板“道路”后拖拽地图，页面出现“连续铺设 1 格石板路，跳过 1 格。”反馈并保持道路工具选中。
- 限制：浏览器自动拖拽坐标仍不够稳定，只证明 UI 调用了批量铺路入口；新增格数的精确断言目前由 Runtime 单元测试覆盖，后续需要补专门的坐标级 E2E 或测试钩子。

- 启动并完成第六十三轮：`BUILD-PLACEMENT-AFFORDABILITY-01`。建筑试放预览接入正式营造成本报价，避免“预览可建、点击后才提示材料不足”的错误手感。
- `GameRuntime.previewBuildingPlacement` 现在在地块/道路/阶段校验之后读取城市财政与仓储材料；当地块本身可放但资源不足时，返回 `valid: false`、中文缺口原因和 `construction` 报价结构。
- 新增测试覆盖资源不足预览：连续建造耗尽木料后，同一可放置住宅点会在 preview 阶段显示 `材料不足：木料×2`，并保持 footprint cells 可见，便于玩家理解是资源问题而非地块问题。
- 限制：本轮仍未完成道路拖拽/连续铺设、拆除模式和浏览器绿态截图验证；资源门禁由运行时与 UI 适配层自动传导，但还缺专门的浏览器自动化复验。

- 启动并完成第六十二轮：`BUILD-PLACEMENT-CONTROLLER-01`。建筑试放主流程开始接入 `PlacementController`，不再由 `SimulationCanvas` 分散维护 move/rotate/confirm/cancel 逻辑。
- 新增 `src/ui/placement/runtimePlacement.ts`：将 `GameRuntime.previewBuildingPlacement` 包装为 `PlacementValidator`，并能从 `PlacementState` 派生真实 Runtime preview。该适配层有单元测试覆盖可营造、入口未连路和 idle/no-anchor 无 preview。
- `SimulationCanvas` 内部使用 `PlacementController` 驱动建筑选择、地图移动、R 旋转、点击确认、右键取消和成功后的 resume repeated placement；预览仍由同一 Runtime 规则生成。
- 浏览器 QA 验证：选择“民居”后移动地图出现 5 个 preview cell；按 R 后 preview 仍保留；右键取消后 active 工具回到“查看”、preview cell 清零；console 无 error/warn。
- 限制：本轮仍未完成浏览器可营造绿态、确认成功后连续放置、道路拖拽/连续铺设和拆除模式。

- 启动并完成第六十一轮：`BUILD-PLACEMENT-PREVIEW-01`。建筑工具获得动态试放预览，玩家选择民居/粮仓/集市等建筑后，鼠标移动到地图会显示当前 anchor 的 footprint、入口和冲突格。
- 新增 `GameRuntime.previewBuildingPlacement`，复用 `WorldGrid.validateBuildingPlacement`，保证试放预览和实际点击放置使用同一套道路、地形、建筑占用和边界规则；preview 不扣银两、不扣仓储材料、不创建建筑。
- `SimulationCanvas` 新增 `placement-preview-layer`，显示可营造/不可营造状态条，支持 R 旋转后在原位置重新校验；右键仍可取消当前营造工具。
- 浏览器 QA 验证：选择“民居”后移动到地图，DOM 出现 5 个 preview cell（4 个 footprint + 1 个入口冲突），状态条显示“不可营造 入口必须紧邻道路”，console 无 error/warn。
- 限制：本轮尚未把已有 `PlacementController` 接入 React 主状态，浏览器 QA 主要覆盖冲突红态；可营造绿态由 Runtime 单元测试覆盖，下一轮需要在浏览器中覆盖绿态、旋转入口和重复放置。

- 启动并完成第六十轮：`GOVERNANCE-PLACEMENT-FOOTPRINT-01`。建筑类治理建议不再只给“建议落点/入口”两个 marker，而是输出真实建筑 `footprint`、入口格和后续可扩展的旋转字段。
- `StageAdvisorOverlay` 新增 `cells` 数据结构，`SimulationCanvas` 在覆盖层渲染等距菱形占地格；入口格使用单独样式高亮，为后续正式试放、冲突格和旋转确认流打基础。
- 浏览器 QA 验证：点击“瓶颈 → 打开服务图层并营造市场”后，地图出现 6 个 footprint 格、1 个入口格、2 个 placement marker，建造菜单高亮“集市”，console 无 error/warn。
- 限制：当前是治理建议的静态推荐预览，不是完整自由试放系统；尚未显示冲突格、方向切换、旋转入口和确认/取消流。

## 2026-06-29

- 启动并完成第五十九轮：`GOVERNANCE-PLACEMENT-FOCUS-01`。建筑类治理建议会把推荐候选落点注入当前阶段覆盖图层，并在建造菜单标出推荐建筑。
- 浏览器 QA 发现推荐点最初被物流/服务热点点位裁掉；已修复为 placement 点优先进入覆盖点列表，确保“建议落点/入口”在地图上可见。
- 启动并完成第五十八轮：`BUILD-MENU-COST-01`。建造菜单改用带成本报价的运行时菜单状态，显示银两/材料成本、资源缺口和是否可营造。
- 新增 `getRuntimeBuildingMenuState`，统一读取当前财政、城市仓储和营造成本；主界面资源不足的已解锁建筑会禁用并显示缺口。
- 启动并完成第五十七轮：`CONSTRUCTION-COST-01`。新增正式营造成本模块，建筑放置需要银两和城市仓储材料；放置失败或资源不足不会扣费。
- `GameRuntime.placeBuilding` 改为先校验地块，再校验并扣除营造成本，最后落建筑并刷新模拟；治理卡营造条件也会读取同一成本报价，显示材料/银两缺口。
- 启动并完成第五十六轮：`CITY-RECOMMENDATION-EXECUTION-01`。治理卡推荐建筑在已解锁后继续诊断连续空地和入口道路，推荐对象携带营造条件说明。
- 主界面治理卡显示“营造条件”；点击推荐时若没有可放置空地或入口道路，不再切换到建筑工具，而是保留 inspect 并提示原因。当前正式营造材料/财政成本尚未建立，本轮不伪造资源门禁。
- 启动并完成第五十五轮：`CITY-RECOMMENDATION-UNLOCK-01`。治理卡推荐建筑时会读取当前城市阶段和建筑所需阶段，推荐对象携带可用性解释。
- 未解锁建筑推荐会降级为查看相关图层，并说明“当前阶段/所需阶段”；主界面点击推荐时也会二次检查，防止切换到当前阶段不可营造的建筑工具。
- 启动并完成第五十四轮：`CITY-ACTIVITY-RECOMMENDATION-01`。城市活动压力治理卡不再只提示查看热区，而是按压力主因给出不同动作。
- 货运拥堵优先推荐补仓储缓冲，服务热度优先推荐补服务点分流，道路压力优先推荐铺路分流；新增测试覆盖三类推荐。
- 启动并完成第五十三轮：`CITY-ROAD-PRESSURE-CELLS-01`。活动压力图层开始读取 agent 剩余路径，并将服务访问、工人通勤和货运路线投射到真实道路格。
- 有道路格时，活动图层会优先显示 `货路/服路/通路/道压` 承压点；无道路格时保留第五十二轮的活动热区 fallback，避免灰盒场景失去诊断。
- 阶段面板“道压”读数现在可定位道路承压点；新增测试覆盖多条服务/货运路径压到同一批道路格。
- 启动并完成第五十二轮：`CITY-ACTIVITY-PRESSURE-01`。活动图层不再只显示“城市里有人在动”，而是拆出道路压力、服务热度和货运拥堵三个治理读数。
- 阶段面板活动指标改为 `道压/货拥/服务热`；活动压力超过阈值时会生成“城市活动压力”治理卡，可一键打开活动图层并定位热区。
- 新增测试覆盖集中服务访问与货运活动触发治理卡；阶段顾问目标测试 6 项通过。
- 启动并完成第五十一轮：`CITY-ACTIVITY-HEATMAP-01`。阶段图层新增“活动”模式，聚合服务访问、工人通勤/返家、承运人取货/送货等真实 agent 活动。
- 活动图层输出活动热力点、活动路径、活动/服务/货运/通勤/热点结构化指标，并接入阶段面板指标读数和点击定位。
- 新增测试覆盖服务访问、通勤和货运三类活动进入热力图层；活动 marker 样式已接入正式 CSS。
- 第五十一轮验证通过：阶段顾问目标测试、全量 198 项测试和生产构建均通过。
- 启动并完成第五十轮：`LEGACY-GAME-SCOPE-01`。旧固定岛屿材料/建造/存档引擎从正式 `src/game/**` 迁入 `src/legacy/game/**`；未被正式 UI 使用的 `MaterialRow` 也从 `src/components` 迁入 legacy，正式组件目录不再引用旧材料系统。
- `src/legacy/archipelago/IslandCanvas.tsx` 改为引用 `src/legacy/game/**`；`src/legacy/README.md` 增加旧 game 引擎归档范围说明。
- legacy 边界测试新增断言：`src/game` 目录和 `src/components/MaterialRow.tsx` 不得存在，旧引擎与旧材料 UI 只能存在于 `src/legacy/game/**`。
- 第五十轮验证通过：legacy 边界/旧引擎/旧存档目标测试、全量测试和生产构建均通过。
- 启动并完成第四十九轮：`LOGISTICS-ORDER-ARCHIVE-01`。`SimulationSnapshot` 新增可选 `logisticsArchive`，用于汇总已归档订单数、交付数、取消数和取消原因计数。
- `LogisticsSystem` 增加有界完成订单保留窗口：默认保留最近 500 条 delivered/cancelled 订单，超出部分进入归档汇总；物流效率统计改为读取当前订单和归档汇总，避免压缩后丢失历史成功/失败比例。
- 长稳 QA 新增 `archivedOrders` 摘要和数值检查，2400 tick 灰盒基准的当前订单表上限从 20000 收紧到 2000，并断言归档确实发生。
- 第四十九轮验证通过：经济物流测试、2400 tick 长稳、全量 196 项测试和生产构建均通过。
- 启动并完成第四十八轮：`LOGISTICS-CARRIER-LIFECYCLE-01`。`AgentEntity` 新增 `cargoIntent`，承运人记录订单、资源、数量、源建筑、目的建筑和 `pickup/dropoff` 阶段。
- `LogisticsSystem` 在分配订单时给承运人设置取货阶段；取货成功并切换 `in_transit` 后改为送货阶段；交付或取消时清理货运意图。
- 动态渲染在运输工具上增加轻量货箱符号：取货阶段为空框，送货阶段为实心货箱，让地图能区分空车取货和载货送达。
- 第四十八轮验证通过：经济物流测试、动态场景测试、2400 tick 长稳、全量 195 项测试和生产构建均通过。
- 启动并完成第四十七轮：`CITY-GOVERNANCE-ACTION-01`。`StageGovernanceCard` 新增 `cause` 与结构化 `recommendation`，每张治理卡能说明为什么卡住、建议打开哪个图层、使用铺路/营造/查看哪类操作。
- 主界面瓶颈面板从整卡点击改为“定位”和“推荐操作”两个明确入口；推荐操作会打开对应图层，并切换到道路工具或指定建筑营造工具。
- 常规停工、缺工、仓满、缺料、居民需求不足和物流不畅等瓶颈也补齐原因与推荐操作，避免只有图层指标卡可执行。
- 第四十七轮验证通过：阶段顾问目标测试、全量 194 项测试和生产构建均通过。
- 启动并完成第四十六轮：`DISTRICT-SERVICE-VISIT-HEAT-01`。`deriveDistrictProsperity` 现在读取 `snapshot.agents` 中带 `serviceIntent` 的居民服务访问，正在前往市场、药铺、书院、戏台等目标建筑的居民会给对应街区增加繁荣和 footTraffic。
- 新增街区繁荣测试，验证相同建筑条件下，真实居民服务访问会提高市街/服务街区热度，而不是只依赖静态服务建筑、道路或物流订单。
- 第四十六轮验证通过：街区繁荣目标测试、运行时/渲染/长稳相关测试、全量 194 项测试和生产构建均通过。
- 启动并完成第四十五轮：`SERVICE-ARRIVAL-CHECKOUT-01`。`AgentEntity.serviceIntent` 记录居民出行要完成的服务意图；市场购买、药铺、书院和戏台服务改为居民走到目标建筑后才扣库存、扣收入、增加税收并恢复需求，随后居民返家。
- 同步修正主循环：经济/服务系统更新后再执行迁出判定，避免已经抵达服务点的居民在同一 tick 先被迁出。
- 明确 `migrationOutThreshold: 0` 在压力测试中表示禁用迁出，用于测试 500 户满规模长稳吞吐；默认游戏阈值仍保留低满意度迁出后果。
- 重新校准 500 户长稳灰盒历史订单上限为 20000；活动订单上限不变，历史订单归档/压缩记录为后续风险。
- 第四十五轮验证通过：经济系统测试、模拟核心测试、长稳压力测试、全量 193 项测试和生产构建均通过。
- 启动并完成第四十四轮：`SERVICE-VISIT-PATH-01`。`ServiceSystem` 在市场/药铺/书院/戏台等服务成功交付时生成 `service-visit` 居民 agent，路径从住宅入口到服务建筑入口；后续更新会推进该 agent，到达服务点后反转为返家路径，回到住宅后移除。
- 新增测试先红后绿，覆盖市场服务生成购物居民、沿路径前进、避免同一家庭同一需求重复刷屏、到达服务点后返家并清理。相关动态场景与 2400 tick 长稳测试通过。限制：服务数值当前仍在交付 tick 即时结算，尚未延迟到居民抵达服务点后结算。
- 启动并完成第四十三轮：`WORKER-RETURN-HOME-01`。`AgentEntity` 新增 `activityStartedTick`，`SimulationEngine` 在工人抵达雇主入口后记录工作开始 tick；工人完成固定工作班次后，会调用共享移动路径生成从雇主入口回住宅入口的返家路径，逐 tick 移动并在抵达后恢复 `home` 状态。
- 本轮测试先红后绿，把上一轮“上班通勤”扩展为“上班 → working → returning → home”闭环；相关经济、渲染和 2400 tick 长稳目标测试通过。限制：这仍不是完整日夜作息，购物/服务/休闲出行尚未接入。
- 启动并完成第四十二轮：`WORKER-COMMUTE-PATH-01`。`SimulationEngine` 的就业匹配不再只给工人打上 `commuting` 标签，而是在分配岗位时调用共享移动路径生成从住宅入口到雇主入口的道路优先路径；后续 tick 会推进工人位置，抵达雇主入口后进入 `working` 状态。
- 新增测试先红后绿，验证工人通勤会绕开阻挡并走共享道路路径，且位置与 `pathIndex` 会逐 tick 前进；这让现有 `AgentVisual` 的移动动画有真实模拟数据驱动，而不是空路径占位。
- 启动并完成第四十一轮：`LOGISTICS-SHARED-PATH-01`。物流 `RoadRoutePlanner` 不再维护独立简化 BFS，而是复用 `src/simulation/world/movementPath.ts` 的共享移动路径服务；货运必须沿有效道路/桥通行，普通水面与建筑占用格会阻断路径，无路时返回失败并触发既有物流 no-route 后果。
- 共享移动路径服务新增 `findMovementPath`、`fallback: none` 与 `requireRoad` 选项，保留候选外来人口所需的安全直线 fallback，同时给物流提供严格“无路不兜底”能力。
- 新增/补强测试覆盖物流不能穿越水面或占用道路、共享路径无路返回失败、桥路可过水；本轮目标测试先红后绿。
- 启动并完成第四十轮：`DISTRICT-PROSPERITY-RUNTIME-01`。街区繁荣评分不再只依赖建筑数量、等级、邻近和状态，而是接入道路贴近、服务功能建筑和真实物流订单活动；有服务覆盖、道路入口和货物流转的街区会获得更高繁荣和人流表现。
- 新增测试先红后绿，验证相同建筑聚集下，服务覆盖、道路访问和物流活动会提高街区繁荣与 `footTraffic` 视觉提示。
- 启动并完成第三十九轮：`CITY-GOVERNANCE-CARDS-01`。`stageAdvisor` 新增 `deriveStageGovernanceCards`，直接复用覆盖图层的服务缺口、道路缺口和物流热点指标生成可排序治理卡；物流热点按订单集中度降序定位，避免把玩家带到次要拥堵点。
- 主界面瓶颈面板合并治理卡，现有停工/需求/物流瓶颈之外，能直接显示“服务覆盖缺口”“道路入口缺口”“物流热点拥堵”等治理建议，并点击定位到对应地图点。
- 新增测试覆盖治理卡排序、目标点和图层来源，确保图层读数不只是摘要，而能转化为城市管理动作。
- 启动并完成第三十八轮：`SHARED-MOVEMENT-PATH-01`。新增 `src/simulation/world/movementPath.ts`，把候选外来人口原本内嵌在 `SimulationEngine` 的道路优先寻路抽成共享移动路径服务；服务支持道路偏好、避开水面/建筑占用以及无网格时安全直线 fallback。
- `SimulationEngine` 的候选外来人口进城路径改为调用共享移动路径服务，删除内部重复寻路函数，为后续真实居民通勤、服务出行和物流路径逐步统一打基础。
- 新增 `movementPath.test.ts`，覆盖道路优先、无世界格子 fallback、绕开水面/建筑阻挡三类核心行为。
- 启动并完成第三十七轮：`LEGACY-ARCHIPELAGO-SCOPE-01`。旧群岛 `IslandCanvas` 从正式 `src/components` 目录迁入 `src/legacy/archipelago`，新增 `src/legacy/README.md` 和归档导出边界，明确旧群岛只用于显式 legacy/QA 对照，不再属于正式城市模拟 UI 路径。
- `src/legacy/game/legacy.test.ts` 增加边界测试，验证 `src/components/IslandCanvas.tsx` 不存在且归档组件位于 `src/legacy/archipelago/IslandCanvas.tsx`，防止后续旧原型回流正式组件目录。
- 更新任务看板、进度仪表盘、产物索引和 QA 记录，下一轮转向金标资产阶段/街区样板、共享路径服务或治理卡。

## 2026-06-27

- 新增 `HANDOFF.md` 跨电脑/空对话接续手册，明确 GitHub 仓库、当前主控分支、另一台电脑首次 clone/checkout/test/build 命令、新 Codex 对话启动提示词、回到当前电脑继续的 pull/test/build 流程，以及必须保留的项目原则。
- 更新 `README.md` 核心索引，把 `HANDOFF.md` 加入项目中枢入口，避免换电脑后新对话找不到上下文恢复路径。
- 启动第十二轮并行生产：POP-MIGRATION-ENGINE-01、CITY-ATTRACTION-01，优先把外来人口从“凭空生成住户”推进为“候选人口抵达、等待、入住或离开”的运行时状态机，并建立城市吸引力评分。
- 完成第十二轮并行生产：`SimulationSnapshot` 增加候选外来人口状态；`SimulationEngine` 每轮按空房、岗位、库存粮、满意度、物流和税率计算城市吸引力，低吸引力不吸引新人，无房或等待过久会离开；住户只会在候选人口成功入住后创建工人与家庭；主界面指标栏新增吸引力读数。
- 第十二轮验证通过：`src/simulation/core/SimulationEngine.test.ts` 扩展到 12 项，覆盖候选抵达、入住、低吸引力拒绝和无房离开；全量测试 26 个文件、163 项通过；生产构建通过。
- 启动第十三轮并行生产：POP-MIGRATION-VISUAL-01，补齐候选外来人口的可见到达点、临时停留和找房反馈。
- 完成第十三轮并行生产：迁入候选人拥有地图位置和目标住宅；`DynamicScene` 将等待候选人渲染到居民层；城市小事流新增“有人在城口等房”并可定位到临时停留点。
- 第十三轮验证通过：迁入核心、小事流和动态场景目标测试 30 项通过；全量测试 26 个文件、165 项通过；TypeScript 检查与 Vite 生产构建通过。
- 启动第十四轮并行生产：TAXONOMY-RUNTIME-01，把建筑从运行时硬编码小清单推进到阶段、功能、连接方式和年代一致性的内容目录。
- 完成第十四轮并行生产：`BuildingDefinition` 增加城市阶段、功能、连接和年代标签；`BUILDING_CATALOG` 可按阶段/功能查询并校验年代一致性；新增 starter 运行时建筑目录，保留现有 `house/granary/riceField/woodshop/market` 类型兼容，同时映射到金标分类；`GameRuntime` 改为读取内容目录定义。
- 第十四轮验证通过：内容目录、运行时集成和 prefab 映射目标测试 14 项通过；全量测试 26 个文件、168 项通过；TypeScript 检查与 Vite 生产构建通过。
- 启动第十五轮并行生产：DISTRICT-PROSPERITY-01，建立街区繁荣第一版数据层与地图轻表现。
- 完成第十五轮并行生产：`SimulationSnapshot` 增加街区繁荣状态和指标；新增 `deriveDistrictProsperity`，按建筑街区亲和、等级、状态、相邻关系推导住宅巷、市街、仓储院等街区；`GameRuntime` 每次刷新快照时派生街区；`DynamicScene` 新增道路之上、建筑之下的 `districts` 层，渲染地表暖光、灯点和人流点。
- 第十五轮验证通过：街区数据层、运行时集成和动态场景目标测试 20 项通过；全量测试 27 个文件、171 项通过；TypeScript 检查与 Vite 生产构建通过。
- 启动第十六轮并行生产：POP-MIGRATION-PATH-01，把候选外来人口从“等待后瞬时入住”推进为“等待、移动、抵达后入住”的可观察路径行为。
- 完成第十六轮并行生产：`MigrationCandidateState` 增加 `walking` 状态和路径进度；`SimulationEngine` 会让候选人从临时停留点沿路径走到目标住宅后才生成家庭与工人，并把路上的家庭计入住房预占，避免多个候选家庭抢占同一套剩余容量；小事流可区分等房与正在进城。
- 第十六轮目标验证通过：迁入核心、小事流和动态场景目标测试 32 项通过。
- 启动第十七轮并行生产：BUILD-MENU-STAGE-01，把建筑目录阶段元数据接入城建菜单和运行时放置限制。
- 完成第十七轮并行生产：新增运行时城市阶段推导、阶段标签、建筑解锁判断和菜单状态；主界面城建面板显示当前阶段并锁定后续阶段建筑；`GameRuntime.placeBuilding` 会拒绝未解锁建筑，避免绕过 UI；木作坊元数据与菜单统一为商贸镇解锁。
- 第十七轮目标验证通过：建筑目录与运行时目标测试 14 项通过，TypeScript 检查通过。
- 启动第十八轮并行生产：POP-MIGRATION-ROAD-PATH-01，把第十六轮的直线进城路径升级为道路优先寻路。
- 完成第十八轮并行生产：候选外来人口移动路径会读取快照网格，有道路时以更低成本沿道路和入口行走，避开水面和建筑占用；无网格或无可达路径时仍安全退回直线路径，保证灰盒场景兼容。
- 第十八轮目标验证通过：迁入核心测试 13 项通过，TypeScript 检查通过。
- 启动第十九轮并行生产：CITY-STAGE-GOALS-01，把阶段解锁从隐含规则推进为玩家可见的晋升目标。
- 完成第十九轮并行生产：运行时内容层新增阶段进度解释，主界面在未选中建筑时显示当前阶段、下一阶段，以及人口、吸引力、街区三项晋升条件；建筑解锁不再只是置灰，而是有明确成长方向。
- 第十九轮目标验证通过：内容目录目标测试 7 项通过，TypeScript 检查通过。
- 启动第二十轮并行生产：OPTIONAL-MUSIC-ENTRY-01，继续把旧听歌成长入口从主线 UI 降级。
- 完成第二十轮并行生产：主界面听歌奖励卡片默认收起为小型“轻奖励”入口，展开后明确“只给珍材，不影响城市主线”；保留既有稀缺奖励兼容能力，但不再占据核心建造/治理视线。
- 第二十轮目标验证通过：TypeScript 检查通过。
- 启动第二十一轮并行生产：LEGACY-LISTENING-DROPS-01，隔离旧 `game/engine` 中“听歌刷普通材料”的历史原型行为。
- 完成第二十一轮并行生产：旧群岛引擎默认关闭听歌普通材料掉落，初始掉落改为潮汐/访客来源；旧听歌掉落行为保留在显式 `legacyMaterialDrops` 选项下，测试名称同步改为归档兼容语义；当前城市主线继续使用 `simulation/rewards/music.ts` 的稀缺奖励和 `drops.ts` 的普通城市来源。
- 第二十一轮目标验证通过：旧群岛引擎、音乐稀缺奖励、普通掉落目标测试 23 项通过，TypeScript 检查通过。
- 启动第二十二轮并行生产：LEGACY-ARCHIPELAGO-GATE-01，给旧 `IslandCanvas` 群岛 Pixi 视图增加显式归档开关。
- 完成第二十二轮并行生产：新增 `src/legacy/game/legacy.ts`，默认禁用旧群岛渲染；`IslandCanvas` 默认显示“旧群岛原型已归档”提示，只有 `?legacy-islands` 或 `?qa-static` 才启动旧渲染/静态验收；新增测试固定开关规则。
- 第二十二轮目标验证通过：旧群岛开关、旧引擎和存档兼容目标测试 16 项通过，TypeScript 检查通过。
- 启动第二十三轮并行生产：CITY-STAGE-ADVISOR-01，把阶段目标从静态数值推进为可点击顾问。
- 完成第二十三轮并行生产：阶段条件增加顾问建议；人口缺口点击后切到民居建造，吸引力缺口打开瓶颈面板，街区缺口优先定位已有街区或切到市场建造；阶段面板的条件按钮支持 hover/focus。
- 第二十三轮目标验证通过：建筑/阶段目标测试 7 项通过，TypeScript 检查通过。
- 启动第二十四轮并行生产：CITY-STAGE-DIAGNOSIS-01，把阶段顾问从“下一步建议”推进为“具体卡点诊断”。
- 完成第二十四轮并行生产：阶段目标条件新增诊断字段，人口会判断住房是否满、是否已有外来人口等待、吸引力是否偏低；吸引力会诊断空房、岗位、满意度和物流；街区会诊断当前还差多少活跃街区。UI 在阶段按钮内展示诊断，点击 toast 也复用同一原因。
- 第二十四轮目标验证通过：建筑/阶段目标测试 8 项通过，TypeScript 检查通过。
- 启动第二十五轮并行生产：CITY-STAGE-OVERLAY-01，把阶段顾问接入地图覆盖提示。
- 完成第二十五轮并行生产：新增 `deriveStageAdvisorOverlay`，按人口/吸引力/街区条件从快照推导覆盖点；`SimulationCanvas` 增加阶段覆盖层，显示住房与外来人口、吸引力瓶颈或街区核心标记；阶段顾问点击时会同步设置覆盖层。
- 第二十五轮目标验证通过：阶段覆盖和阶段目标测试 10 项通过，TypeScript 检查通过。
- 启动第二十六轮并行生产：CITY-STAGE-LAYER-01，把阶段覆盖从统一标记推进为分层标记。
- 完成第二十六轮并行生产：阶段覆盖点增加 `housing`、`migration`、`bottleneck`、`district` 类型和短标签；地图覆盖层按类型显示不同颜色，住房、等房/进城中、停工/仓储和街区核心不再混在同一种提示里。
- 第二十六轮目标验证通过：阶段覆盖测试 2 项通过，TypeScript 检查通过。
- 启动第二十七轮并行生产：CITY-STAGE-LAYER-SWITCH-01，把阶段覆盖推进为可切换图层。
- 完成第二十七轮并行生产：新增 `deriveStageMapOverlay` 和固定图层模式，阶段面板可切换住房容量、服务覆盖、物流拥堵和道路连通；打开图层后会随快照刷新，关闭后清空地图标记。
- 第二十七轮目标验证通过：阶段覆盖测试 3 项通过，TypeScript 检查通过。
- 启动第二十八轮并行生产：CITY-STAGE-LOGISTICS-PATH-01，把物流图层从端点提示推进为线路提示。
- 完成第二十八轮并行生产：`StageAdvisorOverlay` 支持可选 `paths`；物流图层会为未完成订单生成发货点、收货点和带方向的线路；`SimulationCanvas` 渲染线路和箭头，样式层增加轻量路径标签。
- 第二十八轮目标验证通过：阶段覆盖测试 3 项通过，TypeScript 检查通过。
- 启动第二十九轮并行生产：CITY-STAGE-SERVICE-RANGE-01，把服务图层从服务点提示推进为范围提示。
- 完成第二十九轮并行生产：`StageAdvisorOverlay` 支持可选 `areas`；服务图层会为可用服务建筑生成半透明覆盖范围；`SimulationCanvas` 按等距视角渲染椭圆范围，样式层增加范围标签。
- 第二十九轮目标验证通过：阶段覆盖测试 3 项通过，TypeScript 检查通过。
- 启动第三十轮并行生产：CITY-STAGE-SERVICE-GAP-01，把服务范围推进为可诊断缺口。
- 完成第三十轮并行生产：服务图层会用现有服务范围检查住宅入口，最多标出 4 个不在服务范围内的住宅，标签为“缺服务”，用于指导玩家补市场/服务点。
- 第三十轮目标验证通过：阶段覆盖测试 3 项通过，TypeScript 检查通过。
- 启动第三十一轮并行生产：CITY-STAGE-ROAD-GAP-01，把道路图层从统一缺路提示推进为分类缺口诊断。
- 完成第三十一轮并行生产：道路图层会按建筑功能把缺路入口标成缺路住宅、缺路服务、缺路仓储或缺路生产，优先让玩家看懂应该先接通哪类建筑。
- 第三十一轮目标验证通过：阶段覆盖测试 3 项通过，TypeScript 检查通过。
- 启动第三十二轮并行生产：CITY-STAGE-LOGISTICS-HOTSPOT-01，把物流图层从线路展示推进为热点诊断。
- 完成第三十二轮并行生产：物流图层统计未完成订单的源/目的建筑参与次数，超过 1 条订单的建筑会额外标记为“物流热点xN”，方便定位拥堵集中点。
- 第三十二轮目标验证通过：阶段覆盖测试 3 项通过，TypeScript 检查通过。
- 启动第三十三轮并行生产：CITY-STAGE-OVERLAY-SUMMARY-01，把覆盖图层从地图标记推进为可读摘要。
- 完成第三十三轮并行生产：`StageAdvisorOverlay` 增加 `summary`，住房、服务、物流和道路图层分别输出住宅/空位、服务点/缺口住宅、未完成订单/热点、道路点/缺路摘要；地图覆盖层顶部显示摘要条。
- 第三十三轮目标验证通过：阶段覆盖测试 3 项通过，TypeScript 检查通过。
- 启动第三十四轮并行生产：CITY-STAGE-OVERLAY-METRICS-01，把覆盖图层摘要推进为结构化指标。
- 完成第三十四轮并行生产：`StageAdvisorOverlay` 增加 `metrics` 字典；住房、服务、物流和道路图层分别输出 `houses/openHousing`、`servicePoints/serviceGaps`、`activeOrders/hotspots`、`roadCells/roadGaps`，为后续接入瓶颈/阶段面板做准备。
- 第三十四轮目标验证通过：阶段覆盖测试 3 项通过，TypeScript 检查通过。
- 启动第三十五轮并行生产：CITY-STAGE-OVERLAY-PANEL-METRICS-01，把覆盖图层结构化指标接入阶段面板。
- 完成第三十五轮并行生产：阶段面板会在当前图层按钮下显示对应指标读数，住房、服务、物流和道路图层分别展示住宅/空位、服务点/缺口住宅、未完成/热点、道路点/缺路。
- 第三十五轮目标验证通过：阶段覆盖测试 3 项通过，TypeScript 检查通过。
- 启动第三十六轮并行生产：CITY-STAGE-OVERLAY-METRIC-FOCUS-01，把阶段面板图层指标推进为可点击治理入口。
- 完成第三十六轮并行生产：阶段面板图层指标从静态读数改为按钮；点击住宅/空位、服务点/缺口住宅、未完成/热点、道路点/缺路时，会从当前 overlay 中挑选对应点并调用相机定位。
- 第三十六轮目标验证通过：阶段覆盖测试 3 项通过，TypeScript 检查通过。
- 补强商业级完整上线总计划：`commercial-launch-master-plan.md` 新增美术 ART-P0–P11 全阶段上线要求，明确美术不是首批金标任务，而是从方向、灰盒、概念、金标、角色、动画、环境、UI、Alpha 量产、Beta 完整化、RC 冻结到上线后运营的完整生产线。
- 清理 `production-pipeline.md` 与 `gates.md` 中残留的 28×9、四岛、音乐奖励、拾取材料等旧主线门禁，替换为可扩展建筑/街区资产矩阵、人口生命周期、城市吸引力、街区繁荣和城市问题诊断。
- 更新 `task-board.md`、`progress-dashboard.md` 和 `artifact-index.md`，让本轮总计划一致性补强在项目中枢内可追踪。
- 新增 `commercial-launch-master-plan.md`，明确《小耳岛》最终目标为架空明清江南水乡城市文明模拟游戏，完整覆盖 P0–P10 阶段、12 条生产线、自动执行机制和每轮产出记录机制。
- 新增 `design/world-bible.md`，冻结统一年代设定：前工业时代水乡城市，禁止现代电力、汽车、铁路、现代工厂、蒸汽朋克和未来机械。
- 新增 `design/building-taxonomy.md`，将建筑体系从固定 28 类改为可扩展分类，并补充荒村、村集、水乡镇、商贸镇、繁华府镇、盛世水都六阶段，以及商业街、夜市、码头仓区、官署街等街区型建筑。
- 新增 `design/population-lifecycle.md`，明确外来人口入住前后的状态差异：抵达、找房、临时停留、正式入住、稳定生活和离城。
- 新增 `design/art-production-roadmap.md`，补齐美术从 ART-P0 到 ART-P11 的全阶段生产计划、角色分工和 A0–A10 质量门禁。
- 新增 `progress-dashboard.md` 与 `artifact-index.md`，让每轮完成后的阶段进度、真实产出、风险和下一轮任务可被项目内追踪。
- 同步更新 `README.md`、`commercial-civilization-target.md`、`production-pipeline.md`、`gates.md` 和 `task-board.md`，将听歌材料、岛屿解锁、固定 28 类建筑从主线降级为历史原型或非核心入口。

## 2026-06-25

- 初始化 Git 项目基线。
- 冻结第一版模拟公共契约。
- 建立项目中枢、任务看板与并行模块边界。
- 完成模拟核心、网格寻路、生产物流、动态渲染、奖励和相机输入六个并行模块。
- 全量 95 项测试通过，生产构建通过。
- 增加 28 类建筑功能目录与 500 户、300 建筑、150 可见实体压力快照。
- 启动主应用垂直切片集成。
- 将美术拆分为建筑审计、整体镇貌审计、动画审计、视觉系统重设计和动画系统重设计五条独立任务线。

## 2026-06-26

- 完成主应用垂直切片集成：React 主入口已切换到真实模拟灰盒，包含等距地图、道路铺设、建筑放置、暂停/倍速、人口迁入、就业、生产、物流、财政、停工原因、材料拾取、歌曲完成稀缺奖励、全屏、拖拽和缩放。
- 完成 28 类建筑目录、公共模拟契约、固定 Tick、确定性随机、世界网格、寻路、生产物流、奖励掉落、Pixi 动态渲染骨架、UI 输入控制和压力快照。
- 完成生产流水线文档：`production-pipeline.md` 与 `gates.md` 明确从立项、技术预研、灰盒、垂直切片、Alpha 到 RC 的门禁。
- 完成美术、动画、建模三条高精良生产线的审计与设计文档：视觉系统、动画系统、建模系统、建筑逐项审计、整体镇貌审计、动画审计和建模审计。
- 明确现有建筑美术资产只可作为灰盒，不可作为最终资产；后续必须先制作六类金标建筑，再扩展到 28 类 × 9 等级。
- 浏览器验证 `http://localhost:4173/`：页面可启动，无控制台错误；模拟听歌可触发稀缺材料奖励；道路铺设提示与世界交互正常。
- 全量测试扩大到 98 项，生产构建通过。
- 完成第一轮真正并行生产：ENGINE-CONSEQUENCE-01、GOLD-ART-01、MODEL-ANIM-01、QA-PRODUCTION-01 四个 worker 同时推进，主控会话负责写入范围、审查、集成和验收。
- 新增 `parallel-production.md` 与 `parallel-production-qa.md`，将子任务输入/输出模板、文件所有权、集成顺序、退回标准和验收证据写入项目中枢。
- 新增六类金标建筑美术规格：柳岸民居、层层稻田、丰年粮仓、小满食肆、青瓦瓷窑、旧码头均拆到 L0–L8，每级包含主体、环境覆盖、识别物、活动、禁项和截图验收。
- 新增金标建模/动效/Pixi Prefab 规格，覆盖 DCC→2.5D→Pixi 流水线、LOD、分层、pivot、碰撞、manifest、状态动画和性能预算。
- 引擎侧新增居民需求后果链：关键需求不足和失业会产生确定性满意度压力，服务恢复与就业恢复可使满意度回升。
- 启动第二轮并行生产：ENGINE-SERVICE-02、RENDER-STATE-01、GOLD-BLOCKOUT-01、TOOL-ASSET-VALIDATOR-01，分别推进服务网络、状态渲染、体块验证和资产校验工具。
- 完成第二轮并行生产：服务网络测试覆盖市场、药铺、书院、戏台；渲染层新增建筑状态灰盒符号和动效层；六类金标建筑新增 blockout 验证方案；工具链新增可运行的金标资产 manifest 校验器和 fixtures。
- 第二轮验证通过：资产校验器自检、valid manifest 校验、全量 110 项测试和生产构建均通过。
- 启动第三轮并行生产：ENGINE-FAILURE-01、PREFAB-RUNTIME-01、UI-CITY-MANAGER-01、TOOL-ASSET-VALIDATOR-02，分别推进城市故障后果、manifest 驱动 prefab 数据层、城市瓶颈面板和资产校验 npm 脚本接入。
- 完成第三轮并行生产：新增故障后果集成测试、manifest 驱动 prefab runtime 数据层、城市瓶颈管理面板、资产校验 npm 脚本。
- 第三轮验证通过：`asset:validate:self-test`、`asset:validate:gold-fixture`、全量 115 项测试和生产构建均通过；构建出现主 chunk 超过 500kB 的非阻断警告，已记录为 `PERF-SPLIT-01` 后续任务。
- 启动第四轮并行生产：LOGISTICS-FAILURE-02、PREFAB-RENDER-01、PERF-SPLIT-01、CITY-EVENTS-01，分别推进物流失败显式化、prefab 渲染占位接入、Vite 分包和城市反馈事件数据层。
- 完成第四轮并行生产：物流失败原因写入建筑状态并影响效率；prefab descriptor 可注册并驱动灰盒占位；城市反馈数据层可从快照派生缺粮、缺工、物流阻塞和居民不满；Vite 默认构建完成 Pixi/React/icons 分包，主 chunk 降至约 71.5kB。
- 启动第五轮并行生产：CITY-NOTICE-UI-01、PREFAB-ASSET-MAP-01、LOGISTICS-CANCEL-REASON-01、GOLD-SAMPLE-MANIFEST-01，分别推进城市反馈 UI、建筑类型到金标 prefab 映射、订单失败原因和首个金标样例 manifest。
- 完成第五轮并行生产：城市反馈接入轻量小事流；prefab 增加 building.type 到金标 assetId 映射并安全降级；物流订单新增失败/取消原因字段；新增 `main-pier` 金标样例 building/animation manifest 并通过资产校验器。
- 第五轮验证通过：样例 manifest 校验、资产校验器自检、全量 130 项测试和生产构建均通过。
- 启动第六轮并行生产：GOLD-SAMPLE-RUNTIME-01、GOLD-PLACEHOLDER-VISUAL-01、CITY-NOTICE-FOCUS-01、MAP-FEEDBACK-01，分别推进样例 manifest 进入 runtime 测试链路、金标占位可视化、小事定位和地图内故障提示。
- 完成第六轮并行生产：`main-pier` 样例 manifest 进入 runtime parser/registry 测试链路；注册 prefab 在地图上显示 assetId、等级和状态占位；小事流/瓶颈可选中相关建筑或提示坐标；地图内增加缺工、缺料、物流失败和仓满的程序化轻提示。
- 启动第七轮并行生产：CAMERA-FOCUS-01、GOLD-PIER-VISUAL-SLICE-01、CITY-NOTICE-STORY-01、GOLD-ASSET-CI-01，分别推进小事/瓶颈相机聚焦、旧码头 L0/L4/L8 程序化视觉切片、城市反馈转轻量岛上小事、main-pier 样例校验 npm 入口。
- 完成第七轮并行生产：小事与瓶颈可触发平滑地图聚焦；`main-pier` 根据金标样例 manifest 呈现 L0 破损、L4 货棚双泊位、L8 多泊位吊装差异；城市反馈改为可忽略、无奖励、无阻塞的岛上小事；新增 `asset:validate:main-pier` 固定校验入口。
- 启动第八轮并行生产：GOLD-BUILDING-VISUAL-DIVERSITY-01、MATERIAL-PICKUP-FEEL-01、SIM-CITY-OPERATIONS-01、GOLD-MANIFEST-BATCH-01，分别推进多类建筑差异化视觉、材料扫取手感、城市服务失败后果、金标 manifest 批量样例。
- 完成第八轮并行生产：`main-homes`、`main-eatery`、`main-granary` 拥有 L0/L4/L8 程序化差异切片；材料节点新增地图 overlay 与按住扫取；服务/市场不足会确定性降低居民需求和满意度；新增 `main-homes`、`main-eatery` manifest 样例与 `asset:validate:gold-samples` 批量校验入口。
- 明确项目最终目标升级为商业级城市/文明模拟游戏，新增 `commercial-civilization-target.md` 作为长期硬标准：完整文明系统、真实可观察后果、动态引擎、28 类建筑 0–8 级高精资产与音乐轻奖励关系。
- 启动第九轮并行生产：CIV-MATRIX-01、BUILD-UPGRADE-SYSTEM-01、FULL-LEVEL-ASSET-GATE-01、LONG-RUN-CIV-QA-01，分别推进文明系统矩阵、正式建筑升级底层、L0–L8 资产严格门禁和长时间文明模拟 QA。
- 完成第九轮并行生产：新增文明系统矩阵和商业级缺口清单；建筑升级底层支持 0–8 级成本、失败条件和容量/岗位效果；资产校验器新增 `--require-all-levels` 严格模式，明确当前样例缺 L2/L3/L5/L6/L7；长稳 QA 新增 2400 tick 灰盒文明稳定性测试并记录 7200 tick/30 日商业级长测尚未达成。
- 启动第十轮并行生产：MARKET-CONSUMPTION-01、CITY-UPGRADE-SUPPLY-01、LONG-RUN-PERF-01、FULL-LEVEL-GOLD-SAMPLE-01，分别推进市场真实消费、城市级升级材料调拨、长稳性能优化和首个 L0–L8 完整金标样例。
- 完成第十轮并行生产：市场消费会扣库存、产生购买事件并增加税收；建筑升级优先从城市仓储确定性扣料；长稳性能热点定位到物流订单全表扫描并通过 active order 索引优化；`main-homes` 补齐 L0–L8 并可通过单样例 strict gate。
- 启动第十一轮并行生产：HOUSEHOLD-CASH-GOODS-01、UPGRADE-CONSTRUCTION-QUEUE-01、UPGRADE-UI-ENTRY-01、FULL-LEVEL-EATERY-SAMPLE-01，分别推进家庭收入约束与日用品消费、升级施工进度、建筑详情升级入口和第二个 L0–L8 完整样例。
- 完成第十一轮并行生产：市场支持 food 与 cloth-as-goods 消费并检查家庭收入；升级从瞬时换级推进为 `upgrading` 状态和 tick 进度；建筑详情新增升级成本/缺口/触发入口；`main-eatery` 补齐 L0–L8 并可通过 strict gate，剩余未补齐样例为 `main-pier`。
