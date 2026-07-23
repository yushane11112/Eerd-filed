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
export type BuildingVisualStage = 'ruin' | 'repaired' | 'settled' | 'expanded' | 'prosperous' | 'thriving'

export interface BuildingVisualLevel {
  stage: BuildingVisualStage
  silhouette: string
  functionalRead: string
  environment: string
  activeElements: readonly string[]
  structuralMilestone: boolean
}

export interface BuildingVisualIdentity {
  era: 'jiangnan-preindustrial'
  buildingClass: string
  silhouetteFamily: string
  functionalSignature: string
  materialPalette: string
  heroFeature: string
  supportFeatures: readonly string[]
  dynamicSignature: readonly string[]
  levelArc: Readonly<Record<`L${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`, BuildingVisualLevel>>
}
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
  visualIdentity?: BuildingVisualIdentity
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
  /** Simulation tick at which the current operational blockage began. */
  blockedSinceTick?: Tick
  /** Baseline used to explain how the current blockage changed before recovery. */
  blockedAuditBaseline?: BuildingBlockageConsequences
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
  /** Lifecycle provenance used by the resident scene projection. */
  origin?: 'initial' | 'migrated'
  /** Simulation tick at which an arriving household finished settling. */
  settledTick?: Tick
  needs: {
    food: number
    goods: number
    health: number
    education: number
    entertainment: number
  }
  /** Persisted pressure counters used to explain migration outcomes. */
  unmetNeedTicks?: Partial<Record<keyof HouseholdState['needs'], number>>
  absenceTicks?: number
  /** The latest service or resource bottleneck observed for each need. */
  needPressure?: Partial<Record<keyof HouseholdState['needs'], HouseholdNeedPressure>>
}

export type HouseholdNeedPressureCause =
  | 'no-workers'
  | 'missing-resource'
  | 'no-route'
  | 'capacity'
  | 'unaffordable'

export interface HouseholdNeedPressure {
  ticks: number
  cause: HouseholdNeedPressureCause
  buildingId?: EntityId
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
export type HouseholdMigrationOutReason = 'critical-needs' | 'unemployment' | 'chronic-absence' | 'low-satisfaction'
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
  workStatus?: 'present' | 'absent'
  absenceReason?: 'low-health' | 'low-satisfaction'
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

export interface LogisticsStorageIntervention {
  tick: Tick
  ordersReset: number
  carriersReleased: number
  queuesCleared: number
}

export interface LogisticsStorageInterventionRecord extends LogisticsStorageIntervention {
  eventId: EntityId
  buildingId: EntityId
  buildingType: string
  orderIds: EntityId[]
}

export interface LogisticsStorageInterventionArchive {
  archivedRecords: number
  ordersReset: number
  carriersReleased: number
  queuesCleared: number
  lastTick: Tick
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
  lastServiceMaintenanceCost?: number
  lastFiscalTick?: Tick
  fiscalHistory?: FiscalSettlementRecord[]
}

export interface FiscalSettlementRecord {
  tick: Tick
  treasuryBefore: number
  treasuryAfter: number
  taxIncome: number
  maintenanceCost: number
  serviceMaintenanceCost: number
  operationalPressure?: FiscalOperationalPressure
  operationalPressureDelta?: FiscalOperationalPressureDelta
}

export interface FiscalOperationalPressure {
  blockedBuildings: number
  logisticsBacklog: number
  inventoryPressureBuildings: number
  pressuredHouseholds: number
}

export interface FiscalOperationalPressureDelta {
  blockedBuildingsDelta: number
  logisticsBacklogDelta: number
  inventoryPressureBuildingsDelta: number
  pressuredHouseholdsDelta: number
}

export interface PopulationFlowLedger {
  householdsIn: number
  householdsOut: number
  residentsIn: number
  residentsOut: number
  lastInTick?: Tick
  lastOutTick?: Tick
  arrivalsByHousing: Record<string, number>
  departuresByReason: Partial<Record<HouseholdMigrationOutReason, number>>
  departuresByHousing: Record<string, number>
  departuresByOccupation: Record<string, number>
  employedWorkersOut: number
  unemployedWorkersOut: number
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
  migrationIn?: number
  migrationOut?: number
  netMigration?: number
  /** Average health, education and entertainment need satisfaction. */
  publicServiceCoverage?: number
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

export type CityTimelineKind = 'service' | 'population' | 'finance' | 'labor' | 'operations'

export interface CityTimelineResidentProfile {
  phase: 'arrived' | 'settled' | 'departed'
  origin: '外来家庭' | '候选家庭' | '离城家庭'
  members: number
  workerCount: number
  employedCount: number
  occupations: string[]
  homeBuildingId?: EntityId
  satisfaction?: number
}

export interface CityTimelineFiscalSnapshot {
  treasury: number
  treasuryBefore?: number
  taxIncome: number
  maintenanceCost: number
  serviceMaintenanceCost: number
  settlementTick?: Tick
}

export interface CityTimelineFiscalPressureAudit {
  current: FiscalOperationalPressure
  delta?: FiscalOperationalPressureDelta
}

export interface CityTimelineServiceRecoveryAudit {
  need: keyof HouseholdState['needs']
  previousCause?: HouseholdNeedPressureCause
  pressureClearedHouseholds: number
  maxPressureTicks: number
  buildingStatusBefore: BuildingRuntimeStatus
  buildingStatusAfter: BuildingRuntimeStatus
}

export interface CityTimelineServiceDeliveryAudit {
  need: keyof HouseholdState['needs']
  needBefore?: number
  needAfter?: number
}

export interface BuildingBlockageConsequences {
  absentWorkers: number
  relatedLogisticsOrders: number
  inventoryTotal: number
  inventoryCapacity?: number
  pressuredHouseholds: number
}

export interface BuildingBlockageConsequenceDelta {
  absentWorkersDelta: number
  relatedLogisticsOrdersDelta: number
  inventoryDelta: number
  pressuredHouseholdsDelta: number
}

export interface CityTimelineRecord {
  id: string
  tick: Tick
  kind: CityTimelineKind
  source: Extract<SimulationEvent['type'],
    'service-delivered'
    | 'service-bottleneck-cleared'
    | 'building-blockage-started'
    | 'building-blockage-cleared'
    | 'purchase-completed'
    | 'household-migrated'
    | 'migration-candidate-arrived'
    | 'migration-candidate-left'
    | 'worker-employment-changed'
    | 'worker-attendance-changed'
    | 'fiscal-settlement'
  >
  title: string
  detail: string
  buildingId?: EntityId
  resident?: CityTimelineResidentProfile
  fiscal?: CityTimelineFiscalSnapshot
  fiscalPressure?: CityTimelineFiscalPressureAudit
  serviceRecovery?: CityTimelineServiceRecoveryAudit
  serviceDelivery?: CityTimelineServiceDeliveryAudit
  blockage?: {
    reason: string
    blockedSinceTick: Tick
    durationTicks: number
    resolvedStatus?: BuildingRuntimeStatus
    consequences?: BuildingBlockageConsequences
    consequencesAtStart?: BuildingBlockageConsequences
    consequenceDelta?: BuildingBlockageConsequenceDelta
  }
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
  | {
      type: 'service-delivered'
      buildingId: EntityId
      householdId: EntityId
      need: keyof HouseholdState['needs']
      needBefore?: number
      needAfter?: number
    }
  | {
      type: 'service-bottleneck-cleared'
      buildingId: EntityId
      need: keyof HouseholdState['needs']
      previousCause?: HouseholdNeedPressureCause
      pressureClearedHouseholds: number
      maxPressureTicks: number
      buildingStatusBefore: BuildingRuntimeStatus
      buildingStatusAfter: BuildingRuntimeStatus
    }
  | {
      type: 'building-blockage-started'
      buildingId: EntityId
      reason: string
      blockedSinceTick: Tick
      consequences?: BuildingBlockageConsequences
      consequencesAtStart?: BuildingBlockageConsequences
      consequenceDelta?: BuildingBlockageConsequenceDelta
    }
  | {
      type: 'building-blockage-cleared'
      buildingId: EntityId
      reason: string
      blockedSinceTick: Tick
      durationTicks: number
      resolvedStatus: BuildingRuntimeStatus
      consequences?: BuildingBlockageConsequences
      consequencesAtStart?: BuildingBlockageConsequences
      consequenceDelta?: BuildingBlockageConsequenceDelta
    }
  | {
    type: 'purchase-completed'
    buildingId: EntityId
    householdId: EntityId
    resource: ResourceKind
    amount: number
    taxPaid: number
  }
  | { type: 'logistics-order-created'; orderId: EntityId }
  | {
    type: 'household-migrated'
    householdId: EntityId
    direction: 'in' | 'out'
    reason?: HouseholdMigrationOutReason
    need?: keyof HouseholdState['needs']
    needCause?: HouseholdNeedPressureCause
    serviceBuildingId?: EntityId
    absenceTicks?: number
  }
  | {
    type: 'worker-employment-changed'
    workerId: EntityId
    householdId?: EntityId
    previousBuildingId?: EntityId
    buildingId?: EntityId
  }
  | {
    type: 'worker-attendance-changed'
    workerId: EntityId
    householdId?: EntityId
    buildingId?: EntityId
    status: 'present' | 'absent'
    reason: 'low-health' | 'low-satisfaction' | 'recovered'
  }
  | {
      type: 'fiscal-settlement'
      settlementTick: Tick
      treasuryBefore: number
      treasuryAfter: number
      taxIncome: number
      maintenanceCost: number
      serviceMaintenanceCost: number
      operationalPressure: FiscalOperationalPressure
      operationalPressureDelta?: FiscalOperationalPressureDelta
    }
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
  populationFlow?: PopulationFlowLedger
  agents: Record<EntityId, AgentEntity>
  logisticsOrders: Record<EntityId, LogisticsOrder>
  logisticsArchive?: LogisticsArchiveState
  logisticsQueues?: Record<EntityId, LogisticsQueueState>
  logisticsStorageInterventions?: Record<EntityId, LogisticsStorageIntervention>
  logisticsStorageInterventionHistory?: LogisticsStorageInterventionRecord[]
  logisticsStorageInterventionArchive?: LogisticsStorageInterventionArchive
  cityTimeline?: CityTimelineRecord[]
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
