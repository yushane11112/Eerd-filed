import { describe, expect, it } from 'vitest'
import type { SceneCamera } from '../rendering/types'
import { DynamicScene } from '../rendering/DynamicScene'
import { createStressScenario, TARGET_STRESS_SIZE } from './stressScenario'

// Keep the scale probe independent from authored artwork and network resources.
// It measures the dynamic scene's entity lifecycle, not placeholder art quality.
describe('commercial civilization scale probe', () => {
  const camera: SceneCamera = {
    x: -4_000,
    y: -1_000,
    zoom: 1,
    viewportWidth: 10_000,
    viewportHeight: 10_000,
  }

  it('retains the target 500-household / 300-building / 150-agent scale in the simulation snapshot', () => {
    const snapshot = createStressScenario(TARGET_STRESS_SIZE)

    expect(Object.keys(snapshot.households)).toHaveLength(TARGET_STRESS_SIZE.households)
    expect(Object.keys(snapshot.buildings)).toHaveLength(TARGET_STRESS_SIZE.buildings)
    expect(Object.keys(snapshot.agents)).toHaveLength(TARGET_STRESS_SIZE.visibleAgents)
  })

  it('keeps 300 buildings and 150 visible moving entities across repeated scene syncs', () => {
    const snapshot = createStressScenario(TARGET_STRESS_SIZE)
    const scene = new DynamicScene()

    try {
      const first = scene.sync(snapshot, camera, 0.5)
      expect(first).toMatchObject({
        buildings: 300,
        residents: 135,
        transport: 15,
        drops: 0,
        visible: 450,
      })
      expect(scene.layers.buildings.children).toHaveLength(300)
      expect(scene.layers.residents.children).toHaveLength(135)
      expect(scene.layers.transport.children).toHaveLength(15)

      snapshot.tick += 1
      const second = scene.sync(snapshot, camera, 0.5)
      expect(second).toMatchObject({
        buildings: 300,
        residents: 135,
        transport: 15,
        visible: 450,
      })
      expect(scene.layers.buildings.children).toHaveLength(300)
      expect(scene.layers.residents.children).toHaveLength(135)
      expect(scene.layers.transport.children).toHaveLength(15)
    } finally {
      scene.destroy()
    }
  })
})
