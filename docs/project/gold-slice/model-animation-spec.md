# 《小耳岛》金标建筑建模、动画与 Pixi Prefab 生产规格

版本：0.1  
任务：MODEL-ANIM-01  
范围：六类金标建筑：`main-homes` 柳岸民居、`windfield-rice` 层层稻田、`main-granary` 丰年粮仓、`main-eatery` 小满食肆、`main-kiln` 青瓦瓷窑、`main-pier` 旧码头  
输出目标：把美术规格转成 DCC 源资产、2.5D 分层序列、PixiJS Prefab、manifest 与自动校验规则。  
只读依据：`design/modeling-system.md`、`design/animation-system.md`、`audits/modeling.md`、`audits/animation.md`、`audits/building-art.md`

## 1. 总原则

六类金标不是“六张好看的建筑图”，而是后续 28 类建筑批量生产的可执行模板。凡是只交付单张 PNG、整栋合层图片、无 pivot 的假动画、或无法被模拟状态驱动的循环装饰，都不合格。

强制原则：

1. DCC 源资产使用 Blender 4.x LTS，`1 BU = 1 m`，正交等距相机、统一光照和透明分层输出。
2. 运行时仍是 PixiJS 2.5D，不把整座建筑烘成不可拆的单图。主体、前景遮挡、阴影、灯火、机械、货物、粒子发射口、UI 锚点必须分离。
3. 所有生产、服务、物流、施工、停工动画必须追溯到 `SimulationSnapshot`、订单或带 Tick 的表现事件。无状态循环只能标为 `ambient`，不得冒充产出。
4. 金标至少交付 L0、L1、L4、L8；`main-homes` 与 `main-pier` 建议作为连续 L0–L8 验证对象。若后续选择其他两类做全等级，必须在 manifest 标记原因。
5. 六类隐藏名称后仍须可辨。若民居、食肆、粮仓、瓷窑都靠同一套屋顶、烟和人群表达，视为系统性失败。

## 2. DCC 到 2.5D 到 Pixi 流水线

```text
指标卡/体块图
  → Blender blockout
  → 低模/关键高模/材质
  → 拆件、pivot、锚点、碰撞代理
  → 分状态批量渲染透明序列
  → TexturePacker 图集 + JSON
  → building-manifest.json / animation-manifest.json
  → Pixi Prefab 注册
  → 自动校验 + 状态驱动录像
```

### 2.1 目录与命名

每类金标资产必须使用稳定资产 ID：

```text
art-source/blender/buildings/{asset_id}/
art-source/exports/buildings/{asset_id}/level_{00..08}/
art-source/manifests/buildings/{asset_id}/
public/assets/buildings/{asset_id}/
```

对象命名：

```text
BLD_{asset_id}_L{level}_{part}_{variant}
ANC_{asset_id}_{purpose}_{index}
COL_{asset_id}_{purpose}
```

示例：`BLD_main_kiln_L04_kiln_door_A`、`ANC_main_pier_berth_02`、`COL_windfield_rice_occluder`。

禁止对象名：`Cube.001`、`final_final`、中文名、无语义缩写、负缩放镜像件。

### 2.2 标准集合

每个 `.blend` 必须包含：

```text
COL_REF
COL_BLOCKOUT
COL_L00 ... COL_L08
COL_SHARED
COL_ANIM
COL_COLLISION
COL_ANCHOR
COL_RENDER
```

`COL_SHARED` 存放跨等级共享结构；等级集合只控制差异件，不允许复制整栋九次。`COL_ANIM` 只放可动画部件和其绑定空物体，不放静态主体。

## 3. 六类金标体块规格

### 3.1 `main-homes` 柳岸民居

功能身份：连续居住街坊，是人口系统的视觉基础，不是单栋地标楼。

建议占地：L0–L1 为 2×2 或 3×2；L4 为 4×3 街坊片段；L8 为 5×4 连续里弄模板。  
主识别体：错落白墙灰瓦、多户门巷、井台/灶间/晾晒生活院。  
禁止：塔楼化、宫殿化、整齐复制同一户型、用商业外摆替代居住。

等级体块：

| 等级 | 体块目标 | 功能增量 |
| --- | --- | --- |
| L0 | 旧宅基、残墙、井台、废灶 | 保留门巷方向和未来街坊边界 |
| L1 | 单户小屋可入住 | 1 个入口、1 个生活点、低强度炊烟 |
| L4 | 三五户院落成组 | 晾衣、灶间、井台、儿童/居民活动点 |
| L8 | 连续水乡街坊 | 多户门巷、窗灯递次、归家/做饭/晾晒并行 |

必须拆件：`door_*`、`window_shutter_*`、`laundry_line_*`、`cooking_smoke_emitter`、`night_lights`、`foreground_eaves`、`resident_activity_props`。

### 3.2 `windfield-rice` 层层稻田

功能身份：连续梯田面与灌溉系统。建筑小屋只能辅助，不得成为主体。

建议占地：L0–L1 为 3×3；L4 为 4×4；L8 为 5×4 或更大地貌块。  
主识别体：等高线田面、田埂、水渠、水闸、作物阶段。  
禁止：画成平地草坪、花园、单栋农舍，或把植株全部烘进不可替换底图。

等级体块：

| 等级 | 体块目标 | 功能增量 |
| --- | --- | --- |
| L0 | 荒田、断田埂、淤塞水口 | 可读梯田边界 |
| L1 | 小块可灌溉田 | 1 条进水渠、1 个农事点 |
| L4 | 多层田面和田舍 | 插秧/灌溉/收割分区 |
| L8 | 完整梯田与水利系统 | 多田块错峰农事、粮车/稻捆路线 |

必须拆件：`field_plot_stage_*`、`bund_*`、`irrigation_gate_*`、`water_surface_*`、`crop_rows_*`、`straw_stack_*`、`worker_slots_*`。

### 3.3 `main-granary` 丰年粮仓

功能身份：架空防潮仓体、重复仓门、装卸栈台和晒粮区。

建议占地：L0–L1 为 3×2；L4 为 4×3；L8 为 5×3。  
主识别体：低长架空仓、通风窗、仓门节奏、粮袋和晒场。  
禁止：做成民居组团、通用仓库盒子、或与晒谷长仓共用同一剪影。

等级体块：

| 等级 | 体块目标 | 功能增量 |
| --- | --- | --- |
| L0 | 塌粮架、破仓门、散粮 | 保留架空台基和装卸方向 |
| L1 | 单仓恢复 | 1 个仓门、1 个卸粮点 |
| L4 | 双仓或长仓加晒坪 | 入库、盘点、翻晒点 |
| L8 | 多仓联动与栈台 | 粮车调度、粮袋堆、麻雀/防潮细节 |

必须拆件：`warehouse_door_*`、`vent_window_*`、`grain_bag_stack_*`、`loading_chute_*`、`raised_platform`、`drying_mat_*`、`foreground_roof`。

### 3.4 `main-eatery` 小满食肆

功能身份：厨房、饭点、街边烟火和服务翻台。

建议占地：L0–L1 为 2×2；L4 为 3×2；L8 为 4×3。  
主识别体：前堂低檐、后厨高烟口、明档灶间、外摆棚。  
禁止：复制茶楼二层主体、只加恒定烟雾当营业、把食客当装饰常驻。

等级体块：

| 等级 | 体块目标 | 功能增量 |
| --- | --- | --- |
| L0 | 冷灶、破蒸笼、倒菜单牌 | 厨房位置可读 |
| L1 | 路边灶摊 | 灶口、备菜案、1 个服务点 |
| L4 | 前店后厨 | 上菜路线、外摆桌、食材入库点 |
| L8 | 多灶口食肆与食棚 | 饭点高密度翻台，非饭点降为备餐 |

必须拆件：`stove_fire`、`steamer_stack_*`、`prep_counter`、`serving_window`、`table_set_*`、`menu_board`、`smoke_emitter_*`、`night_lanterns`。

### 3.5 `main-kiln` 青瓦瓷窑

功能身份：窑体、烟道、泥料池、晾坯棚和瓷架组成产业院。

建议占地：L0–L1 为 3×2；L4 为 4×3；L8 为 5×4。  
主识别体：低长龙窑或厚重馒头窑、窑门、烟囱/烟闸、坯架、柴垛。  
禁止：普通带烟囱民居、持续满烟、只用火光证明生产。

等级体块：

| 等级 | 体块目标 | 功能增量 |
| --- | --- | --- |
| L0 | 破窑基、冷火膛、倒坯架 | 窑体方向和防火空带 |
| L1 | 单穴小窑 | 1 个窑门、1 个添柴/取坯点 |
| L4 | 窑体、泥池、晾坯棚 | 和泥、入窑、烧制、出窑路线 |
| L8 | 多窑轮烧产业院 | 多窑错峰、瓷架库存、装卸线 |

必须拆件：`kiln_body`、`kiln_door_*`、`firebox_*`、`smoke_flue_*`、`clay_pit`、`blank_shelf_*`、`ceramic_rack_*`、`woodpile_*`、`ash_vfx_anchor`。

### 3.6 `main-pier` 旧码头

功能身份：货运码头；主体是栈桥、仓棚、吊装、泊位和人货流线。

建议占地：L0–L1 为 3×2 含水边；L4 为 4×3；L8 为 5×4 或 6×4 水陆混合。  
主识别体：多指状木石泊位、系缆柱、跳板、吊杆、货棚、货位。  
禁止：观景亭、单亭栈桥、用大船装饰替代码头成长。

等级体块：

| 等级 | 体块目标 | 功能增量 |
| --- | --- | --- |
| L0 | 断裂木桩、半塌栈桥、搁浅货箱 | 泊位方向可读 |
| L1 | 木栈桥可停靠 | 1 个泊位、1 个装卸点 |
| L4 | 木石混合码头与货棚 | 2 个泊位、跳板、搬运路线 |
| L8 | 石砌主埠、多泊位和吊装架 | 至少 3 个泊位、2 条人货流线、港灯 |

必须拆件：`pier_deck_*`、`bollard_*`、`gangplank_*`、`crane_arm_*`、`winch_wheel`、`cargo_stack_*`、`warehouse_awning`、`berth_marker_*`、`water_wake_anchor_*`。

## 4. LOD 与性能预算

### 4.1 DCC 源面数预算

预算用于离线渲染源场景，不是质量目标。超预算必须提交近景收益截图和批准记录。

| 资产 | LOD0 | LOD1 | LOD2 | 说明 |
| --- | ---: | ---: | ---: | --- |
| `main-homes` | 75k | 38k | 15k | L8 多户街坊，重复瓦件和植被必须实例化 |
| `windfield-rice` | 70k | 35k | 12k | 田埂、水渠、植株分组实例化 |
| `main-granary` | 60k | 30k | 12k | 仓体、粮袋、晒场分层 |
| `main-eatery` | 45k | 22k | 9k | 桌椅、蒸笼、厨房道具按组预算 |
| `main-kiln` | 100k | 50k | 20k | 窑体、坯架、柴垛和烟道可见轮廓优先 |
| `main-pier` | 110k | 55k | 22k | 水陆混合、泊位、吊装和货棚分区 |

### 4.2 Pixi 运行预算

单个金标建筑 L8 近景上限：

| 项目 | 上限 |
| --- | ---: |
| 静态 sprite layers | 10 |
| 同时运行 AnimatedSprite | 6 |
| 部件 transform 动画 | 12 |
| 粒子发射器 | 4 |
| 动态灯/发光层 | 4 |
| draw calls 增量 | LOD0 ≤ 10，LOD1 ≤ 6，LOD2 ≤ 3 |
| 常驻纹理显存 | LOD0 ≤ 12 MB，LOD1 ≤ 6 MB，LOD2 ≤ 2 MB |
| 单建筑 CPU update | LOD0 ≤ 0.08 ms，LOD1 ≤ 0.04 ms，LOD2 ≤ 0.015 ms |

压力场景仍以全局目标为准：常态 draw calls ≤ 180，峰值 ≤ 260；平均 ≥ 50 FPS，1% Low ≥ 40 FPS。任何金标单体不得通过“未来优化”逃避预算。

### 4.3 运行时 LOD

| LOD | 屏幕条件 | 建筑表现 | 人物/活动 | VFX |
| --- | --- | --- | --- | --- |
| LOD0 | zoom ≥ 1.15 或被选中 | 主体、前景、灯火、机械、装卸、服务全开 | 完整代表人物和附件 | 100% |
| LOD1 | 0.72 ≤ zoom < 1.15 | 主工序、关键货物、主要门窗 | 减少细碎互动 | 60% |
| LOD2 | 0.4 ≤ zoom < 0.72 | 低帧率轮廓动画，合并小件 | 代表性活动点 | 25% |
| LOD3 | zoom < 0.4 或远离视口 | 静态或 2–4 帧状态贴图 | 不显示个体 | 只保留大烟/水光/灯塔级信号 |

LOD 切换不得改变 footprint、入口、装卸点、泊位、生产事实或碰撞。

## 5. 分层、pivot 与锚点规范

### 5.1 Pixi 渲染层

每个等级至少导出以下逻辑层。不适用层必须在 manifest 中写 `none`，不得省略。

```text
shadow
ground/foundation
body_back
production_static
production_dynamic
agent_interaction
body_front/foreground_occluder
night_lights
weather_overlay
vfx
ui_anchor
```

`body_front/foreground_occluder` 必须配套遮挡多边形，不能仅靠 zIndex 猜测人物进出。

### 5.2 Pivot 规则

| 部件 | Pivot 必须位于 |
| --- | --- |
| 门/窗 | 真实铰链或滑动轨道起点 |
| 旗/布/晾衣 | 固定边中心或绳端 |
| 水闸/跳板 | 转轴或铰链线 |
| 绞盘/水轮/磨盘 | 旋转轴中心 |
| 吊杆 | 支承转轴；吊钩独立 pivot |
| 窑门/炉门 | 门轴或滑轨 |
| 灯塔类光束 | 光源旋转轴；本批只有码头港灯可用简化灯层 |
| 粮袋/货箱/盐袋/稻捆 | 底面中心，便于堆叠 |

所有 pivot 坐标必须从 Blender 导出到 manifest，以局部米制坐标和局部像素坐标双写。禁止用运行时手调修 pivot。

### 5.3 通用锚点

每类建筑至少声明：

```text
origin
entrance_*
worker_*
input_*
output_*
service_*
queue_*
ui_status
ui_selection
audio_*
construction_*
occlusion_polygon
collision_obstacle
click_hull
```

特定建筑额外要求：

| 建筑 | 额外锚点 |
| --- | --- |
| `main-homes` | `home_door_*`、`window_light_*`、`cooking_smoke_*`、`return_home_*` |
| `windfield-rice` | `irrigation_in_*`、`irrigation_out_*`、`field_work_*`、`crop_stage_region_*` |
| `main-granary` | `grain_chute_*`、`cart_bay_*`、`drying_area_*`、`bird_perch_*` |
| `main-eatery` | `stove_*`、`serving_window_*`、`table_*`、`takeaway_*`、`smoke_*` |
| `main-kiln` | `kiln_fire_*`、`smoke_flue_*`、`clay_input_*`、`ceramic_output_*`、`fire_safety_gap` |
| `main-pier` | `berth_*`、`water_route_*`、`gangplank_*`、`winch_*`、`cargo_lane_*` |

## 6. 状态机与动画规格

### 6.1 必须覆盖状态

六类金标建筑必须覆盖以下顶层状态：

```text
constructing
working
blocked
serving
storage_full
idle
```

其中 `storage_full` 既可作为 `blocked` 的 reason，也必须提供独立视觉姿态；不能只显示通用停工图标。

优先级：

```text
constructing/upgrading
  > blocked/storage_full
  > working
  > serving
  > idle
  > ambient
```

若同一 Tick 同时有生产和服务，按建筑定义分槽并行；主生产槽不得被服务槽抢占。例如食肆可同时 `working` 厨房和 `serving` 桌位，瓷窑一般不能。

### 6.2 通用状态表现

| 状态 | 触发来源 | 视觉要求 | 禁止 |
| --- | --- | --- | --- |
| `constructing` | 建造/升级事务与进度 | 围挡、材料、脚手架、阶段揭示、施工人员 | 尘土遮罩后瞬间换图 |
| `working` | 有原料、工人、容量且进度推进 | 专属工序按 `productionProgress` 分段 | 无进度时继续生产 |
| `blocked` | `statusReason` 非空 | 按缺工、缺料、断路、财政不足等差异化 | 仍满负荷烟火/机械 |
| `serving` | 服务对象或服务事务存在 | 顾客/居民/船只/队列与服务点交互 | 空建筑持续拥挤 |
| `storage_full` | 成品容量满或输出阻塞 | 成品堆高、装卸口等待、主工序停或降速 | 继续产出新货 |
| `idle` | 无施工、无有效生产/服务 | 低强度生活/维护/待机 | 假装产出或随机繁忙 |

### 6.3 生产进度分段

`working` 不得自由循环，必须映射生产进度：

| 进度 | 通用阶段 | 示例 |
| ---: | --- | --- |
| 0–20% | 备料 | 食肆备菜、瓷窑和泥、粮仓开门、码头准备跳板 |
| 20–75% | 主加工/服务 | 炉灶烹制、窑火烧制、稻田农事、绞盘装卸 |
| 75–95% | 收尾 | 出菜、开窑、收割捆扎、货箱落位 |
| 95–100% | 入库/可领取 | 成品出现，等待订单或入仓确认 |

模拟暂停或 `productionProgress` 不变时，生产槽冻结在当前相位；环境 `ambient` 可按设置降速。

### 6.4 六类专属动画槽位

| 建筑 | `working` 主槽 | `serving` 槽 | `storage_full` 姿态 | `idle` |
| --- | --- | --- | --- | --- |
| `main-homes` | 做饭、整理院落、晾晒 | 居民归家、邻里交谈 | 生活物资堆满门巷时收窄通道 | 门帘、少量窗动、低烟 |
| `windfield-rice` | 插秧/灌溉/抽穗/收割随作物阶段 | 农夫驻足、运粮交接 | 稻捆堆满田边，收割停 | 水面微动、稻叶低频摆动 |
| `main-granary` | 开仓、筛粮、盘点、翻晒 | 粮车/搬运队等待装卸 | 粮袋堆高到装卸口，仓门半闭 | 通风窗、麻雀、守仓人 |
| `main-eatery` | 切配、炉灶、蒸笼、出菜 | 食客入座、翻台、外带窗口 | 食材/成品堆满，厨师停在案台 | 炉火小、清扫、菜单牌 |
| `main-kiln` | 和泥、入窑、烧制、开窑搬瓷 | 不提供普通顾客服务；可有工匠交接 | 瓷架满，窑火降，输出口等待 | 冷窑、低烟、整理柴垛 |
| `main-pier` | 绞盘、跳板、货箱装卸、系缆 | 船只靠泊、搬运队列、港务指引 | 货垛占满货位，船只等待 | 港旗、轻水波、少量守港人 |

### 6.5 序列帧与部件动画选择

优先规则：

1. 刚体旋转/开合/位移用部件动画：门、窗、跳板、绞盘、窑门、水闸、仓门。
2. 不规则形变或手绘质感强的动作使用序列帧：炉火、蒸汽、烟、稻浪、水花、人物工序。
3. 大面积烟、尘、雨、落叶使用粒子或短序列，不烘进主体。
4. 建筑主体不使用整体呼吸、整体缩放或整体闪烁表示运行。

帧率：

| 类型 | 帧数 | fps | 循环 |
| --- | ---: | ---: | --- |
| 建筑机械 | 8–16 | 8–12 | 是 |
| 炉火/窑火 | 8–12 | 12 | 是，受状态开关 |
| 烟/蒸汽短序列 | 8–16 | 8 | 是或自然消散 |
| 施工击打/落瓦 | 6–12 | 10–12 | 事件触发 |
| 服务/装卸人物代表 | 8–16 | 8–10 | 按事务 |
| idle 细节 | 4–8 | 4–6 | 是 |

## 7. 施工与升级揭示

施工阶段统一映射：

| 进度 | 阶段 | 可见层 |
| ---: | --- | --- |
| 0–10% | 清场/测量 | 围挡、测量杆、材料进场 |
| 10–25% | 地基/田埂/码头桩 | `foundation`、基坑、木桩 |
| 25–45% | 脚手架/主体骨架 | 柱梁、仓架、窑拱、栈桥梁 |
| 45–70% | 墙体/田面/作业面 | 主体结构和主要生产面 |
| 70–90% | 屋面/设备/细节 | 屋顶、窑门、仓门、灶台、吊装架 |
| 90–98% | 拆架/清场 | 移除脚手架、摆放货物 |
| 98–100% | 启用 | 挂牌、灯火、第一批人员入驻 |

各类特殊要求：

- `windfield-rice` 的“主体骨架”对应田埂、水渠和水闸，不是房屋骨架。
- `main-pier` 的 L8 施工必须先完成岸基和泊位，再出现货棚和吊装，不允许先放完整大船。
- `main-kiln` 的新等级完整窑体只在等级事务确认后成为正式 `base`；升级中可显示半成窑拱。
- `main-homes` 施工应保留旧宅到新街坊的非破坏式连续性，不能整片推平再凭空出现。

## 8. Manifest 字段

每个金标建筑提交两个 manifest：`building-manifest.json` 与 `animation-manifest.json`。字段可合并存储，但逻辑必须完整。

### 8.1 `building-manifest.json`

```ts
interface GoldBuildingManifest {
  schemaVersion: 'gold-building.v1'
  assetId: 'main-homes' | 'windfield-rice' | 'main-granary' | 'main-eatery' | 'main-kiln' | 'main-pier'
  displayName: string
  version: string
  sourceBlend: string
  buildBatch: 'gold-slice'
  footprint: Array<{ x: number; y: number }>
  footprintMeters: { width: number; depth: number }
  origin: { x: number; y: number; z: number }
  entranceDirection: 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW'
  bounds: {
    localPx: { left: number; right: number; top: number; bottom: number }
    localMeters: { width: number; depth: number; height: number }
  }
  levels: Record<string, {
    required: boolean
    dccCollections: string[]
    spriteLayers: Array<{
      key: string
      atlas: string
      frame?: string
      zBand: 'shadow' | 'ground' | 'back' | 'dynamic' | 'agent' | 'front' | 'light' | 'vfx' | 'ui'
      pivotPx: { x: number; y: number }
      premultipliedAlpha: true
    }>
    animatedParts: string[]
    anchors: string[]
    collisionProfile: string
    occlusionProfile: string
    constructionReveal: Array<{ progressFrom: number; progressTo: number; show: string[]; hide: string[] }>
    lod: Record<'LOD0' | 'LOD1' | 'LOD2' | 'LOD3', { atlas: string; maxDrawCalls: number; maxTextureMB: number }>
  }>
  anchors: Record<string, {
    type: 'origin' | 'entrance' | 'worker' | 'input' | 'output' | 'service' | 'queue' | 'vfx' | 'audio' | 'ui' | 'berth' | 'water_route' | 'construction'
    localMeters: { x: number; y: number; z: number }
    localPx: { x: number; y: number }
    facing: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7
    tags?: string[]
  }>
  collision: {
    footprint: Array<{ x: number; y: number }>
    obstacles: Array<Array<{ x: number; y: number }>>
    occluders: Array<Array<{ x: number; y: number }>>
    clickHull: Array<{ x: number; y: number }>
    waterHull?: Array<{ x: number; y: number }>
  }
  validation: {
    triangleBudgetLOD0: number
    maxLayers: number
    maxEmitters: number
    blindRecognitionTarget: 0.8
  }
}
```

### 8.2 `animation-manifest.json`

```ts
interface GoldAnimationManifest {
  schemaVersion: 'gold-animation.v1'
  assetId: string
  statePriority: ['constructing', 'blocked', 'storage_full', 'working', 'serving', 'idle', 'ambient']
  slots: Record<string, {
    domain: 'ambient' | 'building' | 'logistics' | 'service' | 'construction' | 'weather' | 'feedback'
    requiredState: 'constructing' | 'working' | 'blocked' | 'serving' | 'storage_full' | 'idle' | 'ambient'
    allowedReasons?: string[]
    clip: string
    technique: 'sprite-sequence' | 'part-transform' | 'particle' | 'tint-light' | 'none'
    fps?: number
    loop: boolean
    progressRange?: { from: number; to: number }
    playbackRateSource: 'sceneTime' | 'productionProgress' | 'constructionProgress' | 'orderPhase' | 'fixed'
    anchors: string[]
    parts: string[]
    audioCues?: Array<{ key: string; frame?: number; progress?: number }>
    lodPolicy: Record<'LOD0' | 'LOD1' | 'LOD2' | 'LOD3', 'full' | 'reduced' | 'static' | 'off'>
  }>
  transitions: Array<{
    from: string
    to: string
    blendMs: number
    interruptible: boolean
  }>
  blockedVariants: Record<string, {
    visualSlot: string
    tooltipKey: string
  }>
}
```

最低槽位清单：

```text
base
idle-detail
staff-entry
input-receive
production-primary
production-secondary
output-ready
output-dispatch
service
blocked
storage-full
construction
night
weather
ui-feedback
```

## 9. Pixi Prefab 规范

### 9.1 Prefab 组成

Prefab 由 manifest 注册，不允许在代码中硬编码单类建筑的锚点和帧名。

```ts
interface BuildingPrefabRuntime {
  assetId: string
  level: number
  root: PIXI.Container
  layers: Record<string, PIXI.Sprite | PIXI.AnimatedSprite | PIXI.Container>
  anchors: Record<string, AnchorRuntime>
  stateController: BuildingAnimationController
  lodController: BuildingLodController
  collision: CollisionProfile
  dispose(): void
}
```

运行要求：

- `root.sortableChildren` 只在必要层开启；同层优先使用稳定 zBand。
- 粒子、AnimatedSprite、代表人物必须对象池化；状态切换不得反复创建销毁。
- 离屏建筑停止非必要渲染；再次入屏按当前 Tick 恢复相位，不从第一帧重播。
- 被选中时可提升到 LOD0，但不得改变模拟事实或碰撞。

### 9.2 状态解析输入

Prefab 消费以下事实：

```text
BuildingEntity.type
BuildingEntity.level
BuildingEntity.status
BuildingEntity.statusReason
BuildingEntity.productionProgress
BuildingEntity.inventory / capacity
LogisticsOrder.state / resource / carrierId
constructionProgress / constructionStartedTick / targetLevel
SceneTime.period / weather / windVector
```

若某字段暂缺，Prefab 只能降级表现，并在调试面板输出 `data_missing`，不得臆造事务。例如缺少船运订单时，`main-pier` 不得生成装饰船。

## 10. 自动校验规则

自动校验分为 DCC、渲染、manifest、Prefab 四层。任一 Error 阻断入引擎；Warning 超过批准阈值也阻断提交。

### 10.1 DCC 检查

Error：

- 单位不是米制，或相机不是统一等距模板。
- 缺 `COL_L00`、`COL_L01`、`COL_L04`、`COL_L08` 任一关键等级。
- 缺 `COL_ANIM`、`COL_COLLISION`、`COL_ANCHOR`。
- 对象存在未应用 Scale、负缩放、反向法线、非流形、孤立顶点。
- 可动画部件缺独立对象或 pivot 不在真实轴心。
- 入口、输入、输出、服务、施工、UI 锚点缺失或无朝向。
- 面数超过预算 15% 且无批准记录。
- `main-pier` 缺 `berth_*`；`windfield-rice` 缺灌溉锚点；`main-kiln` 缺火口/烟道；`main-eatery` 缺灶口；`main-granary` 缺装卸口；`main-homes` 缺多户入口。

Warning：

- 单个小道具超过 2k 三角面。
- L8 空间利用率低于对应类别目标但仍有功能解释。
- 纹理密度偏差超过 25%。
- 关键缩略图相似度接近同质化阈值。

### 10.2 渲染与图集检查

Error：

- 同一 clip 帧尺寸、pivot、画布或光照不一致。
- Alpha 出现白边/黑边/未清理半透明噪声。
- 主体层烘入动态灯火、粒子或人物。
- 帧名不符合 `{asset_id}_L{level}_{state}_{direction?}_{frame:04d}.png`。
- 图集缺 `sourceSize`、`spriteSourceSize`、`pivot`、`duration` 或 animation tag。
- 单张图集超过 2048² 且目标为移动端必需资源。

### 10.3 Manifest 检查

Error：

- `schemaVersion`、`assetId`、`version`、`sourceBlend` 缺失。
- manifest 引用不存在的 atlas/frame/anchor/part。
- 状态缺 `constructing`、`working`、`blocked`、`serving`、`storage_full`、`idle` 任一覆盖。
- 槽位 `playbackRateSource` 与状态矛盾，例如 `working` 使用纯 `sceneTime` 推进主工序。
- `storage_full` 只映射到通用 `blocked` 图标，无独立视觉槽。
- LOD 配置缺 draw call、显存预算或降级策略。
- 碰撞、遮挡和点击区域为空或覆盖相邻道路。

### 10.4 Pixi Prefab 检查

Error：

- 状态切换创建未池化对象。
- 暂停后 `working`、`constructing`、`logistics` 仍推进。
- `productionProgress` 不变但生产主槽继续跨阶段。
- 无订单时显示装卸、船只靠泊或货物增减。
- `storage_full` 时仍显示产出进入仓库。
- LOD 切换导致锚点、碰撞、入口或泊位坐标变化。

验收录像：

1. 每类 60 秒：`idle → working → storage_full → blocked → idle`。
2. 每类 60 秒：`constructing` 从 0% 到 100%，含暂停和恢复。
3. `main-pier` 90 秒：订单驱动靠泊、装货、离港；无订单时无装饰船。
4. `main-eatery` 90 秒：饭点服务与非饭点备餐差异。
5. `main-kiln` 90 秒：烧制阶段有火和烟，停工 0.5 秒内停止新增粒子。
6. `windfield-rice` 90 秒：作物阶段替换和灌溉/收割互斥。
7. 压力场景 180 秒：六类 L8 同屏、150 移动实体、天气/暮色开启，平均 ≥ 50 FPS。

## 11. 交付清单

每类金标最终提交：

- `.blend` 源文件，含标准集合、LOD、拆件、pivot、锚点、碰撞代理。
- L0/L1/L4/L8 分层透明序列；连续全等级类还需 L2/L3/L5/L6/L7。
- TexturePacker 兼容图集 JSON 与贴图。
- `building-manifest.json`、`animation-manifest.json`。
- Pixi Prefab 注册数据和状态驱动预览。
- 自动校验 JSON 与人工 Markdown/HTML 报告。
- 25%、50%、100% 缩略 contact sheet。
- 状态驱动录像与性能捕获。

未提交上述任一项，不得标记为金标完成。尤其不能用“美术图已完成”替代 Prefab、manifest 或校验报告。
