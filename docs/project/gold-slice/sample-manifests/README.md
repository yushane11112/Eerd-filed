# Gold-slice sample manifests

This directory holds production-template JSON samples for gold building and animation manifests. Each complete sample lives in its own `assetId` directory with:

- `building-manifest.json`
- `animation-manifest.json`

Run the batch gate before handing samples to runtime or CI:

```bash
npm run asset:validate:gold-samples
```

These samples are templates and contract fixtures. They are not a claim that final commercial assets are complete. In particular, default validation still allows the historical sample subset `L0`, `L1`, `L4`, and `L8` so existing pipeline checks do not fail immediately.

Use the strict gate for assets that claim complete production level coverage:

```bash
npm run asset:validate:gold-samples:strict
```

Strict validation requires every building manifest to provide all nine levels, `L0` through `L8`. Missing any level is a failure reported as `level.missing_required_all_levels`.

The first two single-sample `L0`-through-`L8` complete manifests are now `main-homes` and `main-eatery`. Use these focused gates to prove strict all-level validation can pass for complete gold samples while the batch strict gate continues to expose unfinished samples:

```bash
npm run asset:validate:main-homes:strict
npm run asset:validate:main-eatery:strict
```

Current batch coverage:

- `main-homes` — complete single-sample strict pass (`L0`-`L8`)
- `main-eatery` — complete single-sample strict pass (`L0`-`L8`), with authored intermediate growth from fixed stall to busy restaurant
- `main-pier` — still template-level only until `L2`, `L3`, `L5`, `L6`, and `L7` are authored

## Art export requirements

For the next art-export pass, each new gold sample should:

- use one of the validator-approved gold `assetId` values;
- include validator-required authored levels `L0`, `L1`, `L4`, and `L8` at minimum for template validation;
- include all authored levels `L0` through `L8` before it is treated as final production-complete asset coverage;
- declare all required logical sprite layers, even when a layer is visually tiny;
- provide common anchors plus asset-specific anchors, such as `home_door_*` for `main-homes` or `stove_*` / `serving_window_*` for `main-eatery`;
- keep LOD draw-call, texture, triangle, layer, and emitter budgets within `tools/asset-validator/asset-validator.js`;
- keep animation slots independent for `blocked` and `storage_full`; reusing one generic blocked visual is not accepted.
- provide a `visualIdentity` block with a unique building class, silhouette family, functional signature and material language, plus a complete L0-L8 `levelArc`; every level must declare its silhouette, functional read, environment change, active visible elements and structural-milestone status;
- make L0 explicitly read as the original ruin/foundation and L8 explicitly read as a thriving, fully operating building; L0-L8 must contain at least three distinct silhouette signatures.

The JSON validator is intentionally not a substitute for reviewing Blender collections, atlas images, pivots, collision shape accuracy, or Pixi capture output.
