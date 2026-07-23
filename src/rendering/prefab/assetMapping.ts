export type PrefabAssetMapping = Readonly<Record<string, string | undefined>>

export const PREFAB_ASSET_ID_BY_BUILDING_TYPE: PrefabAssetMapping = {
  house: 'main-homes',
  homes: 'main-homes',
  granary: 'main-granary',
  riceField: 'windfield-rice',
  market: 'main-eatery',
  eatery: 'main-eatery',
  woodshop: 'main-carpentry',
  kiln: 'main-kiln',
  pharmacy: 'main-pharmacy',
  academy: 'main-academy',
  theatre: 'main-theatre',

  'main-pier': 'main-pier',
  'main-ferry': 'main-ferry',
  'main-bridge': 'main-bridge',
  'main-inn': 'main-inn',
  'main-teahouse': 'main-teahouse',
  'main-eatery': 'main-eatery',
  'main-weavery': 'main-weavery',
  'main-carpentry': 'main-carpentry',
  'main-kiln': 'main-kiln',
  'main-granary': 'main-granary',
  'main-pharmacy': 'main-pharmacy',
  'main-academy': 'main-academy',
  'main-theatre': 'main-theatre',
  'main-homes': 'main-homes',
  'main-gate': 'main-gate',
  'main-garden': 'main-garden',
  'windfield-rice': 'windfield-rice',
  'windfield-orchard': 'windfield-orchard',
  'windfield-mill': 'windfield-mill',
  'windfield-barn': 'windfield-barn',
  'mistgrove-tea': 'mistgrove-tea',
  'mistgrove-herbs': 'mistgrove-herbs',
  'mistgrove-bamboo': 'mistgrove-bamboo',
  'mistgrove-pavilion': 'mistgrove-pavilion',
  'tide-harbor': 'tide-harbor',
  'tide-salt': 'tide-salt',
  'tide-shipyard': 'tide-shipyard',
  'tide-lighthouse': 'tide-lighthouse',
}

export function resolvePrefabAssetIdForBuildingType(
  buildingType: string,
  mapping: PrefabAssetMapping = PREFAB_ASSET_ID_BY_BUILDING_TYPE,
): string | undefined {
  return mapping[buildingType]
}
