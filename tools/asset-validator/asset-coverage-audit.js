#!/usr/bin/env node
/**
 * Commercial art production coverage audit.
 *
 * This is deliberately stricter than the JSON manifest validator: a manifest
 * is a production contract, not proof that the DCC source or runtime binary
 * assets have been delivered.
 */

import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { GOLD_ASSET_IDS, REQUIRED_ALL_LEVELS, validateGoldManifests, validateVisualIdentitySet } from './asset-validator.js';

export const SAMPLE_ROOT = 'docs/project/gold-slice/sample-manifests';

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

function levelKeys(building) {
  return Object.keys(building?.levels ?? {}).map((key) => {
    const match = /^L0?([0-8])$/.exec(key);
    return match ? `L${Number(match[1])}` : key;
  });
}

function unique(values) {
  return [...new Set(values)];
}

export async function auditArtCoverage({ root = SAMPLE_ROOT, repoRoot = '.' } = {}) {
  const report = [];
  const manifestBuildings = [];
  const sampleDirs = new Set((await readdir(root, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name));

  for (const assetId of GOLD_ASSET_IDS) {
    const sampleRoot = path.join(root, assetId);
    const buildingFile = path.join(sampleRoot, 'building-manifest.json');
    const animationFile = path.join(sampleRoot, 'animation-manifest.json');
    const hasDirectory = sampleDirs.has(assetId);
    const hasBuildingManifest = await exists(buildingFile);
    const hasAnimationManifest = await exists(animationFile);

    if (!hasBuildingManifest || !hasAnimationManifest) {
      const missing = [
        !hasBuildingManifest && 'building-manifest.json',
        !hasAnimationManifest && 'animation-manifest.json',
      ].filter(Boolean);
      report.push({
        assetId,
        status: 'MISSING',
        levelCoverage: [],
        missingLevels: REQUIRED_ALL_LEVELS,
        missingArtifacts: unique([
          ...(hasDirectory ? [] : ['sample directory']),
          ...missing,
          'DCC source (.blend)',
          'runtime atlas/binary export',
        ]),
        validatorErrors: [],
      });
      continue;
    }

    const building = await readJson(buildingFile);
    const animation = await readJson(animationFile);
    manifestBuildings.push(building);
    const levels = unique(levelKeys(building));
    const missingLevels = REQUIRED_ALL_LEVELS.filter((level) => !levels.includes(level));
    const validation = validateGoldManifests(
      { building, animation },
      { requireAllLevels: true, requireVisualIdentity: true },
    );
    const sourceBlend = building.sourceBlend ? path.join(repoRoot, building.sourceBlend) : '';
    const hasDccSource = Boolean(sourceBlend) && await exists(sourceBlend);
    const hasArtSourceRoot = await exists(path.join(repoRoot, 'art-source'));
    const missingArtifacts = [
      ...(!hasDccSource ? ['DCC source (.blend)'] : []),
      ...(!hasArtSourceRoot ? ['art-source directory'] : []),
      'runtime atlas/binary export',
    ];

    report.push({
      assetId,
      status: missingLevels.length || validation.errorCount ? 'RED' : 'CONTRACT_ONLY',
      levelCoverage: REQUIRED_ALL_LEVELS.filter((level) => levels.includes(level)),
      missingLevels,
      missingArtifacts,
      validatorErrors: validation.issues.filter((issue) => issue.severity === 'error'),
    });
  }

  const crossAssetIssues = validateVisualIdentitySet(manifestBuildings);
  return {
    requiredAssets: GOLD_ASSET_IDS,
    assets: report,
    crossAssetIssues,
    productionReady: report.every((asset) => asset.status === 'GREEN') && crossAssetIssues.length === 0,
    counts: {
      green: report.filter((asset) => asset.status === 'GREEN').length,
      contractOnly: report.filter((asset) => asset.status === 'CONTRACT_ONLY').length,
      red: report.filter((asset) => asset.status === 'RED').length,
      missing: report.filter((asset) => asset.status === 'MISSING').length,
    },
  };
}

function printReport(result) {
  console.log('Little Ear Island commercial art coverage');
  console.log('asset             status          levels       missing delivery');
  for (const asset of result.assets) {
    const levels = `${asset.levelCoverage.length}/9`;
    const missing = [...asset.missingLevels, ...asset.missingArtifacts].join(', ') || '—';
    console.log(`${asset.assetId.padEnd(18)} ${asset.status.padEnd(15)} ${levels.padEnd(12)} ${missing}`);
    for (const issue of asset.validatorErrors) {
      console.log(`  - ${issue.code}: ${issue.message}`);
    }
  }
  for (const issue of result.crossAssetIssues) {
    console.log(`  - ${issue.code}: ${issue.message}`);
  }
  console.log(`gate: ${result.productionReady ? 'GREEN' : 'RED'} (${JSON.stringify(result.counts)})`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  auditArtCoverage()
    .then((result) => {
      printReport(result);
      if (!result.productionReady) process.exitCode = 1;
    })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 2;
    });
}
