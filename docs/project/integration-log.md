# 集成记录

## 2026-08-10 第二百一十八轮：Runtime 快照克隆减压

- 启动并完成 `RUNTIME-SNAPSHOT-MATERIALIZE-01`：`SimulationEngine` 保留公共 `snapshot` 深拷贝，同时新增运行时内部可变快照读取口，供 `GameRuntime.advance` 避免每 tick 深复制整棵城市状态。
- `GameRuntime.advance` 现在在内部快照上完成时间线、街区繁荣、建筑升级和掉落物同步，再发布轻量材料化快照给界面，保持订阅刷新所需的顶层对象更新。
- `SimulationEngine` 新增契约测试，确认公共快照仍隔离外部写入，runtime-local 通道只用于运行时内部协作。
- 目标规模单样本显示：`runtimeSnapshotCloneP95Ms=0ms`、`runtimeCacheEmitP95Ms=0.3ms`，snapshot clone 长尾已从当前瓶颈列表移除。
- 客观限制：游戏页 rAF P95 仍为 183.3ms，商业性能门禁继续 RED；下一步转向建筑同步长尾、Pixi/browser ticker 调度和 WebGL GPU stall。

## 2026-08-10 第二百一十七轮：建筑 motion 更新节流

- 启动并完成 `BUILDING-MOTION-THROTTLE-01`：full detail 建筑的动画图集帧更新与 procedural motion layer 改为每 2 个模拟 tick 刷新一次，状态变化仍立即刷新。
- `DynamicScene` 新增节流契约测试，通过 motion layer 诊断 label 验证相邻 tick 不重绘、隔 tick 刷新。
- 目标规模单样本显示：dirty sync 跳过率 0.714，但 render sync P95 仍为 30ms、renderer P95 39.2ms、rAF P95 383.3ms。
- 客观限制：本轮没有解决商业帧率红灯；WebGL GPU stall warning 与 renderer 长尾仍是下一轮优先项。

## 2026-08-10 第二百一十六轮：Pixi dirty scene sync

- 启动并完成 `SCENE-DIRTY-SYNC-01`：`SimulationCanvas` 只有在 runtime 快照或相机变脏时调用 `DynamicScene.sync`，干净 ticker 帧跳过同步。
- ticker profile 新增 `sceneSyncSkipped`，浏览器 runner 与渲染/性能基线报告会输出跳过比例。
- 目标规模默认 `full` 单样本中 dirty sync 跳过率为 0.7，render sync P95 14.3ms、renderer P95 21.5ms、rAF P95 233.3ms。
- 客观限制：性能门禁仍 RED，且 `no-react-commit` 同轮出现极端 renderer/rAF 长尾；下一步继续排查 WebGL GPU stall 与 renderer 长尾，不能把 dirty sync 视为最终解决。

## 2026-08-10 第二百一十五轮：UI 快照节流与画布解耦

- 启动并完成 `UI-SNAPSHOT-THROTTLE-01`：App UI 订阅通过 `createThrottledSubscription` 合并高频 runtime emit，避免每个模拟 tick 都触发整页 React 快照刷新。
- `SimulationCanvas` 直接订阅 runtime 最新快照写入内部 ref，使画布仍可在 ticker 中读取最新模拟状态，不再完全依赖 React prop 刷新。
- 目标规模单样本显示：默认 `full` 的 React commit interval 已被拉长，但 rAF P95 仍为 549.9ms；`no-react-commit` 仍明显降低 scene/renderer 工作但 rAF 保持红灯。
- 客观限制：本轮是生产架构解耦，不是帧率修复完成；下一步应进入 Pixi 同步频率、WebGL stall 与浏览器帧调度专项。

## 2026-08-10 第二百一十四轮：React commit 抑制对照

- 启动并完成 `REACT-COMMIT-ABLATION-01`：新增 `suppressReactCommit=1` QA 参数，让模拟推进继续运行但不把每个 `advance` tick 推给 React 订阅者。
- `run-render-ablation` 新增 `no-react-commit` 模式，浏览器报告和性能基线会标记 `advanceEmitSuppressed`，避免诊断样本与正常样本混淆。
- 目标规模对照显示：`no-react-commit` 将 render sync P95 从 21.5ms 降到 0ms、renderer P95 从 40.4ms 降到 0.4ms，游戏页 rAF P95 从 333.4ms 改善到 266.7ms。
- 客观限制：该模式会让 React UI 停止逐 tick 刷新，不是生产方案；且 rAF 仍明显红灯，说明还必须继续排查 Pixi/browser 调度和 WebGL GPU stall。

## 2026-08-10 第二百一十三轮：Runtime advance 阶段 Profile

- 启动并完成 `RUNTIME-ADVANCE-PHASE-PROFILE-01`：`GameRuntime.advance` 暴露分阶段性能画像，浏览器报告输出 `runtimeAdvance`。
- App profile 将 runtime 阶段与总 `advance` 耗时、React commit interval 一起采集，render ablation 与 performance baseline 保留关键阶段 P95/Max。
- 目标规模单样本显示：engine advance P95 8.5ms、snapshot clone P95 4.2ms、cache/emit P95 0.4ms，而游戏页 rAF P95 仍为 233.2ms。
- 客观限制：这是单次本机样本，不能作为最终性能结论；但它已经证明当前红灯不能优先归咎于 `GameRuntime.advance` 胶水层，下一步应聚焦 Pixi/browser 调度与 GPU stall。

## 2026-08-10 第二百一十二轮：应用层推进 Profile

- 启动并完成 `APP-RUNTIME-PROFILE-01`：App 在 renderProfile 模式下记录 `runtime.advance` 耗时和 React commit 间隔，浏览器 runner 输出 `appProfile`。
- render ablation 与 performance baseline 聚合新增应用层指标，性能报告不再只能看到 Pixi/renderer 层。
- 目标规模单样本显示应用层推进出现 63.2ms P95，React commit 间隔也被拉长；该证据提示下一步要拆开 `GameRuntime.advance` 内部阶段。
- 客观限制：本轮样本 rAF 波动极大，不能把单次 866ms 当稳定基线；它的价值在于把应用层推进纳入可观测范围。

## 2026-08-10 第二百一十一轮：空白页 rAF 基线

- 启动并完成 `BROWSER-RAF-BASELINE-01`：浏览器 runner 在进入游戏 URL 前先采集 about:blank 的 rAF 基线，并随场景结果输出 `browserFrameBaseline`。
- render ablation 与 performance baseline 聚合已保留该字段，可用于判断红灯是否来自 Playwright/headless 全局节流。
- 本轮目标规模样本中，空白页 rAF P95 为 16.7ms，游戏页 rAF P95 为 183.3ms；同一浏览器实例证明基础 rAF 调度正常，红灯在游戏页加载后出现。
- 客观限制：本轮只排除了“runner 全局 rAF 节流”这一类原因，尚未定位 Pixi/WebGL、GPU stall 或 React/应用外围更新的具体来源。

## 2026-08-10 第二百一十轮：Ticker minFPS 对照

- 启动并完成 `RENDER-TICKER-MINFPS-ABLATION-01`：新增 `tickerMinFps` 渲染诊断参数，并在目标规模差分中加入 `no-ticker-min-fps` 模式。
- 浏览器报告现在回传实际 `tickerMinFps` / `tickerMaxFps`，避免只从 `deltaMS` 反推 Pixi ticker 设置。
- 对照证明：默认 `minFPS=10` 会把 `deltaMS` 截断到 100ms；`tickerMinFps=0` 后 `deltaMS` 与 `elapsedMS` 同步到 316.6ms。
- 客观限制：关闭 minFPS cap 没有改善 rAF，说明该 cap 是观测口径因素，不是目标规模帧率红灯的根因。

## 2026-08-10 第二百零九轮：三环境目标规模 Ticker 矩阵

- 启动并完成 `PERF-TICKER-MATRIX-01`：性能基线聚合纳入 ticker 指标，三环境报告不再只看帧时间、render sync、renderer 和 readPixels。
- `aggregatePerformanceSamples` 会保留 ticker callback、sceneSync、delta 和 elapsed 的中位数样本，readPixels 仍取最差值。
- 目标规模三环境矩阵显示：桌面 GPU 与软件渲染的 rAF 和 ticker elapsed 几乎同级，嵌入容器代理略好但仍红灯；三个环境的 renderer P95 均约 17-19ms。
- 客观限制：本轮是单次本机/代理矩阵，不等于真实用户设备认证；结论是优先排查 ticker/浏览器调度与 GPU stall，而不是宣布性能问题已解决。

## 2026-08-10 第二百零八轮：Ticker 阶段计时诊断

- 启动并完成 `RENDER-TICKER-PROFILE-01`：renderProfile 模式下新增 Pixi ticker 阶段计时，记录 callback、camera、scene sync、`deltaMS` 和 `elapsedMS`。
- 浏览器 runner 同步重置并汇总 ticker 样本，`run-render-ablation` 输出 ticker callback/sceneSync/delta/elapsed 的 P95 与最大值。
- 目标规模稳态样本显示：`full` 的 scene sync/ticker callback P95 为 10.9ms，renderer P95 为 17.4ms，但 ticker elapsed P95/最大为 200ms；关闭 LOD 时 scene sync P95 为 11.6ms、renderer P95 为 23.6ms、ticker elapsed P95/最大为 183.3ms。
- 客观限制：本轮证明主场景同步不是 160ms+ rAF 的主要来源，但尚未定位浏览器调度、GPU stall、Pixi ticker 设置或测试环境的具体成因；性能门禁继续 RED。

## 2026-08-10 第二百零七轮：稳态渲染采样窗口

- 启动并完成 `RENDER-STEADY-PROFILE-WINDOW-01`：浏览器 runner 在页面和场景断言稳定后重置 render/renderer profile 数组，再采集帧时间、render sync 和 renderer 数据。
- `run-render-ablation` 输出 `profileWindow`，明确当前差分样本来自 `steady-state-after-assertions`，避免把启动期纹理上传、首次 atlas 解码和运行期渲染混为一个指标。
- 目标规模稳态对照显示：`full` renderer P95 19.2ms，`no-building-lod` renderer P95 22.5ms；二者 render sync P95 均约 13ms，说明初始化长尾被剥离后 renderer 本体不像上一轮样本那样出现 300ms 级最大值。
- 客观限制：rAF 仍在 160-260ms 级别，且 WebGL GPU stall warning 仍存在；本轮完成的是“更可信的采样边界”，不是商业帧率通过。

## 2026-08-10 第二百零六轮：LOD 对照矩阵与 reduced 更新收敛

- 启动并完成 `RENDER-BUILDING-LOD-ABLATION-01`：`qa:render-ablation` 新增 `no-building-lod` 模式，可直接复跑 `full` 与关闭建筑 LOD 的目标规模对照。
- 浏览器 E2E runner 支持 `conditionalRenderEntityMinimums`：默认配置仍要求 `reducedBuildings >= 1`，但 `buildingLod=false` 对照不会因为 reduced 为 0 而失败。
- `BuildingVisual` reduced 更新路径不再每帧清空两个 artwork motion graphics；清理动作只发生在 full/reduced 状态切换时，减少远景 LOD 自身的重复图形提交。
- 真实浏览器目标规模对照均通过功能门禁与 `readPixels=0`：`full` 观察到 96 detailed / 204 reduced；`no-building-lod` 观察到 300 detailed / 0 reduced。
- 客观限制：单次样本里 rAF 对 full 略有利，但 renderer 平均/P95/最大仍高且波动大；本轮结论是“对照矩阵可复跑且 LOD 开销收敛”，不是商业性能通过。

## 2026-08-10 第二百零五轮：目标规模建筑细节 LOD

- 启动并完成 `RENDER-BUILDING-LOD-01`：目标规模场景中，当同屏可见建筑超过 120 栋时，仅距离相机最近的 96 栋保留完整建筑细节，其余远景建筑降为 reduced detail。
- reduced detail 建筑仍保留静态主体、建筑原画和状态可见性，但关闭建筑原画动态层、施工/水面/农业等高频动效驱动，减少 300 栋同屏时的重复视觉更新。
- 渲染诊断新增 `buildingLod`，生产默认开启，`?disableBuildingLod=1` 可关闭；浏览器 render profile 新增 `detailedBuildings` / `reducedBuildings` 统计，QA 契约要求目标规模场景同时观察到 full/reduced 两类建筑。
- 真实浏览器目标规模样本：300 buildings、135 residents、15 transport、visible 331-349、detailedBuildings 96、reducedBuildings 204，应用层 `readPixels=0`，无 console error。
- 客观限制：本轮 rAF 平均/P95/最大仍为 135.41/183.4/183.4ms，renderer 最大 293.5ms，商业性能门禁继续 RED；下一步必须继续处理纹理上传节流、renderer 长尾和 GPU 合成。

## 2026-07-14：真实游戏持续预览站

- 完成 `PREVIEW-CONTINUOUS-DEPLOY-01`：建立 `https://little-ear-island-game-preview.netlify.app`，直接发布本仓库 `npm run build` 生成的 Vite/Pixi 游戏产物。
- Netlify 已连接 GitHub 仓库和当前开发分支；后续代码推送会自动构建并更新预览，不再依赖手工上传，也不再将“小耳岛网站”解释为独立宣传页。
- 首次生产发布包含 324 个游戏资源文件；入口 HTML、React、Pixi、图标、主逻辑和样式资源均通过公网 HTTP 200 校验。
- 客观限制：预览站反映已提交并推送的构建，不会同步本地尚未提交的编辑；“实时”指每次推送后自动更新，不是逐字符热更新。

## 2026-07-13 第一百一十四轮：卸货能力可视化解释

- 启动并完成 `LOGISTICS-UNLOAD-CAPACITY-EXPLAIN-01`：把第一百一十轮的目的建筑卸货能力分层，从模拟结果推进为玩家可读解释。
- `logisticsQueues` 现在携带 `unloadCapacityBreakdown`，记录能力来源、建筑类别、基础值、等级加成、工人加成、入口道路加成、邻路数量、工人数、上限和最终值。
- 治理卡在诊断 `destination-throughput` / 卸货排队时，会说明最拥堵建筑每刻卸货、排队数量、最长等待，以及能力来自基础、等级、工人和入口道路的哪几部分。
- 建筑详情里的物流执行计划面板新增“卸货口”说明，玩家定位到来源/目的建筑时可看到当前卸货能力来源，不再只看到队列数量。
- `logistics-storage-build` 浏览器场景从手写固定 1 单能力校准为真实建筑能力口径；调试场景订单量扩大到足够支撑浏览器点击窗口，避免瓶颈在 QA 交互前被自动消化。
- 客观限制：本轮完成文本解释和数据结构，不等于物流图层已经把能力来源直接贴在地图热点旁；下一步可把短标签接入 overlay。

## 2026-07-13 第一百一十三轮：物流仓储建造浏览器场景

- 启动 `BROWSER-E2E-LOGISTICS-STORAGE-BUILD-01`：把物流仓储建造从运行时/UI 单测推进为真实浏览器点击回归。
- 新增 `logistics-storage-build` 调试场景，稳定制造多车到达市场但卸货口吞吐不足的 `split-unload` 状态；场景内补足正式营造所需银两、木料和石料，避免 QA 只测空文案。
- 浏览器 E2E 契约新增“物流扩仓建造浏览器场景”：必须看到“物流热点拥堵 / 分流卸货压力 / 执行计划：分流卸货口”，真实点击“分流卸货压力”后验证“粮仓已作为物流缓冲落成”toast。
- 过程发现：旧 `logistics-hotspot` 场景在页面运行数 tick 后可能被诊断为“缺承运人”，不适合证明建仓成功；因此本轮没有强行复用旧场景，而是新增专门覆盖卸货排队建仓链路的稳定场景。
- 客观限制：本轮证明真实浏览器点击能触发建仓动作，但建成后的队列改善、承运释放、订单重置细节仍主要靠运行时测试和 toast，下一步应把这些结果可视化到建筑详情或物流图层。

## 2026-07-13 第一百一十二轮：分类型升级曲线

- 启动 `UPGRADE-CATEGORY-CURVES-01`：把升级成本从统一等级倍率推进为 `defaultCurve` / `categoryCurves` / `typeCurves` 三层经济曲线。
- `DEFAULT_CONSTRUCTION_ECONOMY_TABLE` 现在可按住宅、仓储、生产、市场、服务、港口和地标等建筑类别配置不同材料投入和里程碑材料；未传建筑定义时仍走旧默认曲线，兼容既有测试和兜底逻辑。
- `buildingUpgradeCost`、`upgradeBuildingFromCityStorage` 和 `startBuildingUpgradeFromCityStorage` 已把建筑定义传入经济表，因此运行时升级报价、缺料提示和城市仓储扣料会按建筑类型/类别曲线执行。
- `validateConstructionEconomyTable` 扩展到升级曲线结构，会检查默认、类别、类型曲线中的负数、非法数值和无效里程碑等级。
- 客观限制：本轮完成的是“结构与运行时接入”，不是最终商业平衡；成本仍需和容量、产能、维护费、服务价值、阶段节奏和回本周期做下一轮审计。

## 2026-07-13 第一百一十一轮：来源库存治理浏览器场景

- 启动 `BROWSER-E2E-LOGISTICS-SOURCE-STOCK-01`：把来源库存治理从单元/运行时覆盖补成真实浏览器回归场景。
- 新增 `logistics-source-shortage` 调试场景和 URL 入口，稳定制造来源粮仓库存不足、关联订单等待、备用库存可调拨的物流治理状态。
- 浏览器 E2E 契约新增点击后可见文本断言；真实 runner 在点击“检查来源库存”后不仅检查 toast，还会确认建筑详情中的“物流执行计划：来源库存”面板可见。
- 本轮合并远端已有的统一 `logistics-plan-card` 面板实现，没有保留重复的来源检查卡片，避免 UI 架构分叉。
- 客观限制：本轮是 QA 和回归场景加固，不新增新的物流调度算法；仓储建造成功点击场景仍在下一轮默认任务中。

## 2026-07-12 第一百一十轮：卸货能力分层

- 启动 `LOGISTICS-UNLOAD-CAPACITY-TIER-01`：把正常物流卸货能力从单一全局值推进为目的建筑动态能力。
- `LogisticsSystem` 在未传入 `unloadCapacityPerTick` 时，会按建筑类型、建筑等级、在岗工人数量和入口邻路数量计算每 tick 卸货能力；仓储和码头天然高于普通生产/市场/服务建筑。
- `unloadCapacityPerTick` 保留为 QA/压力场景显式覆盖参数，因此既能让主游戏使用分层规则，也能继续构造稳定的低吞吐排队探针。
- `logisticsQueues` 记录的 `unloadCapacityPerTick` 现在反映具体目的建筑本 tick 的实际能力，不再只能代表系统级固定参数。
- 客观限制：本轮先完成模拟规则和测试覆盖，还没有在 UI 中解释“为什么这个建筑每 tick 能卸几单”；后续应把能力来源展示到物流图层或建筑详情。

## 2026-07-12 第一百零九轮：物流仓储执行计划真实建造动作

- 启动 `LOGISTICS-STORAGE-BUILD-ACTION-01`：把物流扩仓、分流卸货和缓冲仓计划从“候选落点”推进为真实运行时动作。
- `GameRuntime.buildStorageForLogisticsPlan` 会复用正式营造校验和营造成本，按计划候选点建成粮仓，扣除财政和城市仓储材料。
- 建仓成功后会把关联物流订单重置为等待派车，释放正在执行这些订单的承运人，并清空对应卸货队列，避免“建了仓但堵单仍卡死”。
- `App` 的治理卡点击链路已接入该动作：`expand-storage`、`split-unload` 和 `add-buffer-storage` 在存在候选落点时会直接执行建仓并刷新物流图层。
- 客观限制：本轮先完成运行时和 UI 点击入口，没有新增浏览器 E2E 场景；下一轮或后续应补真实点击建仓场景，并继续把卸货能力从全局参数推进到建筑等级/工人/入口等可解释变量。

## 2026-07-12 第一百零八轮：活动密度与状态反馈增强

- 启动 `VISUAL-ACTIVITY-FEEDBACK-01`：完成视觉三连轮的第三步，让真实 agent 活动在地图上更容易被看见。
- `AgentVisual` 从单一 body 图形扩展为稳定的 `trail/body/marker` 三层：通勤、返家、服务访问、取货、送货和工作状态都有对应活动尾迹和标记。
- 运输表现区分船只和陆路车，货运取货/送货使用不同货物标记；居民服务访问使用服务标记，通勤使用脚步点。
- 浏览器截图验收：本机 Chrome 打开 `http://127.0.0.1:5174/`，canvas 为 1440×900，截图保存在 `/tmp/eerd-visual-slice-108-activity.png`。
- 客观限制：本轮增强的是 agent 表现层，不增加模拟实体数量；下一轮应转回物流扩仓/分流卸货真实动作，避免继续停留在纯视觉表层。

## 2026-07-12 第一百零七轮：道路与街区质感增强

- 启动 `VISUAL-STREET-DISTRICT-01`：把 starter 垂直切片从建筑轮廓继续推进到道路、水岸和田地质感。
- `roadVisualStyle` 新增 `shadow`、`seam` 和 `pattern` 元数据，区分土路车辙、石路板缝和桥面木板，而不是只靠填充色区分道路。
- `SimulationCanvas` 的地形绘制新增水波、岸线和田地纹理；道路绘制新增路面阴影、铺装缝、车辙和桥面木板/桥墩表现。
- 浏览器截图验收：本机 Chrome 打开 `http://127.0.0.1:5174/`，canvas 为 1440×900，截图保存在 `/tmp/eerd-visual-slice-107-streets.png`。
- 客观限制：本轮仍是程序化地图质感，不是最终手绘地表/道路资产；下一轮应继续做活动密度与状态反馈。

## 2026-07-12 第一百零六轮：Starter 建筑第一眼改观

- 启动 `VISUAL-SLICE-STARTER-01`：把第一百零四轮的金标占位接入继续推进为更强的 starter 建筑轮廓，而不是只显示小型通用矩形。
- `BuildingVisual` 的 prefab shell 新增类型化轮廓：民居显示院落和连续屋顶，集市显示店面屋顶和桌位，粮仓显示仓体/粮囤，码头显示水边平台，稻田显示田块和田埂线。
- `createDefaultPrefabRegistry` 新增 `windfield-rice` 临时 descriptor，让 `riceField` 映射到的稻田占位也进入主画布，不再因 registry 缺失回退为灰盒。
- 浏览器截图验收：本机 Chrome 打开 `http://127.0.0.1:5174/`，canvas 为 1440×900，截图保存在 `/tmp/eerd-visual-slice-105-starter.png`。Playwright 自带 Chromium 未安装，因此使用系统 Google Chrome 执行截图。
- 客观限制：本轮仍是程序化占位视觉，不是最终手绘/建模资产；道路铺装、街区边界、水岸和活动密度仍需下一轮继续增强。

## 2026-07-12 第一百零五轮：目标与执行节奏校准

- 启动 `PM-EXECUTION-STRATEGY-01`：审视过往改动后，确认最终商业级游戏总目标不变，但当前执行阶段不应继续停留在 P0 文档重构节奏。
- 新增 `docs/project/execution-strategy.md`，明确当前阶段为 P1.5 商业级垂直切片收敛期，并把近期默认优先级调整为可见垂直切片、可操作闭环、核心模拟自洽、QA 分层提效和文档减重。
- 同步 `README.md`、`HANDOFF.md`、`commercial-launch-master-plan.md` 和 `progress-dashboard.md`，确保其他电脑或新 Codex 对话读取仓库后得到同一目标口径。
- 新增三项后续视觉冲刺任务：`VISUAL-SLICE-STARTER-01`、`VISUAL-STREET-DISTRICT-01`、`VISUAL-ACTIVITY-FEEDBACK-01`。
- 客观限制：本轮是项目目标和节奏校准，不改变运行时代码和主画布效果；下一轮应直接进入 starter 建筑第一眼改观。

## 2026-07-03

- 启动并完成第八十九轮：`CONSTRUCTION-ECONOMY-TABLE-01`。营造成本从 `construction.ts` 私有硬编码推进为可导出、可校验、可替换的经济表。
- `DEFAULT_CONSTRUCTION_ECONOMY_TABLE` 保留当前首版数值：民居 80、粮仓 140、稻田 60、市场 180、木作坊 220；泥路 2、石板路 6、桥路 18。
- `quoteBuildingConstruction`、`spendBuildingConstructionCost`、`quoteRoadConstruction` 支持传入自定义 `ConstructionEconomyTable`，供后续 QA、关卡和平衡工具替换数值。
- 新增 `validateConstructionEconomyTable` 和 `src/simulation/economy/constructionTable.test.ts`，覆盖默认表合法性、自定义表报价和非法表诊断。
- 新增 `docs/project/economy-balancing.md`，明确当前只是“可调结构”，不是最终商业经济；后续仍需接入升级成本、服务容量、排队、仓储吞吐和道路维护。

- 启动并完成第八十八轮：`LONG-RUN-CIV-QA-02`。商业级 30 日长跑不再只是待办，新增可运行的 7200 tick 分层 QA 命令。
- 新增 `src/qa/civilizationLongRun.ts`：复用 500 户、300 建筑、150 初始可见实体压力城市，按 2400/4800/7200 tick 采样人口、满意度、物流、停工、订单、库存、归档和主快照表规模。
- 新增 `src/qa/civilizationLongRunCheck.ts` 与 `npm run qa:civilization-long-run`：命令会输出 JSON 报告并在任一层超过阈值时失败。
- 验证：`npm run qa:civilization-long-run` 通过；最终 tick 7200、人口 1750、满意度约 40.39、物流效率 100、主订单表 539、归档订单 53462、agent 表 206、非法数值 0。
- 限制：本轮仍是灰盒压力城市，不等于真实商业关卡的服务容量、排队、道路容量和经济平衡压力。

- 启动并完成第八十七轮：`BROWSER-E2E-LOGISTICS-HOTSPOT-01`。物流热点从可见文案检查升级为真实浏览器点击交互。
- `browserE2eScenarios` 为 `logistics-hotspot` 增加 interaction：点击“打开物流图层并补仓储”，等待“物流热点拥堵：打开物流图层并补仓储。”toast。
- `browserE2eScenarios.test.ts` 增加契约断言，确保物流热点场景的 interaction 元数据也会输出给真实浏览器 runner。
- 验证：`BROWSER_E2E_SCENARIO=logistics-hotspot npm run qa:browser-e2e` 通过；完整 `npm run qa:browser-e2e` 5/5 通过，五个固定治理浏览器场景均执行真实点击。
- 限制：本轮仍只证明推荐动作触发，不等于完整仓储容量、货车排队和道路容量模型。

- 启动并完成第八十六轮：`BROWSER-E2E-BRIDGE-GAP-01`。桥梁缺口从可见文案检查升级为真实浏览器点击交互。
- `browserE2eScenarios` 为 `bridge-gap` 增加 interaction：点击“打开道路图层并接回主路网”，等待“道路未连通：补线施工完成：桥梁 2 格，花费银两36。”toast。
- `browserE2eScenarios.test.ts` 增加契约断言，确保桥梁缺口场景的 interaction 元数据也会输出给真实浏览器 runner。
- 验证：`BROWSER_E2E_SCENARIO=bridge-gap npm run qa:browser-e2e` 通过；完整 `npm run qa:browser-e2e` 5/5 通过，road-plan-success、road-plan-low-treasury、bridge-gap 与 service-governance 均执行真实点击。
- 限制：物流热点仍主要是可见文案/console 检查，还没有真实点击/定位动作断言。

- 启动并完成第八十五轮：`BROWSER-E2E-SERVICE-GOVERNANCE-01`。服务治理从可见文案检查升级为真实浏览器点击交互。
- `browserE2eScenarios` 为 `service-governance` 增加 interaction：点击“打开服务图层并营造市场”，等待“服务覆盖缺口：打开服务图层并营造市场。”toast。
- `browserE2eScenarios.test.ts` 增加契约断言，确保服务治理场景的 interaction 元数据也会输出给真实浏览器 runner。
- 验证：`BROWSER_E2E_SCENARIO=service-governance npm run qa:browser-e2e` 通过；完整 `npm run qa:browser-e2e` 5/5 通过，road-plan-success、road-plan-low-treasury 与 service-governance 均执行真实点击。
- 限制：桥梁缺口和物流热点仍主要是可见文案/console 检查，还没有真实点击/定位动作断言。

## 2026-07-01

- 启动并完成第八十四轮：`BROWSER-E2E-LOW-TREASURY-01`。低财政补线失败路径从可见文案检查升级为真实浏览器点击交互。
- `browserE2eScenarios` 为 `road-plan-low-treasury` 增加 interaction：点击“打开道路图层并接回主路网”，等待“银两不足2，无法执行补线施工”toast。
- `browserE2eScenarios.test.ts` 增加契约断言，确保低财政场景的 interaction 元数据也会输出给真实浏览器 runner。
- 验证：`BROWSER_E2E_SCENARIO=road-plan-low-treasury npm run qa:browser-e2e` 通过；完整 `npm run qa:browser-e2e` 5/5 通过，road-plan-success 与 road-plan-low-treasury 均执行真实点击。
- 限制：服务治理、桥梁缺口和物流热点仍主要是可见文案/console 检查，还没有真实点击/定位动作断言。

- 启动并完成第八十三轮：`BROWSER-E2E-RUNNER-01`。浏览器 E2E 从契约清单推进为真实 Chromium 执行器。
- 新增 `tools/browser-e2e/run-browser-e2e.cjs`：脚本会读取 `browserE2eRunner` 输出的场景契约，启动 Vite preview，使用 Playwright Chromium 逐个打开场景 URL，检查必须可见文案，收集 console/pageerror，并按场景声明执行点击动作。
- `package.json` 新增 `npm run qa:browser-e2e`，该命令会先构建生产包，再运行真实浏览器 E2E；`BROWSER_E2E_SCENARIO=<id>` 可只跑单个场景。
- `browserE2eScenarios` 为 `road-plan-success` 增加真实 interaction：点击“打开道路图层并接回主路网”，等待“补线施工完成”toast。
- 修正物流浏览器契约：UI 实际显示的是“当前有 3 条未完成订单”，不是数据层目标标签“物流热点x3”。
- 验证：`npm run qa:browser-e2e` 已真实打开 5 个场景，5/5 通过；road-plan-success 完成真实点击，只有 WebGL performance warning，没有 console error。
- 限制：当前只有 road-plan-success 有点击动作；低财政失败、服务治理、桥梁缺口和物流热点仍主要是可见文案/console 检查。

- 启动并完成第八十二轮：`BROWSER-E2E-CONTRACT-01`。浏览器 E2E 从分散文档描述推进为项目内可验证场景契约。
- 新增 `src/qa/browserE2eScenarios.ts`：集中声明 `road-plan-success`、`road-plan-low-treasury`、`bridge-gap`、`logistics-hotspot`、`service-governance` 五个浏览器场景的 URL、必须可见文案和禁止 console 级别。
- 新增 `src/qa/browserE2eScenarios.test.ts`：固定场景顺序、URL、文案断言和 console error 门禁，防止后续调试入口或卡片文案变更时 E2E 契约悄悄失效。
- 新增 `src/qa/browserE2eRunner.ts` 与 `npm run qa:browser-e2e:contract`：命令会输出可审计 JSON，列出当前浏览器场景契约。
- 限制：本轮不是实际浏览器驱动执行器；它不打开页面、不点击治理卡、不捕获真实 console。下一轮必须接入真实浏览器驱动器，否则仍不能替代人工浏览器 QA。

- 启动并完成第八十一轮：`LOGISTICS-HOTSPOT-QA-01`。物流热点治理进入可重复 QA 场景库。
- `RuntimeDebugScenario` 新增 `logistics-hotspot`：启动预热后重新注入 3 条未完成入货订单，稳定制造同一市场入货端拥堵。
- `runtimeOptionsFromSearch` 支持 `?debugScenario=logistics-hotspot`，后续浏览器 E2E 可直接打开该固定物流热点场景。
- 新增 `src/qa/logisticsHotspotScenarios.ts` 与 `src/qa/logisticsHotspotScenarios.test.ts`：校验未完成订单数、热点数、治理卡目标、推荐建筑和订单摘要。
- `stageAdvisor` 修正物流热点排序：当源仓和收货点压力相同，优先定位入货端，避免“市场入货拥堵”被偶然指向源仓。
- 新增 `npm run qa:logistics-hotspots`，固定验证“多订单压向市场 → 物流热点治理卡 → 推荐补仓储”的链路。
- 限制：本轮仍是运行时/治理 QA 命令，不是浏览器脚本化 E2E；仓储容量、货车排队、道路容量和多仓分流仍需后续实装。

- 启动并完成第八十轮：`BRIDGE-GAP-QA-01`。桥梁缺口治理进入可重复 QA 场景库。
- `RuntimeDebugScenario` 新增 `bridge-gap`：在默认水岸制造一个隔水孤立桥路端点，使道路治理稳定产出 2 格桥梁 roadPlan。
- `runtimeOptionsFromSearch` 支持 `?debugScenario=bridge-gap`，后续浏览器 E2E 可直接打开该固定桥梁缺口场景。
- 新增 `src/qa/bridgeGapScenarios.ts` 与 `src/qa/bridgeGapScenarios.test.ts`：校验水面断点前置道路指标、桥梁格数、成本、执行结果和后置孤立路网下降。
- 新增 `npm run qa:bridge-gaps`，固定验证“水面断点 → 推荐补桥 → 一键施工 → 孤立路网下降”的链路。
- 限制：本轮是运行时/治理 QA 命令，不是浏览器脚本化 E2E；桥头吸附、桥梁施工动画和正式桥梁资产仍未完成。

- 启动并完成第七十九轮：`SERVICE-GOVERNANCE-QA-01`。服务缺口治理进入可重复 QA 场景库。
- 新增 `src/qa/serviceGovernanceScenarios.ts`：从默认城市读取服务缺口治理卡，校验推荐建筑、营造成本、执行结果和服务缺口变化。
- 新增 `npm run qa:service-governance`，固定验证“服务缺口 → 推荐营造市场 → 市场建成 → 服务缺口下降”的链路。
- 修复治理推荐质量问题：原先市场推荐只找“可建地块”，不保证建完减少服务缺口；现在服务缺口治理会优先选择建成后能减少缺口的市场落点，找不到有效落点才退回通用可营造诊断。
- 限制：本轮覆盖服务缺口治理，但还没有物流拥堵、桥梁缺口和浏览器驱动脚本化。

- 启动并完成第七十八轮：`ROAD-LINK-QA-COMMAND-01`。道路补线成功/失败场景从临时浏览器验证推进为项目内可重复 QA 命令。
- 新增 `src/qa/roadPlanScenarios.ts`：统一运行 `isolated-road-network` 与 `isolated-road-network-low-treasury` 两个 roadPlan 场景，并输出前置道路指标、财政、roadPlan 成本/缺口、执行结果和后置指标。
- 新增 `src/qa/roadPlanScenarios.test.ts`：固定成功场景应完成补线并清除未连通/孤立读数，低财政场景应失败、不扣钱且保留未连通/孤立读数。
- `package.json` 新增 `npm run qa:road-plans`，为后续 CI 或人工验收提供固定入口。
- 限制：本轮命令验证的是运行时/治理链路，不是完整浏览器操作。浏览器真实成功/失败路径已由前两轮验证过；下一步应把这些浏览器步骤沉淀为真正脚本化 E2E。

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

## 2026-07-03 第九十轮：服务容量与排队状态

- 启动 `SERVICE-QUEUE-CAPACITY-01`：把服务系统从“超过容量就隐式扣需求/满意度”推进为可观察排队状态。
- `SimulationSnapshot` 新增 `serviceQueues`，记录服务建筑、需求类型、每 tick 容量、当 tick 已接待、拒绝数、等待家庭和最长等待 tick。
- `ServiceSystem` 修正容量边界：已经派出的居民服务访问不再继续占用当 tick 服务容量，也不再被重复算作未满足需求压力。
- 服务图层读取 `serviceQueues`，在地图上显示 `排队xN` 热点，并输出 `queuedHouseholds` 与 `longestServiceWait` 指标。
- 客观限制：这仍只是服务队列的最小真实机制；尚未引入建筑内部处理时间、员工效率差异、服务优先级策略和仓储装卸吞吐。

## 2026-07-03 第九十一轮：目的建筑卸货吞吐与物流积压

- 启动 `LOGISTICS-UNLOAD-QUEUE-01`：把物流热点从订单数量诊断推进为目的建筑卸货能力诊断。
- `LogisticsOrder` 新增 `throughputQueuedSinceTick`，`LogisticsFailureReason` 新增 `destination-throughput`。
- `SimulationSnapshot` 新增 `logisticsQueues`，记录目的建筑每 tick 卸货能力、已卸货数量、等待卸货订单数、最长等待 tick 和前 12 个等待订单样本。
- `LogisticsSystem` 新增 `unloadCapacityPerTick`，同 tick 多辆车到达同一目的建筑时只允许有限订单卸货，其余订单保持 `in_transit` 并等待下 tick。
- 物流图层读取 `logisticsQueues`，显示 `卸货排队xN`，并输出 `unloadBacklog` 与 `longestUnloadWait` 指标。
- 客观限制：卸货能力目前是系统参数，还未绑定建筑等级、仓储工人、道路入口数量和港口/车船类型。

## 2026-07-03 第九十二轮：物流治理分因建议

- 启动 `LOGISTICS-GOVERNANCE-CAUSE-01`：把物流治理卡从统一“补仓储”推进为按失败原因解释。
- `deriveStageGovernanceCards` 新增物流分因诊断：`no-carrier` 推荐补充承运人调度，`no-route` 推荐修通线路，`destination-capacity` 推荐扩建仓储容量，`source-inventory-insufficient/no-source-inventory` 推荐检查来源库存，`destination-throughput` 推荐分流卸货压力。
- 物流分因优先读取当前订单的 `failureReason/cancelReason` 和 `logisticsQueues`，不再让无关建筑残留 `statusReason` 覆盖当前订单热点诊断。
- `logisticsHotspotScenarios` QA 摘要保留订单失败原因字段，只有真实存在失败原因时输出，便于后续审计。
- 客观限制：当前建议仍以文案和工具跳转为主，尚未自动生成车船补充、仓储升级、道路计划或生产源定位的具体执行计划。

## 2026-07-04 第九十三轮：升级成本接入统一经济表

- 启动 `UPGRADE-ECONOMY-TABLE-01`：把建筑升级成本从 `upgrades.ts` 私有硬编码推进到 `ConstructionEconomyTable.upgradeCosts`。
- `DEFAULT_CONSTRUCTION_ECONOMY_TABLE` 新增升级成本参数，默认保持旧曲线：木料 = 下一等级 × 1，石料 = `floor(下一等级 / 2) × 1`。
- `construction.ts` 导出 `buildingUpgradeCost`，平衡工具可以直接按经济表查询升级材料。
- `upgradeBuildingImmediately`、`upgradeBuildingFromCityStorage`、`startBuildingUpgradeFromCityStorage` 支持可选自定义经济表；旧调用默认兼容。
- `validateConstructionEconomyTable` 新增升级参数校验，拒绝负数和非有限数。
- 客观限制：当前升级表仍是统一倍率，尚未按建筑类型、阶段、产能、服务容量和回本周期拆分。

## 2026-07-04 第九十四轮：长跑队列压力读数

- 启动 `LONG-RUN-QUEUE-PRESSURE-01`：把服务/物流队列规模纳入 7200 tick 分层长跑报告，而不是只在图层或单测里观察。
- `CivilizationLongRunLayerSummary` 新增 `queuePressure`，记录 `serviceQueues`、`queuedHouseholds`、`longestServiceWaitTicks`、`logisticsQueues`、`unloadBacklog` 和 `longestUnloadWaitTicks`。
- `npm run qa:civilization-long-run` 在 2400/4800/7200 tick 校验队列压力字段为有限数，并要求最终层出现服务排队压力。
- 同一 QA 命令新增 `queuePressureProbe`：用真实 `LogisticsSystem` 构造两个在途订单同 tick 抵达同一目的建筑、卸货能力为 1 的确定性场景，校验 `logisticsQueues` 和 `unloadBacklog` 确实能被报告捕获。
- 本轮实测 7200 主长跑最终服务队列 43、排队家庭 644、最长服务等待 1 tick；主长跑物流卸货积压仍为 0，探针物流队列 1、卸货积压 1、最长卸货等待 3 tick。
- 客观限制：物流吞吐压力仍是确定性探针，不是 7200 主城市自然形成的长期拥堵；下一步必须改造订单生成/多资源需求/目的地集中度，让真实长跑也能制造仓储吞吐压力。

## 2026-07-10 第九十五轮：主长跑物流卸货压力

- 启动 `LONG-RUN-LOGISTICS-PRESSURE-01`：把卸货积压从确定性探针推进到 7200 tick 主长跑报告。
- `EconomySystemOptions` 新增 `serviceTargetBatches` 与 `unloadCapacityPerTick` 透传，长跑可以通过统一经济系统配置物流卸货能力，而不是绕开组合系统直接实例化 `LogisticsSystem`。
- `runCivilizationLongRunScenario` 新增 `LongRunLogisticsPressureSystem`，每 120 tick 向同一个食肆注入两条真实 `in_transit` 订单和两辆 cart agent，再由正式 `LogisticsSystem` 按 `unloadCapacityPerTick=1` 处理，形成真实 `logisticsQueues`。
- 压力货车完成卸货后会被 QA 负载系统清理，避免 agent 表随 7200 tick 线性膨胀。
- `civilizationLongRunCheck` 将主长跑最终 `unloadBacklog >= 1` 纳入硬门禁；本轮实测 2400/4800/7200 三层均为 `logisticsQueues=2`、`unloadBacklog=2`、最长卸货等待 1 tick。
- 客观限制：当前仍是 QA 负载生成器制造集中到货，不是由真实产业链自然演化出的多资源拥堵；商业级下一步应把卸货能力绑定建筑等级、工人、入口数量、港口类型和城市道路容量。

## 2026-07-10 第九十六轮：物流治理结构化执行计划

- 启动 `LOGISTICS-EXECUTION-PLAN-01`：把物流分因治理从自然语言建议推进为可被运行时和 UI 消费的结构化计划。
- `StageGovernanceRecommendation` 新增 `logisticsPlan`，包含计划类型、订单样本、来源建筑、目的建筑和资源。
- 五类物流分因均输出计划：`no-carrier -> add-carrier-dispatch`，`no-route -> build-road-link`，`destination-capacity -> expand-storage`，`source-inventory-insufficient/no-source-inventory -> inspect-source-stock`，`destination-throughput -> split-unload`。
- 城市治理卡显示物流计划摘要，玩家可以看到涉及订单数、资源、来源和目的地，而不是只看到“补仓储/看图层”的泛化文案。
- 客观限制：本轮还没有把所有 `logisticsPlan` 接入一键运行时动作；下一步要让计划驱动来源定位、目的地定位、道路计划生成、补仓储候选和承运调度入口。

## 2026-07-10 第九十七轮：物流执行计划聚焦目标

- 启动 `LOGISTICS-EXECUTION-FOCUS-01`：把结构化物流计划从“可读摘要”推进为“可定位执行入口”。
- `LogisticsExecutionPlan` 新增 `focusRole` 与 `focusBuildingId`：缺车/缺源优先聚焦发货端，仓满/卸货排队优先聚焦目的端，断路标记为线路聚焦，补缓冲标记为缓冲仓聚焦。
- 城市治理列表会优先用 `logisticsPlan` 的聚焦建筑作为“定位”目标；inspect 类物流执行会直接选中相关建筑，而不是只打开泛化图层。
- 客观限制：本轮仍没有自动生成新道路、自动补仓储、自动派车或打开来源库存详情面板；这些需要继续接入 `GameRuntime` 的正式动作，而不能只靠 UI 文案。

## 2026-07-10 第九十八轮：物流断路执行计划

- 启动 `LOGISTICS-ROAD-PLAN-01`：把 `build-road-link` 从线路聚焦推进为可施工道路计划。
- 当物流主因是 `no-route` 且订单样本可找到来源/目的建筑时，治理建议会读取两端入口并生成 `roadPlan`：施工格、道路/桥梁类型、银两成本、缺口和可支付状态。
- UI 无需新增分支即可复用既有 roadPlan 一键施工链路：点击“打开道路图层并修通线路”会尝试执行物流补线计划，失败时保留施工格提示。
- 客观限制：当前计划使用保守直连格线，尚未避让建筑、按路网容量选线、处理多订单聚合路径或桥头吸附；商业级还需要专门道路规划器。

## 2026-07-10 第九十九轮：物流仓储候选落点

- 启动 `LOGISTICS-STORAGE-CANDIDATE-01`：把仓满、卸货排队和通用物流缓冲建议从泛化“建粮仓”推进为可试放的仓储落点。
- `expand-storage`、`split-unload` 和 `add-buffer-storage` 会先通过城市阶段、银两和仓储材料校验，再扫描地图空地、入口邻路条件，并按到 `logisticsPlan.focusBuildingId` 的曼哈顿距离选择更贴近热点的粮仓 footprint。
- `explainStageRecommendationAvailability` 改为保留已有定制 `execution`，避免物流诊断生成的热点候选被统一建筑可用性校验覆盖回通用落点。
- 新增回归测试固定“远处有可建粮仓、热点旁也有可建粮仓”时必须选择热点旁候选，防止治理建议再次变成只会给第一块空地的浅层提示。
- 客观限制：这仍是单建筑候选而非完整仓储规划器；尚未根据道路容量、仓储服务半径、货物流向、未来扩建空间或多资源需求做全局选址。

## 2026-07-12 第一百轮：物流执行计划详情面板

- 启动 `LOGISTICS-INSPECTOR-PANEL-01`：把结构化物流计划继续接入建筑详情面板，让来源库存和承运调度不只停留在治理卡摘要。
- 新增 `formatLogisticsInventoryPanelCopy`，统一生成来源/目的库存、关联订单和承运调度状态文案。
- `App` 在选中 `logisticsPlan` 相关来源、目的或聚焦建筑时显示“物流执行计划”卡，展示资源库存、关联订单数、忙碌承运数和待派订单数。
- 客观限制：本轮仍是可见诊断入口，尚未新增真实承运人建造、自动调度或来源库存调拨动作；下一步应把调度计划接入正式运行时操作。

## 2026-07-12 第一百零一轮：物流承运重新调度动作

- 启动 `LOGISTICS-REDISPATCH-ACTION-01`：把“补承运调度”从治理卡按钮推进为真实运行时动作。
- `GameRuntime.redispatchLogisticsOrders` 会按订单样本释放关联承运人、清空路径和 cargoIntent，把 assigned/in_transit 订单重置为 waiting，并清除失败原因、取消原因和卸货排队 tick。
- 本动作保留为底层“重置并回到调度队列”的能力；第一百零三轮后，UI 的 `add-carrier-dispatch` 会优先走新增承运容量动作。
- 客观限制：本轮是“重置并重新进入调度队列”，不是新增车船或复杂调度算法；后续仍需正式承运人补充、路线优先级和调度容量系统。

## 2026-07-12 第一百零二轮：物流来源库存调拨动作

- 启动 `LOGISTICS-SOURCE-STOCK-TRANSFER-01`：把 `inspect-source-stock` 从“定位货源库存”推进为可执行的来源补货动作。
- `GameRuntime.transferSourceInventoryForLogisticsPlan` 会按订单样本计算来源建筑缺口，寻找非来源/非目的建筑里的同类备用库存，并通过正式库存增减工具调入货源建筑。
- 调拨成功后，关联未完成订单会被重置为 `waiting`，释放承运人、清空 cargoIntent、失败原因和卸货排队 tick，让正式 `LogisticsSystem` 在后续 tick 重新派车。
- `App` 在执行 `inspect-source-stock` 计划时优先调用调拨动作；成功后刷新物流图层，失败时仍回退到聚焦相关建筑，保留可理解的诊断入口。
- 客观限制：本轮是短链路“备用库存调拨”，不是完整生产排程或跨仓储最优调拨；还没有考虑道路距离、批量路线、未来需求预测和正式车船扩容。

## 2026-07-12 第一百零三轮：物流承运容量补充动作

- 启动 `LOGISTICS-CARRIER-CAPACITY-01`：把 `add-carrier-dispatch` 从“释放/重置旧承运人”推进为真正增加城市运力。
- `GameRuntime.addCarrierForLogisticsPlan` 会按订单样本在来源建筑入口生成一名新的 `cart` 承运人，并清理样本订单的 no-carrier 失败状态，让它们重新进入正式调度队列。
- 新增承运人不是 UI 假数据：目标测试会推进模拟 tick，确认 `EconomySystem` 能把新货车派给缺车订单并写入 `cargoIntent`。
- `App` 在执行 `add-carrier-dispatch` 计划时改为调用新增承运容量动作，成功后刷新物流图层；`redispatchLogisticsOrders` 继续作为底层恢复/释放能力保留。
- 客观限制：本轮新增的是免费、即时、陆路货车；还没有车船建造成本、车行/码头来源、船运选择、承运容量上限或维护费用。

## 2026-07-12 第一百零四轮：金标占位视觉接入主画布

- 启动 `GOLD-VISUAL-RUNTIME-REGISTRY-01`：回应“视觉效果变化不明显”的问题，把已有金标程序化占位细节真正接入主游戏画布。
- 新增 `createDefaultPrefabRegistry`，默认注册 `main-homes`、`main-eatery`、`main-pier`，并用现有完整样例生成 `main-granary` 的临时运行时 descriptor，让 starter 城市的民居、集市、粮仓都能显示金标占位细节。
- `SimulationCanvas` 创建 `DynamicScene` 时传入默认 registry；民居、粮仓、集市、码头不再只显示通用灰盒，而会显示等级/状态条和程序化细节层。
- 修正 prefab 占位尺寸：不再把 manifest 原始像素 bounds 当地图尺寸，避免巨大透明矩形覆盖地图；占位视觉现在按等距建筑 fallback 尺寸缩放。
- 用本机 Chrome 截图验证主画布可加载、canvas 为 1440×900，巨大矩形已消失；截图产物为 `/tmp/eerd-visual-slice-104-fixed.png`。
- 客观限制：这仍是程序化占位和 manifest 样例接入，不是最终手绘/建模资产；下一步应继续做更大尺寸、更强辨识度的建筑轮廓、道路铺装和街区氛围。

## 2026-07-16 第一百一十五轮：物流仓储建成后结果解释

- 启动 `LOGISTICS-STORAGE-OUTCOME-01`：补齐仓储治理动作的结果闭环，避免建成后只剩一次性 toast。
- `SimulationSnapshot.logisticsStorageInterventions` 按新建筑保存本次干预的 tick、重置订单数、释放承运人数和清理卸货队列数；这些数据随运行时重建保留。
- `GameRuntime.buildStorageForLogisticsPlan` 在清理队列时记录真实数量；`App` 建成后自动选中新粮仓，详情抽屉持续显示“建成后的物流变化”。
- 浏览器场景 `logistics-storage-build` 增加可见断言，确认点击治理卡后详情面板出现持久化结果，而不是只验证 toast。
- 客观限制：本轮结果仍按单次干预记录，尚未进入存档版本迁移、事件流统计和多次干预历史列表；下一轮继续做经济/容量联动审计。

## 2026-07-16 第一百一十六轮：升级经济回本与容量联动审计

- 启动 `UPGRADE-ECONOMY-AUDIT-01`：将分类型升级成本与容量、岗位、生产价值、服务吞吐和维护费放入可重复审计。
- 新增 `auditUpgradeEconomy`，从运行时建筑目录和升级曲线自动生成 40 个 0–8 级升级节点的成本价值、增益、财政周期回本和风险警告；`npm run qa:upgrade-economy-audit` 可直接输出报告。
- 服务系统不再把接待吞吐固定为规则常数：1 级保持原值，之后每两级增加 1 单/刻，服务队列快照和真实派发共同使用该等级能力。
- 审计最初发现生产建筑升级的配方产值联动为 0 个节点；本轮随后补上 3/5/7 级里程碑产出增长与周期缩短，并将审计改为验证该联动和剩余回本风险。
- 客观限制：材料影子价值、岗位税收、占用率和容量价值仍是平衡假设，不是最终商业经济表；民居居住价值、物流吞吐价值和生产产值增长仍需接入正式模型。

## 2026-07-17 第一百一十七轮：升级经济结果可见化

- 启动 `UPGRADE-ECONOMY-UI-01`：让上一轮审计的结果进入玩家可见建筑详情，不再只存在于 QA 命令输出。
- `BuildingUpgradeQuote` 复用同一审计口径，返回容量/岗位增量、生产产值增量、服务吞吐增量、维护增量、净周期价值、预计回本周期、风险等级和警告。
- `App` 的建筑详情升级卡显示这些结果；生产升级显示“产值/财政周期”，服务升级显示“服务/刻”，无回本节点显示明确风险提示。
- 目标测试 43 项和生产构建通过；`npm run qa:browser-e2e` 两次均在构建后等待 `127.0.0.1:4173` 超时，归类为本地预览环境未通过，下一轮必须补验。

## 2026-07-17 第一百一十八轮：升级经济风险顾问

- 启动 `UPGRADE-ECONOMY-ADVISOR-01`：把升级审计从建筑详情入口扩展到城市顾问，但保持顾问只显示最高风险一条，避免平铺复杂平衡表。
- `getCityBottlenecks` 会扫描当前可升级建筑，按“不可回本/慢回本/回本周期”排序，生成“升级经济风险”治理卡；点击后沿现有定位链路选中目标建筑，查看完整收益细节。
- 目标构建和 50 项测试通过；调试日志确认浏览器验收失败原因为沙箱禁止 `127.0.0.1:4173` socket 监听（`listen EPERM`），下一轮需在允许本地监听的环境补真实点击证据。

## 2026-07-17 第一百一十九轮：物流热点能力来源短标签

- 启动 `LOGISTICS-UNLOAD-CAPACITY-LABEL-01`：把物流队列已有的卸货能力拆解从详情面板延伸到物流地图热点。
- `StageAdvisorOverlay` 新增轻量 `badges`，最多对四个卸货排队热点显示 `能力 X/刻·基/级/工/路` 或固定覆盖能力，避免复杂能力表平铺到主界面。
- `SimulationCanvas` 将徽标作为场景内提示渲染，徽标不拦截地图操作；新增测试覆盖无拆解兼容格式和基础/等级/道路来源格式。
- 定向 34 项、全量测试、生产构建和 `git diff --check` 通过；真实浏览器验收仍受当前沙箱禁止本地 socket 监听影响。

## 2026-07-17 第一百二十轮：物流干预事件与存档审计

- 启动 `LOGISTICS-INTERVENTION-AUDIT-01`：解决扩仓结果只按建筑保存、无法表达多次干预历史的问题。
- 新增 `LogisticsStorageInterventionRecord` 和快照历史数组；`GameRuntime.buildStorageForLogisticsPlan` 在真实动作完成后追加唯一事件，并保留旧 `logisticsStorageInterventions` 映射供已有详情 UI 使用。
- 新增审计器与命令，校验事件唯一性、建筑引用、刻数、计数和累计结果；运行时回归验证动作后的历史记录包含真实订单集合。
- 43 项定向测试、全量测试、生产构建、审计命令和 `git diff --check` 通过。

## 2026-07-17 第一百二十一轮：物流干预历史可见化

- 启动 `LOGISTICS-INTERVENTION-UI-01`：把快照中的多次干预历史接入建筑详情抽屉。
- `App` 对当前建筑筛选历史记录，显示累计干预次数、重置订单、释放承运、清理队列和最近事件刻数；不会新增第二个大型管理面板。
- `cityAdvisorUi` 新增纯函数汇总口径并由单测锁定，确保 UI 与后台审计使用同一累计定义。
- 定向 32 项测试和生产构建通过；下一步补全量回归与浏览器实际点击证据。

## 2026-07-17 第一百二十二轮：物流干预历史有界归档

- 启动 `LOGISTICS-INTERVENTION-RETENTION-01`：解决干预事件历史在长时间运行中无限增长的问题。
- 新增 `appendLogisticsStorageIntervention`，最近 200 条记录保留在明细；超出窗口的记录累计进入 `logisticsStorageInterventionArchive`，保留总事件数和结果计数。
- 审计器同时汇总明细与归档；205 条边界测试确认首尾事件、保留数量和归档累计正确。
- 定向 31 项测试与生产构建通过；全量回归和真实浏览器验收仍待完成。

## 2026-07-17 第一百二十三轮：物流干预归档接入城市管理面板

- 启动并完成 `LOGISTICS-INTERVENTION-ARCHIVE-UI-01`：城市管理“瓶颈”抽屉新增治理存档卡，读取快照中的近期明细和累计归档。
- `formatLogisticsStorageArchive` 统一展示近 200 条明细窗口、历史归档数量及累计订单/承运/队列影响；存在归档时额外显示最后归档刻数。
- 该读数保持低干扰，不新增第二个大型面板；建筑详情仍保留单建筑明细，城市管理面板负责全城累计概览。
- 定向 38 项、全量 280 项测试、生产构建和 `git diff --check` 通过；真实浏览器验收仍需允许本地预览服务监听。

## 2026-07-17 第一百二十四轮：物流治理时间线可定位

- 启动并完成 `LOGISTICS-INTERVENTION-TIMELINE-01`：城市管理抽屉展示最近三条物流干预记录，按刻数倒序排列。
- 时间线条目复用 `CityNoticeTarget` 的建筑目标协议，点击后进入既有 `focusCityTarget`，同时完成地图相机聚焦与建筑详情选择；历史建筑缺失时保留事实记录并显示“已移除”。
- 新增 `formatLogisticsStorageTimelineRecord` 纯函数和单测，确保时间线显示的订单、承运和队列影响与后台记录一致。
- 定向 38 项、全量 281 项测试、生产构建和 `git diff --check` 通过；真实浏览器验收仍需允许本地预览服务监听。

## 2026-07-17 第一百二十五轮：城市运行时间线接入文明事件

- 启动并完成 `CIVILIZATION-TIMELINE-01`：`SimulationEvent` 中的服务交付、市场购买、家庭迁移和迁入候选变化现在会由 `GameRuntime` 写入快照 `cityTimeline`。
- 新增 `appendCityTimelineEvents` 和 200 条有界窗口，事件保留来源、刻数、系统分类、可读事实和建筑目标；不把高频事件无限堆入内存。
- 城市管理抽屉新增“城市运行”区块，服务/财政记录可定位建筑，人口记录作为不可定位的城市层级事实显示；物流治理保持单独时间线，避免不同语义混成一条难读的列表。
- 定向 51 项、全量 284 项测试、生产构建和 `git diff --check` 通过。

## 2026-07-17 第一百二十六轮：居民入住前后身份与职业状态可见化

- 启动并完成 `RESIDENT-IDENTITY-STATE-01`：城市时间线人口记录现在携带居民状态快照，读取真实家庭、工人代理和雇佣建筑，不新增与模拟状态脱节的第二套人口数据。
- 入住前的候选家庭显示“待安置、未就业”，入住后的外来家庭显示成员数、劳动力就业比例、职业建筑和满意度；离城记录保留明确的离城身份状态。
- 新增 `civilization-resident-timeline` 浏览器场景契约及运行时调试场景，点击“瓶颈”打开城市运行卡即可验收；当前环境的本地 socket 限制使真实点击仍需外部环境补跑。
- 目标 GREEN：定向 49 项、全量 285 项测试、生产构建和 `git diff --check` 通过。

## 2026-07-17 第一百二十七轮：居民生活状态进入城市运行反馈

- 启动并完成 `RESIDENT-GOVERNANCE-01`：新增 `deriveResidentGovernance`，从当前快照汇总住房容量/拥挤、就业/待业、迁入候选、活动状态、职业分布和民需短板。
- 城市管理面板新增“居民生活”卡；建筑详情对住房显示实际入住人数，居民状态从后台模拟可追溯到具体家庭和住房。
- 完成 `RESIDENT-VISUAL-ROLE-01`：动态地图工人服色按雇佣建筑类别区分，工作、通勤、返家等动画不改为静态装饰。
- 将 `civilization-resident-timeline` 浏览器场景契约扩展到居民生活卡的“居民生活/就业”读数。
- 目标 GREEN：定向 28 项、生产构建、全量回归和 `git diff --check` 通过；真实浏览器点击仍受本地监听限制影响。

## 2026-07-17 第一百二十八轮：岗位与居民缺勤形成真实运行后果

- 启动并完成 `RESIDENT-LABOR-CONSEQUENCE-01`：模拟引擎新增岗位变更和出勤状态事件；低健康/低满意度居民缺勤，恢复后重新发起通勤或进入工作状态。
- 生产、服务、物流卸货和劳动力告警统一使用有效出勤工人数量；岗位仍保留给缺勤居民，避免系统把短期缺勤错误解释为永久失业。
- 城市运行时间线新增劳务记录，居民治理面板新增缺勤数量；新增模拟引擎和时间线单测覆盖缺勤、恢复、岗位分配和文案投影。
- 全量 46 个测试文件、289 项测试通过；生产构建和 `git diff --check` 通过。

## 2026-07-17 第一百二十九轮：居民迁出原因可解释化

- 启动并完成 `RESIDENT-MIGRATION-REASON-01`：离城事件新增 `critical-needs`、`unemployment` 和 `low-satisfaction` 原因，依据家庭需求、就业和满意度计算。
- 城市时间线展示“因关键需求长期无法满足/长期失业/长期满意度过低离开城市”，旧的无原因历史记录安全回退为一般性低满意度文案。
- 定向迁移与时间线测试、生产构建和全量 289 项回归通过；长时间文明压力场景保持通过。

## 2026-07-17 第一百三十轮：需求短板与长期缺勤持久化

- 启动并完成 `RESIDENT-PRESSURE-PERSISTENCE-01`：家庭状态保存各项关键需求低于阈值的累计刻数，以及至少一名工人缺勤时的累计缺勤刻数。
- `household-migrated` 离城事件携带具体需求类型或缺勤累计刻数，城市时间线将其投影为“医疗/粮食等需求长期不足”与“连续缺勤 N 刻”的可读事实。
- 新增长期缺勤迁出测试并补强需求类型断言；兼容没有新字段的旧存档与历史事件。
- 全量 46 个测试文件、291 项测试通过；生产构建 2356 个模块通过；`git diff --check` 通过。

## 2026-07-17 第一百三十一轮：服务短缺进入居民因果链

- 启动并完成 `RESIDENT-SERVICE-PRESSURE-01`：服务系统将无工人、缺资源、断路、容量不足和收入不足分别记录到家庭需求压力，并累计持续刻数。
- 服务压力恢复后会清除对应需求的短板记录；迁出原因从压力状态读取瓶颈类型和服务建筑，城市治理卡显示持续时间最长的短板。
- 增加服务经济、居民治理和城市时间线测试，确保压力来自真实服务循环而非界面计算。
- 全量 46 个测试文件、292 项测试通过；生产构建 2356 个模块通过；`git diff --check` 通过。

## 2026-07-17 第一百三十二轮：城市级缺失服务设施治理

- 集成 `deriveMissingServiceFacilities` 到阶段治理顾问：从家庭真实需求均值和城市建筑类型判断是否完全缺少某类服务设施。
- 缺失服务卡复用既有 `service` overlay、建筑营造建议和住宅入口定位，不新增平行的 UI 状态或虚构建筑运行结果。
- 对当前尚未配置医疗、教育、文化建筑定义的时代，建议安全回退为服务图层检查；市场等已有定义可继续生成真实营造候选。
- 全量 46 个测试文件、293 项测试通过；生产构建 2356 个模块通过；`git diff --check` 通过。

## 2026-07-17 第一百三十三轮：医疗、教育与文化设施进入运行时

- 将 `pharmacy`、`academy`、`theatre` 加入 `BUILDING_DEFINITIONS` 和 `BUILDING_MENU`，分别映射到 `main-pharmacy`、`main-academy`、`main-theatre` 原创资产 ID。
- 三类设施沿用 `ServiceSystem` 已有的 health、education、entertainment 规则；药铺还沿用 medicine 生产配方，建成后可由生产/物流/服务系统共同驱动。
- 阶段解锁和营造报价由同一运行时菜单计算，升级经济审计自动纳入 24 个新增升级节点；未新增独立的 UI 假状态。
- 全量 46 个测试文件、294 项测试通过；生产构建 2356 个模块通过；`git diff --check` 通过。

## 2026-07-17 第一百三十四轮：服务设施建造闭环

- `GameRuntime` 新增 `service-facility-runtime` 调试场景，使用真实引擎状态进入商贸镇并制造健康需求短板。
- `runServiceFacilityQaScenario()` 调用 `previewBuildingPlacement` 与 `placeBuilding` 完成药铺营造，再以确定性场景工人和库存驱动服务系统；模拟运行后验证服务事件与健康恢复。
- URL 调试场景解析和 npm QA 入口同步接入，便于同一场景复用到浏览器验收。

## 2026-07-17 第一百三十五轮：三类公共服务与故障审计

- 将服务设施 QA 从药铺单例扩展为药铺、书院、戏台三类统一恢复契约，确保不同需求类型共享真实服务系统而非复制 UI 逻辑。
- 增加缺工、缺少药材和断路夹具；每个夹具在模拟 tick 后同时检查建筑 `statusReason` 与家庭 `needPressure` 原因。
- `GameRuntime` 提供仅供 QA 场景使用的阶段夹具，生产调用仍从人口、住宅和城市指标推导阶段。
- 全量 47 个测试文件、298 项测试通过；构建和差异空白检查通过；浏览器仍受本地监听限制待补。

## 2026-07-17 第一百三十六轮：公共服务反馈到城市吸引力

- 在模拟契约中加入 `publicServiceCoverage`，由居民 health、education、entertainment 三类需求的真实均值派生。
- 将该指标纳入迁入吸引力公式，服务点正常运行会改善后续人口吸引，服务短板会形成城市级迁入压力；现有住房、岗位、食物、物流和税率权重保持可解释分解。
- UI 指标栏增加公共服务读数；运行时服务 QA 增加覆盖回升断言。
- 全量 47 个测试文件、299 项测试通过；构建和 `git diff --check` 通过。

## 2026-07-17 第一百三十七轮：人口流动账本与服务财政反馈

- `SimulationEngine` 在家庭真正迁入或迁出时更新 `PopulationFlowLedger`，不依赖事件消费端推断，保证存档恢复后统计仍连续。
- `CityMetrics` 提供迁入、迁出、净迁移户数；居民治理摘要读取同一份账本，避免 UI 产生并行人口流动状态。
- `FiscalSystem` 在每次财政结算时按建筑类别拆出公共服务维护支出，和总维护成本同时写回经济状态，为后续财政政策和服务扩建提供真实反馈。
- 全量 47 个测试文件、300 项测试通过；生产构建和差异检查通过。

## 2026-07-17 第一百三十八轮：人口流动结构审计

- 家庭迁入时记录落住房型；家庭迁出时在删除实体前记录迁出原因、原住房类型、每名劳动力的职业/待业状态。
- 居民治理摘要将结构账本格式化为“主要原因 + 离城职业”，和净迁入、服务覆盖、维护支出共同呈现人口反馈链路。
- 迁出事件契约保持兼容，结构数据持久化在快照账本中，不要求事件消费者改变既有精确事件格式。
- 全量 47 个测试文件、301 项测试通过；生产构建和 `git diff --check` 通过。

## 2026-07-17 第一百三十九轮：离城居民生命周期档案

- 引擎在迁出家庭从快照删除前建立 `CityTimelineResidentProfile`，通过 `SimulationAdvanceResult.departedResidents` 传给运行时。
- 城市时间线使用离城档案展示真实成员数、劳动力、职业、原住房和离城时满意度；没有档案的旧事件仍回退为兼容占位。
- 不扩展既有迁出事件字段，避免破坏历史消费者和精确事件回归。
- 全量 47 个测试文件、302 项测试通过；生产构建和差异检查通过。

## 2026-07-17 第一百四十轮：人口事件与财政周期关联

- 财政系统在结算时写入 `lastFiscalTick`，运行时为人口时间线建立只读财政快照。
- 家庭迁出记录同时显示迁出原因、服务瓶颈、服务建筑和最近财政结算中的库银、总维护、公共服务维护支出。
- 该关联使用时间线可选字段，不改变旧存档和既有事件消费者；没有财政周期的历史记录仍正常渲染。
- 全量 47 个测试文件、302 项测试通过；生产构建和 `git diff --check` 通过。

## 2026-07-17 第一百五十九轮：提示分析离线持久化与批次去重

- `CityNoticeAnalyticsQueue` 已提供 localStorage durable outbox、稳定事件键、批次 peek/consume/acknowledge 和跨实例恢复。
- `GameRuntime` 在刷新、重建和模拟推进时自动捕获提示生命周期事件；尚未确认的本地事件不会因运行时重建丢失。

## 2026-07-17 第一百六十轮：分析批次传输与失败重试协议

- 新增 `CityNoticeAnalyticsTransport` 与 `CityNoticeAnalyticsDispatcher`，把 durable outbox 与真实分析服务隔离。
- 只有传输器明确返回的事件 ID才会从本地队列删除；未配置传输器、网络异常和部分确认都会保留未确认事件。
- `GameRuntime` 增加可选传输器和 `flushCityNoticeAnalytics()`；默认仍保持纯离线，不伪造上报成功。
- 定向回归 46 项通过；全量回归 47 个测试文件、323 项通过；构建 2356 个模块通过；`git diff --check` 通过。
- 尚未接入真实 HTTP 服务端、请求超时实现和浏览器网络确认证据，不能宣称分析链路已上线。

## 2026-07-17 第一百六十一轮：HTTP 分析服务适配器

- 新增 `HttpCityNoticeAnalyticsTransport`：POST 批次事件，携带确定性的 `idempotency-key`，并只接受合法的 `acknowledgedEventIds` 响应。
- 请求超时会主动 abort 并返回失败；非 2xx 响应与非法 JSON 结构均拒绝确认，因此不会删除本地未确认事件。
- 适配器对服务端返回的未知事件 ID进行白名单过滤，与 dispatcher 的部分确认协议保持一致。
- 定向回归 35 项通过；全量回归 47 个测试文件、326 项通过；生产构建 2357 个模块通过；`git diff --check` 通过。
- 尚未配置真实生产 endpoint、服务端幂等存储和浏览器网络确认证据，当前仍不能宣称分析链路已上线。

## 2026-07-17 第一百五十五轮：财政压力可定位治理提示

- `deriveCityNotices` 读取最近财政结算的 `operationalPressureDelta`，仅在任一压力维度上升时生成 `finance` 类“运营压力在上升”提示。
- 提示目标优先选择当前真实阻塞建筑，其次是物流热点，最后回退到居民关联建筑；因此提示与现有城市地图定位协议联动，而不是新造一套入口。
- `cityNotices.test.ts` 新增真实阻塞建筑定位回归；定向 54 项、全量 47 个测试文件 313 项通过，构建 2356 个模块通过。
- 浏览器真实点击仍待本地 socket 可用环境补跑。

## 2026-07-17 第一百五十八轮：城市提示分析生命周期事件

- `CityNoticeTracker` 新增生命周期事件队列：首次活动发 `activated`，既往问题再次活动发 `retriggered`，活动消失发 `resolved`，用户确认发 `acknowledged`。
- `GameRuntime.consumeCityNoticeLifecycleEvents()` 负责批量消费，`acknowledgeCityNotice()` 负责接入界面动作；事件携带提示类型、严重级别、刻数和地图定位目标。
- 定向 42 项、全量 47 个测试文件 319 项通过；生产构建 2356 个模块通过。
- 目前是内存队列，尚未接入离线持久化或真实分析服务；浏览器真实点击仍待本地 socket 可用环境补跑。

## 2026-07-17 第一百五十九轮：提示分析离线持久化与批次去重

- `CityNoticeAnalyticsQueue` 使用可注入存储实现 durable outbox，默认接入浏览器 `localStorage`；恢复失败、JSON 损坏和存储异常均降级为内存运行，不影响城市模拟。
- `peek` 用于发送前读取、`acknowledge` 用于服务端确认后删除，`consume` 仅作为本地明确丢弃语义；事件 ID 稳定到提示、阶段和模拟刻，跨重启去重。
- `GameRuntime` 在刷新/重建/推进时捕获事件，确保用户不调用消费接口时也先落入本地队列。
- 定向 43 项、全量 47 个测试文件 320 项通过；生产构建 2356 个模块通过；真实网络传输和失败重试仍待下一轮。

## 2026-07-17 第一百五十七轮：高优先级提示生命周期审计

- 以同一 `CityNoticeTracker` 验证粮食短缺、物流阻塞、迁移等待和财政压力四类提示：保持期间只在首次进入活动集合时返回，恢复后移出，再次进入时重新返回。
- 没有新增平行状态机，避免各类提示的消退语义分裂；现有运行时通知流可继续消费同一边沿结果。
- 定向 15 项、全量 47 个测试文件 318 项通过；生产构建 2356 个模块通过。
- 浏览器真实点击仍待本地 socket 可用环境补跑。

## 2026-07-17 第一百五十六轮：财政提示生命周期去打扰

- 保持 `CityNoticeTracker` 的边沿语义：财政提示以稳定的 `fiscal-pressure-rising` 身份去重，同一压力周期不会因为 tick 推进重复产生新通知。
- 当财政历史进入无上升压力的下一周期，通知从活动集合移除；再次出现正向压力差值时可重新触发。
- 定向 12 项、全量 47 个测试文件 315 项通过；生产构建 2356 个模块通过。
- 浏览器真实点击仍待本地 socket 可用环境补跑。

## 2026-07-17 第一百四十二轮：服务恢复前后审计

- 服务系统在居民需求实际恢复时记录 `needBefore` 与 `needAfter`，不改变服务队列、资源扣除或居民需求计算逻辑。
- 城市时间线把恢复幅度与最近财政结算的库银变化、公共服务维护支出放在同一条服务记录中。
- 旧事件字段仍可省略；时间线对缺少前后值或财政历史的记录保持兼容文案。
- 全量 47 个测试文件、303 项测试通过；生产构建和 `git diff --check` 通过。

## 2026-07-17 第一百四十三轮：服务瓶颈解除与建筑恢复审计

- 服务系统在恢复服务派发时比较建筑原阻塞原因和居民压力账本，生成 `service-bottleneck-cleared` 事件。
- 该事件携带服务类型、原阻塞原因、压力清除户数和最长持续刻数；建筑 `blocked→serving` 状态转换由同一真实运行时分支完成。
- 城市时间线新增可读的“服务瓶颈解除”记录，保留旧服务事件与旧存档兼容。
- 全量 47 个测试文件、304 项测试通过；生产构建和 `git diff --check` 通过。

## 2026-07-17 第一百四十四轮：恢复事件界面消费

- `App.tsx` 从 `snapshot.cityTimeline` 读取最近服务恢复记录，治理面板提供定位入口，建筑详情按选中建筑展示最近恢复卡。
- `formatServiceRecoveryRecord` 作为共用文案边界，避免治理面板和详情抽屉各自拼装不同事实。
- 界面没有新增独立恢复状态，建筑、居民压力和时间线仍由模拟快照驱动。
- 全量 47 个测试文件、305 项测试通过；生产构建和 `git diff --check` 通过。

## 2026-07-17 第一百四十五轮：恢复审计结构化数据

- `CityTimelineRecord` 新增服务恢复与服务完成审计对象，分别承载建筑状态、压力清除、财政快照和居民需求前后值。
- `App.tsx` 的建筑详情在恢复卡中显示 `blocked→serving` 等状态变化、压力户数、最长持续刻数、库银变化，并补充最近一户需求恢复数值。
- 未改变服务系统的资源、岗位、道路和需求计算；新增字段均为时间线可选扩展，兼容旧事件和旧存档。
- 定向 78 项、全量 305 项测试通过；构建、差异检查通过。

## 2026-07-17 第一百四十六轮：服务恢复动态渲染

- `BuildingVisual` 在既有建筑状态图层上消费最近的 `service-bottleneck-cleared` 时间线记录，恢复后的 12 个模拟刻内显示脉冲反馈。
- 动效由模拟 tick 计算相位与衰减，建筑回收/复用时不会留下独立状态；没有恢复记录的建筑不显示该反馈。
- 新增渲染回归，验证恢复记录会创建短时恢复状态层；全量 47 个测试文件、306 项测试通过，构建和差异检查通过。

## 2026-07-17 第一百四十七轮：阻塞原因动态反馈

- 阻塞画布继续按真实原因显示缺料、缺工、物流失败、仓满等差异化符号，并为阻塞运动层加入随模拟 tick 变化的呼吸强度。
- 这轮没有改变建筑状态机；`statusReason` 仍由生产、服务、物流和仓储系统写入，渲染层只负责解释。
- 渲染定向 13 项通过；生产构建和 `git diff --check` 通过。

## 2026-07-17 第一百四十八轮：运行阻塞持续时间与治理后果

- `blockedSinceTick` 已在生产、服务、物流阻塞路径写入，并在恢复或升级切换时清理，避免升级文案被当成阻塞原因。
- 居民治理卡新增运行阻塞数量、最长阻塞时长、物流积压和库存压力读数，全部由实时模拟快照派生。
- 定向 69 项、全量 47 个测试文件 307 项测试通过；生产构建 2356 个模块通过；`git diff --check` 通过。
- 浏览器验收仍受当前环境禁止本地 socket 监听限制，待可监听环境补跑真实面板和画布证据。

## 2026-07-17 第一百四十九轮：阻塞生命周期时间线审计

- 模拟引擎新增建筑运行阻塞开始/恢复转换检测；仅在真实状态边沿生成事件，服务恢复使用已有专用事件避免重复。
- 城市时间线新增 `operations` 类，保存阻塞原因、开始刻、持续时长与恢复状态；建筑详情可查看该建筑的生命周期审计。
- 定向 67 项、全量 47 个测试文件 308 项测试通过；生产构建 2356 个模块通过；`git diff --check` 通过。
- 浏览器验收仍受当前环境禁止本地 socket 监听限制，待可监听环境补跑真实时间线和建筑详情交互。

## 2026-07-17 第一百五十一轮：阻塞持续期间增量审计

- 公共契约新增 `BuildingBlockageConsequenceDelta`；阻塞事件现在同时携带起始后果、恢复后果和期间变化。
- `SimulationEngine` 在阻塞边沿保存基线并回写实体 `blockedSinceTick`，恢复时计算缺勤、关联物流、库存和居民压力增量；建筑原因、起始刻和恢复刻仍来自真实模拟状态。
- 时间线详情与建筑审计卡增加“期间变化”读数；新增引擎级回归覆盖 2 刻阻塞及库存 2→5 的 `+3` 增量。
- 全量 47 个测试文件、309 项测试通过；生产构建 2356 个模块通过；`git diff --check` 通过。
- 浏览器验收仍受当前环境禁止本地 socket 监听限制，待可监听环境补跑真实时间线与建筑详情交互。

## 2026-07-17 第一百五十二轮：阻塞增量接入财政周期

- 财政系统在每次真实结算时记录运营压力快照，避免只记录库银、税收和维护支出而丢失阻塞造成的城市运行压力。
- 居民治理摘要读取最近财政历史中的运营压力，并在面板显示结算刻、阻塞建筑、物流积压和居民压力户数。
- 定向 57 项、全量 47 个测试文件 309 项测试通过；生产构建 2356 个模块通过；`git diff --check` 通过。
- 浏览器验收仍受当前环境禁止本地 socket 监听限制，待可监听环境补跑财政周期与治理面板真实交互。

## 2026-07-17 第一百五十三轮：阻塞原因变化生命周期分段

- 修复同一建筑阻塞原因变化时直接覆盖旧 `blockedSinceTick` 的问题；原因变化现在生成上一段恢复事件，并以当前刻开始新的阻塞段。
- 新段重新采集后果基线，恢复时计算本段增量；真实引擎回归验证缺料段和断路段各自持续 1 刻并正常恢复。
- 全量 47 个测试文件、310 项测试通过；生产构建 2356 个模块通过；`git diff --check` 通过。
- 浏览器验收仍受当前环境禁止本地 socket 监听限制，待可监听环境补跑多段时间线和建筑详情交互。

## 2026-07-17 第一百五十四轮：财政压力周期对比与时间线事件

- 财政结算由纯状态写入升级为 `fiscal-settlement` 模拟事件，同时持久化当前运营压力及相对上次结算的差值。
- 城市时间线新增财政记录，显示税收、维护、库银变化以及阻塞/物流/居民压力的周期变化；治理面板读取同一份财政历史。
- 定向 44 项、全量 47 个测试文件 312 项测试通过；生产构建 2356 个模块通过；`git diff --check` 通过。
- 浏览器验收仍受当前环境禁止本地 socket 监听限制，待可监听环境补跑财政结算与多段阻塞时间线交互。

## 2026-07-17 第一百五十轮：阻塞同刻后果因果链

- `SimulationEngine` 在阻塞状态边沿采集缺勤工人、相关未完成物流订单、库存总量/容量和关联居民压力。
- 时间线记录与建筑详情消费同一份结构化后果数据，开始记录展示“库存/物流/压力”，恢复记录展示解除时的同刻状态。
- 定向 56 项、全量 47 个测试文件 308 项测试通过；生产构建 2356 个模块通过；`git diff --check` 通过。
- 浏览器验收仍受当前环境禁止本地 socket 监听限制，待可监听环境补跑真实时间线和建筑详情交互。

## 2026-07-17 第一百四十一轮：财政结算历史与周期对比

- 财政结算保留最近 24 条历史，记录结算前后库银、税收、总维护和公共服务维护成本，供运行时和后续财务审计使用。
- 人口时间线改为读取最近一条真实结算记录；尚未发生财政结算时不注入财政字段，避免把“无数据”误显示为零成本周期。
- 迁出记录继续保持旧事件兼容，同时把财政前后变化、公共服务维护与迁出原因放在同一条审计链上。
- 全量 47 个测试文件、302 项测试通过；生产构建和 `git diff --check` 通过。
## 2026-07-17 第一百六十二轮：商业美术交付覆盖门禁

- 新增 `asset:coverage-audit`，针对首批六类金样逐项检查建设点目录、building/animation manifest、严格 L0–L8 覆盖、DCC 源文件和运行时二进制导出。
- 新增自检脚本，明确验证当前门禁应保持红灯：`main-homes` 与 `main-eatery` 只有契约 manifest，`main-pier` 缺 L2/L3/L5/L6/L7，`windfield-rice`、`main-granary`、`main-kiln` 尚无金样目录。
- 这轮没有伪造图片、模型或动画；报告把“契约已写”和“资产已交付”分开，作为后续美术、建模、动画子任务的唯一入口。
## 2026-07-17 第一百六十三轮：建筑差异与繁荣成长契约

- `asset-validator` 新增可选生产门禁 `requireVisualIdentity` / `--require-visual-identity`，要求每类建筑提供独特建筑类别、轮廓族、功能识别和材质语言。
- 每个 L0–L8 必须提供 `stage`、`silhouette`、`functionalRead`、`environment`、`activeElements` 和 `structuralMilestone`；L1/L3/L5/L7 必须是主体轮廓里程碑，L0/L8 必须分别表达废墟与繁荣营业，且至少有三种轮廓签名。
- 覆盖审计已启用该生产门禁；现有 `main-homes`、`main-eatery`、`main-pier` 的 manifest 因缺视觉身份契约保持红灯，这是预期结果。

## 2026-07-17 第一百六十四轮：全建筑视觉身份目录与跨资产唯一性

- 新增 `src/content/buildingVisualIdentity.ts`，为现有 28 类建筑建立独立的建筑类别、轮廓族、功能识别、材质调色、主视觉特征、环境特征、动态签名和 L0–L8 成长弧。
- `BUILDING_CATALOG` 将视觉身份正式注入 `BuildingDefinition`；运行时建筑别名沿用对应金标建筑身份，并可按等级读取视觉阶段，避免所有建筑在高等级复用亭子/船等无关外形。
- 资产门禁新增跨建筑重复检查：`buildingClass`、`silhouetteFamily`、`functionalSignature` 任一重复都会被拒绝。该门禁检查的是生产 manifest，当前真实资产尚未补齐，因此生产门禁仍保持红灯。
- 全量 49 个测试文件、327 项测试通过；生产构建 2358 个模块通过；`git diff --check` 通过。

## 2026-07-17 第一百六十六轮：运行时建筑美术精灵接入

- 新增 `BuildingArtworkProvider` 和统一路径解析：所有运行时建筑等级都从 `public/assets/buildings/<assetId>/level-0..8.png` 读取，等级会在 0–8 范围内钳制。
- `SimulationCanvas` 正式启用缓存 Provider；建筑实体现在按类型/等级显示真实透明 PNG，缺少 Provider 或纹理时仍回退到身份化灰盒，不隐藏建筑、不伪造资产已完成。
- 新增运行时资产审计，实测 28 个建筑目录、252 个等级文件、252 个唯一 512×512 RGBA PNG 通过基础交付检查。
- 限制：该审计不替代 DCC 源文件、模型/骨骼、动画图集、碰撞和完整 manifest 的商业生产门禁；浏览器真实像素验收仍因本地 socket 限制未完成。
- 定向渲染回归 16 项、全量 50 个测试文件 330 项测试、生产构建 2359 个模块和 `git diff --check` 通过。

## 2026-07-17 第一百六十七轮：建筑身份差异化动效层

- `BuildingVisual` 新增独立 `building-artwork-motion-layer`，其绘制相位来自模拟 tick 和实体 id，避免每栋建筑同步闪烁或依赖真实时间随机漂移。
- 施工/升级、田地/果园/药圃、港口/船坊/盐场、灯塔、水车、民居/市集/营业设施分别拥有不同的动效语义；动效与建筑等级、状态和视觉身份共同决定，不再使用单一全局动画。
- 动效层进入对象池复用路径，更新时清理并重绘，不新增每 tick 的 DisplayObject；既有状态提示层保留，用于缺料、缺工、断路、仓满和恢复反馈。
- 定向渲染回归 16 项、全量 50 个测试文件 330 项测试、生产构建 2359 个模块和 `git diff --check` 通过。
- 浏览器真实像素、帧率和透明边缘验收仍待可监听环境；专业 DCC/骨骼/图集动画仍未交付。

## 2026-07-17 第一百六十八轮：DCC 生产流水线契约

- 新增 `tools/art-pipeline/blender/build-gold-slice.py`。脚本面向 Blender 4.x LTS 美术机执行，不生成假模型；缺少九级集合、语义锚点、动画 action、碰撞/遮挡或关键等级差异时直接失败。
- 脚本统一输出九级透明预览和 DCC provenance manifest，并保留源 `.blend`、动画部件和运行时图集交付边界，禁止静态单图冒充完整建筑资产。
- 新增 `tools/art-pipeline/validate-pipeline-contract.js` 与 `asset:pipeline:contract`，当前 10 项脚本标记、5 项建模规格标记通过。
- 生产限制保持诚实：本机无 Blender，未生成新的 `.blend`、骨骼动画或专业图集；覆盖审计仍需真实美术机产物才能转绿。

- 新增 `resolvePrefabAnimationPlan`：运行时统一消费 `ResolvedPrefabBuilding.slots`，按 `sceneTime`、`productionProgress`、`constructionProgress`、`orderPhase` 和 `fixed` 计算确定性进度，过滤 LOD-off 槽位并输出 clip、frame、parts、anchors 和播放模式。
- 定向 Prefab 动画计划回归 7 项通过；全量回归 51 个测试文件、333 项测试通过；生产构建 2359 个模块通过。

## 2026-07-17 第一百六十九轮：Prefab 动画计划进入场景同步

- `BuildingVisual` 在 `drawPrefabPlaceholder` 阶段按当前 `SimulationSnapshot.tick`、生产/施工进度和 LOD 解析播放计划；`drawBuildingArtworkMotion` 消费计划生成状态相位和槽位标签。
- 对象池 reset 会清理 `prefabAnimationPlan`，避免居民城市长时间运行和实体复用时发生跨建筑动画串状态。
- 动态场景新增仓满与生产槽位消费断言；全量 51 个测试文件、333 项测试通过，构建 2360 个模块通过。
- 仍未把不存在的专业图集伪装成已接入：当前真实 AnimatedSprite/部件变换/粒子图集接线等待 DCC 二进制资产交付。

## 2026-07-17 第一百六十五轮：视觉身份动态渲染接入

- `BuildingVisual` 现在消费 `getBuildingVisualIdentity` / `getBuildingVisualLevel`；已映射但尚未注册真实 Prefab 的建筑会按身份目录进入可见灰盒渲染，而不是被直接隐藏。
- 灰盒轮廓按建筑功能族区分民居、田地/果园/茶园、港口/船坊/盐场、灯塔/书院及生产建筑，并随 L0–L8 改变体量、密度、色彩和功能轮廓标签；这仍是运行时占位层，不冒充最终商业美术资产。
- 更新动态场景回归：未注册的 `main-pier` 现在验证为可见的身份化 fallback，并显示 L4 的 `cross-berth-wharf` 功能轮廓。
- 全量 49 个测试文件、327 项测试通过；生产构建 2358 个模块通过；`git diff --check` 通过。

## 2026-07-17 第一百七十轮：真实图集播放驱动骨架

- `src/rendering/artwork/buildingAnimation.ts` 新增 Provider 契约、内存帧 Provider 和 Pixi `Spritesheet` 适配器；查询键明确包含建筑、等级、槽位和 clip。
- `BuildingAnimationDriver` 使用 `AnimatedSprite` 复用每个槽位的显示对象，以动画计划进度确定性选帧，并同步 loop、anchor、尺寸和可见性；`reset` 清除对象池残留。
- `DynamicScene` 与 `BuildingVisual` 支持可选 Provider 注入。Provider 未命中时由原有程序化 motion layer 继续承担降级表现，当前没有伪造真实图集交付。
- 验证：52 个测试文件、336 项测试通过；构建 2361 个模块通过；DCC 契约、运行时 PNG 审计和 `git diff --check` 通过。
- 集成阻塞：真实 `.blend`、分层图集二进制和浏览器可监听环境仍缺失；下一轮必须先完成 `main-pier` 金样导出，再做实际 Provider 注入验收。

## 2026-07-17 第一百七十一轮：图集清单异步加载与场景注入

- `loadBuildingAnimationAtlases` 对 atlas manifest 执行字段校验和建筑/等级键去重，然后并行调用 Pixi `Assets.load` 适配器并返回索引 Map。
- `SimulationCanvas` 接受可选 `buildingAnimationAtlasManifest`；加载成功时创建 `Spritesheet` Provider，失败时记录警告并沿用程序化建筑动效，不中断模拟主循环。
- 新增 2 项加载器测试，验证路径加载、clip 查询、重复键和不完整条目在加载前被拒绝；全量回归 53 个测试文件、338 项通过，构建 2361 个模块通过。
- 生产事实边界保持不变：当前仓库没有真实 DCC atlas 二进制或 manifest，故未宣称图集已经在用户场景中生效。

## 2026-07-17 第一百七十二轮：部件变换与粒子槽位消费

- `BuildingAnimationDriver` 新增 part/particle 两类运行时对象池。part 纹理由 `BuildingAnimationPartProvider` 提供，使用 `BuildingAnimationAnchorProvider` 的归一化坐标定位；轮轴类部件按进度旋转，其他部件按进度做小幅摆动。
- particle 槽位通过独立 Provider 获取粒子纹理，在锚点附近按确定性 phase 产生三枚可复用 Sprite；粒子状态仍由 PrefabAnimationPlan 驱动，不读取墙上时钟或随机数。
- `SimulationCanvas` 现在可以同时接收 atlas manifest 与 `BuildingAnimationDriverOptions`，为真实 DCC 资源注入保留完整入口。
- 验证：53 个测试文件、339 项测试通过；构建 2361 个模块通过；DCC 契约、运行时 PNG 审计和 `git diff --check` 通过。
- 仍未把程序化粒子当成商业特效：当前没有真实部件/粒子纹理和锚点导出，下一步必须在美术机完成资源绑定与浏览器实测。

## 2026-07-17 第一百七十三轮：动画资源与运行时预算门禁

- 资产验证器新增 `ANIMATION_RUNTIME_BUDGETS`，在 JSON 级别限制总动画槽位、part-transform/particle 槽位、每槽位部件和锚点数量。
- 对 `particle` 技术强制要求 LOD3 为 `off`、LOD2 不为 `full`，让远景降级策略成为生产契约而不是运行时约定。
- 自测构造超预算动画清单并确认失败；`main-pier` 和全部 gold sample 仍通过。
- 验证：53 个测试文件、339 项测试通过；构建 2361 个模块通过；资产自测、gold samples、DCC 契约、运行时 PNG 审计和 `git diff --check` 通过。
- 证据边界：预算门禁没有替代 Blender 导出和真实设备性能测试，后者仍是下一阶段输入。

## 2026-07-17 第一百七十四轮：动画运行时压力基准

- `BuildingAnimationDriver` 增加诊断计数接口，记录池化序列/部件/粒子数量及当前可见子节点。
- 新增 300 宿主、150 可见建筑的 Pixi 灰盒压力回归；每个可见建筑最多 5 个动画子节点，第二次同步复用同一批对象。
- `npm run qa:animation-runtime-budget` 已加入可重复执行入口；不把 Node/jsdom 回归误标为真实 GPU 性能。
- 全量回归、构建、资产自测、gold samples、DCC 契约、运行时 PNG 审计均通过。

## 2026-07-17 第一百七十五轮：商业资源包验收门禁

- 新增 `tools/asset-validator/production-package-audit.js`，要求每类金样同时交付九级透明预览、`dcc-export-manifest.json`、`runtime-atlas-manifest.json`、`anchor-manifest.json` 和 `state-evidence.json`。
- 状态证据必须覆盖 constructing、working、blocked、storage_full、serving、idle、ambient；缺任一项即 RED。
- 自测证明完整包 GREEN、删除状态证据后 RED；当前六类金样真实审计全部 RED，说明 DCC/二进制资产仍未落盘。
- 该门禁已经与运行时 atlas loader 和 Provider 接口的交付要求对齐，下一轮可直接接入真实 `main-pier` 包。

## 2026-07-17：第一百七十六轮居民生命周期审计

- 真实模拟链路审计：`SimulationEngine.updateMigrationCandidates` 负责候选人的 waiting/walking 状态与路径，`settleMigrationCandidate` 才创建家庭、居民工人并更新 `populationFlow`；不是把外来人口直接画成已入住居民。
- 修复 `migrateOutDissatisfiedHouseholds` 的数据时序：迁出前保存 worker 的 employer/building occupation，再删除 agent；`departedResidents`、`departuresByOccupation`、`employedWorkersOut` 现在能保留已就业居民事实。
- 回归覆盖：就业家庭因关键需求迁出后，离城档案显示真实职业、就业人数为 1，岗位工人从生产建筑释放，迁出账本归类为 `workshop`。
- 当前集成边界：人物渲染层尚未消费候选/稳定/离城 profile 的完整视觉差异，需在真实浏览器与商业动画资源到位后继续验收。

## 2026-07-17：第一百七十七轮居民生命周期场景接线

- `settleMigrationCandidate` 将迁入来源和结算 tick 写入真实 `HouseholdState`；初始家庭保持无迁入标记，生命周期来源不会被渲染层猜测。
- `AgentVisual` 在既有对象池内增加生命周期状态层：候选人按 walking/arriving/waiting 显示不同颜色和状态点，迁入居民按 24 tick 窗口显示新入住旗标与脉冲高亮。
- 定向渲染/模拟回归和全量回归通过；未引入独立人物实体或改变人口、就业、迁出账本。
- 集成边界保持明确：状态层目前是可验收的运行时灰盒表现，真实 DCC 服饰、人物动画、浏览器截图和目标设备性能数据仍待美术机与浏览器采样。
## 2026-07-17：第一百七十八轮居民生命周期浏览器证据修正

- `GameRuntime` 的 `civilization-resident-timeline` 调试场景现在修改快照后重新创建 `SimulationEngine`，避免只修改 clone 导致 UI 证据丢失。
- `GameRuntime.test.ts` 新增 live-engine fixture 回归，断言候选家庭 `phase: arrived / origin: 候选家庭` 与入住家庭 `phase: settled / origin: 外来家庭` 同时存在。
- 浏览器 runner 对瓶颈抽屉增加幂等判断：`aria-expanded=true` 时不再重复点击；生命周期场景移除无意义的“打开瓶颈”交互。
- 真实浏览器验收通过 `civilization-resident-timeline`，但记录到 GPU stall 与 `texImage2D: bad image data` warning，后续需真实 atlas 与设备采样验证。
## 2026-07-17：第一百七十九轮建筑资源预加载

- `SimulationCanvas` 的场景初始化现在先按当前快照收集建筑 Prefab asset id，再等待 `loadDefaultBuildingArtworkProvider` 完成九级纹理加载。
- `buildingArtwork.ts` 预加载通过 Pixi `Assets.load` 建立解码后的纹理表，随后 Provider 只消费已加载纹理；无预加载纹理仍保留安全降级路径。
- 浏览器验收观察：居民生命周期文本证据保持通过；`texImage2D: bad image data` 消失，仍有 GPU `ReadPixels` stall，需要独立性能采样。

## 2026-07-17：第一百八十轮建筑资源预加载安全门禁

- `buildingArtwork.ts` 增加预加载路径去重、纹理数量预算、15 秒超时和 `AbortSignal` 取消；Pixi 资源失败时由 `SimulationCanvas` 回退到程序化 Provider。
- 场景清理会主动取消未完成的建筑资源门禁，避免异步结果在销毁后的场景中落地。
- 定向回归 47 项、生产构建和 `git diff --check` 通过。
- 未改变真实资产审计结论：当前仍缺真实 `.blend`、atlas、锚点和状态证据包。

## 2026-07-17：第一百八十轮浏览器回归修正

- 发现资源预加载变慢后，居民生命周期调试记录会被正常模拟事件推到最近四条之外，造成浏览器场景偶发缺少“候选家庭”。
- `GameRuntime` 现在仅在 `civilization-resident-timeline` 调试分支刷新两条 fixture 记录，不改变生产时间线的 append-only 行为。
- 第二次真实浏览器回归通过；仍只记录 GPU `ReadPixels` stall，不将其误报为性能通过。

## 2026-07-18：第一百八十一轮帧时间与 GPU 读回归因

- 浏览器 runner 新增 1 秒 `requestAnimationFrame` 采样和 WebGL `readPixels` 计数器。
- `civilization-resident-timeline` 实测 45 帧、平均 23.48ms、P95 34.7ms、最大 67.6ms、画布 1366×768；应用层 `readPixels` 为 0。
- 结论：已排除项目主动像素读回路径，但浏览器/驱动仍报告 GPU stall；下一步必须优化长帧并在真实目标设备复测。

## 2026-07-18：第一百八十二轮 DynamicScene 分段性能采样

- `DynamicScene.sync` 增加可选 `onSyncProfile`，只有 URL 带 `renderProfile=1` 时由 `SimulationCanvas` 写入有限长度的浏览器采样缓冲，默认生产路径不启用高频计时。
- 居民生命周期真实浏览器回归：107 次同步，总耗时平均 0.368ms/P95 0.500ms；建筑平均 0.237ms/P95 0.300ms；居民平均 0.042ms/P95 0.100ms；掉落物平均 0.008ms/P95 0.100ms。
- 同轮 rAF：54 帧/1.017 秒，平均 19.15ms，P95 33.6ms，最大 34.7ms；应用层 `readPixels` 为 0，仍收到浏览器/驱动 GPU stall warning。
- 集成判断：同步 CPU 阶段暂未显示为该场景主瓶颈；不能据此宣称 GPU、动画、真实纹理和目标设备性能已达标。

## 2026-07-18：第一百八十三轮居民动态实体证据

- 将场景同步 profile 从耗时扩展为实体计数：建筑、居民、运输、掉落物、可见实体和对象池。
- 浏览器真实回归稳定采样 88 次：5/3/1/1/14/63；居民生命周期页面仍通过，且实体统计来自 Pixi 动态场景而非 UI 文案。
- 本轮只证明垂直切片中实体创建、可见性和池容量稳定；未将稳定计数解释为高压创建/回收性能通过。
- 保持集成阻塞：真实 `main-pier` DCC/atlas/锚点/状态包、多环境 GPU 基线和生产规模压测仍未完成。

## 2026-07-18：第一百八十四轮三环境性能基线

- 新增统一环境配置与阈值评估：桌面 GPU、软件渲染、嵌入容器代理；严格模式只在显式开启时阻断命令，默认保留完整红线报告。
- 三次真实 Chromium 运行的居民生命周期场景均通过可见文案和 console error 门禁，应用层 `readPixels=0`，DynamicScene 同步 P95 分别为 0.5ms、0.8ms、1.1ms。
- 帧时间门禁全部未通过：桌面 GPU平均/P95 19.90/33.4ms，软件 30.41/48.6ms，嵌入代理 31.34/50ms；嵌入代理最大 65.8ms。
- 集成判断：性能基线基础设施完成，但不能宣称商业级帧率；GPU stall warning 在三组环境仍需结合真实目标设备与合成层进一步定位。

## 2026-07-18：第一百八十五轮静态失效优化

- `BuildingVisual` 对静态建筑主体、稳定建筑 artwork 与空闲占位几何引入签名失效判断；状态变化、等级变化或资源变化仍会重绘，施工、波纹、灯火、炊烟和居民动画不被静态缓存吞掉。
- 修复 artwork 签名未变化时占位层可能被 fallback pass 重新打开的问题。
- 三环境重复采样结果：桌面 GPU 36.96/51.9/98.1ms，软件 29.05/35.2/35.4ms，嵌入代理 35.63/50.1/50.8ms（平均/P95/最大）；同步 P95 0.5/0.8/0.5ms，应用层 readPixels 均为 0。
- 集成判断：代码级优化和回归通过，但采样未证明性能改善，且 headless 结果波动增大；下一轮先补重复采样统计与阶段归因，再决定是否保留更激进的渲染策略。

## 2026-07-18：第一百八十六轮重复性能采样契约

- 性能执行器现在默认按环境重复 3 次，并同时输出聚合样本与 `rawSamples`；帧时间使用中位数，应用层 `readPixels` 使用最大值，避免离群长帧或读回被统计方法掩盖。
- 新增契约测试覆盖中位数和最差值规则；定向 18 项、全量 350 项测试和生产构建通过。
- 本轮没有重新执行完整 9 次浏览器矩阵，性能结论仍沿用上一轮 RED，不把统计工具改造当作帧率改善。

## 2026-07-19：第一百八十七轮三环境重复性能实测

- 运行 `npm run qa:performance-baseline`，每环境 3 次；9 次场景均通过文本和 console error 门禁，应用层 `readPixels=0`。
- 聚合帧时间：桌面 GPU 42.37/66.6/68.2ms，软件渲染 42.36/64.8/66.6ms，嵌入代理 53.57/67.1/67.1ms（平均/P95/最大）；DynamicScene 同步 P95 为 0.6/1.1/1.4ms。
- 集成判断：重复采样提高了证据质量，但帧时间门禁仍 RED；不能把 GPU 驱动警告直接归因于业务代码，也不能在未做渲染提交/合成对照实验前宣称已定位根因。

## 2026-07-19：第一百八十八轮 Pixi 渲染提交归因

- 在 `renderProfile=1` 下包裹 Pixi `renderer.render`，浏览器报告与 DynamicScene profile 分离的提交耗时；生产默认不包裹。
- 桌面 GPU 单场景：DynamicScene 总同步 P95 0.8ms，renderer.render 平均 1.818ms/P95 4.3ms/最大 62.1ms；场景功能和应用层 `readPixels=0` 通过。
- 集成判断：renderer 长尾与帧长同时存在，值得继续调查；但仍不能直接断定是 Pixi、纹理上传、驱动或浏览器合成层造成。

## 2026-07-20：第一百八十九轮渲染差分开关

- `SimulationCanvas` 读取 `renderProfile=1` 下的三个独立诊断参数：`disableArtwork=1`、`disableAnimation=1`、`disableTerrain=1`；正常 URL 不改变 authored artwork、动画图集或地形加载。
- browser runner 通过 `BROWSER_E2E_RENDER_QUERY` 注入参数，并输出 `renderConfiguration`，避免把“尝试关闭某层”误当作已生效。
- 桌面 GPU 单场景禁用 artwork/animation 验证：配置回传正确，场景功能通过，DynamicScene P95 0.6ms、renderer.render P95 2.4ms、应用层 readPixels 0；最大提交耗时 74.3ms仍提示长尾。
- 全量测试与构建通过；本轮不合并性能收益结论，后续必须按同一场景成组比较 full / no-artwork / no-animation / no-terrain。
- 新增 `tools/qa/run-render-ablation.ts`，把四种模式、重复采样和中位数聚合固化为可复用命令；由于嵌套本地预览进程在当前执行环境未稳定返回正式矩阵，暂不写入性能数字。

## 2026-07-21：第一百九十一轮运行时资源预算门禁

- 新增 `runtime-artwork-budget-audit.js`，使用 PNG IHDR 和文件统计计算单张、单建筑包、全量下载和解码 RGBA 预算，不把压缩文件大小误当作显存使用量。
- 当前审计结果为 28 个建筑包、252 个文件、125,331,330 bytes 下载、264,241,152 bytes 解码 RGBA；全量下载预算 96 MiB 超标，门禁保持 RED。
- 由于运行时现在只预加载当前快照等级，目录全量体积不能直接等同于首屏体积；下一步需补首屏/升级/远景 LOD 分层统计，而不是简单放宽预算。

## 2026-07-21：第一百九十二轮 384px 运行时发行层

- 使用系统图像缩放从 512px 源资产生成独立 `buildings-runtime-384` 目录，未覆盖或修改源 PNG；运行时路径解析改为该发行层。
- `asset:runtime-artwork:release-audit` 通过 28 个建筑文件夹、252 张唯一 384×384 RGBA 图；`asset:runtime-artwork:budget` 通过 51,926,857 bytes 下载和 148,635,648 bytes 解码内存。
- 这是发行层体积优化，不等同于商业美术质量验收；真实 DCC/atlas 到位后必须由同一流水线生成，而不是继续依赖当前派生图。
- 运行时切换后的真实 `civilization-resident-timeline` 浏览器场景通过，5 个建筑和居民/运输实体仍可见，`readPixels=0`；帧时间仍受 headless GPU 波动影响。

## 2026-07-21：第一百九十三轮运行时派生流水线

- `build-runtime-artwork-derivatives.js` 已从逐文件执行改为按建筑目录批量调用 `sips`，可重复生成全量 252 张 384px 图并输出 provenance manifest。
- `runtime-artwork-audit --runtime` 增加 manifest schema、文件数和尺寸校验；预算和构建均通过。
- 这条流水线只证明发行层可重复构建，不证明源 PNG 的建筑设计质量，也不替代 Blender 导出的真实 atlas、动画、锚点和状态证据。

## 2026-07-21：第一百九十轮建筑贴图按需预加载

- `BuildingArtworkPreloadOptions.preloadLevels` 允许调用方按当前快照等级生成预加载清单；默认行为仍保留完整九级清单，保证独立工具和旧调用兼容。
- `SimulationCanvas` 将当前建筑等级集合传入预加载器，未出现的等级不在启动阶段上传，后续由现有 lazy Provider 获取。
- 方向性样本显示完整模式仍明显高于无原画模式，但样本量和 headless 驱动稳定性不足以直接量化收益；集成结论保持“优化已接入、商业门禁未通过”。

## 2026-07-21：第一百九十四轮文明规模压力场景

- `createStressScenario(TARGET_STRESS_SIZE)` 现在有专门规模验收：500 户、300 栋、150 个初始 agent；`DynamicScene` 在完整视口内连续两次同步后仍为 300 building / 135 resident / 15 transport，450 个实体可见。
- `CivilizationLongRunReport` 增加 `scaleBaseline`，30 天长跑检查明确锁定目标规模，而不是只检查“不超过上限”。
- 长跑结果：7,200 tick 后仍为 500 户、300 栋、226 个动态 agent；人口 1,750，物流效率 99.998%，数值审计为空，运营阻塞 172 栋、服务队列 42，符合压力系统会产生真实后果的预期。
- 该产物只证明模拟规模和场景对象生命周期，不证明目标设备帧率；下一步需在浏览器夹具中接入规模快照，避免把单元/仿真测试替代真实 GPU 证据。

## 2026-07-21：第一百九十五轮真实浏览器规模压力场景

- `GameRuntime` 新增 `civilization-scale` 运行时夹具，复用统一 `createStressScenario`，并通过 `compactStressScenarioForViewport` 将 QA 实体稳定放入首屏安全区域；生产默认场景不受影响。
- 浏览器场景契约增加实体最小值断言，runner 对 `buildings/residents/transport/visible` 读取真实 `SceneSyncPerformanceProfile`，不再只检查页面文案。
- 真实运行：规模和功能通过，visible 335–351；但帧时间和 renderer 长尾严重超标，性能验收保持 RED。当前不允许把该夹具或灰盒视觉当作商业级成品。

## 2026-07-21：第一百九十六轮动态场景快照缓存

- `DynamicScene.sync` 通过 snapshot 引用、tick、建筑/人物/掉落/区域引用和相机键判断是否需要完整同步；同一快照的重复 ticker 帧不再重建 Graphics，镜头变化只做可见性刷新。
- 保持原有状态正确性：快照 tick 变化、建筑集合替换和同一对象内的状态修改测试均通过；缓存不会把升级或阻塞状态冻结。
- 浏览器方向性结果：DynamicScene 和 renderer 平均耗时下降，但 rAF 长尾没有改善，说明剩余瓶颈在 GPU 提交、纹理/画布上传或浏览器合成路径，需继续隔离。

## 2026-07-21：第一百九十七轮抗锯齿与分辨率差分

- `RenderDiagnosticsConfig` 新增抗锯齿和分辨率覆盖字段；`SimulationCanvas` 只在 URL 诊断参数存在时改变 renderer 初始化，正式默认不变。
- `civilization-scale` 真实浏览器复测使用 `disableAntialias=1&resolution=1`：实体门禁通过，visible 331–348，应用层 readPixels 仍为 0，浏览器仍有 GPU stall 警告。
- 1x/无抗锯齿使 rAF 平均从上一轮 129.14ms 降至 54.35ms，renderer 平均从 6.885ms 降至 5.26ms；但 P95 仍为 83.3ms，说明该设置只能作为归因工具，不能作为商业成品方案。

## 2026-07-21：第一百九十八轮建筑静态缓存实验

- 建筑主体与原画 Sprite 进入独立 `staticLayer`，保留状态、施工、居民与环境动效在动态层；`staticBuildingCache=1` 仅用于实验。
- 全画质压力场景开启缓存后，renderer 平均/P95/最大 8.953/31.8/160ms，rAF 平均/P95/最大 122.26/166.4/166.4ms；比无缓存基线更差。
- 已将该结果判定为否证：独立缓存纹理不是当前 300 栋规模的正确发行路径，不能默认开启；应转向共享纹理图集与按视口上传。

## 2026-07-21：第一百九十九轮共享建筑 atlas

- 新增可重复生成器 `tools/art-pipeline/build-runtime-artwork-atlases.js`，从 `buildings-runtime-384` 生成每类建筑一张 3×3 atlas，并输出 `runtime-artwork-atlas-manifest.json`；本轮实际产出 28 张 atlas、252 帧。
- `buildingArtwork.ts` 新增 manifest 类型、atlas loader 和 provider；`SimulationCanvas` 通过 `buildingAtlas=1` 选择该路径，默认正式配置不变。每个等级仍以独立 `Rectangle` 帧渲染，建筑视觉内容没有被合并或降级。
- 浏览器差分结果：atlas 单次采样相较独立 PNG 降低 rAF 平均 41.36→37.66ms、P95 66→50ms，renderer 平均 1.714→1.497ms；结果方向正确但统计样本不足，且商业门禁仍 RED。
- 构建、运行时资产审计、预算审计和 9 项定向测试通过。当前不允许把“图集存在”表述为商业级性能完成；下一轮必须做多重复、多环境和视口 LOD 证据。

## 2026-07-22：第二百轮共享 atlas 正式默认

- 将 `RenderDiagnosticsConfig.buildingAtlas` 默认值改为 `true`；`disableAtlas=1` 是唯一显式独立 PNG 对照/降级开关。
- 生产启动仍有安全回退：atlas manifest 或纹理加载失败时回到独立 PNG provider，不阻塞城市进入运行态。
- 本轮构建与 9 项定向测试通过。多次浏览器差分出现无 JSON 返回的执行器生命周期问题，未将其计入性能结论；这已转为独立 QA 任务，不能用失败采样替代证据。

## 2026-07-22：第二百零一轮 WebP atlas 发行优化

- atlas 生成器支持 WebP，并将 `public/assets/buildings-runtime-atlas-webp/` 设为默认发行目录；PNG 仍保留为可回退与对照路径。
- 本轮实际生成 28 张 WebP atlas、252 个 384px 等级帧，约 16.80 MiB；新增完整性审计，生成、审计、构建和定向测试均通过。
- `buildingArtwork.ts` 的正式 atlas provider 已使用 WebP manifest；缺失或加载异常继续回退独立 PNG，未改变建筑等级视觉帧。
- 默认桌面浏览器回归功能通过，但平均/P95/最大 rAF 32.79/49.3/66.7ms，商业性能仍未通过；差分 runner 的多次执行生命周期问题继续单列处理。

## 2026-07-23：第二百零二轮渲染差分生命周期修复

- `tools/qa/run-render-ablation.ts` 现在等待子进程 `close`，统一处理超时、错误、stdout 管道和重复 settle，并在 Unix 下以进程组方式终止浏览器 runner 及其子进程。
- `tools/browser-e2e/run-browser-e2e.cjs` 对 Vite preview 使用独立进程组；浏览器关闭和服务清理由带超时的统一函数完成，避免多轮差分留下端口或浏览器进程。
- 真实矩阵结果：桌面 GPU `full/no-atlas` 各 2 次，软件渲染和嵌入容器各覆盖 full/no-atlas/no-artwork/no-animation/no-terrain 1 次；全部稳定返回 JSON，配置回传正确，readPixels 均为 0。
- 观测属于居民垂直切片，rAF 接近 60Hz 调度值；未覆盖 300 栋压力场景，因此没有把本轮结果写成商业性能通过。

## 2026-07-23：第二百零三轮目标规模全画质差分

- 修正 `civilization-scale` 场景契约：压力场景默认走完整 authored artwork/animation/terrain；`run-render-ablation` 的禁用模式负责显式构造差分夹具，新增测试锁定该语义。
- 桌面 GPU 目标规模全画质样本：rAF 41.33/66.6/66.6ms，renderer 3.783/10.6/97.4ms，render sync P95 6.1ms；配置回传为 authoredArtwork=true、authoredAnimation=true、terrain=true、buildingAtlas=true，readPixels=0。
- 同规模 no-atlas 为 46.39/66.8/66.9ms；no-artwork、no-animation、no-terrain 也均稳定返回并通过实体/功能/readPixels 门禁。全画质和图集差异均未达到 16.7ms 帧预算。
- 该轮有效证明了目标规模渲染夹具和生命周期，不证明商业设备帧率；下一步继续解决渲染长尾与资源上传策略。

## 2026-07-23：第二百零四轮视口预裁剪

- `src/rendering/DynamicScene.ts` 增加统一 `syncVisual` 预裁剪路径：建筑、区域、居民、迁移候选和掉落在进入 `visual.update` 前先判断等距视口；不可见项只更新世界坐标并隐藏，镜头重新覆盖时再触发视觉刷新。
- `src/rendering/DynamicScene.test.ts` 新增远端建筑在镜头移入后恢复可见的回归，避免裁剪优化造成实体永久不刷新。
- 目标规模 full 复测显示 renderer 平均/P95 从 3.783/10.6ms 降至 3.146/8.1ms；rAF 仍为 41.02/66.6ms，商业帧率门禁保持 RED。该结果支持继续推进可见区域 LOD 与资源提交优化，不支持关闭性能风险项。
