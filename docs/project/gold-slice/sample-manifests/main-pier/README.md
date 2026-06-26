# main-pier 金标样例 manifest

这是 GOLD-SAMPLE-MANIFEST-01 生成的第一份生产模板型样例，目标是提供一套能通过 `tools/asset-validator` 的 `building-manifest.json` 与 `animation-manifest.json`。

## 设计取向

- 资产选择：`main-pier`。原因是现有 valid fixture 已覆盖码头专属 anchor 口径，且 `main-pier` 是 `model-animation-spec.md` 推荐可做 L0–L8 连续验证的建筑之一。
- 等级覆盖：仅声明金标验收必需的 `L0`、`L1`、`L4`、`L8`，不假装已有 L2/L3/L5/L6/L7。
- L8 模板意图：石砌主埠、三个泊位、两条货流线、吊装区、货棚、夜航灯与风雨停航等待点，避免把码头做成“一艘大船 + 亭子”的错误方向。
- JSON 内不写注释；字段解释集中放在本 README。

## 使用方式

本样例已接入 npm 资产校验入口，未来 CI 或生产导出流程应优先调用该脚本，而不是复制一段散落的 node 命令：

```bash
npm run asset:validate:main-pier
```

生产接入建议：

- CI：在 gold-slice 资产变更检查中执行 `npm run asset:validate:self-test`、`npm run asset:validate:gold-fixture` 和 `npm run asset:validate:main-pier`，确保校验器自身、通用 fixture、真实样例三条路径都未退化。
- 生产导出：Blender/Pixi 资产导出完成后，将导出的 `building-manifest.json` 与 `animation-manifest.json` 交给 `tools/asset-validator/asset-validator.js`；`main-pier` npm 脚本作为路径模板和回归样例保留。
- 离线要求：该入口只读取仓库内 JSON，不安装包、不下载 schema、不访问外部服务，适合放进本地 preflight、CI job 或生产发布前 gate。

等价的底层命令如下，主要用于调试或迁移到其他资产路径：

```bash
node tools/asset-validator/asset-validator.js \
  --building docs/project/gold-slice/sample-manifests/main-pier/building-manifest.json \
  --animation docs/project/gold-slice/sample-manifests/main-pier/animation-manifest.json
```

## 已知模板边界

- 当前 validator 只校验 JSON 结构、预算、必需层、anchor 引用和动画槽引用；不会检查 Blender 文件、图集图片、实际 pivot 位置或 Pixi 运行录像。
- `maxLayers` 仍按现有 fixture 和预算口径填 10，但 manifest 必须列出 11 个逻辑层；这是规格与 validator/fixture 当前口径的张力，后续应统一定义“逻辑层数量”和“同时可见静态层数量”。
- 坐标和 hull 是生产模板级占位，不等同最终美术精确碰撞数据；进入 Blender/Pixi 前必须由 blockout 截图和实际导出资产复核。
