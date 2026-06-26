import { describe, expect, it } from 'vitest'
import { DeterministicRandom } from './random'

describe('DeterministicRandom', () => {
  it('repeats the same sequence for the same seed', () => {
    const first = new DeterministicRandom(42)
    const second = new DeterministicRandom(42)

    expect(Array.from({ length: 10 }, () => first.next())).toEqual(
      Array.from({ length: 10 }, () => second.next()),
    )
    expect(first.seed).toBe(second.seed)
  })

  it('supports inclusive integer bounds and rejects invalid input', () => {
    const random = new DeterministicRandom(7)
    const values = Array.from({ length: 100 }, () => random.integer(2, 4))
    expect(values.every((value) => value >= 2 && value <= 4)).toBe(true)
    expect(() => random.integer(4, 2)).toThrow(RangeError)
    expect(() => new DeterministicRandom(Number.NaN)).toThrow(TypeError)
  })
})
