import { Application, Graphics } from 'pixi.js'
import { useEffect, useRef, useState } from 'react'
import {
  DynamicScene,
  createDefaultBuildingArtworkProvider,
  createDefaultPrefabRegistry,
  createSpritesheetBuildingAnimationProvider,
  gridToScreen,
  loadBuildingAnimationAtlases,
  loadDefaultBuildingArtworkProvider,
  loadDefaultBuildingArtworkAtlasProvider,
  parseRenderDiagnostics,
  screenToGrid,
} from '../rendering'
import type {
  BuildingAnimationAtlasManifest,
  BuildingAnimationDriverOptions,
  RenderDiagnosticsConfig,
  SceneSyncPerformanceProfile,
  SceneTickerPerformanceProfile,
} from '../rendering'
import { roadVisualStyle } from '../rendering/roads'
import type { CameraState, GridPoint, SimulationSnapshot } from '../simulation/contracts'
import { CameraController, DragController, PlacementController, deriveRuntimePlacementPreview, runtimePlacementValidator } from '../ui'
import type { BuildingPlacementPreview, BuildTool, GameRuntime } from '../integration/GameRuntime'
import type { StageAdvisorOverlay } from '../integration/stageAdvisor'
import { resolvePrefabAssetIdForBuildingType } from '../rendering/prefab'

type CameraFocusTarget =
  | { kind: 'building'; buildingId: string }
  | { kind: 'point'; point: GridPoint }

export interface CameraFocusRequest {
  id: number
  target: CameraFocusTarget
  smooth?: boolean
  zoom?: number
}

type RoadStrokeMode = 'build-road' | 'build-bridge' | 'remove'

interface SimulationCanvasProps {
  runtime: GameRuntime
  snapshot: SimulationSnapshot
  tool: BuildTool
  cameraFocusRequest?: CameraFocusRequest | null
  stageAdvisorOverlay?: StageAdvisorOverlay | null
  buildingAnimationAtlasManifest?: BuildingAnimationAtlasManifest
  buildingAnimationOptions?: BuildingAnimationDriverOptions
  onToolChange(tool: BuildTool): void
  onToast(message: string): void
  onBuildingSelect(id: string | null): void
}

interface BrowserLoadPhaseProfile {
  startedAt: number
  appInitMs?: number
  animationAtlasMs?: number
  artworkProviderMs?: number
  sceneSetupMs?: number
  terrainMs?: number
  firstSyncMs?: number
  totalMs?: number
  configuration?: RenderDiagnosticsConfig
}

const WORLD_BOUNDS = { x: -1120, y: -180, width: 2400, height: 1440 }
const FOCUS_ZOOM = 1.05
const FOCUS_DURATION_MS = 420
const DROP_PICKUP_RADIUS = 1.35
const DROP_SWEEP_RADIUS = 1.1
const DROP_SWEEP_SAMPLE_STEP = 0.65

export function SimulationCanvas({
  runtime,
  snapshot,
  tool,
  cameraFocusRequest,
  stageAdvisorOverlay,
  buildingAnimationAtlasManifest,
  buildingAnimationOptions,
  onToolChange,
  onToast,
  onBuildingSelect,
}: SimulationCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<Application | null>(null)
  const sceneRef = useRef<DynamicScene | null>(null)
  const terrainRef = useRef<Graphics | null>(null)
  const snapshotRef = useRef(snapshot)
  const toolRef = useRef(tool)
  const [cameraView, setCameraView] = useState<Readonly<CameraState>>(() => ({
    x: 0,
    y: 520,
    zoom: 0.72,
    viewportWidth: 0,
    viewportHeight: 0,
    fullscreen: false,
  }))
  const [placementPreview, setPlacementPreview] = useState<BuildingPlacementPreview | null>(null)
  const placementControllerRef = useRef<PlacementController | null>(null)
  const scaleQaCamera = new URLSearchParams(window.location.search).get('debugScenario') === 'civilization-scale'
  const cameraRef = useRef(new CameraController({
    bounds: WORLD_BOUNDS,
    zoom: { min: 0.48, max: 1.65 },
    initial: scaleQaCamera
      ? { x: -1120, y: -180, zoom: 0.48 }
      : { x: 0, y: 520, zoom: 0.72 },
  }))
  const dragRef = useRef(new DragController(5))
  const sweepRef = useRef<{
    pointerId: number
    lastScreen: { x: number; y: number }
    lastGrid: GridPoint
  } | null>(null)
  const roadStrokeRef = useRef<{
    pointerId: number
    mode: RoadStrokeMode
    lastGrid: GridPoint
    lastMessage: string
  } | null>(null)
  const focusAnimationRef = useRef<number | null>(null)
  const sceneSyncDirtyRef = useRef(true)

  snapshotRef.current = snapshot
  toolRef.current = tool
  if (!placementControllerRef.current) {
    placementControllerRef.current = new PlacementController(runtimePlacementValidator(runtime))
  }

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    let disposed = false
    const app = new Application()
    let scene: DynamicScene | null = null
    let tickerProfiles: SceneTickerPerformanceProfile[] | undefined
    const artworkAbortController = new AbortController()
    const terrain = new Graphics()
    const renderConfig = parseRenderDiagnostics(window.location.search)
    const loadProfile: BrowserLoadPhaseProfile | undefined = renderConfig.enabled
      ? ((window as Window & { __littleEarLoadProfile?: BrowserLoadPhaseProfile }).__littleEarLoadProfile = {
          startedAt: performance.now(),
          configuration: renderConfig,
        })
      : undefined
    appRef.current = app
    terrainRef.current = terrain

    const initialise = async () => {
      const appInitStartedAt = performance.now()
      await app.init({
        resizeTo: host,
        antialias: renderConfig.antialias,
        autoDensity: true,
        resolution: renderConfig.resolutionOverride ?? Math.min(window.devicePixelRatio || 1, 2),
        backgroundColor: 0x74b8bc,
      })
      if (loadProfile) loadProfile.appInitMs = performance.now() - appInitStartedAt
      if (renderConfig.tickerMinFpsOverride !== undefined) {
        app.ticker.minFPS = renderConfig.tickerMinFpsOverride
      }
      if (renderConfig.tickerMaxFpsOverride !== undefined) {
        app.ticker.maxFPS = renderConfig.tickerMaxFpsOverride
      }
      if (disposed) {
        app.destroy(true)
        return
      }
      let buildingAnimationProvider
      if (renderConfig.authoredAnimation && buildingAnimationAtlasManifest?.length) {
        try {
          const animationStartedAt = performance.now()
          const sheets = await loadBuildingAnimationAtlases(buildingAnimationAtlasManifest)
          if (loadProfile) loadProfile.animationAtlasMs = performance.now() - animationStartedAt
          buildingAnimationProvider = createSpritesheetBuildingAnimationProvider(sheets)
        } catch (error) {
          console.warn('Building animation atlases could not be loaded; using procedural fallback.', error)
        }
      }
      if (disposed) {
        app.destroy(true)
        return
      }
      const artworkAssetIds = [...new Set(
        Object.values(snapshotRef.current.buildings)
          .map((building) => resolvePrefabAssetIdForBuildingType(building.type))
          .filter((assetId): assetId is string => Boolean(assetId)),
      )]
      let buildingArtworkProvider = undefined
      if (renderConfig.authoredArtwork) {
        try {
          const artworkStartedAt = performance.now()
          buildingArtworkProvider = await (renderConfig.buildingAtlas ? loadDefaultBuildingArtworkAtlasProvider : loadDefaultBuildingArtworkProvider)(artworkAssetIds, {
          signal: artworkAbortController.signal,
          timeoutMs: 15_000,
          maxTextures: 512,
          preloadLevels: [...new Set(Object.values(snapshotRef.current.buildings).map((building) => building.level))],
        })
          if (loadProfile) loadProfile.artworkProviderMs = performance.now() - artworkStartedAt
        } catch (error) {
          if (disposed) {
            app.destroy(true)
            return
          }
          console.warn('Building artwork preload failed; using procedural fallback.', error)
          buildingArtworkProvider = createDefaultBuildingArtworkProvider()
        }
      }
      if (disposed) {
        app.destroy(true)
        return
      }
      const sceneSetupStartedAt = performance.now()
      const renderProfileEnabled = renderConfig.enabled
      ;(window as Window & { __littleEarRenderConfiguration?: typeof renderConfig }).__littleEarRenderConfiguration = renderConfig
      const renderProfiles = renderProfileEnabled
        ? ((window as Window & { __littleEarRenderProfiles?: SceneSyncPerformanceProfile[] }).__littleEarRenderProfiles ??= [])
        : undefined
      tickerProfiles = renderProfileEnabled
        ? ((window as Window & { __littleEarTickerProfiles?: SceneTickerPerformanceProfile[] }).__littleEarTickerProfiles ??= [])
        : undefined
      if (renderProfileEnabled) {
        const rendererProfiles = ((window as Window & { __littleEarRendererProfiles?: number[] }).__littleEarRendererProfiles ??= [])
        const originalRender = app.renderer.render.bind(app.renderer)
        app.renderer.render = ((...args: Parameters<typeof app.renderer.render>) => {
          const startedAt = performance.now()
          try {
            return originalRender(...args)
          } finally {
            if (rendererProfiles.length < 120) rendererProfiles.push(performance.now() - startedAt)
          }
        }) as typeof app.renderer.render
      }
      scene = new DynamicScene(undefined, {
        prefabRegistry: createDefaultPrefabRegistry(),
        buildingArtworkProvider,
        buildingAnimationProvider,
        buildingAnimationOptions: renderConfig.authoredAnimation ? buildingAnimationOptions : undefined,
        staticBuildingCache: renderConfig.staticBuildingCache,
        buildingLod: renderConfig.buildingLod,
        onSyncProfile: renderProfiles
          ? (profile) => {
              if (renderProfiles.length < 120) renderProfiles.push(profile)
            }
          : undefined,
      })
      sceneRef.current = scene
      host.appendChild(app.canvas)
      if (renderConfig.terrain) scene.layers.terrain.addChild(terrain)
      app.stage.addChild(scene.root)
      cameraRef.current.setViewport({ width: host.clientWidth, height: host.clientHeight })
      setCameraView({ ...cameraRef.current.getState() })
      if (loadProfile) loadProfile.sceneSetupMs = performance.now() - sceneSetupStartedAt
      if (renderConfig.terrain) {
        const terrainStartedAt = performance.now()
        drawTerrain(terrain, snapshotRef.current)
        if (loadProfile) loadProfile.terrainMs = performance.now() - terrainStartedAt
      }
      const firstSyncStartedAt = performance.now()
      syncScene()
      if (loadProfile) {
        loadProfile.firstSyncMs = performance.now() - firstSyncStartedAt
        loadProfile.totalMs = performance.now() - loadProfile.startedAt
      }
      app.ticker.add(syncScene)
    }

    const syncScene = () => {
      if (!app.ticker || !scene) return
      const callbackStartedAt = performance.now()
      const cameraStartedAt = callbackStartedAt
      const camera = cameraRef.current.getState()
      const cameraMs = performance.now() - cameraStartedAt
      let sceneSyncMs = 0
      const sceneSyncSkipped = !sceneSyncDirtyRef.current
      if (!sceneSyncSkipped) {
        scene.root.position.set(camera.viewportWidth / 2, camera.viewportHeight / 2)
        const sceneStartedAt = performance.now()
        scene.sync(snapshotRef.current, camera, app.ticker.deltaMS / 200)
        sceneSyncMs = performance.now() - sceneStartedAt
        sceneSyncDirtyRef.current = false
      }
      if (tickerProfiles && tickerProfiles.length < 120) {
        tickerProfiles.push({
          callbackMs: performance.now() - callbackStartedAt,
          cameraMs,
          sceneSyncMs,
          sceneSyncSkipped,
          tickerDeltaMs: app.ticker.deltaMS,
          tickerElapsedMs: app.ticker.elapsedMS,
          tickerMinFps: app.ticker.minFPS,
          tickerMaxFps: app.ticker.maxFPS,
        })
      }
    }

    void initialise()
    const unsubscribe = cameraRef.current.subscribe(() => {
      sceneSyncDirtyRef.current = true
      syncScene()
      setCameraView({ ...cameraRef.current.getState() })
    })
    const resize = new ResizeObserver(() => {
      cameraRef.current.setViewport({ width: host.clientWidth, height: host.clientHeight })
    })
    resize.observe(host)

    return () => {
      disposed = true
      artworkAbortController.abort()
      unsubscribe()
      resize.disconnect()
      if (appRef.current === app) appRef.current = null
      if (sceneRef.current === scene) sceneRef.current = null
      cancelFocusAnimation(focusAnimationRef)
      app.ticker.remove(syncScene)
      scene?.destroy()
      app.destroy(true)
    }
  }, [buildingAnimationAtlasManifest])

  useEffect(() => {
    const terrain = terrainRef.current
    if (terrain && parseRenderDiagnostics(window.location.search).terrain) drawTerrain(terrain, snapshot)
    sceneSyncDirtyRef.current = true
  }, [snapshot.cells])

  useEffect(() => {
    const unsubscribe = runtime.subscribe(() => {
      snapshotRef.current = runtime.getSnapshot()
      sceneSyncDirtyRef.current = true
    })
    return () => {
      unsubscribe()
    }
  }, [runtime])

  useEffect(() => {
    if (!cameraFocusRequest) return
    const focusPoint = resolveFocusPoint(cameraFocusRequest.target, snapshotRef.current)
    if (!focusPoint) return
    moveCameraToFocus(
      cameraRef.current,
      focusAnimationRef,
      focusPoint,
      cameraFocusRequest.zoom ?? FOCUS_ZOOM,
      cameraFocusRequest.smooth ?? true,
    )
  }, [cameraFocusRequest])

  useEffect(() => {
    if (tool.kind !== 'building') {
      placementControllerRef.current?.dispatch({ type: 'cancel' })
      setPlacementPreview(null)
      return
    }
    const state = placementControllerRef.current?.getState()
    if (
      state?.status !== 'placing'
      || state.buildingType !== tool.type
      || state.rotation !== tool.rotation
    ) {
      placementControllerRef.current?.dispatch({
        type: 'select',
        buildingType: tool.type,
        rotation: tool.rotation,
      })
    }
    syncPlacementPreview()
  }, [runtime, tool])

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'r') return
      const current = toolRef.current
      if (current.kind !== 'building') return
      const nextState = placementControllerRef.current?.dispatch({ type: 'rotate' })
      const next = nextState?.status === 'placing' ? nextState.rotation : current.rotation
      const rotated: BuildTool = { ...current, rotation: next }
      toolRef.current = rotated
      onToolChange(rotated)
      syncPlacementPreview()
      onToast(`建筑已旋转至 ${next}°（本次放置生效）`)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onToast, onToolChange])

  const localPoint = (event: React.PointerEvent) => {
    const rect = event.currentTarget.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  const gridPoint = (screen: { x: number; y: number }): GridPoint => {
    const grid = rawGridPoint(screen)
    return { x: Math.round(grid.x), y: Math.round(grid.y) }
  }

  const rawGridPoint = (screen: { x: number; y: number }): GridPoint => {
    const camera = cameraRef.current.getState()
    const world = {
      x: camera.x + (screen.x - camera.viewportWidth / 2) / camera.zoom,
      y: camera.y + (screen.y - camera.viewportHeight / 2) / camera.zoom,
    }
    return screenToGrid(world)
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button === 2) return
    cancelFocusAnimation(focusAnimationRef)
    const point = localPoint(event)
    const grid = rawGridPoint(point)
    updatePlacementPreview(grid)
    if (toolRef.current.kind === 'road' || toolRef.current.kind === 'bridge' || toolRef.current.kind === 'demolish-road') {
      const anchor = { x: Math.round(grid.x), y: Math.round(grid.y) }
      const mode = toolRef.current.kind === 'road'
        ? 'build-road'
        : toolRef.current.kind === 'bridge'
          ? 'build-bridge'
          : 'remove'
      const result = roadStrokeAction(runtime, mode, [anchor])
      roadStrokeRef.current = {
        pointerId: event.pointerId,
        mode,
        lastGrid: anchor,
        lastMessage: result.message,
      }
      event.currentTarget.setPointerCapture(event.pointerId)
      if (!result.ok) onToast(result.message)
      return
    }
    if (hasNearbyDrop(snapshotRef.current, grid, DROP_PICKUP_RADIUS)) {
      sweepRef.current = {
        pointerId: event.pointerId,
        lastScreen: point,
        lastGrid: grid,
      }
      event.currentTarget.setPointerCapture(event.pointerId)
      collectDropAt(grid, DROP_PICKUP_RADIUS)
      return
    }
    dragRef.current.start(event.pointerId, point)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const point = localPoint(event)
    updatePlacementPreview(rawGridPoint(point))
    const roadStroke = roadStrokeRef.current
    if (roadStroke?.pointerId === event.pointerId) {
      const grid = gridPoint(point)
      const segment = gridLine(roadStroke.lastGrid, grid)
      if (segment.length > 1) {
        const result = roadStrokeAction(runtime, roadStroke.mode, segment)
        roadStrokeRef.current = {
          pointerId: event.pointerId,
          mode: roadStroke.mode,
          lastGrid: grid,
          lastMessage: result.message,
        }
      }
      return
    }
    const sweep = sweepRef.current
    if (sweep?.pointerId === event.pointerId) {
      const grid = rawGridPoint(point)
      collectDropsAlongPath(sweep.lastGrid, grid)
      sweepRef.current = {
        pointerId: event.pointerId,
        lastScreen: point,
        lastGrid: grid,
      }
      return
    }

    const update = dragRef.current.move(event.pointerId, point)
    if (update?.state.dragging) cameraRef.current.panByScreenDelta(update.delta)
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const roadStroke = roadStrokeRef.current
    if (roadStroke?.pointerId === event.pointerId) {
      const point = gridPoint(localPoint(event))
      const segment = gridLine(roadStroke.lastGrid, point)
      const result = segment.length > 1
        ? roadStrokeAction(runtime, roadStroke.mode, segment)
        : null
      roadStrokeRef.current = null
      onToast(result?.message ?? roadStroke.lastMessage)
      return
    }

    const sweep = sweepRef.current
    if (sweep?.pointerId === event.pointerId) {
      const point = localPoint(event)
      collectDropsAlongPath(sweep.lastGrid, rawGridPoint(point))
      sweepRef.current = null
      return
    }

    const ended = dragRef.current.end(event.pointerId)
    if (!ended || ended.dragging || !ended.last) return
    const point = gridPoint(ended.last)
    const collected = runtime.collectNearest(point, DROP_PICKUP_RADIUS)
    if (collected.ok) {
      onToast(collected.message)
      return
    }
    const currentTool = toolRef.current
    if (currentTool.kind === 'road') {
      const result = runtime.placeRoad(point)
      onToast(result.message)
    } else if (currentTool.kind === 'bridge') {
      const result = runtime.placeBridgePath([point])
      onToast(result.message)
    } else if (currentTool.kind === 'demolish-road') {
      const result = runtime.removeRoadPath([point])
      onToast(result.message)
    } else if (currentTool.kind === 'building') {
      const controller = placementControllerRef.current
      controller?.dispatch({ type: 'move', anchor: point })
      const confirmed = controller?.dispatch({ type: 'confirm' })
      if (confirmed?.status !== 'confirmed') {
        const preview = deriveRuntimePlacementPreview(controller?.getState() ?? { status: 'idle' }, runtime)
        onToast(preview?.reason ?? '当前位置不可营造')
        syncPlacementPreview()
        return
      }
      const result = runtime.placeBuilding(confirmed.buildingType, confirmed.anchor, confirmed.rotation)
      onToast(result.message)
      if (result.buildingId) onBuildingSelect(result.buildingId)
      controller?.dispatch({ type: 'resume' })
      syncPlacementPreview()
    } else {
      onBuildingSelect(runtime.buildingAt(point) ?? null)
    }
  }

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault()
    cancelFocusAnimation(focusAnimationRef)
    const rect = event.currentTarget.getBoundingClientRect()
    cameraRef.current.zoomBy(
      { x: event.clientX - rect.left, y: event.clientY - rect.top },
      Math.exp(-event.deltaY * 0.0012),
    )
  }

  const updatePlacementPreview = (rawPoint: GridPoint) => {
    const currentTool = toolRef.current
    if (currentTool.kind !== 'building') {
      if (placementPreview) setPlacementPreview(null)
      return
    }
    const anchor = { x: Math.round(rawPoint.x), y: Math.round(rawPoint.y) }
    const controller = placementControllerRef.current
    if (!controller) return
    const state = controller.dispatch({ type: 'move', anchor })
    const preview = deriveRuntimePlacementPreview(state, runtime)
    if (!preview) {
      setPlacementPreview(null)
      return
    }
    setPlacementPreview((previous) => (
      previous
      && previous.type === preview.type
      && previous.rotation === preview.rotation
      && previous.origin.x === preview.origin.x
      && previous.origin.y === preview.origin.y
      && previous.valid === preview.valid
      && previous.reason === preview.reason
        ? previous
        : preview
    ))
  }

  const syncPlacementPreview = () => {
    const controller = placementControllerRef.current
    const preview = controller ? deriveRuntimePlacementPreview(controller.getState(), runtime) : null
    setPlacementPreview(preview)
  }

  return (
    <div
      ref={hostRef}
      className="simulation-canvas"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        sweepRef.current = null
        roadStrokeRef.current = null
        dragRef.current.cancel()
      }}
      onWheel={handleWheel}
      onContextMenu={(event) => {
        event.preventDefault()
        const inspect: BuildTool = { kind: 'inspect' }
        placementControllerRef.current?.dispatch({ type: 'cancel' })
        setPlacementPreview(null)
        toolRef.current = inspect
        onToolChange(inspect)
        onToast('已退出当前营造操作')
      }}
    >
      <div className="drop-affordance-layer" aria-hidden="true">
        {snapshot.worldDrops.map((drop) => {
          const position = dropToViewport(drop.position, cameraView)
          return (
            <span
              key={drop.id}
              className="drop-affordance"
              style={{
                '--drop-x': `${position.x}px`,
                '--drop-y': `${position.y}px`,
              } as React.CSSProperties}
            >
              <i>{drop.amount}</i>
            </span>
          )
        })}
      </div>
      {placementPreview && (
        <div className="placement-preview-layer" aria-hidden="true">
          <div className={`placement-preview-summary ${placementPreview.valid ? 'valid' : 'invalid'}`}>
            <strong>{placementPreview.valid ? '可营造' : '不可营造'}</strong>
            <span>{placementPreview.valid ? '点击确认，R 旋转，右键取消' : placementPreview.reason}</span>
          </div>
          {placementPreview.cells.map((cell, index) => {
            const position = pointToViewport(cell.position, cameraView)
            return (
              <span
                key={`${placementPreview.type}-${placementPreview.rotation}-${placementPreview.origin.x}-${placementPreview.origin.y}-${index}`}
                className={`stage-overlay-cell stage-overlay-cell--placement stage-overlay-cell--${cell.status} placement-preview-cell ${placementPreview.valid ? 'valid' : 'invalid'}`}
                style={{
                  '--stage-cell-x': `${position.x}px`,
                  '--stage-cell-y': `${position.y}px`,
                } as React.CSSProperties}
                title={cell.label}
              >
                <i>{cell.label}</i>
              </span>
            )
          })}
        </div>
      )}
      {stageAdvisorOverlay && (
        <div className="stage-overlay-layer" aria-hidden="true">
          {stageAdvisorOverlay.summary && (
            <div className="stage-overlay-summary">
              <strong>{stageAdvisorOverlay.label}</strong>
              {stageAdvisorOverlay.summary.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          )}
          {stageAdvisorOverlay.areas?.map((area, index) => {
            const center = pointToViewport(area.center, cameraView)
            const width = area.radius * 64 * cameraView.zoom
            const height = area.radius * 32 * cameraView.zoom
            return (
              <span
                key={`${stageAdvisorOverlay.id}-area-${index}`}
                className={`stage-overlay-area stage-overlay-area--${area.kind}`}
                style={{
                  '--stage-area-x': `${center.x}px`,
                  '--stage-area-y': `${center.y}px`,
                  '--stage-area-width': `${width}px`,
                  '--stage-area-height': `${height}px`,
                } as React.CSSProperties}
              >
                <i>{area.label}</i>
              </span>
            )
          })}
          {stageAdvisorOverlay.paths?.map((path, index) => {
            const from = pointToViewport(path.from, cameraView)
            const to = pointToViewport(path.to, cameraView)
            const dx = to.x - from.x
            const dy = to.y - from.y
            const length = Math.hypot(dx, dy)
            const angle = Math.atan2(dy, dx)
            return (
              <span
                key={`${stageAdvisorOverlay.id}-path-${index}`}
                className={`stage-overlay-path stage-overlay-path--${path.kind}`}
                style={{
                  '--stage-path-x': `${from.x}px`,
                  '--stage-path-y': `${from.y}px`,
                  '--stage-path-width': `${length}px`,
                  '--stage-path-angle': `${angle}rad`,
                } as React.CSSProperties}
              >
                <i>{path.label}</i>
              </span>
            )
          })}
          {stageAdvisorOverlay.cells?.map((cell, index) => {
            const position = pointToViewport(cell.position, cameraView)
            return (
              <span
                key={`${stageAdvisorOverlay.id}-cell-${index}`}
                className={`stage-overlay-cell stage-overlay-cell--${cell.kind} stage-overlay-cell--${cell.status}`}
                style={{
                  '--stage-cell-x': `${position.x}px`,
                  '--stage-cell-y': `${position.y}px`,
                } as React.CSSProperties}
                title={cell.label}
              >
                <i>{cell.label}</i>
              </span>
            )
          })}
          {stageAdvisorOverlay.points.map((point, index) => {
            const position = pointToViewport(point.position, cameraView)
            return (
              <span
                key={`${stageAdvisorOverlay.id}-${index}`}
                className={`stage-overlay-marker stage-overlay-marker--${point.kind}`}
                style={{
                  '--stage-x': `${position.x}px`,
                  '--stage-y': `${position.y}px`,
                } as React.CSSProperties}
              >
                <i>{point.label}</i>
              </span>
            )
          })}
          {stageAdvisorOverlay.badges?.map((badge, index) => {
            const position = pointToViewport(badge.position, cameraView)
            return (
              <span
                key={`${stageAdvisorOverlay.id}-badge-${index}`}
                className={`stage-overlay-badge stage-overlay-badge--${badge.kind ?? 'bottleneck'}`}
                style={{
                  '--stage-badge-x': `${position.x}px`,
                  '--stage-badge-y': `${position.y + 18}px`,
                } as React.CSSProperties}
              >
                {badge.label}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )

  function collectDropAt(point: GridPoint, radius = DROP_SWEEP_RADIUS): boolean {
    const collected = runtime.collectNearest(point, radius)
    if (!collected.ok) return false
    onToast(collected.message)
    return true
  }

  function collectDropsAlongPath(from: GridPoint, to: GridPoint): void {
    const distance = Math.hypot(to.x - from.x, to.y - from.y)
    const steps = Math.max(1, Math.ceil(distance / DROP_SWEEP_SAMPLE_STEP))
    for (let index = 1; index <= steps; index += 1) {
      collectDropAt({
        x: lerp(from.x, to.x, index / steps),
        y: lerp(from.y, to.y, index / steps),
      })
    }
  }
}

function hasNearbyDrop(snapshot: Readonly<SimulationSnapshot>, point: GridPoint, radius: number): boolean {
  return snapshot.worldDrops.some((drop) => (
    Math.hypot(drop.position.x - point.x, drop.position.y - point.y) <= radius
  ))
}

function dropToViewport(point: GridPoint, camera: Readonly<CameraState>): { x: number; y: number } {
  return pointToViewport(point, camera)
}

function pointToViewport(point: GridPoint, camera: Readonly<CameraState>): { x: number; y: number } {
  const world = gridToScreen(point)
  return {
    x: camera.viewportWidth / 2 + (world.x - camera.x) * camera.zoom,
    y: camera.viewportHeight / 2 + (world.y - camera.y) * camera.zoom,
  }
}

function gridLine(from: GridPoint, to: GridPoint): GridPoint[] {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const steps = Math.max(Math.abs(dx), Math.abs(dy))
  if (steps === 0) return [{ ...from }]
  const points: GridPoint[] = []
  const seen = new Set<string>()
  for (let index = 0; index <= steps; index += 1) {
    const point = {
      x: Math.round(from.x + (dx * index) / steps),
      y: Math.round(from.y + (dy * index) / steps),
    }
    const key = `${point.x},${point.y}`
    if (seen.has(key)) continue
    seen.add(key)
    points.push(point)
  }
  return points
}

function drawTerrain(graphics: Graphics, snapshot: SimulationSnapshot) {
  graphics.clear()
  const sorted = [...snapshot.cells].sort((a, b) => a.point.x + a.point.y - b.point.x - b.point.y)
  for (const cell of sorted) {
    const screen = gridToScreen(cell.point, cell.elevation)
    const color = cell.terrain === 'water'
      ? 0x72b8bd
      : cell.terrain === 'shore'
        ? 0xd8c994
        : ((cell.point.x + cell.point.y) % 2 === 0 ? 0x9ebd78 : 0xa8c783)
    graphics
      .poly([
        screen.x, screen.y - 24,
        screen.x + 48, screen.y,
        screen.x, screen.y + 24,
        screen.x - 48, screen.y,
      ])
      .fill({ color })
    drawTerrainTexture(graphics, cell, screen)
    if (cell.road) {
      drawRoadTexture(graphics, cell.road, screen)
    }
  }
}

function drawTerrainTexture(
  graphics: Graphics,
  cell: SimulationSnapshot['cells'][number],
  screen: { x: number; y: number },
): void {
  if (cell.terrain === 'water') {
    const rippleOffset = (cell.point.x * 7 + cell.point.y * 5) % 13
    graphics
      .moveTo(screen.x - 24 + rippleOffset, screen.y - 5)
      .lineTo(screen.x - 8 + rippleOffset, screen.y - 9)
      .moveTo(screen.x + 4 - rippleOffset * 0.4, screen.y + 8)
      .lineTo(screen.x + 20 - rippleOffset * 0.4, screen.y + 4)
      .stroke({ color: 0xd8f0eb, alpha: 0.22, width: 1 })
    return
  }

  if (cell.terrain === 'shore') {
    graphics
      .moveTo(screen.x - 40, screen.y)
      .lineTo(screen.x, screen.y + 19)
      .lineTo(screen.x + 40, screen.y)
      .stroke({ color: 0xefe0aa, alpha: 0.46, width: 2 })
      .moveTo(screen.x - 24, screen.y - 7)
      .lineTo(screen.x + 20, screen.y + 6)
      .stroke({ color: 0x8fb7ad, alpha: 0.24, width: 1 })
    return
  }

  if ((cell.point.x + cell.point.y) % 5 === 0) {
    graphics
      .moveTo(screen.x - 26, screen.y - 5)
      .lineTo(screen.x + 6, screen.y + 11)
      .moveTo(screen.x - 6, screen.y - 13)
      .lineTo(screen.x + 28, screen.y + 4)
      .stroke({ color: 0x7f9b62, alpha: 0.22, width: 1 })
  }
}

function drawRoadTexture(
  graphics: Graphics,
  roadKind: NonNullable<SimulationSnapshot['cells'][number]['road']>,
  screen: { x: number; y: number },
): void {
  const roadStyle = roadVisualStyle(roadKind)
  graphics
    .poly([
      screen.x, screen.y - 13,
      screen.x + roadStyle.deckInset + 4, screen.y,
      screen.x, screen.y + 13,
      screen.x - roadStyle.deckInset - 4, screen.y,
    ])
    .fill({ color: roadStyle.shadow, alpha: 0.22 })
    .poly([
      screen.x, screen.y - 10,
      screen.x + roadStyle.deckInset, screen.y,
      screen.x, screen.y + 10,
      screen.x - roadStyle.deckInset, screen.y,
    ])
    .fill({ color: roadStyle.fill })
    .stroke({ color: roadStyle.stroke, width: roadStyle.strokeWidth, alpha: roadStyle.alpha })

  if (roadStyle.pattern === 'ruts') {
    graphics
      .moveTo(screen.x - roadStyle.deckInset * 0.56, screen.y - 1)
      .lineTo(screen.x + roadStyle.deckInset * 0.56, screen.y - 1)
      .moveTo(screen.x - roadStyle.deckInset * 0.42, screen.y + 4)
      .lineTo(screen.x + roadStyle.deckInset * 0.42, screen.y + 4)
      .stroke({ color: roadStyle.seam, alpha: 0.42, width: 1.4 })
    return
  }

  if (roadStyle.pattern === 'stone-slabs') {
    for (let index = -2; index <= 2; index += 1) {
      const x = screen.x + index * 8
      graphics
        .moveTo(x, screen.y - 7 + Math.abs(index))
        .lineTo(x + 5, screen.y)
        .lineTo(x, screen.y + 7 - Math.abs(index))
    }
    graphics.stroke({ color: roadStyle.seam, alpha: 0.42, width: 1 })
    return
  }

  for (let index = -2; index <= 2; index += 1) {
    const x = screen.x + index * 8
    graphics
      .moveTo(x, screen.y - 9)
      .lineTo(x + 4, screen.y + 9)
  }
  graphics.stroke({ color: roadStyle.seam, alpha: 0.46, width: 1.2 })
  if (roadStyle.pierColor) {
    graphics
      .circle(screen.x - 14, screen.y + 9, 3.4)
      .circle(screen.x + 14, screen.y - 9, 3.4)
      .fill({ color: roadStyle.pierColor, alpha: 0.82 })
  }
}

function resolveFocusPoint(
  target: CameraFocusTarget,
  snapshot: SimulationSnapshot,
): { x: number; y: number } | null {
  if (target.kind === 'point') return gridToScreen(target.point)

  const occupiedCells = snapshot.cells
    .filter((cell) => cell.buildingId === target.buildingId)
  if (occupiedCells.length > 0) {
    const center = occupiedCells.reduce(
      (sum, cell) => ({
        x: sum.x + cell.point.x,
        y: sum.y + cell.point.y,
        elevation: sum.elevation + cell.elevation,
      }),
      { x: 0, y: 0, elevation: 0 },
    )
    return gridToScreen(
      {
        x: center.x / occupiedCells.length,
        y: center.y / occupiedCells.length,
      },
      center.elevation / occupiedCells.length,
    )
  }

  const building = snapshot.buildings[target.buildingId]
  return building ? gridToScreen(building.entrance) : null
}

function roadStrokeAction(
  runtime: GameRuntime,
  mode: RoadStrokeMode,
  points: readonly GridPoint[],
) {
  if (mode === 'build-road') return runtime.placeRoadPath(points)
  if (mode === 'build-bridge') return runtime.placeBridgePath(points)
  return runtime.removeRoadPath(points)
}

function moveCameraToFocus(
  camera: CameraController,
  animationRef: React.MutableRefObject<number | null>,
  point: { x: number; y: number },
  zoom: number,
  smooth: boolean,
) {
  cancelFocusAnimation(animationRef)
  const from = camera.getState()
  if (!smooth || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    camera.focusOn(point, { zoom })
    return
  }

  let startedAt: number | null = null
  const step = (now: number) => {
    startedAt ??= now
    const progress = Math.min(1, (now - startedAt) / FOCUS_DURATION_MS)
    const eased = easeOutCubic(progress)
    camera.focusOn({
      x: lerp(from.x, point.x, eased),
      y: lerp(from.y, point.y, eased),
    }, {
      zoom: lerp(from.zoom, zoom, eased),
    })
    if (progress < 1) {
      animationRef.current = window.requestAnimationFrame(step)
    } else {
      animationRef.current = null
    }
  }
  animationRef.current = window.requestAnimationFrame(step)
}

function cancelFocusAnimation(animationRef: React.MutableRefObject<number | null>) {
  if (animationRef.current === null) return
  window.cancelAnimationFrame(animationRef.current)
  animationRef.current = null
}

function lerp(from: number, to: number, progress: number) {
  return from + (to - from) * progress
}

function easeOutCubic(progress: number) {
  return 1 - (1 - progress) ** 3
}
