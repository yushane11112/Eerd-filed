import type { RefObject } from 'react'
import { useEffect } from 'react'
import type { CameraController } from '../camera/CameraController'
import { DragController } from '../input/DragController'

export interface CameraInteractionOptions {
  wheelSensitivity?: number
  dragThreshold?: number
  disabled?: boolean
}

export function useCameraInteractions(
  targetRef: RefObject<HTMLElement | null>,
  camera: CameraController,
  options: CameraInteractionOptions = {},
): void {
  const { wheelSensitivity = 0.0015, dragThreshold = 4, disabled = false } = options

  useEffect(() => {
    const element = targetRef.current
    if (!element || disabled) return
    const drag = new DragController(dragThreshold)

    const localPoint = (event: PointerEvent | WheelEvent) => {
      const rect = element.getBoundingClientRect()
      return { x: event.clientX - rect.left, y: event.clientY - rect.top }
    }
    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || !drag.start(event.pointerId, localPoint(event))) return
      element.setPointerCapture(event.pointerId)
    }
    const onPointerMove = (event: PointerEvent) => {
      const update = drag.move(event.pointerId, localPoint(event))
      if (update?.state.dragging) camera.panByScreenDelta(update.delta)
    }
    const finish = (event: PointerEvent) => {
      drag.end(event.pointerId)
      if (element.hasPointerCapture(event.pointerId)) {
        element.releasePointerCapture(event.pointerId)
      }
    }
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      camera.zoomBy(localPoint(event), Math.exp(-event.deltaY * wheelSensitivity))
    }

    element.addEventListener('pointerdown', onPointerDown)
    element.addEventListener('pointermove', onPointerMove)
    element.addEventListener('pointerup', finish)
    element.addEventListener('pointercancel', finish)
    element.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      element.removeEventListener('pointerdown', onPointerDown)
      element.removeEventListener('pointermove', onPointerMove)
      element.removeEventListener('pointerup', finish)
      element.removeEventListener('pointercancel', finish)
      element.removeEventListener('wheel', onWheel)
      drag.cancel()
    }
  }, [camera, disabled, dragThreshold, targetRef, wheelSensitivity])
}

