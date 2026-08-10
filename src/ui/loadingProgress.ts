export type CanvasLoadingPhase =
  | 'graphics'
  | 'artwork'
  | 'scene'
  | 'terrain'
  | 'first-sync'
  | 'ready'

interface CanvasLoadingStep {
  phase: CanvasLoadingPhase
  label: string
  detail: string
  progress: number
}

const CANVAS_LOADING_STEPS: CanvasLoadingStep[] = [
  {
    phase: 'graphics',
    label: '唤醒水乡画卷',
    detail: '准备河道、地块和城市画布',
    progress: 12,
  },
  {
    phase: 'artwork',
    label: '铺开街坊灯火',
    detail: '加载建筑图集、动效和等级外观',
    progress: 38,
  },
  {
    phase: 'scene',
    label: '搭起城镇骨架',
    detail: '组织建筑、居民、货运和治理图层',
    progress: 62,
  },
  {
    phase: 'terrain',
    label: '描出水岸道路',
    detail: '绘制岸线、田地、桥梁和道路底色',
    progress: 78,
  },
  {
    phase: 'first-sync',
    label: '点亮第一帧',
    detail: '同步真实模拟快照并接入动态城市',
    progress: 92,
  },
  {
    phase: 'ready',
    label: '城市已就绪',
    detail: '可以继续营造、治理和观察居民生活',
    progress: 100,
  },
]

const STEP_BY_PHASE = new Map(CANVAS_LOADING_STEPS.map((step) => [step.phase, step]))

export interface CanvasLoadingStatus {
  phase: CanvasLoadingPhase
  label: string
  detail: string
  progress: number
  elapsedMs: number
}

export function canvasLoadingStatus(phase: CanvasLoadingPhase, elapsedMs = 0): CanvasLoadingStatus {
  const step = STEP_BY_PHASE.get(phase) ?? STEP_BY_PHASE.get('graphics')
  if (!step) {
    return {
      phase: 'graphics',
      label: '唤醒水乡画卷',
      detail: '准备河道、地块和城市画布',
      progress: 12,
      elapsedMs,
    }
  }
  return {
    ...step,
    elapsedMs,
  }
}

export function canvasLoadingPhaseOrder(): CanvasLoadingPhase[] {
  return CANVAS_LOADING_STEPS.map((step) => step.phase)
}
