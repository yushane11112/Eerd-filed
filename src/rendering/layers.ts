import { Container } from 'pixi.js'
import type { SceneLayerName } from './types'

export const SCENE_LAYER_ORDER: readonly SceneLayerName[] = [
  'terrain',
  'water',
  'roads',
  'buildings',
  'residents',
  'transport',
  'drops',
  'effects',
  'overlays',
]

export type SceneLayers = Record<SceneLayerName, Container>

export function createSceneLayers(parent: Container): SceneLayers {
  const layers = {} as SceneLayers
  SCENE_LAYER_ORDER.forEach((name, index) => {
    const layer = new Container({ label: `scene:${name}` })
    layer.zIndex = index
    layer.sortableChildren = name === 'buildings'
      || name === 'residents'
      || name === 'transport'
      || name === 'drops'
    parent.addChild(layer)
    layers[name] = layer
  })
  parent.sortableChildren = true
  return layers
}

