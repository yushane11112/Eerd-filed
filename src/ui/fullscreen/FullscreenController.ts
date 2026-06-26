export interface FullscreenAdapter {
  getElement(): Element | null
  request(element: Element): Promise<void>
  exit(): Promise<void>
  subscribe(listener: () => void): () => void
}

export interface FullscreenState {
  supported: boolean
  active: boolean
  pending: boolean
  error: string | null
}

export type FullscreenListener = (state: Readonly<FullscreenState>) => void

export class FullscreenController {
  private state: FullscreenState
  private listeners = new Set<FullscreenListener>()
  private unsubscribeAdapter: (() => void) | null = null

  constructor(
    private readonly adapter: FullscreenAdapter,
    private readonly target: () => Element | null,
  ) {
    this.state = {
      supported: typeof document !== 'undefined' && 'fullscreenEnabled' in document
        ? document.fullscreenEnabled
        : true,
      active: adapter.getElement() !== null,
      pending: false,
      error: null,
    }
    this.unsubscribeAdapter = adapter.subscribe(() => this.sync())
  }

  getState = (): Readonly<FullscreenState> => this.state

  subscribe = (listener: FullscreenListener): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  async enter(): Promise<boolean> {
    const target = this.target()
    if (!target || !this.state.supported || this.state.pending) return false
    return this.perform(() => this.adapter.request(target))
  }

  async exit(): Promise<boolean> {
    if (!this.state.active || this.state.pending) return false
    return this.perform(() => this.adapter.exit())
  }

  async toggle(): Promise<boolean> {
    return this.state.active ? this.exit() : this.enter()
  }

  dispose(): void {
    this.unsubscribeAdapter?.()
    this.unsubscribeAdapter = null
    this.listeners.clear()
  }

  private async perform(action: () => Promise<void>): Promise<boolean> {
    this.setState({ ...this.state, pending: true, error: null })
    try {
      await action()
      this.sync()
      return true
    } catch (error) {
      this.setState({
        ...this.state,
        pending: false,
        error: error instanceof Error ? error.message : String(error),
      })
      return false
    }
  }

  private sync(): void {
    this.setState({
      ...this.state,
      active: this.adapter.getElement() !== null,
      pending: false,
    })
  }

  private setState(state: FullscreenState): void {
    this.state = state
    this.listeners.forEach((listener) => listener(this.state))
  }
}

export function createBrowserFullscreenAdapter(doc: Document = document): FullscreenAdapter {
  return {
    getElement: () => doc.fullscreenElement,
    request: async (element) => element.requestFullscreen(),
    exit: async () => doc.exitFullscreen(),
    subscribe: (listener) => {
      doc.addEventListener('fullscreenchange', listener)
      return () => doc.removeEventListener('fullscreenchange', listener)
    },
  }
}

