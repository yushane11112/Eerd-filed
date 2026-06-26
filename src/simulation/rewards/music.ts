import type {
  MusicCompletionEvent,
  RareResourceKind,
  RareRewardState,
} from '../contracts'

export const MIN_LISTENED_SECONDS = 150
export const MIN_COMPLETION_RATIO = 0.8
export const BASE_RARE_REWARD_CHANCE = 0.35
export const EARLY_DAILY_RARE_REWARD_CHANCE = 0.5
export const DAILY_BOOSTED_COMPLETIONS = 3
export const RARE_REWARD_PITY_ATTEMPTS = 5

export const RARE_REWARD_POOL: readonly RareResourceKind[] = [
  'jade',
  'silk',
  'porcelain',
  'blueprint',
]

export type MusicCompletionRejection =
  | 'duplicate-event'
  | 'invalid-duration'
  | 'insufficient-listen-time'
  | 'insufficient-completion-ratio'

export interface MusicRewardResult {
  state: MusicRareRewardState
  accepted: boolean
  rejection?: MusicCompletionRejection
  reward?: RareResourceKind
  chanceApplied?: number
  guaranteed: boolean
}

export interface MusicRewardOptions {
  random?: () => number
  dayKey?: (completedAt: number) => string
}

/**
 * Module-owned extension persisted alongside the public RareRewardState.
 * It distinguishes the first three eligible completions from reward count.
 */
export interface MusicRareRewardState extends RareRewardState {
  eligibleCompletionsToday: number
}

const defaultDayKey = (completedAt: number) =>
  new Date(completedAt).toISOString().slice(0, 10)

const cloneState = (state: RareRewardState): MusicRareRewardState => ({
  missesSinceReward: state.missesSinceReward,
  rewardsToday: state.rewardsToday,
  dayKey: state.dayKey,
  processedEventIds: [...state.processedEventIds],
  inventory: { ...state.inventory },
  eligibleCompletionsToday:
    (state as Partial<MusicRareRewardState>).eligibleCompletionsToday ?? 0,
})

export const createRareRewardState = (
  dayKey = defaultDayKey(Date.now()),
): MusicRareRewardState => ({
  missesSinceReward: 0,
  rewardsToday: 0,
  dayKey,
  processedEventIds: [],
  inventory: {},
  eligibleCompletionsToday: 0,
})

export const validateMusicCompletion = (
  event: MusicCompletionEvent,
): MusicCompletionRejection | undefined => {
  if (
    !Number.isFinite(event.durationSeconds)
    || !Number.isFinite(event.listenedSeconds)
    || event.durationSeconds <= 0
    || event.listenedSeconds < 0
  ) {
    return 'invalid-duration'
  }
  if (event.listenedSeconds < MIN_LISTENED_SECONDS) {
    return 'insufficient-listen-time'
  }
  if (event.listenedSeconds / event.durationSeconds < MIN_COMPLETION_RATIO) {
    return 'insufficient-completion-ratio'
  }
  return undefined
}

/**
 * Settles an eligible completed track into rare inventory only. Ordinary
 * ResourceKind materials are deliberately absent from this API.
 */
export const settleMusicCompletion = (
  currentState: RareRewardState,
  event: MusicCompletionEvent,
  options: MusicRewardOptions = {},
): MusicRewardResult => {
  const state = cloneState(currentState)

  if (state.processedEventIds.includes(event.eventId)) {
    return {
      state,
      accepted: false,
      rejection: 'duplicate-event',
      guaranteed: false,
    }
  }

  const rejection = validateMusicCompletion(event)
  if (rejection) {
    return { state, accepted: false, rejection, guaranteed: false }
  }

  const dayKey = (options.dayKey ?? defaultDayKey)(event.completedAt)
  if (state.dayKey !== dayKey) {
    state.dayKey = dayKey
    state.rewardsToday = 0
    state.eligibleCompletionsToday = 0
  }

  state.processedEventIds.push(event.eventId)

  const guaranteed = state.missesSinceReward >= RARE_REWARD_PITY_ATTEMPTS - 1
  const chanceApplied = state.eligibleCompletionsToday < DAILY_BOOSTED_COMPLETIONS
    ? EARLY_DAILY_RARE_REWARD_CHANCE
    : BASE_RARE_REWARD_CHANCE
  state.eligibleCompletionsToday += 1
  const random = options.random ?? Math.random
  const granted = guaranteed || random() < chanceApplied

  if (!granted) {
    state.missesSinceReward += 1
    return {
      state,
      accepted: true,
      chanceApplied,
      guaranteed,
    }
  }

  const rewardIndex = Math.min(
    RARE_REWARD_POOL.length - 1,
    Math.max(0, Math.floor(random() * RARE_REWARD_POOL.length)),
  )
  const reward = RARE_REWARD_POOL[rewardIndex]
  state.inventory[reward] = (state.inventory[reward] ?? 0) + 1
  state.missesSinceReward = 0
  state.rewardsToday += 1

  return {
    state,
    accepted: true,
    reward,
    chanceApplied,
    guaranteed,
  }
}
