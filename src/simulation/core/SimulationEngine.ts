import type {
  AgentEntity,
  BuildingDefinition,
  BuildingEntity,
  EntityId,
  HouseholdState,
  MigrationCandidateState,
  SimulationEvent,
  SimulationSnapshot,
  SimulationSystem,
} from '../contracts'
import { DeterministicRandom } from './random'
import { effectiveBuildingDefinition } from '../economy/upgrades'
import { buildMovementPath } from '../world/movementPath'

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
const CRITICAL_NEED_THRESHOLD = 35
const MAX_CRITICAL_NEED_PENALTY_PER_NEED = 3
const MAX_UNEMPLOYMENT_PENALTY = 2
const MIGRATION_MIN_ATTRACTION = 35
const MIGRATION_SETTLE_ATTRACTION = 45
const MIGRATION_LEAVE_ATTRACTION = 20
const MIGRATION_PATIENCE_TICKS = 3
const WORK_SHIFT_TICKS = 4

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
    this.state.migrationCandidates ??= {}
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
    this.advanceWorkerCommutes()
    this.updateWorkerShifts()
    this.matchEmployment()
    events.push(...this.updateMigrationCandidates())

    if (this.state.tick % this.migrationIntervalTicks === 0) {
      const arrived = this.createMigrationCandidate()
      if (arrived) events.push(arrived)
      this.matchEmployment()
    }

    for (const system of this.systems) {
      events.push(...system.update(this.state))
    }
    events.push(...this.migrateOutDissatisfiedHouseholds())
    this.recalculateMetrics()
    return events
  }

  private createMigrationCandidate(): SimulationEvent | undefined {
    const attraction = this.calculateCityAttraction()
    if (attraction < MIGRATION_MIN_ATTRACTION) return undefined

    const random = new DeterministicRandom(this.state.seed)
    const members = random.integer(this.householdSize[0], this.householdSize[1])
    const workerCount = Math.max(1, Math.floor(members / 2))
    const candidateId = this.uniqueId('migrant', random)
    const home = this.findAvailableHome(members)

    this.state.migrationCandidates ??= {}
    this.state.migrationCandidates[candidateId] = {
      id: candidateId,
      members,
      workerCount,
      status: 'waiting',
      position: this.findMigrationArrivalPoint(home),
      targetHomeBuildingId: home?.id,
      arrivedTick: this.state.tick,
      patienceTicks: MIGRATION_PATIENCE_TICKS,
      attractionAtArrival: attraction,
    }
    this.state.seed = random.seed
    return {
      type: 'migration-candidate-arrived',
      candidateId,
      members,
      attraction: Math.round(attraction),
    }
  }

  private updateMigrationCandidates(): SimulationEvent[] {
    const events: SimulationEvent[] = []
    const candidates = Object.values(this.state.migrationCandidates ?? {}).sort(byId)
    for (const candidate of candidates) {
      if (candidate.status === 'walking') {
        const home = candidate.targetHomeBuildingId
          ? this.state.buildings[candidate.targetHomeBuildingId]
          : undefined
        if (!home) {
          candidate.status = 'waiting'
          candidate.path = undefined
          candidate.pathIndex = undefined
          continue
        }
        if (this.advanceMigrationCandidate(candidate)) {
          events.push(this.settleMigrationCandidate(candidate.id, home))
        }
        continue
      }

      const attraction = this.calculateCityAttraction()
      const home = this.findAvailableHome(candidate.members, candidate.id)
      candidate.targetHomeBuildingId = home?.id
      if (home && attraction >= MIGRATION_SETTLE_ATTRACTION) {
        candidate.status = 'walking'
        candidate.path = buildMovementPath(candidate.position, home.entrance, this.state.cells, {
          roadPreference: 'prefer-road',
        })
        candidate.pathIndex = 0
        continue
      }

      const waitTicks = this.state.tick - candidate.arrivedTick
      if (!home && waitTicks >= candidate.patienceTicks) {
        delete this.state.migrationCandidates?.[candidate.id]
        events.push({
          type: 'migration-candidate-left',
          candidateId: candidate.id,
          reason: 'no-housing',
        })
        continue
      }

      if (attraction < MIGRATION_LEAVE_ATTRACTION) {
        delete this.state.migrationCandidates?.[candidate.id]
        events.push({
          type: 'migration-candidate-left',
          candidateId: candidate.id,
          reason: 'low-attraction',
        })
        continue
      }

      if (waitTicks >= candidate.patienceTicks) {
        delete this.state.migrationCandidates?.[candidate.id]
        events.push({
          type: 'migration-candidate-left',
          candidateId: candidate.id,
          reason: 'wait-timeout',
        })
      }
    }
    return events
  }

  private advanceMigrationCandidate(candidate: MigrationCandidateState): boolean {
    if (!candidate.path || candidate.path.length === 0) {
      candidate.path = [candidate.position]
      candidate.pathIndex = 0
    }
    const nextIndex = Math.min(
      (candidate.pathIndex ?? 0) + 1,
      candidate.path.length - 1,
    )
    candidate.pathIndex = nextIndex
    candidate.position = { ...candidate.path[nextIndex] }
    return nextIndex >= candidate.path.length - 1
  }

  private settleMigrationCandidate(
    candidateId: EntityId,
    home: BuildingEntity,
  ): SimulationEvent {
    const candidate = this.state.migrationCandidates?.[candidateId]
    if (!candidate) {
      throw new Error(`Missing migration candidate ${candidateId}`)
    }
    const random = new DeterministicRandom(this.state.seed)
    const householdId = this.uniqueId('household', random)
    const workerIds: EntityId[] = []

    for (let index = 0; index < candidate.workerCount; index += 1) {
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
      members: candidate.members,
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
    delete this.state.migrationCandidates?.[candidateId]
    this.state.seed = random.seed
    return { type: 'household-migrated', householdId, direction: 'in' }
  }

  private migrateOutDissatisfiedHouseholds(): SimulationEvent[] {
    if (this.migrationOutThreshold <= 0) return []
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
      this.startWorkerCommute(worker, employer)
      employer.workers.push(worker.id)
    }
  }

  private startWorkerCommute(worker: AgentEntity, employer: BuildingEntity): void {
    const household = worker.householdId
      ? this.state.households[worker.householdId]
      : undefined
    const home = household ? this.state.buildings[household.homeBuildingId] : undefined
    const origin = home?.entrance ?? worker.position
    worker.path = buildMovementPath(origin, employer.entrance, this.state.cells, {
      roadPreference: 'prefer-road',
    })
    worker.pathIndex = 0
    worker.position = { ...(worker.path[0] ?? origin) }
    worker.activity = samePoint(worker.position, employer.entrance) ? 'working' : 'commuting'
    worker.activityStartedTick = this.state.tick
  }

  private advanceWorkerCommutes(): void {
    const commutingWorkers = Object.values(this.state.agents)
      .filter((agent) => (
        agent.role === 'worker'
        && (agent.activity === 'commuting' || agent.activity === 'returning')
      ))
      .sort(byId)

    for (const worker of commutingWorkers) {
      const destination = this.workerMovementDestination(worker)
      if (!destination) {
        worker.activity = 'home'
        worker.path = []
        worker.pathIndex = 0
        continue
      }
      if (worker.path.length === 0) {
        worker.path = buildMovementPath(worker.position, destination, this.state.cells, {
          roadPreference: 'prefer-road',
        })
        worker.pathIndex = 0
      }
      const nextIndex = Math.min(worker.pathIndex + 1, worker.path.length - 1)
      worker.pathIndex = nextIndex
      worker.position = { ...worker.path[nextIndex] }
      if (nextIndex >= worker.path.length - 1 || samePoint(worker.position, destination)) {
        if (worker.activity === 'returning') {
          worker.activity = 'home'
        } else {
          worker.activity = 'working'
        }
        worker.position = { ...destination }
        worker.activityStartedTick = this.state.tick
      }
    }
  }

  private updateWorkerShifts(): void {
    const workers = Object.values(this.state.agents)
      .filter((agent) => agent.role === 'worker' && agent.activity === 'working')
      .sort(byId)

    for (const worker of workers) {
      const homeEntrance = this.workerHomeEntrance(worker)
      if (!homeEntrance) continue
      if (this.state.tick - (worker.activityStartedTick ?? this.state.tick) < WORK_SHIFT_TICKS) {
        continue
      }
      worker.path = buildMovementPath(worker.position, homeEntrance, this.state.cells, {
        roadPreference: 'prefer-road',
      })
      worker.pathIndex = 0
      worker.position = { ...(worker.path[0] ?? worker.position) }
      worker.activity = samePoint(worker.position, homeEntrance) ? 'home' : 'returning'
      worker.activityStartedTick = this.state.tick
    }
  }

  private workerMovementDestination(worker: AgentEntity): { x: number; y: number } | undefined {
    if (worker.activity === 'returning') return this.workerHomeEntrance(worker)
    const employer = worker.employerBuildingId
      ? this.state.buildings[worker.employerBuildingId]
      : undefined
    return employer?.entrance
  }

  private workerHomeEntrance(worker: AgentEntity): { x: number; y: number } | undefined {
    const household = worker.householdId
      ? this.state.households[worker.householdId]
      : undefined
    const home = household ? this.state.buildings[household.homeBuildingId] : undefined
    return home?.entrance
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
      const criticalNeedPenalty = Object.values(household.needs)
        .reduce((total, need) => (
          total + criticalNeedPenaltyForNeed(need)
        ), 0)
      const unemploymentPenalty = (1 - employmentRatio) * MAX_UNEMPLOYMENT_PENALTY
      household.satisfaction = clamp(
        household.satisfaction
          + (target - household.satisfaction) * 0.05
          - criticalNeedPenalty
          - unemploymentPenalty,
        0,
        100,
      )
      household.income = employed * 10
    }
  }

  private findAvailableHome(
    requiredCapacity: number,
    excludeCandidateId?: EntityId,
  ): BuildingEntity | undefined {
    const occupancy = new Map<EntityId, number>()
    for (const household of Object.values(this.state.households)) {
      occupancy.set(
        household.homeBuildingId,
        (occupancy.get(household.homeBuildingId) ?? 0) + household.members,
      )
    }
    for (const candidate of Object.values(this.state.migrationCandidates ?? {})) {
      if (
        candidate.id === excludeCandidateId
        || !candidate.targetHomeBuildingId
      ) {
        continue
      }
      occupancy.set(
        candidate.targetHomeBuildingId,
        (occupancy.get(candidate.targetHomeBuildingId) ?? 0) + candidate.members,
      )
    }
    return Object.values(this.state.buildings)
      .filter((building) => {
        const definition = this.definitions[building.type]
        return (
          definition?.category === 'housing'
          && building.status !== 'constructing'
          && building.status !== 'upgrading'
          && (occupancy.get(building.id) ?? 0) + requiredCapacity
            <= effectiveBuildingDefinition(definition, building).capacity
        )
      })
      .sort(byId)[0]
  }

  private jobCapacity(building: BuildingEntity): number {
    if (building.status === 'constructing' || building.status === 'upgrading') {
      return 0
    }
    const definition = this.definitions[building.type]
    if (!definition) return 0
    return effectiveBuildingDefinition(definition, building).jobs
  }

  private findMigrationArrivalPoint(home?: BuildingEntity): { x: number; y: number } {
    const roadCell = [...this.state.cells]
      .filter((cell) => cell.road && !cell.buildingId)
      .sort((left, right) => {
        if (home) {
          const leftDistance = distanceSquared(left.point, home.entrance)
          const rightDistance = distanceSquared(right.point, home.entrance)
          if (leftDistance !== rightDistance) return leftDistance - rightDistance
        }
        return (left.point.x + left.point.y) - (right.point.x + right.point.y)
          || left.point.x - right.point.x
          || left.point.y - right.point.y
      })[0]
    if (roadCell) return { ...roadCell.point }
    if (home) return { x: home.entrance.x + 2, y: home.entrance.y }
    const firstBuilding = Object.values(this.state.buildings).sort(byId)[0]
    return firstBuilding ? { ...firstBuilding.entrance } : { x: 0, y: 0 }
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
        return total + (definition?.category === 'housing'
          ? effectiveBuildingDefinition(definition, building).capacity
          : 0)
      },
      0,
    )
    const population = households.reduce((total, household) => total + household.members, 0)
    const openHousingCapacity = Math.max(0, housingCapacity - population)

    this.state.metrics = {
      population,
      households: households.length,
      employedWorkers,
      availableJobs: Math.max(0, jobCapacity - employedWorkers),
      housingCapacity,
      satisfaction: households.length === 0
        ? 100
        : average(households.map((household) => household.satisfaction)),
      logisticsEfficiency: this.state.metrics.logisticsEfficiency,
      openHousingCapacity,
      cityAttraction: Math.round(this.calculateCityAttraction()),
      waitingMigrants: Object.keys(this.state.migrationCandidates ?? {}).length,
    }
  }

  private calculateCityAttraction(): number {
    const households = Object.values(this.state.households)
    const population = households.reduce((total, household) => total + household.members, 0)
    const housingCapacity = Object.values(this.state.buildings).reduce(
      (total, building) => {
        const definition = this.definitions[building.type]
        return total + (definition?.category === 'housing'
          ? effectiveBuildingDefinition(definition, building).capacity
          : 0)
      },
      0,
    )
    const openHousingCapacity = Math.max(0, housingCapacity - population)
    const jobCapacity = Object.values(this.state.buildings).reduce(
      (total, building) => total + this.jobCapacity(building),
      0,
    )
    const employedWorkers = Object.values(this.state.agents).filter(
      (agent) => agent.role === 'worker' && agent.employerBuildingId,
    ).length
    const availableJobs = Math.max(0, jobCapacity - employedWorkers)
    const storedFood = Object.values(this.state.buildings).reduce(
      (total, building) => total + (building.inventory.food ?? 0),
      0,
    )
    const satisfaction = households.length === 0
      ? 70
      : average(households.map((household) => household.satisfaction))
    const foodCoverage = population === 0
      ? (storedFood > 0 ? 1 : 0.55)
      : Math.min(1, storedFood / Math.max(1, population * 0.75))
    const housingScore = Math.min(1, openHousingCapacity / Math.max(1, this.householdSize[1] * 2))
    const jobsScore = Math.min(1, availableJobs / Math.max(1, this.householdSize[0]))
    const satisfactionScore = satisfaction / 100
    const logisticsScore = clamp(this.state.metrics.logisticsEfficiency / 100, 0, 1)
    const taxScore = clamp(1 - this.state.economy.taxRate * 2, 0, 1)

    return clamp(
      housingScore * 30
        + jobsScore * 25
        + foodCoverage * 18
        + satisfactionScore * 15
        + logisticsScore * 7
        + taxScore * 5,
      0,
      100,
    )
  }

  private uniqueId(prefix: string, random: DeterministicRandom): string {
    let id: string
    do {
      id = `${prefix}-${this.state.tick}-${random.integer(0, 0xffff_ffff).toString(36)}`
    } while (
      this.state.households[id]
      || this.state.migrationCandidates?.[id]
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

function criticalNeedPenaltyForNeed(need: number): number {
  if (need >= CRITICAL_NEED_THRESHOLD) return 0
  return (
    (CRITICAL_NEED_THRESHOLD - need)
    / CRITICAL_NEED_THRESHOLD
    * MAX_CRITICAL_NEED_PENALTY_PER_NEED
  )
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

function distanceSquared(
  left: { x: number; y: number },
  right: { x: number; y: number },
): number {
  return (left.x - right.x) ** 2 + (left.y - right.y) ** 2
}

function samePoint(left: { x: number; y: number }, right: { x: number; y: number }): boolean {
  return left.x === right.x && left.y === right.y
}
