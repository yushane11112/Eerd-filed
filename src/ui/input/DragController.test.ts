import { describe, expect, it } from 'vitest'
import { DragController } from './DragController'

describe('DragController', () => {
  it('distinguishes taps from drags and preserves threshold movement', () => {
    const drag = new DragController(5)
    expect(drag.start(1, { x: 10, y: 10 })).toBe(true)

    expect(drag.move(1, { x: 12, y: 11 })?.state.dragging).toBe(false)
    const crossed = drag.move(1, { x: 16, y: 13 })

    expect(crossed?.state.dragging).toBe(true)
    expect(crossed?.delta).toEqual({ x: 6, y: 3 })
    expect(drag.end(1)?.dragging).toBe(true)
    expect(drag.getState().pointerId).toBeNull()
  })

  it('ignores secondary pointers while active', () => {
    const drag = new DragController()
    drag.start(4, { x: 0, y: 0 })

    expect(drag.start(5, { x: 0, y: 0 })).toBe(false)
    expect(drag.move(5, { x: 10, y: 10 })).toBeNull()
    expect(drag.end(5)).toBeNull()
  })
})

