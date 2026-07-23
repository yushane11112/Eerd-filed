import type {
  BuildingDefinition,
  BuildingEntity,
  FiscalOperationalPressure,
  FiscalOperationalPressureDelta,
  SimulationEvent,
  SimulationSnapshot,
  SimulationSystem,
} from '../contracts'

export interface FiscalSystemOptions {
  definitions: Readonly<Record<string, BuildingDefinition>>
  settlementIntervalTicks?: number
  maintenanceCost?: (building: BuildingEntity, definition: BuildingDefinition) => number
}

export class FiscalSystem implements SimulationSystem {
  readonly id = 'economy.fiscal'
  private readonly definitions: Readonly<Record<string, BuildingDefinition>>
  private readonly settlementIntervalTicks: number
  private readonly maintenanceCost: (
    building: BuildingEntity,
    definition: BuildingDefinition,
  ) => number

  constructor(options: FiscalSystemOptions) {
    this.definitions = options.definitions
    this.settlementIntervalTicks = options.settlementIntervalTicks ?? 300
    this.maintenanceCost = options.maintenanceCost ?? ((building) => Math.max(1, building.level + 1))
  }

  update(snapshot: SimulationSnapshot): SimulationEvent[] {
    if (snapshot.tick === 0
      || this.settlementIntervalTicks <= 0
      || snapshot.tick % this.settlementIntervalTicks !== 0) {
      return []
    }

    const income = Object.values(snapshot.households).reduce(
      (total, household) => total + Math.max(0, household.income) * snapshot.economy.taxRate,
      0,
    )
    const maintenance = Object.values(snapshot.buildings).reduce((total, building) => {
      const definition = this.definitions[building.type]
      if (!definition || building.status === 'constructing') return total
      return total + Math.max(0, this.maintenanceCost(building, definition))
    }, 0)
    const serviceMaintenance = Object.values(snapshot.buildings).reduce((total, building) => {
      const definition = this.definitions[building.type]
      if (!definition || definition.category !== 'service' || building.status === 'constructing') return total
      return total + Math.max(0, this.maintenanceCost(building, definition))
    }, 0)
    const operationalPressure: FiscalOperationalPressure = {
      blockedBuildings: Object.values(snapshot.buildings).filter((building) => building.status === 'blocked').length,
      logisticsBacklog: Object.values(snapshot.logisticsOrders).filter((order) => order.state !== 'delivered' && order.state !== 'cancelled').length,
      inventoryPressureBuildings: Object.values(snapshot.buildings).filter((building) => {
        const reason = building.statusReason ?? ''
        return reason === 'output-full' || reason === 'storage-full' || reason.includes('destination-capacity')
      }).length,
      pressuredHouseholds: Object.values(snapshot.households).filter((household) => Object.values(household.needPressure ?? {}).some((pressure) => (pressure?.ticks ?? 0) > 0)).length,
    }
    const previousPressure = snapshot.economy.fiscalHistory?.at(-1)?.operationalPressure
    const operationalPressureDelta = previousPressure
      ? fiscalOperationalPressureDelta(previousPressure, operationalPressure)
      : undefined

    const treasuryBefore = snapshot.economy.treasury
    snapshot.economy.lastTaxIncome = income
    snapshot.economy.lastMaintenanceCost = maintenance
    snapshot.economy.lastServiceMaintenanceCost = serviceMaintenance
    snapshot.economy.lastFiscalTick = snapshot.tick
    snapshot.economy.treasury += income - maintenance
    snapshot.economy.fiscalHistory = [
      ...(snapshot.economy.fiscalHistory ?? []),
      {
        tick: snapshot.tick,
        treasuryBefore,
        treasuryAfter: snapshot.economy.treasury,
        taxIncome: income,
        maintenanceCost: maintenance,
        serviceMaintenanceCost: serviceMaintenance,
        operationalPressure,
        ...(operationalPressureDelta ? { operationalPressureDelta } : {}),
      },
    ].slice(-24)
    return [{
      type: 'fiscal-settlement',
      settlementTick: snapshot.tick,
      treasuryBefore,
      treasuryAfter: snapshot.economy.treasury,
      taxIncome: income,
      maintenanceCost: maintenance,
      serviceMaintenanceCost: serviceMaintenance,
      operationalPressure,
      ...(operationalPressureDelta ? { operationalPressureDelta } : {}),
    }]
  }
}

function fiscalOperationalPressureDelta(
  previous: FiscalOperationalPressure,
  current: FiscalOperationalPressure,
): FiscalOperationalPressureDelta {
  return {
    blockedBuildingsDelta: current.blockedBuildings - previous.blockedBuildings,
    logisticsBacklogDelta: current.logisticsBacklog - previous.logisticsBacklog,
    inventoryPressureBuildingsDelta: current.inventoryPressureBuildings - previous.inventoryPressureBuildings,
    pressuredHouseholdsDelta: current.pressuredHouseholds - previous.pressuredHouseholds,
  }
}
