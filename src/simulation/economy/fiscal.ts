import type {
  BuildingDefinition,
  BuildingEntity,
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

    snapshot.economy.lastTaxIncome = income
    snapshot.economy.lastMaintenanceCost = maintenance
    snapshot.economy.treasury += income - maintenance
    return []
  }
}
