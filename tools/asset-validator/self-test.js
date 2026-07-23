#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateGoldManifests } from './asset-validator.js';

const here = dirname(fileURLToPath(import.meta.url));

async function readFixture(name) {
  return JSON.parse(await readFile(join(here, 'fixtures', name), 'utf8'));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const validResult = validateGoldManifests({
  building: await readFixture('valid-building-manifest.json'),
  animation: await readFixture('valid-animation-manifest.json'),
});

assert(validResult.ok, `valid fixtures should pass, got ${validResult.errorCount} errors:\n${JSON.stringify(validResult.issues, null, 2)}`);

const invalidResult = validateGoldManifests({
  building: await readFixture('invalid-building-manifest.json'),
  animation: await readFixture('invalid-animation-manifest.json'),
});

assert(!invalidResult.ok, 'invalid fixtures should fail');
assert(invalidResult.errorCount >= 10, `invalid fixtures should expose multiple gates, got ${invalidResult.errorCount}`);

const strictMissingLevelsResult = validateGoldManifests(
  {
    building: await readFixture('valid-building-manifest.json'),
    animation: await readFixture('valid-animation-manifest.json'),
  },
  { requireAllLevels: true },
);

assert(!strictMissingLevelsResult.ok, 'strict all-level mode should fail fixtures that only cover sample levels');
assert(
  strictMissingLevelsResult.issues.some(
    (issue) =>
      issue.code === 'level.missing_required_all_levels' &&
      issue.path === 'building.levels.L2' &&
      issue.message.includes('Missing required building level L2'),
  ),
  `strict all-level mode should report a clear missing L2 error:\n${JSON.stringify(strictMissingLevelsResult.issues, null, 2)}`,
);

const overBudgetAnimation = structuredClone(await readFixture('valid-animation-manifest.json'));
for (let index = 0; index < 6; index += 1) {
  overBudgetAnimation.slots[`extra-slot-${index}`] = {
    ...overBudgetAnimation.slots['idle-detail'],
    clip: `extra-${index}`,
  };
}
const overBudgetResult = validateGoldManifests({
  building: await readFixture('valid-building-manifest.json'),
  animation: overBudgetAnimation,
});
assert(
  overBudgetResult.issues.some((issue) => issue.code === 'animation.budget.slots'),
  `runtime animation slot budget should be enforced:\n${JSON.stringify(overBudgetResult.issues, null, 2)}`,
);

console.log(
  `OK: self-test passed. valid errors=${validResult.errorCount}; invalid errors=${invalidResult.errorCount}; strict missing-level errors=${strictMissingLevelsResult.errorCount}.`,
);
