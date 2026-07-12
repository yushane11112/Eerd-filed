import { describe, expect, it } from 'vitest'
import { roadVisualStyle } from './roads'

describe('roadVisualStyle', () => {
  it('gives bridge roads a distinct deck and pier presentation', () => {
    expect(roadVisualStyle('bridge')).toMatchObject({
      kind: 'bridge',
      fill: 0xd8c9a3,
      stroke: 0x6e7f86,
      strokeWidth: 2,
      pierColor: 0x8a765b,
      deckInset: 24,
      pattern: 'bridge-planks',
      seam: 0x9c7048,
    })
    expect(roadVisualStyle('bridge')).not.toEqual(roadVisualStyle('stone'))
  })

  it('keeps dirt and stone roads visually distinct beyond fill color', () => {
    expect(roadVisualStyle('dirt')).toMatchObject({
      kind: 'dirt',
      pattern: 'ruts',
      shadow: 0x6f5b43,
    })
    expect(roadVisualStyle('stone')).toMatchObject({
      kind: 'stone',
      pattern: 'stone-slabs',
      seam: 0xe4e0d4,
    })
    expect(roadVisualStyle('dirt').pattern).not.toBe(roadVisualStyle('stone').pattern)
  })
})
