import { describe, expect, it } from 'vitest'
import {
  CityNoticeAnalyticsDispatcher,
  analyticsRetryDelayMs,
} from './analyticsTransport'
import {
  CityNoticeAnalyticsQueue,
  type CityNoticeAnalyticsStorage,
  type CityNoticeLifecycleEvent,
} from './cityNotices'

class MemoryStorage implements CityNoticeAnalyticsStorage {
  private value: string | null = null
  getItem() { return this.value }
  setItem(_key: string, value: string) { this.value = value }
}

const event = (id: string): CityNoticeLifecycleEvent => ({
  eventId: id,
  phase: 'activated',
  noticeId: 'food-shortage',
  kind: 'resource',
  severity: 'warning',
  tick: 12,
})

describe('CityNoticeAnalyticsDispatcher', () => {
  it('keeps events offline when no transport is configured', async () => {
    const queue = new CityNoticeAnalyticsQueue(new MemoryStorage(), 'test')
    queue.enqueue([event('one')])
    const result = await new CityNoticeAnalyticsDispatcher(queue, undefined).flush()
    expect(result.status).toBe('unconfigured')
    expect(result.remaining).toBe(1)
  })

  it('acknowledges only the IDs explicitly returned by the transport', async () => {
    const queue = new CityNoticeAnalyticsQueue(new MemoryStorage(), 'test')
    queue.enqueue([event('one'), event('two')])
    const dispatcher = new CityNoticeAnalyticsDispatcher(queue, {
      async send() { return { acknowledgedEventIds: ['one', 'outside', 'one'] } },
    }, { batchSize: 2 })
    const result = await dispatcher.flush()
    expect(result.status).toBe('partial')
    expect(result.acknowledged).toBe(1)
    expect(queue.peek().map((item) => item.eventId)).toEqual(['two'])
  })

  it('retains the batch after a failure and increases bounded retry delay', async () => {
    const queue = new CityNoticeAnalyticsQueue(new MemoryStorage(), 'test')
    queue.enqueue([event('one')])
    const dispatcher = new CityNoticeAnalyticsDispatcher(queue, {
      async send() { throw new Error('offline') },
    }, { initialRetryMs: 250, maxRetryMs: 700 })
    const first = await dispatcher.flush()
    const second = await dispatcher.flush()
    expect(first.status).toBe('failed')
    expect(first.retryAfterMs).toBe(250)
    expect(second.retryAfterMs).toBe(500)
    expect(second.remaining).toBe(1)
    expect(analyticsRetryDelayMs(8, 250, 700)).toBe(700)
  })
})
