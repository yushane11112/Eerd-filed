# Codex Project Instructions

This project is the "little-ear-island" commercial city-building simulation game.

Trigger phrase: when the user says "继续执行小耳岛项目" or an equivalent request in a new Codex session, continue this project automatically. If this repository is not present locally, clone `git@github.com:yushane11112/Eerd-filed.git` or `https://github.com/yushane11112/Eerd-filed.git`, checkout `codex/commercial-launch-plan-docs`, install dependencies, read this file and the project continuity documents below, then continue from `docs/project/progress-dashboard.md`.

Use these files as the primary continuity source before relying on old chat history:

1. `docs/project/README.md`
2. `docs/project/HANDOFF.md`
3. `docs/project/commercial-launch-master-plan.md`
4. `docs/project/progress-dashboard.md`
5. `docs/project/task-board.md`
6. `docs/project/integration-log.md`
7. `docs/project/artifact-index.md`
8. `docs/project/qa.md`

The old Codex thread named `game` is a historical archive, not the default working context. It is large and contains heavy tool outputs, including repeated image payloads. Consult it only when the project documents and repository state do not answer a specific historical question.

Keep quality independent of chat length:

- Treat repository files, tests, QA scripts, and project documents as source of truth.
- Before changing behavior, identify the current task from `docs/project/progress-dashboard.md` and `docs/project/task-board.md`.
- After each completed work round, update `task-board.md`, `integration-log.md`, `progress-dashboard.md`, `artifact-index.md`, and `qa.md`.
- Do not claim completion until relevant targeted tests pass. For broad changes, also run `npm test`, `npm run build`, and `git diff --check`.
- For browser/user-flow changes, prefer the existing QA scripts such as `npm run qa:browser-e2e` and targeted scenario commands.
- Avoid reading or searching `node_modules/`, `dist/`, `work/`, `outputs/`, generated images, zip files, or large binary assets unless the task specifically requires them.
- Keep shell output bounded with filters, explicit file paths, and `max_output_tokens`; never dump full generated files, base64 images, screenshots, or large JSON into the conversation.
- When images are needed, pass file paths and inspect only the relevant image, not embedded data URLs.
- Record decisions in project docs so new short threads can continue without inheriting the full historical context.
