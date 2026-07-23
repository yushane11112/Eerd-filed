import type {
  CityNoticeAnalyticsQueue,
  CityNoticeLifecycleEvent,
} from './cityNotices'

export interface CityNoticeAnalyticsTransport {
  send(events: readonly CityNoticeLifecycleEvent[]): Promise<CityNoticeAnalyticsSendResult>
}

export interface CityNoticeAnalyticsSendResult {
  acknowledgedEventIds: readonly string[]
  retryable?: boolean
}

export type CityNoticeAnalyticsFlushStatus = 'empty' | 'unconfigured' | 'sent' | 'partial' | 'failed'

export interface CityNoticeAnalyticsFlushResult {
  status: CityNoticeAnalyticsFlushStatus
  attempted: number
  acknowledged: number
  remaining: number
  attempt: number
  retryAfterMs: number
  error?: string
}

export interface CityNoticeAnalyticsDispatcherOptions {
  batchSize?: number
  initialRetryMs?: number
  maxRetryMs?: number
}

const DEFAULT_BATCH_SIZE = 50
const DEFAULT_INITIAL_RETRY_MS = 1_000
const DEFAULT_MAX_RETRY_MS = 60_000

export function analyticsRetryDelayMs(
  attempt: number,
  initialRetryMs = DEFAULT_INITIAL_RETRY_MS,
  maxRetryMs = DEFAULT_MAX_RETRY_MS,
): number {
  const safeAttempt = Math.max(1, Math.floor(attempt))
  const safeInitial = Math.max(0, initialRetryMs)
  const safeMax = Math.max(safeInitial, maxRetryMs)
  return Math.min(safeMax, safeInitial * 2 ** (safeAttempt - 1))
}

/**
 * Coordinates the durable outbox with an optional product analytics transport.
 * It never acknowledges an event unless the transport explicitly returns its ID.
 */
export class CityNoticeAnalyticsDispatcher {
  private consecutiveFailures = 0
  private readonly batchSize: number
  private readonly initialRetryMs: number
  private readonly maxRetryMs: number

  constructor(
    private readonly queue: CityNoticeAnalyticsQueue,
    private readonly transport: CityNoticeAnalyticsTransport | undefined,
    options: CityNoticeAnalyticsDispatcherOptions = {},
  ) {
    this.batchSize = Math.max(1, Math.floor(options.batchSize ?? DEFAULT_BATCH_SIZE))
    this.initialRetryMs = options.initialRetryMs ?? DEFAULT_INITIAL_RETRY_MS
    this.maxRetryMs = options.maxRetryMs ?? DEFAULT_MAX_RETRY_MS
  }

  async flush(): Promise<CityNoticeAnalyticsFlushResult> {
    const batch = this.queue.peek(this.batchSize)
    if (batch.length === 0) {
      this.consecutiveFailures = 0
      return this.result('empty', 0, 0, 0, 0)
    }
    if (!this.transport) {
      return this.result('unconfigured', batch.length, 0, this.queue.size(), 0)
    }

    try {
      const response = await this.transport.send(batch)
      const batchIds = new Set(batch.map((event) => event.eventId))
      const acknowledgedIds = [...new Set(response.acknowledgedEventIds)]
        .filter((eventId) => batchIds.has(eventId))
      const acknowledged = this.queue.acknowledge(acknowledgedIds)
      const remaining = this.queue.size()
      this.consecutiveFailures = 0
      return this.result(
        acknowledged === batch.length ? 'sent' : 'partial',
        batch.length,
        acknowledged,
        remaining,
        0,
      )
    } catch (error) {
      this.consecutiveFailures += 1
      const retryAfterMs = analyticsRetryDelayMs(
        this.consecutiveFailures,
        this.initialRetryMs,
        this.maxRetryMs,
      )
      return this.result(
        'failed',
        batch.length,
        0,
        this.queue.size(),
        retryAfterMs,
        error instanceof Error ? error.message : String(error),
      )
    }
  }

  private result(
    status: CityNoticeAnalyticsFlushStatus,
    attempted: number,
    acknowledged: number,
    remaining: number,
    retryAfterMs: number,
    error?: string,
  ): CityNoticeAnalyticsFlushResult {
    return {
      status,
      attempted,
      acknowledged,
      remaining,
      attempt: this.consecutiveFailures,
      retryAfterMs,
      ...(error ? { error } : {}),
    }
  }
}
