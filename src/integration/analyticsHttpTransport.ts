import type {
  CityNoticeAnalyticsSendResult,
  CityNoticeAnalyticsTransport,
} from './analyticsTransport'
import type { CityNoticeLifecycleEvent } from './cityNotices'

export interface AnalyticsHttpTransportOptions {
  timeoutMs?: number
  headers?: Readonly<Record<string, string>>
}

export type AnalyticsHttpFetcher = (
  input: string,
  init?: RequestInit,
) => Promise<Response>

const DEFAULT_TIMEOUT_MS = 10_000

/**
 * Minimal HTTP adapter for an analytics service. The server must be idempotent
 * by eventId; the deterministic batch header is an additional request-level key.
 */
export class HttpCityNoticeAnalyticsTransport implements CityNoticeAnalyticsTransport {
  private readonly timeoutMs: number
  private readonly headers: Readonly<Record<string, string>>

  constructor(
    private readonly endpoint: string,
    options: AnalyticsHttpTransportOptions = {},
    private readonly fetcher: AnalyticsHttpFetcher = (...args) => fetch(...args),
  ) {
    this.timeoutMs = Math.max(1, Math.floor(options.timeoutMs ?? DEFAULT_TIMEOUT_MS))
    this.headers = options.headers ?? {}
  }

  async send(events: readonly CityNoticeLifecycleEvent[]): Promise<CityNoticeAnalyticsSendResult> {
    if (events.length === 0) return { acknowledgedEventIds: [] }
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs)
    const batchKey = events.map((event) => event.eventId).join(',')

    try {
      const response = await this.fetcher(this.endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
          'idempotency-key': `city-notice-batch:${batchKey}`,
          ...this.headers,
        },
        body: JSON.stringify({ events }),
        signal: controller.signal,
      })
      if (!response.ok) {
        throw new Error(`analytics HTTP ${response.status}`)
      }
      const payload: unknown = await response.json()
      const acknowledgedEventIds = parseAcknowledgedEventIds(payload)
      const allowedIds = new Set(events.map((event) => event.eventId))
      return {
        acknowledgedEventIds: acknowledgedEventIds.filter((eventId) => allowedIds.has(eventId)),
      }
    } catch (error) {
      if (controller.signal.aborted) throw new Error('analytics request timeout')
      throw error
    } finally {
      clearTimeout(timeout)
    }
  }
}

function parseAcknowledgedEventIds(payload: unknown): string[] {
  if (!payload || typeof payload !== 'object') {
    throw new Error('analytics response must be an object')
  }
  const candidate = payload as { acknowledgedEventIds?: unknown }
  if (!Array.isArray(candidate.acknowledgedEventIds)
    || candidate.acknowledgedEventIds.some((eventId) => typeof eventId !== 'string')) {
    throw new Error('analytics response acknowledgedEventIds is invalid')
  }
  return [...new Set(candidate.acknowledgedEventIds)]
}
