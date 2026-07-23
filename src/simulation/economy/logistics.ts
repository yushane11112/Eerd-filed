import type {
  AgentEntity,
  BuildingDefinition,
  BuildingEntity,
  EntityId,
  GridPoint,
  LogisticsFailureReason,
  LogisticsOrder,
  LogisticsUnloadCapacityBreakdown,
  ResourceKind,
  SimulationEvent,
  SimulationSnapshot,
  SimulationSystem,
  WorldCell,
} from '../contracts'
import { activeWorkerCount } from '../core/workforce'
import type { ServiceRule } from './service'
import {
  addInventory,
  inventoryAmount,
  inventoryFreeCapacity,
  removeInventory,
} from './inventory'
import { effectiveBuildingDefinition } from './upgrades'
import { findMovementPath } from '../world/movementPath'

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
  unloadCapacityPerTick?: number
  idFactory?: () => EntityId
  completedOrderRetention?: number
}

const samePoint = (left: GridPoint, right: GridPoint): boolean => left.x === right.x && left.y === right.y
const resourceOrderKey = (buildingId: EntityId, resource: ResourceKind): string => (
  `${buildingId}:${resource}`
)

export class RoadRoutePlanner implements RoutePlanner {
  findRoute(cells: readonly WorldCell[], from: GridPoint, to: GridPoint): GridPoint[] | undefined {
    if (samePoint(from, to)) return [{ ...from }]

    return findMovementPath(from, to, cells, {
      fallback: 'none',
      requireRoad: true,
      roadPreference: 'prefer-road',
    })
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

function logisticsFailureReason(resource: ResourceKind, reason: LogisticsFailureReason): string {
  return `logistics-failed:${resource}:${reason}`
}

function isLogisticsFailure(reason: string | undefined): boolean {
  return Boolean(reason?.startsWith('logistics-failed:'))
}

function addToMap<K>(map: Map<K, number>, key: K, amount: number): void {
  map.set(key, (map.get(key) ?? 0) + amount)
}

interface ActiveOrderIndexes {
  destinationResourceInbound: Map<string, number>
  destinationInboundCapacity: Map<EntityId, number>
  sourceResourceReserved: Map<string, number>
}

interface UnloadThroughputState {
  unloadedByDestination: Map<EntityId, number>
  touchedDestinations: Set<EntityId>
  capacityByDestination: Map<EntityId, number>
  capacityBreakdownByDestination: Map<EntityId, LogisticsUnloadCapacityBreakdown>
}

export class LogisticsSystem implements SimulationSystem {
  readonly id = 'economy.logistics'
  private readonly definitions: Readonly<Record<string, BuildingDefinition>>
  private readonly routePlanner: RoutePlanner
  private readonly maxShipment: number
  private readonly inputTargetBatches: number
  private readonly serviceRules: Readonly<Record<string, ServiceRule>>
  private readonly serviceTargetBatches: number
  private readonly unloadCapacityPerTick: number | undefined
  private readonly idFactory: () => EntityId
  private readonly completedOrderRetention: number
  private sequence = 0

  constructor(options: LogisticsSystemOptions) {
    this.definitions = options.definitions
    this.routePlanner = options.routePlanner ?? new RoadRoutePlanner()
    this.maxShipment = options.maxShipment ?? 10
    this.inputTargetBatches = options.inputTargetBatches ?? 2
    this.serviceRules = options.serviceRules ?? {}
    this.serviceTargetBatches = options.serviceTargetBatches ?? 3
    this.unloadCapacityPerTick = options.unloadCapacityPerTick === undefined
      ? undefined
      : Math.max(1, Math.floor(options.unloadCapacityPerTick))
    this.idFactory = options.idFactory ?? (() => `logistics-${++this.sequence}`)
    this.completedOrderRetention = Math.max(0, options.completedOrderRetention ?? 500)
  }

  update(snapshot: SimulationSnapshot): SimulationEvent[] {
    const events: SimulationEvent[] = []
    snapshot.logisticsQueues ??= {}
    events.push(...this.createOrders(snapshot))
    this.assignWaitingOrders(snapshot)
    this.advanceCarriers(snapshot, {
      unloadedByDestination: new Map(),
      touchedDestinations: new Set(),
      capacityByDestination: new Map(),
      capacityBreakdownByDestination: new Map(),
    })
    this.archiveCompletedOrders(snapshot)
    this.updateEfficiency(snapshot)
    return events
  }

  private createOrders(snapshot: SimulationSnapshot): SimulationEvent[] {
    const events: SimulationEvent[] = []
    const buildings = Object.values(snapshot.buildings).sort((a, b) => a.id.localeCompare(b.id))
    const orderIndexes = this.indexActiveOrders(snapshot)

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
            orderIndexes,
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
          orderIndexes,
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
    orderIndexes: ActiveOrderIndexes,
  ): SimulationEvent | undefined {
    const alreadyInbound = orderIndexes.destinationResourceInbound.get(
      resourceOrderKey(destination.id, resource),
    ) ?? 0
    const missing = Math.max(0, target - inventoryAmount(destination, resource) - alreadyInbound)
    if (missing === 0) return undefined

    const sourceMatch = this.findSource(
      snapshot,
      destination,
      resource,
      orderIndexes,
      requestedAvailable => (
        Math.min(missing, this.maxShipment, requestedAvailable) > 0
      ),
    )
    if (!sourceMatch.ok) {
      this.markFailure(destination, resource, sourceMatch.reason, snapshot.tick)
      return undefined
    }

    const inboundCapacityReserved = orderIndexes.destinationInboundCapacity.get(destination.id) ?? 0
    const amount = Math.min(
      missing,
      this.maxShipment,
      sourceMatch.value.available,
      Math.max(
        0,
        inventoryFreeCapacity(destination, this.effectiveDefinition(destination))
          - inboundCapacityReserved,
      ),
    )
    if (amount <= 0) {
      this.markFailure(destination, resource, 'destination-capacity', snapshot.tick)
      return undefined
    }

    const id = this.idFactory()
    snapshot.logisticsOrders[id] = {
      id,
      resource,
      amount,
      sourceBuildingId: sourceMatch.value.building.id,
      destinationBuildingId: destination.id,
      priority,
      state: 'waiting',
    }
    this.addOrderToIndexes(snapshot.logisticsOrders[id], orderIndexes)
    this.clearFailure(destination, resource)
    return { type: 'logistics-order-created', orderId: id }
  }

  private findSource(
    snapshot: SimulationSnapshot,
    destination: BuildingEntity,
    resource: ResourceKind,
    orderIndexes: ActiveOrderIndexes,
    accepts: (available: number) => boolean,
  ): {
    ok: true
    value: { building: BuildingEntity; available: number }
  } | {
    ok: false
    reason: LogisticsFailureReason
  } {
    const candidates = Object.values(snapshot.buildings)
      .map((candidate) => {
        const reserved = orderIndexes.sourceResourceReserved.get(
          resourceOrderKey(candidate.id, resource),
        ) ?? 0
        const stock = inventoryAmount(candidate, resource)
        return {
          building: candidate,
          stock,
          available: Math.max(0, stock - reserved),
        }
      })
      .filter(({ building: candidate }) => candidate.id !== destination.id)

    const stocked = candidates.filter(({ stock }) => stock > 0)
    if (stocked.length === 0) return { ok: false, reason: 'no-source-inventory' }

    const available = stocked.filter((candidate) => accepts(candidate.available))
    if (available.length === 0) return { ok: false, reason: 'source-inventory-insufficient' }

    const reachable = available.filter(({ building: candidate }) => (
      Boolean(this.routePlanner.findRoute(
        snapshot.cells,
        candidate.entrance,
        destination.entrance,
      ))
    ))
    if (reachable.length === 0) return { ok: false, reason: 'no-route' }

    return {
      ok: true,
      value: reachable
        .sort((left, right) => {
          return right.available - left.available
            || left.building.id.localeCompare(right.building.id)
        })[0],
    }
  }

  private indexActiveOrders(snapshot: SimulationSnapshot): ActiveOrderIndexes {
    const indexes: ActiveOrderIndexes = {
      destinationResourceInbound: new Map(),
      destinationInboundCapacity: new Map(),
      sourceResourceReserved: new Map(),
    }
    for (const order of Object.values(snapshot.logisticsOrders)) {
      this.addOrderToIndexes(order, indexes)
    }
    return indexes
  }

  private addOrderToIndexes(order: LogisticsOrder, indexes: ActiveOrderIndexes): void {
    if (!isActive(order)) return
    addToMap(
      indexes.destinationResourceInbound,
      resourceOrderKey(order.destinationBuildingId, order.resource),
      order.amount,
    )
    addToMap(indexes.destinationInboundCapacity, order.destinationBuildingId, order.amount)
    if (order.state !== 'in_transit') {
      addToMap(
        indexes.sourceResourceReserved,
        resourceOrderKey(order.sourceBuildingId, order.resource),
        order.amount,
      )
    }
  }

  private assignWaitingOrders(snapshot: SimulationSnapshot): void {
    const freeCarriers = Object.values(snapshot.agents)
      .filter((agent) => isCarrier(agent) && agent.activity === 'idle')
      .sort((a, b) => a.id.localeCompare(b.id))
    const waitingOrders = Object.values(snapshot.logisticsOrders)
      .filter((order) => order.state === 'waiting')
      .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id))

    if (freeCarriers.length === 0) {
      for (const order of waitingOrders) {
        this.markOrderFailure(order, 'no-carrier')
        const destination = snapshot.buildings[order.destinationBuildingId]
        if (destination) this.markFailure(destination, order.resource, 'no-carrier', snapshot.tick)
      }
      return
    }

    for (const order of waitingOrders) {
      const carrier = freeCarriers.shift()
      if (!carrier) return
      const source = snapshot.buildings[order.sourceBuildingId]
      if (!source || inventoryAmount(source, order.resource) < order.amount) {
        const destination = snapshot.buildings[order.destinationBuildingId]
        if (destination) this.markFailure(destination, order.resource, 'source-inventory-insufficient', snapshot.tick)
        this.markOrderCancelled(order, 'source-inventory-insufficient')
        order.state = 'cancelled'
        continue
      }
      const route = this.routePlanner.findRoute(snapshot.cells, carrier.position, source.entrance)
      if (!route) {
        const destination = snapshot.buildings[order.destinationBuildingId]
        if (destination) this.markFailure(destination, order.resource, 'no-route', snapshot.tick)
        this.markOrderFailure(order, 'no-route')
        freeCarriers.unshift(carrier)
        continue
      }

      order.state = 'assigned'
      order.carrierId = carrier.id
      this.clearOrderFailure(order)
      carrier.activity = 'delivering'
      carrier.path = route
      carrier.pathIndex = 0
      carrier.cargoIntent = {
        orderId: order.id,
        resource: order.resource,
        amount: order.amount,
        sourceBuildingId: order.sourceBuildingId,
        destinationBuildingId: order.destinationBuildingId,
        phase: 'pickup',
      }
      const destination = snapshot.buildings[order.destinationBuildingId]
      if (destination) this.clearFailure(destination, order.resource)
    }
  }

  private advanceCarriers(
    snapshot: SimulationSnapshot,
    unloadState: UnloadThroughputState,
  ): void {
    const orders = Object.values(snapshot.logisticsOrders)
      .filter((order) => order.state === 'assigned' || order.state === 'in_transit')
      .sort((a, b) => a.id.localeCompare(b.id))

    for (const order of orders) {
      const carrier = order.carrierId ? snapshot.agents[order.carrierId] : undefined
      if (!carrier) {
        order.state = 'waiting'
        delete order.carrierId
        this.markOrderFailure(order, 'no-carrier')
        continue
      }

      if (carrier.pathIndex < carrier.path.length - 1) {
        carrier.pathIndex += 1
        carrier.position = { ...carrier.path[carrier.pathIndex] }
      }
      if (carrier.pathIndex < carrier.path.length - 1) continue

      if (order.state === 'assigned') this.pickUp(snapshot, order, carrier)
      else this.deliver(snapshot, order, carrier, unloadState)
    }

    for (const buildingId of Object.keys(snapshot.logisticsQueues ?? {})) {
      if (!unloadState.touchedDestinations.has(buildingId)) {
        delete snapshot.logisticsQueues?.[buildingId]
      }
    }
  }

  private pickUp(
    snapshot: SimulationSnapshot,
    order: LogisticsOrder,
    carrier: AgentEntity,
  ): void {
    const source = snapshot.buildings[order.sourceBuildingId]
    const destination = snapshot.buildings[order.destinationBuildingId]
    if (!source || !destination) {
      if (destination) this.markFailure(destination, order.resource, 'no-source-inventory', snapshot.tick)
      this.cancel(order, carrier, 'no-source-inventory')
      return
    }
    if (!removeInventory(source, order.resource, order.amount).ok) {
      this.markFailure(destination, order.resource, 'source-inventory-insufficient', snapshot.tick)
      this.cancel(order, carrier, 'source-inventory-insufficient')
      return
    }

    const route = this.routePlanner.findRoute(snapshot.cells, source.entrance, destination.entrance)
    if (!route) {
      addInventory(source, this.effectiveDefinition(source), order.resource, order.amount)
      this.markFailure(destination, order.resource, 'no-route', snapshot.tick)
      this.cancel(order, carrier, 'no-route')
      return
    }

    order.state = 'in_transit'
    this.clearOrderFailure(order)
    carrier.path = route
    carrier.pathIndex = 0
    carrier.position = { ...route[0] }
    carrier.cargoIntent = {
      orderId: order.id,
      resource: order.resource,
      amount: order.amount,
      sourceBuildingId: order.sourceBuildingId,
      destinationBuildingId: order.destinationBuildingId,
      phase: 'dropoff',
    }
  }

  private deliver(
    snapshot: SimulationSnapshot,
    order: LogisticsOrder,
    carrier: AgentEntity,
    unloadState: UnloadThroughputState,
  ): void {
    const destination = snapshot.buildings[order.destinationBuildingId]
    if (!destination) {
      return
    }
    const unloadedThisTick = unloadState.unloadedByDestination.get(destination.id) ?? 0
    const unloadCapacity = this.resolveUnloadCapacity(snapshot, destination, unloadState)
    if (unloadedThisTick >= unloadCapacity) {
      order.throughputQueuedSinceTick ??= snapshot.tick
      this.markFailure(destination, order.resource, 'destination-throughput', snapshot.tick)
      this.markOrderFailure(order, 'destination-throughput')
      this.recordLogisticsQueue(snapshot, destination, unloadState)
      return
    }
    if (!addInventory(
        destination,
        this.effectiveDefinition(destination),
        order.resource,
        order.amount,
      ).ok) {
      // Cargo remains represented by the in-transit order until capacity is available.
      this.markFailure(destination, order.resource, 'destination-capacity', snapshot.tick)
      this.markOrderFailure(order, 'destination-capacity')
      return
    }

    unloadState.unloadedByDestination.set(destination.id, unloadedThisTick + 1)
    order.state = 'delivered'
    this.clearOrderFailure(order)
    carrier.activity = 'idle'
    carrier.path = []
    carrier.pathIndex = 0
    delete carrier.cargoIntent
    this.clearFailure(destination, order.resource)
    this.recordLogisticsQueue(snapshot, destination, unloadState)
  }

  private recordLogisticsQueue(
    snapshot: SimulationSnapshot,
    destination: BuildingEntity,
    unloadState: UnloadThroughputState,
  ): void {
    snapshot.logisticsQueues ??= {}
    unloadState.touchedDestinations.add(destination.id)
    const waitingOrders = Object.values(snapshot.logisticsOrders)
      .filter((order) => (
        order.destinationBuildingId === destination.id
        && order.state === 'in_transit'
        && order.failureReason === 'destination-throughput'
      ))
      .sort((left, right) => (
        (left.throughputQueuedSinceTick ?? snapshot.tick) - (right.throughputQueuedSinceTick ?? snapshot.tick)
        || left.id.localeCompare(right.id)
      ))
    snapshot.logisticsQueues[destination.id] = {
      buildingId: destination.id,
      unloadCapacityPerTick: this.resolveUnloadCapacity(snapshot, destination, unloadState),
      unloadCapacityBreakdown: this.resolveUnloadCapacityBreakdown(snapshot, destination, unloadState),
      unloadedThisTick: unloadState.unloadedByDestination.get(destination.id) ?? 0,
      waitingToUnloadCount: waitingOrders.length,
      longestWaitTicks: waitingOrders.reduce((max, order) => (
        Math.max(max, Math.max(0, snapshot.tick - (order.throughputQueuedSinceTick ?? snapshot.tick)))
      ), 0),
      waitingOrderIds: waitingOrders.slice(0, 12).map((order) => order.id),
    }
  }

  private cancel(
    order: LogisticsOrder,
    carrier: AgentEntity,
    reason: LogisticsFailureReason,
  ): void {
    order.state = 'cancelled'
    delete order.carrierId
    this.markOrderCancelled(order, reason)
    carrier.activity = 'idle'
    carrier.path = []
    carrier.pathIndex = 0
    delete carrier.cargoIntent
  }

  private markOrderFailure(order: LogisticsOrder, reason: LogisticsFailureReason): void {
    order.failureReason = reason
  }

  private markOrderCancelled(order: LogisticsOrder, reason: LogisticsFailureReason): void {
    order.cancelReason = reason
    delete order.failureReason
  }

  private clearOrderFailure(order: LogisticsOrder): void {
    delete order.failureReason
    delete order.throughputQueuedSinceTick
  }

  private markFailure(
    building: BuildingEntity,
    resource: ResourceKind,
    reason: LogisticsFailureReason,
    tick: number,
  ): void {
    const nextReason = logisticsFailureReason(resource, reason)
    if (building.statusReason !== nextReason) {
      building.blockedSinceTick = tick
    }
    building.statusReason = nextReason
  }

  private effectiveDefinition(building: BuildingEntity): BuildingDefinition {
    return effectiveBuildingDefinition(this.definitions[building.type], building)
  }

  private resolveUnloadCapacity(
    snapshot: SimulationSnapshot,
    destination: BuildingEntity,
    unloadState: UnloadThroughputState,
  ): number {
    const existing = unloadState.capacityByDestination.get(destination.id)
    if (existing !== undefined) return existing

    const capacity = this.unloadCapacityPerTick ?? this.deriveBuildingUnloadCapacity(snapshot, destination)
    unloadState.capacityByDestination.set(destination.id, capacity)
    return capacity
  }

  private resolveUnloadCapacityBreakdown(
    snapshot: SimulationSnapshot,
    destination: BuildingEntity,
    unloadState: UnloadThroughputState,
  ): LogisticsUnloadCapacityBreakdown {
    const existing = unloadState.capacityBreakdownByDestination.get(destination.id)
    if (existing !== undefined) return existing

    const breakdown = this.unloadCapacityPerTick === undefined
      ? this.deriveBuildingUnloadCapacityBreakdown(snapshot, destination)
      : {
          source: 'override' as const,
          base: this.unloadCapacityPerTick,
          levelBonus: 0,
          workerBonus: 0,
          entranceBonus: 0,
          roadAccess: this.countRoadAccess(snapshot, destination),
          workerCount: activeWorkerCount(snapshot, destination),
          cappedAt: this.unloadCapacityPerTick,
          total: this.unloadCapacityPerTick,
        }
    unloadState.capacityBreakdownByDestination.set(destination.id, breakdown)
    return breakdown
  }

  private deriveBuildingUnloadCapacity(snapshot: SimulationSnapshot, destination: BuildingEntity): number {
    return this.deriveBuildingUnloadCapacityBreakdown(snapshot, destination).total
  }

  private deriveBuildingUnloadCapacityBreakdown(
    snapshot: SimulationSnapshot,
    destination: BuildingEntity,
  ): LogisticsUnloadCapacityBreakdown {
    const definition = this.definitions[destination.type]
    const category = definition?.category
    const base = category === 'harbor'
      ? 4
      : category === 'storage'
        ? 3
        : category === 'market' || category === 'service' || category === 'production'
          ? 2
          : 1
    const levelBonus = Math.floor(Math.max(0, destination.level - 1) / 3)
    const workerCount = activeWorkerCount(snapshot, destination)
    const workerBonus = Math.floor(workerCount / 6)
    const roadAccess = this.countRoadAccess(snapshot, destination)
    const entranceBonus = Math.min(2, Math.max(0, roadAccess - 1))
    const cappedAt = 8
    const total = Math.max(1, Math.min(cappedAt, base + levelBonus + workerBonus + entranceBonus))
    return {
      source: 'building',
      ...(category ? { category } : {}),
      base,
      levelBonus,
      workerBonus,
      entranceBonus,
      roadAccess,
      workerCount,
      cappedAt,
      total,
    }
  }

  private countRoadAccess(snapshot: SimulationSnapshot, building: BuildingEntity): number {
    const points = [
      { x: building.entrance.x + 1, y: building.entrance.y },
      { x: building.entrance.x - 1, y: building.entrance.y },
      { x: building.entrance.x, y: building.entrance.y + 1 },
      { x: building.entrance.x, y: building.entrance.y - 1 },
    ]
    return points.filter((point) => {
      const cell = snapshot.cells.find((candidate) => samePoint(candidate.point, point))
      return Boolean(cell?.road)
    }).length
  }

  private clearFailure(building: BuildingEntity, resource: ResourceKind): void {
    if (building.statusReason?.startsWith(`logistics-failed:${resource}:`)) {
      delete building.statusReason
      delete building.blockedSinceTick
      delete building.blockedAuditBaseline
    }
  }

  private archiveCompletedOrders(snapshot: SimulationSnapshot): void {
    const completed = Object.values(snapshot.logisticsOrders)
      .filter((order) => order.state === 'delivered' || order.state === 'cancelled')
      .sort((left, right) => left.id.localeCompare(right.id))
    const archiveCount = Math.max(0, completed.length - this.completedOrderRetention)
    if (archiveCount === 0) return

    snapshot.logisticsArchive ??= {
      archivedOrders: 0,
      delivered: 0,
      cancelled: 0,
      cancelReasons: {},
    }
    for (const order of completed.slice(0, archiveCount)) {
      snapshot.logisticsArchive.archivedOrders += 1
      if (order.state === 'delivered') {
        snapshot.logisticsArchive.delivered += 1
      } else {
        snapshot.logisticsArchive.cancelled += 1
        if (order.cancelReason) {
          snapshot.logisticsArchive.cancelReasons[order.cancelReason] = (
            snapshot.logisticsArchive.cancelReasons[order.cancelReason] ?? 0
          ) + 1
        }
      }
      delete snapshot.logisticsOrders[order.id]
    }
  }

  private updateEfficiency(snapshot: SimulationSnapshot): void {
    const orders = Object.values(snapshot.logisticsOrders)
    const archive = snapshot.logisticsArchive
    const delivered = orders.filter((order) => order.state === 'delivered').length
      + (archive?.delivered ?? 0)
    const cancelled = orders.filter((order) => order.state === 'cancelled')
    const cancelledDestinations = new Set(cancelled.map((order) => order.destinationBuildingId))
    const failedBuildings = Object.values(snapshot.buildings).filter((building) => (
      isLogisticsFailure(building.statusReason) && !cancelledDestinations.has(building.id)
    ))
    const failed = cancelled.length + (archive?.cancelled ?? 0) + failedBuildings.length
    snapshot.metrics.logisticsEfficiency = delivered + failed === 0
      ? 100
      : (delivered / (delivered + failed)) * 100
  }
}
