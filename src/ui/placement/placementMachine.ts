import type { GridPoint } from '../../simulation/contracts'

export type PlacementRotation = 0 | 90 | 180 | 270

export type PlacementState =
  | { status: 'idle' }
  | {
    status: 'placing'
    buildingType: string
    anchor: GridPoint | null
    rotation: PlacementRotation
    validity: 'unknown' | 'valid' | 'invalid'
    reason?: string
  }
  | {
    status: 'confirmed'
    buildingType: string
    anchor: GridPoint
    rotation: PlacementRotation
  }

export interface PlacementValidation {
  valid: boolean
  reason?: string
}

export type PlacementValidator = (
  buildingType: string,
  anchor: GridPoint,
  rotation: PlacementRotation,
) => PlacementValidation

export type PlacementEvent =
  | { type: 'select'; buildingType: string; rotation?: PlacementRotation }
  | { type: 'move'; anchor: GridPoint }
  | { type: 'rotate'; direction?: 'clockwise' | 'counterclockwise' }
  | { type: 'confirm' }
  | { type: 'cancel' }
  | { type: 'resume' }

const rotate = (
  rotation: PlacementRotation,
  direction: 'clockwise' | 'counterclockwise',
): PlacementRotation =>
  ((rotation + (direction === 'clockwise' ? 90 : 270)) % 360) as PlacementRotation

function validate(
  buildingType: string,
  anchor: GridPoint | null,
  rotation: PlacementRotation,
  validator: PlacementValidator,
): Pick<Extract<PlacementState, { status: 'placing' }>, 'validity' | 'reason'> {
  if (!anchor) return { validity: 'unknown' }
  const result = validator(buildingType, anchor, rotation)
  return {
    validity: result.valid ? 'valid' : 'invalid',
    reason: result.valid ? undefined : result.reason,
  }
}

export function reducePlacement(
  state: PlacementState,
  event: PlacementEvent,
  validator: PlacementValidator,
): PlacementState {
  if (event.type === 'select') {
    return {
      status: 'placing',
      buildingType: event.buildingType,
      anchor: null,
      rotation: event.rotation ?? 0,
      validity: 'unknown',
    }
  }
  if (event.type === 'cancel') return { status: 'idle' }
  if (event.type === 'resume' && state.status === 'confirmed') {
    return {
      status: 'placing',
      buildingType: state.buildingType,
      anchor: state.anchor,
      rotation: state.rotation,
      ...validate(state.buildingType, state.anchor, state.rotation, validator),
    }
  }
  if (state.status !== 'placing') return state

  if (event.type === 'move') {
    return {
      ...state,
      anchor: event.anchor,
      ...validate(state.buildingType, event.anchor, state.rotation, validator),
    }
  }
  if (event.type === 'rotate') {
    const rotation = rotate(state.rotation, event.direction ?? 'clockwise')
    return {
      ...state,
      rotation,
      ...validate(state.buildingType, state.anchor, rotation, validator),
    }
  }
  if (event.type === 'confirm' && state.anchor && state.validity === 'valid') {
    return {
      status: 'confirmed',
      buildingType: state.buildingType,
      anchor: state.anchor,
      rotation: state.rotation,
    }
  }
  return state
}

export class PlacementController {
  private state: PlacementState = { status: 'idle' }
  private listeners = new Set<(state: Readonly<PlacementState>) => void>()

  constructor(private readonly validator: PlacementValidator) {}

  getState = (): Readonly<PlacementState> => this.state

  subscribe = (listener: (state: Readonly<PlacementState>) => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  dispatch(event: PlacementEvent): Readonly<PlacementState> {
    const next = reducePlacement(this.state, event, this.validator)
    if (next !== this.state) {
      this.state = next
      this.listeners.forEach((listener) => listener(this.state))
    }
    return this.state
  }
}

