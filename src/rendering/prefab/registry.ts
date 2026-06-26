import type {
  PrefabAnimationSlotDescriptor,
  PrefabAnimationState,
  PrefabBuildingStatus,
  PrefabLevelDescriptor,
  RuntimePrefabDescriptor,
} from './types'
import { resolvePrefabAnimationState } from './parser'

export interface PrefabBuildingResolveInput {
  assetId: string
  level: number
  status: PrefabBuildingStatus
  statusReason?: string
  productionProgress?: number
  inventoryFull?: boolean
}

export interface ResolvedPrefabBuilding {
  assetId: string
  descriptor: RuntimePrefabDescriptor
  levelKey: string
  level: PrefabLevelDescriptor
  state: PrefabAnimationState
  slots: PrefabAnimationSlotDescriptor[]
}

export class PrefabRuntimeRegistry {
  private readonly descriptors = new Map<string, RuntimePrefabDescriptor>()

  constructor(descriptors: readonly RuntimePrefabDescriptor[] = []) {
    for (const descriptor of descriptors) this.register(descriptor)
  }

  register(descriptor: RuntimePrefabDescriptor): void {
    this.descriptors.set(descriptor.assetId, descriptor)
  }

  get(assetId: string): RuntimePrefabDescriptor | undefined {
    return this.descriptors.get(assetId)
  }

  has(assetId: string): boolean {
    return this.descriptors.has(assetId)
  }

  resolveBuilding(input: Readonly<PrefabBuildingResolveInput>): ResolvedPrefabBuilding | undefined {
    const descriptor = this.get(input.assetId)
    if (!descriptor) return undefined

    const level = resolveNearestLevel(descriptor, input.level)
    if (!level) return undefined

    const state = resolvePrefabAnimationState(input)
    return {
      assetId: descriptor.assetId,
      descriptor,
      levelKey: level.key,
      level,
      state,
      slots: descriptor.stateSlots[state],
    }
  }
}

function resolveNearestLevel(
  descriptor: Readonly<RuntimePrefabDescriptor>,
  requestedLevel: number,
): PrefabLevelDescriptor | undefined {
  const levels = Object.values(descriptor.levels)
    .filter((level) => Number.isFinite(level.numericLevel))
    .sort((left, right) => left.numericLevel - right.numericLevel)
  if (levels.length === 0) return undefined

  let best = levels[0]
  for (const level of levels) {
    if (level.numericLevel > requestedLevel) break
    best = level
  }
  return best
}
