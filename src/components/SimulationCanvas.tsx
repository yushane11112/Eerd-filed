import { Application, Graphics } from 'pixi.js'
import { useEffect, useRef, useState } from 'react'
import { DynamicScene, gridToScreen, screenToGrid } from '../rendering'
import type { CameraState, GridPoint, SimulationSnapshot } from '../simulation/contracts'
import { CameraController, DragController, PlacementController, deriveRuntimePlacementPreview, runtimePlacementValidator } from '../ui'
import type { BuildingPlacementPreview, BuildTool, GameRuntime } from '../integration/GameRuntime'
import type { StageAdvisorOverlay } from '../integration/stageAdvisor'

type CameraFocusTarget =
  | { kind: 'building'; buildingId: string }
  | { kind: 'point'; point: GridPoint }

export interface CameraFocusRequest {
  id: number
  target: CameraFocusTarget
  smooth?: boolean
  zoom?: number
}

interface SimulationCanvasProps {
  runtime: GameRuntime
  snapshot: SimulationSnapshot
  tool: BuildTool
  cameraFocusRequest?: CameraFocusRequest | null
  stageAdvisorOverlay?: StageAdvisorOverlay | null
  onToolChange(tool: BuildTool): void
  onToast(message: string): void
  onBuildingSelect(id: string | null): void
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
  const cameraRef = useRef(new CameraController({
    bounds: WORLD_BOUNDS,
    zoom: { min: 0.48, max: 1.65 },
    initial: { x: 0, y: 520, zoom: 0.72 },
  }))
  const dragRef = useRef(new DragController(5))
  const sweepRef = useRef<{
    pointerId: number
    lastScreen: { x: number; y: number }
    lastGrid: GridPoint
  } | null>(null)
  const focusAnimationRef = useRef<number | null>(null)

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
    const scene = new DynamicScene()
    const terrain = new Graphics()
    appRef.current = app
    sceneRef.current = scene
    terrainRef.current = terrain

    const initialise = async () => {
      await app.init({
        resizeTo: host,
        antialias: true,
        autoDensity: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        backgroundColor: 0x74b8bc,
      })
      if (disposed) {
        app.destroy(true)
        return
      }
      host.appendChild(app.canvas)
      scene.layers.terrain.addChild(terrain)
      app.stage.addChild(scene.root)
      cameraRef.current.setViewport({ width: host.clientWidth, height: host.clientHeight })
      setCameraView({ ...cameraRef.current.getState() })
      drawTerrain(terrain, snapshotRef.current)
      syncScene()
      app.ticker.add(syncScene)
    }

    const syncScene = () => {
      if (!app.ticker) return
      const camera = cameraRef.current.getState()
      scene.root.position.set(camera.viewportWidth / 2, camera.viewportHeight / 2)
      scene.sync(snapshotRef.current, camera, app.ticker.deltaMS / 200)
    }

    void initialise()
    const unsubscribe = cameraRef.current.subscribe(() => {
      syncScene()
      setCameraView({ ...cameraRef.current.getState() })
    })
    const resize = new ResizeObserver(() => {
      cameraRef.current.setViewport({ width: host.clientWidth, height: host.clientHeight })
    })
    resize.observe(host)

    return () => {
      disposed = true
      unsubscribe()
      resize.disconnect()
      if (appRef.current === app) appRef.current = null
      if (sceneRef.current === scene) sceneRef.current = null
      cancelFocusAnimation(focusAnimationRef)
      app.ticker.remove(syncScene)
      scene.destroy()
      app.destroy(true)
    }
  }, [])

  useEffect(() => {
    const terrain = terrainRef.current
    if (terrain) drawTerrain(terrain, snapshot)
  }, [snapshot.cells])

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
    if (cell.road) {
      graphics
        .poly([
          screen.x, screen.y - 10,
          screen.x + 22, screen.y,
          screen.x, screen.y + 10,
          screen.x - 22, screen.y,
        ])
        .fill({ color: cell.road === 'dirt' ? 0xb79262 : 0xbec2b5 })
        .stroke({ color: 0x887f70, width: 1, alpha: 0.7 })
    }
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
