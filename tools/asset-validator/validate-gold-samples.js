#!/usr/bin/env node
/**
 * Batch validator for committed gold-slice sample manifests.
 *
 * It discovers each direct child of docs/project/gold-slice/sample-manifests/
 * that contains both building-manifest.json and animation-manifest.json, then
 * runs the same JSON-only validator used by the single-asset CLI.
 */

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { validateGoldManifests } from './asset-validator.js';

const SAMPLE_ROOT = 'docs/project/gold-slice/sample-manifests';

function parseArgs(argv) {
  const args = { requireAllLevels: false };
  for (const arg of argv) {
    if (arg === '--require-all-levels') args.requireAllLevels = true;
    else if (arg === '--help' || arg === '-h') args.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function printUsage() {
  console.error('Usage: node tools/asset-validator/validate-gold-samples.js [--require-all-levels]');
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

async function findSamplePairs(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const sampleDirs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  const pairs = [];
  const incomplete = [];
  for (const sampleDir of sampleDirs) {
    const buildingPath = path.join(root, sampleDir, 'building-manifest.json');
    const animationPath = path.join(root, sampleDir, 'animation-manifest.json');
    const files = new Set(await readdir(path.join(root, sampleDir)));
    const hasBuilding = files.has('building-manifest.json');
    const hasAnimation = files.has('animation-manifest.json');
    if (hasBuilding && hasAnimation) {
      pairs.push({ sampleDir, buildingPath, animationPath });
    } else if (hasBuilding || hasAnimation) {
      incomplete.push({ sampleDir, hasBuilding, hasAnimation });
    }
  }
  return { pairs, incomplete };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    return;
  }

  const { pairs, incomplete } = await findSamplePairs(SAMPLE_ROOT);
  if (pairs.length === 0) {
    console.error(`FAILED: no complete gold sample manifest pairs found under ${SAMPLE_ROOT}.`);
    process.exit(1);
  }

  let failed = incomplete.length > 0;
  for (const partial of incomplete) {
    const missing = [
      partial.hasBuilding ? undefined : 'building-manifest.json',
      partial.hasAnimation ? undefined : 'animation-manifest.json',
    ].filter(Boolean);
    console.error(`FAILED: ${partial.sampleDir}: incomplete sample, missing ${missing.join(', ')}.`);
  }

  for (const pair of pairs) {
    const result = validateGoldManifests({
      building: await readJson(pair.buildingPath),
      animation: await readJson(pair.animationPath),
    }, { requireAllLevels: args.requireAllLevels });

    if (result.ok) {
      console.log(`OK: ${pair.sampleDir} passed (${result.warningCount} warnings).`);
      continue;
    }

    failed = true;
    console.error(`FAILED: ${pair.sampleDir}: ${result.errorCount} errors, ${result.warningCount} warnings.`);
    for (const issue of result.issues) {
      console.error(`[${issue.severity}] ${issue.code} at ${issue.path}: ${issue.message}`);
    }
  }

  if (failed) {
    process.exit(1);
  }
  console.log(`OK: validated ${pairs.length} gold sample manifest pairs.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(2);
});
