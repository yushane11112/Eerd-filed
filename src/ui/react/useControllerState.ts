import { useSyncExternalStore } from 'react'

export interface ExternalController<T> {
  getState(): Readonly<T>
  subscribe(listener: (state: Readonly<T>) => void): () => void
}

export function useControllerState<T>(controller: ExternalController<T>): Readonly<T> {
  return useSyncExternalStore(
    controller.subscribe,
    controller.getState,
    controller.getState,
  )
}

