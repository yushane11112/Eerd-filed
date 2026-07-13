import { describe, expect, it } from 'vitest'
import { runLogisticsHotspotQaScenarios } from './logisticsHotspotScenarios'

describe('logistics hotspot QA scenarios', () => {
  it('reports concentrated unfinished orders as an actionable logistics bottleneck', () => {
    expect(runLogisticsHotspotQaScenarios()).toEqual([
      {
        id: 'logistics-hotspot',
        title: '市场入货物流热点',
        before: {
          activeOrders: 3,
          hotspots: 2,
          targetLabel: '物流热点x3',
          targetPoint: { x: 15, y: 6 },
          recommendedBuilding: 'granary',
          recommendationTool: 'building',
        },
        orders: [
          { id: 'debug-food-inbound', resource: 'food', destinationBuildingId: 'market-1', state: 'assigned' },
          { id: 'debug-cloth-inbound', resource: 'cloth', destinationBuildingId: 'market-1', state: 'assigned' },
          { id: 'debug-medicine-inbound', resource: 'medicine', destinationBuildingId: 'market-1', state: 'assigned' },
        ],
      },
    ])
  })
})
