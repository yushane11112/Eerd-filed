import {
  Application, Assets, Container, Graphics, Sprite, Text, TextStyle, Texture,
} from 'pixi.js'
import { useEffect, useRef } from 'react'
import {
  BUILD_SITES, BUILD_SITE_IDS, DISPLAY_SITE_POSITIONS, MATERIAL_META,
  TOWNSCAPE_ASSET_PATHS, WORLD, townscapeStageForIsland,
} from '../game/config'
import type {
  AmbientEvent, BuildSiteId, BuildSiteProgress, IslandId, SceneTime, WorldDrop,
} from '../game/types'

interface IslandCanvasProps {
  buildSites: Record<BuildSiteId, BuildSiteProgress>
  islands: Record<IslandId, { unlocked: boolean; routeProgress: number }>
  worldDrops: WorldDrop[]
  ambientEvents: AmbientEvent[]
  selectedBuildSiteId: BuildSiteId
  prosperity: number
  sceneTime: SceneTime
  viewIslandId: IslandId
  focus?: { x: number; y: number; key: number }
  onBuildSiteSelect: (id: BuildSiteId) => void
  onDropCollect: (id: string) => void
  onEventSelect: (id: string) => void
  onLockedIslandSelect: (id: IslandId) => void
}

export function IslandCanvas(props: IslandCanvasProps) {
  const staticQa = new URLSearchParams(window.location.search).has('qa-static')
  if (staticQa) {
    const stage = townscapeStageForIsland(props.buildSites, props.viewIslandId)
    const marker = DISPLAY_SITE_POSITIONS[props.selectedBuildSiteId]
    return (
      <div className="island-canvas qa-static-canvas" aria-label="小耳岛静态视觉验收画面">
        <img
          src={TOWNSCAPE_ASSET_PATHS[props.viewIslandId][stage]}
          alt={`${props.viewIslandId} 第${stage}阶段镇貌`}
        />
        {BUILD_SITES[props.selectedBuildSiteId].islandId === props.viewIslandId && (
          <span
            className="qa-static-marker"
            style={{
              left: `${marker.x / WORLD.width * 100}%`,
              top: `${marker.y / WORLD.height * 100}%`,
            }}
          />
        )}
      </div>
    )
  }

  const hostRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<Application | null>(null)
  const sceneRef = useRef<Container | null>(null)
  const townscapeLayerRef = useRef<Container | null>(null)
  const buildingLayerRef = useRef<Container | null>(null)
  const dropLayerRef = useRef<Container | null>(null)
  const eventLayerRef = useRef<Container | null>(null)
  const environmentLayerRef = useRef<Container | null>(null)
  const movementLayerRef = useRef<Container | null>(null)
  const buildingRefs = useRef<Partial<Record<BuildSiteId, Container>>>({})
  const callbacks = useRef(props)
  callbacks.current = props

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const app = new Application()
    let disposed = false
    let initialized = false
    let observer: ResizeObserver | undefined
    let removeWheel: (() => void) | undefined
    let removeCapture: (() => void) | undefined

    const setup = async () => {
      await app.init({
        resizeTo: host,
        antialias: true,
        autoDensity: true,
        resolution: Math.min(devicePixelRatio, 2),
        background: '#78bfc0',
      })
      initialized = true
      if (disposed) return void app.destroy(true, { children: true })
      host.appendChild(app.canvas)
      appRef.current = app

      const capture = async () => {
        const dataUrl = await app.renderer.extract.base64({
          target: app.stage,
          format: 'png',
          resolution: 1,
          antialias: true,
        })
        let preview = host.querySelector<HTMLImageElement>('#island-qa-snapshot')
        if (!preview) {
          preview = document.createElement('img')
          preview.id = 'island-qa-snapshot'
          preview.alt = '小耳岛当前游戏画面快照'
          preview.className = 'island-qa-snapshot'
          host.appendChild(preview)
        }
        preview.src = dataUrl
        preview.hidden = false
        app.canvas.style.visibility = 'hidden'
      }
      window.addEventListener('little-ear-capture', capture)
      removeCapture = () => window.removeEventListener('little-ear-capture', capture)

      const scene = new Container()
      const townscapeLayer = new Container()
      const atmosphereLayer = new Container()
      const environmentLayer = new Container()
      const buildingLayer = new Container()
      const movementLayer = new Container()
      const dropLayer = new Container()
      const eventLayer = new Container()
      const labelsLayer = new Container()
      sceneRef.current = scene
      townscapeLayerRef.current = townscapeLayer
      buildingLayerRef.current = buildingLayer
      dropLayerRef.current = dropLayer
      eventLayerRef.current = eventLayer
      environmentLayerRef.current = environmentLayer
      movementLayerRef.current = movementLayer
      scene.addChild(townscapeLayer, atmosphereLayer, environmentLayer, buildingLayer, movementLayer, dropLayer, eventLayer, labelsLayer)
      app.stage.addChild(scene)

      await renderTownscape(
        townscapeLayer,
        callbacks.current.buildSites,
        callbacks.current.viewIslandId,
        false,
      )

      createWaterMotion(atmosphereLayer)
      createCloudShadows(atmosphereLayer)
      renderTownLife(movementLayer, callbacks.current.prosperity)

      for (const id of BUILD_SITE_IDS) {
        const holder = new Container()
        const definition = BUILD_SITES[id]
        const displayPosition = DISPLAY_SITE_POSITIONS[id]
        holder.position.set(displayPosition.x, displayPosition.y)
        holder.eventMode = 'static'
        holder.cursor = 'pointer'
        holder.on('pointertap', (event) => {
          event.stopPropagation()
          callbacks.current.onBuildSiteSelect(id)
        })
        buildingRefs.current[id] = holder
        buildingLayer.addChild(holder)
        renderBuildHotspot(
          holder,
          id,
          callbacks.current.buildSites[id],
          callbacks.current.selectedBuildSiteId === id,
          callbacks.current.islands,
          callbacks.current.viewIslandId,
        )
      }

      const clamp = () => {
        const scaledWidth = WORLD.width * scene.scale.x
        const scaledHeight = WORLD.height * scene.scale.y
        const margin = 100
        scene.x = Math.min(margin, Math.max(app.screen.width - scaledWidth - margin, scene.x))
        scene.y = Math.min(margin, Math.max(app.screen.height - scaledHeight - margin, scene.y))
      }
      const fit = () => {
        const fitScale = Math.max(app.screen.width / WORLD.width, app.screen.height / WORLD.height)
        scene.scale.set(fitScale * 1.04)
        scene.position.set(
          app.screen.width / 2 - WORLD.width / 2 * scene.scale.x,
          app.screen.height / 2 - WORLD.height / 2 * scene.scale.y,
        )
        clamp()
      }
      fit()

      scene.eventMode = 'static'
      scene.hitArea = app.screen
      scene.cursor = 'grab'
      let dragging = false
      let collecting = false
      let moved = false
      let last = { x: 0, y: 0 }
      scene.on('pointerdown', (event) => {
        dragging = true
        collecting = Boolean((event.target as Container)?.label?.startsWith('drop:'))
        moved = false
        last = { x: event.global.x, y: event.global.y }
        scene.cursor = 'grabbing'
      })
      scene.on('pointermove', (event) => {
        if (!dragging || collecting) return
        const dx = event.global.x - last.x
        const dy = event.global.y - last.y
        if (Math.abs(dx) + Math.abs(dy) > 2) moved = true
        scene.x += dx
        scene.y += dy
        last = { x: event.global.x, y: event.global.y }
        clamp()
      })
      const stop = () => {
        dragging = false
        collecting = false
        scene.cursor = 'grab'
      }
      scene.on('pointerup', stop)
      scene.on('pointerupoutside', stop)

      const onWheel = (event: WheelEvent) => {
        event.preventDefault()
        const fitScale = Math.max(app.screen.width / WORLD.width, app.screen.height / WORLD.height)
        const next = Math.max(fitScale, Math.min(fitScale * 2.8, scene.scale.x * (event.deltaY > 0 ? .92 : 1.08)))
        const rect = host.getBoundingClientRect()
        const pointerX = event.clientX - rect.left
        const pointerY = event.clientY - rect.top
        const worldX = (pointerX - scene.x) / scene.scale.x
        const worldY = (pointerY - scene.y) / scene.scale.y
        scene.scale.set(next)
        scene.position.set(pointerX - worldX * next, pointerY - worldY * next)
        clamp()
      }
      host.addEventListener('wheel', onWheel, { passive: false })
      removeWheel = () => host.removeEventListener('wheel', onWheel)
      observer = new ResizeObserver(() => {
        if (!moved) fit()
        scene.hitArea = app.screen
      })
      observer.observe(host)

      app.ticker.add((ticker) => {
        const time = performance.now() / 1000
        atmosphereLayer.children.forEach((child, index) => {
          child.x += Math.sin(time * .35 + index) * .06 * ticker.deltaTime
          child.alpha = .22 + Math.sin(time * .28 + index) * .07
        })
        movementLayer.children.forEach((child, index) => {
          child.x += Math.cos(time * .5 + index) * .16 * ticker.deltaTime
          child.y += Math.sin(time * .7 + index) * .08 * ticker.deltaTime
        })
        dropLayer.children.forEach((child, index) => {
          child.y += Math.sin(time * 2 + index) * .12 * ticker.deltaTime
        })
      })
    }

    void setup()
    return () => {
      disposed = true
      observer?.disconnect()
      removeWheel?.()
      removeCapture?.()
      appRef.current = null
      sceneRef.current = null
      townscapeLayerRef.current = null
      buildingRefs.current = {}
      if (initialized) void app.destroy(true, { children: true })
    }
  }, [])

  useEffect(() => {
    for (const id of BUILD_SITE_IDS) {
      const holder = buildingRefs.current[id]
      if (!holder) continue
      renderBuildHotspot(
        holder,
        id,
        props.buildSites[id],
        props.selectedBuildSiteId === id,
        props.islands,
        props.viewIslandId,
      )
    }
  }, [props.buildSites, props.islands, props.selectedBuildSiteId, props.viewIslandId])

  useEffect(() => {
    const townscapeLayer = townscapeLayerRef.current
    const movementLayer = movementLayerRef.current
    if (!townscapeLayer || !movementLayer) return
    void renderTownscape(townscapeLayer, props.buildSites, props.viewIslandId, true)
    renderTownLife(movementLayer, props.prosperity)
  }, [props.buildSites, props.prosperity, props.viewIslandId])

  useEffect(() => {
    const layer = dropLayerRef.current
    if (!layer) return
    layer.removeChildren().forEach((child) => child.destroy({ children: true }))
    for (const drop of props.worldDrops.filter((item) => item.islandId === props.viewIslandId)) {
      const node = createDropNode(drop, () => callbacks.current.onDropCollect(drop.id))
      const position = collectiblePosition(drop.id)
      node.position.set(position.x, position.y)
      layer.addChild(node)
    }
  }, [props.worldDrops, props.viewIslandId])

  useEffect(() => {
    const layer = eventLayerRef.current
    if (!layer) return
    layer.removeChildren().forEach((child) => child.destroy({ children: true }))
    for (const event of props.ambientEvents.filter((item) => item.islandId === props.viewIslandId)) {
      const node = createEventNode(event, () => callbacks.current.onEventSelect(event.id))
      const position = collectiblePosition(event.id, .18)
      node.position.set(position.x, position.y)
      layer.addChild(node)
    }
  }, [props.ambientEvents, props.viewIslandId])

  useEffect(() => {
    const scene = sceneRef.current
    const app = appRef.current
    if (!scene || !app || !props.focus) return
    const targetX = app.screen.width / 2 - props.focus.x * scene.scale.x
    const targetY = app.screen.height / 2 - props.focus.y * scene.scale.y
    const startX = scene.x
    const startY = scene.y
    const start = performance.now()
    const animate = () => {
      if (!sceneRef.current) return
      const t = Math.min(1, (performance.now() - start) / 520)
      const ease = 1 - Math.pow(1 - t, 3)
      scene.position.set(startX + (targetX - startX) * ease, startY + (targetY - startY) * ease)
      if (t < 1) requestAnimationFrame(animate)
    }
    animate()
  }, [props.focus])

  useEffect(() => {
    const app = appRef.current
    if (!app) return
    app.stage.tint = 0xffffff
  }, [props.sceneTime])

  return <div className="island-canvas" ref={hostRef} aria-label="可拖动、缩放和拾取材料的小耳群岛" />
}

function renderBuildHotspot(
  holder: Container,
  id: BuildSiteId,
  progress: BuildSiteProgress,
  selected: boolean,
  islands: IslandCanvasProps['islands'],
  viewIslandId: IslandId,
) {
  holder.removeChildren().forEach((child) => child.destroy({ children: true }))
  const definition = BUILD_SITES[id]
  const visible = definition.islandId === viewIslandId
  const unlocked = islands[definition.islandId].unlocked
  holder.visible = visible
  holder.alpha = unlocked ? 1 : .28
  holder.eventMode = visible && unlocked ? 'static' : 'none'

  const halo = new Graphics()
    .ellipse(0, 0, 150 * definition.scale, 72 * definition.scale)
    .fill({ color: selected ? 0xffda6a : 0xffffff, alpha: selected ? .22 : .001 })
  if (selected) halo.stroke({ color: 0xfff0a5, width: 10, alpha: .95 })
  holder.addChild(halo)

  if (selected) {
    const badge = new Graphics()
      .roundRect(-92, 48, 184, 54, 24)
      .fill({ color: 0x294e43, alpha: .92 })
      .stroke({ color: 0xffefbd, width: 3, alpha: .9 })
    const label = new Text({
      text: `${definition.name}  ${progress.level}/8`,
      style: new TextStyle({
        fill: '#fff8dc',
        fontFamily: 'Noto Sans SC, sans-serif',
        fontSize: 22,
        fontWeight: '700',
      }),
    })
    label.anchor.set(.5)
    label.position.set(0, 75)
    holder.addChild(badge, label)
  }
}

async function renderTownscape(
  layer: Container,
  buildSites: Record<BuildSiteId, BuildSiteProgress>,
  islandId: IslandId,
  animate: boolean,
) {
  const stage = townscapeStageForIsland(buildSites, islandId)
  if (layer.label === `townscape:${islandId}:${stage}`) return
  const texture = await Assets.load(TOWNSCAPE_ASSET_PATHS[islandId][stage]) as Texture
  const sprite = new Sprite(texture)
  sprite.width = WORLD.width
  sprite.height = WORLD.height
  sprite.alpha = animate ? 0 : 1
  layer.addChild(sprite)
  layer.label = `townscape:${islandId}:${stage}`
  const oldSprites = layer.children.filter((child) => child !== sprite)
  if (!animate) {
    oldSprites.forEach((child) => child.destroy())
    return
  }
  const startedAt = performance.now()
  const fade = () => {
    if (sprite.destroyed) return
    const progress = Math.min(1, (performance.now() - startedAt) / 900)
    sprite.alpha = progress
    oldSprites.forEach((child) => { child.alpha = 1 - progress })
    if (progress < 1) requestAnimationFrame(fade)
    else oldSprites.forEach((child) => child.destroy())
  }
  requestAnimationFrame(fade)
}

function createDropNode(drop: WorldDrop, onCollect: () => void) {
  const node = new Container()
  node.label = `drop:${drop.id}`
  node.eventMode = 'static'
  node.cursor = 'pointer'
  const color = MATERIAL_META[drop.kind].color
  const glow = new Graphics().circle(0, 0, 44).fill({ color: 0xffef9c, alpha: .3 })
  const bundle = new Graphics()
  if (drop.kind === 'wood') {
    bundle.roundRect(-30, -18, 64, 13, 6).fill(color)
      .roundRect(-24, -3, 58, 13, 6).fill(0x8f5a39)
      .roundRect(-33, 12, 62, 13, 6).fill(0xb68150)
  } else if (drop.kind === 'stone') {
    bundle.poly([-32, 16, -18, -22, 12, -31, 34, 8, 16, 25]).fill(color)
      .poly([-8, 20, 8, -9, 35, 7, 24, 28]).fill(0x939d98)
  } else if (drop.kind === 'brick') {
    bundle.roundRect(-31, -19, 34, 25, 4).fill(color)
      .roundRect(5, -19, 34, 25, 4).fill(0x9f493b)
      .roundRect(-13, 8, 36, 25, 4).fill(0xc76d57)
  } else if (drop.kind === 'rope') {
    bundle.circle(0, 2, 27).stroke({ color, width: 12 })
      .circle(0, 2, 11).stroke({ color: 0xe0bc76, width: 6 })
  } else {
    bundle.poly([-34, -18, 24, -24, 34, 21, -24, 27]).fill(color)
      .moveTo(-22, -8).lineTo(25, 11).stroke({ color: 0xf3c0b3, width: 5 })
  }
  const amount = new Text({
    text: drop.amount > 1 ? `×${drop.amount}` : '',
    style: new TextStyle({ fill: '#fff', fontSize: 22, fontWeight: '800', stroke: { color: '#523c2d', width: 6 } }),
  })
  amount.position.set(20, 13)
  node.addChild(glow, bundle, amount)
  node.on('pointerdown', (event) => {
    event.stopPropagation()
    onCollect()
  })
  node.on('pointerover', (event) => {
    if (event.buttons === 1) onCollect()
  })
  return node
}

function createEventNode(event: AmbientEvent, onSelect: () => void) {
  const node = new Container()
  node.eventMode = 'static'
  node.cursor = 'pointer'
  const bg = new Graphics().roundRect(-88, -31, 176, 62, 28).fill({ color: 0xfff5c9, alpha: .95 })
    .stroke({ color: 0xffffff, width: 3 })
  const icon = new Text({
    text: event.icon === 'cat' ? '猫' : event.icon === 'kite' ? '鸢' : '舟',
    style: new TextStyle({ fill: '#9b5a35', fontSize: 25, fontWeight: '800' }),
  })
  icon.anchor.set(.5)
  icon.x = -56
  const text = new Text({
    text: event.title,
    style: new TextStyle({ fill: '#684921', fontFamily: 'Noto Sans SC', fontSize: 18, fontWeight: '700' }),
  })
  text.anchor.set(0, .5)
  text.x = -31
  node.addChild(bg, icon, text)
  node.on('pointertap', (pointerEvent) => {
    pointerEvent.stopPropagation()
    onSelect()
  })
  return node
}

function createWaterMotion(layer: Container) {
  for (let index = 0; index < 15; index += 1) {
    const wave = new Graphics()
      .moveTo(-80, 0).bezierCurveTo(-35, -12, 35, 12, 80, 0)
      .stroke({ color: 0xf2fbf4, width: 8, alpha: .25 })
    wave.position.set(300 + (index * 419) % 5600, 350 + (index * 233) % 2750)
    layer.addChild(wave)
  }
}

function collectiblePosition(id: string, inset = .1) {
  let hash = 2166136261
  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  const xRatio = inset + ((hash >>> 0) % 1000) / 1000 * (1 - inset * 2)
  const yRatio = inset + (((hash >>> 10) >>> 0) % 1000) / 1000 * (1 - inset * 2)
  return { x: WORLD.width * xRatio, y: WORLD.height * yRatio }
}

function createCloudShadows(layer: Container) {
  for (let index = 0; index < 5; index += 1) {
    const shadow = new Graphics().ellipse(0, 0, 430, 140).fill({ color: 0x315d58, alpha: .07 })
    shadow.position.set(900 + index * 1050, 520 + (index % 2) * 1680)
    shadow.rotation = -.14
    layer.addChild(shadow)
  }
}

function renderTownLife(movementLayer: Container, prosperity: number) {
  movementLayer.removeChildren().forEach((child) => child.destroy({ children: true }))
  const count = Math.min(12, Math.floor(prosperity / 90))
  for (let index = 0; index < count; index += 1) {
    const person = new Graphics()
      .circle(0, -12, 6).fill(index % 3 === 0 ? 0xc95e45 : 0x345f64)
      .roundRect(-5, -6, 10, 18, 4).fill(index % 2 === 0 ? 0xdca75d : 0x658b6f)
    person.position.set(1900 + (index * 287) % 2400, 1250 + (index * 193) % 1150)
    person.scale.set(1.25)
    movementLayer.addChild(person)
  }
}
