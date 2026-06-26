import { describe, expect, it, vi } from 'vitest'
import {
  FullscreenController,
  type FullscreenAdapter,
} from './FullscreenController'

function createAdapter() {
  let active: Element | null = null
  let listener = () => {}
  const adapter: FullscreenAdapter = {
    getElement: () => active,
    request: vi.fn(async (element: Element) => {
      active = element
      listener()
    }),
    exit: vi.fn(async () => {
      active = null
      listener()
    }),
    subscribe: vi.fn((next) => {
      listener = next
      return () => { listener = () => {} }
    }),
  }
  return adapter
}

describe('FullscreenController', () => {
  it('enters, exits and follows external fullscreen changes', async () => {
    const target = document.createElement('div')
    const adapter = createAdapter()
    const controller = new FullscreenController(adapter, () => target)

    expect(await controller.enter()).toBe(true)
    expect(controller.getState()).toMatchObject({ active: true, pending: false })

    expect(await controller.toggle()).toBe(true)
    expect(controller.getState().active).toBe(false)
    controller.dispose()
  })

  it('exposes rejected browser requests without throwing', async () => {
    const target = document.createElement('div')
    const adapter = createAdapter()
    adapter.request = vi.fn(async () => {
      throw new Error('gesture required')
    })
    const controller = new FullscreenController(adapter, () => target)

    expect(await controller.enter()).toBe(false)
    expect(controller.getState()).toMatchObject({
      active: false,
      pending: false,
      error: 'gesture required',
    })
  })

  it('does not request fullscreen without a target', async () => {
    const adapter = createAdapter()
    const controller = new FullscreenController(adapter, () => null)

    expect(await controller.enter()).toBe(false)
    expect(adapter.request).not.toHaveBeenCalled()
  })
})

