# Legacy runtime area

This directory contains archived prototype code that is kept only for compatibility,
QA comparison, or save migration. It is not part of the commercial city-simulation
mainline.

Rules:

- New gameplay, UI, rendering, art-pipeline, or simulation work must not import from
  `src/legacy/**`.
- Legacy code must stay behind explicit gates such as `?legacy-islands` or
  migration-only helpers.
- If a legacy behavior is still useful, extract the useful rule into the mainline
  module first, then add tests there.
- Do not add new product features here.

Current archived scopes:

- `archipelago/IslandCanvas.tsx`: old island/archipelago Pixi prototype view,
  disabled by default and kept for visual QA comparison only.
- `game/**`: old fixed-island material/drop/build-site state machine, storage
  migration helpers, and static visual QA tests. It must not be imported by the
  commercial city-simulation mainline.
