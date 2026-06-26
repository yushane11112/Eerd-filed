export const PREFAB_REQUIRED_STATES = [
  'constructing',
  'working',
  'blocked',
  'serving',
  'storage_full',
  'idle',
] as const

export const PREFAB_STATE_PRIORITY = [
  'constructing',
  'blocked',
  'storage_full',
  'working',
  'serving',
  'idle',
  'ambient',
] as const

export type PrefabRequiredState = (typeof PREFAB_REQUIRED_STATES)[number]
export type PrefabAnimationState = (typeof PREFAB_STATE_PRIORITY)[number]

export type PrefabLod = 'LOD0' | 'LOD1' | 'LOD2' | 'LOD3'
export type PrefabLodMode = 'full' | 'reduced' | 'static' | 'off'
export type PrefabZBand =
  | 'shadow'
  | 'ground'
  | 'back'
  | 'dynamic'
  | 'agent'
  | 'front'
  | 'light'
  | 'vfx'
  | 'ui'

export type PrefabAnimationTechnique =
  | 'sprite-sequence'
  | 'part-transform'
  | 'particle'
  | 'tint-light'
  | 'none'

export type PrefabPlaybackRateSource =
  | 'sceneTime'
  | 'productionProgress'
  | 'constructionProgress'
  | 'orderPhase'
  | 'fixed'

export interface PrefabPoint2 {
  x: number
  y: number
}

export interface PrefabPoint3 extends PrefabPoint2 {
  z: number
}

export interface GoldBuildingSpriteLayerManifest {
  key: string
  atlas: string
  frame?: string
  zBand: PrefabZBand
  pivotPx: PrefabPoint2
  premultipliedAlpha: true
}

export interface GoldBuildingLevelManifest {
  required: boolean
  dccCollections: string[]
  spriteLayers: GoldBuildingSpriteLayerManifest[]
  animatedParts: string[]
  anchors: string[]
  collisionProfile: string
  occlusionProfile: string
  constructionReveal: Array<{
    progressFrom: number
    progressTo: number
    show: string[]
    hide: string[]
  }>
  lod: Record<PrefabLod, { atlas: string; maxDrawCalls: number; maxTextureMB: number }>
}

export interface GoldBuildingAnchorManifest {
  type: string
  localMeters: PrefabPoint3
  localPx: PrefabPoint2
  facing: number
  tags?: string[]
}

export interface GoldBuildingManifest {
  schemaVersion: 'gold-building.v1'
  assetId: string
  displayName: string
  version: string
  sourceBlend: string
  buildBatch: string
  footprint: PrefabPoint2[]
  footprintMeters: { width: number; depth: number }
  origin: PrefabPoint3
  entranceDirection: string
  bounds: {
    localPx: { left: number; right: number; top: number; bottom: number }
    localMeters: { width: number; depth: number; height: number }
  }
  levels: Record<string, GoldBuildingLevelManifest>
  anchors: Record<string, GoldBuildingAnchorManifest>
  collision: {
    footprint: PrefabPoint2[]
    obstacles: PrefabPoint2[][]
    occluders: PrefabPoint2[][]
    clickHull: PrefabPoint2[]
    waterHull?: PrefabPoint2[]
  }
  validation: {
    triangleBudgetLOD0: number
    maxLayers: number
    maxEmitters: number
    blindRecognitionTarget?: number
  }
}

export interface GoldAnimationSlotManifest {
  domain: string
  requiredState: PrefabAnimationState
  allowedReasons?: string[]
  clip: string
  technique: PrefabAnimationTechnique
  fps?: number
  loop: boolean
  progressRange?: { from: number; to: number }
  playbackRateSource: PrefabPlaybackRateSource
  anchors: string[]
  parts: string[]
  audioCues?: Array<{ key: string; frame?: number; progress?: number }>
  lodPolicy: Record<PrefabLod, PrefabLodMode>
}

export interface GoldAnimationManifest {
  schemaVersion: 'gold-animation.v1'
  assetId: string
  statePriority: PrefabAnimationState[]
  slots: Record<string, GoldAnimationSlotManifest>
  transitions: Array<{
    from: string
    to: string
    blendMs: number
    interruptible: boolean
  }>
  blockedVariants: Record<string, {
    visualSlot: string
    tooltipKey: string
  }>
}

export interface PrefabLayerDescriptor extends GoldBuildingSpriteLayerManifest {
  id: string
}

export interface PrefabLevelDescriptor {
  key: string
  numericLevel: number
  required: boolean
  layers: PrefabLayerDescriptor[]
  animatedParts: readonly string[]
  anchors: readonly string[]
  lod: GoldBuildingLevelManifest['lod']
  collisionProfile: string
  occlusionProfile: string
}

export interface PrefabAnchorDescriptor extends GoldBuildingAnchorManifest {
  id: string
}

export interface PrefabAnimationSlotDescriptor extends GoldAnimationSlotManifest {
  id: string
}

export interface RuntimePrefabDescriptor {
  assetId: string
  displayName: string
  version: string
  footprint: readonly PrefabPoint2[]
  origin: PrefabPoint3
  bounds: GoldBuildingManifest['bounds']
  levels: Record<string, PrefabLevelDescriptor>
  anchors: Record<string, PrefabAnchorDescriptor>
  collision: GoldBuildingManifest['collision']
  statePriority: PrefabAnimationState[]
  stateSlots: Record<PrefabAnimationState, PrefabAnimationSlotDescriptor[]>
  blockedVariants: GoldAnimationManifest['blockedVariants']
  transitions: GoldAnimationManifest['transitions']
}

export type PrefabParseResult =
  | { ok: true; descriptor: RuntimePrefabDescriptor; warnings: string[] }
  | { ok: false; errors: string[]; warnings: string[] }

export type PrefabBuildingStatus =
  | 'constructing'
  | 'upgrading'
  | 'working'
  | 'blocked'
  | 'serving'
  | 'delivering'
  | 'idle'

export interface PrefabStateInput {
  status: PrefabBuildingStatus
  statusReason?: string
  productionProgress?: number
  inventoryFull?: boolean
}
