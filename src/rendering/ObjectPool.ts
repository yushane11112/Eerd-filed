export interface Poolable {
  reset(): void
}

export class ObjectPool<T extends Poolable> {
  private readonly available: T[] = []
  private readonly active = new Set<T>()

  constructor(
    private readonly factory: () => T,
    initialSize = 0,
    private readonly maxRetained = Number.POSITIVE_INFINITY,
  ) {
    for (let index = 0; index < initialSize; index += 1) {
      this.available.push(this.factory())
    }
  }

  acquire(): T {
    const item = this.available.pop() ?? this.factory()
    this.active.add(item)
    return item
  }

  release(item: T): boolean {
    if (!this.active.delete(item)) return false
    item.reset()
    if (this.available.length < this.maxRetained) this.available.push(item)
    return true
  }

  releaseAll(): void {
    for (const item of [...this.active]) this.release(item)
  }

  get activeCount(): number {
    return this.active.size
  }

  get pooledCount(): number {
    return this.available.length
  }
}

