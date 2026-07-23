import { describe, expect, it } from 'vitest'
import { HttpCityNoticeAnalyticsTransport } from './analyticsHttpTransport'
import type { CityNoticeLifecycleEvent } from './cityNotices'

const event = (id: string): CityNoticeLifecycleEvent => ({
  eventId: id,
  phase: 'activated',
  noticeId: 'food-shortage',
  kind: 'resource',
  severity: 'warning',
  tick: 12,
})

function response(payload: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    async json() { return payload },
  } as Response
}

describe('HttpCityNoticeAnalyticsTransport', () => {
  it('posts events with a deterministic idempotency key and validates acknowledgements', async () => {
    let request: { input: string; init?: RequestInit } | undefined
    const transport = new HttpCityNoticeAnalyticsTransport('/analytics', {}, async (input, init) => {
      request = { input, init }
      return response({ acknowledgedEventIds: ['one', 'outside', 'one'] })
    })
    const result = await transport.send([event('one')])
    expect(result.acknowledgedEventIds).toEqual(['one'])
    expect(request?.input).toBe('/analytics')
    expect(request?.init?.method).toBe('POST')
    expect((request?.init?.headers as Record<string, string>)['idempotency-key'])
      .toBe('city-notice-batch:one')
    expect(JSON.parse(String(request?.init?.body))).toEqual({ events: [event('one')] })
  })

  it('rejects non-success responses and invalid response payloads', async () => {
    const serverError = new HttpCityNoticeAnalyticsTransport('/analytics', {}, async () => response({}, false, 503))
    await expect(serverError.send([event('one')])).rejects.toThrow('analytics HTTP 503')

    const malformed = new HttpCityNoticeAnalyticsTransport('/analytics', {}, async () => response({ ok: true }))
    await expect(malformed.send([event('one')])).rejects.toThrow('acknowledgedEventIds is invalid')
  })

  it('aborts a request that exceeds the configured timeout', async () => {
    const transport = new HttpCityNoticeAnalyticsTransport('/analytics', { timeoutMs: 5 }, (_input, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new Error('aborted by fetcher')))
    }))
    await expect(transport.send([event('one')])).rejects.toThrow('analytics request timeout')
  })
})
