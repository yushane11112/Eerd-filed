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
| POP-MIGRATION-ENGINE-01 | 外来人口状态机实现 | `src/simulation/core/**`, `src/simulation/contracts.ts` | 待开始 | 人口不再凭空入住，抵达/等待/入住/离城可测 |
| CITY-ATTRACTION-01 | 城市吸引力评分 | `src/simulation/**`, `src/integration/**` | 待开始 | 空房、岗位、食物、水、税率、治安影响迁入 |
| TAXONOMY-RUNTIME-01 | 可扩展建筑分类运行时 | `src/content/**`, `src/simulation/**` | 待开始 | 建筑类别从固定清单转为阶段/功能/年代一致分类 |
| DISTRICT-PROSPERITY-01 | 街区繁荣系统 | `src/simulation/**`, `src/rendering/**` | 待开始 | 商业街、码头仓区等街区能驱动人流、灯火、装饰 |
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
| MODEL-BATCH-01 | 主镇建筑体块与街区模型 | 待分配 | 待开始 | 16 类主镇建筑 0–8 级模型 |
| MODEL-BATCH-02 | 三座主题岛生产设施模型 | 待分配 | 待开始 | 12 类主题建筑及生产地貌模型 |
| MODEL-BATCH-03 | 人物、车辆、船只与动画拆件 | 待分配 | 待开始 | 可绑定、可换装、可LOD资产 |
| ART-BATCH-01 | 港口与交通建筑重设计 | 待分配 | 待开始 | 审计完成后启动 |
| ART-BATCH-02 | 商业与民居建筑重设计 | 待分配 | 待开始 | 审计完成后启动 |
| ART-BATCH-03 | 作坊与仓储建筑重设计 | 待分配 | 待开始 | 审计完成后启动 |
| ART-BATCH-04 | 农业与主题岛建筑重设计 | 待分配 | 待开始 | 审计完成后启动 |
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
