import type {
  BuildingDefinition,
  EntityId,
  SimulationEvent,
  SimulationSnapshot,
  SimulationSystem,
} from '../contracts'
import { FiscalSystem, type FiscalSystemOptions } from './fiscal'
import { LogisticsSystem, type RoutePlanner } from './logistics'
import { ProductionSystem } from './production'

export interface EconomySystemOptions {
  definitions: Readonly<Record<string, BuildingDefinition>>
  routePlanner?: RoutePlanner
  maxShipment?: number
  inputTargetBatches?: number
  idFactory?: () => EntityId
  settlementIntervalTicks?: number
  maintenanceCost?: FiscalSystemOptions['maintenanceCost']
}

export class EconomySystem implements SimulationSystem {
  readonly id = 'economy'
  readonly production: ProductionSystem
  readonly logistics: LogisticsSystem
  readonly fiscal: FiscalSystem

  constructor(options: EconomySystemOptions) {
    this.production = new ProductionSystem({ definitions: options.definitions })
    this.logistics = new LogisticsSystem({
      definitions: options.definitions,
      routePlanner: options.routePlanner,
      maxShipment: options.maxShipment,
      inputTargetBatches: options.inputTargetBatches,
      idFactory: options.idFactory,
    })
    this.fiscal = new FiscalSystem({
      definitions: options.definitions,
      settlementIntervalTicks: options.settlementIntervalTicks,
      maintenanceCost: options.maintenanceCost,
    })
  }

  update(snapshot: SimulationSnapshot): SimulationEvent[] {
    return [
      ...this.production.update(snapshot),
      ...this.logistics.update(snapshot),
      ...this.fiscal.update(snapshot),
    ]
  }
}

