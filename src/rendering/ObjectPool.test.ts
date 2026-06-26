import { describe, expect, it } from 'vitest'
import { ObjectPool } from './ObjectPool'

class TestItem {
  resets = 0
  reset(): void {
    this.resets += 1
  }
}

describe('ObjectPool', () => {
  it('reuses released instances', () => {
    const pool = new ObjectPool(() => new TestItem(), 1)
    const first = pool.acquire()
    expect(pool.activeCount).toBe(1)

    expect(pool.release(first)).toBe(true)
    expect(first.resets).toBe(1)
    expect(pool.activeCount).toBe(0)

    expect(pool.acquire()).toBe(first)
  })

  it('does not release an item twice and respects retention limits', () => {
    const pool = new ObjectPool(() => new TestItem(), 0, 1)
    const first = pool.acquire()
    const second = pool.acquire()

    expect(pool.release(first)).toBe(true)
    expect(pool.release(first)).toBe(false)
    expect(pool.release(second)).toBe(true)
    expect(pool.pooledCount).toBe(1)
  })
})
