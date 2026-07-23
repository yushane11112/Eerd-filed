import { GameRuntime } from '../integration/GameRuntime'
import {
  auditLogisticsStorageInterventions,
  formatLogisticsStorageInterventionAudit,
} from './logisticsStorageInterventionAudit'

const runtime = new GameRuntime({ debugScenario: 'logistics-storage-build' })
const audit = auditLogisticsStorageInterventions(runtime.getSnapshot())
console.log(formatLogisticsStorageInterventionAudit(audit))
if (!audit.valid) throw new Error(audit.errors.join('; '))
