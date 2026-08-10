import { Assets, Rectangle, Sprite, Texture } from 'pixi.js'
import embeddedArtworkAtlasManifest from './runtime-artwork-atlas-manifest.json'
import embeddedArtworkAtlasPreviewManifest from './runtime-artwork-atlas-preview-manifest.json'

export const BUILDING_ARTWORK_LEVELS = 9
export const BUILDING_ARTWORK_RUNTIME_ROOT = '/assets/buildings-runtime-384'
export const BUILDING_ARTWORK_ATLAS_ROOT = '/assets/buildings-runtime-atlas-webp'
export const BUILDING_ARTWORK_ATLAS_MANIFEST = `${BUILDING_ARTWORK_ATLAS_ROOT}/runtime-artwork-atlas-manifest.json`

/** Runtime contract for the authored building renders kept in public/assets. */
export interface BuildingArtworkProvider {
  get(assetId: string, level: number): Texture | undefined
}

export interface BuildingArtworkPreloadOptions {
  timeoutMs?: number
  signal?: AbortSignal
  maxTextures?: number
  /** Levels needed by the current visible snapshot; omitted means all levels. */
  preloadLevels?: readonly number[]
  /** Shared-atlas path; enabled by default in production with PNG fallback. */
  atlas?: boolean
  /** Asset ids that can be filled after the first rendered frame is unblocked. */
  deferredAssetIds?: readonly string[]
  onAtlasLoadProfile?: (profile: BuildingArtworkAtlasLoadProfile) => void
}

export interface BuildingArtworkAtlasLoadProfile {
  manifestMs: number
  blockingLoadMs: number
  deferredDispatchMs: number
  fullQualityDispatchMs: number
  blockingEntryCount: number
  deferredEntryCount: number
  fullQualityEntryCount: number
  blockingTextureCount: number
  deferredTextureCount: number
  fullQualityTextureCount: number
}

export interface BuildingArtworkAtlasFrame { x: number; y: number; w: number; h: number }
export interface BuildingArtworkAtlasEntry {
  assetId: string
  url: string
  width: number
  height: number
  levels: Record<string, BuildingArtworkAtlasFrame>
}
export interface BuildingArtworkAtlasManifest {
  schemaVersion: 'runtime-artwork-atlas.v1'
  tileSize: number
  columns: number
  rows: number
  fileCount: number
  frameCount: number
  entries: BuildingArtworkAtlasEntry[]
}

export function buildBuildingArtworkAssetPaths(
  assetIds: readonly string[],
  levels: readonly number[] = Array.from({ length: BUILDING_ARTWORK_LEVELS }, (_, level) => level),
): string[] {
  const safeLevels = [...new Set(levels.map((level) => Math.max(0, Math.min(BUILDING_ARTWORK_LEVELS - 1, Math.round(level)))))]
  return [...new Set(assetIds.flatMap((assetId) => (
    safeLevels.map((level) => resolveBuildingArtworkPath(assetId, level))
  )))]
}

function createAbortError(message: string): Error {
  const error = new Error(message)
  error.name = 'AbortError'
  return error
}

async function loadWithGuard<T>(
  promise: Promise<T>,
  { timeoutMs = 15_000, signal }: BuildingArtworkPreloadOptions,
): Promise<T> {
  if (signal?.aborted) throw createAbortError('Building artwork preload was cancelled.')
  if (timeoutMs <= 0 && !signal) return promise

  let timeoutId: ReturnType<typeof setTimeout> | undefined
  let removeAbortListener: (() => void) | undefined
  const guard = new Promise<never>((_, reject) => {
    if (timeoutMs > 0) {
      timeoutId = setTimeout(() => reject(new Error(`Building artwork preload timed out after ${timeoutMs}ms.`)), timeoutMs)
    }
    if (signal) {
      const onAbort = () => reject(createAbortError('Building artwork preload was cancelled.'))
      signal.addEventListener('abort', onAbort, { once: true })
      removeAbortListener = () => signal.removeEventListener('abort', onAbort)
    }
  })

  try {
    return await Promise.race([promise, guard])
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
    removeAbortListener?.()
  }
}

export async function loadDefaultBuildingArtworkProvider(
  assetIds: readonly string[],
  options: BuildingArtworkPreloadOptions = {},
): Promise<BuildingArtworkProvider> {
  if (options.signal?.aborted) throw createAbortError('Building artwork preload was cancelled.')
  const paths = buildBuildingArtworkAssetPaths(assetIds, options.preloadLevels)
  if (paths.length === 0) return createDefaultBuildingArtworkProvider()
  if (options.atlas) return loadDefaultBuildingArtworkAtlasProvider(assetIds, options)
  const maxTextures = options.maxTextures ?? 512
  if (paths.length > maxTextures) {
    throw new Error(`Building artwork preload requires ${paths.length} textures; budget is ${maxTextures}.`)
  }

  // Pixi's Texture.from(string) is cache-only in v8. Preloading through Assets
  // makes the first rendered frame use decoded image resources instead of
  // attempting to upload an HTMLImageElement before it has pixels.
  const loaded = await loadWithGuard(Assets.load<Texture>(paths, { strategy: 'throw' }), options)
  const textures = new Map<string, Texture>()
  for (const path of paths) {
    const texture = loaded[path]
    if (texture) textures.set(path, texture)
  }
  return createDefaultBuildingArtworkProvider(textures)
}

export async function loadDefaultBuildingArtworkAtlasProvider(
  assetIds: readonly string[],
  options: BuildingArtworkPreloadOptions = {},
): Promise<BuildingArtworkProvider> {
  const manifestStartedAt = performance.now()
  if (options.signal?.aborted) throw createAbortError('Building artwork preload was cancelled.')
  const manifest = embeddedArtworkAtlasManifest as BuildingArtworkAtlasManifest
  const previewManifest = embeddedArtworkAtlasPreviewManifest as BuildingArtworkAtlasManifest
  const manifestMs = performance.now() - manifestStartedAt
  if (manifest.schemaVersion !== 'runtime-artwork-atlas.v1') throw new Error('Unsupported building artwork atlas manifest.')
  if (previewManifest.schemaVersion !== 'runtime-artwork-atlas.v1') throw new Error('Unsupported preview building artwork atlas manifest.')
  const wanted = new Set([...assetIds, ...(options.deferredAssetIds ?? [])])
  const entries = manifest.entries.filter((entry) => wanted.has(entry.assetId))
  const previewEntries = previewManifest.entries.filter((entry) => assetIds.includes(entry.assetId))
  const textures = new Map<string, Texture>()
  const levels = options.preloadLevels?.length
    ? [...new Set(options.preloadLevels.map((level) => Math.max(0, Math.min(BUILDING_ARTWORK_LEVELS - 1, Math.round(level)))))]
    : Array.from({ length: BUILDING_ARTWORK_LEVELS }, (_, level) => level)
  const blockingEntries = entries.filter((entry) => assetIds.includes(entry.assetId))
  const deferredEntries = entries.filter((entry) => !assetIds.includes(entry.assetId))
  const blockingStartedAt = performance.now()
  const blockingTextureCount = await loadAtlasEntriesIntoTextures(previewEntries, textures, levels, options)
  const blockingLoadMs = performance.now() - blockingStartedAt
  let deferredDispatchMs = 0
  let fullQualityDispatchMs = 0
  if (deferredEntries.length > 0) {
    const deferredStartedAt = performance.now()
    void loadAtlasEntriesIntoTextures(deferredEntries, textures, levels, options).catch((error) => {
      if (options.signal?.aborted) return
      console.warn('Deferred building artwork atlas preload failed.', error)
    })
    deferredDispatchMs = performance.now() - deferredStartedAt
  }
  if (blockingEntries.length > 0) {
    const fullQualityStartedAt = performance.now()
    void loadAtlasEntriesIntoTextures(blockingEntries, textures, levels, options).catch((error) => {
      if (options.signal?.aborted) return
      console.warn('Full-quality building artwork atlas preload failed.', error)
    })
    fullQualityDispatchMs = performance.now() - fullQualityStartedAt
  }
  options.onAtlasLoadProfile?.({
    manifestMs,
    blockingLoadMs,
    deferredDispatchMs,
    fullQualityDispatchMs,
    blockingEntryCount: previewEntries.length,
    deferredEntryCount: deferredEntries.length,
    fullQualityEntryCount: blockingEntries.length,
    blockingTextureCount,
    deferredTextureCount: deferredEntries.length * levels.length,
    fullQualityTextureCount: blockingEntries.length * levels.length,
  })
  return createBuildingArtworkAtlasProvider(textures)
}

async function loadAtlasEntriesIntoTextures(
  entries: readonly BuildingArtworkAtlasEntry[],
  textures: Map<string, Texture>,
  levels: readonly number[],
  options: BuildingArtworkPreloadOptions,
): Promise<number> {
  if (entries.length === 0) return 0
  const loaded = await loadWithGuard(Assets.load<Texture>(entries.map((entry) => entry.url), { strategy: 'throw' }), options)
  let textureCount = 0
  for (const entry of entries) {
    const atlas = loaded[entry.url]
    if (!atlas) continue
    for (const level of levels) {
      const frame = entry.levels[String(level)]
      if (!frame) continue
      textures.set(`${entry.assetId}:${level}`, new Texture({
        source: atlas.source,
        frame: new Rectangle(frame.x, frame.y, frame.w, frame.h),
      }))
      textureCount += 1
    }
  }
  return textureCount
}

export function resolveBuildingArtworkPath(assetId: string, level: number): string {
  const safeLevel = Math.max(0, Math.min(BUILDING_ARTWORK_LEVELS - 1, Math.round(level)))
  return `${BUILDING_ARTWORK_RUNTIME_ROOT}/${assetId}/level-${safeLevel}.png`
}

/** Production provider: Vite serves these authored transparent PNGs from public/. */
export function createDefaultBuildingArtworkProvider(
  preloadedTextures: ReadonlyMap<string, Texture> = new Map(),
): BuildingArtworkProvider {
  const textures = new Map(preloadedTextures)
  return {
    get(assetId, level) {
      const path = resolveBuildingArtworkPath(assetId, level)
      const cached = textures.get(path)
      if (cached) return cached
      // These assets are intentionally lazy-loaded and are not registered in
      // Pixi's global Assets cache. Passing an Image resource (rather than a
      // string id) avoids Pixi's string-only cache lookup and its misleading
      // "not found in Cache" warning on the first frame.
      const texture = typeof document === 'undefined'
        ? Texture.from(path)
        : Texture.from(Object.assign(document.createElement('img'), { src: path }), true)
      textures.set(path, texture)
      return texture
    },
  }
}

export function createBuildingArtworkAtlasProvider(
  preloadedTextures: ReadonlyMap<string, Texture>,
): BuildingArtworkProvider {
  return {
    get(assetId, level) {
      return preloadedTextures.get(`${assetId}:${Math.max(0, Math.min(BUILDING_ARTWORK_LEVELS - 1, Math.round(level)))}`)
    },
  }
}

export function configureBuildingArtworkSprite(
  sprite: Sprite,
  texture: Texture,
  width: number,
  height: number,
): void {
  sprite.texture = texture
  sprite.anchor.set(0.5, 1)
  sprite.width = width * 2.15
  sprite.height = height * 2.15
  sprite.position.set(0, 6)
}
