import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const runtimeMode = process.argv.includes('--runtime')
const root = join(process.cwd(), 'public', runtimeMode ? 'assets/buildings-runtime-384' : 'assets/buildings')
const expectedSize = runtimeMode ? 384 : 512
const requiredLevels = 9
const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
const failures = []
const hashes = new Map()
let checked = 0

if (!existsSync(root)) failures.push(`missing artwork root: ${root}`)

for (const assetId of existsSync(root) ? readdirSync(root).sort() : []) {
  const directory = join(root, assetId)
  if (!statSync(directory).isDirectory()) continue
  for (let level = 0; level < requiredLevels; level += 1) {
    const file = join(directory, `level-${level}.png`)
    checked += 1
    if (!existsSync(file)) {
      failures.push(`${assetId}/level-${level}.png: missing`)
      continue
    }
    const buffer = readFileSync(file)
    if (!buffer.subarray(0, 8).equals(pngSignature)) failures.push(`${assetId}/level-${level}.png: invalid PNG signature`)
    const width = buffer.readUInt32BE(16)
    const height = buffer.readUInt32BE(20)
    const colorType = buffer[25]
    if (width !== expectedSize || height !== expectedSize) failures.push(`${assetId}/level-${level}.png: expected ${expectedSize}x${expectedSize}, got ${width}x${height}`)
    if (colorType !== 6) failures.push(`${assetId}/level-${level}.png: expected RGBA color type 6, got ${colorType}`)
    const hash = createHash('sha256').update(buffer).digest('hex')
    const prior = hashes.get(hash)
    if (prior) failures.push(`${assetId}/level-${level}.png: byte-identical duplicate of ${prior}`)
    else hashes.set(hash, `${assetId}/level-${level}.png`)
  }
}

const directories = existsSync(root)
  ? readdirSync(root).filter((entry) => statSync(join(root, entry)).isDirectory()).length
  : 0
if (runtimeMode) {
  const manifestFile = join(root, 'runtime-artwork-manifest.json')
  if (!existsSync(manifestFile)) failures.push('runtime-artwork-manifest.json: missing provenance manifest')
  else {
    try {
      const manifest = JSON.parse(readFileSync(manifestFile, 'utf8'))
      if (manifest.schemaVersion !== 'runtime-artwork-derivative.v1') failures.push('runtime-artwork-manifest.json: invalid schemaVersion')
      if (manifest.fileCount !== checked) failures.push(`runtime-artwork-manifest.json: fileCount ${manifest.fileCount} does not match ${checked}`)
      if (manifest.size !== expectedSize) failures.push(`runtime-artwork-manifest.json: size ${manifest.size} does not match ${expectedSize}`)
    } catch {
      failures.push('runtime-artwork-manifest.json: invalid JSON')
    }
  }
}
console.log(`Runtime artwork audit: ${directories} building folders, ${checked} level files, ${hashes.size} unique files.`)
if (failures.length) {
  console.error(failures.join('\n'))
  process.exitCode = 1
} else {
    console.log(`Runtime artwork audit passed: every discovered building has 9 unique ${expectedSize}x${expectedSize} RGBA levels.`)
}
