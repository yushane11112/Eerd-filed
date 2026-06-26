# 集成记录

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
