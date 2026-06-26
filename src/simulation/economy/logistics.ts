import type {
  AgentEntity,
  BuildingDefinition,
  BuildingEntity,
  EntityId,
  GridPoint,
  LogisticsOrder,
  ResourceKind,
  SimulationEvent,
  SimulationSnapshot,
  SimulationSystem,
  WorldCell,
} from '../contracts'
import type { ServiceRule } from './service'
import {
  addInventory,
  inventoryAmount,
  inventoryFreeCapacity,
  removeInventory,
} from './inventory'

export interface RoutePlanner {
  findRoute(cells: readonly WorldCell[], from: GridPoint, to: GridPoint): GridPoint[] | undefined
}

export interface LogisticsSystemOptions {
  definitions: Readonly<Record<string, BuildingDefinition>>
  routePlanner?: RoutePlanner
  maxShipment?: number
  inputTargetBatches?: number
  serviceRules?: Readonly<Record<string, ServiceRule>>
  serviceTargetBatches?: number
  idFactory?: () => EntityId
}

const pointKey = (point: GridPoint): string => `${point.x},${point.y}`
const samePoint = (left: GridPoint, right: GridPoint): boolean => left.x === right.x && left.y === right.y

export class RoadRoutePlanner implements RoutePlanner {
  findRoute(cells: readonly WorldCell[], from: GridPoint, to: GridPoint): GridPoint[] | undefined {
    if (samePoint(from, to)) return [{ ...from }]

    const traversable = new Set(
      cells
        .filter((cell) => cell.road || samePoint(cell.point, from) || samePoint(cell.point, to))
        .map((cell) => pointKey(cell.point)),
    )
    traversable.add(pointKey(from))
    traversable.add(pointKey(to))

    const queue: GridPoint[] = [{ ...from }]
    const previous = new Map<string, string | undefined>([[pointKey(from), undefined]])
    const points = new Map<string, GridPoint>([[pointKey(from), { ...from }]])
    const directions = [[1, 0], [0, 1], [-1, 0], [0, -1]] as const

    for (let index = 0; index < queue.length; index += 1) {
      const current = queue[index]
      for (const [dx, dy] of directions) {
        const next = { x: current.x + dx, y: current.y + dy }
        const nextKey = pointKey(next)
        if (!traversable.has(nextKey) || previous.has(nextKey)) continue
        previous.set(nextKey, pointKey(current))
        points.set(nextKey, next)
        if (samePoint(next, to)) return this.reconstruct(previous, points, nextKey)
        queue.push(next)
      }
    }

    return undefined
  }

  private reconstruct(
    previous: ReadonlyMap<string, string | undefined>,
    points: ReadonlyMap<string, GridPoint>,
    destinationKey: string,
  ): GridPoint[] {
    const route: GridPoint[] = []
    let cursor: string | undefined = destinationKey
    while (cursor) {
      route.push({ ...points.get(cursor)! })
      cursor = previous.get(cursor)
    }
    return route.reverse()
  }
}

function resourceEntries(
  record: Partial<Record<ResourceKind, number>>,
): [ResourceKind, number][] {
  return Object.entries(record).filter((entry): entry is [ResourceKind, number] => (
    typeof entry[1] === 'number' && entry[1] > 0
  ))
}

function isActive(order: LogisticsOrder): boolean {
  return order.state === 'waiting' || order.state === 'assigned' || order.state === 'in_transit'
}

function isCarrier(agent: AgentEntity): boolean {
  return agent.role === 'carrier' || agent.role === 'cart' || agent.role === 'boat'
}

export class LogisticsSystem implements SimulationSystem {
  readonly id = 'economy.logistics'
  private readonly definitions: Readonly<Record<string, BuildingDefinition>>
  private readonly routePlanner: RoutePlanner
  private readonly maxShipment: number
  private readonly inputTargetBatches: number
  private readonly serviceRules: Readonly<Record<string, ServiceRule>>
  private readonly serviceTargetBatches: number
  private readonly idFactory: () => EntityId
  private sequence = 0

  constructor(options: LogisticsSystemOptions) {
    this.definitions = options.definitions
    this.routePlanner = options.routePlanner ?? new RoadRoutePlanner()
    this.maxShipment = options.maxShipment ?? 10
    this.inputTargetBatches = options.inputTargetBatches ?? 2
    this.serviceRules = options.serviceRules ?? {}
    this.serviceTargetBatches = options.serviceTargetBatches ?? 3
    this.idFactory = options.idFactory ?? (() => `logistics-${++this.sequence}`)
  }

  update(snapshot: SimulationSnapshot): SimulationEvent[] {
    const events: SimulationEvent[] = []
    events.push(...this.createOrders(snapshot))
    this.assignWaitingOrders(snapshot)
    this.advanceCarriers(snapshot)
    this.updateEfficiency(snapshot)
    return events
  }

  private createOrders(snapshot: SimulationSnapshot): SimulationEvent[] {
    const events: SimulationEvent[] = []
    const buildings = Object.values(snapshot.buildings).sort((a, b) => a.id.localeCompare(b.id))

    for (const destination of buildings) {
      const recipe = this.definitions[destination.type]?.production
      if (recipe) {
        for (const [resource, perBatch] of resourceEntries(recipe.inputs)) {
          const order = this.createStockOrder(
            snapshot,
            destination,
            resource,
            perBatch * this.inputTargetBatches,
            destination.statusReason === `missing-input:${resource}` ? 100 : 50,
          )
          if (order) events.push(order)
        }
      }

      const serviceRule = this.serviceRules[destination.type]
      if (serviceRule?.resource) {
        const target = Math.max(
          serviceRule.amountPerHousehold ?? 1,
          (serviceRule.amountPerHousehold ?? 1)
            * serviceRule.maxHouseholdsPerTick
            * this.serviceTargetBatches,
        )
        const order = this.createStockOrder(
          snapshot,
          destination,
          serviceRule.resource,
          target,
          destination.statusReason === `missing-service-resource:${serviceRule.resource}` ? 90 : 45,
        )
        if (order) events.push(order)
      }
    }

    return events
  }

  private createStockOrder(
    snapshot: SimulationSnapshot,
    destination: BuildingEntity,
    resource: ResourceKind,
    target: number,
    priority: number,
  ): SimulationEvent | undefined {
    const orders = Object.values(snapshot.logisticsOrders)
    const alreadyInbound = orders
      .filter((order) => isActive(order)
        && order.destinationBuildingId === destination.id
        && order.resource === resource)
      .reduce((total, order) => total + order.amount, 0)
    const missing = Math.max(0, target - inventoryAmount(destination, resource) - alreadyInbound)
    if (missing === 0) return undefined

    const sourceMatch = this.findSource(snapshot, destination, resource, requestedAvailable => (
      Math.min(missing, this.maxShipment, requestedAvailable) > 0
    ))
    if (!sourceMatch) return undefined

    const inboundCapacityReserved = orders
      .filter((order) => isActive(order) && order.destinationBuildingId === destination.id)
      .reduce((total, order) => total + order.amount, 0)
    const amount = Math.min(
      missing,
      this.maxShipment,
      sourceMatch.available,
      Math.max(
        0,
        inventoryFreeCapacity(destination, this.definitions[destination.type])
          - inboundCapacityReserved,
      ),
    )
    if (amount <= 0) return undefined

    const id = this.idFactory()
    snapshot.logisticsOrders[id] = {
      id,
      resource,
      amount,
      sourceBuildingId: sourceMatch.building.id,
      destinationBuildingId: destination.id,
      priority,
      state: 'waiting',
    }
    return { type: 'logistics-order-created', orderId: id }
  }

  private findSource(
    snapshot: SimulationSnapshot,
    destination: BuildingEntity,
    resource: ResourceKind,
    accepts: (available: number) => boolean,
  ): { building: BuildingEntity; available: number } | undefined {
    const orders = Object.values(snapshot.logisticsOrders)
    return Object.values(snapshot.buildings)
      .map((candidate) => {
        const reserved = orders
          .filter((order) => isActive(order)
            && order.sourceBuildingId === candidate.id
            && order.resource === resource
            && order.state !== 'in_transit')
          .reduce((total, order) => total + order.amount, 0)
        return {
          building: candidate,
          available: Math.max(0, inventoryAmount(candidate, resource) - reserved),
        }
      })
      .filter(({ building: candidate, available }) => candidate.id !== destination.id
        && accepts(available)
        && Boolean(this.routePlanner.findRoute(
          snapshot.cells,
          candidate.entrance,
          destination.entrance,
        )))
      .sort((left, right) => {
        return right.available - left.available
          || left.building.id.localeCompare(right.building.id)
      })[0]
  }

  private assignWaitingOrders(snapshot: SimulationSnapshot): void {
    const freeCarriers = Object.values(snapshot.agents)
      .filter((agent) => isCarrier(agent) && agent.activity === 'idle')
      .sort((a, b) => a.id.localeCompare(b.id))
    const waitingOrders = Object.values(snapshot.logisticsOrders)
      .filter((order) => order.state === 'waiting')
      .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id))

    for (const order of waitingOrders) {
      const carrier = freeCarriers.shift()
      if (!carrier) return
      const source = snapshot.buildings[order.sourceBuildingId]
      if (!source || inventoryAmount(source, order.resource) < order.amount) {
        order.state = 'cancelled'
        continue
      }
      const route = this.routePlanner.findRoute(snapshot.cells, carrier.position, source.entrance)
      if (!route) {
        freeCarriers.unshift(carrier)
        continue
      }

      order.state = 'assigned'
      order.carrierId = carrier.id
      carrier.activity = 'delivering'
      carrier.path = route
      carrier.pathIndex = 0
    }
  }

  private advanceCarriers(snapshot: SimulationSnapshot): void {
    const orders = Object.values(snapshot.logisticsOrders)
      .filter((order) => order.state === 'assigned' || order.state === 'in_transit')
      .sort((a, b) => a.id.localeCompare(b.id))

    for (const order of orders) {
      const carrier = order.carrierId ? snapshot.agents[order.carrierId] : undefined
      if (!carrier) {
        order.state = 'waiting'
        delete order.carrierId
        continue
      }

      if (carrier.pathIndex < carrier.path.length - 1) {
        carrier.pathIndex += 1
        carrier.position = { ...carrier.path[carrier.pathIndex] }
      }
      if (carrier.pathIndex < carrier.path.length - 1) continue

      if (order.state === 'assigned') this.pickUp(snapshot, order, carrier)
      else this.deliver(snapshot, order, carrier)
    }
  }

  private pickUp(
    snapshot: SimulationSnapshot,
    order: LogisticsOrder,
    carrier: AgentEntity,
  ): void {
    const source = snapshot.buildings[order.sourceBuildingId]
    const destination = snapshot.buildings[order.destinationBuildingId]
    if (!source || !destination
      || !removeInventory(source, order.resource, order.amount).ok) {
      this.cancel(order, carrier)
      return
    }

    const route = this.routePlanner.findRoute(snapshot.cells, source.entrance, destination.entrance)
    if (!route) {
      addInventory(source, this.definitions[source.type], order.resource, order.amount)
      this.cancel(order, carrier)
      return
    }

    order.state = 'in_transit'
    carrier.path = route
    carrier.pathIndex = 0
    carrier.position = { ...route[0] }
  }

  private deliver(
    snapshot: SimulationSnapshot,
    order: LogisticsOrder,
    carrier: AgentEntity,
  ): void {
    const destination = snapshot.buildings[order.destinationBuildingId]
    if (!destination
      || !addInventory(
        destination,
        this.definitions[destination.type],
        order.resource,
        order.amount,
      ).ok) {
      // Cargo remains represented by the in-transit order until capacity is available.
      return
    }

    order.state = 'delivered'
    carrier.activity = 'idle'
    carrier.path = []
    carrier.pathIndex = 0
  }

  private cancel(order: LogisticsOrder, carrier: AgentEntity): void {
    order.state = 'cancelled'
    delete order.carrierId
    carrier.activity = 'idle'
    carrier.path = []
    carrier.pathIndex = 0
  }

  private updateEfficiency(snapshot: SimulationSnapshot): void {
    const orders = Object.values(snapshot.logisticsOrders)
    const resolved = orders.filter((order) => order.state === 'delivered' || order.state === 'cancelled')
    snapshot.metrics.logisticsEfficiency = resolved.length === 0
      ? 100
      : (resolved.filter((order) => order.state === 'delivered').length / resolved.length) * 100
  }
}
