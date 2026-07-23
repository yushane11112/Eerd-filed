import { AnimatedSprite, Assets, Container, Sprite, Spritesheet, Texture } from 'pixi.js'
import type { PrefabAnimationPlan, PrefabAnimationPlayback } from '../prefab/animationRuntime'

export interface BuildingAnimationFrameRequest {
  assetId: string
  levelKey: string
  slotId: string
  clip: string
}

/**
 * Runtime boundary for TexturePacker/Spine/DCC exports.
 * The renderer never invents frames: a missing clip returns undefined and the
 * caller keeps the explicit procedural fallback.
 */
export interface BuildingAnimationProvider {
  getFrames(request: Readonly<BuildingAnimationFrameRequest>): readonly Texture[] | undefined
}

export interface BuildingAnimationPartRequest {
  assetId: string
  levelKey: string
  partId: string
}

export interface BuildingAnimationPartProvider {
  getTexture(request: Readonly<BuildingAnimationPartRequest>): Texture | undefined
}

/** Normalized DCC anchor: x/y are measured across the building footprint. */
export interface BuildingAnimationAnchor {
  x: number
  y: number
}

export interface BuildingAnimationAnchorRequest {
  assetId: string
  levelKey: string
  anchorId: string
}

export interface BuildingAnimationAnchorProvider {
  getAnchor(request: Readonly<BuildingAnimationAnchorRequest>): BuildingAnimationAnchor | undefined
}

export interface BuildingAnimationDriverOptions {
  partProvider?: BuildingAnimationPartProvider
  anchorProvider?: BuildingAnimationAnchorProvider
  particleProvider?: BuildingAnimationPartProvider
}

export interface BuildingAnimationDriverDiagnostics {
  pooledSequenceSprites: number
  pooledPartSprites: number
  pooledParticleSprites: number
  visibleChildren: number
  activeSlots: number
}

export interface BuildingAnimationFrameEntry extends BuildingAnimationFrameRequest {
  frames: readonly Texture[]
}

/** Runtime manifest emitted by the DCC/atlas export step. */
export interface BuildingAnimationAtlasManifestEntry {
  assetId: string
  levelKey: string
  url: string
}

export type BuildingAnimationAtlasManifest = readonly BuildingAnimationAtlasManifestEntry[]

export interface BuildingAnimationAtlasLoader {
  load(url: string): Promise<Spritesheet>
}

export const defaultBuildingAnimationAtlasLoader: BuildingAnimationAtlasLoader = {
  async load(url) {
    return Assets.load<Spritesheet>(url)
  },
}

/** Load authored atlases once and index them by building and level. */
export async function loadBuildingAnimationAtlases(
  manifest: BuildingAnimationAtlasManifest,
  loader: BuildingAnimationAtlasLoader = defaultBuildingAnimationAtlasLoader,
): Promise<ReadonlyMap<string, Spritesheet>> {
  const keys = new Set<string>()
  for (const entry of manifest) {
    if (!entry.assetId || !entry.levelKey || !entry.url) {
      throw new Error('Building animation atlas manifest entries require assetId, levelKey and url')
    }
    const key = atlasKey(entry)
    if (keys.has(key)) throw new Error(`Duplicate building animation atlas key: ${key}`)
    keys.add(key)
  }
  const loaded = await Promise.all(manifest.map(async (entry) => [
    atlasKey(entry),
    await loader.load(entry.url),
  ] as const))
  return new Map(loaded)
}

export function createBuildingAnimationProvider(
  entries: readonly BuildingAnimationFrameEntry[],
): BuildingAnimationProvider {
  const frames = new Map<string, readonly Texture[]>()
  for (const entry of entries) frames.set(animationKey(entry), entry.frames)
  return {
    getFrames(request) {
      return frames.get(animationKey(request))
    },
  }
}

/** Adapter used after TexturePacker/Pixi Spritesheet JSON has been loaded. */
export function createSpritesheetBuildingAnimationProvider(
  sheets: ReadonlyMap<string, Spritesheet>,
): BuildingAnimationProvider {
  return {
    getFrames(request) {
      return sheets.get(`${request.assetId}:${request.levelKey}`)?.animations[request.clip]
    },
  }
}

function atlasKey(entry: Pick<BuildingAnimationAtlasManifestEntry, 'assetId' | 'levelKey'>): string {
  return `${entry.assetId}:${entry.levelKey}`
}

function animationKey(request: Readonly<BuildingAnimationFrameRequest>): string {
  return `${request.assetId}:${request.levelKey}:${request.slotId}:${request.clip}`
}

/**
 * Object-pooled AnimatedSprite host. It is deterministic: each simulation
 * sync selects a frame from the authored plan instead of relying on wall-clock
 * playback, so replay and long-run simulation remain reproducible.
 */
export class BuildingAnimationDriver {
  readonly display = new Container({ label: 'building-animation-atlas-layer' })
  private readonly sprites = new Map<string, AnimatedSprite>()
  private readonly textureSignatures = new Map<string, string>()
  private readonly parts = new Map<string, Sprite>()
  private readonly particles = new Map<string, Sprite>()

  constructor(
    private readonly provider: BuildingAnimationProvider,
    private readonly options: BuildingAnimationDriverOptions = {},
  ) {}

  getDiagnostics(): BuildingAnimationDriverDiagnostics {
    return {
      pooledSequenceSprites: this.sprites.size,
      pooledPartSprites: this.parts.size,
      pooledParticleSprites: this.particles.size,
      visibleChildren: this.display.children.filter((child) => child.visible && child.renderable).length,
      activeSlots: this.display.visible ? this.display.children.filter((child) => child.visible && child.renderable).length : 0,
    }
  }

  update(plan: Readonly<PrefabAnimationPlan>, width: number, height: number): void {
    const active = new Set<string>()
    for (const playback of plan.playback) {
      if (playback.technique === 'sprite-sequence') {
        const frames = this.provider.getFrames({
          assetId: plan.assetId,
          levelKey: plan.levelKey,
          slotId: playback.slotId,
          clip: playback.clip,
        })
        if (!frames || frames.length === 0) continue
        const sprite = this.ensureSprite(playback.slotId, frames)
        active.add(`sequence:${playback.slotId}`)
        const frameIndex = Math.max(0, Math.min(frames.length - 1, Math.floor(playback.progress * frames.length)))
        sprite.gotoAndStop(frameIndex)
        sprite.loop = playback.loop
        sprite.anchor.set(0.5, 1)
        sprite.width = width * 1.85
        sprite.height = height * 1.85
        sprite.position.set(0, 5)
        sprite.visible = true
        sprite.renderable = true
        sprite.label = `building-animation:${plan.assetId}:${plan.levelKey}:${playback.slotId}`
      } else if (playback.technique === 'part-transform') {
        this.updateParts(plan, playback, width, height, active)
      } else if (playback.technique === 'particle') {
        this.updateParticles(plan, playback, width, height, active)
      }
    }
    for (const [slotId, sprite] of this.sprites) {
      if (!active.has(`sequence:${slotId}`)) {
        sprite.visible = false
        sprite.renderable = false
      }
    }
    for (const [key, sprite] of this.parts) this.setActive(sprite, active.has(`part:${key}`))
    for (const [key, sprite] of this.particles) this.setActive(sprite, active.has(`particle:${key}`))
    this.display.visible = active.size > 0
  }

  reset(): void {
    for (const sprite of this.sprites.values()) sprite.stop()
    this.display.removeChildren()
    this.sprites.clear()
    this.textureSignatures.clear()
    for (const sprite of this.parts.values()) sprite.destroy()
    for (const sprite of this.particles.values()) sprite.destroy()
    this.parts.clear()
    this.particles.clear()
    this.display.visible = false
  }

  private updateParts(
    plan: Readonly<PrefabAnimationPlan>,
    playback: Readonly<PrefabAnimationPlayback>,
    width: number,
    height: number,
    active: Set<string>,
  ): void {
    if (!this.options.partProvider) return
    playback.parts.forEach((partId, index) => {
      const texture = this.options.partProvider?.getTexture({
        assetId: plan.assetId,
        levelKey: plan.levelKey,
        partId,
      })
      if (!texture) return
      const key = `${playback.slotId}:${partId}`
      const sprite: Sprite = this.parts.get(key) ?? this.createPart(key, texture)
      if (sprite.texture !== texture) sprite.texture = texture
      const anchorId = playback.anchors[index] ?? playback.anchors[0]
      const anchor = anchorId ? this.options.anchorProvider?.getAnchor({
        assetId: plan.assetId,
        levelKey: plan.levelKey,
        anchorId,
      }) : undefined
      positionAtAnchor(sprite, anchor, width, height)
      sprite.anchor.set(0.5, 0.5)
      sprite.rotation = partId.includes('wheel')
        ? playback.progress * Math.PI * 2
        : Math.sin(playback.progress * Math.PI * 2) * 0.08
      sprite.alpha = playback.loop ? 1 : Math.max(0.2, playback.progress)
      sprite.label = `building-part:${plan.assetId}:${partId}`
      active.add(`part:${key}`)
    })
  }

  private updateParticles(
    plan: Readonly<PrefabAnimationPlan>,
    playback: Readonly<PrefabAnimationPlayback>,
    width: number,
    height: number,
    active: Set<string>,
  ): void {
    if (!this.options.particleProvider) return
    const texture = this.options.particleProvider.getTexture({
      assetId: plan.assetId,
      levelKey: plan.levelKey,
      partId: playback.clip,
    })
    if (!texture) return
    const anchorId = playback.anchors[0]
    const anchor = anchorId ? this.options.anchorProvider?.getAnchor({
      assetId: plan.assetId,
      levelKey: plan.levelKey,
      anchorId,
    }) : undefined
    const count = 3
    for (let index = 0; index < count; index += 1) {
      const key = `${playback.slotId}:${index}`
      const sprite: Sprite = this.particles.get(key) ?? this.createParticle(key, texture)
      if (sprite.texture !== texture) sprite.texture = texture
      positionAtAnchor(sprite, anchor, width, height)
      const phase = playback.progress * Math.PI * 2 + index * 2.1
      sprite.position.x += Math.cos(phase) * width * 0.18
      sprite.position.y -= (0.35 + (Math.sin(phase) + 1) * 0.2) * height
      sprite.alpha = 0.25 + (Math.sin(phase) + 1) * 0.25
      sprite.scale.set(0.35 + index * 0.08)
      sprite.label = `building-particle:${plan.assetId}:${playback.slotId}:${index}`
      active.add(`particle:${key}`)
    }
  }

  private createPart(key: string, texture: Texture): Sprite {
    const sprite = new Sprite(texture)
    this.parts.set(key, sprite)
    this.display.addChild(sprite)
    return sprite
  }

  private createParticle(key: string, texture: Texture): Sprite {
    const sprite = new Sprite(texture)
    this.particles.set(key, sprite)
    this.display.addChild(sprite)
    return sprite
  }

  private setActive(sprite: Sprite, visible: boolean): void {
    sprite.visible = visible
    sprite.renderable = visible
  }

  private ensureSprite(slotId: string, frames: readonly Texture[]): AnimatedSprite {
    const signature = frames.map((frame) => frame.uid).join(',')
    let sprite = this.sprites.get(slotId)
    if (!sprite) {
      sprite = new AnimatedSprite([...frames])
      sprite.autoUpdate = false
      this.sprites.set(slotId, sprite)
      this.display.addChild(sprite)
      this.textureSignatures.set(slotId, signature)
      return sprite
    }
    if (this.textureSignatures.get(slotId) !== signature) {
      sprite.textures = [...frames]
      this.textureSignatures.set(slotId, signature)
    }
    return sprite
  }
}

function positionAtAnchor(
  sprite: Sprite,
  anchor: BuildingAnimationAnchor | undefined,
  width: number,
  height: number,
): void {
  sprite.position.set(
    anchor ? (anchor.x - 0.5) * width : 0,
    anchor ? (anchor.y - 1) * height : 0,
  )
}

export function animationPlaybackUsesAtlas(playback: Readonly<PrefabAnimationPlayback>): boolean {
  return playback.technique === 'sprite-sequence'
}
