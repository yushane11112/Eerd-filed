# Gold asset manifest validator

Minimal offline validator for 《小耳岛》 gold-slice building and animation manifests.

It checks JSON-only gates from `docs/project/gold-slice/model-animation-spec.md`:

- stable gold `assetId`
- default sample-template levels `L0`, `L1`, `L4`, `L8`
- optional strict complete-production levels `L0` through `L8`
- required DCC collection markers per level
- required logical sprite layers and layer pivots
- common and asset-specific anchors
- collision, occlusion, and click hull presence
- LOD draw-call / texture budgets
- source triangle/layer/emitter budget declarations
- required animation states, slots, state priority, independent `storage_full`
- animation anchor/part references

Run:

```sh
npm run asset:validate:self-test
```

Validate the committed gold fixture through the same CLI path used for real manifests:

```sh
npm run asset:validate:gold-fixture
```

Validate the production-template `main-pier` sample manifest:

```sh
npm run asset:validate:main-pier
```

Validate all committed gold-slice sample manifest pairs under `docs/project/gold-slice/sample-manifests/`:

```sh
npm run asset:validate:gold-samples
```

The batch entry currently validates `main-pier`, `main-homes`, and `main-eatery`. It discovers complete sample directories automatically, so future art-export samples only need to add a sibling directory containing both `building-manifest.json` and `animation-manifest.json`.

Run the stricter production gate when a building asset claims full level coverage:

```sh
npm run asset:validate:gold-samples:strict
```

Strict mode is opt-in for now. It requires every building manifest to contain `L0`, `L1`, `L2`, `L3`, `L4`, `L5`, `L6`, `L7`, and `L8`; a missing level fails with `level.missing_required_all_levels`. The committed gold-slice sample manifests are templates for validating manifest shape and pipeline contracts, not evidence that the final 0-8 asset set is complete.

All npm scripts are offline-only and do not install packages, download schemas, or call external services.

Validate a pair of manifests directly:

```sh
node tools/asset-validator/asset-validator.js \
  --building path/to/building-manifest.json \
  --animation path/to/animation-manifest.json
```

Require complete `L0`-`L8` building levels for a single manifest pair:

```sh
node tools/asset-validator/asset-validator.js \
  --building path/to/building-manifest.json \
  --animation path/to/animation-manifest.json \
  --require-all-levels
```

Machine-readable output:

```sh
node tools/asset-validator/asset-validator.js \
  --building path/to/building-manifest.json \
  --animation path/to/animation-manifest.json \
  --json
```

Known limitations:

- Does not inspect `.blend` files, real atlas JSON/image files, or Pixi runtime behavior.
- Default mode intentionally accepts template manifests with only `L0`, `L1`, `L4`, and `L8`; use `--require-all-levels` for final production completeness.
- Treats `none: true` sprite-layer entries as explicit not-applicable declarations, but the current TypeScript spec has not formalized that shape yet.
- Budget gates are hard failures and do not model approval-record exceptions.
