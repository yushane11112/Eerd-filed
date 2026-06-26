import type {
  GridPoint,
  ResourceKind,
  Tick,
  WorldDrop,
} from '../contracts'

export const MAX_VISIBLE_DROP_NODES = 30
export const MAX_DROP_STACK_AMOUNT = 3
export const DEFAULT_STACK_RADIUS = 2
export const ORDINARY_DROP_RESOURCES: readonly ResourceKind[] = [
  'food',
  'fish',
  'wood',
  'stone',
  'clay',
  'brick',
  'cloth',
  'salt',
  'medicine',
]
export const ORDINARY_DROP_SOURCES: readonly OrdinaryDropSource[] = [
  'production',
  'weather',
  'tide',
  'animal',
  'visitor',
]

export type OrdinaryDropSource = WorldDrop['source']

export interface PendingWorldDrop {
  resource: ResourceKind
  amount: number
  source: OrdinaryDropSource
  createdTick: Tick
}

export interface DropSpawnState {
  visible: WorldDrop[]
  pending: PendingWorldDrop[]
  nextId: number
}

export interface DropSpawnContext {
  candidatePositions: readonly GridPoint[]
  isReachable: (point: GridPoint) => boolean
  random?: () => number
  stackRadius?: number
}

export interface DropSpawnResult {
  state: DropSpawnState
  spawnedDropIds: string[]
  queuedAmount: number
}

export interface RandomDropOptions {
  resources?: readonly ResourceKind[]
  sources?: readonly OrdinaryDropSource[]
  minAmount?: number
  maxAmount?: number
}

const squaredDistance = (a: GridPoint, b: GridPoint) => {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return dx * dx + dy * dy
}

const clampRandomIndex = (randomValue: number, length: number) =>
  Math.min(length - 1, Math.max(0, Math.floor(randomValue * length)))

const cloneState = (state: DropSpawnState): DropSpawnState => ({
  visible: state.visible.map((drop) => ({ ...drop, position: { ...drop.position } })),
  pending: state.pending.map((drop) => ({ ...drop })),
  nextId: state.nextId,
})

const appendPending = (
  pending: PendingWorldDrop[],
  request: PendingWorldDrop,
) => {
  if (request.amount <= 0) return

  const last = pending.at(-1)
  if (
    last
    && last.resource === request.resource
    && last.source === request.source
    && last.createdTick === request.createdTick
  ) {
    last.amount += request.amount
    return
  }

  pending.push({ ...request })
}

const findAvailableStack = (
  drops: WorldDrop[],
  resource: ResourceKind,
  stackRadius: number,
  targetPosition: GridPoint,
) => {
  const radiusSquared = stackRadius * stackRadius

  return drops.find((drop) =>
    drop.resource === resource
    && drop.amount < MAX_DROP_STACK_AMOUNT
    && squaredDistance(drop.position, targetPosition) <= radiusSquared)
}

const placeRequest = (
  state: DropSpawnState,
  request: PendingWorldDrop,
  context: DropSpawnContext,
  spawnedDropIds: string[],
) => {
  const random = context.random ?? Math.random
  const stackRadius = context.stackRadius ?? DEFAULT_STACK_RADIUS
  const reachablePositions = context.candidatePositions.filter(context.isReachable)
  let remaining = Math.max(0, Math.floor(request.amount))

  while (remaining > 0) {
    if (reachablePositions.length === 0) break

    const targetPosition = reachablePositions[
      clampRandomIndex(random(), reachablePositions.length)
    ]
    let stack = findAvailableStack(
      state.visible,
      request.resource,
      stackRadius,
      targetPosition,
    )

    if (!stack && state.visible.length >= MAX_VISIBLE_DROP_NODES) {
      stack = state.visible.find((drop) =>
        drop.resource === request.resource
        && drop.amount < MAX_DROP_STACK_AMOUNT
        && reachablePositions.some((position) =>
          squaredDistance(drop.position, position) <= stackRadius * stackRadius))
    }

    if (stack) {
      const stackedAmount = Math.min(
        remaining,
        MAX_DROP_STACK_AMOUNT - stack.amount,
      )
      stack.amount += stackedAmount
      remaining -= stackedAmount
      continue
    }

    if (
      state.visible.length >= MAX_VISIBLE_DROP_NODES
    ) {
      break
    }

    const amount = Math.min(remaining, MAX_DROP_STACK_AMOUNT)
    const id = `world-drop-${state.nextId}`
    state.nextId += 1
    state.visible.push({
      id,
      resource: request.resource,
      amount,
      position: { ...targetPosition },
      source: request.source,
      createdTick: request.createdTick,
    })
    spawnedDropIds.push(id)
    remaining -= amount
  }

  return remaining
}

export const createDropSpawnState = (
  initial?: Partial<DropSpawnState>,
): DropSpawnState => ({
  visible: initial?.visible?.map((drop) => ({
    ...drop,
    position: { ...drop.position },
  })) ?? [],
  pending: initial?.pending?.map((drop) => ({ ...drop })) ?? [],
  nextId: initial?.nextId ?? 1,
})

/**
 * Spawns ordinary world materials only. Music events intentionally have no
 * entry point in this module and therefore cannot produce ordinary drops.
 */
export const spawnOrdinaryDrop = (
  currentState: DropSpawnState,
  request: PendingWorldDrop,
  context: DropSpawnContext,
): DropSpawnResult => {
  const state = cloneState(currentState)
  const spawnedDropIds: string[] = []
  const remaining = placeRequest(state, request, context, spawnedDropIds)

  appendPending(state.pending, { ...request, amount: remaining })

  return {
    state,
    spawnedDropIds,
    queuedAmount: remaining,
  }
}

export const spawnRandomOrdinaryDrop = (
  currentState: DropSpawnState,
  createdTick: Tick,
  context: DropSpawnContext,
  options: RandomDropOptions = {},
): DropSpawnResult => {
  const random = context.random ?? Math.random
  const resources = options.resources ?? ORDINARY_DROP_RESOURCES
  const sources = options.sources ?? ORDINARY_DROP_SOURCES
  if (resources.length === 0 || sources.length === 0) {
    return {
      state: cloneState(currentState),
      spawnedDropIds: [],
      queuedAmount: 0,
    }
  }

  const minAmount = Math.max(1, Math.floor(options.minAmount ?? 1))
  const maxAmount = Math.max(minAmount, Math.floor(options.maxAmount ?? 3))
  const resource = resources[clampRandomIndex(random(), resources.length)]
  const source = sources[clampRandomIndex(random(), sources.length)]
  const amount = minAmount + clampRandomIndex(
    random(),
    maxAmount - minAmount + 1,
  )

  return spawnOrdinaryDrop(
    currentState,
    { resource, amount, source, createdTick },
    { ...context, random },
  )
}

/**
 * Retries queued rewards in FIFO order. Any remainder stays at the front so
 * later rewards cannot overtake it.
 */
export const flushPendingDrops = (
  currentState: DropSpawnState,
  context: DropSpawnContext,
): DropSpawnResult => {
  const state = cloneState(currentState)
  const queued = state.pending
  state.pending = []
  const spawnedDropIds: string[] = []

  for (let index = 0; index < queued.length; index += 1) {
    const request = queued[index]
    const remaining = placeRequest(state, request, context, spawnedDropIds)

    if (remaining > 0) {
      appendPending(state.pending, { ...request, amount: remaining })
      for (const laterRequest of queued.slice(index + 1)) {
        appendPending(state.pending, laterRequest)
      }
      break
    }
  }

  return {
    state,
    spawnedDropIds,
    queuedAmount: state.pending.reduce((sum, drop) => sum + drop.amount, 0),
  }
}

export interface PickUpDropResult {
  state: DropSpawnState
  pickedUp?: Pick<WorldDrop, 'resource' | 'amount'>
}

export const pickUpWorldDrop = (
  currentState: DropSpawnState,
  dropId: string,
): PickUpDropResult => {
  const state = cloneState(currentState)
  const index = state.visible.findIndex((drop) => drop.id === dropId)
  if (index < 0) return { state }

  const [drop] = state.visible.splice(index, 1)
  return {
    state,
    pickedUp: {
      resource: drop.resource,
      amount: drop.amount,
    },
  }
}
