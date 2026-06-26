import { describe, expect, it } from 'vitest'
import {
  createDropSpawnState,
  flushPendingDrops,
  MAX_VISIBLE_DROP_NODES,
  pickUpWorldDrop,
  spawnOrdinaryDrop,
  spawnRandomOrdinaryDrop,
} from './drops'

const reachable = (x: number, y = 0) => ({ x, y })

describe('ordinary world drops', () => {
  it('places drops only on reachable candidates', () => {
    const result = spawnOrdinaryDrop(
      createDropSpawnState(),
      { resource: 'wood', amount: 1, source: 'production', createdTick: 10 },
      {
        candidatePositions: [reachable(0), reachable(1), reachable(2)],
        isReachable: (point) => point.x === 2,
        random: () => 0,
      },
    )

    expect(result.state.visible).toHaveLength(1)
    expect(result.state.visible[0].position).toEqual(reachable(2))
    expect(result.state.pending).toHaveLength(0)
  })

  it('stacks nearby matching resources up to three units', () => {
    const first = spawnOrdinaryDrop(
      createDropSpawnState(),
      { resource: 'stone', amount: 2, source: 'weather', createdTick: 1 },
      {
        candidatePositions: [reachable(5)],
        isReachable: () => true,
        random: () => 0,
      },
    )
    const second = spawnOrdinaryDrop(
      first.state,
      { resource: 'stone', amount: 2, source: 'tide', createdTick: 2 },
      {
        candidatePositions: [reachable(6)],
        isReachable: () => true,
        random: () => 0,
      },
    )

    expect(second.state.visible).toHaveLength(2)
    expect(second.state.visible.map((drop) => drop.amount)).toEqual([3, 1])
  })

  it('queues overflow at 30 visible nodes and flushes after pickup', () => {
    const initial = createDropSpawnState({
      visible: Array.from({ length: MAX_VISIBLE_DROP_NODES }, (_, index) => ({
        id: `existing-${index}`,
        resource: index % 2 === 0 ? 'wood' : 'stone',
        amount: 3,
        position: reachable(index * 10),
        source: 'production',
        createdTick: 1,
      })),
      nextId: 31,
    })

    const blocked = spawnOrdinaryDrop(
      initial,
      { resource: 'cloth', amount: 2, source: 'visitor', createdTick: 2 },
      {
        candidatePositions: [reachable(500)],
        isReachable: () => true,
      },
    )
    expect(blocked.state.visible).toHaveLength(MAX_VISIBLE_DROP_NODES)
    expect(blocked.state.pending).toEqual([
      { resource: 'cloth', amount: 2, source: 'visitor', createdTick: 2 },
    ])

    const picked = pickUpWorldDrop(blocked.state, 'existing-0')
    expect(picked.pickedUp).toEqual({ resource: 'wood', amount: 3 })

    const flushed = flushPendingDrops(picked.state, {
      candidatePositions: [reachable(500)],
      isReachable: () => true,
      random: () => 0,
    })
    expect(flushed.state.visible).toHaveLength(MAX_VISIBLE_DROP_NODES)
    expect(flushed.state.visible.at(-1)).toMatchObject({
      resource: 'cloth',
      amount: 2,
      position: reachable(500),
    })
    expect(flushed.state.pending).toHaveLength(0)
  })

  it('queues the full reward when no reachable position exists', () => {
    const result = spawnOrdinaryDrop(
      createDropSpawnState(),
      { resource: 'clay', amount: 2, source: 'animal', createdTick: 4 },
      {
        candidatePositions: [reachable(1)],
        isReachable: () => false,
      },
    )

    expect(result.state.visible).toHaveLength(0)
    expect(result.queuedAmount).toBe(2)
  })

  it('randomly selects an ordinary material, source, amount and reachable point', () => {
    const values = [0.99, 0.99, 0.99, 0]
    const result = spawnRandomOrdinaryDrop(
      createDropSpawnState(),
      22,
      {
        candidatePositions: [reachable(7)],
        isReachable: () => true,
        random: () => values.shift() ?? 0,
      },
      {
        resources: ['wood', 'brick'],
        sources: ['weather', 'visitor'],
        minAmount: 1,
        maxAmount: 3,
      },
    )

    expect(result.state.visible[0]).toMatchObject({
      resource: 'brick',
      source: 'visitor',
      amount: 3,
      position: reachable(7),
      createdTick: 22,
    })
  })
})
