import type { ResolvedPrefabBuilding } from './registry'
import type { PrefabAnimationSlotDescriptor, PrefabLod } from './types'

export interface PrefabAnimationRuntimeInput {
  tick: number
  productionProgress?: number
  constructionProgress?: number
  orderPhase?: number
  lod?: PrefabLod
}

export interface PrefabAnimationPlayback {
  slotId: string
  clip: string
  technique: PrefabAnimationSlotDescriptor['technique']
  progress: number
  frame: number
  loop: boolean
  lodMode: PrefabAnimationSlotDescriptor['lodPolicy'][PrefabLod]
  anchors: readonly string[]
  parts: readonly string[]
}

export interface PrefabAnimationPlan {
  assetId: string
  state: ResolvedPrefabBuilding['state']
  levelKey: string
  playback: PrefabAnimationPlayback[]
}

const DEFAULT_LOD: PrefabLod = 'LOD1'

/**
 * Converts authored manifest slots into a deterministic frame plan.
 * Rendering can consume this plan with AnimatedSprite, transform tweens, or
 * particles without reimplementing state selection in each building prefab.
 */
export function resolvePrefabAnimationPlan(
  resolved: Readonly<ResolvedPrefabBuilding>,
  input: Readonly<PrefabAnimationRuntimeInput>,
): PrefabAnimationPlan {
  const lod = input.lod ?? DEFAULT_LOD
  const playback = resolved.slots
    .filter((slot) => slot.lodPolicy[lod] !== 'off')
    .map((slot) => {
      const progress = playbackProgress(slot, input)
      const fps = slot.fps ?? 12
      return {
        slotId: slot.id,
        clip: slot.clip,
        technique: slot.technique,
        progress,
        frame: Math.floor(progress * fps) % Math.max(1, Math.ceil(fps)),
        loop: slot.loop,
        lodMode: slot.lodPolicy[lod],
        anchors: slot.anchors,
        parts: slot.parts,
      }
    })

  return {
    assetId: resolved.assetId,
    state: resolved.state,
    levelKey: resolved.levelKey,
    playback,
  }
}

function playbackProgress(
  slot: Readonly<PrefabAnimationSlotDescriptor>,
  input: Readonly<PrefabAnimationRuntimeInput>,
): number {
  const sourceValue = {
    sceneTime: input.tick / 60,
    productionProgress: input.productionProgress ?? 0,
    constructionProgress: input.constructionProgress ?? input.productionProgress ?? 0,
    orderPhase: input.orderPhase ?? input.tick / 60,
    fixed: 0,
  }[slot.playbackRateSource]
  const normalized = slot.progressRange
    ? normalize(sourceValue, slot.progressRange.from, slot.progressRange.to)
    : sourceValue
  return slot.loop ? positiveFraction(normalized) : clamp(normalized)
}

function normalize(value: number, from: number, to: number): number {
  if (to <= from) return 0
  return (value - from) / (to - from)
}

function positiveFraction(value: number): number {
  return ((value % 1) + 1) % 1
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value))
}
