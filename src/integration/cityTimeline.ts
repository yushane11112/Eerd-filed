import type { CityTimelineFiscalSnapshot, CityTimelineRecord, CityTimelineResidentProfile, EntityId, SimulationEvent, Tick } from '../simulation/contracts'

export const MAX_CITY_TIMELINE_RECORDS = 200

export interface CityTimelineEventContext {
  buildingName: (buildingId: EntityId) => string
  resourceName: (resource: string) => string
  residentProfile?: (householdId: EntityId) => CityTimelineResidentProfile | undefined
  departedResidentProfile?: (householdId: EntityId) => CityTimelineResidentProfile | undefined
  fiscalSnapshot?: () => CityTimelineFiscalSnapshot | undefined
}

export function appendCityTimelineEvents(
  history: readonly CityTimelineRecord[],
  events: readonly SimulationEvent[],
  tick: Tick,
  context: CityTimelineEventContext,
): CityTimelineRecord[] {
  const appended = events
    .map((event, index) => mapSimulationEvent(event, tick, index, context))
    .filter((record): record is CityTimelineRecord => Boolean(record))
  if (appended.length === 0) return [...history]
  return [...history, ...appended].slice(-MAX_CITY_TIMELINE_RECORDS)
}

function mapSimulationEvent(
  event: SimulationEvent,
  tick: Tick,
  index: number,
  context: CityTimelineEventContext,
): CityTimelineRecord | undefined {
  const id = `city-${tick}-${index}-${event.type}`
  switch (event.type) {
    case 'fiscal-settlement':
      return {
        id,
        tick,
        kind: 'finance',
        source: event.type,
        title: '财政结算完成',
        detail: `本周期税收 ${Math.round(event.taxIncome)}、维护 ${Math.round(event.maintenanceCost)}，库银 ${Math.round(event.treasuryBefore)}→${Math.round(event.treasuryAfter)}；运营压力：阻塞 ${event.operationalPressure.blockedBuildings} 处、物流 ${event.operationalPressure.logisticsBacklog} 单、居民 ${event.operationalPressure.pressuredHouseholds} 户${event.operationalPressureDelta ? `；较上周期阻塞 ${signedNumber(event.operationalPressureDelta.blockedBuildingsDelta)}、物流 ${signedNumber(event.operationalPressureDelta.logisticsBacklogDelta)}、居民压力 ${signedNumber(event.operationalPressureDelta.pressuredHouseholdsDelta)}` : ''}。`,
        fiscal: {
          treasury: event.treasuryAfter,
          treasuryBefore: event.treasuryBefore,
          taxIncome: event.taxIncome,
          maintenanceCost: event.maintenanceCost,
          serviceMaintenanceCost: event.serviceMaintenanceCost,
          settlementTick: event.settlementTick,
        },
        fiscalPressure: {
          current: event.operationalPressure,
          ...(event.operationalPressureDelta ? { delta: event.operationalPressureDelta } : {}),
        },
      }
    case 'service-delivered':
      {
      const fiscal = context.fiscalSnapshot?.()
      const needDetail = event.needBefore === undefined || event.needAfter === undefined
        ? ''
        : `，需求 ${Math.round(event.needBefore)}→${Math.round(event.needAfter)}`
      const fiscalDetail = fiscal
        ? ` 最近财政结算公共服务维护 ${Math.round(fiscal.serviceMaintenanceCost)}，库银 ${fiscal.treasuryBefore === undefined ? Math.round(fiscal.treasury) : `${Math.round(fiscal.treasuryBefore)}→${Math.round(fiscal.treasury)}`}。`
        : ''
      return {
        id,
        tick,
        kind: 'service',
        source: event.type,
        title: '公共服务完成',
        detail: `${context.buildingName(event.buildingId)}满足一户居民的${serviceNeedName(event.need)}需求${needDetail}。${fiscalDetail}`,
        buildingId: event.buildingId,
        serviceDelivery: {
          need: event.need,
          ...(event.needBefore === undefined ? {} : { needBefore: event.needBefore }),
          ...(event.needAfter === undefined ? {} : { needAfter: event.needAfter }),
        },
        ...(fiscal ? { fiscal } : {}),
      }
      }
    case 'service-bottleneck-cleared':
      {
      const fiscal = context.fiscalSnapshot?.()
      return {
        id,
        tick,
        kind: 'service',
        source: event.type,
        title: '服务瓶颈解除',
        detail: `${context.buildingName(event.buildingId)}恢复${serviceNeedName(event.need)}服务${event.previousCause ? `（解除${needPressureCauseName(event.previousCause)}）` : ''}，${event.pressureClearedHouseholds} 户居民压力清除${event.maxPressureTicks > 0 ? `，最长持续 ${event.maxPressureTicks} 刻` : ''}。`,
        buildingId: event.buildingId,
        serviceRecovery: {
          need: event.need,
          ...(event.previousCause ? { previousCause: event.previousCause } : {}),
          pressureClearedHouseholds: event.pressureClearedHouseholds,
          maxPressureTicks: event.maxPressureTicks,
          buildingStatusBefore: event.buildingStatusBefore,
          buildingStatusAfter: event.buildingStatusAfter,
        },
        ...(fiscal ? { fiscal } : {}),
      }
      }
    case 'building-blockage-started':
      return {
        id,
        tick,
        kind: 'operations',
        source: event.type,
        title: '建筑运行受阻',
        detail: `${context.buildingName(event.buildingId)}因${blockageReasonName(event.reason)}停止顺畅运行，阻塞从第 ${event.blockedSinceTick} 刻开始${event.consequences ? `；当刻缺勤 ${event.consequences.absentWorkers} 人、关联物流 ${event.consequences.relatedLogisticsOrders} 单、库存 ${event.consequences.inventoryTotal}${event.consequences.inventoryCapacity === undefined ? '' : `/${event.consequences.inventoryCapacity}`}、居民压力 ${event.consequences.pressuredHouseholds} 户` : ''}。`,
        buildingId: event.buildingId,
        blockage: {
          reason: event.reason,
          blockedSinceTick: event.blockedSinceTick,
          durationTicks: 0,
          ...(event.consequences ? { consequences: event.consequences } : {}),
        },
      }
    case 'building-blockage-cleared':
      return {
        id,
        tick,
        kind: 'operations',
        source: event.type,
        title: '建筑运行恢复',
        detail: `${context.buildingName(event.buildingId)}解除${blockageReasonName(event.reason)}，本次阻塞持续 ${event.durationTicks} 刻，现为${statusName(event.resolvedStatus)}${event.consequences ? `；当刻缺勤 ${event.consequences.absentWorkers} 人、关联物流 ${event.consequences.relatedLogisticsOrders} 单、居民压力 ${event.consequences.pressuredHouseholds} 户` : ''}${event.consequenceDelta ? `；期间变化：库存 ${signedNumber(event.consequenceDelta.inventoryDelta)}、物流 ${signedNumber(event.consequenceDelta.relatedLogisticsOrdersDelta)}、居民压力 ${signedNumber(event.consequenceDelta.pressuredHouseholdsDelta)}` : ''}。`,
        buildingId: event.buildingId,
        blockage: {
          reason: event.reason,
          blockedSinceTick: event.blockedSinceTick,
          durationTicks: event.durationTicks,
          resolvedStatus: event.resolvedStatus,
          ...(event.consequences ? { consequences: event.consequences } : {}),
          ...(event.consequencesAtStart ? { consequencesAtStart: event.consequencesAtStart } : {}),
          ...(event.consequenceDelta ? { consequenceDelta: event.consequenceDelta } : {}),
        },
      }
    case 'purchase-completed':
      return {
        id,
        tick,
        kind: 'finance',
        source: event.type,
        title: '市场交易完成',
        detail: `${context.buildingName(event.buildingId)}售出${context.resourceName(event.resource)}×${event.amount}，税收 +${event.taxPaid}。`,
        buildingId: event.buildingId,
      }
    case 'household-migrated':
      {
      const fiscal = context.fiscalSnapshot?.()
      const fiscalDetail = fiscal
        ? ` 最近财政结算：库银 ${fiscal.treasuryBefore === undefined ? Math.round(fiscal.treasury) : `${Math.round(fiscal.treasuryBefore)}→${Math.round(fiscal.treasury)}`}，维护 ${Math.round(fiscal.maintenanceCost)}（公共服务 ${Math.round(fiscal.serviceMaintenanceCost)}）。`
        : ''
      return {
        id,
        tick,
        kind: 'population',
        source: event.type,
        title: event.direction === 'in' ? '新家庭入住' : '家庭离开城市',
        detail: event.direction === 'in'
          ? '一户新家庭已完成入住，人口与劳动力池更新。'
          : `一户家庭因${migrationOutReasonDetail(event.reason, event.need, event.absenceTicks)}离开城市，住房与劳动力需求随之释放。${fiscalDetail}`,
        ...(event.direction === 'out' && event.needCause
          ? { detail: `${migrationOutReasonDetail(event.reason, event.need, event.absenceTicks)}；服务瓶颈：${needPressureCauseName(event.needCause)}${event.serviceBuildingId ? `（${context.buildingName(event.serviceBuildingId)}）` : ''}，住房与劳动力需求随之释放。${fiscalDetail}` }
          : {}),
        resident: event.direction === 'in'
          ? context.residentProfile?.(event.householdId)
        : context.departedResidentProfile?.(event.householdId) ?? {
            phase: 'departed',
            origin: '离城家庭',
            members: 0,
            workerCount: 0,
            employedCount: 0,
            occupations: [],
          },
        ...(fiscal ? { fiscal } : {}),
      }
      }
    case 'migration-candidate-arrived':
      return {
        id,
        tick,
        kind: 'population',
        source: event.type,
        title: '外来人口抵达城门',
        detail: `一批 ${event.members} 人的家庭抵达，当前吸引力 ${event.attraction}。`,
        resident: {
          phase: 'arrived',
          origin: '候选家庭',
          members: event.members,
          workerCount: Math.max(1, Math.floor(event.members / 2)),
          employedCount: 0,
          occupations: ['待安置'],
        },
      }
    case 'migration-candidate-left':
      return {
        id,
        tick,
        kind: 'population',
        source: event.type,
        title: '外来人口离开',
        detail: `候选家庭因${migrationLeaveReasonName(event.reason)}离开，未进入城市人口。`,
        resident: {
          phase: 'departed',
          origin: '离城家庭',
          members: 0,
          workerCount: 0,
          employedCount: 0,
          occupations: [],
        },
      }
    case 'worker-employment-changed':
      return {
        id,
        tick,
        kind: 'labor',
        source: event.type,
        title: event.buildingId ? '居民获得岗位' : '居民失去岗位',
        detail: event.buildingId
          ? `一名居民进入${context.buildingName(event.buildingId)}工作，劳动力状态已更新。`
          : '一名居民暂时失去岗位，城市可用劳动力发生变化。',
        ...(event.buildingId ? { buildingId: event.buildingId } : {}),
        ...(event.householdId ? { resident: context.residentProfile?.(event.householdId) } : {}),
      }
    case 'worker-attendance-changed':
      return {
        id,
        tick,
        kind: 'labor',
        source: event.type,
        title: event.status === 'absent' ? '居民缺勤' : '居民恢复出勤',
        detail: event.status === 'absent'
          ? `一名居民因${attendanceReasonName(event.reason)}暂时缺勤，相关建筑有效劳动力下降。`
          : '一名居民状态恢复，重新进入工作路线。',
        ...(event.buildingId ? { buildingId: event.buildingId } : {}),
        ...(event.householdId ? { resident: context.residentProfile?.(event.householdId) } : {}),
      }
    default:
      return undefined
  }
}

function attendanceReasonName(reason: string): string {
  return reason === 'low-health' ? '健康状况不佳' : reason === 'low-satisfaction' ? '满意度过低' : '状态变化'
}

function serviceNeedName(need: string): string {
  return ({
    food: '粮食',
    goods: '日用品',
    health: '医疗',
    culture: '文化',
  } as Record<string, string>)[need] ?? need
}

function migrationLeaveReasonName(reason: string): string {
  return ({
    'no-housing': '没有可用住房',
    'low-attraction': '城市吸引力不足',
    'wait-timeout': '等待时间过长',
  } as Record<string, string>)[reason] ?? reason
}

function migrationOutReasonDetail(
  reason: string | undefined,
  need: string | undefined,
  absenceTicks: number | undefined,
): string {
  const name = ({
    'critical-needs': '关键需求长期无法满足',
    unemployment: '长期失业',
    'chronic-absence': '长期缺勤',
    'low-satisfaction': '长期满意度过低',
  } as Record<string, string>)[reason ?? 'low-satisfaction'] ?? '城市生活压力'
  if (reason === 'critical-needs' && need) return `${name}（${migrationNeedName(need)}）`
  if (reason === 'chronic-absence' && absenceTicks !== undefined) return `${name}（连续${absenceTicks}刻）`
  return name
}

function migrationNeedName(need: string): string {
  return ({
    food: '粮食',
    goods: '日用品',
    health: '医疗',
    education: '教育',
    entertainment: '娱乐',
  } as Record<string, string>)[need] ?? need
}

function needPressureCauseName(cause: string): string {
  return ({
    'no-workers': '服务建筑没有有效工人',
    'missing-resource': '服务库存缺少所需资源',
    'no-route': '居民无法通过道路到达服务点',
    capacity: '服务容量不足，居民持续排队',
    unaffordable: '家庭收入不足以完成交易',
  } as Record<string, string>)[cause] ?? cause
}

function blockageReasonName(reason: string): string {
  if (reason === 'no-workers') return '缺工'
  if (reason === 'output-full' || reason === 'storage-full' || reason.includes('destination-capacity')) return '仓满'
  if (reason === 'no-service-route' || reason.startsWith('logistics-failed:')) return '道路或物流中断'
  if (reason.startsWith('missing-input:') || reason.startsWith('missing-service-resource:')) return '缺料'
  return '运行异常'
}

function statusName(status: string): string {
  return ({
    idle: '待机',
    working: '生产',
    delivering: '配送',
    serving: '服务',
    blocked: '阻塞',
    constructing: '建造',
    upgrading: '升级',
  } as Record<string, string>)[status] ?? status
}

function signedNumber(value: number): string {
  return value > 0 ? `+${value}` : `${value}`
}
