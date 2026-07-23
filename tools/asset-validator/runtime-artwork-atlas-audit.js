#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

const root = resolve(process.env.ATLAS_ROOT ?? 'public/assets/buildings-runtime-atlas-webp')
const manifestPath = join(root, 'runtime-artwork-atlas-manifest.json')
if (!existsSync(manifestPath)) throw new Error(`Atlas manifest missing: ${manifestPath}`)
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
if (manifest.schemaVersion !== 'runtime-artwork-atlas.v1') throw new Error(`Unsupported atlas schema: ${manifest.schemaVersion}`)
if (manifest.fileCount !== 28 || manifest.frameCount !== 252) {
  throw new Error(`Unexpected atlas counts: ${manifest.fileCount} files / ${manifest.frameCount} frames`)
}
const entries = manifest.entries
if (!Array.isArray(entries) || entries.length !== manifest.fileCount) throw new Error('Atlas manifest entries do not match fileCount.')
const extensions = new Set(entries.map((entry) => entry.url.split('.').at(-1)))
if (extensions.size !== 1 || !extensions.has(manifest.format)) throw new Error('Atlas manifest format does not match entry URLs.')
for (const entry of entries) {
  const file = join(root, entry.url.split('/').at(-1))
  if (!existsSync(file) || statSync(file).size === 0) throw new Error(`Atlas file missing or empty: ${file}`)
  if (Object.keys(entry.levels ?? {}).length !== 9) throw new Error(`Atlas entry must contain 9 levels: ${entry.assetId}`)
}
const atlasFiles = readdirSync(root).filter((file) => file.endsWith(`.${manifest.format}`))
if (atlasFiles.length !== manifest.fileCount) throw new Error(`Atlas file count mismatch: ${atlasFiles.length}`)
console.log(`Runtime artwork atlas audit passed: ${manifest.fileCount} ${manifest.format} atlases, ${manifest.frameCount} frames, ${(atlasFiles.reduce((sum, file) => sum + statSync(join(root, file)).size, 0) / 1024 / 1024).toFixed(2)} MiB.`)
