#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, join, relative, resolve } from 'node:path'

const args = new Map()
for (let index = 2; index < process.argv.length; index += 1) {
  const value = process.argv[index]
  if (value.startsWith('--')) args.set(value.slice(2), process.argv[index + 1] ?? true)
}

const sourceRoot = resolve(String(args.get('source') ?? 'public/assets/buildings'))
const outputRoot = resolve(String(args.get('out') ?? 'public/assets/buildings-runtime-384'))
const size = Number.parseInt(String(args.get('size') ?? '384'), 10)
if (!existsSync(sourceRoot)) throw new Error(`Missing source artwork root: ${sourceRoot}`)
if (!Number.isInteger(size) || size < 64) throw new Error(`Invalid runtime size: ${size}`)

const files = []
const walk = (directory) => {
  for (const entry of readdirSync(directory).sort()) {
    const file = join(directory, entry)
    if (statSync(file).isDirectory()) walk(file)
    else if (/^level-\d+\.png$/.test(entry)) files.push(file)
  }
}
walk(sourceRoot)
if (files.length === 0) throw new Error(`No level PNGs found under ${sourceRoot}`)

const entries = []
const byDirectory = new Map()
for (const source of files) {
  const directory = dirname(source)
  const group = byDirectory.get(directory) ?? []
  group.push(source)
  byDirectory.set(directory, group)
}
for (const [sourceDirectory, directoryFiles] of byDirectory) {
  const relativeDirectory = relative(sourceRoot, sourceDirectory)
  const outputDirectory = join(outputRoot, relativeDirectory)
  mkdirSync(outputDirectory, { recursive: true })
  execFileSync('sips', ['--resampleWidth', String(size), '--out', outputDirectory, ...directoryFiles], { stdio: 'ignore' })
  for (const source of directoryFiles) {
    const relativePath = relative(sourceRoot, source)
    const output = join(outputRoot, relativePath)
    const sourceBytes = readFileSync(source)
    const outputBytes = readFileSync(output)
    entries.push({
      source: relativePath,
      output: relative(outputRoot, output),
      sourceSha256: createHash('sha256').update(sourceBytes).digest('hex'),
      sourceBytes: sourceBytes.length,
      outputBytes: outputBytes.length,
      width: size,
      height: size,
    })
  }
}

const manifest = {
  schemaVersion: 'runtime-artwork-derivative.v1',
  generatedBy: 'tools/art-pipeline/build-runtime-artwork-derivatives.js',
  sourceRoot: relative(process.cwd(), sourceRoot),
  outputRoot: relative(process.cwd(), outputRoot),
  resampler: 'sips',
  size,
  fileCount: entries.length,
  totalSourceBytes: entries.reduce((sum, entry) => sum + entry.sourceBytes, 0),
  totalOutputBytes: entries.reduce((sum, entry) => sum + entry.outputBytes, 0),
  entries,
}
writeFileSync(join(outputRoot, 'runtime-artwork-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
console.log(`Runtime artwork derivatives: ${entries.length} files, ${manifest.totalSourceBytes} source bytes -> ${manifest.totalOutputBytes} runtime bytes at ${outputRoot}`)
