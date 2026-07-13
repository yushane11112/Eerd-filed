export type EntityId = string
export type Tick = number

export interface GridPoint {
  x: number
  y: number
}

export type TerrainKind = 'land' | 'water' | 'shore'
export type RoadKind = 'dirt' | 'stone' | 'bridge'
export type BuildingCategory =
  | 'housing' | 'production' | 'storage' | 'market'
  | 'service' | 'harbor' | 'landmark'
export type BuildingCityStage =
  | 'wilderness'
  | 'village-market'
  | 'water-town'
  | 'trade-town'
  | 'prefecture-town'
  | 'prosperous-water-city'
export type BuildingFunction =
  | 'housing' | 'employment' | 'production' | 'storage' | 'market'
  | 'service' | 'logistics' | 'culture' | 'governance'
  | 'risk-control' | 'beautification'
export type BuildingConnectionKind = 'road' | 'water' | 'shore'
export type BuildingRuntimeStatus =
  | 'constructing' | 'idle' | 'working' | 'delivering'
  | 'serving' | 'blocked' | 'upgrading'
export type ResourceKind =
  | 'food' | 'fish' | 'wood' | 'stone' | 'clay'
  | 'brick' | 'cloth' | 'salt' | 'medicine'
export type RareResourceKind = 'jade' | 'silk' | 'porcelain' | 'blueprint'

export interface WorldCell {
  point: GridPoint
  terrain: TerrainKind
  elevation: number
  road?: RoadKind
  buildingId?: EntityId
}

export interface BuildingDefinition {
  type: string
  name: string
  category: BuildingCategory
  footprint: GridPoint[]
  entrance: GridPoint
  maxLevel: 8
  jobs: number
  capacity: number
  production?: ProductionRecipe
  cityStage?: BuildingCityStage
  functions?: BuildingFunction[]
  connections?: BuildingConnectionKind[]
  eraTags?: string[]
  districtAffinity?: string[]
}

export interface BuildingEntity {
  id: EntityId
  type: string
  origin: GridPoint
  rotation: 0 | 90 | 180 | 270
  level: number
  entrance: GridPoint
  status: BuildingRuntimeStatus
  statusReason?: string
  workers: EntityId[]
  inventory: Partial<Record<ResourceKind, number>>
  productionProgress: number
}

export interface ProductionRecipe {
  durationTicks: number
  inputs: Partial<Record<ResourceKind, number>>
  outputs: Partial<Record<ResourceKind, number>>
}

export interface HouseholdState {
  id: EntityId
  homeBuildingId: EntityId
  members: number
  workerIds: EntityId[]
  income: number
  satisfaction: number
  needs: {
    food: number
    goods: number
    health: number
    education: number
    entertainment: number
  }
}

export interface MigrationCandidateState {
  id: EntityId
  members: number
  workerCount: number
  status: 'arriving' | 'waiting' | 'walking'
  position: GridPoint
  path?: GridPoint[]
  pathIndex?: number
  targetHomeBuildingId?: EntityId
  arrivedTick: Tick
  patienceTicks: number
  attractionAtArrival: number
}

export type AgentRole = 'resident' | 'worker' | 'carrier' | 'service' | 'cart' | 'boat'
export type AgentActivity =
  | 'home' | 'commuting' | 'working' | 'shopping'
  | 'delivering' | 'serving' | 'returning' | 'idle'

export interface AgentEntity {
  id: EntityId
  role: AgentRole
  householdId?: EntityId
  employerBuildingId?: EntityId
  serviceIntent?: {
    buildingId: EntityId
    need: keyof HouseholdState['needs']
    resource?: ResourceKind
    amount: number
    saleValue: number
    restoreAmount: number
    completed?: boolean
  }
  cargoIntent?: {
    orderId: EntityId
    resource: ResourceKind
    amount: number
    sourceBuildingId: EntityId
    destinationBuildingId: EntityId
    phase: 'pickup' | 'dropoff'
  }
  position: GridPoint
  path: GridPoint[]
  pathIndex: number
  activity: AgentActivity
  activityStartedTick?: Tick
}

export type LogisticsFailureReason =
  | 'no-route'
  | 'no-carrier'
  | 'no-source-inventory'
  | 'source-inventory-insufficient'
  | 'destination-capacity'
  | 'destination-throughput'
  | 'building-demolished'

export interface LogisticsOrder {
  id: EntityId
  resource: ResourceKind
  amount: number
  sourceBuildingId: EntityId
  destinationBuildingId: EntityId
  priority: number
  state: 'waiting' | 'assigned' | 'in_transit' | 'delivered' | 'cancelled'
  carrierId?: EntityId
  cancelReason?: LogisticsFailureReason
  failureReason?: LogisticsFailureReason
  throughputQueuedSinceTick?: Tick
}

export interface LogisticsArchiveState {
  archivedOrders: number
  delivered: number
  cancelled: number
  cancelReasons: Partial<Record<LogisticsFailureReason, number>>
}

export interface LogisticsUnloadCapacityBreakdown {
  source: 'building' | 'override'
  category?: BuildingCategory
  base: number
  levelBonus: number
  workerBonus: number
  entranceBonus: number
  roadAccess: number
  workerCount: number
  cappedAt: number
  total: number
}

export interface LogisticsQueueState {
  buildingId: EntityId
  unloadCapacityPerTick: number
  unloadCapacityBreakdown?: LogisticsUnloadCapacityBreakdown
  unloadedThisTick: number
  waitingToUnloadCount: number
  longestWaitTicks: number
  waitingOrderIds: EntityId[]
}

export interface ServiceQueueEntry {
  householdId: EntityId
  queuedSinceTick: Tick
  waitTicks: number
}

export interface ServiceQueueState {
  buildingId: EntityId
  need: keyof HouseholdState['needs']
  capacityPerTick: number
  servedThisTick: number
  rejectedThisTick: number
  waitingCount: number
  longestWaitTicks: number
  waiting: ServiceQueueEntry[]
}

export interface EconomyState {
  treasury: number
  taxRate: number
  lastTaxIncome: number
  lastMaintenanceCost: number
}

export interface CityMetrics {
  population: number
  households: number
  employedWorkers: number
  availableJobs: number
  housingCapacity: number
  satisfaction: number
  logisticsEfficiency: number
  openHousingCapacity?: number
  cityAttraction?: number
  waitingMigrants?: number
  activeDistricts?: number
  averageDistrictProsperity?: number
}

export type DistrictActivityLevel = 'quiet' | 'steady' | 'busy'

export interface DistrictProsperityState {
  id: EntityId
  kind: string
  name: string
  center: GridPoint
  buildingIds: EntityId[]
  prosperity: number
  activityLevel: DistrictActivityLevel
  visualHints: {
    lanterns: number
    footTraffic: number
    decoration: number
  }
}

export interface WorldDrop {
  id: EntityId
  resource: ResourceKind
  amount: number
  position: GridPoint
  source: 'production' | 'weather' | 'tide' | 'animal' | 'visitor'
  createdTick: Tick
}

export interface RareRewardState {
  missesSinceReward: number
  rewardsToday: number
  dayKey: string
  processedEventIds: string[]
  inventory: Partial<Record<RareResourceKind, number>>
}

export interface MusicCompletionEvent {
  eventId: string
  trackId: string
  listenedSeconds: number
  durationSeconds: number
  completedAt: number
}

export interface CameraState {
  x: number
  y: number
  zoom: number
  viewportWidth: number
  viewportHeight: number
  fullscreen: boolean
}

export type SimulationEvent =
  | { type: 'road-network-changed' }
  | { type: 'building-state-changed'; buildingId: EntityId }
  | { type: 'production-completed'; buildingId: EntityId }
  | { type: 'service-delivered'; buildingId: EntityId; householdId: EntityId; need: keyof HouseholdState['needs'] }
  | {
    type: 'purchase-completed'
    buildingId: EntityId
    householdId: EntityId
    resource: ResourceKind
    amount: number
    taxPaid: number
  }
  | { type: 'logistics-order-created'; orderId: EntityId }
  | { type: 'household-migrated'; householdId: EntityId; direction: 'in' | 'out' }
  | {
    type: 'migration-candidate-arrived'
    candidateId: EntityId
    members: number
    attraction: number
  }
  | {
    type: 'migration-candidate-left'
    candidateId: EntityId
    reason: 'no-housing' | 'low-attraction' | 'wait-timeout'
  }
  | { type: 'world-drop-spawned'; dropId: EntityId }
  | { type: 'music-reward-granted'; resource: RareResourceKind }

export interface SimulationSnapshot {
  version: 6
  seed: number
  tick: Tick
  speed: 0 | 1 | 2 | 4
  cells: WorldCell[]
  buildings: Record<EntityId, BuildingEntity>
  households: Record<EntityId, HouseholdState>
  migrationCandidates?: Record<EntityId, MigrationCandidateState>
  agents: Record<EntityId, AgentEntity>
  logisticsOrders: Record<EntityId, LogisticsOrder>
  logisticsArchive?: LogisticsArchiveState
  logisticsQueues?: Record<EntityId, LogisticsQueueState>
  serviceQueues?: Record<EntityId, ServiceQueueState>
  economy: EconomyState
  metrics: CityMetrics
  districts?: DistrictProsperityState[]
  worldDrops: WorldDrop[]
  rareRewards: RareRewardState
}

export interface SimulationSystem {
  readonly id: string
  update(snapshot: SimulationSnapshot): SimulationEvent[]
}
