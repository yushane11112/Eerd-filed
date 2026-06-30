import type { BuildingPlacementPreview, GameRuntime } from '../../integration/GameRuntime'
import type { PlacementState, PlacementValidator } from './placementMachine'

export function runtimePlacementValidator(runtime: GameRuntime): PlacementValidator {
  return (buildingType, anchor, rotation) => {
    const preview = runtime.previewBuildingPlacement(buildingType, anchor, rotation)
    return {
      valid: preview.valid,
      reason: preview.reason,
    }
  }
}

export function deriveRuntimePlacementPreview(
  state: Readonly<PlacementState>,
  runtime: GameRuntime,
): BuildingPlacementPreview | null {
  if (state.status !== 'placing' || !state.anchor) return null
  return runtime.previewBuildingPlacement(state.buildingType, state.anchor, state.rotation)
}
