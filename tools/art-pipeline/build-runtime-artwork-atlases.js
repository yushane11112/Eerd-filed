#!/usr/bin/env node

import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { chromium } from 'playwright'

const sourceRoot = resolve(process.env.ATLAS_SOURCE ?? 'public/assets/buildings-runtime-384')
const outputRoot = resolve(process.env.ATLAS_OUT ?? 'public/assets/buildings-runtime-atlas-webp')
const tileSize = Number.parseInt(process.env.ATLAS_TILE_SIZE ?? '384', 10)
const format = process.env.ATLAS_FORMAT === 'png' ? 'png' : 'webp'
const quality = Math.min(1, Math.max(0.5, Number.parseFloat(process.env.ATLAS_QUALITY ?? '0.9')))
const columns = 3
const rows = 3
if (!Number.isInteger(tileSize) || tileSize < 64) throw new Error(`Invalid ATLAS_TILE_SIZE: ${tileSize}`)
mkdirSync(outputRoot, { recursive: true })

const assetIds = readdirSync(sourceRoot)
  .filter((entry) => statSync(join(sourceRoot, entry)).isDirectory())
  .sort()
if (assetIds.length === 0) throw new Error(`No runtime artwork directories under ${sourceRoot}`)

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
const entries = []
try {
  for (const assetId of assetIds) {
    const images = Array.from({ length: 9 }, (_, level) => {
      const file = join(sourceRoot, assetId, `level-${level}.png`)
      return `data:image/png;base64,${readFileSync(file).toString('base64')}`
    })
    const dataUrl = await page.evaluate(async ({ images, tileSize, columns, rows, format, quality }) => {
      const canvas = document.createElement('canvas')
      canvas.width = tileSize * columns
      canvas.height = tileSize * rows
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Canvas 2D context unavailable')
      context.clearRect(0, 0, canvas.width, canvas.height)
      await Promise.all(images.map((src, level) => new Promise((resolve, reject) => {
        const image = new Image()
        image.onload = () => {
          context.drawImage(image, (level % columns) * tileSize, Math.floor(level / columns) * tileSize, tileSize, tileSize)
          resolve()
        }
        image.onerror = reject
        image.src = src
      })))
      return canvas.toDataURL(`image/${format}`, quality)
    }, { images, tileSize, columns, rows, format, quality })
    const extension = format === 'webp' ? 'webp' : 'png'
    const output = join(outputRoot, `${assetId}.${extension}`)
    const prefix = `data:image/${format};base64,`
    if (!dataUrl.startsWith(prefix)) throw new Error(`Browser cannot encode ${format} atlas.`)
    writeFileSync(output, Buffer.from(dataUrl.slice(prefix.length), 'base64'))
    const levels = Object.fromEntries(Array.from({ length: 9 }, (_, level) => [String(level), {
      x: (level % columns) * tileSize,
      y: Math.floor(level / columns) * tileSize,
      w: tileSize,
      h: tileSize,
    }]))
    entries.push({
      assetId,
      url: `/assets/${outputRoot.split('/assets/').at(-1)}/${assetId}.${extension}`,
      width: tileSize * columns,
      height: tileSize * rows,
      levels,
    })
  }
} finally {
  await browser.close()
}

writeFileSync(join(outputRoot, 'runtime-artwork-atlas-manifest.json'), `${JSON.stringify({
  schemaVersion: 'runtime-artwork-atlas.v1',
  generatedBy: 'tools/art-pipeline/build-runtime-artwork-atlases.js',
  sourceRoot: 'public/assets/buildings-runtime-384',
  outputRoot: 'public/assets/buildings-runtime-atlas-webp',
  tileSize,
  columns,
  rows,
  fileCount: entries.length,
  frameCount: entries.length * 9,
  format,
  quality,
  entries,
}, null, 2)}\n`)
console.log(`Runtime artwork atlases: ${entries.length} files, ${entries.length * 9} frames -> ${outputRoot}`)
