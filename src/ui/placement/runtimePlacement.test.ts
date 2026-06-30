import { describe, expect, it } from 'vitest'
import { GameRuntime } from '../../integration/GameRuntime'
import { reducePlacement, type PlacementState } from './placementMachine'
import {
  deriveRuntimePlacementPreview,
  runtimePlacementValidator,
} from './runtimePlacement'

describe('runtime placement adapter', () => {
  it('uses the runtime preview as the placement validator and derives visible preview cells', () => {
    const runtime = new GameRuntime()
    runtime.placeRoad({ x: 6, y: 10 })
    runtime.placeRoad({ x: 6, y: 9 })
    runtime.placeRoad({ x: 6, y: 8 })
    const validator = runtimePlacementValidator(runtime)

    let state: PlacementState = { status: 'idle' }
    state = reducePlacement(state, { type: 'select', buildingType: 'house' }, validator)
    state = reducePlacement(state, { type: 'move', anchor: { x: 4, y: 8 } }, validator)
    const validPreview = deriveRuntimePlacementPreview(state, runtime)

    expect(state).toMatchObject({ status: 'placing', validity: 'valid' })
    expect(validPreview).toMatchObject({
      valid: true,
      type: 'house',
      origin: { x: 4, y: 8 },
      cells: [
        { status: 'footprint', position: { x: 4, y: 8 } },
        { status: 'footprint', position: { x: 5, y: 8 } },
        { status: 'footprint', position: { x: 4, y: 9 } },
        { status: 'footprint', position: { x: 5, y: 9 } },
        { status: 'entrance', position: { x: 5, y: 9 } },
      ],
    })

    state = reducePlacement(state, { type: 'move', anchor: { x: 20, y: 18 } }, validator)
    const invalidPreview = deriveRuntimePlacementPreview(state, runtime)

    expect(state).toMatchObject({
      status: 'placing',
      validity: 'invalid',
      reason: '入口必须紧邻道路',
    })
    expect(invalidPreview).toMatchObject({
      valid: false,
      reason: '入口必须紧邻道路',
    })
    expect(invalidPreview?.cells.some((cell) => cell.status === 'blocked' && cell.label === '入口未连路'))
      .toBe(true)
  })

  it('does not derive a preview while idle or before an anchor exists', () => {
    const runtime = new GameRuntime()
    const placingWithoutAnchor: PlacementState = {
      status: 'placing',
      buildingType: 'house',
      anchor: null,
      rotation: 0,
      validity: 'unknown',
    }

    expect(deriveRuntimePlacementPreview({ status: 'idle' }, runtime)).toBeNull()
    expect(deriveRuntimePlacementPreview(placingWithoutAnchor, runtime)).toBeNull()
  })
})
