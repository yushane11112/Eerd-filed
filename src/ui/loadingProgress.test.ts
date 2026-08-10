import { describe, expect, it } from 'vitest'
import { canvasLoadingPhaseOrder, canvasLoadingStatus } from './loadingProgress'

describe('canvas loading progress', () => {
  it('keeps player-facing loading phases in production order', () => {
    expect(canvasLoadingPhaseOrder()).toEqual([
      'graphics',
      'artwork',
      'scene',
      'terrain',
      'first-sync',
      'ready',
    ])
  })

  it('returns stable copy, text and progress for a phase', () => {
    expect(canvasLoadingStatus('artwork', 740)).toEqual({
      phase: 'artwork',
      label: '铺开街坊灯火',
      detail: '加载建筑图集、动效和等级外观',
      progress: 38,
      elapsedMs: 740,
    })
  })

  it('marks ready as complete for browser gates', () => {
    expect(canvasLoadingStatus('ready').progress).toBe(100)
  })
})
