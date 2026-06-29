import {
  AlertTriangle,
  Building2,
  Coins,
  Compass,
  Expand,
  FastForward,
  Hammer,
  HeartPulse,
  House,
  Lock,
  Music2,
  Pause,
  Pickaxe,
  Play,
  RotateCw,
  Route,
  Users,
  Warehouse,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { SimulationCanvas } from './components/SimulationCanvas'
import type { CameraFocusRequest } from './components/SimulationCanvas'
import {
  BUILDING_DEFINITIONS,
  CITY_STAGE_LABELS,
  deriveRuntimeCityStage,
  GameRuntime,
  getRuntimeCityStageProgress,
  getRuntimeBuildingMenu,
  getRuntimeBuildingMenuState,
  isRuntimeBuildingUnlocked,
  type BuildTool,
} from './integration/GameRuntime'
import {
  AmbientCityStoryTracker,
  type AmbientCityStory,
  type CityNoticeTarget,
} from './integration/cityNotices'
import {
  deriveStageAdvisorOverlay,
  deriveStageGovernanceCards,
  deriveStageMapOverlay,
  STAGE_ADVISOR_OVERLAY_MODES,
  type StageAdvisorOverlay,
  type StageAdvisorOverlayMode,
} from './integration/stageAdvisor'
import {
  createBrowserFullscreenAdapter,
  FullscreenController,
  type FullscreenState,
} from './ui'
import './styles.css'

const INITIAL_FULLSCREEN: FullscreenState = {
  supported: true,
  active: false,
  pending: false,
  error: null,
}

export default function App() {
  const runtime = useMemo(() => new GameRuntime(), [])
  const snapshot = useSyncExternalStore(runtime.subscribe, runtime.getSnapshot)
  const [tool, setTool] = useState<BuildTool>({ kind: 'inspect' })
  const [toast, setToast] = useState('欢迎回到小耳镇：铺路、建房，让居民真正生活起来。')
  const [ambientStories, setAmbientStories] = useState<AmbientCityStoryItem[]>([])
  const [fullscreen, setFullscreen] = useState(INITIAL_FULLSCREEN)
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null)
  const [bottleneckOpen, setBottleneckOpen] = useState(false)
  const [optionalRewardOpen, setOptionalRewardOpen] = useState(false)
  const [stageAdvisorOverlay, setStageAdvisorOverlay] = useState<StageAdvisorOverlay | null>(null)
  const [activeStageOverlayMode, setActiveStageOverlayMode] = useState<StageAdvisorOverlayMode | null>(null)
  const [cameraFocusRequest, setCameraFocusRequest] = useState<CameraFocusRequest | null>(null)
  const shellRef = useRef<HTMLElement>(null)
  const fullscreenRef = useRef<FullscreenController | null>(null)
  const cameraFocusIdRef = useRef(0)
  const ambientStoryTrackerRef = useRef(new AmbientCityStoryTracker())

  useEffect(() => {
    const timer = window.setInterval(() => runtime.advance(100), 100)
    return () => window.clearInterval(timer)
  }, [runtime])

  useEffect(() => {
    const controller = new FullscreenController(
      createBrowserFullscreenAdapter(),
      () => shellRef.current,
    )
    fullscreenRef.current = controller
    setFullscreen(controller.getState())
    const unsubscribe = controller.subscribe((state) => setFullscreen({ ...state }))
    return () => {
      unsubscribe()
      controller.dispose()
    }
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 3200)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    setAmbientStories(ambientStoryTrackerRef.current.update(snapshot).slice(0, 3))
  }, [snapshot])

  useEffect(() => {
    if (!activeStageOverlayMode) return
    setStageAdvisorOverlay(deriveStageMapOverlay(activeStageOverlayMode, snapshot, Date.now()) ?? null)
  }, [activeStageOverlayMode, snapshot])

  const selectedBuilding = selectedBuildingId
    ? snapshot.buildings[selectedBuildingId]
    : undefined
  const selectedDefinition = selectedBuilding
    ? BUILDING_DEFINITIONS[selectedBuilding.type]
    : undefined
  const selectedUpgrade = selectedBuilding
    ? runtime.getBuildingUpgradeQuote(selectedBuilding.id)
    : undefined
  const rareTotal = Object.values(snapshot.rareRewards.inventory)
    .reduce((sum, value) => sum + (value ?? 0), 0)
  const needScore = averageNeeds(snapshot)
  const bottlenecks = useMemo(() => getCityBottlenecks(snapshot), [snapshot])
  const cityStage = deriveRuntimeCityStage(snapshot.metrics)
  const stageProgress = getRuntimeCityStageProgress(snapshot.metrics)
  const buildMenu = getRuntimeBuildingMenuState(cityStage, snapshot)
  const chooseTool = (next: BuildTool) => {
    setTool(next)
    setSelectedBuildingId(null)
    if (next.kind === 'road') setToast('道路模式：点击地块连续铺设石路。')
    if (next.kind === 'building') setToast(`营造「${BUILDING_DEFINITIONS[next.type].name}」：点击绿色可建地块。`)
  }

  const setSpeed = (speed: 0 | 1 | 2 | 4) => {
    runtime.setSpeed(speed)
    setToast(speed === 0 ? '城市模拟已暂停' : `城市模拟速度：${speed} 倍`)
  }

  const simulateSong = () => {
    const result = runtime.completeSong()
    if (result.reward) {
      setToast(`完整听完一首歌，获得稀缺材料「${rareName(result.reward)}」！`)
    } else {
      setToast(`本次未获得稀缺材料，保底进度 ${result.misses}/5。`)
    }
  }

  const upgradeSelectedBuilding = () => {
    if (!selectedBuilding || !selectedUpgrade) return
    if (selectedUpgrade.reason === 'upgrading' || selectedUpgrade.reason === 'already-upgrading') {
      setToast('这座建筑正在升级中，稍后再看。')
      return
    }
    if (selectedUpgrade.reason === 'max-level') {
      setToast('这座建筑已达到最高等级。')
      return
    }
    const result = runtime.upgradeBuilding(selectedBuilding.id)
    setToast(result.message)
  }

  const focusCityTarget = (target: CityFocusTarget | undefined, fallbackTitle: string) => {
    if (!target) {
      setToast(`${fallbackTitle}：暂无可定位建筑，先观察道路、库存和居民区。`)
      return
    }

    if (target.kind === 'building') {
      const building = snapshot.buildings[target.buildingId]
      if (!building) {
        setToast(`${fallbackTitle}：关联建筑已变化，稍后会刷新提示。`)
        return
      }
      setTool({ kind: 'inspect' })
      setSelectedBuildingId(target.buildingId)
      setCameraFocusRequest({
        id: ++cameraFocusIdRef.current,
        target,
        smooth: true,
      })
      const name = BUILDING_DEFINITIONS[building.type]?.name ?? building.type
      setToast(`已定位到「${name}」。`)
      return
    }

    setTool({ kind: 'inspect' })
    setSelectedBuildingId(null)
    setCameraFocusRequest({
      id: ++cameraFocusIdRef.current,
      target: { kind: 'point', point: target.point },
      smooth: true,
    })
    setToast(`${fallbackTitle}：已定位到 ${target.label}（${target.point.x}, ${target.point.y}）附近。`)
  }

  const followStageRequirement = (
    requirement: (typeof stageProgress.requirements)[number],
  ) => {
    if (requirement.met) {
      setToast(`${requirement.label}已达标，继续补齐其他阶段条件。`)
      return
    }
    setActiveStageOverlayMode(null)
    setStageAdvisorOverlay(deriveStageAdvisorOverlay(requirement.id, snapshot, Date.now()) ?? null)
    if (requirement.id === 'population') {
      chooseTool({ kind: 'building', type: 'house', rotation: 0 })
      setToast(`阶段顾问：${requirement.diagnosis}`)
      return
    }
    if (requirement.id === 'attraction') {
      setBottleneckOpen(true)
      setToast(`阶段顾问：${requirement.diagnosis}`)
      return
    }
    const district = snapshot.districts?.[0]
    if (district) {
      focusCityTarget(
        { kind: 'point', point: district.center, label: district.name },
        '阶段顾问',
      )
      return
    }
    chooseTool({ kind: 'building', type: 'market', rotation: 0 })
    setToast(`阶段顾问：${requirement.diagnosis}`)
  }

  const toggleStageOverlayMode = (mode: StageAdvisorOverlayMode) => {
    if (activeStageOverlayMode === mode) {
      setActiveStageOverlayMode(null)
      setStageAdvisorOverlay(null)
      setToast('阶段图层已关闭。')
      return
    }
    const overlay = deriveStageMapOverlay(mode, snapshot, Date.now()) ?? null
    setActiveStageOverlayMode(mode)
    setStageAdvisorOverlay(overlay)
    setToast(overlay ? `已打开${overlay.label}图层。` : '当前地图还没有可显示的图层点。')
  }

  const focusStageOverlayMetric = (label: string) => {
    if (!activeStageOverlayMode || !stageAdvisorOverlay) return
    const point = pickStageOverlayPoint(activeStageOverlayMode, label, stageAdvisorOverlay)
    if (!point) {
      setToast(`${stageAdvisorOverlay.label}：当前没有可定位的${label}。`)
      return
    }
    focusCityTarget(
      { kind: 'point', point: point.position, label: point.label },
      stageAdvisorOverlay.label,
    )
  }

  const applyBottleneckRecommendation = (item: CityBottleneck) => {
    const recommendation = item.recommendation
    if (recommendation.overlayMode) {
      const overlay = deriveStageMapOverlay(recommendation.overlayMode, snapshot, Date.now()) ?? null
      setActiveStageOverlayMode(recommendation.overlayMode)
      setStageAdvisorOverlay(overlay)
    }
    if (recommendation.tool === 'road') {
      chooseTool({ kind: 'road' })
      setToast(`${item.title}：${recommendation.label}。`)
      return
    }
    if (recommendation.tool === 'building' && recommendation.buildingType) {
      if (!BUILDING_DEFINITIONS[recommendation.buildingType]) {
        setTool({ kind: 'inspect' })
        setToast(`${item.title}：推荐建筑暂未开放，先按图层定位问题。`)
        return
      }
      const currentStage = deriveRuntimeCityStage(snapshot.metrics)
      if (!isRuntimeBuildingUnlocked(recommendation.buildingType, currentStage)) {
        setTool({ kind: 'inspect' })
        setToast(`${item.title}：${recommendation.availability?.reason ?? '推荐建筑当前阶段未解锁'}先按图层定位问题。`)
        return
      }
      if (recommendation.execution && !recommendation.execution.buildable) {
        setTool({ kind: 'inspect' })
        setToast(`${item.title}：${recommendation.execution.reason}`)
        return
      }
      chooseTool({ kind: 'building', type: recommendation.buildingType, rotation: 0 })
      setToast(`${item.title}：${recommendation.label}。`)
      return
    }
    setTool({ kind: 'inspect' })
    setToast(`${item.title}：${recommendation.label}。`)
  }

  const resolveAmbientStory = (story: AmbientCityStoryItem, shouldFocus = true) => {
    if (story.target && shouldFocus) {
      focusCityTarget(story.target, story.title)
    } else {
      setToast(`${story.title}：已记下，不影响继续建设。`)
    }
    ambientStoryTrackerRef.current.resolve(story.id)
    setAmbientStories((current) => current.filter((item) => item.id !== story.id))
  }

  return (
    <main className="simulation-app" ref={shellRef}>
      <section className="portrait-blocker">
        <RotateCw />
        <h1>请横屏进入小耳岛</h1>
        <p>城市建造和地图拖拽仅提供横屏体验。</p>
      </section>

      <SimulationCanvas
        runtime={runtime}
        snapshot={snapshot}
        tool={tool}
        cameraFocusRequest={cameraFocusRequest}
        stageAdvisorOverlay={stageAdvisorOverlay}
        onToolChange={setTool}
        onToast={setToast}
        onBuildingSelect={setSelectedBuildingId}
      />

      <header className="city-header glass-panel">
        <div className="city-emblem"><House /></div>
        <div>
          <h1>小耳镇</h1>
          <p>动态文明垂直切片 · 第 {snapshot.tick} 刻</p>
        </div>
      </header>

      <section className="metrics-bar glass-panel" aria-label="城市指标">
        <Metric icon={<Users />} label="人口" value={`${snapshot.metrics.population}/${snapshot.metrics.housingCapacity}`} />
        <Metric icon={<Hammer />} label="就业" value={`${snapshot.metrics.employedWorkers}/${snapshot.metrics.employedWorkers + snapshot.metrics.availableJobs}`} />
        <Metric icon={<Compass />} label="吸引" value={`${Math.round(snapshot.metrics.cityAttraction ?? 0)}%`} />
        <Metric icon={<HeartPulse />} label="民需" value={`${Math.round(needScore)}%`} />
        <Metric icon={<Coins />} label="财政" value={Math.round(snapshot.economy.treasury).toLocaleString()} />
        <Metric icon={<Route />} label="物流" value={`${Math.round(snapshot.metrics.logisticsEfficiency)}%`} />
        <Metric icon={<Music2 />} label="珍材" value={String(rareTotal)} accent />
      </section>

      <aside className="build-palette glass-panel">
        <div className="palette-title">
          <span><Building2 /> 城建</span>
          <small>{CITY_STAGE_LABELS[cityStage]}</small>
        </div>
        <button
          className={tool.kind === 'inspect' ? 'active' : ''}
          onClick={() => chooseTool({ kind: 'inspect' })}
        >
          <Pickaxe /><span>查看</span>
        </button>
        <button
          className={tool.kind === 'road' ? 'active' : ''}
          onClick={() => chooseTool({ kind: 'road' })}
        >
          <Route /><span>道路</span>
        </button>
        {buildMenu.map((item) => (
          <button
            key={item.type}
            className={[
              tool.kind === 'building' && tool.type === item.type ? 'active' : '',
              item.unlocked ? '' : 'locked',
              item.unlocked && !item.canBuild ? 'unaffordable' : '',
            ].filter(Boolean).join(' ')}
            disabled={!item.unlocked || !item.canBuild}
            title={item.unavailableReason ?? `${item.shortName}：${formatConstructionCost(item.construction.cost)}`}
            onClick={() => {
              if (!item.unlocked) {
                setToast(`${item.shortName}需要进入${item.requiredStageLabel}后营造。`)
                return
              }
              if (!item.canBuild) {
                setToast(`${item.shortName}暂不可营造：${item.unavailableReason ?? '资源不足'}。`)
                return
              }
              chooseTool({ kind: 'building', type: item.type, rotation: 0 })
            }}
          >
            {!item.unlocked
              ? <Lock />
              : item.icon === 'home'
                ? <House />
                : item.icon === 'storage'
                  ? <Warehouse />
                  : <Building2 />}
            <span>{item.shortName}</span>
            <small>{formatConstructionCost(item.construction.cost)}</small>
            {item.unavailableReason && item.unlocked && (
              <em>{item.unavailableReason}</em>
            )}
          </button>
        ))}
      </aside>

      <section className="simulation-controls glass-panel">
        <button className={snapshot.speed === 0 ? 'active' : ''} onClick={() => setSpeed(0)} aria-label="暂停"><Pause /></button>
        <button className={snapshot.speed === 1 ? 'active' : ''} onClick={() => setSpeed(1)}><Play />1×</button>
        <button className={snapshot.speed === 2 ? 'active' : ''} onClick={() => setSpeed(2)}><FastForward />2×</button>
        <button className={snapshot.speed === 4 ? 'active' : ''} onClick={() => setSpeed(4)}><FastForward />4×</button>
        <i />
        <button
          onClick={() => fullscreenRef.current?.toggle()}
          disabled={fullscreen.pending || !fullscreen.supported}
          title={fullscreen.error ?? '切换全屏'}
        >
          <Expand />{fullscreen.active ? '退出' : '全屏'}
        </button>
      </section>

      <section className={`music-reward glass-panel ${optionalRewardOpen ? 'open' : 'collapsed'}`}>
        {!optionalRewardOpen ? (
          <button
            type="button"
            className="music-toggle"
            onClick={() => setOptionalRewardOpen(true)}
            title="可选轻奖励"
          >
            <Music2 />
            <span>轻奖励</span>
          </button>
        ) : (
          <>
            <div className="music-disc"><Music2 /></div>
            <div>
              <strong>可选听歌轻奖励</strong>
              <span>只给珍材，不影响城市主线</span>
            </div>
            <button onClick={simulateSong}>模拟</button>
            <button
              type="button"
              className="music-close"
              onClick={() => setOptionalRewardOpen(false)}
              aria-label="收起轻奖励"
            >
              <X />
            </button>
          </>
        )}
      </section>

      {!selectedBuilding && (
        <aside className="stage-panel glass-panel" aria-label="城市阶段目标">
          <div className="stage-head">
            <span><Compass /> 阶段</span>
            <b>{stageProgress.stageLabel}</b>
          </div>
          {stageProgress.nextStageLabel ? (
            <>
              <p>下一阶段：{stageProgress.nextStageLabel}</p>
              <div className="stage-requirements">
                {stageProgress.requirements.map((requirement) => (
                  <button
                    key={requirement.id}
                    type="button"
                    className={requirement.met ? 'met' : ''}
                    onClick={() => followStageRequirement(requirement)}
                    title={requirement.advice}
                  >
                    <span>{requirement.label}</span>
                    <b>
                      {requirement.current}{requirement.suffix ?? ''}
                      /{requirement.target}{requirement.suffix ?? ''}
                    </b>
                    <em>{requirement.diagnosis}</em>
                  </button>
                ))}
              </div>
              <div className="stage-layer-switcher" aria-label="阶段地图图层">
                {STAGE_ADVISOR_OVERLAY_MODES.map((item) => (
                  <button
                    key={item.mode}
                    type="button"
                    className={activeStageOverlayMode === item.mode ? 'active' : ''}
                    onClick={() => toggleStageOverlayMode(item.mode)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              {activeStageOverlayMode && stageAdvisorOverlay?.metrics && (
                <div className="stage-layer-readout" aria-label="当前图层指标">
                  <strong>{stageAdvisorOverlay.label}</strong>
                  {formatStageOverlayMetrics(activeStageOverlayMode, stageAdvisorOverlay.metrics).map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => focusStageOverlayMetric(item.label)}
                    >
                      <b>{item.value}</b>{item.label}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p>城市阶段已达当前版本上限，继续优化街区和民生。</p>
          )}
        </aside>
      )}

      <aside className={`bottleneck-panel glass-panel ${bottleneckOpen ? 'open' : ''}`} aria-label="城市瓶颈管理">
        <button
          className="bottleneck-toggle"
          onClick={() => setBottleneckOpen((open) => !open)}
          aria-expanded={bottleneckOpen}
        >
          <span><AlertTriangle /> 瓶颈</span>
          <b>{bottlenecks.length || '稳'}</b>
        </button>
        {bottleneckOpen && (
          <div className="bottleneck-body">
            <p>优先处理最影响运转的 3 件事。</p>
            {bottlenecks.length === 0 ? (
              <div className="bottleneck-empty">暂无明显瓶颈，继续扩建前留意物流和居民需求。</div>
            ) : (
              bottlenecks.map((item) => (
                <article
                  key={item.id}
                  className={`bottleneck-card severity-${item.severity} ${item.target ? 'is-focusable' : ''}`}
                >
                  <strong>{item.title}</strong>
                  <span>{item.detail}</span>
                  <small>原因：{item.cause}</small>
                  {item.recommendation.availability?.unlocked === false && item.recommendation.availability.reason && (
                    <small>阶段限制：{item.recommendation.availability.reason}</small>
                  )}
                  {item.recommendation.execution && (
                    <small>营造条件：{item.recommendation.execution.reason}</small>
                  )}
                  <em>{item.action}</em>
                  <div className="bottleneck-actions">
                    <button
                      type="button"
                      onClick={() => focusCityTarget(item.target, item.title)}
                    >
                      定位
                    </button>
                    <button
                      type="button"
                      className="primary"
                      onClick={() => applyBottleneckRecommendation(item)}
                    >
                      {item.recommendation.label}
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        )}
      </aside>

      {ambientStories.length > 0 && (
        <aside className="city-notice-stream glass-panel" aria-label="城市小事流">
          <div className="city-notice-title">
            <span>岛上小事</span>
            <small>看完就散</small>
          </div>
          {ambientStories.map((story) => (
            <article
              key={story.id}
              className={`city-notice city-story ${story.resolved ? 'settled' : 'active'}`}
            >
              <strong>{story.title}</strong>
              <span>{story.body}</span>
              <div className="city-story-actions">
                <button type="button" onClick={() => resolveAmbientStory(story)}>
                  {story.actionLabel}
                </button>
                {story.target && (
                  <button type="button" className="ghost" onClick={() => resolveAmbientStory(story, false)}>
                    知道了
                  </button>
                )}
              </div>
            </article>
          ))}
        </aside>
      )}

      {selectedBuilding && selectedDefinition && (
        <aside className="building-inspector glass-panel">
          <button className="inspector-close" onClick={() => setSelectedBuildingId(null)}><X /></button>
          <small>{selectedDefinition.category.toUpperCase()}</small>
          <h2>{selectedDefinition.name}</h2>
          <p className={`status status-${selectedBuilding.status}`}>
            {statusName(selectedBuilding.status)}
            {selectedBuilding.statusReason ? ` · ${reasonName(selectedBuilding.statusReason)}` : ''}
          </p>
          <div className="inspector-grid">
            <span>等级<b>{selectedBuilding.level}</b></span>
            <span>岗位<b>{selectedBuilding.workers.length}/{selectedDefinition.jobs}</b></span>
            <span>产能<b>{Math.round(selectedBuilding.productionProgress)} 刻</b></span>
            <span>库存<b>{Object.values(selectedBuilding.inventory).reduce((a, b) => a + (b ?? 0), 0)}</b></span>
          </div>
          {selectedUpgrade && (
            <div className="upgrade-card">
              <div className="upgrade-head">
                <span>建筑升级</span>
                <b>
                  Lv.{selectedUpgrade.currentLevel}
                  {selectedUpgrade.nextLevel ? ` → Lv.${selectedUpgrade.nextLevel}` : ' · 满级'}
                </b>
              </div>
              <p>
                成本：{formatResourceList(selectedUpgrade.cost)}
                {selectedUpgrade.effect
                  ? ` · 升级后容量 ${selectedUpgrade.effect.capacity}，岗位 ${selectedUpgrade.effect.jobs}`
                  : ''}
              </p>
              {Object.keys(selectedUpgrade.missing).length > 0 && (
                <em>缺少：{formatResourceList(selectedUpgrade.missing)}</em>
              )}
              {selectedUpgrade.reason === 'upgrading' && <em>施工中，暂不能重复升级。</em>}
              {selectedUpgrade.reason === 'max-level' && <em>已达到最高等级。</em>}
              <button
                type="button"
                onClick={upgradeSelectedBuilding}
                disabled={selectedUpgrade.reason === 'upgrading' || selectedUpgrade.reason === 'already-upgrading' || selectedUpgrade.reason === 'max-level' || selectedUpgrade.reason === 'invalid-level' || selectedUpgrade.reason === 'unknown-building'}
                title={upgradeButtonTitle(selectedUpgrade.reason)}
              >
                {selectedUpgrade.reason === 'upgrading' || selectedUpgrade.reason === 'already-upgrading'
                  ? '升级中'
                  : selectedUpgrade.reason === 'max-level'
                    ? '已满级'
                    : selectedUpgrade.canUpgrade
                      ? '升级'
                      : '尝试升级'}
              </button>
            </div>
          )}
          <p className="inspector-note">建筑状态由人口、原料、道路和物流实时驱动。</p>
        </aside>
      )}

      <div className={`tool-hint ${tool.kind !== 'inspect' ? 'visible' : ''}`}>
        {tool.kind === 'road'
          ? '道路模式 · 点击铺路 · 右键返回查看'
          : tool.kind === 'building'
            ? `${BUILDING_DEFINITIONS[tool.type].name} · R 旋转 · 右键取消`
            : ''}
      </div>
      {toast && <div className="game-toast">{toast}</div>}
    </main>
  )
}

function Metric({ icon, label, value, accent = false }: {
  icon: React.ReactNode
  label: string
  value: string
  accent?: boolean
}) {
  return <div className={accent ? 'metric accent' : 'metric'}>{icon}<span>{label}<b>{value}</b></span></div>
}

function statusName(status: string) {
  return ({
    constructing: '营造中',
    idle: '待命',
    working: '生产中',
    delivering: '运输中',
    serving: '服务中',
    blocked: '暂停运转',
    upgrading: '升级中',
  } as Record<string, string>)[status] ?? status
}

function reasonName(reason: string) {
  if (reason === 'no-workers') return '缺少工人'
  if (reason === 'output-full') return '仓储已满'
  if (reason === 'no-service-demand') return '暂无服务需求'
  if (reason.startsWith('missing-input:')) return `缺少${reason.slice(14)}`
  if (reason.startsWith('missing-service-resource:')) return `缺少服务库存：${reason.slice(25)}`
  return reason
}

function rareName(resource: string) {
  return ({ jade: '玉石', silk: '云锦', porcelain: '名瓷', blueprint: '营造图' } as Record<string, string>)[resource] ?? resource
}

function upgradeButtonTitle(reason: string | undefined) {
  if (reason === 'upgrading') return '建筑正在升级中'
  if (reason === 'already-upgrading') return '建筑正在升级中'
  if (reason === 'max-level') return '已达到最高等级'
  if (reason === 'insufficient-materials') return '材料不足，点击可查看失败提示'
  return '消耗城市仓储材料升级'
}

function formatResourceList(resources: Partial<Record<string, number>>) {
  const entries = Object.entries(resources)
    .filter((entry): entry is [string, number] => typeof entry[1] === 'number' && entry[1] > 0)
  if (entries.length === 0) return '无'
  return entries.map(([resource, amount]) => `${resourceName(resource)}×${amount}`).join('、')
}

function formatConstructionCost(cost: { treasury: number; materials: Partial<Record<string, number>> }) {
  const materials = formatResourceList(cost.materials)
  return materials === '无'
    ? `银两${cost.treasury}`
    : `银两${cost.treasury} · ${materials}`
}

type BottleneckSeverity = 'high' | 'medium' | 'low'

interface CityBottleneck {
  id: string
  title: string
  detail: string
  cause: string
  action: string
  recommendation: {
    label: string
    tool: 'road' | 'building' | 'inspect'
    buildingType?: string
    overlayMode?: StageAdvisorOverlayMode
    availability?: {
      unlocked: boolean
      currentStageLabel: string
      requiredStageLabel?: string
      reason?: string
    }
    execution?: {
      buildable: boolean
      reason: string
      candidate?: { x: number; y: number }
      landCandidates: number
      roadAnchors: number
    }
  }
  score: number
  severity: BottleneckSeverity
  target?: CityFocusTarget
}

type CityFocusTarget = CityNoticeTarget

interface AmbientCityStoryItem extends AmbientCityStory {
  target?: CityFocusTarget
}

function getCityBottlenecks(snapshot: ReturnType<GameRuntime['getSnapshot']>) {
  const bottlenecks: CityBottleneck[] = deriveStageGovernanceCards(snapshot).map((card) => ({
    id: card.id,
    title: card.title,
    detail: card.detail,
    cause: card.cause,
    action: card.action,
    recommendation: card.recommendation,
    score: card.score,
    severity: card.severity,
    target: card.target
      ? { kind: 'point', point: card.target.point, label: card.target.label }
      : undefined,
  }))
  const buildings = Object.values(snapshot.buildings)
  const reasonCounts = buildings.reduce((counts, building) => {
    if (!building.statusReason || building.statusReason === 'no-service-demand') return counts
    counts.set(building.statusReason, (counts.get(building.statusReason) ?? 0) + 1)
    return counts
  }, new Map<string, number>())

  for (const [reason, count] of reasonCounts) {
    const target = buildings.find((building) => building.statusReason === reason)
    const missingResource = reason.startsWith('missing-input:')
      ? reason.slice('missing-input:'.length)
      : reason.startsWith('missing-service-resource:')
        ? reason.slice('missing-service-resource:'.length)
        : ''
    const entry = reason === 'no-workers'
      ? {
          title: '缺工',
          detail: `${count} 座建筑缺少工人，产出会停摆。`,
          cause: '岗位增长快于住房和迁入速度，建筑拿不到稳定劳动力。',
          action: '先补住房与居民，再扩新岗位。',
          recommendation: {
            label: '营造民居',
            tool: 'building' as const,
            buildingType: 'house',
            overlayMode: 'housing' as const,
          },
          score: 90 + count,
        }
      : reason === 'output-full'
        ? {
            title: '仓满',
            detail: `${count} 座建筑库存顶满，后续产出被堵住。`,
            cause: '产出建筑缺少仓储缓冲或道路转运，库存堆在原地。',
            action: '增加仓储或道路，把货运出去。',
            recommendation: {
              label: '营造仓储',
              tool: 'building' as const,
              buildingType: 'granary',
              overlayMode: 'logistics' as const,
            },
            score: 78 + count,
          }
        : missingResource
          ? {
              title: '缺料',
              detail: `${count} 座建筑缺少「${resourceName(missingResource)}」。`,
              cause: '上游产线、仓储库存或道路运输无法把所需材料送达。',
              action: '补对应产线，或检查道路和仓储连接。',
              recommendation: {
                label: '检查物流图层',
                tool: 'inspect' as const,
                overlayMode: 'logistics' as const,
              },
              score: 84 + count,
            }
          : {
              title: '建筑停摆',
              detail: `${count} 座建筑：${reasonName(reason)}。`,
              cause: '该建筑的运行条件没有满足，需要检查入口、库存、岗位或服务范围。',
              action: '点选建筑查看入口、库存与岗位。',
              recommendation: {
                label: '打开道路图层',
                tool: 'inspect' as const,
                overlayMode: 'roads' as const,
              },
              score: 60 + count,
            }
    bottlenecks.push({
      id: `reason-${reason}`,
      severity: severityFromScore(entry.score),
      target: target ? { kind: 'building', buildingId: target.id } : undefined,
      ...entry,
    })
  }

  const households = Object.values(snapshot.households)
  if (households.length > 0) {
    const needAverages = (['food', 'goods', 'health', 'education', 'entertainment'] as const)
      .map((need) => ({
        need,
        value: households.reduce((sum, household) => sum + household.needs[need], 0) / households.length,
      }))
      .sort((a, b) => a.value - b.value)
    const lowestNeed = needAverages[0]
    if (lowestNeed && lowestNeed.value < 82) {
      const score = 82 - lowestNeed.value + 70
      bottlenecks.push({
        id: `need-${lowestNeed.need}`,
        title: `${needName(lowestNeed.need)}不足`,
        detail: `居民平均满足度 ${Math.round(lowestNeed.value)}%，满意度会被拖低。`,
        cause: lowestNeed.need === 'food' || lowestNeed.need === 'goods'
          ? '市场库存、家庭收入或货物流转不足，居民无法完成稳定消费。'
          : '服务建筑覆盖、服务库存或道路可达性不足，居民服务访问不稳定。',
        action: lowestNeed.need === 'food' || lowestNeed.need === 'goods'
          ? '优先补市场货源与运输。'
          : '优先补服务建筑与服务库存。',
        recommendation: lowestNeed.need === 'food' || lowestNeed.need === 'goods'
          ? {
              label: '打开物流图层',
              tool: 'inspect',
              overlayMode: 'logistics',
            }
          : {
              label: '打开服务图层',
              tool: 'inspect',
              overlayMode: 'service',
            },
        score,
        severity: severityFromScore(score),
        target: weakestHouseholdHome(snapshot),
      })
    }
  }

  const waitingOrders = Object.values(snapshot.logisticsOrders)
    .filter((order) => order.state === 'waiting' || order.state === 'assigned').length
  if (snapshot.metrics.logisticsEfficiency < 88 || waitingOrders >= 3) {
    const score = 88 - snapshot.metrics.logisticsEfficiency + waitingOrders * 2 + 62
    bottlenecks.push({
      id: 'logistics',
      title: '物流不畅',
      detail: `物流效率 ${Math.round(snapshot.metrics.logisticsEfficiency)}%，待处理订单 ${waitingOrders} 个。`,
      cause: '道路连通、仓储缓冲或承运路径不足，订单无法及时完成。',
      action: '补道路连通，避免产地和仓库距离过远。',
      recommendation: {
        label: '打开物流图层并铺路',
        tool: 'road',
        overlayMode: 'logistics',
      },
      score,
      severity: severityFromScore(score),
      target: logisticsBottleneckTarget(snapshot),
    })
  }

  return bottlenecks
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
}

function weakestHouseholdHome(snapshot: ReturnType<GameRuntime['getSnapshot']>): CityFocusTarget | undefined {
  const homeBuildingId = Object.values(snapshot.households)
    .filter((household) => snapshot.buildings[household.homeBuildingId])
    .sort((left, right) => left.satisfaction - right.satisfaction || left.id.localeCompare(right.id))[0]
    ?.homeBuildingId
  if (homeBuildingId) return { kind: 'building', buildingId: homeBuildingId }

  const home = Object.values(snapshot.buildings).find((building) => building.type === 'house')
  return home ? { kind: 'building', buildingId: home.id } : undefined
}

function logisticsBottleneckTarget(snapshot: ReturnType<GameRuntime['getSnapshot']>): CityFocusTarget | undefined {
  const waitingOrder = Object.values(snapshot.logisticsOrders)
    .filter((order) => order.state === 'waiting' || order.state === 'assigned')
    .sort((left, right) => right.priority - left.priority || left.id.localeCompare(right.id))[0]
  const buildingId = waitingOrder?.destinationBuildingId ?? waitingOrder?.sourceBuildingId
  if (buildingId && snapshot.buildings[buildingId]) return { kind: 'building', buildingId }

  const blocked = Object.values(snapshot.buildings).find((building) => building.status === 'blocked')
  if (blocked) return { kind: 'building', buildingId: blocked.id }

  const centralRoad = snapshot.cells.find((cell) => cell.road && cell.point.x === 13)
    ?? snapshot.cells.find((cell) => cell.road)
  return centralRoad ? { kind: 'point', point: centralRoad.point, label: '道路网络' } : undefined
}

function severityFromScore(score: number): BottleneckSeverity {
  if (score >= 88) return 'high'
  if (score >= 72) return 'medium'
  return 'low'
}

function resourceName(resource: string) {
  return ({
    food: '粮食',
    fish: '鱼获',
    wood: '木材',
    stone: '石料',
    clay: '黏土',
    brick: '砖',
    cloth: '布匹',
    salt: '盐',
    medicine: '药品',
  } as Record<string, string>)[resource] ?? resource
}

function needName(need: string) {
  return ({
    food: '饮食',
    goods: '日用品',
    health: '医疗',
    education: '教育',
    entertainment: '娱乐',
  } as Record<string, string>)[need] ?? need
}

function formatStageOverlayMetrics(
  mode: StageAdvisorOverlayMode,
  metrics: Readonly<Record<string, number>>,
): Array<{ label: string; value: number }> {
  if (mode === 'housing') {
    return [
      { label: '住宅', value: metrics.houses ?? 0 },
      { label: '空位', value: metrics.openHousing ?? 0 },
    ]
  }
  if (mode === 'service') {
    return [
      { label: '服务点', value: metrics.servicePoints ?? 0 },
      { label: '缺口住宅', value: metrics.serviceGaps ?? 0 },
    ]
  }
  if (mode === 'logistics') {
    return [
      { label: '未完成', value: metrics.activeOrders ?? 0 },
      { label: '热点', value: metrics.hotspots ?? 0 },
    ]
  }
  if (mode === 'activity') {
    return [
      { label: '道压', value: metrics.roadPressure ?? metrics.activeAgents ?? 0 },
      { label: '货拥', value: metrics.cargoCongestion ?? metrics.cargoTrips ?? 0 },
      { label: '服务热', value: metrics.serviceHeat ?? metrics.serviceVisits ?? 0 },
    ]
  }
  return [
    { label: '道路点', value: metrics.roadCells ?? 0 },
    { label: '缺路', value: metrics.roadGaps ?? 0 },
  ]
}

function pickStageOverlayPoint(
  mode: StageAdvisorOverlayMode,
  label: string,
  overlay: Readonly<StageAdvisorOverlay>,
) {
  if (mode === 'housing') {
    return label === '空位'
      ? overlay.points.find((point) => point.kind === 'housing' && point.label.startsWith('空'))
      : overlay.points.find((point) => point.kind === 'housing')
  }
  if (mode === 'service') {
    return label === '缺口住宅'
      ? overlay.points.find((point) => point.label === '缺服务')
      : overlay.points.find((point) => point.kind === 'service')
  }
  if (mode === 'logistics') {
    return label === '热点'
      ? overlay.points.find((point) => point.label.startsWith('物流热点'))
      : overlay.points.find((point) => point.kind === 'logistics')
  }
  if (mode === 'activity') {
    if (label === '货拥') return overlay.points.find((point) => point.label.startsWith('货运热'))
    if (label === '服务热') return overlay.points.find((point) => point.label.startsWith('服务热'))
    if (label === '道压') return overlay.points.find((point) => (
      point.label.startsWith('道压')
      || point.label.startsWith('货路')
      || point.label.startsWith('服路')
      || point.label.startsWith('通路')
    ))
    return overlay.points.find((point) => point.kind === 'activity')
  }
  return label === '缺路'
    ? overlay.points.find((point) => point.label.startsWith('缺路'))
    : overlay.points.find((point) => point.kind === 'road')
}

function averageNeeds(snapshot: ReturnType<GameRuntime['getSnapshot']>) {
  const households = Object.values(snapshot.households)
  if (households.length === 0) return 100
  const total = households.reduce((sum, household) => {
    const needs = Object.values(household.needs)
    return sum + needs.reduce((inner, value) => inner + value, 0) / needs.length
  }, 0)
  return total / households.length
}
