# 多会话任务看板

| ID | 会话职责 | 写入范围 | 状态 | 集成条件 |
| --- | --- | --- | --- | --- |
| PERF-TICKER-MATRIX-01 | 三环境目标规模 ticker 性能矩阵 | `src/qa/performanceBaseline.ts`, `src/qa/performanceBaseline.test.ts`, `docs/project/**` | 已完成 | `qa:performance-baseline` 在三环境目标规模样本中聚合 ticker 指标，并确认红灯更接近浏览器/ticker 调度层 |
| RENDER-TICKER-PROFILE-01 | Pixi ticker 阶段计时诊断 | `src/components/SimulationCanvas.tsx`, `src/rendering/types.ts`, `tools/browser-e2e/**`, `tools/qa/run-render-ablation.ts`, `docs/project/**` | 已完成 | 目标规模浏览器报告同时输出 rAF、renderer、scene sync 和 ticker delta/elapsed，定位红灯不主要来自 `DynamicScene.sync` |
| RENDER-STEADY-PROFILE-WINDOW-01 | 稳态渲染采样窗口 | `tools/browser-e2e/run-browser-e2e.cjs`, `tools/qa/run-render-ablation.ts`, `docs/project/**` | 已完成 | 浏览器断言稳定后重置 profile 样本并输出 `steady-state-after-assertions`，区分启动期与运行期长尾 |
| RENDER-BUILDING-LOD-ABLATION-01 | 建筑 LOD 目标规模对照矩阵 | `tools/qa/run-render-ablation.ts`, `tools/browser-e2e/**`, `src/qa/**`, `src/rendering/visuals.ts`, `docs/project/**` | 已完成 | `full` 与 `no-building-lod` 可在目标规模浏览器矩阵中复跑，且 reduced 更新不再重复清空动效图形 |
| RENDER-BUILDING-LOD-01 | 目标规模建筑细节 LOD | `src/rendering/**`, `src/components/SimulationCanvas.tsx`, `src/qa/**`, `tools/browser-e2e/**`, `docs/project/**` | 已完成 | 300 栋目标规模场景中 96 栋近景保留 full detail，204 栋远景 reduced，并进入浏览器性能统计 |
| PREVIEW-CONTINUOUS-DEPLOY-01 | 真实游戏持续预览站 | `netlify.toml`, `.gitignore`, `docs/project/**` | 已完成 | 公网地址直接运行当前 Vite/Pixi 游戏；GitHub 推送自动触发构建与发布 |
| PM-LAUNCH-PLAN-01 | 商业级完整上线总计划 | `docs/project/commercial-launch-master-plan.md` | 已完成 | 明确最终上线目标、阶段产出、生产线、自动执行机制 |
| PM-DASHBOARD-01 | 进度仪表盘 | `docs/project/progress-dashboard.md` | 已完成 | 阶段、完成度、风险、下一轮任务可检查 |
| PM-ARTIFACT-INDEX-01 | 项目真实产物索引 | `docs/project/artifact-index.md` | 已完成 | 每轮实际新增/修改文件可追踪 |
| WORLD-BIBLE-01 | 统一年代设定 | `docs/project/design/world-bible.md` | 已完成 | 架空明清江南水乡白/黑名单明确 |
| BUILDING-TAXONOMY-01 | 可扩展建筑与街区体系 | `docs/project/design/building-taxonomy.md` | 已完成 | 不再限制 28 类，六阶段城市和街区繁荣明确 |
| POP-LIFECYCLE-01 | 外来人口生命周期设计 | `docs/project/design/population-lifecycle.md` | 已完成 | 抵达、找房、临时停留、入住、生活、离城明确 |
| ART-ROADMAP-01 | 美术全阶段生产计划 | `docs/project/design/art-production-roadmap.md` | 已完成 | ART-P0 到 ART-P11、角色分工和门禁明确 |
| DOC-SYNC-20260627 | 旧规划方向同步 | `docs/project/README.md`, `docs/project/commercial-civilization-target.md`, `docs/project/production-pipeline.md`, `docs/project/gates.md` | 已完成 | 旧岛屿/听歌/28 类主线被降级，商业级城市模拟口径统一 |
| DOC-SYNC-20260627B | 完整上线总计划与美术全阶段一致性补强 | `docs/project/commercial-launch-master-plan.md`, `docs/project/production-pipeline.md`, `docs/project/gates.md`, `docs/project/task-board.md`, `docs/project/progress-dashboard.md`, `docs/project/artifact-index.md`, `docs/project/integration-log.md` | 已完成 | 商业级最终上线计划、美术 ART-P0–P11、自动执行机制和旧口径冲突完成同步 |
| PM-EXECUTION-STRATEGY-01 | 目标与执行节奏校准 | `docs/project/execution-strategy.md`, `docs/project/README.md`, `docs/project/HANDOFF.md`, `docs/project/progress-dashboard.md`, `docs/project/commercial-launch-master-plan.md` | 已完成 | 最终商业级总目标保持不变，当前阶段切到 P1.5 垂直切片收敛期，并建立 Tier 0-4 验证分级 |
| VISUAL-SLICE-STARTER-01 | Starter 建筑第一眼改观 | `src/rendering/**`, `src/components/SimulationCanvas.tsx`, `docs/project/**` | 已完成 | 民居、粮仓、集市、码头和稻田在主画布上有更大轮廓、更强功能差异和截图验收 |
| VISUAL-STREET-DISTRICT-01 | 道路与街区质感 | `src/rendering/**`, `src/styles.css`, `docs/project/**` | 已完成 | 石路、土路、桥面、水波、岸线和田地纹理让城市结构更清楚 |
| VISUAL-ACTIVITY-FEEDBACK-01 | 活动密度与状态反馈 | `src/rendering/**`, `src/integration/**`, `docs/project/**` | 已完成 | 居民、货车、服务访问、货运取送、通勤和异常状态在地图上更容易看见 |
| POP-MIGRATION-ENGINE-01 | 外来人口状态机实现 | `src/simulation/core/**`, `src/simulation/contracts.ts` | 已完成 | 人口不再凭空入住，抵达/等待/入住/离城可测 |
| CITY-ATTRACTION-01 | 城市吸引力评分 | `src/simulation/**`, `src/integration/**`, `src/App.tsx` | 已完成 | 空房、岗位、食物、税率、满意度和物流影响迁入，指标栏可见 |
| POP-MIGRATION-VISUAL-01 | 候选外来人口可见反馈 | `src/simulation/**`, `src/rendering/**`, `src/integration/**` | 已完成 | 等房候选人在地图可见，小事流可定位临时停留点 |
| POP-MIGRATION-PATH-01 | 候选外来人口进城路径 | `src/simulation/core/**`, `src/integration/**` | 已完成 | 候选人先从停留点沿路径走到住宅，抵达后才正式入住 |
| POP-MIGRATION-ROAD-PATH-01 | 候选外来人口道路优先寻路 | `src/simulation/core/**` | 已完成 | 有道路网格时优先沿道路/入口进城，无格子时安全退回直线路径 |
| SHARED-MOVEMENT-PATH-01 | 共享移动路径服务 | `src/simulation/world/**`, `src/simulation/core/SimulationEngine.ts` | 已完成 | 候选外来人口使用可复用道路优先路径服务，后续居民/物流可逐步接入 |
| LOGISTICS-SHARED-PATH-01 | 物流共享移动路径 | `src/simulation/world/**`, `src/simulation/economy/logistics.ts` | 已完成 | 物流 RoadRoutePlanner 复用共享路径服务，避开水面/建筑占用，并在无路时失败而不是直线穿越 |
| LOGISTICS-CARRIER-LIFECYCLE-01 | 承运人货运生命周期 | `src/simulation/contracts.ts`, `src/simulation/economy/logistics.ts`, `src/rendering/visuals.ts` | 已完成 | 承运人 agent 记录取货/送货阶段、资源、数量和订单，并在地图上显示取货/载货状态 |
| LOGISTICS-UNLOAD-QUEUE-01 | 目的建筑卸货吞吐与积压 | `src/simulation/contracts.ts`, `src/simulation/economy/logistics.ts`, `src/integration/stageAdvisor.ts` | 已完成 | 多订单同 tick 到达同一目的建筑时受卸货能力限制，未卸货订单形成可观察 `logisticsQueues` |
| WORKER-COMMUTE-PATH-01 | 工人通勤路径接入 | `src/simulation/core/SimulationEngine.ts` | 已完成 | 工人获得工作岗位后生成共享道路通勤路径，并逐 tick 移动到雇主入口后进入 working 状态 |
| WORKER-RETURN-HOME-01 | 工人返家循环 | `src/simulation/core/SimulationEngine.ts`, `src/simulation/contracts.ts` | 已完成 | 工人完成固定工作班次后生成共享道路返家路径，逐 tick 回到住宅入口并恢复 home 状态 |
| SERVICE-VISIT-PATH-01 | 居民服务/购物出行可视化 | `src/simulation/economy/service.ts` | 已完成 | 服务成功时生成居民出行 agent，沿共享道路从住宅到服务建筑并返家，避免同类访问重复刷屏 |
| SERVICE-ARRIVAL-CHECKOUT-01 | 居民抵达后服务结算 | `src/simulation/economy/service.ts`, `src/simulation/core/SimulationEngine.ts`, `src/simulation/contracts.ts` | 已完成 | 市场购买、药铺/书院/戏台服务在居民抵达建筑后才扣库存、扣收入、加税收和恢复需求 |
| SERVICE-QUEUE-CAPACITY-01 | 服务容量与排队快照 | `src/simulation/contracts.ts`, `src/simulation/economy/service.ts`, `src/integration/stageAdvisor.ts` | 已完成 | 服务建筑每 tick 吞吐、多余家庭排队、等待 tick 和治理图层排队热点可观察 |
| TAXONOMY-RUNTIME-01 | 可扩展建筑分类运行时 | `src/content/**`, `src/simulation/**`, `src/integration/GameRuntime.ts` | 已完成 | 建筑类别从固定清单转为阶段/功能/年代一致分类 |
| BUILD-MENU-STAGE-01 | 城建菜单阶段解锁 | `src/content/**`, `src/integration/GameRuntime.ts`, `src/App.tsx` | 已完成 | 城建菜单按城市阶段显示/锁定建筑，运行时也拒绝未解锁放置 |
| CITY-STAGE-GOALS-01 | 城市阶段晋升提示 | `src/content/**`, `src/App.tsx`, `src/styles.css` | 已完成 | 玩家可看到当前阶段、下一阶段以及人口/吸引力/街区晋升条件 |
| CITY-STAGE-ADVISOR-01 | 城市阶段可点击顾问 | `src/content/**`, `src/App.tsx`, `src/styles.css` | 已完成 | 阶段条件可点击，人口/吸引力/街区缺口会切工具、开瓶颈或定位街区 |
| CITY-STAGE-DIAGNOSIS-01 | 城市阶段原因诊断 | `src/content/**`, `src/App.tsx`, `src/styles.css` | 已完成 | 阶段顾问显示住房、岗位、满意度、物流、街区等具体卡点 |
| CITY-STAGE-OVERLAY-01 | 城市阶段地图覆盖提示 | `src/integration/**`, `src/components/SimulationCanvas.tsx`, `src/App.tsx`, `src/styles.css` | 已完成 | 阶段顾问点击后在地图标出住房、外来人口、瓶颈建筑或街区核心 |
| CITY-STAGE-LAYER-01 | 城市阶段分层覆盖标记 | `src/integration/**`, `src/components/SimulationCanvas.tsx`, `src/styles.css` | 已完成 | 住房、外来人口、吸引力瓶颈和街区核心使用分层类型与短标签显示 |
| CITY-STAGE-LAYER-SWITCH-01 | 城市阶段覆盖图层开关 | `src/integration/**`, `src/App.tsx`, `src/styles.css` | 已完成 | 阶段面板可切换住房容量、服务覆盖、物流拥堵和道路连通图层 |
| CITY-STAGE-LOGISTICS-PATH-01 | 城市阶段物流线路覆盖 | `src/integration/**`, `src/components/SimulationCanvas.tsx`, `src/styles.css` | 已完成 | 物流图层除发货/收货点外显示订单线路和方向 |
| CITY-STAGE-LOGISTICS-HOTSPOT-01 | 城市阶段物流热点诊断 | `src/integration/**` | 已完成 | 物流图层标出多条未完成订单共同压到的建筑热点 |
| CITY-STAGE-SERVICE-RANGE-01 | 城市阶段服务范围覆盖 | `src/integration/**`, `src/components/SimulationCanvas.tsx`, `src/styles.css` | 已完成 | 服务图层除服务点外显示半透明服务范围 |
| CITY-STAGE-SERVICE-GAP-01 | 城市阶段服务缺口诊断 | `src/integration/**` | 已完成 | 服务图层标出不在服务范围内的住宅 |
| CITY-STAGE-ROAD-GAP-01 | 城市阶段道路缺口诊断 | `src/integration/**` | 已完成 | 道路图层按住宅、服务、仓储、生产细分缺路入口 |
| CITY-ACTIVITY-HEATMAP-01 | 城市活动热力图层 | `src/integration/stageAdvisor.ts`, `src/App.tsx`, `src/styles.css` | 已完成 | 服务访问、工人通勤和货运路线汇总成活动热力点、活动路径和结构化指标 |
| CITY-ACTIVITY-PRESSURE-01 | 城市活动压力治理卡 | `src/integration/stageAdvisor.ts`, `src/App.tsx` | 已完成 | 活动图层拆出道路压力、服务热度和货运拥堵读数，并能生成可点击治理卡 |
| CITY-ROAD-PRESSURE-CELLS-01 | 道路格活动压力投射 | `src/integration/stageAdvisor.ts`, `src/App.tsx` | 已完成 | 活动压力读取 agent 剩余路径并投射到真实道路格，显示可定位道路承压点 |
| CITY-ACTIVITY-RECOMMENDATION-01 | 活动压力分流建议 | `src/integration/stageAdvisor.ts` | 已完成 | 城市活动压力按货拥、服务热和道压分别推荐补仓储、补服务点或铺路分流 |
| CITY-RECOMMENDATION-UNLOCK-01 | 治理卡推荐阶段可用性 | `src/integration/stageAdvisor.ts`, `src/App.tsx` | 已完成 | 建筑推荐会说明当前阶段/所需阶段，未解锁时降级为查看图层且 UI 禁止切换到未解锁建筑工具 |
| CITY-RECOMMENDATION-EXECUTION-01 | 治理卡推荐营造可执行性 | `src/integration/stageAdvisor.ts`, `src/App.tsx` | 已完成 | 已解锁建筑推荐会诊断连续空地和入口道路，当前不可放置时 UI 不切换到建筑工具 |
| CONSTRUCTION-COST-01 | 正式建筑营造成本 | `src/simulation/economy/construction.ts`, `src/integration/GameRuntime.ts`, `src/integration/stageAdvisor.ts` | 已完成 | 建筑放置消耗财政和城市仓储材料，治理卡能诊断材料/银两不足 |
| CONSTRUCTION-ECONOMY-TABLE-01 | 可调营造经济表 | `src/simulation/economy/construction.ts`, `src/simulation/economy/constructionTable.test.ts`, `docs/project/economy-balancing.md` | 已完成 | 默认营造成本表可导出、可校验、可替换，默认数值保持兼容并补平衡审计 |
| UPGRADE-ECONOMY-TABLE-01 | 升级成本接入经济表 | `src/simulation/economy/construction.ts`, `src/simulation/economy/upgrades.ts`, `src/simulation/economy/*test.ts`, `docs/project/economy-balancing.md` | 已完成 | 建筑升级成本进入 `ConstructionEconomyTable.upgradeCosts`，自定义表可影响升级扣料且默认曲线兼容 |
| UPGRADE-CATEGORY-CURVES-01 | 分类型升级曲线 | `src/simulation/economy/construction.ts`, `src/simulation/economy/upgrades.ts`, `src/simulation/economy/*test.ts`, `src/integration/GameRuntime.test.ts`, `docs/project/economy-balancing.md` | 已完成 | 升级成本支持 `defaultCurve` / `categoryCurves` / `typeCurves` 三层曲线，运行时按建筑定义报价和扣料 |
| BUILD-MENU-COST-01 | 建造菜单成本与缺口 | `src/content/runtimeBuildings.ts`, `src/App.tsx`, `src/styles.css` | 已完成 | 建造菜单显示银两/材料成本、缺口和是否可营造 |
| GOVERNANCE-PLACEMENT-FOCUS-01 | 治理卡推荐落点提示 | `src/integration/stageAdvisor.ts`, `src/App.tsx`, `src/styles.css` | 已完成 | 点击建筑类治理建议会在地图标出建议落点和入口，并在建造菜单标出推荐建筑 |
| GOVERNANCE-PLACEMENT-FOOTPRINT-01 | 治理卡推荐占地预览 | `src/integration/stageAdvisor.ts`, `src/components/SimulationCanvas.tsx`, `src/styles.css` | 已完成 | 点击建筑类治理建议会显示真实建筑 footprint、入口格和推荐建筑高亮 |
| BUILD-PLACEMENT-PREVIEW-01 | 建筑工具动态试放预览 | `src/integration/GameRuntime.ts`, `src/components/SimulationCanvas.tsx`, `src/styles.css` | 已完成 | 选择建筑工具后，地图 hover 显示 footprint、入口和冲突原因，且预览不扣资源不落建筑 |
| BUILD-PLACEMENT-CONTROLLER-01 | 建筑试放状态机接入 | `src/ui/placement/**`, `src/components/SimulationCanvas.tsx` | 已完成 | 选择、移动、旋转、确认、取消和重复放置由 PlacementController 驱动 |
| BUILD-PLACEMENT-AFFORDABILITY-01 | 建筑试放资源门禁 | `src/integration/GameRuntime.ts`, `src/integration/GameRuntime.test.ts` | 已完成 | 地块可放但银两/材料不足时，试放预览直接变为不可营造并显示缺口 |
| ROAD-DRAG-BUILD-01 | 道路拖拽连续铺设 | `src/integration/GameRuntime.ts`, `src/components/SimulationCanvas.tsx` | 已完成 | 道路工具拖拽调用批量铺路 API，连续修改真实路网并汇总跳过格 |
| ROAD-DEMOLISH-01 | 道路拆除工具 | `src/integration/GameRuntime.ts`, `src/components/SimulationCanvas.tsx`, `src/App.tsx` | 已完成 | 拆路工具可拖拽批量删除真实道路并汇总无路/越界跳过格，暂不拆建筑 |
| ROAD-FISCAL-COST-01 | 道路铺设财政成本 | `src/simulation/economy/construction.ts`, `src/integration/GameRuntime.ts`, `src/integration/GameRuntime.test.ts` | 已完成 | 石板路铺设消耗财政，余额不足时只铺可支付路段；已有道路不重复扣费 |
| BUILDING-DEMOLISH-CONSISTENCY-01 | 建筑拆除一致性 | `src/integration/GameRuntime.ts`, `src/integration/GameRuntime.test.ts`, `src/App.tsx`, `src/styles.css` | 已完成 | 拆除建筑会释放地块、迁出失去住宅的家庭、释放岗位并取消关联物流 |
| BRIDGE-BUILD-TOOL-01 | 桥梁专门建造模式 | `src/integration/GameRuntime.ts`, `src/components/SimulationCanvas.tsx`, `src/App.tsx` | 已完成 | 桥梁工具可在水面/岸边拖拽架桥，成本高于普通道路，普通陆地会被拒绝 |
| BRIDGE-VISUAL-STYLE-01 | 桥梁专属道路视觉 | `src/rendering/roads.ts`, `src/components/SimulationCanvas.tsx`, `src/rendering/roads.test.ts` | 已完成 | 桥梁使用独立填色、描边、桥墩和更宽桥面，不再完全复用普通石板路视觉 |
| ROAD-CONNECTIVITY-DIAGNOSIS-01 | 道路/桥梁连通诊断 | `src/integration/stageAdvisor.ts`, `src/integration/stageAdvisor.test.ts`, `src/App.tsx` | 已完成 | 道路图层能识别建筑入口贴着孤立路网但未连到主路网，并在阶段面板显示未连通/孤立读数 |
| ROAD-CONNECTIVITY-GOVERNANCE-01 | 道路未连通治理卡 | `src/integration/stageAdvisor.ts`, `src/integration/stageAdvisor.test.ts` | 已完成 | 未连通入口/孤立路网会生成高优先级治理卡，引导玩家接回主路网 |
| ROAD-LINK-RECOMMENDATION-01 | 道路/桥梁补线建议 | `src/integration/stageAdvisor.ts`, `src/integration/stageAdvisor.test.ts` | 已完成 | 孤立路网会输出到主路网最近边界的建议接路/补桥路径，供地图覆盖层绘制 |
| ROAD-LINK-CONSTRUCTION-PLAN-01 | 道路/桥梁补线施工计划 | `src/integration/stageAdvisor.ts`, `src/integration/stageAdvisor.test.ts` | 已完成 | 补线治理建议会拆出可施工道路/桥梁格，并给出银两成本、缺口和可支付状态 |
| ROAD-LINK-PLAN-UI-01 | 补线施工计划 UI 摘要 | `src/App.tsx`, `src/ui/cityAdvisorUi.ts`, `src/integration/stageAdvisor.ts`, `src/styles.css` | 已完成 | 治理卡可显示补线路/桥格数、银两成本和缺口，点击推荐会保留补线 overlay 高亮数据 |
| ROAD-LINK-ONE-CLICK-01 | 补线计划一键施工 | `src/integration/GameRuntime.ts`, `src/integration/GameRuntime.test.ts`, `src/App.tsx` | 已完成 | 治理卡 roadPlan 可自动执行混合道路/桥梁施工，按财政逐格处理并反馈跳过/缺钱 |
| ROAD-LINK-E2E-SCENARIO-01 | 孤立路网调试/E2E 场景 | `src/integration/GameRuntime.ts`, `src/ui/runtimeOptions.ts`, `src/App.tsx` | 已完成 | URL 可稳定打开孤立路网场景，浏览器覆盖 roadPlan 卡出现、一键施工和补线提示清理 |
| ROAD-LINK-LOW-TREASURY-E2E-01 | 补线财政不足调试场景 | `src/integration/GameRuntime.ts`, `src/ui/runtimeOptions.ts`, `src/integration/GameRuntime.test.ts` | 已完成 | URL 可稳定打开补线缺钱场景，验证 roadPlan 不可支付、点击失败不扣钱并保留施工提示 |
| ROAD-LINK-QA-COMMAND-01 | 道路补线场景 QA 命令 | `src/qa/roadPlanScenarios.ts`, `src/qa/roadPlanScenarios.test.ts`, `package.json` | 已完成 | `npm run qa:road-plans` 可重复验证补线成功和财政不足失败两个治理场景 |
| SERVICE-GOVERNANCE-QA-01 | 服务缺口治理 QA 命令 | `src/integration/stageAdvisor.ts`, `src/qa/serviceGovernanceScenarios.ts`, `package.json` | 已完成 | `npm run qa:service-governance` 可验证服务缺口推荐市场落点建成后确实减少缺口 |
| BRIDGE-GAP-QA-01 | 桥梁缺口治理 QA 命令 | `src/integration/GameRuntime.ts`, `src/ui/runtimeOptions.ts`, `src/qa/bridgeGapScenarios.ts`, `package.json` | 已完成 | `npm run qa:bridge-gaps` 可验证水面断点会生成桥梁施工计划，一键施工后孤立路网下降 |
| LOGISTICS-HOTSPOT-QA-01 | 物流热点治理 QA 命令 | `src/integration/GameRuntime.ts`, `src/integration/stageAdvisor.ts`, `src/ui/runtimeOptions.ts`, `src/qa/logisticsHotspotScenarios.ts`, `package.json` | 已完成 | `npm run qa:logistics-hotspots` 可验证多条入货订单压向同一市场时生成物流热点治理卡，并优先定位入货端 |
| LOGISTICS-GOVERNANCE-CAUSE-01 | 物流治理分因建议 | `src/integration/stageAdvisor.ts`, `src/integration/stageAdvisor.test.ts`, `src/qa/logisticsHotspotScenarios.ts` | 已完成 | 无车、断路、仓满、来源不足、卸货排队分别给出不同治理建议 |
| LOGISTICS-EXECUTION-PLAN-01 | 物流治理执行计划 | `src/integration/stageAdvisor.ts`, `src/integration/stageAdvisor.test.ts`, `src/App.tsx` | 已完成 | 物流分因建议输出结构化 `logisticsPlan`，治理卡显示订单、货源、目的地和资源摘要 |
| LOGISTICS-INSPECTOR-PANEL-01 | 物流执行计划详情面板 | `src/App.tsx`, `src/ui/cityAdvisorUi.ts`, `src/styles.css` | 已完成 | 物流计划定位建筑后，详情面板显示来源/目的库存、关联订单和承运调度状态 |
| LOGISTICS-REDISPATCH-ACTION-01 | 物流承运重新调度 | `src/integration/GameRuntime.ts`, `src/App.tsx`, `src/integration/GameRuntime.test.ts` | 已完成 | 承运调度治理卡可重置关联订单、释放承运人并等待重新派车 |
| LONG-RUN-CIV-QA-02 | 7200 tick 分层文明长跑 | `src/qa/civilizationLongRun.ts`, `src/qa/civilizationLongRunCheck.ts`, `package.json` | 已完成 | `npm run qa:civilization-long-run` 可在 2400/4800/7200 tick 采样稳定性与快照规模，验证 30 日灰盒城市长期有界 |
| LONG-RUN-QUEUE-PRESSURE-01 | 长跑队列压力读数 | `src/qa/civilizationLongRun.ts`, `src/qa/civilizationLongRunCheck.ts`, `src/qa/civilizationLongRun.test.ts` | 已完成 | 7200 tick 分层报告记录服务/物流队列规模，并在同一 QA 命令中运行真实卸货吞吐探针 |
| LONG-RUN-LOGISTICS-PRESSURE-01 | 主长跑物流卸货压力 | `src/qa/civilizationLongRun.ts`, `src/qa/civilizationLongRunCheck.ts`, `src/simulation/economy/EconomySystem.ts` | 已完成 | 7200 tick 主长跑定期注入真实在途订单和货车，由物流系统形成卸货队列；最终层 `unloadBacklog` 必须大于 0 |
| BROWSER-E2E-CONTRACT-01 | 浏览器 E2E 场景契约 | `src/qa/browserE2eScenarios.ts`, `src/qa/browserE2eRunner.ts`, `package.json` | 已完成 | `npm run qa:browser-e2e:contract` 可列出并校验 5 个固定治理浏览器场景的 URL、可见文案和 console error 门禁 |
| BROWSER-E2E-RUNNER-01 | 真实浏览器 E2E 执行器 | `tools/browser-e2e/run-browser-e2e.cjs`, `src/qa/browserE2eScenarios.ts`, `package.json` | 已完成 | `npm run qa:browser-e2e` 会构建、启动 Vite preview、用 Playwright Chromium 打开 5 个场景、检查文案/console，并在 roadPlan 场景点击治理卡 |
| BROWSER-E2E-LOW-TREASURY-01 | 低财政补线失败浏览器交互 | `src/qa/browserE2eScenarios.ts`, `src/qa/browserE2eScenarios.test.ts` | 已完成 | `qa:browser-e2e` 会在低财政场景点击补线治理卡，并验证“银两不足2，无法执行补线施工”toast |
| BROWSER-E2E-SERVICE-GOVERNANCE-01 | 服务治理浏览器交互 | `src/qa/browserE2eScenarios.ts`, `src/qa/browserE2eScenarios.test.ts` | 已完成 | `qa:browser-e2e` 会在服务治理场景点击“打开服务图层并营造市场”，并验证对应 toast |
| BROWSER-E2E-BRIDGE-GAP-01 | 桥梁缺口浏览器交互 | `src/qa/browserE2eScenarios.ts`, `src/qa/browserE2eScenarios.test.ts` | 已完成 | `qa:browser-e2e` 会在桥梁缺口场景点击补线治理卡，并验证“桥梁 2 格，花费银两36”toast |
| BROWSER-E2E-LOGISTICS-HOTSPOT-01 | 物流热点浏览器交互 | `src/qa/browserE2eScenarios.ts`, `src/qa/browserE2eScenarios.test.ts` | 已完成 | `qa:browser-e2e` 会在物流热点场景点击“打开物流图层并补仓储”，并验证对应 toast |
| CITY-STAGE-OVERLAY-SUMMARY-01 | 城市阶段覆盖图层摘要 | `src/integration/**`, `src/components/SimulationCanvas.tsx`, `src/styles.css` | 已完成 | 覆盖图层显示住宅、服务缺口、物流热点和道路缺口摘要 |
| CITY-STAGE-OVERLAY-METRICS-01 | 城市阶段覆盖图层结构化指标 | `src/integration/**` | 已完成 | 覆盖图层输出可供面板读取的结构化指标 |
| CITY-STAGE-OVERLAY-PANEL-METRICS-01 | 城市阶段面板图层指标 | `src/App.tsx`, `src/styles.css` | 已完成 | 阶段面板显示当前打开图层的结构化指标 |
| CITY-STAGE-OVERLAY-METRIC-FOCUS-01 | 城市阶段图层指标定位 | `src/App.tsx`, `src/styles.css` | 已完成 | 点击阶段面板图层指标可定位对应地图目标 |
| CITY-GOVERNANCE-CARDS-01 | 图层指标治理卡 | `src/integration/stageAdvisor.ts`, `src/App.tsx` | 已完成 | 服务缺口、道路缺口和物流热点会生成可排序、可点击的瓶颈治理卡 |
| CITY-GOVERNANCE-ACTION-01 | 治理卡原因与推荐操作 | `src/integration/stageAdvisor.ts`, `src/App.tsx`, `src/styles.css` | 已完成 | 治理卡显示原因、推荐工具/建筑和图层，并可一键切换定位、铺路或营造工具 |
| OPTIONAL-MUSIC-ENTRY-01 | 音乐奖励入口降级 | `src/App.tsx`, `src/styles.css` | 已完成 | 听歌从常驻主界面卡片降为默认收起的可选轻奖励入口 |
| LEGACY-LISTENING-DROPS-01 | 旧听歌掉落原型隔离 | `src/legacy/game/**`, `src/simulation/rewards/**` | 已完成 | 旧群岛引擎默认不再由听歌产生普通材料，旧行为只在 legacy 模块显式启用 |
| LEGACY-ARCHIPELAGO-GATE-01 | 旧群岛视图归档开关 | `src/legacy/archipelago/IslandCanvas.tsx`, `src/legacy/game/**`, `src/styles.css` | 已完成 | 旧群岛 Pixi 视图默认显示归档提示，只有显式 legacy/QA 参数才启动 |
| LEGACY-ARCHIPELAGO-SCOPE-01 | 旧群岛原型集中 legacy 边界 | `src/legacy/**`, `src/legacy/game/legacy.test.ts`, `docs/project/**` | 已完成 | 旧 IslandCanvas 从正式 components 目录迁入 legacy/archipelago，并有测试防止回流 |
| LEGACY-GAME-SCOPE-01 | 旧群岛引擎迁入 legacy | `src/legacy/game/**`, `src/legacy/README.md` | 已完成 | 旧固定岛屿材料/建造/存档引擎和旧材料 UI 从正式 `src/game`、`src/components` 迁入 legacy，并有边界测试防止回流 |
| DISTRICT-PROSPERITY-01 | 街区繁荣系统 | `src/simulation/**`, `src/rendering/**`, `src/integration/GameRuntime.ts` | 已完成 | 商业街、码头仓区等街区能驱动人流、灯火、装饰 |
| DISTRICT-PROSPERITY-RUNTIME-01 | 街区繁荣真实运行因子 | `src/simulation/districts/**` | 已完成 | 街区繁荣接入服务覆盖、道路贴近和真实物流活动，不只看建筑聚集 |
| DISTRICT-SERVICE-VISIT-HEAT-01 | 服务访问驱动街区热度 | `src/simulation/districts/**` | 已完成 | 市场、药铺、书院、戏台等真实居民服务访问会提高对应街区繁荣和人流表现 |
| CORE-01 | 模拟时钟、家庭、就业 | `src/simulation/core/**` | 已完成 | 9 项模块测试通过 |
| WORLD-01 | 网格、道路、建造、寻路 | `src/simulation/world/**` | 已完成 | 10 项模块测试通过 |
| LOG-01 | 生产、库存、订单、物流 | `src/simulation/economy/**` | 已完成 | 9 项模块测试通过 |
| RENDER-01 | Pixi 动态场景骨架 | `src/rendering/**` | 已完成 | 状态驱动、对象池、裁剪测试通过 |
| MUSIC-01 | 世界掉落与歌曲稀缺奖励 | `src/simulation/rewards/**` | 已完成 | 11 项模块测试通过 |
| UI-01 | 全屏、相机、建造控制 | `src/ui/**` | 已完成 | 14 项模块测试通过 |
| QA-01 | 测试矩阵和性能工具 | `src/qa/**`, `docs/project/qa.md` | 已完成 | 500/300/150 基准快照可重复 |
| INTEGRATE-01 | 主应用垂直切片集成 | `src/App.tsx`, `src/integration/**` | 已完成 | 新引擎成为主入口，98 项测试通过 |
| ART-AUDIT-01 | 28 类建筑九等级审计 | `docs/project/audits/building-art.md` | 已完成 | 逐建筑重画清单 |
| ART-AUDIT-02 | 四岛整体镇貌审计 | `docs/project/audits/world-art.md` | 已完成 | 分阶段覆盖率与构图清单 |
| ANIM-AUDIT-01 | 全动态系统审计 | `docs/project/audits/animation.md` | 已完成 | 状态驱动缺口清单 |
| ART-DESIGN-01 | 原创视觉圣经重设计 | `docs/project/design/visual-system.md` | 已完成 | 可直接指导资产生产 |
| ANIM-DESIGN-01 | 动画生产体系重设计 | `docs/project/design/animation-system.md` | 已完成 | 动画槽位、规格和性能预算 |
| MODEL-AUDIT-01 | 建筑与场景建模审计 | `docs/project/audits/modeling.md` | 已完成 | 体块、透视、尺度与拆件问题清单 |
| MODEL-DESIGN-01 | 模块化建模生产体系 | `docs/project/design/modeling-system.md` | 已完成 | 构件库、LOD、渲染与导出规范 |
| MODEL-BATCH-01 | 城市基础建筑体块与街区模型 | 待分配 | 待开始 | 住宅、道路、生产、仓储、市场、服务等核心建筑阶段模型 |
| MODEL-BATCH-02 | 城市高级商业/行政/文化街区模型 | 待分配 | 待开始 | 商业街、码头仓区、官署街、书院街、园林住宅区等街区模型 |
| MODEL-BATCH-03 | 人物、车辆、船只与动画拆件 | 待分配 | 待开始 | 可绑定、可换装、可LOD资产 |
| ART-BATCH-01 | 港口与交通建筑重设计 | 待分配 | 待开始 | 审计完成后启动 |
| ART-BATCH-02 | 商业与民居建筑重设计 | 待分配 | 待开始 | 审计完成后启动 |
| ART-BATCH-03 | 作坊与仓储建筑重设计 | 待分配 | 待开始 | 审计完成后启动 |
| ART-BATCH-04 | 农业、资源与水乡环境建筑重设计 | 待分配 | 待开始 | 审计完成后启动 |
| ART-BATCH-05 | 公共与景观建筑重设计 | 待分配 | 待开始 | 审计完成后启动 |
| GOLD-CONCEPT-01 | 六类金标建筑概念重设 | 待分配 | 待开始 | 功能盲测 ≥80%，L0/L8 差异清晰 |
| GOLD-BLOCKOUT-01 | 六类金标体块与地块验证 | `docs/project/gold-slice/blockout-validation.md` | 已完成 | footprint、入口、遮挡、人流成立 |
| GOLD-ANIM-01 | 六类金标状态动画原型 | 待分配 | 待开始 | 施工、生产、停工三态可回放 |
| GOLD-ENGINE-01 | 金标资产入引擎 | 待分配 | 待开始 | Pixi prefab、manifest、LOD 与状态驱动 |
| ENGINE-SERVICE-01 | 城市服务与市场系统 | `src/simulation/**` | 待开始 | 食物、服务、居民满意度形成真实后果 |
| TOOL-ASSET-VALIDATOR-01 | 资产自动校验工具 | `tools/asset-validator/**` | 已完成 | 缺级、缺层、缺动画、超预算自动失败 |
| ENGINE-CONSEQUENCE-01 | 居民需求与迁出后果链 | `src/simulation/core/**` | 已完成 | 服务不足、失业和恢复均有确定性测试 |
| GOLD-ART-01 | 六类金标建筑美术规格 | `docs/project/gold-slice/building-art-spec.md` | 已完成 | L0–L8 主体、环境、活动、禁项完整 |
| MODEL-ANIM-01 | 金标建模与动效入引擎规格 | `docs/project/gold-slice/model-animation-spec.md` | 已完成 | 拆件、pivot、LOD、状态动画和 manifest 完整 |
| QA-PRODUCTION-01 | 并行生产验收矩阵 | `docs/project/parallel-production-qa.md` | 已完成 | 输入输出模板、集成节奏、退回标准完整 |
| ENGINE-SERVICE-02 | 服务网络与居民路径 | `src/simulation/economy/**` | 已完成 | 市场、药铺、书院、戏台完整影响居民需求 |
| RENDER-STATE-01 | 状态驱动建筑表现层 | `src/rendering/**` | 已完成 | building status 映射专属动画状态和调试层 |
| ENGINE-FAILURE-01 | 城市故障后果系统 | `src/simulation/economy/**` | 已完成 | 断路、缺工、缺货、仓满产生可见后果 |
| PREFAB-RUNTIME-01 | 金标 prefab runtime 接口 | `src/rendering/prefab/**` | 已完成 | manifest 驱动 Pixi prefab descriptor 和状态映射 |
| UI-CITY-MANAGER-01 | 城市瓶颈管理面板 | `src/App.tsx`, `src/styles.css` | 已完成 | 只展示关键瓶颈，不平铺复杂表格 |
| TOOL-ASSET-VALIDATOR-02 | 资产校验器脚本接入 | `tools/asset-validator/**`, `package.json` | 已完成 | npm 脚本可运行校验器自检和金标 fixture 校验 |
| LOGISTICS-FAILURE-02 | 物流失败原因与指标 | `src/simulation/economy/**` | 已完成 | 断路/无车/无源库存产生失败事件和效率影响 |
| LOGISTICS-ORDER-ARCHIVE-01 | 历史物流订单归档 | `src/simulation/contracts.ts`, `src/simulation/economy/logistics.ts`, `src/qa/stressScenario.ts` | 已完成 | delivered/cancelled 订单进入汇总归档，主快照订单表有界保留且效率统计保持正确 |
| PERF-SPLIT-01 | 前端包体与 Pixi 分包 | `vite.config.ts`, `vite.config.js` | 已完成 | 主 chunk 低于 500kB 或有明确分包策略 |
| PREFAB-RENDER-01 | Prefab 渲染占位接入 | `src/rendering/**` | 已完成 | descriptor 注册、状态解析和灰盒占位渲染可测 |
| CITY-EVENTS-01 | 城市反馈事件数据层 | `src/integration/**` | 已完成 | 从瓶颈派生轻量城市反馈且不刷屏 |
| CITY-NOTICE-UI-01 | 城市反馈接入 UI | `src/App.tsx`, `src/styles.css` | 已完成 | 城市反馈以轻量 toast/岛上小事呈现且不打扰 |
| PREFAB-ASSET-MAP-01 | 建筑类型到金标 assetId 映射 | `src/rendering/**`, `src/content/**` | 已完成 | 真实 building.type 可映射到 gold prefab assetId |
| LOGISTICS-CANCEL-REASON-01 | 物流订单失败原因 | `src/simulation/contracts.ts`, `src/simulation/economy/**` | 已完成 | 订单本身记录取消/失败原因，供诊断使用 |
| GOLD-SAMPLE-MANIFEST-01 | 金标样例 manifest | `docs/project/gold-slice/sample-manifests/**` | 已完成 | 首个可通过校验器的生产模板 manifest |
| GOLD-SAMPLE-RUNTIME-01 | 金标样例 manifest 接入 prefab registry | `src/rendering/prefab/**`, `docs/project/gold-slice/sample-manifests/**` | 已完成 | main-pier 样例可被 runtime parser/registry 使用 |
| CITY-NOTICE-STORY-01 | 城市反馈转岛上小事 | `src/integration/**`, `src/App.tsx`, `src/styles.css` | 已完成 | notice 已演化为一两次点击完成的小事，不阻塞建设 |
| GOLD-PLACEHOLDER-VISUAL-01 | 金标 prefab 占位可视化 | `src/rendering/**` | 已完成 | 已注册 prefab 在地图上显示 assetId/level/status 占位 |
| CITY-NOTICE-FOCUS-01 | 小事流定位建筑/区域 | `src/App.tsx`, `src/styles.css`, `src/integration/**` | 已完成 | 点击小事可选中相关建筑或提示定位 |
| MAP-FEEDBACK-01 | 地图内故障提示 | `src/rendering/**` | 已完成 | 缺工/缺料/物流失败/仓满在地图上有轻提示 |
| CAMERA-FOCUS-01 | 地图相机定位接口 | `src/components/SimulationCanvas.tsx`, `src/ui/**`, `src/App.tsx` | 已完成 | 小事/瓶颈点击后可平滑定位到建筑或地块 |
| GOLD-PIER-VISUAL-SLICE-01 | 旧码头首个可视切片 | `src/rendering/**`, `docs/project/gold-slice/sample-manifests/**` | 已完成 | main-pier 样例驱动更完整的 L0/L4/L8 占位表现 |
| GOLD-ASSET-CI-01 | main-pier 资产校验入口 | `package.json`, `tools/asset-validator/**`, `docs/project/gold-slice/sample-manifests/main-pier/**` | 已完成 | `npm run asset:validate:main-pier` 可直接校验样例 manifest |
| GOLD-BUILDING-VISUAL-DIVERSITY-01 | 多类金标建筑差异化视觉切片 | `src/rendering/**` | 已完成 | 3 类非码头建筑拥有 L0/L4/L8 差异化程序化表现 |
| GOLD-VISUAL-RUNTIME-REGISTRY-01 | 金标占位视觉接入主画布 | `src/rendering/prefab/**`, `src/components/SimulationCanvas.tsx`, `src/rendering/visuals.ts` | 已完成 | 主游戏画布默认加载金标样例 registry，民居/粮仓/集市/码头细节层实际可见 |
| MATERIAL-PICKUP-FEEL-01 | 材料掉落与手动扫取手感 | `src/components/SimulationCanvas.tsx`, `src/App.tsx`, `src/styles.css` | 已完成 | 地图内材料节点可见、可点击/连续拾取且不破坏拖拽 |
| SIM-CITY-OPERATIONS-01 | 城市运行后果闭环 | `src/simulation/**`, `src/qa/**` | 已完成 | 服务不足形成确定性居民需求/满意度后果并可测 |
| GOLD-MANIFEST-BATCH-01 | 金标样例 manifest 批量化 | `docs/project/gold-slice/sample-manifests/**`, `tools/asset-validator/**`, `package.json` | 已完成 | 3 个样例可由批量脚本统一校验 |
| CIV-MATRIX-01 | 商业级文明系统矩阵 | `docs/project/**` | 已完成 | 明确家庭、住宅、就业、道路、产业、仓储、市场、服务、财政、文明阶段等系统缺口 |
| BUILD-UPGRADE-SYSTEM-01 | 正式建筑升级底层 | `src/simulation/**`, `src/integration/GameRuntime.ts` | 已完成 | 0–8 级升级具备成本、失败条件和可观察效果 |
| FULL-LEVEL-ASSET-GATE-01 | L0–L8 完整资产严格门禁 | `tools/asset-validator/**`, `docs/project/gold-slice/sample-manifests/**`, `package.json` | 已完成 | 严格模式可检查九等级缺失并明确失败 |
| LONG-RUN-CIV-QA-01 | 长时间文明模拟 QA | `src/qa/**`, `docs/project/qa.md` | 已完成 | 2400 tick 灰盒长稳测试覆盖人口、满意度、物流、停工、订单和库存边界 |
| MARKET-CONSUMPTION-01 | 市场真实消费闭环 | `src/simulation/economy/**`, `src/simulation/core/**` | 已完成 | 市场库存可被家庭消费扣除，并产生购买事件与税收 |
| CITY-UPGRADE-SUPPLY-01 | 城市级升级材料调拨 | `src/simulation/economy/upgrades.ts`, `src/integration/GameRuntime.ts` | 已完成 | 升级优先从城市仓储确定性扣料，材料不足不改变库存 |
| LONG-RUN-PERF-01 | 长稳模拟性能优化/定位 | `src/qa/**`, `src/simulation/**`, `docs/project/qa.md` | 已完成 | 不降低 tick/阈值的前提下定位物流订单索引热点并显著降低长稳耗时 |
| FULL-LEVEL-GOLD-SAMPLE-01 | 首个 L0–L8 完整金标样例 | `docs/project/gold-slice/sample-manifests/**`, `tools/asset-validator/**`, `package.json` | 已完成 | `main-homes` 可通过 strict L0–L8 校验 |
| HOUSEHOLD-CASH-GOODS-01 | 家庭现金与日用品消费 | `src/simulation/economy/**`, `src/simulation/contracts.ts` | 已完成 | 市场支持 food/goods 消费，家庭收入不足不能凭空购买 |
| UPGRADE-CONSTRUCTION-QUEUE-01 | 建筑升级施工队列 | `src/simulation/economy/upgrades.ts`, `src/integration/GameRuntime.ts` | 已完成 | 升级进入 `upgrading` 并随 tick 完成，而非瞬时换级 |
| UPGRADE-UI-ENTRY-01 | 建筑详情升级入口 | `src/App.tsx`, `src/styles.css`, `src/integration/GameRuntime.ts` | 已完成 | 玩家可查看成本/缺口并触发升级，UI 保持简洁 |
| FULL-LEVEL-EATERY-SAMPLE-01 | 第二个 L0–L8 完整金标样例 | `docs/project/gold-slice/sample-manifests/**`, `package.json` | 已完成 | `main-eatery` 可通过 strict L0–L8 校验 |
| LOGISTICS-EXECUTION-FOCUS-01 | 物流执行计划聚焦目标 | `src/integration/stageAdvisor.ts`, `src/App.tsx` | 已完成 | 物流计划声明来源/目的地/线路/缓冲聚焦角色，治理卡可定位真实相关建筑 |
| LOGISTICS-ROAD-PLAN-01 | 物流断路执行计划 | `src/integration/stageAdvisor.ts` | 已完成 | `build-road-link` 根据订单来源/目的建筑入口生成可一键施工的 roadPlan |
| LOGISTICS-STORAGE-CANDIDATE-01 | 物流仓储候选落点 | `src/integration/stageAdvisor.ts` | 已完成 | `expand-storage`、`split-unload` 和 `add-buffer-storage` 会给出贴近物流热点的粮仓 footprint 候选 |
| LOGISTICS-INSPECTOR-PANEL-01 | 物流执行计划详情面板 | `src/App.tsx` | 已完成 | 建筑详情可显示计划相关库存、订单和承运状态 |
| LOGISTICS-REDISPATCH-ACTION-01 | 物流承运重新调度动作 | `src/integration/GameRuntime.ts`, `src/App.tsx`, `src/integration/GameRuntime.test.ts` | 已完成 | 缺承运治理卡可释放承运人并将关联订单重置回等待队列 |
| LOGISTICS-SOURCE-STOCK-TRANSFER-01 | 物流来源库存调拨 | `src/integration/GameRuntime.ts`, `src/App.tsx`, `src/integration/GameRuntime.test.ts` | 已完成 | 来源库存治理卡可从备用库存调拨资源并重置关联订单 |
| LOGISTICS-CARRIER-CAPACITY-01 | 物流承运容量补充 | `src/integration/GameRuntime.ts`, `src/App.tsx`, `src/integration/GameRuntime.test.ts` | 已完成 | 缺承运治理卡可新增一名货车承运人并让正式物流系统接单 |
| LOGISTICS-STORAGE-BUILD-ACTION-01 | 物流仓储建造动作 | `src/integration/GameRuntime.ts`, `src/App.tsx`, `src/integration/GameRuntime.test.ts` | 已完成 | 扩仓、分流卸货和缓冲仓计划可从候选落点真实建成粮仓、扣除营造成本并重置关联订单 |
| LOGISTICS-UNLOAD-CAPACITY-TIER-01 | 卸货能力分层 | `src/simulation/economy/logistics.ts`, `src/simulation/economy/economy.test.ts` | 已完成 | 未显式覆盖时，目的建筑按类型、等级、工人和入口道路数动态计算每 tick 卸货能力 |
| LOGISTICS-UNLOAD-CAPACITY-EXPLAIN-01 | 卸货能力可视化解释 | `src/simulation/contracts.ts`, `src/simulation/economy/logistics.ts`, `src/integration/stageAdvisor.ts`, `src/ui/cityAdvisorUi.ts`, `src/App.tsx` | 已完成 | 物流队列携带基础/等级/工人/入口道路能力拆解，治理卡与建筑详情面板解释当前卸货能力来源 |
| LOGISTICS-STORAGE-OUTCOME-01 | 物流仓储建成后结果解释 | `src/simulation/contracts.ts`, `src/integration/GameRuntime.ts`, `src/ui/cityAdvisorUi.ts`, `src/App.tsx`, `src/qa/browserE2eScenarios.ts` | 已完成 | 建成缓冲仓后持久化并展示重置订单、释放承运人和清理卸货队列结果，真实浏览器场景验证详情面板可见 |
| UPGRADE-ECONOMY-AUDIT-01 | 升级经济回本与容量联动审计 | `src/qa/upgradeEconomyAudit.ts`, `src/qa/upgradeEconomyAuditCheck.ts`, `src/simulation/economy/service.ts`, `docs/project/audits/upgrade-economy.md` | 已完成 | 覆盖 64 个升级节点，输出材料价值/岗位税收/服务价值/维护费/回本周期，并让服务吞吐与生产里程碑按等级联动 |
| UPGRADE-ECONOMY-UI-01 | 升级经济结果可见化 | `src/integration/GameRuntime.ts`, `src/App.tsx`, `src/styles.css`, `src/integration/GameRuntime.test.ts` | 已完成 | 建筑详情显示升级后的容量/岗位、生产产值、服务吞吐、维护影响和回本周期；浏览器验收待本地预览服务恢复后补跑 |
| UPGRADE-ECONOMY-ADVISOR-01 | 升级经济风险顾问 | `src/App.tsx`, `src/qa/upgradeEconomyAudit.ts`, `docs/project/progress-dashboard.md` | 已完成 | 城市顾问只提示最高风险升级节点，并可定位到建筑详情查看收益；浏览器验收待本地预览服务恢复后补跑 |
| LOGISTICS-UNLOAD-CAPACITY-LABEL-01 | 物流热点能力来源短标签 | `src/integration/stageAdvisor.ts`, `src/components/SimulationCanvas.tsx`, `src/styles.css`, `src/integration/stageAdvisor.test.ts` | 已完成 | 物流图层在卸货热点旁显示能力总量及基础/等级/工人/道路来源，保持单一地图叠加层 |
| LOGISTICS-INTERVENTION-AUDIT-01 | 物流干预事件与存档审计 | `src/simulation/contracts.ts`, `src/integration/GameRuntime.ts`, `src/qa/logisticsStorageInterventionAudit.ts`, `src/qa/logisticsStorageInterventionAudit.test.ts` | 已完成 | 扩仓动作写入唯一事件历史，审计可验证跨运行时重建后的记录完整性 |
| LOGISTICS-INTERVENTION-UI-01 | 物流干预历史可见化 | `src/App.tsx`, `src/ui/cityAdvisorUi.ts`, `src/ui/cityAdvisorUi.test.ts`, `src/styles.css` | 已完成 | 建筑详情显示多次干预累计结果与最近事件刻数，玩家可验证治理动作已留痕 |
| LOGISTICS-INTERVENTION-RETENTION-01 | 物流干预历史有界归档 | `src/simulation/economy/logisticsInterventions.ts`, `src/simulation/contracts.ts`, `src/qa/logisticsStorageInterventionAudit.ts` | 已完成 | 最近 200 条明细保留，旧事件进入累计归档，长跑事件内存增长有明确边界 |
| LOGISTICS-INTERVENTION-ARCHIVE-UI-01 | 城市管理归档读数 | `src/App.tsx`, `src/ui/cityAdvisorUi.ts`, `src/styles.css` | 已完成 | 城市管理抽屉显示近期明细、归档数量和累计治理影响，长跑结果对玩家可见 |
| LOGISTICS-INTERVENTION-TIMELINE-01 | 物流治理时间线定位 | `src/App.tsx`, `src/ui/cityAdvisorUi.ts`, `src/styles.css` | 已完成 | 城市管理显示最近三次物流干预，点击后定位对应建筑并打开详情 |
| CIVILIZATION-TIMELINE-01 | 城市运行文明时间线 | `src/simulation/contracts.ts`, `src/integration/cityTimeline.ts`, `src/integration/GameRuntime.ts`, `src/App.tsx` | 已完成 | 服务、市场财政、人口迁入/离开事件持久化为有界历史，并在城市管理面板可见 |
| BROWSER-E2E-LOGISTICS-SOURCE-STOCK-01 | 来源库存检查浏览器交互 | `src/integration/GameRuntime.ts`, `src/qa/browserE2eScenarios.ts`, `tools/browser-e2e/run-browser-e2e.cjs` | 已完成 | `logistics-source-shortage` 场景真实点击“检查来源库存”后定位粮仓，并断言建筑详情物流执行计划面板可见 |
| BROWSER-E2E-LOGISTICS-STORAGE-BUILD-01 | 物流仓储建造浏览器交互 | `src/integration/GameRuntime.ts`, `src/ui/runtimeOptions.ts`, `src/qa/browserE2eScenarios.ts`, `src/qa/browserE2eScenarios.test.ts` | 已完成 | `logistics-storage-build` 场景真实点击“分流卸货压力”后建成粮仓缓冲，并验证“粮仓已作为物流缓冲落成”toast |
| RESIDENT-IDENTITY-STATE-01 | 外来居民身份与职业状态 | `src/simulation/contracts.ts`, `src/integration/cityTimeline.ts`, `src/integration/GameRuntime.ts`, `src/App.tsx` | 已完成 | 入住前后展示候选/外来家庭、成员、劳动力、就业建筑和满意度差异，并可定位住房 |
| BROWSER-E2E-RESIDENT-TIMELINE-01 | 居民状态浏览器场景契约 | `src/qa/browserE2eScenarios.ts`, `src/ui/runtimeOptions.ts`, `src/App.tsx` | 已完成 | 提供可重复的候选家庭到已入住家庭场景；真实浏览器运行待本地监听限制解除 |
| RESIDENT-GOVERNANCE-01 | 居民生活运行摘要 | `src/integration/residentGovernance.ts`, `src/App.tsx` | 已完成 | 从真实家庭、住房、工人、职业和民需状态派生居民生活卡，不引入脱离模拟的并行状态 |
| RESIDENT-VISUAL-ROLE-01 | 职业类别地图反馈 | `src/rendering/visuals.ts`, `src/rendering/DynamicScene.ts` | 已完成 | 工人按所属产业类别显示不同服色，活动位置和动画继续由真实代理状态驱动 |
| RESIDENT-LABOR-CONSEQUENCE-01 | 岗位变更与缺勤后果 | `src/simulation/core/SimulationEngine.ts`, `src/simulation/economy/**`, `src/integration/cityTimeline.ts`, `src/App.tsx` | 已完成 | 岗位/缺勤事件来自真实居民状态，生产、服务、物流按有效出勤人数运行 |
| RESIDENT-MIGRATION-REASON-01 | 居民迁出原因解释 | `src/simulation/core/SimulationEngine.ts`, `src/simulation/contracts.ts`, `src/integration/cityTimeline.ts` | 已完成 | 离城事件按关键需求、长期失业或低满意度给出真实原因并在时间线显示 |
| RESIDENT-PRESSURE-PERSISTENCE-01 | 需求短板与长期缺勤持久化 | `src/simulation/contracts.ts`, `src/simulation/core/SimulationEngine.ts`, `src/integration/cityTimeline.ts` | 已完成 | 家庭保存各项关键需求短板刻数与缺勤累计刻数，迁出事件解释具体需求或连续缺勤时长 |
| RESIDENT-SERVICE-PRESSURE-01 | 服务短缺来源与持续时间 | `src/simulation/economy/service.ts`, `src/simulation/contracts.ts`, `src/integration/residentGovernance.ts`, `src/integration/cityTimeline.ts`, `src/App.tsx` | 已完成 | 服务短板按真实工人、库存、道路、容量和收入原因累计，并在治理卡/迁出时间线显示 |
| CITY-SERVICE-FACILITY-GAP-01 | 城市级缺失服务设施治理 | `src/integration/stageAdvisor.ts`, `src/integration/stageAdvisor.test.ts` | 已完成 | 无对应设施且需求偏低时生成可定位的治理卡；已有建筑定义提供营造候选，否则明确回退到服务图层检查 |
| SERVICE-FACILITIES-RUNTIME-01 | 医疗教育文化设施运行时接入 | `src/content/runtimeBuildings.ts`, `src/rendering/prefab/assetMapping.ts`, `src/content/buildings.test.ts` | 已完成 | 药铺/书院/戏台具备时代解锁、建造报价、升级审计、Prefab 映射和真实居民服务规则 |
| SERVICE-FACILITY-CLOSED-LOOP-01 | 药铺建造到居民恢复闭环 | `src/integration/GameRuntime.ts`, `src/qa/serviceFacilityScenarios.ts`, `src/ui/runtimeOptions.ts`, `package.json` | 已完成 | 通过真实建造、配工、药材库存、服务访问和模拟 tick 验证健康需求恢复 |
| SERVICE-FACILITY-MULTI-CLOSED-LOOP-01 | 医疗教育文化三类服务恢复闭环 | `src/qa/serviceFacilityScenarios.ts`, `src/qa/serviceFacilityScenarios.test.ts` | 已完成 | 药铺/书院/戏台分别驱动 health/education/entertainment 需求恢复并记录服务事件 |
| SERVICE-FACILITY-FAILURE-AUDIT-01 | 服务设施故障原因审计 | `src/qa/serviceFacilityScenarios.ts`, `src/qa/serviceFacilityScenarios.test.ts`, `src/integration/GameRuntime.ts` | 已完成 | 缺工、缺药材、断路均能在建筑状态与居民需求压力中呈现可解释原因 |
| CIVILIZATION-SERVICE-ATTRACTION-01 | 公共服务与城市吸引力反馈 | `src/simulation/contracts.ts`, `src/simulation/core/SimulationEngine.ts`, `src/App.tsx`, `src/qa/serviceFacilityScenarios.test.ts` | 已完成 | 医疗/教育/娱乐需求形成公共服务覆盖指标，并独立影响外来人口吸引力与城市指标栏 |
| CIVILIZATION-MIGRATION-FISCAL-01 | 人口流动与服务财政反馈 | `src/simulation/contracts.ts`, `src/simulation/core/SimulationEngine.ts`, `src/simulation/economy/fiscal.ts`, `src/integration/residentGovernance.ts`, `src/App.tsx` | 已完成 | 持久化迁入/迁出户数与人口数，接入净迁入指标，并单独显示公共服务维护支出 |
| CIVILIZATION-MIGRATION-AUDIT-01 | 人口流动结构审计 | `src/simulation/contracts.ts`, `src/simulation/core/SimulationEngine.ts`, `src/integration/residentGovernance.ts`, `src/App.tsx` | 已完成 | 按迁出原因、住房类型、职业类别和就业状态保存流动结构，并在居民治理面板解释净迁入变化 |
| CIVILIZATION-DEPARTURE-PROFILE-01 | 离城居民生命周期档案 | `src/simulation/core/SimulationEngine.ts`, `src/integration/GameRuntime.ts`, `src/integration/cityTimeline.ts`, `src/simulation/core/SimulationEngine.test.ts` | 已完成 | 家庭删除前保存成员、住房、职业、就业和满意度，并在城市时间线展示离城居民状态 |
| CIVILIZATION-MIGRATION-FISCAL-LINK-01 | 人口事件财政链路 | `src/simulation/contracts.ts`, `src/simulation/economy/fiscal.ts`, `src/integration/cityTimeline.ts`, `src/integration/GameRuntime.ts` | 已完成 | 将迁出原因、服务瓶颈、财政结算和公共服务维护成本绑定到同一条人口时间线记录 |
| CIVILIZATION-FISCAL-HISTORY-01 | 财政结算历史与周期对比 | `src/simulation/contracts.ts`, `src/simulation/economy/fiscal.ts`, `src/integration/cityTimeline.ts`, `src/integration/GameRuntime.ts`, `docs/project/**` | 已完成 | 持久化最近 24 次结算的前后库银、税收、维护和公共服务维护成本；人口事件仅引用真实结算快照 |
| CIVILIZATION-SERVICE-RECOVERY-AUDIT-01 | 服务恢复前后审计 | `src/simulation/contracts.ts`, `src/simulation/economy/service.ts`, `src/integration/cityTimeline.ts`, `src/integration/cityTimeline.test.ts` | 已完成 | 服务事件记录需求恢复前后值，并关联最近真实财政结算的库银与公共服务维护成本 |
| CIVILIZATION-SERVICE-BOTTLENECK-RECOVERY-01 | 服务瓶颈解除与建筑恢复审计 | `src/simulation/contracts.ts`, `src/simulation/economy/service.ts`, `src/integration/cityTimeline.ts`, `src/simulation/economy/economy.test.ts`, `src/integration/cityTimeline.test.ts` | 已完成 | 真实记录设施从阻塞到营业的原因解除、压力清除和持续时长，并进入城市时间线 |
| CIVILIZATION-SERVICE-RECOVERY-UI-01 | 服务恢复治理与建筑详情界面 | `src/App.tsx`, `src/styles.css`, `src/ui/cityAdvisorUi.ts`, `src/ui/cityAdvisorUi.test.ts` | 已完成 | 治理面板可定位最近恢复建筑，建筑详情显示恢复刻度与压力清除说明 |
| CIVILIZATION-SERVICE-RECOVERY-STRUCTURED-01 | 恢复审计结构化数据 | `src/simulation/contracts.ts`, `src/integration/cityTimeline.ts`, `src/integration/cityTimeline.test.ts`, `src/simulation/economy/economy.test.ts`, `src/App.tsx`, `src/styles.css` | 已完成 | 结构化展示建筑状态、居民压力、财政影响和最近一户居民需求的前后变化 |
| CIVILIZATION-SERVICE-RECOVERY-MOTION-01 | 恢复状态动态渲染 | `src/rendering/visuals.ts`, `src/rendering/DynamicScene.test.ts` | 已完成 | 服务瓶颈解除后 12 个模拟刻内显示由真实时间线驱动的建筑恢复脉冲 |
| CIVILIZATION-BLOCKAGE-MOTION-01 | 阻塞原因动态反馈 | `src/rendering/visuals.ts`, `src/rendering/DynamicScene.test.ts` | 进行中 | 为缺工、缺料、断路和仓满建立差异化的画布反馈与恢复动效 |
| CIVILIZATION-BLOCKAGE-MOTION-01 | 阻塞原因动态反馈 | `src/rendering/visuals.ts`, `src/rendering/DynamicScene.test.ts` | 已完成 | 四类阻塞保留差异化符号，并按模拟时钟呼吸反馈；服务恢复继续使用恢复脉冲 |
| CIVILIZATION-BLOCKAGE-GOVERNANCE-01 | 阻塞持续时间治理摘要 | `src/integration/residentGovernance.ts`, `src/App.tsx`, `src/simulation/economy/{production,service,logistics,upgrades}.ts` | 已完成 | 统一展示阻塞持续刻数与居民、物流、库存后果，升级状态不计入运行阻塞 |
| CIVILIZATION-BLOCKAGE-TIMELINE-01 | 阻塞生命周期时间线审计 | `src/simulation/contracts.ts`, `src/integration/cityTimeline.ts`, `src/App.tsx` | 进行中 | 记录阻塞开始、持续后果与恢复，建筑详情可回溯完整生命周期 |
| CIVILIZATION-BLOCKAGE-TIMELINE-01 | 阻塞生命周期时间线审计 | `src/simulation/core/SimulationEngine.ts`, `src/simulation/contracts.ts`, `src/integration/cityTimeline.ts`, `src/App.tsx`, `src/ui/cityAdvisorUi.ts` | 已完成 | 记录阻塞开始与恢复，显示原因、起始刻、持续刻数和恢复状态；服务恢复事件去重 |
| CIVILIZATION-BLOCKAGE-CAUSE-CHAIN-01 | 阻塞与城市后果同刻因果链 | `src/simulation/contracts.ts`, `src/integration/cityTimeline.ts`, `src/App.tsx` | 进行中 | 将居民缺勤、物流订单和库存变动关联到同一阻塞生命周期，支持治理定位 |
| CIVILIZATION-BLOCKAGE-CAUSE-CHAIN-01 | 阻塞与城市后果同刻因果链 | `src/simulation/core/SimulationEngine.ts`, `src/simulation/contracts.ts`, `src/integration/cityTimeline.ts`, `src/App.tsx` | 已完成 | 阻塞开始/恢复事件携带同刻缺勤、物流、库存和居民压力审计 |
| CIVILIZATION-BLOCKAGE-DELTA-01 | 阻塞持续期间增量审计 | `src/simulation/contracts.ts`, `src/simulation/core/SimulationEngine.ts`, `src/integration/cityTimeline.ts`, `src/App.tsx` | 进行中 | 记录阻塞持续期间库存、物流积压和居民压力的前后变化 |
| CIVILIZATION-BLOCKAGE-DELTA-01 | 阻塞持续期间增量审计 | `src/simulation/contracts.ts`, `src/simulation/core/SimulationEngine.ts`, `src/integration/cityTimeline.ts`, `src/App.tsx`, `src/simulation/core/SimulationEngine.test.ts` | 已完成 | 真实引擎保存起始/恢复快照并计算库存、物流和居民压力增量，建筑审计面板可见 |
| CIVILIZATION-BLOCKAGE-FISCAL-LINK-01 | 阻塞增量与财政周期关联 | `src/simulation/contracts.ts`, `src/simulation/economy/fiscal.ts`, `src/integration/residentGovernance.ts`, `src/integration/cityTimeline.ts` | 进行中 | 将阻塞期间的运营损失、物流积压和服务压力与最近财政结算关联，支持城市治理判断 |
| CIVILIZATION-BLOCKAGE-FISCAL-LINK-01 | 阻塞增量与财政周期关联 | `src/simulation/contracts.ts`, `src/simulation/economy/fiscal.ts`, `src/integration/residentGovernance.ts`, `src/App.tsx`, `src/simulation/economy/economy.test.ts` | 已完成 | 财政结算保存运营压力快照，居民治理面板展示最近结算刻的阻塞、物流、库存和居民压力 |
| CIVILIZATION-BLOCKAGE-SEGMENT-01 | 阻塞原因变化生命周期分段 | `src/simulation/core/SimulationEngine.ts`, `src/simulation/contracts.ts`, `src/integration/cityTimeline.ts` | 进行中 | 缺料、断路、仓满等原因变化时闭合上一段生命周期，再开始新的原因段并保留各段增量 |
| CIVILIZATION-BLOCKAGE-SEGMENT-01 | 阻塞原因变化生命周期分段 | `src/simulation/core/SimulationEngine.ts`, `src/simulation/contracts.ts`, `src/integration/cityTimeline.ts`, `src/simulation/core/SimulationEngine.test.ts` | 已完成 | 原因变化时旧段闭合、新段重置起始刻，缺料→断路→恢复可分别审计 |
| CIVILIZATION-FISCAL-PRESSURE-COMPARE-01 | 财政运营压力周期对比 | `src/simulation/contracts.ts`, `src/simulation/economy/fiscal.ts`, `src/integration/cityTimeline.ts`, `src/integration/residentGovernance.ts` | 进行中 | 对比相邻财政结算的运营压力变化，并在异常时写入可定位治理记录 |
| CIVILIZATION-FISCAL-PRESSURE-COMPARE-01 | 财政运营压力周期对比 | `src/simulation/contracts.ts`, `src/simulation/economy/fiscal.ts`, `src/integration/cityTimeline.ts`, `src/integration/residentGovernance.ts`, `src/simulation/economy/economy.test.ts`, `src/integration/cityTimeline.test.ts` | 已完成 | 财政事件与结算历史保存相邻周期压力差值，时间线和治理面板消费同一结构化事实 |
| CIVILIZATION-FISCAL-GOVERNANCE-ALERT-01 | 财政压力治理提示 | `src/integration/cityNotices.ts`, `src/integration/stageAdvisor.ts`, `src/App.tsx`, `src/qa/serviceGovernanceScenarios.ts` | 进行中 | 压力上升时生成可定位的运营治理提示，连接到建筑、物流或居民治理入口 |
| CIVILIZATION-FISCAL-GOVERNANCE-ALERT-01 | 财政压力治理提示 | `src/integration/cityNotices.ts`, `src/integration/cityNotices.test.ts` | 已完成 | 财政周期压力上升时生成 finance 提示，并定位到真实阻塞建筑、物流热点或居民关联建筑 |
| CIVILIZATION-FISCAL-GOVERNANCE-EVIDENCE-01 | 财政提示浏览器证据与消退策略 | `src/qa/browserE2eScenarios.test.ts`, `src/integration/cityNotices.ts`, `docs/project/qa.md` | 进行中 | 在 socket 可用环境验证提示点击定位、压力消退与重复抑制；不得以单元测试替代真实浏览器证据 |
| CIVILIZATION-FISCAL-GOVERNANCE-LIFECYCLE-01 | 财政提示生命周期去打扰 | `src/integration/cityNotices.test.ts`, `src/integration/cityNotices.ts` | 已完成 | 同一压力周期只提示一次，压力消退后清除，再次上升可重新提示 |

| CIVILIZATION-RESIDENT-LIFECYCLE-AUDIT-01 | 外来人口候选到入住及迁出生命周期审计 | `src/simulation/core/SimulationEngine.ts`, `src/simulation/core/SimulationEngine.test.ts`, `docs/project/**` | 已完成 | 候选人 waiting/walking 与稳定家庭实体分离；迁出前快照职业和就业状态，岗位、流动账本与离城档案一致 |
| CIVILIZATION-RESIDENT-VISUAL-LIFECYCLE-01 | 居民生命周期场景表现 | `src/integration/GameRuntime.ts`, `src/integration/cityTimeline.ts`, `src/rendering/**`, `src/qa/**` | 待开始 | 将候选、步行、入住、稳定居住和离城状态映射到人物动作、路径和场景内提示，并补浏览器证据 |
| CIVILIZATION-NOTICE-LIFECYCLE-02 | 全部高优先级提示生命周期审计 | `src/integration/cityNotices.ts`, `src/integration/cityNotices.test.ts`, `src/qa/browserE2eScenarios.ts` | 进行中 | 将去打扰与恢复后重新触发策略扩展到粮食、物流和人口提示，并补齐浏览器证据 |
| CIVILIZATION-NOTICE-LIFECYCLE-02 | 全部高优先级提示生命周期审计 | `src/integration/cityNotices.test.ts` | 已完成 | 粮食、物流、迁移和财政提示均覆盖持续静默、恢复清除与再次触发 |
| CIVILIZATION-NOTICE-ANALYTICS-01 | 城市提示分析生命周期 | `src/integration/cityNotices.ts`, `src/integration/GameRuntime.ts`, `src/simulation/contracts.ts` | 进行中 | 记录提示首次出现、确认、恢复和再次发生，形成可审计的运营反馈事件 |
| CIVILIZATION-NOTICE-ANALYTICS-01 | 城市提示分析生命周期 | `src/integration/cityNotices.ts`, `src/integration/GameRuntime.ts`, `src/App.tsx`, `src/integration/cityNotices.test.ts` | 已完成 | 统一产生 activated、retriggered、resolved、acknowledged 事件，运行时提供消费接口，界面确认动作已接入 |
| CIVILIZATION-NOTICE-ANALYTICS-PERSIST-01 | 提示分析持久化与批量上报边界 | `src/integration/GameRuntime.ts`, `src/simulation/contracts.ts`, `src/integration/GameRuntime.test.ts` | 进行中 | 明确离线缓存、重启恢复、去重键和批量消费契约，避免商业运营数据丢失或重复 |
| CIVILIZATION-NOTICE-ANALYTICS-PERSIST-01 | 提示分析持久化与批量上报边界 | `src/integration/cityNotices.ts`, `src/integration/GameRuntime.ts`, `src/integration/cityNotices.test.ts` | 已完成 | localStorage durable outbox、稳定事件键、peek/consume/acknowledge 批次接口已完成；网络发送仍未接入 |
| CIVILIZATION-NOTICE-ANALYTICS-TRANSPORT-01 | 分析批次传输与失败重试协议 | `src/integration/analyticsTransport.ts`, `src/integration/analyticsTransport.test.ts`, `src/integration/GameRuntime.ts` | 已完成 | 批次发送、部分确认、失败保留和有界指数退避已完成；真实 HTTP 适配器另行跟进 |
| CIVILIZATION-NOTICE-ANALYTICS-HTTP-01 | HTTP 分析服务适配器 | `src/integration/analyticsHttpTransport.ts`, `src/integration/analyticsHttpTransport.test.ts` | 已完成 | POST 批次、超时中止、非 2xx/非法响应拒绝、白名单确认和确定性幂等键已完成 |
| BROWSER-E2E-ANALYTICS-OUTBOX-01 | 分析队列浏览器证据 | `tools/browser-e2e/**`, `src/qa/browserE2eScenarios.ts` | 待开始 | 在可监听本地服务环境验证刷新恢复、批次 flush 和确认后的队列变化 |
| ART-COVERAGE-AUDIT-01 | 商业美术交付覆盖审计 | `tools/asset-validator/asset-coverage-audit.js`, `tools/asset-validator/asset-coverage-audit.self-test.js`, `package.json` | 已完成 | 对六个首批金样逐项核验 manifest、L0–L8、DCC 源文件和运行时二进制交付；当前门禁保持红灯，不把契约文件误判为成品 |
| ART-VISUAL-PROGRESSION-CONTRACT-01 | 建筑差异与繁荣成长契约 | `tools/asset-validator/asset-validator.js`, `tools/asset-validator/asset-coverage-audit.js`, `docs/project/gold-slice/sample-manifests/README.md` | 已完成 | 强制 visualIdentity、L0–L8 levelArc、至少三种轮廓阶段、L1/L3/L5/L7 主体变化和 L0 废墟/L8 繁荣语义 |
| ART-GOLD-SLICE-REBUILD-01 | 六类金样重建 | `docs/project/gold-slice/**`, `art-source/**`, `public/assets/**` | 进行中 | 先补齐 windfield-rice、main-granary、main-kiln，再重做 main-pier L2/L3/L5/L6/L7；必须由真实源文件和二进制导出通过覆盖审计 |
| ART-VISUAL-CATALOG-01 | 全建筑视觉身份与 L0–L8 成长目录 | `src/content/buildingVisualIdentity.ts`, `src/content/buildings.ts`, `src/simulation/contracts.ts`, `src/content/buildings.test.ts` | 已完成 | 28 类建筑拥有独立建筑类别、轮廓族、功能识别、材质语言、动态签名和从废墟到繁荣的九级视觉成长弧 |
| ART-CROSS-ASSET-UNIQUENESS-01 | 跨建筑轮廓/功能唯一性门禁 | `tools/asset-validator/asset-validator.js`, `tools/asset-validator/asset-coverage-audit.js`, `tools/asset-validator/asset-coverage-audit.self-test.js` | 已完成 | 金样 manifest 之间重复建筑类别、轮廓族或功能识别会被拒绝；当前仍因缺少真实资产交付保持红灯 |
| ART-RUNTIME-IDENTITY-FALLBACK-01 | 视觉身份动态渲染接入 | `src/rendering/visuals.ts`, `src/rendering/DynamicScene.test.ts` | 已完成 | 已映射但尚未交付 Prefab 的建筑按类别和等级显示身份化灰盒轮廓、动态尺寸和 L0–L8 功能轮廓标签，不再直接隐藏 |
| ART-RUNTIME-ARTWORK-SPRITE-01 | 运行时建筑美术精灵接入 | `src/rendering/artwork/buildingArtwork.ts`, `src/rendering/visuals.ts`, `src/components/SimulationCanvas.tsx` | 已完成 | 28 类建筑的 L0–L8 PNG 已由缓存 Provider 接入 Pixi；Provider 缺失时保留身份化灰盒降级 |
| ART-RUNTIME-ARTWORK-AUDIT-01 | 运行时 PNG 覆盖审计 | `tools/asset-validator/runtime-artwork-audit.js`, `src/rendering/artwork/buildingArtwork.test.ts` | 已完成 | 252 张 PNG 通过路径、尺寸、RGBA、PNG 结构和字节级唯一性检查；不替代 DCC/动画商业门禁 |
| ART-RUNTIME-DIFFERENTIATED-MOTION-01 | 建筑身份差异化动效层 | `src/rendering/visuals.ts`, `src/rendering/DynamicScene.test.ts` | 已完成 | 施工/升级、农业、水面、灯塔、水车、炊烟和营业活动由模拟 tick、建筑状态及视觉身份驱动；对象池复用稳定 |
| ART-DCC-PIPELINE-CONTRACT-01 | Blender 建模、动画与透明导出执行链 | `tools/art-pipeline/blender/build-gold-slice.py`, `docs/project/gold-slice/dcc-export-runbook.md` | 已完成 | 交付可在 Blender 4.x LTS 美术机执行的九级建模、锚点、碰撞、动画 action、透明预览和 provenance 导出脚本；当前未在本机执行 |
| ART-DCC-PIPELINE-CONTRACT-02 | DCC 生产契约漂移门禁 | `tools/art-pipeline/validate-pipeline-contract.js`, `package.json` | 已完成 | 10 项脚本门禁和 5 项规格门禁通过；不把门禁通过误报为真实模型交付 |
| ART-GOLD-SLICE-DCC-EXPORT-01 | main-pier 首个真实 DCC 金样导出 | `art-source/blender/buildings/main-pier/**`, `art-source/exports/buildings/main-pier/**` | 待开始 | 需在安装 Blender 的美术机生成源文件、九级透明预览、动作与 DCC provenance，随后接入覆盖审计 |
| ART-RUNTIME-ANIMATION-PLAN-01 | Prefab 状态槽位到运行时动画计划 | `src/rendering/prefab/animationRuntime.ts`, `src/rendering/prefab/animationRuntime.test.ts` | 已完成 | 将状态槽位、播放速率来源、生产/施工进度和 LOD 策略转换为确定性播放计划；实际图集播放接线仍待真实 DCC 资产 |
| ART-RUNTIME-ANIMATION-CONSUMPTION-01 | 动画播放计划接入 BuildingVisual | `src/rendering/visuals.ts`, `src/rendering/DynamicScene.test.ts` | 已完成 | 动态场景按建筑状态消费 Prefab slots，运动相位和状态标签携带生产/仓满等真实槽位；对象池 reset 清理旧计划 |
| ART-RUNTIME-ATLAS-DRIVER-01 | 真实图集 AnimatedSprite 驱动骨架 | `src/rendering/artwork/buildingAnimation.ts`, `src/rendering/visuals.ts`, `src/rendering/DynamicScene.ts`, `src/rendering/artwork/buildingAnimation.test.ts` | 已完成 | Provider、Spritesheet 适配器、确定性选帧、槽位复用和 reset 已接入；真实图集文件尚未交付 |
| ART-RUNTIME-ATLAS-ASSET-01 | main-pier 首套状态图集接入 | `art-source/exports/buildings/main-pier/**`, `public/assets/buildings/main-pier/**`, `src/components/SimulationCanvas.tsx` | 待开始 | 等待美术机交付 spritesheet PNG/JSON 与 provenance，再注入运行时并补浏览器证据 |
| ART-RUNTIME-ATLAS-LOADER-01 | 图集清单异步加载与安全降级 | `src/rendering/artwork/buildingAnimation.ts`, `src/rendering/artwork/buildingAnimationLoader.test.ts`, `src/components/SimulationCanvas.tsx` | 已完成 | manifest 校验、并行加载、Spritesheet 索引和加载失败回退已完成；当前没有真实清单可加载 |
| ART-RUNTIME-PARTICLE-PART-01 | 部件变换与粒子槽位运行时消费 | `src/rendering/artwork/buildingAnimation.ts`, `src/rendering/artwork/buildingAnimation.test.ts`, `src/rendering/DynamicScene.ts`, `src/components/SimulationCanvas.tsx` | 已完成 | part-transform 按锚点驱动部件，particle 使用独立纹理 Provider 和确定性 phase；无真实纹理时不生成伪资产 |
| ART-RUNTIME-PARTICLE-BENCH-01 | 部件/粒子性能基准 | `tools/qa/**`, `src/rendering/artwork/**` | 待开始 | 真实 DCC 资源到位后测量粒子数量、纹理预算、池命中率和目标设备帧率 |
| ART-RUNTIME-BUDGET-GATE-01 | 动画资源运行时预算门禁 | `tools/asset-validator/asset-validator.js`, `tools/asset-validator/self-test.js`, `tools/asset-validator/README.md` | 已完成 | 导出前限制槽位、部件、粒子、锚点和粒子 LOD；超预算直接失败 |
| ART-RUNTIME-PARTICLE-BENCH-01 | 部件/粒子性能基准 | `src/qa/animationRuntimeBudget.test.ts`, `src/rendering/artwork/buildingAnimation.ts`, `package.json` | 已完成（灰盒） | 300 个动画宿主、150 个可见建筑通过节点上限和对象池复用回归；真实设备帧率/显存仍待 DCC 资源和浏览器环境 |
| ART-PRODUCTION-PACKAGE-GATE-01 | 商业资源包完整性交付门禁 | `tools/asset-validator/production-package-audit.js`, `docs/project/gold-slice/dcc-export-runbook.md`, `package.json` | 已完成（门禁） | 要求九级透明预览、DCC provenance、runtime atlas/JSON、语义锚点和七状态证据；当前六类金样均按事实保持 RED |
| CIVILIZATION-RESIDENT-VISUAL-LIFECYCLE-01 | 居民生命周期场景表现 | `src/simulation/contracts.ts`, `src/simulation/core/SimulationEngine.ts`, `src/rendering/visuals.ts`, `src/rendering/DynamicScene.test.ts` | 已完成 | 候选 waiting/arriving/walking 使用不同状态表现；迁入家庭以真实 origin/settledTick 触发短时新入住高亮 |
| CIVILIZATION-RESIDENT-BROWSER-EVIDENCE-01 | 居民入住前后浏览器证据 | `tools/browser-e2e/**`, `src/qa/browserE2eScenarios.ts`, `src/integration/GameRuntime.test.ts` | 部分完成 | 已有真实浏览器场景通过，页面同时呈现候选家庭/外来家庭与居民状态；像素、位置、数量、活动和帧率采样仍待补齐 |
| BROWSER-E2E-RESIDENT-FIXTURE-01 | 居民生命周期调试场景注入 | `src/integration/GameRuntime.ts`, `tools/browser-e2e/run-browser-e2e.cjs` | 已完成 | 调试快照重新注入 live engine；浏览器 runner 不重复切换已打开的瓶颈抽屉 |
| ART-RUNTIME-IMAGE-RESOURCE-01 | 运行时 PNG 首帧资源加载 | `src/rendering/artwork/buildingArtwork.ts`, `src/components/SimulationCanvas.tsx` | 已完成（GPU 性能专项未完成） | 当前城市实际建筑资源在场景初始化前通过 Pixi Assets 预加载；真实浏览器已消除 `texImage2D: bad image data`，仍记录 GPU ReadPixels stall |
| ART-RUNTIME-IMAGE-PRELOAD-01 | 当前城市建筑资源预加载 | `src/rendering/artwork/buildingArtwork.ts`, `src/components/SimulationCanvas.tsx` | 已完成 | 按当前快照建筑类型预加载九级纹理，避免未解码 Image 直接首帧上传；未引入伪造资源或改变灰盒回退边界 |
| ART-RUNTIME-IMAGE-SAFETY-01 | 预加载安全门禁 | `src/rendering/artwork/buildingArtwork.ts`, `src/rendering/artwork/buildingArtwork.test.ts`, `src/components/SimulationCanvas.tsx` | 已完成 | 增加清单去重、最大纹理预算、超时、AbortSignal 取消和失败回退；不以无界等待阻塞场景启动 |
| QA-BROWSER-FRAME-METRICS-01 | 浏览器真实帧时间与读回证据 | `tools/browser-e2e/run-browser-e2e.cjs`, `docs/project/qa.md` | 已完成（基线） | E2E 输出帧数、平均/P95/最大帧耗时、画布尺寸和 WebGL readPixels 计数；当前 headless 基线仍不能替代目标设备验收 |
| QA-DYNAMIC-SCENE-PROFILE-01 | DynamicScene 分段同步性能采样 | `src/rendering/DynamicScene.ts`, `src/rendering/types.ts`, `src/components/SimulationCanvas.tsx`, `tools/browser-e2e/run-browser-e2e.cjs` | 已完成（基线） | 通过 `renderProfile=1` 采集 107 次同步；总耗时平均 0.368ms/P95 0.500ms，建筑阶段平均 0.237ms/P95 0.300ms；需真实资源和多环境复测 |

| CIVILIZATION-RESIDENT-ENTITY-BROWSER-01 | 居民动态实体数量浏览器证据 | `src/rendering/types.ts`, `src/rendering/DynamicScene.ts`, `tools/browser-e2e/run-browser-e2e.cjs` | 已完成（垂直切片） | 真实场景 88 次同步稳定观察到 5 建筑、3 居民、1 运输、1 掉落物、14 可见、63 池化；不覆盖生产规模、高频回收和目标设备性能 |
| QA-MULTI-ENV-PERF-BASELINE-01 | 三环境性能基线矩阵 | `src/qa/performanceBaseline.ts`, `src/qa/performanceBaseline.test.ts`, `tools/qa/run-performance-baseline.ts`, `tools/browser-e2e/run-browser-e2e.cjs`, `package.json` | 已完成（基线，门禁未通过） | 三环境场景功能和应用层 readPixels 通过；桌面 GPU 19.90ms、软件 30.41ms、嵌入代理 31.34ms 平均帧耗时，均超过 16.7ms 商业目标，需继续优化 |
| QA-RENDER-STATIC-INVALIDATION-01 | 建筑静态视觉失效缓存 | `src/rendering/visuals.ts`, `src/rendering/DynamicScene.test.ts` | 已完成（优化未达性能门禁） | 建筑主体、稳定 artwork 与空闲占位几何按签名变化重建；修复缓存命中时占位层互斥边界；三环境重复采样仍红，不能宣称帧率改善 |
| QA-REPEATED-PERF-AGGREGATION-01 | 多次性能采样与稳健聚合 | `src/qa/performanceBaseline.ts`, `src/qa/performanceBaseline.test.ts`, `tools/qa/run-performance-baseline.ts` | 已完成（统计契约） | 默认每环境 3 次，保留原始样本；帧时间取中位数，readPixels 取最差值；尚未重新跑完整 9 次矩阵 |
| QA-MULTI-ENV-PERF-RERUN-01 | 三环境重复性能实测 | `tools/qa/run-performance-baseline.ts`, `docs/project/qa.md` | 已完成（门禁未通过） | 3×3 Chromium 采样完成；场景/readPixels/同步通过，桌面/软件/嵌入平均帧 42.37/42.36/53.57ms，均超过商业目标 |
| QA-RENDER-SUBMISSION-PROFILE-01 | Pixi 渲染提交归因采样 | `src/components/SimulationCanvas.tsx`, `tools/browser-e2e/run-browser-e2e.cjs`, `src/qa/performanceBaseline.ts` | 已完成（单场景证据） | 桌面 GPU 单场景 renderer.render 平均 1.818ms/P95 4.3ms/最大 62.1ms；需继续做多环境聚合和资源对照 |
| QA-RENDER-ABLATION-01 | 渲染层差分开关与运行时回传 | `src/rendering/renderDiagnostics.ts`, `src/rendering/renderDiagnostics.test.ts`, `src/components/SimulationCanvas.tsx`, `tools/browser-e2e/run-browser-e2e.cjs` | 已完成（单场景验证） | 可独立关闭 authored artwork、图集动画和地形；默认生产模式不变；真实浏览器已验证配置回传，成组性能对照仍待执行 |
| QA-RENDER-ABLATION-RUNNER-01 | 四模式渲染差分执行器 | `tools/qa/run-render-ablation.ts`, `package.json` | 已完成（工具待矩阵证据） | 支持 full/no-artwork/no-animation/no-terrain、环境选择、重复次数和中位数聚合；需在稳定浏览器执行环境完成正式矩阵 |
| QA-ARTWORK-LAZY-LEVEL-PRELOAD-01 | 建筑原画按当前等级预加载 | `src/rendering/artwork/buildingArtwork.ts`, `src/components/SimulationCanvas.tsx`, `src/rendering/artwork/buildingArtwork.test.ts` | 已完成（方向性实测） | 启动只加载当前快照实际等级，升级等级按需加载；降低初始化纹理压力，但商业性能仍需真实设备和完整资源矩阵验收 |
| ART-RUNTIME-BUDGET-AUDIT-01 | 运行时 PNG 下载与显存预算门禁 | `tools/asset-validator/runtime-artwork-budget-audit.js`, `package.json` | 已完成（门禁 RED） | 已量化 28 包/252 张、125,331,330 bytes 下载和 264,241,152 bytes 解码内存；全量下载预算超标，需继续做 WebP/atlas/LOD 发行优化 |
| ART-RUNTIME-384-RELEASE-01 | 384px 运行时发行层 | `public/assets/buildings-runtime-384/**`, `src/rendering/artwork/buildingArtwork.ts`, `tools/asset-validator/runtime-artwork-audit.js` | 已完成（预算 GREEN） | 保留 512px 源资产，运行时切换 252 张 384px RGBA 派生图；发行包审计和预算均通过，真实 DCC/atlas 接入后需重新生成 |
| ART-RUNTIME-DERIVATIVE-PIPELINE-01 | 运行时派生包生成与 provenance | `tools/art-pipeline/build-runtime-artwork-derivatives.js`, `public/assets/buildings-runtime-384/runtime-artwork-manifest.json`, `package.json` | 已完成（PNG 发行层） | 可重复生成 384px 包并记录源哈希/体积/尺寸；真实 DCC/atlas 仍需接入同一流水线 |
| QA-CIVILIZATION-SCALE-PROBE-01 | 500户/300栋/150可见实体规模验收 | `src/qa/stressScenario.ts`, `src/qa/civilizationScale.test.ts`, `src/qa/civilizationLongRun.ts`, `src/qa/civilizationLongRunCheck.ts` | 已完成（模拟与场景同步） | 实际压力场景和连续两次 DynamicScene 同步均通过；真实浏览器规模帧时间仍待验证 |
| BROWSER-E2E-CIVILIZATION-SCALE-01 | 300栋/150可见实体真实浏览器压力验收 | `src/integration/GameRuntime.ts`, `src/components/SimulationCanvas.tsx`, `src/qa/browserE2eScenarios.ts`, `tools/browser-e2e/run-browser-e2e.cjs` | 已完成（规模通过，性能 RED） | 真实桌面 GPU 稳定验证 300 buildings、135 residents、15 transport、335–351 visible；功能通过，帧率门禁 RED |
| RENDER-SCALE-LONGTAIL-01 | 300栋规模渲染提交与长尾帧优化 | `src/rendering/**`, `src/components/SimulationCanvas.tsx`, `tools/browser-e2e/**`, `docs/project/qa.md` | 进行中 | 真实浏览器平均/P95/最大 118.52/166.4/166.4ms，renderer 最大 117.7ms；需完成差分归因和优化后复测 |
| RENDER-SNAPSHOT-CACHE-01 | 动态场景快照边界缓存 | `src/rendering/DynamicScene.ts`, `src/rendering/DynamicScene.test.ts` | 已完成（方向性收益） | 同一快照重复帧跳过图形重建；应用同步平均降至2.78ms，但rAF仍为129.14/216.7/216.7ms，性能总门禁继续 RED |
| RENDER-GPU-COMPOSITOR-01 | GPU/浏览器合成长尾定位 | `src/components/SimulationCanvas.tsx`, `src/rendering/**`, `tools/browser-e2e/**` | 进行中 | 需要静态画布、纹理上传、抗锯齿、分辨率和合成路径差分；当前最大 renderer 123.9ms且有GPU stall警告 |
| RENDER-GPU-RESOLUTION-AA-01 | 抗锯齿与分辨率差分 | `src/rendering/renderDiagnostics.ts`, `src/components/SimulationCanvas.tsx`, `src/rendering/renderDiagnostics.test.ts` | 已完成（归因证据，门禁 RED） | 1x/关闭抗锯齿后 rAF 54.35/83.3/83.3ms，renderer 5.26/18.1/114.7ms；确认合成路径敏感，但正式画质不能直接采用该降级 |
| RENDER-STATIC-CACHE-01 | 建筑静态视觉缓存实验 | `src/rendering/visuals.ts`, `src/rendering/DynamicScene.ts`, `src/rendering/renderDiagnostics.ts` | 已完成（实验否证） | 缓存主体/原画但不缓存状态动效；正式画质压力场景 rAF 恶化至122.26/166.4/166.4ms，默认保持关闭；下一步共享图集/批次优化 |
| RENDER-ATLAS-01 | 建筑共享 atlas 运行时差分 | `tools/art-pipeline/build-runtime-artwork-atlases.js`, `public/assets/buildings-runtime-atlas-webp/**`, `src/rendering/artwork/buildingArtwork.ts`, `src/rendering/renderDiagnostics.ts`, `tools/qa/run-render-ablation.ts` | 已完成（WebP 默认，性能门禁 RED） | 28 张 WebP atlas/252 帧真实生成并接入正式 provider；保留 `disableAtlas=1` 回退；桌面浏览器功能通过，但多环境矩阵尚未完成 |
| RENDER-ATLAS-PRODUCTION-GATE-01 | atlas 正式默认切换门禁 | `src/rendering/artwork/buildingArtwork.ts`, `src/components/SimulationCanvas.tsx`, `tools/qa/**` | 进行中（默认已切换，性能门禁 RED） | WebP 发行体积审计通过并已默认接入；仍需多环境、多重复、目标规模和纹理生命周期证据，不能宣称商业帧率达标 |
| QA-RENDER-ABLATION-LIFECYCLE-01 | 多次/多环境差分执行器生命周期修复 | `tools/qa/run-render-ablation.ts`, `tools/browser-e2e/run-browser-e2e.cjs`, `src/qa/browserE2eScenarios.ts`, `src/qa/browserE2eScenarios.test.ts` | 已完成 | 桌面 GPU 垂直切片与 civilization-scale full/no-atlas 均稳定返回 JSON；目标规模配置回传正确，readPixels=0 |
| ART-RUNTIME-WEBP-ATLAS-01 | WebP atlas 发行与完整性审计 | `tools/art-pipeline/build-runtime-artwork-atlases.js`, `tools/asset-validator/runtime-artwork-atlas-audit.js`, `public/assets/buildings-runtime-atlas-webp/**`, `package.json` | 已完成（体积 GREEN，性能 RED） | 28 张/252 帧/16.80 MiB，较 PNG atlas 约降低 68%；默认桌面功能回归通过，商业帧率仍未通过 |
| RENDER-SCALE-FULL-ART-01 | 目标规模全画质差分证据 | `src/qa/browserE2eScenarios.ts`, `tools/qa/run-render-ablation.ts`, `docs/project/qa.md` | 已完成（功能 GREEN，性能 RED） | 300 栋/135 居民/15 运输/150 可见目标规模在 full/no-atlas/no-artwork/no-animation/no-terrain 下稳定返回；full rAF 41.33/66.6/66.6ms，商业帧率仍未达标 |
| RENDER-VIEWPORT-CULLING-01 | 动态场景视口预裁剪 | `src/rendering/DynamicScene.ts`, `src/rendering/DynamicScene.test.ts` | 已完成（功能 GREEN，性能仍 RED） | 5 类动态实体在视觉更新前进行等距视口裁剪；远端建筑不会重建视觉，镜头移入可恢复；目标规模 renderer 3.146/8.1ms，rAF 41.02/66.6ms |
| RENDER-SCALE-LONGTAIL-01 | 目标规模渲染长尾优化 | `src/rendering/DynamicScene.ts`, `tools/qa/run-render-ablation.ts`, `docs/project/qa.md` | 进行中 | 已完成快照缓存与视口预裁剪；全画质 300 栋目标规模仍未达到 16.7ms，下一步转入可见区域 LOD、纹理上传节流与提交批次 |
