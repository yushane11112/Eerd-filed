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
    })
    expect(roadVisualStyle('bridge')).not.toEqual(roadVisualStyle('stone'))
  })
})
