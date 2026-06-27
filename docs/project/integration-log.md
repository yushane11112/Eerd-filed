# 集成记录

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
