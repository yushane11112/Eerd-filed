# 金标建筑 DCC 导出执行手册

这份手册是美术机的执行入口。它把建模、分级、动画、透明预览和运行时交付串成一条可复核流水线；当前开发机没有 Blender，因此本轮只交付脚本与门禁，不宣称已经产出新的 `.blend` 或商业级模型。

## 美术机执行顺序

1. 使用 Blender 4.x LTS 打开 `art-source/blender/buildings/{assetId}/{assetId}.blend`。
2. 确认场景包含 `COL_REF`、`COL_BLOCKOUT`、`COL_L00`–`COL_L08`、`COL_SHARED`、`COL_ANIM`、`COL_COLLISION`、`COL_ANCHOR`、`COL_RENDER`。
3. 按建模规格完成各等级体块。L0 必须是可读废墟，L8 必须是完整营业、有人流和环境功能的繁荣建筑；L1/L3/L5/L7 必须产生真实轮廓或体量变化。
4. 将门、车轮、吊杆、烟火、灯笼、作物、货物等可动件放入 `COL_ANIM`，为其制作有关键帧的动作，并把动作状态映射到 `animation-manifest.json` 的状态槽位。
5. 创建 `origin`、入口、生产输入输出、施工、遮挡、碰撞、选中和 UI 状态锚点。锚点只能使用语义命名的 Empty。
6. 在 Blender 中执行：

```text
blender -b art-source/blender/buildings/{assetId}/{assetId}.blend \
  --python tools/art-pipeline/blender/build-gold-slice.py -- \
  --asset-id {assetId} \
  --out art-source/exports/buildings/{assetId}
```

脚本会在缺少集合、锚点、动画 action、等级几何或结构差异时失败，不会自动复制别的建筑或用一张图冒充九个等级。

## 交付物与验收

每个金标建筑至少交付：

- 一个带完整集合和动作的 `.blend` 源文件；
- `level-0.png` 到 `level-8.png` 的透明预览；
- building manifest、animation manifest、DCC provenance manifest；
- `runtime-atlas-manifest.json`、`anchor-manifest.json` 和 `state-evidence.json`；
- 分层图集及 JSON，包含主体、前景遮挡、阴影、灯火、机械、货物、粒子锚点；
- 碰撞代理、遮挡轮廓、LOD0–LOD3 预算记录；
- 施工、营业、生产、缺料、仓满、夜间和天气状态的录屏或逐帧证据。

脚本通过只代表“源资产结构与导出规则通过”，不代表美术质量自动达标。导出后仍需在 Pixi 浏览器环境复核：L0/L8 差异、状态切换、透明边缘、缩放锚点、动画帧率、显存和单建筑 CPU 更新预算。

## 当前仓库状态

运行 `npm run asset:pipeline:contract` 可检查脚本与建模规格没有漂移；运行 `npm run asset:coverage-audit` 可检查仓库是否已有 DCC 源文件、完整 manifest 和动画二进制。后者目前仍会报告缺口，这是待美术机执行的真实剩余工作，不应被静态 PNG 或 procedural fallback 掩盖。

完成美术机导出后，还必须运行 `npm run asset:production-package:audit`。它要求每个资源包同时具备九级透明预览、DCC provenance、九级运行时图集与 JSON、语义锚点清单，以及施工/营业/阻塞/仓满/服务/空闲/环境七类状态证据；缺任一层都保持 RED。
