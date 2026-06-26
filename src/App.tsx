import {
  Building2,
  Coins,
  Expand,
  FastForward,
  Hammer,
  House,
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
import {
  BUILDING_DEFINITIONS,
  BUILDING_MENU,
  GameRuntime,
  type BuildTool,
} from './integration/GameRuntime'
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
  const [fullscreen, setFullscreen] = useState(INITIAL_FULLSCREEN)
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null)
  const shellRef = useRef<HTMLElement>(null)
  const fullscreenRef = useRef<FullscreenController | null>(null)

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

  const selectedBuilding = selectedBuildingId
    ? snapshot.buildings[selectedBuildingId]
    : undefined
  const selectedDefinition = selectedBuilding
    ? BUILDING_DEFINITIONS[selectedBuilding.type]
    : undefined
  const rareTotal = Object.values(snapshot.rareRewards.inventory)
    .reduce((sum, value) => sum + (value ?? 0), 0)

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
        <Metric icon={<Coins />} label="财政" value={Math.round(snapshot.economy.treasury).toLocaleString()} />
        <Metric icon={<Route />} label="物流" value={`${Math.round(snapshot.metrics.logisticsEfficiency)}%`} />
        <Metric icon={<Music2 />} label="珍材" value={String(rareTotal)} accent />
      </section>

      <aside className="build-palette glass-panel">
        <div className="palette-title">
          <span><Building2 /> 城建</span>
          <small>点击地块放置</small>
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
        {BUILDING_MENU.map((item) => (
          <button
            key={item.type}
            className={tool.kind === 'building' && tool.type === item.type ? 'active' : ''}
            onClick={() => chooseTool({ kind: 'building', type: item.type, rotation: 0 })}
          >
            {item.icon === 'home' ? <House /> : item.icon === 'storage' ? <Warehouse /> : <Building2 />}
            <span>{item.shortName}</span>
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

      <section className="music-reward glass-panel">
        <div className="music-disc"><Music2 /></div>
        <div>
          <strong>听完喜欢的歌</strong>
          <span>仅奖励稀缺材料 · 五首保底</span>
        </div>
        <button onClick={simulateSong}>模拟听完</button>
      </section>

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
  if (reason.startsWith('missing-input:')) return `缺少${reason.slice(14)}`
  return reason
}

function rareName(resource: string) {
  return ({ jade: '玉石', silk: '云锦', porcelain: '名瓷', blueprint: '营造图' } as Record<string, string>)[resource] ?? resource
}
