#!/usr/bin/env node
/**
 * Audits the delivery package produced by the real DCC export step.
 * JSON templates are not enough: a production package needs source, runtime
 * binaries and state evidence before it can be marked GREEN.
 */

import { access, mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

export const GOLD_ASSET_IDS = ['main-homes', 'windfield-rice', 'main-granary', 'main-eatery', 'main-kiln', 'main-pier'];
export const REQUIRED_LEVELS = Array.from({ length: 9 }, (_, level) => `L${level}`);
export const REQUIRED_STATES = ['constructing', 'working', 'blocked', 'storage_full', 'serving', 'idle', 'ambient'];
export const REQUIRED_COLLECTIONS = ['COL_REF', 'COL_BLOCKOUT', 'COL_SHARED', 'COL_ANIM', 'COL_COLLISION', 'COL_ANCHOR', 'COL_RENDER'];

async function exists(filePath) {
  try { await access(filePath); return true; } catch { return false; }
}

async function readJson(filePath) {
  try { return JSON.parse(await readFile(filePath, 'utf8')); } catch { return undefined; }
}

function missing(values, required) {
  const present = new Set(values);
  return required.filter((value) => !present.has(value));
}

export async function auditProductionPackage({ root = 'art-source/exports/buildings', assetIds = GOLD_ASSET_IDS } = {}) {
  const assets = [];
  for (const assetId of assetIds) {
    const assetRoot = path.join(root, assetId);
    const dccFile = path.join(assetRoot, 'dcc-export-manifest.json');
    const atlasFile = path.join(assetRoot, 'runtime-atlas-manifest.json');
    const anchorsFile = path.join(assetRoot, 'anchor-manifest.json');
    const evidenceFile = path.join(assetRoot, 'state-evidence.json');
    const dcc = await readJson(dccFile);
    const atlas = await readJson(atlasFile);
    const anchors = await readJson(anchorsFile);
    const evidence = await readJson(evidenceFile);
    const issues = [];

    if (!dcc) issues.push('missing or invalid dcc-export-manifest.json');
    if (!atlas) issues.push('missing or invalid runtime-atlas-manifest.json');
    if (!anchors) issues.push('missing or invalid anchor-manifest.json');
    if (!evidence) issues.push('missing or invalid state-evidence.json');

    if (dcc) {
      if (dcc.schemaVersion !== 'dcc-export.v1') issues.push('dcc schemaVersion must be dcc-export.v1');
      if (dcc.assetId !== assetId) issues.push('dcc assetId mismatch');
      issues.push(...missing((dcc.levels ?? []).map((entry) => `L${entry.level}`), REQUIRED_LEVELS).map((level) => `dcc missing ${level}`));
      issues.push(...missing(dcc.collections ?? [], REQUIRED_COLLECTIONS).map((name) => `dcc missing collection ${name}`));
      for (const gate of ['transparentPng', 'uniqueSilhouette', 'collisionAndOcclusion', 'stateDrivenAnimation', 'noFlattenedBuildingOnlyExport']) {
        if (dcc.qualityGates?.[gate] !== true) issues.push(`dcc quality gate is not true: ${gate}`);
      }
    }

    if (atlas) {
      if (atlas.schemaVersion !== 'runtime-atlas.v1') issues.push('atlas schemaVersion must be runtime-atlas.v1');
      if (atlas.assetId !== assetId) issues.push('atlas assetId mismatch');
      issues.push(...missing((atlas.entries ?? []).map((entry) => entry.levelKey), REQUIRED_LEVELS).map((level) => `atlas missing ${level}`));
      for (const entry of atlas.entries ?? []) {
        if (!entry.url || !entry.json) issues.push(`atlas entry ${entry.levelKey} must declare url and json`);
        if (!Array.isArray(entry.clips) || entry.clips.length === 0) issues.push(`atlas entry ${entry.levelKey} has no clips`);
      }
    }

    if (anchors) {
      if (anchors.schemaVersion !== 'runtime-anchor.v1') issues.push('anchor schemaVersion must be runtime-anchor.v1');
      if (anchors.assetId !== assetId) issues.push('anchor assetId mismatch');
      if (!Array.isArray(anchors.anchors) || anchors.anchors.length === 0) issues.push('anchor manifest has no semantic anchors');
    }

    if (evidence) {
      if (evidence.schemaVersion !== 'state-evidence.v1') issues.push('state evidence schemaVersion must be state-evidence.v1');
      issues.push(...missing(evidence.states ?? [], REQUIRED_STATES).map((state) => `state evidence missing ${state}`));
      if (!evidence.captureDirectory) issues.push('state evidence must declare captureDirectory');
    }

    for (const level of REQUIRED_LEVELS) {
      if (!await exists(path.join(assetRoot, `level-${Number(level.slice(1))}.png`))) issues.push(`missing transparent preview ${level}`);
    }
    assets.push({ assetId, status: issues.length === 0 ? 'GREEN' : 'RED', issues });
  }
  return { assets, productionReady: assets.every((asset) => asset.status === 'GREEN') };
}

export async function runProductionPackageSelfTest() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'little-ear-island-art-'));
  try {
    const assetRoot = path.join(root, 'main-pier');
    await mkdir(assetRoot, { recursive: true });
    await writeFile(path.join(assetRoot, 'dcc-export-manifest.json'), JSON.stringify({
      schemaVersion: 'dcc-export.v1', assetId: 'main-pier',
      levels: REQUIRED_LEVELS.map((level) => ({ level: Number(level.slice(1)) })),
      collections: REQUIRED_COLLECTIONS,
      qualityGates: Object.fromEntries(['transparentPng', 'uniqueSilhouette', 'collisionAndOcclusion', 'stateDrivenAnimation', 'noFlattenedBuildingOnlyExport'].map((gate) => [gate, true])),
    }));
    await writeFile(path.join(assetRoot, 'runtime-atlas-manifest.json'), JSON.stringify({
      schemaVersion: 'runtime-atlas.v1', assetId: 'main-pier',
      entries: REQUIRED_LEVELS.map((level) => ({ levelKey: level, url: `${level}.png`, json: `${level}.json`, clips: ['idle'] })),
    }));
    await writeFile(path.join(assetRoot, 'anchor-manifest.json'), JSON.stringify({ schemaVersion: 'runtime-anchor.v1', assetId: 'main-pier', anchors: ['origin'] }));
    await writeFile(path.join(assetRoot, 'state-evidence.json'), JSON.stringify({ schemaVersion: 'state-evidence.v1', states: REQUIRED_STATES, captureDirectory: 'captures' }));
    for (let level = 0; level < 9; level += 1) await writeFile(path.join(assetRoot, `level-${level}.png`), 'png');

    const valid = await auditProductionPackage({ root, assetIds: ['main-pier'] });
    if (!valid.productionReady) throw new Error(`complete package rejected: ${JSON.stringify(valid)}`);
    await rm(path.join(assetRoot, 'state-evidence.json'));
    const invalid = await auditProductionPackage({ root, assetIds: ['main-pier'] });
    if (invalid.productionReady || !invalid.assets[0].issues.includes('missing or invalid state-evidence.json')) {
      throw new Error(`incomplete package accepted: ${JSON.stringify(invalid)}`);
    }
    console.log('OK: production package self-test passed. complete package green; missing state evidence red.');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv.includes('--self-test')) {
    runProductionPackageSelfTest().catch((error) => { console.error(error.message); process.exitCode = 1; });
  } else {
    auditProductionPackage().then((result) => {
      for (const asset of result.assets) console.log(`${asset.assetId.padEnd(18)} ${asset.status.padEnd(5)} ${asset.issues.join('; ') || '—'}`);
      console.log(`production package gate: ${result.productionReady ? 'GREEN' : 'RED'}`);
      if (!result.productionReady) process.exitCode = 1;
    }).catch((error) => { console.error(error.message); process.exitCode = 2; });
  }
}
