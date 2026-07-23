#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

export const ARTWORK_BUDGETS = {
  maxSingleTextureBytes: 700 * 1024,
  maxBuildingBundleBytes: 6 * 1024 * 1024,
  maxAllArtworkBytes: 96 * 1024 * 1024,
  maxEstimatedGpuBytes: 256 * 1024 * 1024,
}

const sourceRoot = join(process.cwd(), 'public', 'assets', 'buildings')
const runtimeRoot = join(process.cwd(), 'public', 'assets', 'buildings-runtime-384')
const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

export function auditRuntimeArtworkBudget({ artworkRoot = root, budgets = ARTWORK_BUDGETS } = {}) {
  const failures = []
  const buildings = []
  let totalBytes = 0
  let totalGpuBytes = 0

  if (!existsSync(artworkRoot)) return { ok: false, failures: [`missing artwork root: ${artworkRoot}`], buildings, totalBytes, totalGpuBytes }

  for (const assetId of readdirSync(artworkRoot).sort()) {
    const directory = join(artworkRoot, assetId)
    if (!statSync(directory).isDirectory()) continue
    const files = readdirSync(directory).filter((file) => /^level-\d+\.png$/.test(file)).sort()
    let bundleBytes = 0
    let bundleGpuBytes = 0
    for (const fileName of files) {
      const file = join(directory, fileName)
      const buffer = readFileSync(file)
      const bytes = statSync(file).size
      const width = buffer.subarray(0, 8).equals(pngSignature) ? buffer.readUInt32BE(16) : 0
      const height = buffer.subarray(0, 8).equals(pngSignature) ? buffer.readUInt32BE(20) : 0
      const gpuBytes = width * height * 4
      bundleBytes += bytes
      bundleGpuBytes += gpuBytes
      totalBytes += bytes
      totalGpuBytes += gpuBytes
      if (bytes > budgets.maxSingleTextureBytes) failures.push(`${assetId}/${fileName}: ${bytes} bytes exceeds single texture budget ${budgets.maxSingleTextureBytes}`)
      if (!width || !height) failures.push(`${assetId}/${fileName}: cannot estimate decoded RGBA memory`)
    }
    if (bundleBytes > budgets.maxBuildingBundleBytes) failures.push(`${assetId}: ${bundleBytes} bytes exceeds building bundle budget ${budgets.maxBuildingBundleBytes}`)
    buildings.push({ assetId, fileCount: files.length, bundleBytes, bundleGpuBytes })
  }

  if (totalBytes > budgets.maxAllArtworkBytes) failures.push(`all artwork: ${totalBytes} bytes exceeds download budget ${budgets.maxAllArtworkBytes}`)
  if (totalGpuBytes > budgets.maxEstimatedGpuBytes) failures.push(`all artwork: estimated ${totalGpuBytes} decoded bytes exceeds GPU budget ${budgets.maxEstimatedGpuBytes}`)
  return { ok: failures.length === 0, failures, buildings, totalBytes, totalGpuBytes }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const targetRoot = process.argv.includes('--runtime') ? runtimeRoot : sourceRoot
  const result = auditRuntimeArtworkBudget({ artworkRoot: targetRoot })
  console.log(`Runtime artwork budget audit: ${result.buildings.length} building bundles, ${result.totalBytes} download bytes, ${result.totalGpuBytes} estimated decoded RGBA bytes.`)
  if (!result.ok) {
    console.error(result.failures.join('\n'))
    process.exitCode = 1
  } else {
    console.log('Runtime artwork budget audit passed.')
  }
}
