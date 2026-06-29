# 《小耳岛》跨电脑 / 空对话接续手册

本文件用于解决一个事实问题：Codex 对话本身是本地上下文，换电脑或新开对话时不会自动带走完整聊天历史。项目真正的连续性必须依赖 GitHub 仓库、项目中枢文档和每轮提交记录。

## 1. 当前项目唯一可信来源

仓库：

```bash
git@github.com:yushane11112/Eerd-filed.git
```

当前主控开发分支：

```bash
codex/commercial-launch-plan-docs
```

当前项目目录：

```bash
/Users/xmly/Documents/Codex/2026-06-23/ni
```

如果另一台电脑路径不同，不影响项目，只要 clone 同一个 GitHub 仓库并 checkout 同一个分支即可。

## 2. 另一台电脑第一次接续

在另一台电脑上执行：

```bash
git clone git@github.com:yushane11112/Eerd-filed.git
cd Eerd-filed
git checkout codex/commercial-launch-plan-docs
npm install
npm test
npm run build
```

如果使用 HTTPS：

```bash
git clone https://github.com/yushane11112/Eerd-filed.git
cd Eerd-filed
git checkout codex/commercial-launch-plan-docs
npm install
npm test
npm run build
```

## 3. 在另一台电脑的新 Codex 对话里怎么说

新对话完全空白时，直接给 Codex 这段话：

```text
请先读取 docs/project/README.md、docs/project/HANDOFF.md、docs/project/commercial-launch-master-plan.md、docs/project/progress-dashboard.md、docs/project/task-board.md 和 docs/project/integration-log.md。

这是《小耳岛》商业级东方水乡城市文明模拟项目。当前主线已经放弃固定 28 类建筑、四岛解锁、听歌捡材料，目标是对齐《凯撒大帝》类城市建设：自由规划城市、人口生命周期、就业、生产、仓储、物流、市场、财政、公共服务、风险治理、街区繁荣和全阶段商业级美术。

请按 progress-dashboard.md 的下一轮默认任务继续执行，并且每轮完成后更新 task-board.md、integration-log.md、progress-dashboard.md、artifact-index.md 和 qa.md，测试通过后提交并推送 GitHub。
```

这段话的作用是让新对话从仓库文档恢复上下文，而不是依赖旧聊天记录。

## 4. 每次换电脑前必须做什么

在当前电脑结束工作前，必须确保：

```bash
git status --short
git push
```

如果 `git status --short` 还有未提交文件，就需要先完成：

```bash
git add <changed-files>
git commit -m "<clear message>"
git push
```

原则：

- 稳定成果必须提交并推送。
- 半成品如果会影响另一台电脑接续，也要么提交到当前工作分支，要么明确记录在 `progress-dashboard.md` 的风险/下一步中。
- 不要依赖“我记得刚才做了什么”；所有连续性都要写进仓库。

## 5. 每次回到当前电脑继续

回到当前电脑后先执行：

```bash
cd /Users/xmly/Documents/Codex/2026-06-23/ni
git checkout codex/commercial-launch-plan-docs
git pull
npm install
npm test
npm run build
```

如果另一台电脑有新提交，`git pull` 会把它同步回来。

## 6. 项目上下文读取顺序

任何新会话接手时，按这个顺序读取：

1. `docs/project/README.md`
2. `docs/project/HANDOFF.md`
3. `docs/project/commercial-launch-master-plan.md`
4. `docs/project/progress-dashboard.md`
5. `docs/project/task-board.md`
6. `docs/project/integration-log.md`
7. `docs/project/artifact-index.md`
8. `docs/project/qa.md`

如果涉及具体方向，再读取：

- 世界观与年代：`docs/project/design/world-bible.md`
- 建筑体系：`docs/project/design/building-taxonomy.md`
- 人口生命周期：`docs/project/design/population-lifecycle.md`
- 美术全阶段：`docs/project/design/art-production-roadmap.md`
- 生产流水线：`docs/project/production-pipeline.md`
- 质量门禁：`docs/project/gates.md`

## 7. 当前下一轮默认任务

以 `docs/project/progress-dashboard.md` 为准。当前方向是：

1. 将治理卡推荐动作进一步接入实际营造可执行性：地块空间、道路入口、资源库存和财政是否支持。
2. 将治理卡推荐动作进一步接入建造菜单状态，显示推荐建筑当前是否有足够地块、道路入口和资源条件。
3. 设计 7200 tick/30 日分层长跑方案，验证归档后快照规模长期有界。
4. 继续建立商业级美术资产量产门禁，推进更多 L0–L8 完整样例。
5. 将服务热度进一步接入服务容量/排队诊断，将货运拥堵进一步接入仓储容量和订单积压诊断。

## 8. 不允许丢失的项目原则

- 最终目标是商业级游戏，不是网页原型。
- 玩法主线对齐《凯撒大帝》类城市建设，不是岛屿养成。
- 建筑不限制 28 类，但必须符合统一年代。
- 美术不是首批金标任务，而是 ART-P0 到 ART-P11 全阶段生产线。
- 外来人口入住前后必须有身份、行为、视觉和系统差异。
- 每轮完成后必须留下项目内可检查产出。
- 测试通过前不能宣称完成。
- 推送 GitHub 后，另一台电脑才能无缝继续。
