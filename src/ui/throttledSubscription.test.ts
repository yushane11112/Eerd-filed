import { describe, expect, it } from 'vitest'
import { createThrottledSubscription, type ThrottledSubscriptionClock } from './throttledSubscription'

describe('throttled subscription', () => {
  it('coalesces repeated source notifications into the configured interval', () => {
    let sourceListener: (() => void) | undefined
    let now = 0
    let nextTimerId = 1
    const timers = new Map<number, () => void>()
    const clock: ThrottledSubscriptionClock = {
      now: () => now,
      setTimeout: (callback) => {
        const id = nextTimerId
        nextTimerId += 1
        timers.set(id, callback)
        return id
      },
      clearTimeout: (timerId) => {
        timers.delete(timerId)
      },
    }
    let notifications = 0
    const unsubscribe = createThrottledSubscription(
      (listener) => {
        sourceListener = listener
        return () => {
          sourceListener = undefined
        }
      },
      () => {
        notifications += 1
      },
      250,
      clock,
    )

    sourceListener?.()
    sourceListener?.()
    expect(notifications).toBe(0)
    expect(timers.size).toBe(1)

    now = 250
    timers.get(1)?.()
    expect(notifications).toBe(1)

    now = 500
    sourceListener?.()
    expect(notifications).toBe(2)

    unsubscribe()
    expect(sourceListener).toBeUndefined()
  })
})
