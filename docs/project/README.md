# 小耳岛项目中枢

本目录是《小耳岛》商业级城市文明模拟游戏的项目中枢，用于维护总目标、生产流水线、任务看板、集成记录、质量门禁、进度仪表盘和真实产物索引。

## 主目标

交付一款横屏、可全屏、可拖拽缩放的东方水乡城市文明模拟游戏。项目最终形态对齐《凯撒大帝》类城市建设：玩家从荒地规划道路、住宅、产业、市场、公共服务和行政设施，吸引外来人口迁入，形成就业、生产、仓储、物流、消费、税收、财政、服务和风险治理的真实城市闭环。

项目采用架空明清江南水乡设定。所有建筑、人物、交通、产业、美术和动画必须符合统一年代，不再把固定岛屿、听歌捡材料或固定 28 类建筑作为主线目标。

## 核心索引

- 完整上线总计划：`commercial-launch-master-plan.md`
- 跨电脑/空对话接续手册：`HANDOFF.md`
- 目标与执行节奏校准：`execution-strategy.md`
- 商业级文明目标：`commercial-civilization-target.md`
- 生产流水线：`production-pipeline.md`
- 世界观与年代设定：`design/world-bible.md`
- 可扩展建筑体系：`design/building-taxonomy.md`
- 人口生命周期：`design/population-lifecycle.md`
- 美术全阶段生产计划：`design/art-production-roadmap.md`
- 质量门禁：`gates.md`
- 任务看板：`task-board.md`
- 集成日志：`integration-log.md`
- 进度仪表盘：`progress-dashboard.md`
- 真实产物索引：`artifact-index.md`
- QA 与性能：`qa.md`

## 当前阶段

当前阶段为 P1.5：商业级垂直切片收敛期。

本阶段目标：

1. 保持商业级东方水乡城市文明模拟总目标不变。
2. 把已完成的城市模拟、物流、治理、建造、QA 和金标占位能力收敛成可演示垂直切片。
3. 优先做玩家可见、可操作、可验证的增量：建筑轮廓、道路铺装、街区氛围、活动密度和真实治理动作。
4. 按 `execution-strategy.md` 的验证分级执行，避免低风险任务消耗最高级别测试成本。

## 协作规则

- `src/simulation/contracts.ts` 是公共协议唯一来源，由主控会话维护。
- 并行任务、子会话产物和回流规则记录在 `parallel-production.md`，但后续任务必须服从 `commercial-launch-master-plan.md`。
- 子任务只修改任务清单中分配的目录，不覆盖其他任务改动。
- 模拟层不得引用 React 或 PixiJS；渲染层不得直接修改模拟状态。
- 每项任务必须包含目标、文件所有权、实现、测试、变更清单和已知限制。
- 合并顺序：公共契约 → 模拟 → 世界/建造 → 物流/市场 → 渲染 → UI → 内容/资产 → QA → 文档同步。
- 美术、建模和动画必须先通过年代一致性、功能辨识和状态驱动审计，禁止用静态图或通用特效冒充最终资产。

## 每轮交付要求

每轮完成后必须按变更风险更新：

1. `progress-dashboard.md`：阶段、风险和下一轮任务。
2. `HANDOFF.md`：跨电脑接续需要改变时更新。
3. `task-board.md`：新增或完成可追踪任务时更新。
4. `integration-log.md`：有代码、画面、测试或产品事实变化时更新。
5. `artifact-index.md`：实际新增或修改的代码、文档、资产、测试文件。
6. `qa.md`：记录本轮采用的验证等级、测试结果或跳过原因。

如果没有提交并推送 GitHub，不能宣称该轮可跨电脑接续。
