import {
  PREFAB_REQUIRED_STATES,
  PREFAB_STATE_PRIORITY,
  type GoldAnimationManifest,
  type GoldAnimationSlotManifest,
  type GoldBuildingLevelManifest,
  type GoldBuildingManifest,
  type PrefabAnimationState,
  type PrefabParseResult,
  type PrefabStateInput,
  type RuntimePrefabDescriptor,
} from './types'

const LOD_KEYS = ['LOD0', 'LOD1', 'LOD2', 'LOD3'] as const
const MAIN_WORKING_PLAYBACK = new Set(['productionProgress', 'orderPhase'])
const STORAGE_FULL_REASONS = new Set(['storage-full', 'storage_full', 'output-full', 'output_full'])

export function parseRuntimePrefabDescriptor(
  buildingManifest: unknown,
  animationManifest: unknown,
): PrefabParseResult {
  const errors: string[] = []
  const warnings: string[] = []

  const building = buildingManifest as Partial<GoldBuildingManifest>
  const animation = animationManifest as Partial<GoldAnimationManifest>

  validateBuildingRoot(building, errors)
  validateAnimationRoot(animation, errors)

  if (building.assetId && animation.assetId && building.assetId !== animation.assetId) {
    errors.push(`assetId mismatch: building '${building.assetId}' != animation '${animation.assetId}'`)
  }

  const levels = isRecord(building.levels) ? building.levels : {}
  const anchors = isRecord(building.anchors) ? building.anchors : {}
  const slots = isRecord(animation.slots) ? animation.slots : {}
  const animatedParts = collectAnimatedParts(levels)

  validateLevels(levels, anchors, errors)
  validateAnimationSlots(slots, anchors, animatedParts, errors, warnings)
  validateStateCoverage(animation.statePriority, slots, errors)
  validateBlockedVariants(animation.blockedVariants, slots, errors)

  if (errors.length > 0) {
    return { ok: false, errors, warnings }
  }

  const stateSlots: RuntimePrefabDescriptor['stateSlots'] = {
    constructing: [],
    blocked: [],
    storage_full: [],
    working: [],
    serving: [],
    idle: [],
    ambient: [],
  }

  for (const [id, slot] of Object.entries(slots as Record<string, GoldAnimationSlotManifest>)) {
    stateSlots[slot.requiredState].push({ id, ...slot })
  }

  const descriptor: RuntimePrefabDescriptor = {
    assetId: building.assetId as string,
    displayName: building.displayName as string,
    version: building.version as string,
    footprint: building.footprint as GoldBuildingManifest['footprint'],
    origin: building.origin as GoldBuildingManifest['origin'],
    bounds: building.bounds as GoldBuildingManifest['bounds'],
    levels: Object.fromEntries(
      Object.entries(levels as Record<string, GoldBuildingLevelManifest>).map(([key, level]) => [
        key,
        {
          key,
          numericLevel: parseLevelNumber(key),
          required: level.required,
          layers: level.spriteLayers.map((layer) => ({ id: layer.key, ...layer })),
          animatedParts: level.animatedParts,
          anchors: level.anchors,
          lod: level.lod,
          collisionProfile: level.collisionProfile,
          occlusionProfile: level.occlusionProfile,
        },
      ]),
    ),
    anchors: Object.fromEntries(
      Object.entries(anchors as GoldBuildingManifest['anchors']).map(([id, anchor]) => [
        id,
        { id, ...anchor },
      ]),
    ),
    collision: building.collision as GoldBuildingManifest['collision'],
    statePriority: animation.statePriority as PrefabAnimationState[],
    stateSlots,
    blockedVariants: animation.blockedVariants as GoldAnimationManifest['blockedVariants'],
    transitions: animation.transitions as GoldAnimationManifest['transitions'],
  }

  return { ok: true, descriptor, warnings }
}

export function resolvePrefabAnimationState(input: PrefabStateInput): PrefabAnimationState {
  if (input.status === 'constructing' || input.status === 'upgrading') return 'constructing'
  if (input.inventoryFull || (input.status === 'blocked' && isStorageFullReason(input.statusReason))) {
    return 'storage_full'
  }
  if (input.status === 'blocked') return 'blocked'
  if (input.status === 'working') return 'working'
  if (input.status === 'serving' || input.status === 'delivering') return 'serving'
  return 'idle'
}

function validateBuildingRoot(building: Partial<GoldBuildingManifest>, errors: string[]): void {
  requireEqual(building.schemaVersion, 'gold-building.v1', 'building.schemaVersion', errors)
  requireString(building.assetId, 'building.assetId', errors)
  requireString(building.displayName, 'building.displayName', errors)
  requireString(building.version, 'building.version', errors)
  requireString(building.sourceBlend, 'building.sourceBlend', errors)
  requireNonEmptyArray(building.footprint, 'building.footprint', errors)
  requireObject(building.footprintMeters, 'building.footprintMeters', errors)
  requireObject(building.origin, 'building.origin', errors)
  requireObject(building.bounds, 'building.bounds', errors)
  requireObject(building.levels, 'building.levels', errors)
  requireObject(building.anchors, 'building.anchors', errors)
  requireObject(building.collision, 'building.collision', errors)
  requireNonEmptyArray(building.collision?.footprint, 'building.collision.footprint', errors)
  requireNonEmptyArray(building.collision?.clickHull, 'building.collision.clickHull', errors)
}

function validateAnimationRoot(animation: Partial<GoldAnimationManifest>, errors: string[]): void {
  requireEqual(animation.schemaVersion, 'gold-animation.v1', 'animation.schemaVersion', errors)
  requireString(animation.assetId, 'animation.assetId', errors)
  requireNonEmptyArray(animation.statePriority, 'animation.statePriority', errors)
  requireObject(animation.slots, 'animation.slots', errors)
  requireObject(animation.blockedVariants, 'animation.blockedVariants', errors)
}

function validateLevels(
  levels: Record<string, unknown>,
  anchors: Record<string, unknown>,
  errors: string[],
): void {
  for (const required of ['L0', 'L1', 'L4', 'L8']) {
    if (!isRecord(levels[required])) {
      errors.push(`building.levels.${required} is required for gold prefab runtime`)
    }
  }

  for (const [levelKey, unknownLevel] of Object.entries(levels)) {
    if (!isRecord(unknownLevel)) {
      errors.push(`building.levels.${levelKey} must be an object`)
      continue
    }
    const level = unknownLevel as Partial<GoldBuildingLevelManifest>
    requireNonEmptyArray(level.spriteLayers, `building.levels.${levelKey}.spriteLayers`, errors)
    requireArray(level.animatedParts, `building.levels.${levelKey}.animatedParts`, errors)
    requireNonEmptyArray(level.anchors, `building.levels.${levelKey}.anchors`, errors)
    requireString(level.collisionProfile, `building.levels.${levelKey}.collisionProfile`, errors)
    requireString(level.occlusionProfile, `building.levels.${levelKey}.occlusionProfile`, errors)

    for (const anchorId of level.anchors ?? []) {
      if (!Object.hasOwn(anchors, anchorId)) {
        errors.push(`building.levels.${levelKey}.anchors references missing anchor '${anchorId}'`)
      }
    }

    for (const [index, layer] of (level.spriteLayers ?? []).entries()) {
      const path = `building.levels.${levelKey}.spriteLayers[${index}]`
      requireString(layer.key, `${path}.key`, errors)
      requireString(layer.atlas, `${path}.atlas`, errors)
      requireString(layer.zBand, `${path}.zBand`, errors)
      requireObject(layer.pivotPx, `${path}.pivotPx`, errors)
    }

    for (const lodKey of LOD_KEYS) {
      const lod = level.lod?.[lodKey]
      if (!lod) {
        errors.push(`building.levels.${levelKey}.lod.${lodKey} is required`)
        continue
      }
      requireString(lod.atlas, `building.levels.${levelKey}.lod.${lodKey}.atlas`, errors)
      requireNumber(lod.maxDrawCalls, `building.levels.${levelKey}.lod.${lodKey}.maxDrawCalls`, errors)
      requireNumber(lod.maxTextureMB, `building.levels.${levelKey}.lod.${lodKey}.maxTextureMB`, errors)
    }
  }
}

function validateAnimationSlots(
  slots: Record<string, unknown>,
  anchors: Record<string, unknown>,
  animatedParts: ReadonlySet<string>,
  errors: string[],
  warnings: string[],
): void {
  for (const [slotId, unknownSlot] of Object.entries(slots)) {
    if (!isRecord(unknownSlot)) {
      errors.push(`animation.slots.${slotId} must be an object`)
      continue
    }
    const slot = unknownSlot as Partial<GoldAnimationSlotManifest>
    requireString(slot.requiredState, `animation.slots.${slotId}.requiredState`, errors)
    requireString(slot.clip, `animation.slots.${slotId}.clip`, errors)
    requireString(slot.technique, `animation.slots.${slotId}.technique`, errors)
    requireString(slot.playbackRateSource, `animation.slots.${slotId}.playbackRateSource`, errors)
    requireArray(slot.anchors, `animation.slots.${slotId}.anchors`, errors)
    requireArray(slot.parts, `animation.slots.${slotId}.parts`, errors)
    requireObject(slot.lodPolicy, `animation.slots.${slotId}.lodPolicy`, errors)

    for (const anchorId of slot.anchors ?? []) {
      if (!Object.hasOwn(anchors, anchorId)) {
        errors.push(`animation.slots.${slotId}.anchors references missing anchor '${anchorId}'`)
      }
    }

    for (const partId of slot.parts ?? []) {
      if (!animatedParts.has(partId)) {
        errors.push(`animation.slots.${slotId}.parts references missing animated part '${partId}'`)
      }
    }

    for (const lodKey of LOD_KEYS) {
      if (!slot.lodPolicy?.[lodKey]) {
        errors.push(`animation.slots.${slotId}.lodPolicy.${lodKey} is required`)
      }
    }

    if (
      slot.requiredState === 'working' &&
      slotId.startsWith('production') &&
      slot.playbackRateSource &&
      !MAIN_WORKING_PLAYBACK.has(slot.playbackRateSource)
    ) {
      errors.push(
        `animation.slots.${slotId}.playbackRateSource '${slot.playbackRateSource}' cannot drive working production`,
      )
    }

    if (slot.requiredState === 'ambient' && slot.playbackRateSource === 'productionProgress') {
      warnings.push(`animation.slots.${slotId} is ambient but uses productionProgress`)
    }
  }
}

function validateStateCoverage(
  statePriority: unknown,
  slots: Record<string, unknown>,
  errors: string[],
): void {
  if (Array.isArray(statePriority)) {
    for (const state of PREFAB_STATE_PRIORITY) {
      if (!statePriority.includes(state)) {
        errors.push(`animation.statePriority missing '${state}'`)
      }
    }
  }

  const states = new Set(
    Object.values(slots)
      .filter(isRecord)
      .map((slot) => slot.requiredState),
  )
  for (const state of PREFAB_REQUIRED_STATES) {
    if (!states.has(state)) {
      errors.push(`animation.slots missing required state coverage '${state}'`)
    }
  }

  const storageFullSlots = Object.entries(slots).filter(([, slot]) => {
    return isRecord(slot) && slot.requiredState === 'storage_full'
  })
  if (storageFullSlots.length === 0) {
    errors.push(`animation.slots must include an independent 'storage_full' visual slot`)
  } else if (storageFullSlots.every(([, slot]) => isRecord(slot) && slot.technique === 'none')) {
    errors.push(`animation.slots storage_full cannot be only a generic/no-op blocked indicator`)
  }
}

function validateBlockedVariants(
  blockedVariants: unknown,
  slots: Record<string, unknown>,
  errors: string[],
): void {
  if (!isRecord(blockedVariants)) return

  for (const [reason, variant] of Object.entries(blockedVariants)) {
    if (!isRecord(variant)) {
      errors.push(`animation.blockedVariants.${reason} must be an object`)
      continue
    }
    if (!Object.hasOwn(slots, variant.visualSlot)) {
      errors.push(`animation.blockedVariants.${reason}.visualSlot references missing slot '${variant.visualSlot}'`)
    }
    requireString(variant.tooltipKey, `animation.blockedVariants.${reason}.tooltipKey`, errors)
  }
}

function collectAnimatedParts(levels: Record<string, unknown>): Set<string> {
  const parts = new Set<string>()
  for (const level of Object.values(levels)) {
    if (!isRecord(level) || !Array.isArray(level.animatedParts)) continue
    for (const part of level.animatedParts) {
      if (typeof part === 'string') parts.add(part)
    }
  }
  return parts
}

function parseLevelNumber(levelKey: string): number {
  const match = /^L(\d+)$/.exec(levelKey)
  return match ? Number(match[1]) : Number.NaN
}

function isStorageFullReason(reason: string | undefined): boolean {
  if (!reason) return false
  return STORAGE_FULL_REASONS.has(reason) || reason.includes('storage-full') || reason.includes('output-full')
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requireEqual(value: unknown, expected: string, path: string, errors: string[]): void {
  if (value !== expected) errors.push(`${path} must be '${expected}'`)
}

function requireString(value: unknown, path: string, errors: string[]): void {
  if (typeof value !== 'string' || value.length === 0) errors.push(`${path} must be a non-empty string`)
}

function requireNumber(value: unknown, path: string, errors: string[]): void {
  if (typeof value !== 'number' || !Number.isFinite(value)) errors.push(`${path} must be a finite number`)
}

function requireObject(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) errors.push(`${path} must be an object`)
}

function requireArray(value: unknown, path: string, errors: string[]): void {
  if (!Array.isArray(value)) errors.push(`${path} must be an array`)
}

function requireNonEmptyArray(value: unknown, path: string, errors: string[]): void {
  if (!Array.isArray(value) || value.length === 0) errors.push(`${path} must be a non-empty array`)
}
