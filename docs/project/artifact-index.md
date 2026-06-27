# 《小耳岛》项目产物索引

本文件记录每轮真实新增或修改的项目产物。只有写入这里的文件，才能算“项目内可检查产出”。

## 2026-06-27：第十四轮建筑分类运行时

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/contracts.ts` | 模拟公共契约 | `BuildingDefinition` 增加城市阶段、功能、连接方式、年代标签和街区亲和 |
| `src/content/buildings.ts` | 建筑内容目录 | 为 28 类建筑补齐阶段/功能/连接/年代元数据，并提供阶段、功能和年代一致性查询 |
| `src/content/runtimeBuildings.ts` | 运行时建筑目录 | 新增 starter 运行时定义，保留旧类型兼容并映射到金标分类资产 |
| `src/content/buildings.test.ts` | 自动测试 | 验证元数据、阶段查询、功能查询、年代一致性和 starter 兼容 |
| `src/integration/GameRuntime.ts` | 运行时集成 | 主模拟运行时改为读取内容目录里的 starter 建筑定义 |
| `docs/project/task-board.md` | 任务看板 | 标记 TAXONOMY-RUNTIME-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第十四轮启动、完成和验证结果 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新建筑体系完成度和下一轮任务 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标测试、全量测试和构建结果 |

## 2026-06-27：第十三轮迁入可视反馈

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/contracts.ts` | 模拟公共契约 | 候选外来人口增加地图位置和目标住宅 |
| `src/simulation/core/SimulationEngine.ts` | 模拟核心 | 候选外来人口抵达时选择临时停留点，并在等待过程中更新目标住宅 |
| `src/simulation/core/SimulationEngine.test.ts` | 自动测试 | 验证候选人拥有停留点和目标住宅 |
| `src/rendering/DynamicScene.ts` | 动态渲染 | 将等待中的迁入候选人同步到居民层 |
| `src/rendering/visuals.ts` | 程序化视觉 | 为迁入候选人绘制小队式临时停留表现 |
| `src/rendering/DynamicScene.test.ts` | 自动测试 | 验证迁入候选人会渲染到居民层 |
| `src/integration/cityNotices.ts` | 城市反馈 | 增加等待迁入候选人的小事流提示与定位目标 |
| `src/integration/cityNotices.test.ts` | 自动测试 | 验证等待迁入小事可生成并定位 |
| `docs/project/task-board.md` | 任务看板 | 标记 POP-MIGRATION-VISUAL-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第十三轮启动、完成和验证结果 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新人口生命周期、动态引擎、UI 完成度和下一轮任务 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标测试、全量测试和构建结果 |

## 2026-06-27：第十二轮运行时生产

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/contracts.ts` | 模拟公共契约 | 增加候选外来人口状态和迁入/离开事件，城市指标增加开放住房、吸引力和等待人口 |
| `src/simulation/core/snapshot.ts` | 初始快照 | 初始化候选外来人口集合 |
| `src/simulation/core/SimulationEngine.ts` | 模拟核心 | 外来人口按城市吸引力抵达，等待住房，成功入住或因无房/低吸引力/超时离开 |
| `src/simulation/core/SimulationEngine.test.ts` | 自动测试 | 覆盖候选抵达、入住、低吸引力不来、无房离开和指标更新 |
| `src/App.tsx` | 主界面 | 城市指标栏显示吸引力评分 |
| `docs/project/task-board.md` | 任务看板 | 标记 POP-MIGRATION-ENGINE-01 与 CITY-ATTRACTION-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第十二轮启动、完成和验证结果 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新人口生命周期、城市模拟、UI 完成度和下一轮任务 |
| `docs/project/qa.md` | 验收记录 | 记录本轮测试与构建结果 |

## 2026-06-27：商业级完整上线总计划与美术全阶段计划

### 新增文档

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `docs/project/commercial-launch-master-plan.md` | 项目总规划 | 定义完整商业级上线目标、阶段、生产线、自动执行和产出记录机制 |
| `docs/project/design/world-bible.md` | 世界观/年代规范 | 约束建筑、交通、服饰、材料、产业和美术边界 |
| `docs/project/design/building-taxonomy.md` | 建筑体系 | 定义可扩展建筑分类、城市阶段和街区繁荣机制 |
| `docs/project/design/population-lifecycle.md` | 系统设计 | 定义外来人口、入住、生活、离城和城市吸引力 |
| `docs/project/design/art-production-roadmap.md` | 美术生产计划 | 定义从 ART-P0 到 ART-P11 的全阶段美术任务、分工和门禁 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 记录阶段、完成度、风险和下一轮默认任务 |
| `docs/project/artifact-index.md` | 产物索引 | 记录每轮真实项目产出 |

### 同步更新文档

| 文件 | 更新目的 |
| --- | --- |
| `docs/project/README.md` | 将项目中枢主目标改为东方水乡城市文明模拟 |
| `docs/project/commercial-civilization-target.md` | 废弃旧岛屿/听歌/28 类主线，更新商业级硬标准 |
| `docs/project/production-pipeline.md` | 在流水线顶部声明新的商业级上线方向 |
| `docs/project/gates.md` | 增加统一年代、可扩展建筑、人口生命周期和美术全阶段门禁 |
| `docs/project/task-board.md` | 增加 P0 中枢与商业级路线任务 |
| `docs/project/integration-log.md` | 记录本轮集成 |

### 补强更新

| 文件 | 更新目的 |
| --- | --- |
| `docs/project/commercial-launch-master-plan.md` | 将 ART-P0–P11 美术全阶段上线要求纳入总计划本体，而不只作为独立美术文档 |
| `docs/project/production-pipeline.md` | 清理 28×9、四岛、音乐奖励、拾取材料等旧主线冲突，改为可扩展建筑/街区和人口生命周期流水线 |
| `docs/project/gates.md` | 清理 G0/G2/G4/最终发布门禁中的旧范围，改为建筑/街区资产矩阵、人口生命周期和城市问题诊断 |
| `docs/project/task-board.md` | 增加 `DOC-SYNC-20260627B`，记录本轮完整上线计划一致性补强 |
| `docs/project/progress-dashboard.md` | 更新 P0 阶段完成度、当前风险和下一轮任务 |

## 2026-06-27：跨电脑 / 空对话接续手册

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `docs/project/HANDOFF.md` | 项目交接手册 | 说明另一台电脑如何 clone、checkout、测试、恢复新 Codex 对话上下文，以及回到当前电脑如何继续 |
| `docs/project/README.md` | 项目索引 | 增加 HANDOFF 入口，确保新会话能优先找到接续手册 |
