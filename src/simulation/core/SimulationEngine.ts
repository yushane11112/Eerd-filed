import type {
  AgentEntity,
  BuildingDefinition,
  BuildingEntity,
  EntityId,
  HouseholdState,
  SimulationEvent,
  SimulationSnapshot,
  SimulationSystem,
} from '../contracts'
import { DeterministicRandom } from './random'

export interface SimulationEngineOptions {
  buildingDefinitions?: Record<string, BuildingDefinition>
  systems?: SimulationSystem[]
  ticksPerSecond?: number
  migrationIntervalTicks?: number
  householdSize?: readonly [min: number, max: number]
  initialSatisfaction?: number
  migrationOutThreshold?: number
}

export interface SimulationAdvanceResult {
  ticks: number
  events: SimulationEvent[]
}

const VALID_SPEEDS = new Set([0, 1, 2, 4])

export class SimulationEngine {
  private state: SimulationSnapshot
  private readonly definitions: Record<string, BuildingDefinition>
  private readonly systems: SimulationSystem[]
  private readonly tickDurationMs: number
  private readonly migrationIntervalTicks: number
  private readonly householdSize: readonly [number, number]
  private readonly initialSatisfaction: number
  private readonly migrationOutThreshold: number
  private accumulatedMs = 0

  constructor(snapshot: SimulationSnapshot, options: SimulationEngineOptions = {}) {
    this.state = structuredClone(snapshot)
    this.definitions = options.buildingDefinitions ?? {}
    this.systems = options.systems ?? []
    const ticksPerSecond = options.ticksPerSecond ?? 5
    if (!Number.isFinite(ticksPerSecond) || ticksPerSecond <= 0) {
      throw new RangeError('ticksPerSecond must be greater than zero')
    }
    this.tickDurationMs = 1_000 / ticksPerSecond
    this.migrationIntervalTicks = positiveInteger(
      options.migrationIntervalTicks ?? ticksPerSecond * 4,
      'migrationIntervalTicks',
    )
    this.householdSize = options.householdSize ?? [2, 4]
    if (
      this.householdSize[0] < 1
      || this.householdSize[1] < this.householdSize[0]
    ) {
      throw new RangeError('householdSize must contain valid positive bounds')
    }
    this.initialSatisfaction = clamp(options.initialSatisfaction ?? 70, 0, 100)
    this.migrationOutThreshold = clamp(options.migrationOutThreshold ?? 20, 0, 100)
    this.setSpeed(this.state.speed)
    this.recalculateMetrics()
  }

  get snapshot(): SimulationSnapshot {
    return structuredClone(this.state)
  }

  setSpeed(speed: 0 | 1 | 2 | 4): void {
    if (!VALID_SPEEDS.has(speed)) {
      throw new RangeError('speed must be 0, 1, 2, or 4')
    }
    this.state.speed = speed
  }

  pause(): void {
    this.setSpeed(0)
  }

  advance(elapsedMs: number): SimulationAdvanceResult {
    if (!Number.isFinite(elapsedMs) || elapsedMs < 0) {
      throw new RangeError('elapsedMs must be a non-negative finite number')
    }
    if (this.state.speed === 0) {
      return { ticks: 0, events: [] }
    }

    this.accumulatedMs += elapsedMs * this.state.speed
    const ticks = Math.floor(this.accumulatedMs / this.tickDurationMs)
    this.accumulatedMs -= ticks * this.tickDurationMs
    return { ticks, events: this.runTicks(ticks) }
  }

  step(ticks = 1): SimulationEvent[] {
    return this.runTicks(positiveInteger(ticks, 'ticks'))
  }

  private runTicks(ticks: number): SimulationEvent[] {
    const events: SimulationEvent[] = []
    for (let index = 0; index < ticks; index += 1) {
      events.push(...this.runTick())
    }
    return events
  }

  private runTick(): SimulationEvent[] {
    this.state.tick += 1
    const events: SimulationEvent[] = []

    this.updateHouseholdNeedsAndSatisfaction()
    events.push(...this.migrateOutDissatisfiedHouseholds())
    this.matchEmployment()

    if (this.state.tick % this.migrationIntervalTicks === 0) {
      const migrated = this.migrateInHousehold()
      if (migrated) events.push(migrated)
      this.matchEmployment()
    }

    for (const system of this.systems) {
      events.push(...system.update(this.state))
    }
    this.recalculateMetrics()
    return events
  }

  private migrateInHousehold(): SimulationEvent | undefined {
    const random = new DeterministicRandom(this.state.seed)
    const members = random.integer(this.householdSize[0], this.householdSize[1])
    const home = this.findAvailableHome(members)
    if (!home) {
      this.state.seed = random.seed
      return undefined
    }
    const householdId = this.uniqueId('household', random)
    const workerCount = Math.max(1, Math.floor(members / 2))
    const workerIds: EntityId[] = []

    for (let index = 0; index < workerCount; index += 1) {
      const workerId = this.uniqueId('worker', random)
      workerIds.push(workerId)
      this.state.agents[workerId] = {
        id: workerId,
        role: 'worker',
        householdId,
        position: { ...home.entrance },
        path: [],
        pathIndex: 0,
        activity: 'home',
      }
    }

    this.state.households[householdId] = {
      id: householdId,
      homeBuildingId: home.id,
      members,
      workerIds,
      income: 0,
      satisfaction: this.initialSatisfaction,
      needs: {
        food: 100,
        goods: 100,
        health: 100,
        education: 100,
        entertainment: 100,
      },
    }
    this.state.seed = random.seed
    return { type: 'household-migrated', householdId, direction: 'in' }
  }

  private migrateOutDissatisfiedHouseholds(): SimulationEvent[] {
    const events: SimulationEvent[] = []
    const leaving = Object.values(this.state.households)
      .filter((household) => household.satisfaction <= this.migrationOutThreshold)
      .sort(byId)

    for (const household of leaving) {
      for (const workerId of household.workerIds) {
        const employerId = this.state.agents[workerId]?.employerBuildingId
        if (employerId) {
          const employer = this.state.buildings[employerId]
          if (employer) {
            employer.workers = employer.workers.filter((id) => id !== workerId)
          }
        }
        delete this.state.agents[workerId]
      }
      delete this.state.households[household.id]
      events.push({
        type: 'household-migrated',
        householdId: household.id,
        direction: 'out',
      })
    }
    return events
  }

  private matchEmployment(): void {
    const employers = Object.values(this.state.buildings)
      .filter((building) => this.jobCapacity(building) > 0)
      .sort(byId)
    const workers = Object.values(this.state.agents)
      .filter((agent) => agent.role === 'worker')
      .sort(byId)

    for (const employer of employers) {
      employer.workers = employer.workers.filter((workerId) => {
        const worker = this.state.agents[workerId]
        return worker?.role === 'worker' && worker.employerBuildingId === employer.id
      })
    }

    for (const worker of workers) {
      if (
        worker.employerBuildingId
        && this.state.buildings[worker.employerBuildingId]
      ) {
        continue
      }
      delete worker.employerBuildingId
      const employer = employers.find(
        (candidate) => candidate.workers.length < this.jobCapacity(candidate),
      )
      if (!employer) {
        worker.activity = 'home'
        continue
      }
      worker.employerBuildingId = employer.id
      worker.activity = 'commuting'
      employer.workers.push(worker.id)
    }
  }

  private updateHouseholdNeedsAndSatisfaction(): void {
    for (const household of Object.values(this.state.households).sort(byId)) {
      household.needs.food = clamp(household.needs.food - 0.08, 0, 100)
      household.needs.goods = clamp(household.needs.goods - 0.03, 0, 100)
      household.needs.health = clamp(household.needs.health - 0.01, 0, 100)
      household.needs.education = clamp(household.needs.education - 0.01, 0, 100)
      household.needs.entertainment = clamp(
        household.needs.entertainment - 0.02,
        0,
        100,
      )

      const employed = household.workerIds.filter(
        (id) => Boolean(this.state.agents[id]?.employerBuildingId),
      ).length
      const employmentRatio = employed / Math.max(1, household.workerIds.length)
      const needsAverage = average(Object.values(household.needs))
      const target = needsAverage * 0.65 + employmentRatio * 35
      household.satisfaction = clamp(
        household.satisfaction + (target - household.satisfaction) * 0.05,
        0,
        100,
      )
      household.income = employed * 10
    }
  }

  private findAvailableHome(requiredCapacity: number): BuildingEntity | undefined {
    const occupancy = new Map<EntityId, number>()
    for (const household of Object.values(this.state.households)) {
      occupancy.set(
        household.homeBuildingId,
        (occupancy.get(household.homeBuildingId) ?? 0) + household.members,
      )
    }
    return Object.values(this.state.buildings)
      .filter((building) => {
        const definition = this.definitions[building.type]
        return (
          definition?.category === 'housing'
          && building.status !== 'constructing'
          && building.status !== 'upgrading'
          && (occupancy.get(building.id) ?? 0) + requiredCapacity <= definition.capacity
        )
      })
      .sort(byId)[0]
  }

  private jobCapacity(building: BuildingEntity): number {
    if (building.status === 'constructing' || building.status === 'upgrading') {
      return 0
    }
    return this.definitions[building.type]?.jobs ?? 0
  }

  private recalculateMetrics(): void {
    const households = Object.values(this.state.households)
    const agents = Object.values(this.state.agents)
    const jobCapacity = Object.values(this.state.buildings).reduce(
      (total, building) => total + this.jobCapacity(building),
      0,
    )
    const employedWorkers = agents.filter(
      (agent) => agent.role === 'worker' && agent.employerBuildingId,
    ).length
    const housingCapacity = Object.values(this.state.buildings).reduce(
      (total, building) => {
        const definition = this.definitions[building.type]
        return total + (definition?.category === 'housing' ? definition.capacity : 0)
      },
      0,
    )

    this.state.metrics = {
      population: households.reduce((total, household) => total + household.members, 0),
      households: households.length,
      employedWorkers,
      availableJobs: Math.max(0, jobCapacity - employedWorkers),
      housingCapacity,
      satisfaction: households.length === 0
        ? 100
        : average(households.map((household) => household.satisfaction)),
      logisticsEfficiency: this.state.metrics.logisticsEfficiency,
    }
  }

  private uniqueId(prefix: string, random: DeterministicRandom): string {
    let id: string
    do {
      id = `${prefix}-${this.state.tick}-${random.integer(0, 0xffff_ffff).toString(36)}`
    } while (
      this.state.households[id]
      || this.state.agents[id]
      || this.state.buildings[id]
    )
    return id
  }
}

function average(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function positiveInteger(value: number, name: string): number {
  if (!Number.isInteger(value) || value < 1) {
    throw new RangeError(`${name} must be a positive integer`)
  }
  return value
}

function byId<T extends { id: string }>(left: T, right: T): number {
  return left.id.localeCompare(right.id)
}
