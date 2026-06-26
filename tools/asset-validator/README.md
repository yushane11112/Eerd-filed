# Gold asset manifest validator

Minimal offline validator for 《小耳岛》 gold-slice building and animation manifests.

It checks JSON-only gates from `docs/project/gold-slice/model-animation-spec.md`:

- stable gold `assetId`
- required levels `L0`, `L1`, `L4`, `L8`
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
node tools/asset-validator/self-test.js
```

Validate a pair of manifests:

```sh
node tools/asset-validator/asset-validator.js \
  --building path/to/building-manifest.json \
  --animation path/to/animation-manifest.json
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
- Treats `none: true` sprite-layer entries as explicit not-applicable declarations, but the current TypeScript spec has not formalized that shape yet.
- Budget gates are hard failures and do not model approval-record exceptions.
