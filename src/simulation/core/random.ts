export class DeterministicRandom {
  private state: number

  constructor(seed: number) {
    this.state = normalizeSeed(seed)
  }

  next(): number {
    let value = this.state
    value ^= value << 13
    value ^= value >>> 17
    value ^= value << 5
    this.state = value >>> 0
    return this.state / 0x1_0000_0000
  }

  integer(min: number, max: number): number {
    if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
      throw new RangeError('integer requires whole-number bounds with max >= min')
    }
    return min + Math.floor(this.next() * (max - min + 1))
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) {
      throw new RangeError('cannot pick from an empty collection')
    }
    return items[this.integer(0, items.length - 1)]
  }

  get seed(): number {
    return this.state
  }
}

function normalizeSeed(seed: number): number {
  if (!Number.isFinite(seed)) {
    throw new TypeError('seed must be a finite number')
  }
  const normalized = Math.trunc(seed) >>> 0
  return normalized === 0 ? 0x6d2b79f5 : normalized
}
