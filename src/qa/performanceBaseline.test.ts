import { describe, expect, it } from 'vitest'
import {
  aggregatePerformanceSamples,
  PERFORMANCE_ENVIRONMENTS,
  PERFORMANCE_THRESHOLDS,
  evaluatePerformanceSample,
} from './performanceBaseline'

describe('performance baseline contract', () => {
  it('declares desktop, software and embedded-container environments', () => {
    expect(PERFORMANCE_ENVIRONMENTS.map((environment) => environment.id)).toEqual([
      'desktop-gpu',
      'software-renderer',
      'embedded-container',
    ])
    expect(PERFORMANCE_ENVIRONMENTS[1].chromiumArgs).toContain('--disable-gpu')
    expect(PERFORMANCE_ENVIRONMENTS[2].evidenceLevel).toBe('container-proxy')
  })

  it('passes only when all runtime quality gates pass', () => {
    const evaluation = evaluatePerformanceSample({
      ok: true,
      frameMetrics: { averageFrameMs: 12, p95FrameMs: 18, maxFrameMs: 30 },
      renderProfile: { p95: { totalMs: 1.2 } },
      rendererProfile: { p95Ms: 2, maxMs: 4 },
      readPixels: { count: 0 },
    })
    expect(evaluation.ok).toBe(true)
    expect(evaluation.checks).toHaveLength(6)
  })

  it('keeps a weak browser result red instead of weakening the gate', () => {
    const evaluation = evaluatePerformanceSample({
      ok: true,
      frameMetrics: { averageFrameMs: 20.75, p95FrameMs: 33.4, maxFrameMs: 33.4 },
      renderProfile: { p95: { totalMs: 1 } },
      readPixels: { count: 0 },
    })
    expect(evaluation.ok).toBe(false)
    expect(evaluation.checks.find((check) => check.metric === 'averageFrameMs')?.threshold)
      .toBe(PERFORMANCE_THRESHOLDS.averageFrameMs)
  })

  it('uses median frame timing while keeping the worst readback count', () => {
    const aggregate = aggregatePerformanceSamples([
      { ok: true, frameMetrics: { averageFrameMs: 15, p95FrameMs: 20, maxFrameMs: 30 }, renderProfile: { p95: { totalMs: 1 } }, rendererProfile: { p95Ms: 2, maxMs: 4 }, readPixels: { count: 0 } },
      { ok: true, frameMetrics: { averageFrameMs: 80, p95FrameMs: 90, maxFrameMs: 100 }, renderProfile: { p95: { totalMs: 5 } }, rendererProfile: { p95Ms: 9, maxMs: 20 }, readPixels: { count: 2 } },
      { ok: true, frameMetrics: { averageFrameMs: 16, p95FrameMs: 22, maxFrameMs: 40 }, renderProfile: { p95: { totalMs: 2 } }, rendererProfile: { p95Ms: 3, maxMs: 6 }, readPixels: { count: 0 } },
    ])
    expect(aggregate.frameMetrics).toEqual({ averageFrameMs: 16, p95FrameMs: 22, maxFrameMs: 40 })
    expect(aggregate.renderProfile?.p95?.totalMs).toBe(2)
    expect(aggregate.rendererProfile).toEqual({ p95Ms: 3, maxMs: 6 })
    expect(aggregate.readPixels?.count).toBe(2)
  })
})
