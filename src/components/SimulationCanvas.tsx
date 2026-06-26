import { Application, Graphics } from 'pixi.js'
import { useEffect, useRef } from 'react'
import { DynamicScene, gridToScreen, screenToGrid } from '../rendering'
import type { GridPoint, SimulationSnapshot } from '../simulation/contracts'
import { CameraController, DragController } from '../ui'
import type { BuildTool, GameRuntime } from '../integration/GameRuntime'

interface SimulationCanvasProps {
  runtime: GameRuntime
  snapshot: SimulationSnapshot
  tool: BuildTool
  onToolChange(tool: BuildTool): void
  onToast(message: string): void
  onBuildingSelect(id: string | null): void
}

const WORLD_BOUNDS = { x: -1120, y: -180, width: 2400, height: 1440 }

export function SimulationCanvas({
  runtime,
  snapshot,
  tool,
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
  const cameraRef = useRef(new CameraController({
    bounds: WORLD_BOUNDS,
    zoom: { min: 0.48, max: 1.65 },
    initial: { x: 0, y: 520, zoom: 0.72 },
  }))
  const dragRef = useRef(new DragController(5))

  snapshotRef.current = snapshot
  toolRef.current = tool

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
    const unsubscribe = cameraRef.current.subscribe(syncScene)
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
    const handleKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'r') return
      const current = toolRef.current
      if (current.kind !== 'building') return
      const rotations = [0, 90, 180, 270] as const
      const next = rotations[(rotations.indexOf(current.rotation) + 1) % rotations.length]
      const rotated: BuildTool = { ...current, rotation: next }
      toolRef.current = rotated
      onToolChange(rotated)
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
    const camera = cameraRef.current.getState()
    const world = {
      x: camera.x + (screen.x - camera.viewportWidth / 2) / camera.zoom,
      y: camera.y + (screen.y - camera.viewportHeight / 2) / camera.zoom,
    }
    const grid = screenToGrid(world)
    return { x: Math.round(grid.x), y: Math.round(grid.y) }
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button === 2) return
    const point = localPoint(event)
    dragRef.current.start(event.pointerId, point)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const update = dragRef.current.move(event.pointerId, localPoint(event))
    if (update?.state.dragging) cameraRef.current.panByScreenDelta(update.delta)
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const ended = dragRef.current.end(event.pointerId)
    if (!ended || ended.dragging || !ended.last) return
    const point = gridPoint(ended.last)
    const collected = runtime.collectNearest(point)
    if (collected.ok) {
      onToast(collected.message)
      return
    }
    const currentTool = toolRef.current
    if (currentTool.kind === 'road') {
      const result = runtime.placeRoad(point)
      onToast(result.message)
    } else if (currentTool.kind === 'building') {
      const result = runtime.placeBuilding(currentTool.type, point, currentTool.rotation)
      onToast(result.message)
      if (result.buildingId) onBuildingSelect(result.buildingId)
    } else {
      onBuildingSelect(runtime.buildingAt(point) ?? null)
    }
  }

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault()
    const rect = event.currentTarget.getBoundingClientRect()
    cameraRef.current.zoomBy(
      { x: event.clientX - rect.left, y: event.clientY - rect.top },
      Math.exp(-event.deltaY * 0.0012),
    )
  }

  return (
    <div
      ref={hostRef}
      className="simulation-canvas"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => dragRef.current.cancel()}
      onWheel={handleWheel}
      onContextMenu={(event) => {
        event.preventDefault()
        const inspect: BuildTool = { kind: 'inspect' }
        toolRef.current = inspect
        onToolChange(inspect)
        onToast('已退出当前营造操作')
      }}
    />
  )
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
