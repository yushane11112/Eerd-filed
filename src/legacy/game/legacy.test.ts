import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
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

  it('keeps the archived island renderer out of the main components directory', () => {
    expect(existsSync(join(process.cwd(), 'src/components/IslandCanvas.tsx'))).toBe(false)
    expect(existsSync(join(process.cwd(), 'src/legacy/archipelago/IslandCanvas.tsx'))).toBe(true)
  })

  it('keeps the old island game engine out of the formal src/game and components boundaries', () => {
    expect(existsSync(join(process.cwd(), 'src/game'))).toBe(false)
    expect(existsSync(join(process.cwd(), 'src/components/MaterialRow.tsx'))).toBe(false)
    expect(existsSync(join(process.cwd(), 'src/legacy/game/engine.ts'))).toBe(true)
    expect(existsSync(join(process.cwd(), 'src/legacy/game/MaterialRow.tsx'))).toBe(true)
  })
})
