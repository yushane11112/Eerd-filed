#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { auditArtCoverage } from './asset-coverage-audit.js';
import { validateGoldManifests, validateVisualIdentitySet } from './asset-validator.js';

const result = await auditArtCoverage();
assert.deepEqual(result.requiredAssets, [
  'main-homes',
  'windfield-rice',
  'main-granary',
  'main-eatery',
  'main-kiln',
  'main-pier',
]);
assert.equal(result.productionReady, false);
assert.equal(result.counts.missing, 3);
assert.equal(result.counts.red, 3);
assert.equal(result.counts.contractOnly, 0);
assert.equal(result.assets.find((asset) => asset.assetId === 'main-pier').missingLevels.length, 5);
assert.ok(result.assets.find((asset) => asset.assetId === 'main-homes').missingArtifacts.includes('DCC source (.blend)'));
assert.ok(result.assets.find((asset) => asset.assetId === 'main-homes').validatorErrors.some((issue) => issue.code === 'visual_identity.missing'));

const building = JSON.parse(await readFile('tools/asset-validator/fixtures/valid-building-manifest.json', 'utf8'));
const animation = JSON.parse(await readFile('tools/asset-validator/fixtures/valid-animation-manifest.json', 'utf8'));
building.levels.L2 = structuredClone(building.levels.L0);
building.levels.L2.dccCollections = ['COL_L02', 'COL_ANIM', 'COL_COLLISION', 'COL_ANCHOR'];
building.levels.L3 = structuredClone(building.levels.L0);
building.levels.L3.dccCollections = ['COL_L03', 'COL_ANIM', 'COL_COLLISION', 'COL_ANCHOR'];
building.levels.L5 = structuredClone(building.levels.L0);
building.levels.L5.dccCollections = ['COL_L05', 'COL_ANIM', 'COL_COLLISION', 'COL_ANCHOR'];
building.levels.L6 = structuredClone(building.levels.L0);
building.levels.L6.dccCollections = ['COL_L06', 'COL_ANIM', 'COL_COLLISION', 'COL_ANCHOR'];
building.levels.L7 = structuredClone(building.levels.L0);
building.levels.L7.dccCollections = ['COL_L07', 'COL_ANIM', 'COL_COLLISION', 'COL_ANCHOR'];
const stages = ['ruin', 'settled', 'settled', 'expanded', 'expanded', 'prosperous', 'prosperous', 'thriving', 'thriving'];
const arc = Object.fromEntries(Array.from({ length: 9 }, (_, index) => {
  const level = `L${index}`;
  return [level, {
    stage: stages[index],
    silhouette: `test-silhouette-${index < 2 ? 0 : index < 5 ? 1 : 2}`,
    functionalRead: `test-function-${index}`,
    environment: `test-environment-${index}`,
    activeElements: [`test-element-${index}`],
    structuralMilestone: [1, 3, 5, 7].includes(index),
  }];
}));
building.visualIdentity = {
  era: 'jiangnan-preindustrial',
  buildingClass: 'test-class',
  silhouetteFamily: 'test-family',
  functionalSignature: 'test-function',
  materialPalette: 'test-palette',
  levelArc: arc,
};
const visualPass = validateGoldManifests({ building, animation }, { requireAllLevels: true, requireVisualIdentity: true });
assert.equal(visualPass.ok, true, `complete visual identity should pass: ${JSON.stringify(visualPass.issues)}`);
building.visualIdentity.levelArc.L8.silhouette = building.visualIdentity.levelArc.L0.silhouette;
const visualFail = validateGoldManifests({ building, animation }, { requireAllLevels: true, requireVisualIdentity: true });
assert.ok(visualFail.issues.some((issue) => issue.code === 'visual_identity.silhouette.no_end_change'));
const duplicateIssues = validateVisualIdentitySet([
  { assetId: 'a', visualIdentity: { buildingClass: 'shop', silhouetteFamily: 'gable', functionalSignature: 'trade' } },
  { assetId: 'b', visualIdentity: { buildingClass: 'shop', silhouetteFamily: 'shed', functionalSignature: 'trade' } },
]);
assert.equal(duplicateIssues.length, 2);
assert.ok(duplicateIssues.some((issue) => issue.code === 'visual_identity.cross_asset_duplicate.buildingClass'));
console.log('OK: art coverage audit correctly keeps the commercial art gate red.');
