import type { RoadKind } from '../simulation/contracts'

export interface RoadVisualStyle {
  kind: RoadKind
  fill: number
  stroke: number
  strokeWidth: number
  alpha: number
  deckInset: number
  pierColor?: number
}

const ROAD_VISUAL_STYLES: Record<RoadKind, RoadVisualStyle> = {
  dirt: {
    kind: 'dirt',
    fill: 0xb79262,
    stroke: 0x887f70,
    strokeWidth: 1,
    alpha: 0.7,
    deckInset: 22,
  },
  stone: {
    kind: 'stone',
    fill: 0xbec2b5,
    stroke: 0x887f70,
    strokeWidth: 1,
    alpha: 0.7,
    deckInset: 22,
  },
  bridge: {
    kind: 'bridge',
    fill: 0xd8c9a3,
    stroke: 0x6e7f86,
    strokeWidth: 2,
    alpha: 0.9,
    deckInset: 24,
    pierColor: 0x8a765b,
  },
}

export function roadVisualStyle(kind: RoadKind): RoadVisualStyle {
  return ROAD_VISUAL_STYLES[kind]
}
