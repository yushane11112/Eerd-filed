export interface ThrottledSubscriptionClock {
  now(): number
  setTimeout(callback: () => void, delayMs: number): number
  clearTimeout(timerId: number): void
}

export function createThrottledSubscription(
  subscribe: (listener: () => void) => () => void,
  listener: () => void,
  minIntervalMs: number,
  clock: ThrottledSubscriptionClock = {
    now: () => performance.now(),
    setTimeout: (callback, delayMs) => window.setTimeout(callback, delayMs),
    clearTimeout: (timerId) => window.clearTimeout(timerId),
  },
): () => void {
  let lastNotifiedAt = 0
  let pendingTimer: number | undefined
  const notify = () => {
    lastNotifiedAt = clock.now()
    pendingTimer = undefined
    listener()
  }
  const unsubscribe = subscribe(() => {
    const elapsed = clock.now() - lastNotifiedAt
    if (elapsed >= minIntervalMs) {
      if (pendingTimer !== undefined) {
        clock.clearTimeout(pendingTimer)
        pendingTimer = undefined
      }
      notify()
      return
    }
    if (pendingTimer === undefined) {
      pendingTimer = clock.setTimeout(notify, minIntervalMs - elapsed)
    }
  })
  return () => {
    if (pendingTimer !== undefined) clock.clearTimeout(pendingTimer)
    unsubscribe()
  }
}
