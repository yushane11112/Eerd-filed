import { describe, expect, it } from 'vitest'
import { formatRoadPlanSummary } from './cityAdvisorUi'

describe('city advisor UI copy', () => {
  it('summarizes road and bridge construction plans for bottleneck cards', () => {
    expect(formatRoadPlanSummary({
      from: { x: 1, y: 1 },
      to: { x: 4, y: 1 },
      cells: [
        { point: { x: 2, y: 1 }, kind: 'bridge', treasuryCost: 18 },
        { point: { x: 3, y: 1 }, kind: 'bridge', treasuryCost: 18 },
      ],
      roadCells: 0,
      bridgeCells: 2,
      treasuryCost: 36,
      missingTreasury: 0,
      canAfford: true,
    })).toBe('补线计划：桥梁 2 格，预计银两 36，可直接施工。')
  })

  it('explains mixed road plans and treasury gaps', () => {
    expect(formatRoadPlanSummary({
      from: { x: 0, y: 0 },
      to: { x: 4, y: 0 },
      cells: [
        { point: { x: 1, y: 0 }, kind: 'stone', treasuryCost: 6 },
        { point: { x: 2, y: 0 }, kind: 'stone', treasuryCost: 6 },
        { point: { x: 3, y: 0 }, kind: 'bridge', treasuryCost: 18 },
      ],
      roadCells: 2,
      bridgeCells: 1,
      treasuryCost: 30,
      missingTreasury: 12,
      canAfford: false,
    })).toBe('补线计划：道路 2 格、桥梁 1 格，预计银两 30，还缺银两 12。')
  })
})
