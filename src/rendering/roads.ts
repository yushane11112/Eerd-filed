import type { RoadKind } from '../simulation/contracts'

export interface RoadVisualStyle {
  kind: RoadKind
  fill: number
  stroke: number
  strokeWidth: number
  alpha: number
  deckInset: number
  pierColor?: number
  shadow: number
  seam: number
  pattern: 'ruts' | 'stone-slabs' | 'bridge-planks'
}

const ROAD_VISUAL_STYLES: Record<RoadKind, RoadVisualStyle> = {
  dirt: {
    kind: 'dirt',
    fill: 0xb79262,
    stroke: 0x887f70,
    strokeWidth: 1,
    alpha: 0.7,
    deckInset: 22,
    shadow: 0x6f5b43,
    seam: 0x7b6245,
    pattern: 'ruts',
  },
  stone: {
    kind: 'stone',
    fill: 0xbec2b5,
    stroke: 0x887f70,
    strokeWidth: 1,
    alpha: 0.7,
    deckInset: 22,
    shadow: 0x7f867f,
    seam: 0xe4e0d4,
    pattern: 'stone-slabs',
  },
  bridge: {
    kind: 'bridge',
    fill: 0xd8c9a3,
    stroke: 0x6e7f86,
    strokeWidth: 2,
    alpha: 0.9,
    deckInset: 24,
    pierColor: 0x8a765b,
    shadow: 0x5f6f75,
    seam: 0x9c7048,
    pattern: 'bridge-planks',
  },
}

export function roadVisualStyle(kind: RoadKind): RoadVisualStyle {
  return ROAD_VISUAL_STYLES[kind]
}
