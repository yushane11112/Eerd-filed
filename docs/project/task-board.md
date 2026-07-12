# 多会话任务看板

| ID | 会话职责 | 写入范围 | 状态 | 集成条件 |
| --- | --- | --- | --- | --- |
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
| VISUAL-STREET-DISTRICT-01 | 道路与街区质感 | `src/rendering/**`, `src/styles.css`, `docs/project/**` | 待开始 | 石路、土路、桥面、田埂、仓储堆场、集市外摆和水岸边界让城市结构更清楚 |
| VISUAL-ACTIVITY-FEEDBACK-01 | 活动密度与状态反馈 | `src/rendering/**`, `src/integration/**`, `docs/project/**` | 待开始 | 居民、货车、服务访问、市场人流、仓储忙碌和异常状态在地图上更容易看见 |
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
