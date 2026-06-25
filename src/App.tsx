import {
  BookOpen, Box, BrickWall, Building2, Cable, FastForward, Headphones, Heart,
  Leaf, Mail, Map, Mountain, Music2, Pause, Play, RotateCcw, Route, Sailboat,
  Shirt, Sparkles, TreePine, Users, X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { IslandCanvas } from './components/IslandCanvas'
import { MaterialRow } from './components/MaterialRow'
import {
  BUILDING_ASSET_PATHS, BUILD_SITES, BUILD_SITE_IDS, DISPLAY_SITE_POSITIONS,
  ISLANDS, ISLAND_SITE_IDS, LEVEL_BUILD_REQUIREMENT, MATERIAL_META,
} from './game/config'
import {
  addListeningMinutes, advanceSceneTime, buildSelectedSite, collectDrop,
  createInitialState, generateOfflineReturn, resolveAmbientEvent, selectBuildSite,
  spawnNaturalDrop,
} from './game/engine'
import { clearState, loadState, saveState } from './game/storage'
import type { AmbientEvent, BuildSiteId, IslandId, IslandState } from './game/types'
import './styles.css'

type Drawer = 'build' | 'warehouse' | 'album' | 'friends' | 'letters' | 'review' | 'route' | 'event' | null

function useIslandState() {
  const qaStage = Number(new URLSearchParams(window.location.search).get('qa-stage'))
  const qaBuild = new URLSearchParams(window.location.search).has('qa-build')
  const qaMode = Number.isInteger(qaStage) && qaStage >= 0 && qaStage <= 4
  const [state, setState] = useState<IslandState>(() => {
    const loaded = loadState(createInitialState())
    if (!qaMode) return loaded
    const level = qaStage * 2
    return {
      ...loaded,
      prosperity: qaStage === 4 ? 999 : Math.max(28, qaStage * 180),
      inventory: qaStage === 4
        ? { wood: 84300, stone: 62700, brick: 21800, rope: 985, cloth: 1268 }
        : loaded.inventory,
      buildSites: Object.fromEntries(
        Object.entries(loaded.buildSites).map(([id, site]) => [
          id,
          {
            ...site,
            level: qaBuild && id === loaded.selectedBuildSiteId ? 2 : level,
            buildProgress: qaBuild && id === loaded.selectedBuildSiteId ? 100 : 0,
            visualStage: qaBuild && id === loaded.selectedBuildSiteId ? 1 : qaStage,
            decorStage: qaBuild && id === loaded.selectedBuildSiteId ? 1 : qaStage,
          },
        ]),
      ) as IslandState['buildSites'],
      islands: Object.fromEntries(
        Object.entries(loaded.islands).map(([id, island]) => [id, {
          ...island,
          unlocked: qaStage === 4 || id === 'main',
          routeProgress: qaStage === 4 || id === 'main' ? 100 : island.routeProgress,
        }]),
      ) as IslandState['islands'],
    }
  })
  useEffect(() => {
    if (!qaMode) saveState(state)
  }, [qaMode, state])
  return [state, setState] as const
}

export default function App() {
  const [state, setState] = useIslandState()
  const [drawer, setDrawer] = useState<Drawer>(() => (
    new URLSearchParams(window.location.search).has('qa-build') ? 'build' : null
  ))
  const [playing, setPlaying] = useState(false)
  const [focus, setFocus] = useState<{ x: number; y: number; key: number }>()
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [selectedRoute, setSelectedRoute] = useState<IslandId>('windfield')
  const [viewIslandId, setViewIslandId] = useState<IslandId>(() => {
    const requested = new URLSearchParams(window.location.search).get('qa-island') as IslandId | null
    return requested && requested in ISLANDS
      ? requested
      : BUILD_SITES[state.selectedBuildSiteId].islandId
  })
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 2400)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (!playing) return
    let report = 0
    const timer = window.setInterval(() => {
      report += 1
      setState((current) => addListeningMinutes(current, 1, Math.random, `local-${Date.now()}-${report}`))
    }, 1500)
    return () => window.clearInterval(timer)
  }, [playing])

  useEffect(() => {
    const timer = window.setInterval(() => setState((current) => advanceSceneTime(current, .012)), 5000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setState((current) => current.worldDrops.length < 26
        ? spawnNaturalDrop(current, Math.random() > .5 ? 'weather' : 'tide')
        : current)
    }, 18000)
    return () => window.clearInterval(timer)
  }, [])

  const selected = state.buildSites[state.selectedBuildSiteId]
  const selectedDefinition = BUILD_SITES[state.selectedBuildSiteId]
  const selectedEvent = state.ambientEvents.find((event) => event.id === selectedEventId)
  const unlockedCount = Object.values(state.islands).filter((island) => island.unlocked).length
  const totalLevels = Object.values(state.buildSites).reduce((sum, site) => sum + site.level, 0)
  const townStage = townStageName(totalLevels)
  const unread = state.letters.filter((letter) => !letter.read).length
  const progressRequirement = LEVEL_BUILD_REQUIREMENT[Math.min(7, selected.level)]
  const nextRoute = (Object.keys(ISLANDS) as IslandId[])
    .find((id) => !state.islands[id].unlocked)

  const focusSite = (id: BuildSiteId) => {
    const definition = BUILD_SITES[id]
    if (!state.islands[definition.islandId].unlocked) {
      setSelectedRoute(definition.islandId)
      setDrawer('route')
      return
    }
    setState((current) => selectBuildSite(current, id))
    setViewIslandId(definition.islandId)
    const position = DISPLAY_SITE_POSITIONS[id]
    setFocus({ x: position.x, y: position.y, key: Date.now() })
    setDrawer('build')
  }

  const collect = (id: string) => {
    const drop = state.worldDrops.find((item) => item.id === id)
    setState((current) => collectDrop(current, id))
    if (drop) setToast(`${drop.amount > 1 ? `${drop.amount}份` : ''}材料已自动送往「${selectedDefinition.name}」`)
  }

  const build = () => {
    if (selected.buildProgress < 100) {
      setToast(`再拾取一些材料，营造进度还差 ${100 - selected.buildProgress}%`)
      return
    }
    setState((current) => buildSelectedSite(current))
    setToast(`${selectedDefinition.name}焕新完成，镇上又热闹了一点`)
  }

  const resolveEvent = (event: AmbientEvent, choice: number) => {
    setState((current) => resolveAmbientEvent(current, event.id, choice))
    setSelectedEventId(null)
    setDrawer(null)
    setToast('这件小事被收进了小岛图鉴')
  }

  const simulateListening = (minutes: number) => {
    setState((current) => addListeningMinutes(current, minutes))
    setToast(`听歌 ${minutes} 分钟，新的材料已经落在地图上`)
  }

  const reset = () => {
    clearState()
    setState(createInitialState())
    setDrawer('build')
    setToast('已回到小耳镇初见时')
  }

  return (
    <main className={`game-shell period-${state.sceneTime.period}`}>
      <section className="portrait-gate">
        <RotateCcw size={34} />
        <h1>请横屏回到小耳岛</h1>
        <p>群岛地图只提供横屏体验。</p>
      </section>

      <IslandCanvas
        buildSites={state.buildSites}
        islands={state.islands}
        worldDrops={state.worldDrops}
        ambientEvents={state.ambientEvents}
        selectedBuildSiteId={state.selectedBuildSiteId}
        prosperity={state.prosperity}
        sceneTime={state.sceneTime}
        viewIslandId={viewIslandId}
        focus={focus}
        onBuildSiteSelect={focusSite}
        onDropCollect={collect}
        onEventSelect={(id) => {
          setSelectedEventId(id)
          setDrawer('event')
        }}
        onLockedIslandSelect={(id) => {
          setSelectedRoute(id)
          setDrawer('route')
        }}
      />
      <div className="time-wash" />

      <header className="island-seal">
        <span className="seal-mark"><Leaf /></span>
        <div>
          <h1>{viewIslandId === 'main' ? '小耳岛' : ISLANDS[viewIslandId].name}</h1>
          <p>{viewIslandId === 'main' ? townStage : ISLANDS[viewIslandId].subtitle} · 繁荣 {state.prosperity}</p>
        </div>
        <button onClick={() => {
          setFocus({ x: 3072, y: 1728, key: Date.now() })
        }}><Map size={17} />{unlockedCount}/4</button>
      </header>

      <section className="resource-ribbon" aria-label="小岛资源">
        {(Object.keys(state.inventory) as Array<keyof typeof state.inventory>).map((kind) => (
          <div key={kind}>
            <i style={{ background: MATERIAL_META[kind].css }}>{resourceIcon(kind)}</i>
            <span>{formatResource(state.inventory[kind])}</span>
          </div>
        ))}
        <div className="resource-prosperity"><Sparkles /><span>{state.prosperity}</span></div>
      </section>

      {nextRoute && (
        <button className="route-tease" onClick={() => {
          setSelectedRoute(nextRoute)
          setDrawer('route')
        }}>
          <Sailboat size={19} />
          <span><b>{ISLANDS[nextRoute].name}</b><small>{state.prosperity}/{ISLANDS[nextRoute].unlockProsperity} 繁荣</small></span>
        </button>
      )}

      <section className="music-strip">
        <button className={`record ${playing ? 'spinning' : ''}`} onClick={() => setPlaying(!playing)}>
          {playing ? <Pause size={15} /> : <Play size={15} />}
        </button>
        <div className="music-copy">
          <strong>{playing ? '听歌中，新材料正在出现' : '播放喜欢的歌，小镇会慢慢积攒材料'}</strong>
          <span>累计 {state.listeningMinutes} 分钟 · 距下一份材料 {4 - state.listeningRemainder || 4} 分钟</span>
        </div>
        <div className="drop-count"><Sparkles size={16} /><b>{state.worldDrops.length}</b><span>地图材料</span></div>
      </section>

      <nav className="bottom-dock">
        <DockButton active={drawer === 'build'} icon={<Building2 />} label="营造" onClick={() => setDrawer('build')} />
        <DockButton active={drawer === 'warehouse'} icon={<Box />} label="仓库" onClick={() => setDrawer('warehouse')} />
        <DockButton active={drawer === 'album'} icon={<BookOpen />} label="图鉴" onClick={() => setDrawer('album')} />
        <DockButton active={drawer === 'friends'} icon={<Users />} label="好友" onClick={() => setDrawer('friends')} />
        <DockButton active={drawer === 'letters'} icon={<Mail />} label="来信" badge={unread} onClick={() => {
          setState({ ...state, letters: state.letters.map((letter) => ({ ...letter, read: true })) })
          setDrawer('letters')
        }} />
      </nav>

      <button className="review-button" onClick={() => setDrawer('review')} aria-label="打开评审工具"><FastForward /></button>

      {drawer === 'build' && (
        <BuildHud
          selected={selected}
          selectedDefinition={selectedDefinition}
          progressRequirement={progressRequirement}
          onBuild={build}
          onClose={() => setDrawer(null)}
        />
      )}

      {drawer && drawer !== 'build' && (
        <aside className={`side-drawer ${drawer}`}>
          <button className="drawer-close" onClick={() => setDrawer(null)}><X /></button>
          {drawer === 'warehouse' && <WarehouseDrawer state={state} />}
          {drawer === 'album' && <AlbumDrawer state={state} onFocusSite={focusSite} />}
          {drawer === 'friends' && <FriendsDrawer onToast={setToast} />}
          {drawer === 'letters' && <LettersDrawer state={state} />}
          {drawer === 'event' && selectedEvent && <EventDrawer event={selectedEvent} onResolve={resolveEvent} />}
          {drawer === 'route' && <RouteDrawer state={state} islandId={selectedRoute} onFocus={(id) => {
            if (!state.islands[id].unlocked) return
            setViewIslandId(id)
            const firstSite = ISLAND_SITE_IDS[id][0]
            setState((current) => selectBuildSite(current, firstSite))
            setFocus({ x: 3072, y: 1728, key: Date.now() })
            setDrawer(null)
          }} />}
          {drawer === 'review' && (
            <ReviewDrawer
              onListen={simulateListening}
              onReturn={() => setState((current) => generateOfflineReturn(current, 1))}
              onNatural={() => setState((current) => spawnNaturalDrop(current, 'animal'))}
              onComplete={() => setState((current) => ({
                ...current,
                buildSites: {
                  ...current.buildSites,
                  [current.selectedBuildSiteId]: {
                    ...current.buildSites[current.selectedBuildSiteId],
                    buildProgress: 100,
                  },
                },
              }))}
              onMax={() => setState((current) => ({
                ...current,
                prosperity: current.prosperity + 220,
                buildSites: {
                  ...current.buildSites,
                  [current.selectedBuildSiteId]: {
                    ...current.buildSites[current.selectedBuildSiteId],
                    level: 8,
                    buildProgress: 0,
                    visualStage: 4,
                    decorStage: 4,
                  },
                },
              }))}
              onSetLevel={(level) => setState((current) => ({
                ...current,
                buildSites: {
                  ...current.buildSites,
                  [current.selectedBuildSiteId]: {
                    ...current.buildSites[current.selectedBuildSiteId],
                    level,
                    buildProgress: 0,
                    visualStage: level ? Math.ceil(level / 2) : 0,
                    decorStage: Math.floor(level / 2),
                  },
                },
              }))}
              onTownMax={() => setState((current) => ({
                ...current,
                prosperity: 999,
                buildSites: Object.fromEntries(
                  Object.entries(current.buildSites).map(([id, site]) => [id, {
                    ...site,
                    level: 8,
                    buildProgress: 0,
                    visualStage: 4,
                    decorStage: 4,
                  }]),
                ) as IslandState['buildSites'],
                islands: Object.fromEntries(
                  Object.entries(current.islands).map(([id, island]) => [id, {
                    ...island,
                    unlocked: true,
                    routeProgress: 100,
                  }]),
                ) as IslandState['islands'],
              }))}
              onSetTownStage={(stage) => setState((current) => ({
                ...current,
                prosperity: Math.max(current.prosperity, stage * 180),
                buildSites: Object.fromEntries(
                  Object.entries(current.buildSites).map(([id, site]) => [
                    id,
                    BUILD_SITES[id as BuildSiteId].islandId === 'main' ? {
                      ...site,
                      level: stage * 2,
                      buildProgress: 0,
                      visualStage: stage,
                      decorStage: stage,
                    } : site,
                  ]),
                ) as IslandState['buildSites'],
              }))}
              onReset={reset}
            />
          )}
        </aside>
      )}

      {toast && <div className="toast"><Sparkles />{toast}</div>}
    </main>
  )
}

function DockButton({
  icon, label, active, badge = 0, onClick,
}: { icon: React.ReactNode; label: string; active: boolean; badge?: number; onClick: () => void }) {
  return <button className={active ? 'active' : ''} onClick={onClick}>
    <span>{icon}{badge > 0 && <i>{badge}</i>}</span><b>{label}</b>
  </button>
}

function DrawerTitle({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return <div className="drawer-title"><span>{icon}</span><div><h2>{title}</h2><p>{subtitle}</p></div></div>
}

function BuildDrawer({
  state, selected, selectedDefinition, progressRequirement, onBuild, onFocusSite,
}: {
  state: IslandState
  selected: IslandState['buildSites'][BuildSiteId]
  selectedDefinition: typeof BUILD_SITES[BuildSiteId]
  progressRequirement: number
  onBuild: () => void
  onFocusSite: (id: BuildSiteId) => void
}) {
  const ready = selected.buildProgress >= 100
  return <>
    <DrawerTitle icon={<Building2 />} title={selectedDefinition.name} subtitle={selectedDefinition.subtitle} />
    <div className="building-preview">
      <span className={`preview-stage stage-${selected.visualStage}`}><Building2 /></span>
      <div><small>当前镇貌</small><strong>{selected.level === 0 ? '残垣待修' : `${selected.level}级 · ${levelTitle(selected.level)}`}</strong></div>
      <i>→</i>
      <div><small>下一阶段</small><strong>{selected.level >= 8 ? '繁华长久' : `${selected.level + 1}级 · ${levelTitle(selected.level + 1)}`}</strong></div>
    </div>
    <div className="build-progress">
      <div><span>自动配料进度</span><b>{selected.buildProgress}%</b></div>
      <div className="progress-track"><i style={{ width: `${selected.buildProgress}%` }} /></div>
      <p>拾取材料会优先投入这里。偏好 {selectedDefinition.preferred.map((kind) => kindLabel(kind)).join('、')}，其他材料也能使用。</p>
    </div>
    <button className={`build-button ${ready ? 'ready' : ''}`} onClick={onBuild} disabled={selected.level >= 8}>
      {selected.level >= 8 ? '这里已经很繁华了' : ready ? '一键营造' : `继续收集 · 约需 ${progressRequirement} 份`}
    </button>
    <div className="site-switcher">
      <h3>主镇营造点 <span>{ISLAND_SITE_IDS.main.filter((id) => state.buildSites[id].level > 0).length}/16 已焕新</span></h3>
      <div>{ISLAND_SITE_IDS.main.map((id) => (
        <button className={id === selected.id ? 'active' : ''} onClick={() => onFocusSite(id)} key={id}>
          <span>{state.buildSites[id].level || '修'}</span>{BUILD_SITES[id].name}
        </button>
      ))}</div>
    </div>
  </>
}

function BuildHud({
  selected, selectedDefinition, progressRequirement, onBuild, onClose,
}: {
  selected: IslandState['buildSites'][BuildSiteId]
  selectedDefinition: typeof BUILD_SITES[BuildSiteId]
  progressRequirement: number
  onBuild: () => void
  onClose: () => void
}) {
  const ready = selected.buildProgress >= 100
  const nextLevel = Math.min(8, selected.level + 1)
  return (
    <section className="build-hud" aria-label={`${selectedDefinition.name}营造面板`}>
      <button className="build-hud-close" onClick={onClose}><X /></button>
      <div className="build-hud-current">
        <img src={BUILDING_ASSET_PATHS[selected.id][selected.level]} alt="" />
        <div><small>优先营造</small><strong>{selectedDefinition.name}</strong><span>{selected.level}级 · {levelTitle(selected.level)}</span></div>
      </div>
      <div className="build-hud-preview">
        <small>升级预览</small>
        <div>
          <img src={BUILDING_ASSET_PATHS[selected.id][selected.level]} alt="" />
          <b>→</b>
          <img src={BUILDING_ASSET_PATHS[selected.id][nextLevel]} alt="" />
        </div>
      </div>
      <div className="build-hud-materials">
        <small>自动配料</small>
        <div className="build-hud-track"><i style={{ width: `${selected.buildProgress}%` }} /></div>
        <span>{selected.buildProgress}% · 偏好 {selectedDefinition.preferred.map(kindLabel).join('、')}</span>
      </div>
      <button className={`build-hud-action ${ready ? 'ready' : ''}`} onClick={onBuild} disabled={selected.level >= 8}>
        {selected.level >= 8 ? '已至最高级' : ready ? '立即营造' : `还需约 ${progressRequirement} 份材料`}
      </button>
    </section>
  )
}

function WarehouseDrawer({ state }: { state: IslandState }) {
  return <>
    <DrawerTitle icon={<Box />} title="小镇仓库" subtitle="未投入营造的材料会保存在这里" />
    <MaterialRow inventory={state.inventory} />
    <div className="warehouse-note">
      <Sparkles />
      <p><b>自动配料已开启</b><br />地图拾取物会直接送往优先营造点；目标完成或达到满级时，多余材料才会进入仓库。</p>
    </div>
    <div className="pending-card">
      <span>等待落地</span><strong>{state.pendingDrops.length}</strong>
      <p>地图最多保留 30 个节点。拾取后，排队材料会继续出现。</p>
    </div>
  </>
}

function AlbumDrawer({ state, onFocusSite }: { state: IslandState; onFocusSite: (id: BuildSiteId) => void }) {
  return <>
    <DrawerTitle icon={<BookOpen />} title="群岛图鉴" subtitle="小镇成长、相遇与风景都留在这里" />
    <div className="album-stats">
      <article><strong>{Object.values(state.buildSites).filter((site) => site.level > 0).length}</strong><span>焕新建筑</span></article>
      <article><strong>{state.discoveredViews.length}</strong><span>小岛故事</span></article>
      <article><strong>{state.discoveredSpecies.length}</strong><span>生态发现</span></article>
    </div>
    {(Object.keys(ISLANDS) as IslandId[]).map((islandId) => (
      <section className="album-island" key={islandId}>
        <h3>{ISLANDS[islandId].name}<span>{state.islands[islandId].unlocked ? '已通航' : '航线未开'}</span></h3>
        <div>{ISLAND_SITE_IDS[islandId].map((id) => (
          <button disabled={!state.islands[islandId].unlocked} onClick={() => onFocusSite(id)} key={id}>
            <i>{state.buildSites[id].level}/8</i><span>{BUILD_SITES[id].name}</span>
          </button>
        ))}</div>
      </section>
    ))}
  </>
}

function FriendsDrawer({ onToast }: { onToast: (value: string) => void }) {
  const friends = [['青禾', '茶园刚刚通航'], ['阿栗', '戏台亮起了暮灯'], ['南星', '渔港来了新船']]
  return <>
    <DrawerTitle icon={<Users />} title="好友来访" subtitle="没有排行，也不会偷取材料" />
    <div className="friend-list">{friends.map(([name, note], index) => (
      <article key={name}><span className={`avatar a${index}`}>{name[0]}</span><div><b>{name}的小岛</b><p>{note}</p></div>
        <button onClick={() => onToast(`拜访了${name}的小岛，留下一枚小红心`)}><Heart />拜访</button></article>
    ))}</div>
  </>
}

function LettersDrawer({ state }: { state: IslandState }) {
  return <>
    <DrawerTitle icon={<Mail />} title="小岛来信" subtitle="离开时，这里也会好好生活" />
    <div className="letter-list">{state.letters.map((letter) => (
      <article key={letter.id}><span>第 {letter.day} 天</span><h3>{letter.title}</h3><p>{letter.body}</p></article>
    ))}</div>
  </>
}

function EventDrawer({ event, onResolve }: { event: AmbientEvent; onResolve: (event: AmbientEvent, choice: number) => void }) {
  return <>
    <DrawerTitle icon={<Sparkles />} title="岛上小事" subtitle="没有期限，也不会影响建设" />
    <div className="event-scene"><span>{event.icon === 'cat' ? '猫' : event.icon === 'kite' ? '鸢' : '舟'}</span></div>
    <h3 className="event-title">{event.title}</h3>
    <p className="event-copy">{event.description}</p>
    <div className="event-choices">{event.choices.map((choice, index) => (
      <button onClick={() => onResolve(event, index)} key={choice}>{choice}</button>
    ))}</div>
    <small className="event-hint">可以直接关闭，之后它还会留在地图上。</small>
  </>
}

function RouteDrawer({ state, islandId, onFocus }: { state: IslandState; islandId: IslandId; onFocus: (id: IslandId) => void }) {
  const island = ISLANDS[islandId]
  const progress = state.islands[islandId]
  return <>
    <DrawerTitle icon={<Route />} title={island.name} subtitle={island.subtitle} />
    <div className={`route-illustration ${progress.unlocked ? 'open' : ''}`}><Sailboat /><span>{progress.unlocked ? '航线已开' : '海雾中的新岛'}</span></div>
    <div className="route-progress"><span>航线繁荣</span><b>{state.prosperity}/{island.unlockProsperity}</b>
      <div><i style={{ width: `${progress.routeProgress}%` }} /></div></div>
    <p className="route-copy">继续营造已开放的建筑，繁荣达到目标后航线会自然开放，不需要额外完成任务。</p>
    <button className="secondary-action" onClick={() => onFocus(islandId)}>把地图移到这里</button>
  </>
}

function ReviewDrawer({
  onListen, onReturn, onNatural, onComplete, onMax, onSetLevel, onTownMax, onSetTownStage, onReset,
}: {
  onListen: (minutes: number) => void
  onReturn: () => void
  onNatural: () => void
  onComplete: () => void
  onMax: () => void
  onSetLevel: (level: number) => void
  onTownMax: () => void
  onSetTownStage: (stage: number) => void
  onReset: () => void
}) {
  return <>
    <DrawerTitle icon={<FastForward />} title="原型评审工具" subtitle="快速验证完整成长路径" />
    <div className="review-grid">
      <button onClick={() => onListen(12)}><Headphones />听歌 12 分钟</button>
      <button onClick={onNatural}><Sparkles />生成自然材料</button>
      <button onClick={onComplete}><Building2 />填满当前进度</button>
      <button onClick={onMax}><Building2 />当前建筑升至8级</button>
      <button onClick={onTownMax}><Building2 />全镇繁华预览</button>
      <button onClick={onReturn}><Mail />模拟次日回岛</button>
      <button onClick={() => window.dispatchEvent(new Event('little-ear-capture'))}>
        <Map />生成验收快照
      </button>
      <button className="danger" onClick={onReset}><RotateCcw />重置原型</button>
    </div>
    <div className="level-preview">
      <span>查看当前建筑等级</span>
      <div>{Array.from({ length: 9 }, (_, level) => (
        <button key={level} onClick={() => onSetLevel(level)}>{level}</button>
      ))}</div>
    </div>
    <div className="level-preview">
      <span>查看整座主镇阶段</span>
      <div className="town-stage-buttons">{Array.from({ length: 5 }, (_, stage) => (
        <button key={stage} onClick={() => onSetTownStage(stage)}>{stage}</button>
      ))}</div>
    </div>
  </>
}

function townStageName(levels: number) {
  if (levels < 8) return '荒滩初醒'
  if (levels < 28) return '临水聚落'
  if (levels < 70) return '烟火村镇'
  if (levels < 140) return '江南水乡'
  return '繁华小镇'
}

function levelTitle(level: number) {
  return ['废墟', '清理地基', '初成院落', '修好主体', '街巷成形', '扩建经营', '灯火渐盛', '人来客往', '繁华长久'][level]
}

function kindLabel(kind: string) {
  return ({ wood: '木料', stone: '石料', brick: '砖瓦', rope: '绳索', cloth: '布匹' } as Record<string, string>)[kind]
}

function formatResource(value: number) {
  if (value >= 10000) return `${(value / 10000).toFixed(1)}万`
  return value.toLocaleString('zh-CN')
}

function resourceIcon(kind: keyof IslandState['inventory']) {
  return {
    wood: <TreePine />,
    stone: <Mountain />,
    brick: <BrickWall />,
    rope: <Cable />,
    cloth: <Shirt />,
  }[kind]
}
