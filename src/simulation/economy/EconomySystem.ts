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
import { DEFAULT_SERVICE_RULES, ServiceSystem, type ServiceRule } from './service'

export interface EconomySystemOptions {
  definitions: Readonly<Record<string, BuildingDefinition>>
  routePlanner?: RoutePlanner
  maxShipment?: number
  inputTargetBatches?: number
  idFactory?: () => EntityId
  settlementIntervalTicks?: number
  maintenanceCost?: FiscalSystemOptions['maintenanceCost']
  serviceRules?: Readonly<Record<string, ServiceRule>>
}

export class EconomySystem implements SimulationSystem {
  readonly id = 'economy'
  readonly production: ProductionSystem
  readonly logistics: LogisticsSystem
  readonly service: ServiceSystem
  readonly fiscal: FiscalSystem

  constructor(options: EconomySystemOptions) {
    const serviceRules = options.serviceRules ?? DEFAULT_SERVICE_RULES
    this.production = new ProductionSystem({ definitions: options.definitions })
    this.logistics = new LogisticsSystem({
      definitions: options.definitions,
      routePlanner: options.routePlanner,
      maxShipment: options.maxShipment,
      inputTargetBatches: options.inputTargetBatches,
      serviceRules,
      idFactory: options.idFactory,
    })
    this.service = new ServiceSystem({
      definitions: options.definitions,
      routePlanner: options.routePlanner,
      rules: serviceRules,
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
      ...this.service.update(snapshot),
      ...this.fiscal.update(snapshot),
    ]
  }
}
