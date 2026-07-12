import homesAnimationManifest from '../../../docs/project/gold-slice/sample-manifests/main-homes/animation-manifest.json'
import homesBuildingManifest from '../../../docs/project/gold-slice/sample-manifests/main-homes/building-manifest.json'
import eateryAnimationManifest from '../../../docs/project/gold-slice/sample-manifests/main-eatery/animation-manifest.json'
import eateryBuildingManifest from '../../../docs/project/gold-slice/sample-manifests/main-eatery/building-manifest.json'
import pierAnimationManifest from '../../../docs/project/gold-slice/sample-manifests/main-pier/animation-manifest.json'
import pierBuildingManifest from '../../../docs/project/gold-slice/sample-manifests/main-pier/building-manifest.json'
import { parseRuntimePrefabDescriptor } from './parser'
import { PrefabRuntimeRegistry } from './registry'
import type { GoldAnimationManifest, GoldBuildingManifest, RuntimePrefabDescriptor } from './types'

type SampleAssetId = 'main-homes' | 'main-eatery' | 'main-granary' | 'main-pier'

export function createDefaultPrefabRegistry(): PrefabRuntimeRegistry {
  return new PrefabRuntimeRegistry([
    descriptorFromSample(
      homesBuildingManifest as GoldBuildingManifest,
      homesAnimationManifest as GoldAnimationManifest,
      'main-homes',
    ),
    descriptorFromSample(
      eateryBuildingManifest as GoldBuildingManifest,
      eateryAnimationManifest as GoldAnimationManifest,
      'main-eatery',
    ),
    descriptorFromSample(
      eateryBuildingManifest as GoldBuildingManifest,
      eateryAnimationManifest as GoldAnimationManifest,
      'main-granary',
    ),
    descriptorFromSample(
      pierBuildingManifest as GoldBuildingManifest,
      pierAnimationManifest as GoldAnimationManifest,
      'main-pier',
    ),
  ].filter((descriptor): descriptor is RuntimePrefabDescriptor => Boolean(descriptor)))
}

function descriptorFromSample(
  buildingManifest: GoldBuildingManifest,
  animationManifest: GoldAnimationManifest,
  assetId: SampleAssetId,
): RuntimePrefabDescriptor | undefined {
  const parsed = parseRuntimePrefabDescriptor(
    { ...buildingManifest, assetId },
    { ...animationManifest, assetId },
  )
  if (parsed.ok) return parsed.descriptor
  console.warn(`Prefab sample ${assetId} failed to parse`, parsed.errors)
  return undefined
}
