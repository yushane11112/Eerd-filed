import { describe, expect, it } from 'vitest'
import {
  isLegacyArchipelagoEnabled,
  isLegacyArchipelagoStaticQa,
  LEGACY_ARCHIPELAGO_PARAM,
  LEGACY_ARCHIPELAGO_QA_PARAM,
} from './legacy'

describe('legacy archipelago gate', () => {
  it('keeps the old archipelago renderer disabled by default', () => {
    const params = new URLSearchParams('')

    expect(isLegacyArchipelagoEnabled(params)).toBe(false)
    expect(isLegacyArchipelagoStaticQa(params)).toBe(false)
  })

  it('enables the archived renderer only through explicit legacy or QA params', () => {
    expect(isLegacyArchipelagoEnabled(new URLSearchParams(LEGACY_ARCHIPELAGO_PARAM))).toBe(true)
    expect(isLegacyArchipelagoEnabled(new URLSearchParams(LEGACY_ARCHIPELAGO_QA_PARAM))).toBe(true)
    expect(isLegacyArchipelagoStaticQa(new URLSearchParams(LEGACY_ARCHIPELAGO_QA_PARAM))).toBe(true)
  })
})

