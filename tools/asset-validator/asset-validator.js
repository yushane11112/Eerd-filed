#!/usr/bin/env node
/**
 * Minimal gold-slice building/animation manifest validator for Little Ear Island.
 *
 * Scope:
 * - Pure Node.js ESM, no network and no npm package dependency.
 * - Validates the manifest gates that can be checked from JSON alone.
 * - Intentionally does not inspect Blender scenes, atlas image files, or Pixi runtime behavior.
 */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export const GOLD_ASSET_IDS = [
  'main-homes',
  'windfield-rice',
  'main-granary',
  'main-eatery',
  'main-kiln',
  'main-pier',
];

export const REQUIRED_LEVELS = ['L0', 'L1', 'L4', 'L8'];
export const REQUIRED_ALL_LEVELS = ['L0', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8'];

export const REQUIRED_VISUAL_IDENTITY_FIELDS = [
  'era',
  'buildingClass',
  'silhouetteFamily',
  'functionalSignature',
  'materialPalette',
];

export const REQUIRED_STRUCTURAL_MILESTONES = ['L1', 'L3', 'L5', 'L7'];

export const REQUIRED_DCC_COLLECTIONS = [
  'COL_ANIM',
  'COL_COLLISION',
  'COL_ANCHOR',
];

export const REQUIRED_LAYER_KEYS = [
  'shadow',
  'ground/foundation',
  'body_back',
  'production_static',
  'production_dynamic',
  'agent_interaction',
  'body_front/foreground_occluder',
  'night_lights',
  'weather_overlay',
  'vfx',
  'ui_anchor',
];

export const REQUIRED_ANCHOR_PATTERNS = [
  /^origin$/,
  /^entrance_/,
  /^worker_/,
  /^input_/,
  /^output_/,
  /^service_/,
  /^queue_/,
  /^ui_status$/,
  /^ui_selection$/,
  /^audio_/,
  /^construction_/,
  /^occlusion_polygon$/,
  /^collision_obstacle$/,
  /^click_hull$/,
];

export const ASSET_ANCHOR_PATTERNS = {
  'main-homes': [/^home_door_/, /^window_light_/, /^cooking_smoke_/, /^return_home_/],
  'windfield-rice': [/^irrigation_in_/, /^irrigation_out_/, /^field_work_/, /^crop_stage_region_/],
  'main-granary': [/^grain_chute_/, /^cart_bay_/, /^drying_area_/, /^bird_perch_/],
  'main-eatery': [/^stove_/, /^serving_window_/, /^table_/, /^takeaway_/, /^smoke_/],
  'main-kiln': [/^kiln_fire_/, /^smoke_flue_/, /^clay_input_/, /^ceramic_output_/, /^fire_safety_gap$/],
  'main-pier': [/^berth_/, /^water_route_/, /^gangplank_/, /^winch_/, /^cargo_lane_/],
};

export const REQUIRED_ANIMATION_STATES = [
  'constructing',
  'working',
  'blocked',
  'serving',
  'storage_full',
  'idle',
];

export const EXPECTED_STATE_PRIORITY = [
  'constructing',
  'blocked',
  'storage_full',
  'working',
  'serving',
  'idle',
  'ambient',
];

export const REQUIRED_ANIMATION_SLOTS = [
  'base',
  'idle-detail',
  'staff-entry',
  'input-receive',
  'production-primary',
  'production-secondary',
  'output-ready',
  'output-dispatch',
  'service',
  'blocked',
  'storage-full',
  'construction',
  'night',
  'weather',
  'ui-feedback',
];

export const TRIANGLE_BUDGET_LOD0 = {
  'main-homes': 75000,
  'windfield-rice': 70000,
  'main-granary': 60000,
  'main-eatery': 45000,
  'main-kiln': 100000,
  'main-pier': 110000,
};

export const PIXI_BUDGETS = {
  maxLayers: 10,
  maxEmitters: 4,
  lod: {
    LOD0: { maxDrawCalls: 10, maxTextureMB: 12 },
    LOD1: { maxDrawCalls: 6, maxTextureMB: 6 },
    LOD2: { maxDrawCalls: 3, maxTextureMB: 2 },
  },
};

export const ANIMATION_RUNTIME_BUDGETS = {
  maxSlots: 20,
  maxPartsPerSlot: 4,
  maxAnchorsPerSlot: 8,
  maxPartTransformSlots: 4,
  maxParticleSlots: 2,
};

const FACING_VALUES = new Set([0, 1, 2, 3, 4, 5, 6, 7]);
const LOD_KEYS = ['LOD0', 'LOD1', 'LOD2', 'LOD3'];

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function hasPoint(value, dims) {
  return isObject(value) && dims.every((key) => isNumber(value[key]));
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeLevelKey(levelKey) {
  if (REQUIRED_LEVELS.includes(levelKey)) return levelKey;
  const match = /^L0?([0-8])$/.exec(levelKey);
  return match ? `L${Number(match[1])}` : levelKey;
}

function normalizedLevelEntries(levels) {
  return Object.entries(isObject(levels) ? levels : {}).map(([key, value]) => [
    normalizeLevelKey(key),
    key,
    value,
  ]);
}

function hasPattern(names, pattern) {
  return names.some((name) => pattern.test(name));
}

function push(issueList, code, message, path, severity = 'error') {
  issueList.push({ severity, code, path, message });
}

function validateTopLevel(building, issues) {
  if (!isObject(building)) {
    push(issues, 'building.not_object', 'Building manifest must be a JSON object.', 'building');
    return;
  }

  for (const field of ['schemaVersion', 'assetId', 'version', 'sourceBlend']) {
    if (!building[field]) {
      push(issues, 'building.required_field', `Missing required field: ${field}.`, `building.${field}`);
    }
  }

  if (building.schemaVersion !== 'gold-building.v1') {
    push(issues, 'building.schema_version', 'schemaVersion must be gold-building.v1.', 'building.schemaVersion');
  }

  if (!GOLD_ASSET_IDS.includes(building.assetId)) {
    push(issues, 'building.asset_id', `assetId must be one of: ${GOLD_ASSET_IDS.join(', ')}.`, 'building.assetId');
  }

  if (building.buildBatch !== 'gold-slice') {
    push(issues, 'building.build_batch', 'buildBatch must be gold-slice.', 'building.buildBatch');
  }

  if (!Array.isArray(building.footprint) || building.footprint.length === 0) {
    push(issues, 'building.footprint', 'footprint must contain at least one tile point.', 'building.footprint');
  }

  if (!hasPoint(building.origin, ['x', 'y', 'z'])) {
    push(issues, 'building.origin', 'origin must contain numeric x, y, z.', 'building.origin');
  }
}

function validateLevels(building, issues, options = {}) {
  const entries = normalizedLevelEntries(building.levels);
  const levelsByNormalizedKey = new Map(entries.map(([normalized, original, value]) => [normalized, { original, value }]));

  const requiredLevels = options.requireAllLevels ? REQUIRED_ALL_LEVELS : REQUIRED_LEVELS;
  const missingCode = options.requireAllLevels ? 'level.missing_required_all_levels' : 'level.missing_required';

  for (const level of requiredLevels) {
    const entry = levelsByNormalizedKey.get(level);
    if (!entry) {
      const message = options.requireAllLevels
        ? `Missing required building level ${level}; strict all-level mode requires L0-L8.`
        : `Missing required gold level ${level}.`;
      push(issues, missingCode, message, `building.levels.${level}`);
      continue;
    }
    if (entry.value?.required !== true) {
      push(issues, 'level.not_marked_required', `${level} must be marked required: true.`, `building.levels.${entry.original}.required`);
    }
  }

  for (const [normalizedLevel, originalLevel, level] of entries) {
    if (!isObject(level)) {
      push(issues, 'level.not_object', `${originalLevel} must be an object.`, `building.levels.${originalLevel}`);
      continue;
    }

    const collections = new Set(asArray(level.dccCollections));
    const expectedLevelCollection = `COL_L${normalizedLevel.replace('L', '').padStart(2, '0')}`;
    if (!collections.has(expectedLevelCollection)) {
      push(
        issues,
        'level.collection.missing_level',
        `${originalLevel} dccCollections must include ${expectedLevelCollection}.`,
        `building.levels.${originalLevel}.dccCollections`,
      );
    }
    for (const collection of REQUIRED_DCC_COLLECTIONS) {
      if (!collections.has(collection)) {
        push(
          issues,
          'level.collection.missing_required',
          `${originalLevel} dccCollections must include ${collection}.`,
          `building.levels.${originalLevel}.dccCollections`,
        );
      }
    }

    validateSpriteLayers(level, originalLevel, issues);
    validateLevelAnchors(level, originalLevel, building, issues);
    validateLod(level, originalLevel, issues);

    if (!level.collisionProfile) {
      push(issues, 'level.collision_profile', `${originalLevel} missing collisionProfile.`, `building.levels.${originalLevel}.collisionProfile`);
    }
    if (!level.occlusionProfile) {
      push(issues, 'level.occlusion_profile', `${originalLevel} missing occlusionProfile.`, `building.levels.${originalLevel}.occlusionProfile`);
    }
  }
}

function validateVisualIdentity(building, issues, options = {}) {
  const identity = building.visualIdentity;
  if (!isObject(identity)) {
    push(
      issues,
      'visual_identity.missing',
      'visualIdentity is required for production assets; it must explain the building-specific silhouette, function and material language.',
      'building.visualIdentity',
    );
    return;
  }

  for (const field of REQUIRED_VISUAL_IDENTITY_FIELDS) {
    if (typeof identity[field] !== 'string' || identity[field].trim().length === 0) {
      push(issues, 'visual_identity.required_field', `visualIdentity.${field} must be a non-empty string.`, `building.visualIdentity.${field}`);
    }
  }

  const levelArc = identity.levelArc;
  if (!isObject(levelArc)) {
    push(issues, 'visual_identity.level_arc', 'visualIdentity.levelArc must declare the visual progression for every production level.', 'building.visualIdentity.levelArc');
    return;
  }

  const requiredLevels = options.requireAllLevels ? REQUIRED_ALL_LEVELS : REQUIRED_LEVELS;
  const silhouettes = [];
  for (const levelKey of requiredLevels) {
    const level = levelArc[levelKey];
    const levelPath = `building.visualIdentity.levelArc.${levelKey}`;
    if (!isObject(level)) {
      push(issues, 'visual_identity.level.missing', `${levelKey} must declare a visual progression record.`, levelPath);
      continue;
    }
    for (const field of ['stage', 'silhouette', 'functionalRead', 'environment']) {
      if (typeof level[field] !== 'string' || level[field].trim().length === 0) {
        push(issues, 'visual_identity.level.required_field', `${levelKey}.${field} must be a non-empty string.`, `${levelPath}.${field}`);
      }
    }
    if (!Array.isArray(level.activeElements) || level.activeElements.length === 0) {
      push(issues, 'visual_identity.level.active_elements', `${levelKey}.activeElements must list at least one visible element.`, `${levelPath}.activeElements`);
    }
    if (typeof level.structuralMilestone !== 'boolean') {
      push(issues, 'visual_identity.level.structural_milestone', `${levelKey}.structuralMilestone must be boolean.`, `${levelPath}.structuralMilestone`);
    }
    if (typeof level.silhouette === 'string') silhouettes.push(level.silhouette);
  }

  for (const milestone of REQUIRED_STRUCTURAL_MILESTONES) {
    if (levelArc[milestone]?.structuralMilestone !== true) {
      push(issues, 'visual_identity.milestone.missing', `${milestone} must be marked as a structural silhouette milestone.`, `building.visualIdentity.levelArc.${milestone}.structuralMilestone`);
    }
  }

  if (options.requireAllLevels) {
    if (levelArc.L0?.stage !== 'ruin') {
      push(issues, 'visual_identity.stage.l0', 'L0 must read as the original ruin/foundation state.', 'building.visualIdentity.levelArc.L0.stage');
    }
    if (levelArc.L8?.stage !== 'thriving') {
      push(issues, 'visual_identity.stage.l8', 'L8 must read as a thriving, fully operating building state.', 'building.visualIdentity.levelArc.L8.stage');
    }
    if (silhouettes.length >= 2 && silhouettes[0] === silhouettes[silhouettes.length - 1]) {
      push(issues, 'visual_identity.silhouette.no_end_change', 'L0 and L8 cannot share the same silhouette signature.', 'building.visualIdentity.levelArc');
    }
    if (new Set(silhouettes).size < 3) {
      push(issues, 'visual_identity.silhouette.too_few_stages', 'L0-L8 must contain at least three distinct silhouette signatures.', 'building.visualIdentity.levelArc');
    }
  }
}

export function validateVisualIdentitySet(buildings) {
  const issues = [];
  const fields = ['buildingClass', 'silhouetteFamily', 'functionalSignature'];
  for (const field of fields) {
    const seen = new Map();
    for (const building of buildings ?? []) {
      const value = building?.visualIdentity?.[field];
      if (typeof value !== 'string' || value.trim().length === 0) continue;
      const previous = seen.get(value);
      if (previous) {
        push(
          issues,
          `visual_identity.cross_asset_duplicate.${field}`,
          `${field} "${value}" is shared by ${previous} and ${building.assetId}; each production building needs an independent visual read.`,
          `buildings.${building.assetId}.visualIdentity.${field}`,
        );
      } else {
        seen.set(value, building.assetId);
      }
    }
  }
  return issues;
}

function validateSpriteLayers(level, levelKey, issues) {
  const layers = asArray(level.spriteLayers);
  const layerKeys = new Set(layers.map((layer) => layer?.key));

  for (const requiredKey of REQUIRED_LAYER_KEYS) {
    if (!layerKeys.has(requiredKey)) {
      push(
        issues,
        'layer.missing_required',
        `${levelKey} must declare layer "${requiredKey}" or explicitly provide a none entry.`,
        `building.levels.${levelKey}.spriteLayers`,
      );
    }
  }

  for (const [index, layer] of layers.entries()) {
    const path = `building.levels.${levelKey}.spriteLayers[${index}]`;
    if (!isObject(layer)) {
      push(issues, 'layer.not_object', `${levelKey} sprite layer ${index} must be an object.`, path);
      continue;
    }

    if (!layer.key) push(issues, 'layer.key', 'sprite layer missing key.', `${path}.key`);

    if (layer.none === true) continue;

    if (!layer.atlas) push(issues, 'layer.atlas', `Layer ${layer.key ?? index} missing atlas.`, `${path}.atlas`);
    if (!hasPoint(layer.pivotPx, ['x', 'y'])) {
      push(issues, 'layer.pivot_px', `Layer ${layer.key ?? index} missing numeric pivotPx x/y.`, `${path}.pivotPx`);
    }
    if (layer.premultipliedAlpha !== true) {
      push(issues, 'layer.premultiplied_alpha', `Layer ${layer.key ?? index} must set premultipliedAlpha: true.`, `${path}.premultipliedAlpha`);
    }
  }
}

function validateLevelAnchors(level, levelKey, building, issues) {
  const names = asArray(level.anchors);
  for (const anchorName of names) {
    if (!building.anchors?.[anchorName]) {
      push(
        issues,
        'level.anchor.undefined',
        `${levelKey} references undefined anchor "${anchorName}".`,
        `building.levels.${levelKey}.anchors`,
      );
    }
  }
}

function validateLod(level, levelKey, issues) {
  if (!isObject(level.lod)) {
    push(issues, 'lod.missing', `${levelKey} missing lod configuration.`, `building.levels.${levelKey}.lod`);
    return;
  }

  for (const lodKey of LOD_KEYS) {
    const lod = level.lod[lodKey];
    if (!isObject(lod)) {
      push(issues, 'lod.missing_level', `${levelKey} missing ${lodKey}.`, `building.levels.${levelKey}.lod.${lodKey}`);
      continue;
    }
    if (!lod.atlas) push(issues, 'lod.atlas', `${levelKey} ${lodKey} missing atlas.`, `building.levels.${levelKey}.lod.${lodKey}.atlas`);

    if (lodKey !== 'LOD3') {
      const budget = PIXI_BUDGETS.lod[lodKey];
      if (!isNumber(lod.maxDrawCalls)) {
        push(issues, 'lod.draw_calls.missing', `${levelKey} ${lodKey} missing maxDrawCalls.`, `building.levels.${levelKey}.lod.${lodKey}.maxDrawCalls`);
      } else if (lod.maxDrawCalls > budget.maxDrawCalls) {
        push(issues, 'lod.draw_calls.over_budget', `${levelKey} ${lodKey} maxDrawCalls ${lod.maxDrawCalls} exceeds budget ${budget.maxDrawCalls}.`, `building.levels.${levelKey}.lod.${lodKey}.maxDrawCalls`);
      }

      if (!isNumber(lod.maxTextureMB)) {
        push(issues, 'lod.texture_mb.missing', `${levelKey} ${lodKey} missing maxTextureMB.`, `building.levels.${levelKey}.lod.${lodKey}.maxTextureMB`);
      } else if (lod.maxTextureMB > budget.maxTextureMB) {
        push(issues, 'lod.texture_mb.over_budget', `${levelKey} ${lodKey} maxTextureMB ${lod.maxTextureMB} exceeds budget ${budget.maxTextureMB}.`, `building.levels.${levelKey}.lod.${lodKey}.maxTextureMB`);
      }
    }
  }
}

function validateAnchors(building, issues) {
  const anchors = isObject(building.anchors) ? building.anchors : {};
  const names = Object.keys(anchors);

  if (names.length === 0) {
    push(issues, 'anchor.none', 'anchors must not be empty.', 'building.anchors');
  }

  for (const pattern of REQUIRED_ANCHOR_PATTERNS) {
    if (!hasPattern(names, pattern)) {
      push(issues, 'anchor.missing_common', `Missing required common anchor matching ${pattern}.`, 'building.anchors');
    }
  }

  for (const pattern of ASSET_ANCHOR_PATTERNS[building.assetId] ?? []) {
    if (!hasPattern(names, pattern)) {
      push(issues, 'anchor.missing_asset_specific', `Missing ${building.assetId} anchor matching ${pattern}.`, 'building.anchors');
    }
  }

  for (const [name, anchor] of Object.entries(anchors)) {
    const path = `building.anchors.${name}`;
    if (!isObject(anchor)) {
      push(issues, 'anchor.not_object', `Anchor ${name} must be an object.`, path);
      continue;
    }
    if (!hasPoint(anchor.localMeters, ['x', 'y', 'z'])) {
      push(issues, 'anchor.local_meters', `Anchor ${name} missing numeric localMeters x/y/z.`, `${path}.localMeters`);
    }
    if (!hasPoint(anchor.localPx, ['x', 'y'])) {
      push(issues, 'anchor.local_px', `Anchor ${name} missing numeric localPx x/y.`, `${path}.localPx`);
    }
    if (!FACING_VALUES.has(anchor.facing)) {
      push(issues, 'anchor.facing', `Anchor ${name} facing must be an integer 0..7.`, `${path}.facing`);
    }
  }
}

function validateCollision(building, issues) {
  const collision = building.collision;
  if (!isObject(collision)) {
    push(issues, 'collision.missing', 'collision must be present.', 'building.collision');
    return;
  }
  for (const field of ['footprint', 'obstacles', 'occluders', 'clickHull']) {
    if (!Array.isArray(collision[field]) || collision[field].length === 0) {
      push(issues, 'collision.empty', `collision.${field} must not be empty.`, `building.collision.${field}`);
    }
  }
}

function validateBudgets(building, issues) {
  const validation = building.validation;
  if (!isObject(validation)) {
    push(issues, 'validation.missing', 'validation budget block must be present.', 'building.validation');
    return;
  }

  const assetBudget = TRIANGLE_BUDGET_LOD0[building.assetId];
  if (!isNumber(validation.triangleBudgetLOD0)) {
    push(issues, 'budget.triangles.missing', 'validation.triangleBudgetLOD0 must be numeric.', 'building.validation.triangleBudgetLOD0');
  } else if (assetBudget && validation.triangleBudgetLOD0 > assetBudget) {
    push(issues, 'budget.triangles.over_budget', `${building.assetId} triangleBudgetLOD0 ${validation.triangleBudgetLOD0} exceeds budget ${assetBudget}.`, 'building.validation.triangleBudgetLOD0');
  }

  if (!isNumber(validation.maxLayers)) {
    push(issues, 'budget.layers.missing', 'validation.maxLayers must be numeric.', 'building.validation.maxLayers');
  } else if (validation.maxLayers > PIXI_BUDGETS.maxLayers) {
    push(issues, 'budget.layers.over_budget', `maxLayers ${validation.maxLayers} exceeds budget ${PIXI_BUDGETS.maxLayers}.`, 'building.validation.maxLayers');
  }

  if (!isNumber(validation.maxEmitters)) {
    push(issues, 'budget.emitters.missing', 'validation.maxEmitters must be numeric.', 'building.validation.maxEmitters');
  } else if (validation.maxEmitters > PIXI_BUDGETS.maxEmitters) {
    push(issues, 'budget.emitters.over_budget', `maxEmitters ${validation.maxEmitters} exceeds budget ${PIXI_BUDGETS.maxEmitters}.`, 'building.validation.maxEmitters');
  }
}

function validateAnimation(animation, building, issues) {
  if (!isObject(animation)) {
    push(issues, 'animation.not_object', 'Animation manifest must be a JSON object.', 'animation');
    return;
  }

  if (animation.schemaVersion !== 'gold-animation.v1') {
    push(issues, 'animation.schema_version', 'schemaVersion must be gold-animation.v1.', 'animation.schemaVersion');
  }

  if (animation.assetId !== building.assetId) {
    push(issues, 'animation.asset_id_mismatch', 'Animation assetId must match building assetId.', 'animation.assetId');
  }

  if (JSON.stringify(animation.statePriority) !== JSON.stringify(EXPECTED_STATE_PRIORITY)) {
    push(issues, 'animation.state_priority', `statePriority must be ${EXPECTED_STATE_PRIORITY.join(' > ')}.`, 'animation.statePriority');
  }

  const slots = isObject(animation.slots) ? animation.slots : {};
  const slotNames = Object.keys(slots);
  if (slotNames.length === 0) {
    push(issues, 'animation.slots.empty', 'animation slots must not be empty.', 'animation.slots');
  }
  if (slotNames.length > ANIMATION_RUNTIME_BUDGETS.maxSlots) {
    push(
      issues,
      'animation.budget.slots',
      `Animation slot count ${slotNames.length} exceeds runtime budget ${ANIMATION_RUNTIME_BUDGETS.maxSlots}.`,
      'animation.slots',
    );
  }
  const partTransformSlots = Object.values(slots).filter((slot) => slot?.technique === 'part-transform').length;
  if (partTransformSlots > ANIMATION_RUNTIME_BUDGETS.maxPartTransformSlots) {
    push(
      issues,
      'animation.budget.part_transform_slots',
      `part-transform slot count ${partTransformSlots} exceeds runtime budget ${ANIMATION_RUNTIME_BUDGETS.maxPartTransformSlots}.`,
      'animation.slots',
    );
  }
  const particleSlots = Object.values(slots).filter((slot) => slot?.technique === 'particle').length;
  if (particleSlots > ANIMATION_RUNTIME_BUDGETS.maxParticleSlots) {
    push(
      issues,
      'animation.budget.particle_slots',
      `particle slot count ${particleSlots} exceeds runtime budget ${ANIMATION_RUNTIME_BUDGETS.maxParticleSlots}.`,
      'animation.slots',
    );
  }

  for (const slotName of REQUIRED_ANIMATION_SLOTS) {
    if (!slots[slotName]) {
      push(issues, 'animation.slot.missing_required', `Missing required animation slot "${slotName}".`, `animation.slots.${slotName}`);
    }
  }

  const coveredStates = new Set(Object.values(slots).map((slot) => slot?.requiredState));
  for (const state of REQUIRED_ANIMATION_STATES) {
    if (!coveredStates.has(state)) {
      push(issues, 'animation.state.missing_coverage', `No animation slot covers required state "${state}".`, 'animation.slots');
    }
  }

  const storageSlot = slots['storage-full'];
  if (!storageSlot || storageSlot.requiredState !== 'storage_full' || storageSlot.clip === slots.blocked?.clip || storageSlot.technique === 'none') {
    push(
      issues,
      'animation.storage_full.not_independent',
      'storage-full must be an independent visual slot for storage_full, not a generic blocked/no-op slot.',
      'animation.slots.storage-full',
    );
  }

  for (const [slotName, slot] of Object.entries(slots)) {
    validateAnimationSlot(slotName, slot, building, issues);
  }

  if (!isObject(animation.blockedVariants) || Object.keys(animation.blockedVariants).length === 0) {
    push(issues, 'animation.blocked_variants', 'blockedVariants must declare at least one reason-specific visual mapping.', 'animation.blockedVariants');
  }
}

function validateAnimationSlot(slotName, slot, building, issues) {
  const path = `animation.slots.${slotName}`;
  if (!isObject(slot)) {
    push(issues, 'animation.slot.not_object', `Slot ${slotName} must be an object.`, path);
    return;
  }

  if (!slot.requiredState) push(issues, 'animation.slot.required_state', `Slot ${slotName} missing requiredState.`, `${path}.requiredState`);
  if (!slot.clip) push(issues, 'animation.slot.clip', `Slot ${slotName} missing clip.`, `${path}.clip`);
  if (!slot.technique) push(issues, 'animation.slot.technique', `Slot ${slotName} missing technique.`, `${path}.technique`);
  if (!slot.playbackRateSource) push(issues, 'animation.slot.playback_rate', `Slot ${slotName} missing playbackRateSource.`, `${path}.playbackRateSource`);

  const parts = asArray(slot.parts);
  const anchors = asArray(slot.anchors);
  if (parts.length > ANIMATION_RUNTIME_BUDGETS.maxPartsPerSlot) {
    push(
      issues,
      'animation.budget.parts_per_slot',
      `Slot ${slotName} has ${parts.length} parts; runtime budget is ${ANIMATION_RUNTIME_BUDGETS.maxPartsPerSlot}.`,
      `${path}.parts`,
    );
  }
  if (anchors.length > ANIMATION_RUNTIME_BUDGETS.maxAnchorsPerSlot) {
    push(
      issues,
      'animation.budget.anchors_per_slot',
      `Slot ${slotName} has ${anchors.length} anchors; runtime budget is ${ANIMATION_RUNTIME_BUDGETS.maxAnchorsPerSlot}.`,
      `${path}.anchors`,
    );
  }

  if (slotName === 'production-primary' && slot.requiredState === 'working' && slot.playbackRateSource === 'sceneTime') {
    push(
      issues,
      'animation.slot.progress_mismatch',
      'production-primary cannot use sceneTime for working; it must follow productionProgress.',
      `${path}.playbackRateSource`,
    );
  }

  if (slot.requiredState === 'constructing' && slot.playbackRateSource === 'sceneTime') {
    push(
      issues,
      'animation.slot.construction_progress_mismatch',
      'constructing slots cannot use pure sceneTime; they must follow constructionProgress or fixed/event data.',
      `${path}.playbackRateSource`,
    );
  }

  for (const lodKey of LOD_KEYS) {
    if (!slot.lodPolicy?.[lodKey]) {
      push(issues, 'animation.slot.lod_policy', `Slot ${slotName} missing lodPolicy.${lodKey}.`, `${path}.lodPolicy.${lodKey}`);
    }
  }

  if (slot.technique === 'particle') {
    if (slot.lodPolicy?.LOD3 !== 'off') {
      push(issues, 'animation.budget.particle_lod3', `Particle slot ${slotName} must be off at LOD3.`, `${path}.lodPolicy.LOD3`);
    }
    if (slot.lodPolicy?.LOD2 === 'full') {
      push(issues, 'animation.budget.particle_lod2', `Particle slot ${slotName} cannot be full at LOD2.`, `${path}.lodPolicy.LOD2`);
    }
  }

  for (const anchorName of asArray(slot.anchors)) {
    if (!building.anchors?.[anchorName]) {
      push(issues, 'animation.slot.anchor.undefined', `Slot ${slotName} references undefined anchor "${anchorName}".`, `${path}.anchors`);
    }
  }

  for (const part of asArray(slot.parts)) {
    if (!isKnownAnimatedPart(part, building)) {
      push(issues, 'animation.slot.part.undefined', `Slot ${slotName} references part "${part}" that is not listed in any level animatedParts.`, `${path}.parts`);
    }
  }
}

function isKnownAnimatedPart(part, building) {
  const levels = isObject(building.levels) ? Object.values(building.levels) : [];
  return levels.some((level) => asArray(level?.animatedParts).includes(part));
}

export function validateGoldManifests({ building, animation }, options = {}) {
  const issues = [];
  validateTopLevel(building, issues);
  if (isObject(building)) {
    validateLevels(building, issues, options);
    validateAnchors(building, issues);
    validateCollision(building, issues);
    validateBudgets(building, issues);
    if (options.requireVisualIdentity) validateVisualIdentity(building, issues, options);
  }
  validateAnimation(animation, building ?? {}, issues);

  const errors = issues.filter((issue) => issue.severity === 'error');
  const warnings = issues.filter((issue) => issue.severity === 'warning');
  return {
    ok: errors.length === 0,
    errorCount: errors.length,
    warningCount: warnings.length,
    issues,
  };
}

async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    throw new Error(`Failed to read JSON ${path}: ${error.message}`);
  }
}

function printUsage() {
  console.error(
    'Usage: node tools/asset-validator/asset-validator.js --building <building-manifest.json> --animation <animation-manifest.json> [--json] [--require-all-levels] [--require-visual-identity]',
  );
}

function parseArgs(argv) {
  const args = { json: false, requireAllLevels: false, requireVisualIdentity: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--building') args.buildingPath = argv[++index];
    else if (arg === '--animation') args.animationPath = argv[++index];
    else if (arg === '--json') args.json = true;
    else if (arg === '--require-all-levels') args.requireAllLevels = true;
    else if (arg === '--require-visual-identity') args.requireVisualIdentity = true;
    else if (arg === '--help' || arg === '-h') args.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.buildingPath || !args.animationPath) {
    printUsage();
    process.exit(args.help ? 0 : 2);
  }

  const result = validateGoldManifests({
    building: await readJson(args.buildingPath),
    animation: await readJson(args.animationPath),
  }, { requireAllLevels: args.requireAllLevels });

  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else if (result.ok) {
    console.log(`OK: gold asset manifests passed (${result.warningCount} warnings).`);
  } else {
    console.error(`FAILED: ${result.errorCount} errors, ${result.warningCount} warnings.`);
    for (const issue of result.issues) {
      console.error(`[${issue.severity}] ${issue.code} at ${issue.path}: ${issue.message}`);
    }
  }

  process.exit(result.ok ? 0 : 1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(2);
  });
}
