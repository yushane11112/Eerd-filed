import { describe, expect, it, vi } from 'vitest'
import {
  PlacementController,
  reducePlacement,
  type PlacementState,
  type PlacementValidator,
} from './placementMachine'

const validator: PlacementValidator = (_type, anchor) => ({
  valid: anchor.x >= 0 && anchor.y >= 0,
  reason: anchor.x >= 0 && anchor.y >= 0 ? undefined : '超出地图',
})

describe('placement state machine', () => {
  it('selects, previews, rotates and confirms valid placement', () => {
    let state: PlacementState = { status: 'idle' }
    state = reducePlacement(state, { type: 'select', buildingType: 'tea-house' }, validator)
    state = reducePlacement(state, { type: 'move', anchor: { x: 4, y: 7 } }, validator)
    state = reducePlacement(state, { type: 'rotate' }, validator)
    state = reducePlacement(state, { type: 'confirm' }, validator)

    expect(state).toEqual({
      status: 'confirmed',
      buildingType: 'tea-house',
      anchor: { x: 4, y: 7 },
      rotation: 90,
    })
  })

  it('refuses invalid placement and exposes the reason', () => {
    let state: PlacementState = {
      status: 'placing',
      buildingType: 'bridge',
      anchor: null,
      rotation: 0,
      validity: 'unknown',
    }
    state = reducePlacement(state, { type: 'move', anchor: { x: -1, y: 2 } }, validator)
    expect(state).toMatchObject({ validity: 'invalid', reason: '超出地图' })

    expect(reducePlacement(state, { type: 'confirm' }, validator)).toBe(state)
  })

  it('revalidates rotation and can resume repeated placement', () => {
    const rotationValidator: PlacementValidator = (_type, _anchor, rotation) => ({
      valid: rotation === 0,
      reason: '入口未连接道路',
    })
    let state = reducePlacement(
      { status: 'idle' },
      { type: 'select', buildingType: 'market' },
      rotationValidator,
    )
    state = reducePlacement(state, { type: 'move', anchor: { x: 2, y: 2 } }, rotationValidator)
    state = reducePlacement(state, { type: 'confirm' }, rotationValidator)
    state = reducePlacement(state, { type: 'resume' }, rotationValidator)

    expect(state).toMatchObject({ status: 'placing', validity: 'valid' })
    state = reducePlacement(
      state,
      { type: 'rotate', direction: 'counterclockwise' },
      rotationValidator,
    )
    expect(state).toMatchObject({ rotation: 270, validity: 'invalid' })
  })

  it('notifies subscribers through the controller', () => {
    const controller = new PlacementController(validator)
    const listener = vi.fn()
    controller.subscribe(listener)

    controller.dispatch({ type: 'select', buildingType: 'home' })
    controller.dispatch({ type: 'cancel' })

    expect(listener).toHaveBeenCalledTimes(2)
    expect(controller.getState()).toEqual({ status: 'idle' })
  })
})

