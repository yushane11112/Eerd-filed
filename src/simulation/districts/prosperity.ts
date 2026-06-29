import type {
  BuildingDefinition,
  BuildingEntity,
  DistrictActivityLevel,
  DistrictProsperityState,
  GridPoint,
  SimulationSnapshot,
} from '../contracts'

const DISTRICT_NAMES: Record<string, string> = {
  'residential-lane': '柳岸住巷',
  'garden-homes': '园宅水巷',
  'warehouse-yard': '仓储院',
  'market-backstreet': '市后货巷',
  'farm-edge': '田畔作区',
  'craft-lane': '手作坊巷',
  'market-street': '临河市街',
  'riverside-shops': '河岸铺面',
}

export function deriveDistrictProsperity(
  snapshot: Pick<SimulationSnapshot, 'buildings'> & Partial<Pick<SimulationSnapshot, 'cells' | 'logisticsOrders'>>,
  definitions: Readonly<Record<string, BuildingDefinition>>,
): DistrictProsperityState[] {
  const grouped = new Map<string, BuildingEntity[]>()
  for (const building of Object.values(snapshot.buildings)) {
    const definition = definitions[building.type]
    for (const districtKind of definition?.districtAffinity ?? []) {
      const group = grouped.get(districtKind) ?? []
      group.push(building)
      grouped.set(districtKind, group)
    }
  }

  return [...grouped.entries()]
    .map(([kind, buildings]) => toDistrict(kind, buildings, definitions, snapshot))
    .filter((district): district is DistrictProsperityState => Boolean(district))
    .sort((left, right) => (
      right.prosperity - left.prosperity
      || left.kind.localeCompare(right.kind)
    ))
}

export function summarizeDistrictProsperity(
  districts: readonly DistrictProsperityState[],
): Pick<SimulationSnapshot['metrics'], 'activeDistricts' | 'averageDistrictProsperity'> {
  if (districts.length === 0) {
    return { activeDistricts: 0, averageDistrictProsperity: 0 }
  }
  return {
    activeDistricts: districts.length,
    averageDistrictProsperity: Math.round(
      districts.reduce((sum, district) => sum + district.prosperity, 0) / districts.length,
    ),
  }
}

function toDistrict(
  kind: string,
  buildings: readonly BuildingEntity[],
  definitions: Readonly<Record<string, BuildingDefinition>>,
  snapshot: Pick<SimulationSnapshot, 'buildings'> & Partial<Pick<SimulationSnapshot, 'cells' | 'logisticsOrders'>>,
): DistrictProsperityState | undefined {
  if (buildings.length === 0) return undefined
  const sortedBuildings = [...buildings].sort((left, right) => left.id.localeCompare(right.id))
  const center = averagePoint(sortedBuildings.map((building) => building.origin))
  const averageLevel = sortedBuildings.reduce((sum, building) => sum + building.level, 0) / sortedBuildings.length
  const activeRatio = sortedBuildings.filter((building) => (
    building.status === 'working'
    || building.status === 'serving'
    || building.status === 'delivering'
  )).length / sortedBuildings.length
  const functionCount = new Set(sortedBuildings.flatMap((building) => (
    definitions[building.type]?.functions ?? []
  ))).size
  const neighborScore = nearbyPairCount(sortedBuildings)
  const blockedPenalty = sortedBuildings.filter((building) => building.status === 'blocked').length * 8
  const roadBonus = roadAccessRatio(sortedBuildings, snapshot.cells ?? []) * 10
  const serviceBonus = hasDistrictService(sortedBuildings, definitions) ? 8 : 0
  const logisticsBonus = Math.min(12, activeLogisticsTouchCount(
    sortedBuildings.map((building) => building.id),
    snapshot.logisticsOrders ?? {},
  ) * 4)
  const prosperity = clamp(
    Math.round(
      sortedBuildings.length * 12
        + averageLevel * 6
        + activeRatio * 24
        + functionCount * 4
        + neighborScore * 5
        + roadBonus
        + serviceBonus
        + logisticsBonus
        - blockedPenalty,
    ),
    0,
    100,
  )

  return {
    id: `district:${kind}`,
    kind,
    name: DISTRICT_NAMES[kind] ?? kind,
    center,
    buildingIds: sortedBuildings.map((building) => building.id),
    prosperity,
    activityLevel: activityLevel(prosperity),
    visualHints: {
      lanterns: prosperity >= 45 ? Math.min(5, Math.ceil(prosperity / 20)) : 0,
      footTraffic: prosperity >= 35 ? Math.min(6, Math.ceil(prosperity / 18)) : 0,
      decoration: prosperity >= 55 ? Math.min(4, Math.ceil((prosperity - 40) / 18)) : 0,
    },
  }
}

function averagePoint(points: readonly GridPoint[]): GridPoint {
  return {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
  }
}

function nearbyPairCount(buildings: readonly BuildingEntity[]): number {
  let count = 0
  for (let leftIndex = 0; leftIndex < buildings.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < buildings.length; rightIndex += 1) {
      const left = buildings[leftIndex].origin
      const right = buildings[rightIndex].origin
      if (Math.abs(left.x - right.x) + Math.abs(left.y - right.y) <= 7) count += 1
    }
  }
  return count
}

function roadAccessRatio(
  buildings: readonly BuildingEntity[],
  cells: readonly NonNullable<SimulationSnapshot['cells']>[number][],
): number {
  if (buildings.length === 0 || cells.length === 0) return 0
  const roadKeys = new Set(cells.filter((cell) => cell.road).map((cell) => pointKey(cell.point)))
  const connected = buildings.filter((building) => gridNeighbors(building.entrance)
    .some((point) => roadKeys.has(pointKey(point))))
  return connected.length / buildings.length
}

function hasDistrictService(
  buildings: readonly BuildingEntity[],
  definitions: Readonly<Record<string, BuildingDefinition>>,
): boolean {
  return buildings.some((building) => definitions[building.type]?.functions?.some((fn) => (
    fn === 'service' || fn === 'market' || fn === 'culture'
  )))
}

function activeLogisticsTouchCount(
  buildingIds: readonly string[],
  logisticsOrders: NonNullable<SimulationSnapshot['logisticsOrders']>,
): number {
  const ids = new Set(buildingIds)
  return Object.values(logisticsOrders).filter((order) => (
    order.state === 'waiting'
    || order.state === 'assigned'
    || order.state === 'in_transit'
  ) && (
    ids.has(order.sourceBuildingId)
    || ids.has(order.destinationBuildingId)
  )).length
}

function gridNeighbors(point: GridPoint): GridPoint[] {
  return [
    { x: point.x + 1, y: point.y },
    { x: point.x - 1, y: point.y },
    { x: point.x, y: point.y + 1 },
    { x: point.x, y: point.y - 1 },
  ]
}

function pointKey(point: GridPoint): string {
  return `${point.x},${point.y}`
}

function activityLevel(prosperity: number): DistrictActivityLevel {
  if (prosperity >= 70) return 'busy'
  if (prosperity >= 35) return 'steady'
  return 'quiet'
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
