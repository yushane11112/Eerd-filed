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

console.log(`OK: self-test passed. valid errors=${validResult.errorCount}; invalid errors=${invalidResult.errorCount}.`);
