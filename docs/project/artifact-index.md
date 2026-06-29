# 《小耳岛》项目产物索引

本文件记录每轮真实新增或修改的项目产物。只有写入这里的文件，才能算“项目内可检查产出”。

## 2026-06-29：第四十四轮居民服务/购物出行可视化

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/economy/service.ts` | 服务系统 | 服务成功时生成居民访问 agent，推进到服务点后返家并清理 |
| `src/simulation/economy/economy.test.ts` | 自动测试 | 验证服务访问生成、移动、返家、去重和清理 |
| `docs/project/task-board.md` | 任务看板 | 标记 SERVICE-VISIT-PATH-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第四十四轮启动、完成、验证和限制 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新城市模拟、动态引擎和人口生命周期完成度 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标测试和全量验证 |

## 2026-06-29：第四十三轮工人返家循环

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/contracts.ts` | 公共契约 | AgentEntity 增加 activityStartedTick，支持活动持续时间判断 |
| `src/simulation/core/SimulationEngine.ts` | 核心模拟 | 工人完成固定工作班次后生成返家路径并回到 home 状态 |
| `src/simulation/core/SimulationEngine.test.ts` | 自动测试 | 验证上班、工作、返家、回家完整路径循环 |
| `docs/project/task-board.md` | 任务看板 | 标记 WORKER-RETURN-HOME-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第四十三轮启动、完成、验证和限制 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新城市模拟、动态引擎和人口生命周期完成度 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标测试和全量验证 |

## 2026-06-29：第四十二轮工人通勤路径接入

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/core/SimulationEngine.ts` | 核心模拟 | 工人分配岗位后生成共享道路通勤路径，并逐 tick 移动到雇主入口 |
| `src/simulation/core/SimulationEngine.test.ts` | 自动测试 | 验证工人通勤路径、位置推进和抵达后 working 状态 |
| `docs/project/task-board.md` | 任务看板 | 标记 WORKER-COMMUTE-PATH-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第四十二轮启动、完成和行为边界 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新城市模拟、动态引擎和人口生命周期完成度 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标测试和全量验证 |

## 2026-06-29：第四十一轮物流共享路径接入

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/world/movementPath.ts` | 共享路径服务 | 新增严格寻路入口、无路不兜底选项和道路必需规则 |
| `src/simulation/world/movementPath.test.ts` | 自动测试 | 验证共享路径无路失败和桥路过水 |
| `src/simulation/economy/logistics.ts` | 物流系统 | RoadRoutePlanner 复用共享路径服务，不再自带分叉 BFS |
| `src/simulation/economy/economy.test.ts` | 自动测试 | 验证货运不能穿越普通水面或建筑占用格 |
| `docs/project/task-board.md` | 任务看板 | 标记 LOGISTICS-SHARED-PATH-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第四十一轮启动、完成和行为边界 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新城市模拟完成度和下一轮默认任务 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标测试和全量验证 |

## 2026-06-28：第三十六轮城市阶段图层指标定位

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/App.tsx` | 主界面 | 阶段面板图层指标可点击并定位对应覆盖点 |
| `src/styles.css` | 界面样式 | 将图层指标读数改为可交互按钮 |
| `docs/project/task-board.md` | 任务看板 | 标记 CITY-STAGE-OVERLAY-METRIC-FOCUS-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第三十六轮启动、完成和验证结果 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新 UI/UX 完成度和下一轮任务 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标测试和后续全量验证 |

## 2026-06-28：第三十五轮城市阶段面板图层指标

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/App.tsx` | 主界面 | 阶段面板显示当前打开图层的结构化指标 |
| `src/styles.css` | 界面样式 | 增加阶段图层指标读数样式 |
| `docs/project/task-board.md` | 任务看板 | 标记 CITY-STAGE-OVERLAY-PANEL-METRICS-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第三十五轮启动、完成和验证结果 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新 UI/UX 完成度和下一轮任务 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标测试和后续全量验证 |

## 2026-06-28：第三十四轮城市阶段覆盖图层结构化指标

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/stageAdvisor.ts` | 阶段顾问数据层 | 覆盖层增加结构化 metrics 字段 |
| `src/integration/stageAdvisor.test.ts` | 自动测试 | 验证四类图层输出结构化指标 |
| `docs/project/task-board.md` | 任务看板 | 标记 CITY-STAGE-OVERLAY-METRICS-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第三十四轮启动、完成和验证结果 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新 UI/UX 完成度和下一轮任务 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标测试和后续全量验证 |

## 2026-06-28：第三十三轮城市阶段覆盖图层摘要

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/stageAdvisor.ts` | 阶段顾问数据层 | 覆盖层增加摘要字段并为四类图层生成摘要 |
| `src/integration/stageAdvisor.test.ts` | 自动测试 | 验证住房、服务、物流和道路图层摘要 |
| `src/components/SimulationCanvas.tsx` | 地图画布 | 渲染覆盖图层摘要条 |
| `src/styles.css` | 界面样式 | 增加覆盖图层摘要条样式 |
| `docs/project/task-board.md` | 任务看板 | 标记 CITY-STAGE-OVERLAY-SUMMARY-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第三十三轮启动、完成和验证结果 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新 UI/UX 完成度和下一轮任务 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标测试和后续全量验证 |

## 2026-06-28：第三十二轮城市阶段物流热点诊断

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/stageAdvisor.ts` | 阶段顾问数据层 | 物流图层统计未完成订单端点并生成热点标记 |
| `src/integration/stageAdvisor.test.ts` | 自动测试 | 验证多条订单压到同一建筑时生成物流热点 |
| `docs/project/task-board.md` | 任务看板 | 标记 CITY-STAGE-LOGISTICS-HOTSPOT-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第三十二轮启动、完成和验证结果 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新 UI/UX 完成度和下一轮任务 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标测试和后续全量验证 |

## 2026-06-28：第三十一轮城市阶段道路缺口诊断

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/stageAdvisor.ts` | 阶段顾问数据层 | 道路图层按建筑功能细分缺路标签 |
| `src/integration/stageAdvisor.test.ts` | 自动测试 | 验证缺路住宅和缺路仓储标签 |
| `docs/project/task-board.md` | 任务看板 | 标记 CITY-STAGE-ROAD-GAP-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第三十一轮启动、完成和验证结果 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新 UI/UX 完成度和下一轮任务 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标测试和后续全量验证 |

## 2026-06-27：第三十轮城市阶段服务缺口诊断

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/stageAdvisor.ts` | 阶段顾问数据层 | 服务图层推导未被服务范围覆盖的住宅 |
| `src/integration/stageAdvisor.test.ts` | 自动测试 | 验证远离服务范围的住宅被标为“缺服务” |
| `docs/project/task-board.md` | 任务看板 | 标记 CITY-STAGE-SERVICE-GAP-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第三十轮启动、完成和验证结果 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新 UI/UX 完成度和下一轮任务 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标测试和后续全量验证 |

## 2026-06-27：第二十九轮城市阶段服务范围覆盖

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/stageAdvisor.ts` | 阶段顾问数据层 | 覆盖层支持范围区域，服务图层生成服务半径 |
| `src/integration/stageAdvisor.test.ts` | 自动测试 | 验证服务图层包含服务点和范围区域 |
| `src/components/SimulationCanvas.tsx` | 地图画布 | 渲染覆盖层范围椭圆和标签 |
| `src/styles.css` | 界面样式 | 增加服务范围半透明区域样式 |
| `docs/project/task-board.md` | 任务看板 | 标记 CITY-STAGE-SERVICE-RANGE-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第二十九轮启动、完成和验证结果 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新 UI/UX 完成度和下一轮任务 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标测试和后续全量验证 |

## 2026-06-27：第二十八轮城市阶段物流线路覆盖

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/stageAdvisor.ts` | 阶段顾问数据层 | 覆盖层支持路径线段，物流图层生成订单线路 |
| `src/integration/stageAdvisor.test.ts` | 自动测试 | 验证物流图层包含发货点、收货点和线路 |
| `src/components/SimulationCanvas.tsx` | 地图画布 | 渲染覆盖层路径、方向和标签 |
| `src/styles.css` | 界面样式 | 增加覆盖层线路、箭头和路径标签样式 |
| `docs/project/task-board.md` | 任务看板 | 标记 CITY-STAGE-LOGISTICS-PATH-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第二十八轮启动、完成和验证结果 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新 UI/UX 完成度和下一轮任务 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标测试和后续全量验证 |

## 2026-06-27：第二十七轮城市阶段覆盖图层开关

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/stageAdvisor.ts` | 阶段顾问数据层 | 新增住房、服务、物流、道路四类地图覆盖图层推导 |
| `src/integration/stageAdvisor.test.ts` | 自动测试 | 验证四类图层的关键覆盖点和标签 |
| `src/App.tsx` | 主界面 | 阶段面板增加图层开关，并随快照刷新打开的覆盖层 |
| `src/styles.css` | 界面样式 | 增加图层开关样式和服务/物流/道路标记颜色 |
| `docs/project/task-board.md` | 任务看板 | 标记 CITY-STAGE-LAYER-SWITCH-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第二十七轮启动、完成和验证结果 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新 UI/UX 完成度和下一轮任务 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标测试和后续全量验证 |

## 2026-06-27：第二十六轮城市阶段分层覆盖标记

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/stageAdvisor.ts` | 阶段顾问数据层 | 覆盖点增加类型、短标签和坐标，支持分层显示 |
| `src/integration/stageAdvisor.test.ts` | 自动测试 | 验证人口、吸引力和街区覆盖点的类型与标签 |
| `src/components/SimulationCanvas.tsx` | 地图画布 | 按覆盖点类型渲染分层标记 |
| `src/styles.css` | 界面样式 | 为住房、外来人口、瓶颈和街区核心设置不同标记颜色 |
| `docs/project/task-board.md` | 任务看板 | 标记 CITY-STAGE-LAYER-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第二十六轮启动、完成和验证结果 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新 UI/UX 完成度和下一轮任务 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标测试和后续全量验证 |

## 2026-06-27：第二十五轮城市阶段地图覆盖提示

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/stageAdvisor.ts` | 阶段顾问数据层 | 从快照按阶段条件推导地图覆盖点 |
| `src/integration/stageAdvisor.test.ts` | 自动测试 | 验证人口、吸引力和街区覆盖点推导 |
| `src/components/SimulationCanvas.tsx` | 地图画布 | 渲染阶段顾问覆盖标记 |
| `src/App.tsx` | 主界面 | 阶段顾问点击后设置地图覆盖 |
| `src/styles.css` | 界面样式 | 增加阶段覆盖标记样式 |
| `docs/project/task-board.md` | 任务看板 | 标记 CITY-STAGE-OVERLAY-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第二十五轮启动、完成和验证结果 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新 UI/UX 完成度和下一轮任务 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标测试和后续全量验证 |

## 2026-06-27：第二十四轮城市阶段原因诊断

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/content/runtimeBuildings.ts` | 内容运行时 | 阶段目标条件增加基于指标的具体诊断 |
| `src/content/buildings.test.ts` | 自动测试 | 验证普通阶段目标和具体卡点诊断 |
| `src/App.tsx` | 主界面 | 阶段顾问点击 toast 复用具体诊断原因 |
| `src/styles.css` | 界面样式 | 阶段按钮内显示诊断文本 |
| `docs/project/task-board.md` | 任务看板 | 标记 CITY-STAGE-DIAGNOSIS-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第二十四轮启动、完成和验证结果 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新 UI/UX 完成度和下一轮任务 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标测试和后续全量验证 |

## 2026-06-27：第二十三轮城市阶段可点击顾问

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/content/runtimeBuildings.ts` | 内容运行时 | 阶段目标条件增加顾问建议文案 |
| `src/content/buildings.test.ts` | 自动测试 | 验证阶段目标建议和条件仍保持一致 |
| `src/App.tsx` | 主界面 | 阶段条件可点击，按人口/吸引力/街区缺口触发下一步操作 |
| `src/styles.css` | 界面样式 | 阶段条件从静态块改为可交互按钮 |
| `docs/project/task-board.md` | 任务看板 | 标记 CITY-STAGE-ADVISOR-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第二十三轮启动、完成和验证结果 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新 UI/UX 完成度和下一轮任务 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标测试和后续全量验证 |

## 2026-06-27：第二十二轮旧群岛视图归档开关

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/game/legacy.ts` | 旧原型边界 | 定义旧群岛视图启用参数和静态 QA 参数 |
| `src/game/legacy.test.ts` | 自动测试 | 验证旧群岛渲染默认关闭，只能显式启用 |
| `src/legacy/archipelago/IslandCanvas.tsx` | 旧视图组件 | 默认显示归档提示，只有 legacy/QA 参数才启动旧 Pixi 渲染；第三十七轮后已迁出正式 components 目录 |
| `src/styles.css` | 界面样式 | 增加旧群岛归档提示样式 |
| `docs/project/task-board.md` | 任务看板 | 标记 LEGACY-ARCHIPELAGO-GATE-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第二十二轮启动、完成和验证结果 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新旧方向风险、UI/UX 完成度和下一轮任务 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标测试和后续全量验证 |

## 2026-06-27：第二十一轮旧听歌掉落原型隔离

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/game/engine.ts` | 旧原型兼容层 | 默认关闭听歌产生普通材料，保留显式 legacy 选项 |
| `src/game/engine.test.ts` | 自动测试 | 验证默认听歌不刷普通材料，旧行为只在 legacy 选项下可用 |
| `docs/project/task-board.md` | 任务看板 | 标记 LEGACY-LISTENING-DROPS-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第二十一轮启动、完成和验证结果 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新旧方向风险、UI/UX 完成度和下一轮任务 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标测试和后续全量验证 |

## 2026-06-27：第二十轮音乐奖励入口降级

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/App.tsx` | 主界面 | 听歌奖励从常驻卡片改为默认收起的“轻奖励”入口，展开后才可模拟 |
| `src/styles.css` | 界面样式 | 增加轻奖励收起/展开状态样式 |
| `docs/project/task-board.md` | 任务看板 | 标记 OPTIONAL-MUSIC-ENTRY-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第二十轮启动、完成和验证结果 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新旧方向风险、UI/UX 完成度和下一轮任务 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标检查和后续全量验证 |

## 2026-06-27：第十九轮城市阶段晋升提示

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/content/runtimeBuildings.ts` | 内容运行时 | 增加阶段阈值、阶段进度解释和下一阶段条件 |
| `src/content/buildings.test.ts` | 自动测试 | 验证阶段目标会列出人口、吸引力和街区要求 |
| `src/integration/GameRuntime.ts` | 运行时集成 | 统一导出阶段目标接口供 UI 使用 |
| `src/App.tsx` | 主界面 | 增加阶段目标面板，显示当前阶段、下一阶段和晋升条件 |
| `src/styles.css` | 界面样式 | 增加阶段目标面板样式 |
| `docs/project/task-board.md` | 任务看板 | 标记 CITY-STAGE-GOALS-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第十九轮启动、完成和验证结果 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新 UI/UX 完成度和下一轮任务 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标测试和后续全量验证 |

## 2026-06-27：第十八轮候选外来人口道路优先寻路

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/core/SimulationEngine.ts` | 模拟核心 | 候选人口进城路径改为读取网格、道路优先、避开水面和建筑占用，失败时退回直线 |
| `src/simulation/core/SimulationEngine.test.ts` | 自动测试 | 验证候选人口会绕到道路上进入住宅，而非横穿普通地块 |
| `docs/project/task-board.md` | 任务看板 | 标记 POP-MIGRATION-ROAD-PATH-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第十八轮启动、完成和验证结果 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新城市模拟和人口生命周期完成度 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标测试和后续全量验证 |

## 2026-06-27：第十七轮城建菜单阶段解锁

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/content/runtimeBuildings.ts` | 内容运行时 | 增加城市阶段标签、阶段推导、建筑解锁判断和菜单状态 |
| `src/content/buildings.test.ts` | 自动测试 | 验证 starter 菜单会按阶段锁定木作坊并在商贸镇解锁 |
| `src/integration/GameRuntime.ts` | 运行时集成 | 放置建筑前检查当前城市阶段，拒绝未解锁建筑 |
| `src/integration/GameRuntime.test.ts` | 自动测试 | 验证绕过 UI 放置未解锁建筑会失败 |
| `src/App.tsx` | 主界面 | 城建面板显示当前阶段，并把未解锁建筑置灰 |
| `src/styles.css` | 界面样式 | 增加锁定建筑按钮样式 |
| `docs/project/task-board.md` | 任务看板 | 标记 BUILD-MENU-STAGE-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第十七轮启动、完成和验证结果 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新建筑体系和 UI/UX 完成度 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标测试和后续全量验证 |

## 2026-06-27：第十六轮候选外来人口进城路径

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/contracts.ts` | 模拟公共契约 | 候选外来人口增加 `walking` 状态、路径和路径进度 |
| `src/simulation/core/SimulationEngine.ts` | 模拟核心 | 候选人从停留点走到目标住宅后才正式入住，并把路上家庭计入住房预占 |
| `src/simulation/core/SimulationEngine.test.ts` | 自动测试 | 验证候选人先等待、再沿路径移动，最终才生成家庭与就业 |
| `src/integration/cityNotices.ts` | 城市反馈 | 小事流区分“城口等房”和“正在进城”两种迁入状态 |
| `src/integration/cityNotices.test.ts` | 自动测试 | 验证正在进城的候选人可生成定位故事 |
| `docs/project/task-board.md` | 任务看板 | 标记 POP-MIGRATION-PATH-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第十六轮启动、完成和验证结果 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新人口生命周期、城市模拟和动态引擎完成度 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标测试和后续全量验证 |

## 2026-06-27：第十五轮街区繁荣系统

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/contracts.ts` | 模拟公共契约 | 增加街区繁荣状态、活动等级、视觉提示和城市街区指标 |
| `src/simulation/core/snapshot.ts` | 初始快照 | 初始化街区列表为空数组 |
| `src/simulation/districts/prosperity.ts` | 模拟数据层 | 按建筑街区亲和、等级、状态和相邻关系推导街区繁荣 |
| `src/simulation/districts/index.ts` | 模块出口 | 暴露街区繁荣推导方法 |
| `src/simulation/districts/prosperity.test.ts` | 自动测试 | 验证街区分组、繁荣评分、视觉提示和指标汇总 |
| `src/integration/GameRuntime.ts` | 运行时集成 | 每次快照刷新时派生街区数据并写入指标 |
| `src/integration/GameRuntime.test.ts` | 自动测试 | 验证启动城镇能产出街区与街区指标 |
| `src/rendering/types.ts` | 渲染契约 | 增加 `district` 可渲染实体和 `districts` 同步统计 |
| `src/rendering/layers.ts` | 渲染层级 | 增加道路之上、建筑之下的 `districts` 图层 |
| `src/rendering/visuals.ts` | 程序化视觉 | 增加街区地表暖光、灯点和人流轻表现 |
| `src/rendering/DynamicScene.ts` | 动态场景 | 同步并回收街区繁荣视觉对象 |
| `src/rendering/DynamicScene.test.ts` | 自动测试 | 验证街区视觉层级、标签和同步复用 |
| `docs/project/task-board.md` | 任务看板 | 标记 DISTRICT-PROSPERITY-01 完成 |
| `docs/project/integration-log.md` | 集成记录 | 记录第十五轮启动、完成和验证结果 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新城市模拟、动态引擎、建筑体系完成度和下一轮任务 |
| `docs/project/qa.md` | 验收记录 | 记录本轮目标测试、全量测试和构建结果 |

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

## 2026-06-29：第三十七轮旧群岛 legacy 边界集中

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/legacy/README.md` | legacy 边界说明 | 明确 `src/legacy/**` 只保留归档原型、QA 对照和迁移工具，禁止新主线引用 |
| `src/legacy/archipelago/IslandCanvas.tsx` | 归档旧视图组件 | 旧群岛 Pixi 视图从正式 `src/components` 目录迁入 legacy 范围 |
| `src/legacy/archipelago/index.ts` | 归档导出边界 | 仅为显式 legacy/QA 入口暴露旧群岛组件 |
| `src/game/legacy.test.ts` | 自动测试 | 固定旧群岛渲染默认关闭，并验证旧组件不再位于正式 components 目录 |
| `docs/project/task-board.md` | 任务看板 | 记录 `LEGACY-ARCHIPELAGO-SCOPE-01` 已完成 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第三十七轮进展、UI/UX 完成度、风险和下一轮任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮 legacy 边界迁移事实 |
| `docs/project/qa.md` | QA 记录 | 记录本轮验证命令和结果 |

## 2026-06-29：第三十八轮共享移动路径服务

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/world/movementPath.ts` | 共享模拟工具 | 提供道路优先、避开水面/建筑占用且无网格时安全直线 fallback 的移动路径服务 |
| `src/simulation/world/movementPath.test.ts` | 自动测试 | 固定道路优先、fallback、避开阻挡/水面三类路径行为 |
| `src/simulation/core/SimulationEngine.ts` | 模拟核心 | 候选外来人口进城路径改为使用共享移动路径服务，移除内部重复寻路实现 |
| `docs/project/task-board.md` | 任务看板 | 记录 `SHARED-MOVEMENT-PATH-01` 已完成 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第三十八轮进展、城市模拟/人口生命周期完成度和下一轮任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮路径服务抽取事实 |
| `docs/project/qa.md` | QA 记录 | 记录本轮验证命令和结果 |

## 2026-06-29：第三十九轮图层指标治理卡

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/integration/stageAdvisor.ts` | 城市顾问数据层 | 将服务缺口、道路缺口和物流热点等图层结构化指标派生为可排序治理卡 |
| `src/App.tsx` | 主界面 | 瓶颈面板合并治理卡，点击后可定位到对应服务缺口、道路缺口或物流热点 |
| `src/integration/stageAdvisor.test.ts` | 自动测试 | 验证治理卡排序、目标点和图层来源 |
| `docs/project/task-board.md` | 任务看板 | 记录 `CITY-GOVERNANCE-CARDS-01` 已完成 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第三十九轮进展、UI/UX 完成度和下一轮任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮治理卡接入事实 |
| `docs/project/qa.md` | QA 记录 | 记录本轮验证命令和结果 |

## 2026-06-29：第四十轮街区繁荣真实运行因子

| 文件 | 产物类型 | 用途 |
| --- | --- | --- |
| `src/simulation/districts/prosperity.ts` | 模拟系统 | 街区繁荣评分接入道路贴近、服务建筑和真实物流订单活动 |
| `src/simulation/districts/prosperity.test.ts` | 自动测试 | 验证相同建筑聚集下，服务覆盖、道路访问和物流活动会提高街区繁荣与人流表现 |
| `docs/project/task-board.md` | 任务看板 | 记录 `DISTRICT-PROSPERITY-RUNTIME-01` 已完成 |
| `docs/project/progress-dashboard.md` | 进度仪表盘 | 更新第四十轮进展、城市模拟/动态引擎完成度和下一轮任务 |
| `docs/project/integration-log.md` | 集成记录 | 记录本轮真实运行因子接入事实 |
| `docs/project/qa.md` | QA 记录 | 记录本轮验证命令和结果 |
