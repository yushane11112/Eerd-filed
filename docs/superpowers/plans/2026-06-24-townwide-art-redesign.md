# Townwide Art Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the sticker-like empty island with five complete townscape stages and function-specific landmark rendering.

**Architecture:** A stage-driven `TownscapeLayer` owns whole-island density and continuity. Separate landmark and activity layers preserve interactive buildings and motion without duplicating the visual responsibility of the base townscape.

**Tech Stack:** React 19, TypeScript, Vite, PixiJS 8, Vitest, generated raster assets.

---

### Task 1: Lock townscape asset contracts

**Files:**
- Modify: `src/game/config.ts`
- Create: `src/game/townscape.test.ts`

- [ ] Add five exact `TOWNSCAPE_ASSET_PATHS` entries and four theme-island stage sets.
- [ ] Add tests requiring every stage file, unique paths, identical dimensions, and RGBA/RGB-compatible image formats.
- [ ] Run `npm test -- --run src/game/townscape.test.ts` and verify it fails for missing stage art.

### Task 2: Produce five coordinated main-island keyframes

**Files:**
- Create: `public/assets/townscape/main/stage-0.png`
- Create: `public/assets/townscape/main/stage-1.png`
- Create: `public/assets/townscape/main/stage-2.png`
- Create: `public/assets/townscape/main/stage-3.png`
- Create: `public/assets/townscape/main/stage-4.png`

- [ ] Generate the five complete-island concepts using one locked shoreline, river and camera specification.
- [ ] Compare all five as a difference overlay and reject frames whose coastline or river alignment exceeds 6 pixels.
- [ ] Verify stage coverage targets of 20%, 35%, 58%, 75%, and 88%.
- [ ] Inspect stage 4 for large purposeless grass plots and regenerate until none exceed 3% of the frame.

### Task 3: Produce coordinated theme-island stages

**Files:**
- Create: `public/assets/townscape/windfield/stage-{0..4}.png`
- Create: `public/assets/townscape/mistgrove/stage-{0..4}.png`
- Create: `public/assets/townscape/tide/stage-{0..4}.png`

- [ ] Keep Windfield agriculture-led, Mistgrove tea/herb/bamboo-led, and Tide salt/shipbuilding-led.
- [ ] Reject any frame where farms or industrial landscapes become generic pavilion compounds.
- [ ] Run the townscape asset tests and verify all twenty files exist.

### Task 4: Add town-stage progression logic

**Files:**
- Create: `src/game/townProgress.ts`
- Test: `src/game/townProgress.test.ts`
- Modify: `src/game/types.ts`

- [ ] Write failing tests for total-level thresholds and monotonic stage progression.
- [ ] Implement `getTownscapeStage(buildSites)` returning stages 0–4.
- [ ] Implement per-island stage calculation from only that island’s sites.
- [ ] Run focused tests and then all game tests.

### Task 5: Split Pixi rendering responsibilities

**Files:**
- Create: `src/components/island/TownscapeLayer.ts`
- Create: `src/components/island/LandmarkLayer.ts`
- Create: `src/components/island/ActivityLayer.ts`
- Modify: `src/components/IslandCanvas.tsx`

- [ ] Write a render contract test proving only the selected landmark receives the large interactive sprite.
- [ ] Load current and next townscape stages and cross-fade over 900 ms.
- [ ] Remove the 28-simultaneous-large-sprite composition.
- [ ] Render small interaction anchors for unselected build sites without covering the townscape.
- [ ] Scale activity density and kinds by stage.

### Task 6: Redesign function-specific landmark assets

**Files:**
- Replace: `public/assets/buildings/*/level-{0..8}.png`
- Create: `src/game/buildingIdentity.test.ts`

- [ ] Define required visual motifs per building category.
- [ ] Regenerate bridge, farms, gardens, salt field, lighthouse, kiln, textile yard and shipyard first because they currently fail identity.
- [ ] Regenerate remaining commercial and civic buildings without generic boats or multi-pavilion endings.
- [ ] Add metadata tests forbidding boat motifs outside allowed categories and requiring category-specific motifs.

### Task 7: Add full-town visual review controls

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] Add town stage 0–4 review buttons independent of saved progression.
- [ ] Add before/after split preview for stage 0 and stage 4.
- [ ] Keep the review controls outside normal player navigation.

### Task 8: Verify and package

**Files:**
- Create: `outputs/townwide-fidelity-ledger.md`
- Update: `outputs/小耳岛-交付说明.md`

- [ ] Run `npm test` and require zero failures.
- [ ] Run `npm run build` and require exit code 0.
- [ ] Verify 1280×720 and 844×390 in the in-app browser.
- [ ] Capture stages 0–4 at identical viewport and camera coordinates.
- [ ] Compare concepts and implementation for density, function identity, palette, perspective, hierarchy, motion and UI obstruction.
- [ ] Rebuild deployment, source and art archives only after the fidelity ledger has no unresolved material mismatch.
