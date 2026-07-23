import { describe, expect, it } from 'vitest'
import type { LogisticsStorageInterventionRecord } from '../contracts'
import { appendLogisticsStorageIntervention, MAX_LOGISTICS_STORAGE_HISTORY } from './logisticsInterventions'

const makeRecord = (index: number): LogisticsStorageInterventionRecord => ({
  eventId: `event-${index}`,
  buildingId: `granary-${index}`,
  buildingType: 'granary',
  tick: index,
  orderIds: [`order-${index}`],
  ordersReset: 1,
  carriersReleased: index % 2,
  queuesCleared: index % 3,
})

describe('logistics intervention retention', () => {
  it('keeps a bounded recent history and aggregates older records', () => {
    let history: LogisticsStorageInterventionRecord[] = []
    let archive
    for (let index = 0; index < MAX_LOGISTICS_STORAGE_HISTORY + 5; index += 1) {
      const result = appendLogisticsStorageIntervention(history, archive, makeRecord(index))
      history = result.history
      archive = result.archive
    }
    expect(history).toHaveLength(MAX_LOGISTICS_STORAGE_HISTORY)
    expect(history[0].eventId).toBe('event-5')
    expect(history.at(-1)?.eventId).toBe(`event-${MAX_LOGISTICS_STORAGE_HISTORY + 4}`)
    expect(archive).toMatchObject({ archivedRecords: 5, ordersReset: 5, lastTick: 4 })
  })
})
