import { describe, expect, it } from 'vitest'
import type { MusicCompletionEvent } from '../contracts'
import {
  BASE_RARE_REWARD_CHANCE,
  createRareRewardState,
  EARLY_DAILY_RARE_REWARD_CHANCE,
  settleMusicCompletion,
} from './music'

const event = (
  eventId: string,
  completedAt = Date.parse('2026-06-25T12:00:00Z'),
): MusicCompletionEvent => ({
  eventId,
  trackId: `track-${eventId}`,
  listenedSeconds: 240,
  durationSeconds: 300,
  completedAt,
})

describe('music rare rewards', () => {
  it('rejects incomplete and too-short listening without consuming the event id', () => {
    const state = createRareRewardState('2026-06-25')
    const short = settleMusicCompletion(
      state,
      { ...event('short'), listenedSeconds: 149 },
      { random: () => 0 },
    )
    const incomplete = settleMusicCompletion(
      state,
      { ...event('incomplete'), listenedSeconds: 200, durationSeconds: 300 },
      { random: () => 0 },
    )

    expect(short.rejection).toBe('insufficient-listen-time')
    expect(incomplete.rejection).toBe('insufficient-completion-ratio')
    expect(short.state.processedEventIds).toHaveLength(0)
    expect(incomplete.state.processedEventIds).toHaveLength(0)
  })

  it('deduplicates completion events', () => {
    const first = settleMusicCompletion(
      createRareRewardState('2026-06-25'),
      event('same'),
      { random: () => 0.99 },
    )
    const duplicate = settleMusicCompletion(first.state, event('same'), {
      random: () => 0,
    })

    expect(duplicate.accepted).toBe(false)
    expect(duplicate.rejection).toBe('duplicate-event')
    expect(duplicate.state.missesSinceReward).toBe(1)
  })

  it('uses the boosted chance for the first three daily completions, then 35%', () => {
    let state = createRareRewardState('2026-06-25')

    for (let index = 0; index < 3; index += 1) {
      const result = settleMusicCompletion(state, event(`boost-${index}`), {
        random: () => 0.99,
      })
      expect(result.chanceApplied).toBe(EARLY_DAILY_RARE_REWARD_CHANCE)
      expect(result.reward).toBeUndefined()
      state = result.state
    }

    const normal = settleMusicCompletion(state, event('normal'), {
      random: () => 0.99,
    })
    expect(normal.chanceApplied).toBe(BASE_RARE_REWARD_CHANCE)
    expect(normal.reward).toBeUndefined()
  })

  it('guarantees a rare reward on the fifth consecutive eligible completion', () => {
    let state = createRareRewardState('2026-06-25')
    let fifth

    for (let index = 1; index <= 5; index += 1) {
      const result = settleMusicCompletion(state, event(`pity-${index}`), {
        random: () => 0.99,
      })
      state = result.state
      if (index < 5) expect(result.reward).toBeUndefined()
      fifth = result
    }

    expect(fifth?.guaranteed).toBe(true)
    expect(fifth?.reward).toBe('blueprint')
    expect(state.missesSinceReward).toBe(0)
  })

  it('resets the daily boost counter on a new day but keeps pity progress', () => {
    const oldState = {
      ...createRareRewardState('2026-06-24'),
      missesSinceReward: 2,
      rewardsToday: 3,
      eligibleCompletionsToday: 8,
    }
    const result = settleMusicCompletion(
      oldState,
      event('new-day', Date.parse('2026-06-25T01:00:00Z')),
      { random: () => 0.49 },
    )

    expect(result.chanceApplied).toBe(EARLY_DAILY_RARE_REWARD_CHANCE)
    expect(result.state.dayKey).toBe('2026-06-25')
    expect(result.state.rewardsToday).toBe(1)
    expect(result.state.eligibleCompletionsToday).toBe(1)
    expect(result.state.missesSinceReward).toBe(0)
  })

  it('only writes RareResourceKind inventory and exposes no ordinary drops', () => {
    const result = settleMusicCompletion(
      createRareRewardState('2026-06-25'),
      event('rare-only'),
      { random: () => 0 },
    )

    expect(result.state.inventory).toEqual({ jade: 1 })
    expect(result).not.toHaveProperty('worldDrops')
  })
})
