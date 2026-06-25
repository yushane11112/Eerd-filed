# 多会话任务看板

| ID | 会话职责 | 写入范围 | 状态 | 集成条件 |
| --- | --- | --- | --- | --- |
| CORE-01 | 模拟时钟、家庭、就业 | `src/simulation/core/**` | 进行中 | 固定 Tick、确定性测试通过 |
| WORLD-01 | 网格、道路、建造、寻路 | `src/simulation/world/**` | 进行中 | 放置、连通、A* 测试通过 |
| LOG-01 | 生产、库存、订单、物流 | `src/simulation/economy/**` | 进行中 | 无瞬移运输、停工原因可解释 |
| RENDER-01 | Pixi 动态场景骨架 | `src/rendering/**` | 进行中 | 状态驱动、对象池、可视裁剪 |
| MUSIC-01 | 世界掉落与歌曲稀缺奖励 | `src/simulation/rewards/**` | 进行中 | 去重、概率、保底、队列测试 |
| UI-01 | 全屏、相机、建造控制 | `src/ui/**` | 进行中 | 鼠标和触屏输入测试 |
| QA-01 | 测试矩阵和性能工具 | `src/qa/**`, `docs/project/qa.md` | 进行中 | 基准场景可重复运行 |
| INTEGRATE-01 | 主应用垂直切片集成 | 主会话 | 待开始 | 所有第一轮模块通过 |

