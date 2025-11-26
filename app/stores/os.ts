/**
 * Main OS store - all state and actions inlined for SSR compatibility.
 * Uses debounced session persistence (500ms).
 */
import { defineStore } from 'pinia'
import type { OSWindowModel, OSWindowRect, WindowId, ResizeEdge } from '../types/os'
import type { MenuTemplate } from '../types/menu'
import { useAssetUrl } from '../composables/useAssetUrl'
import { STORAGE_KEYS } from '../constants/storage-keys'
import { debounce } from '../utils/debounce'

// Constants
const MIN_W = 240
const MIN_H = 160
const SAVE_DEBOUNCE_MS = 500

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

function getViewport(): { vw: number; vh: number } {
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const docEl = document.documentElement
    return { vw: docEl.clientWidth, vh: docEl.clientHeight }
  }
  return { vw: 1280, vh: 800 }
}

// Module-level debounced save
let debouncedSaveFn: ReturnType<typeof debounce> | null = null

interface OSState {
  windows: OSWindowModel[]
  nextWindowId: number
  nextZ: number
  focusedId: WindowId | null
  clock: string
  menuBarHeight: number
  desktopPadding: number
  snapThreshold: number
  // Drag state (state machine)
  drag: {
    active: boolean
    windowId: WindowId | null
    startX: number
    startY: number
    originX: number
    originY: number
    resizing: boolean
    edge: ResizeEdge | null
    originW: number
    originH: number
  }
  // Menu state
  menu: {
    openType: 'none' | 'menubar' | 'context'
    menubarIndex: number | null
    activePath: number[]
    contextPos: { x: number; y: number } | null
    contextTemplate: MenuTemplate | null
  }
  // Session state
  wallpaper: { type: string; value: string } | null
  theme: string
}

/**
 * Main OS store with all state inlined for SSR compatibility.
 */
export const useOSStore = defineStore('os', {
  state: (): OSState => ({
    windows: [],
    nextWindowId: 1,
    nextZ: 100,
    focusedId: null,
    clock: '',
    menuBarHeight: 40,
    desktopPadding: 8,
    snapThreshold: 16,
    drag: {
      active: false,
      windowId: null,
      startX: 0,
      startY: 0,
      originX: 0,
      originY: 0,
      resizing: false,
      edge: null,
      originW: 0,
      originH: 0,
    },
    menu: {
      openType: 'none',
      menubarIndex: null,
      activePath: [],
      contextPos: null,
      contextTemplate: null,
    },
    wallpaper: null,
    theme: 'glassmorphic-light',
  }),

  getters: {
    orderedWindows: (s): OSWindowModel[] =>
      [...s.windows]
        .filter((w) => w.displayState !== 'minimized')
        .sort((a, b) => a.zIndex - b.zIndex),

    focused: (s): OSWindowModel | null =>
      s.windows.find((w) => w.id === s.focusedId) ?? null,

    activeAppId(): string | null {
      return this.focused?.appId ?? null
    },

    activeMenuTemplate(): MenuTemplate {
      return {
        id: 'system-stub',
        title: this.activeAppId ? 'App' : 'Webintosh',
        sections: [],
      }
    },
  },

  actions: {
    // --- Session persistence (debounced) ---
    _getDebouncedSave() {
      if (!debouncedSaveFn) {
        debouncedSaveFn = debounce(() => {
          this._writeToStorage()
        }, SAVE_DEBOUNCE_MS)
      }
      return debouncedSaveFn
    },

    saveSession(): void {
      this._getDebouncedSave()()
    },

    saveSessionImmediate(): void {
      this._getDebouncedSave().cancel()
      this._writeToStorage()
    },

    _writeToStorage(): void {
      if (typeof localStorage === 'undefined') return
      const snapshot = {
        windows: this.windows.map((w) => ({
          id: w.id,
          title: w.title,
          kind: w.kind,
          rect: w.rect,
          zIndex: w.zIndex,
          appId: w.appId ?? null,
          resizable: w.resizable ?? true,
          minimizable: w.minimizable ?? true,
          maximizable: w.maximizable ?? true,
          closable: w.closable ?? true,
          displayState: w.displayState ?? 'normal',
          lastNormalRect: w.lastNormalRect ?? null,
        })),
        nextWindowId: this.nextWindowId,
        nextZ: this.nextZ,
        wallpaper: this.wallpaper,
        theme: this.theme,
      }
      try {
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(snapshot))
      } catch { /* ignore */ }
    },

    loadSession(): void {
      if (typeof localStorage === 'undefined') return
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.SESSION)
        if (!raw) {
          this.wallpaper = {
            type: 'video',
            value: useAssetUrl('wallpapers/end-of-daylight.mp4') ?? '/wallpapers/end-of-daylight.mp4',
          }
          return
        }
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed?.windows)) {
          // Migrate old format to new displayState
          this.windows = parsed.windows.map((w: any) => ({
            ...w,
            displayState: w.displayState ?? (w.minimized ? 'minimized' : w.maximized ? 'maximized' : 'normal'),
          }))
        }
        if (typeof parsed?.nextWindowId === 'number') this.nextWindowId = parsed.nextWindowId
        if (typeof parsed?.nextZ === 'number') this.nextZ = parsed.nextZ
        if ('wallpaper' in parsed) {
          this.wallpaper = parsed.wallpaper
        } else {
          this.wallpaper = {
            type: 'video',
            value: useAssetUrl('wallpapers/end-of-daylight.mp4') ?? '/wallpapers/end-of-daylight.mp4',
          }
        }
        if (typeof parsed?.theme === 'string') {
          this.theme = parsed.theme
          this.applyTheme(parsed.theme)
        }
        this.focusTopMost()
      } catch { /* ignore */ }
    },

    // --- Focus ---
    setFocused(id: WindowId | null): void {
      this.focusedId = id
    },

    focusTopMost(): void {
      const candidates = this.windows
        .filter((w) => w.displayState !== 'minimized')
        .sort((a, b) => a.zIndex - b.zIndex)
      const top = candidates[candidates.length - 1] ?? null
      this.focusedId = top ? top.id : null
    },

    // --- Clock ---
    tickClock(): void {
      const d = new Date()
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const day = days[d.getDay()]
      const date = d.getDate()
      const month = months[d.getMonth()]
      const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
      this.clock = `${day} ${date} ${month} ${time}`
    },

    // --- Bounds ---
    ensureBounds(w: OSWindowModel): void {
      const { vw, vh } = getViewport()
      const pad = this.desktopPadding
      const minX = pad
      const minY = this.menuBarHeight
      const maxWidth = Math.max(MIN_W, vw - pad * 2)
      const maxHeight = Math.max(MIN_H, vh - this.menuBarHeight - pad)
      w.rect.width = Math.floor(clamp(w.rect.width, MIN_W, maxWidth))
      w.rect.height = Math.floor(clamp(w.rect.height, MIN_H, maxHeight))
      const maxX = vw - w.rect.width - pad
      const maxY = vh - w.rect.height - pad
      w.rect.x = Math.round(clamp(w.rect.x, minX, Math.max(minX, maxX)))
      w.rect.y = Math.round(clamp(w.rect.y, minY, Math.max(minY, maxY)))
    },

    realignAllToBounds(): void {
      for (const w of this.windows) {
        this.ensureBounds(w)
      }
      this.saveSession()
    },

    // --- Window CRUD ---
    openWindow(partial?: Partial<OSWindowModel> & { title?: string }): WindowId {
      const id = this.nextWindowId++
      const baseWidth = partial?.rect?.width ?? 360
      const baseHeight = partial?.rect?.height ?? 220
      const offset = (this.windows.length % 6) * 24
      const w: OSWindowModel = {
        id,
        title: partial?.title ?? `Window ${id}`,
        kind: partial?.kind ?? 'blank',
        rect: {
          x: (partial?.rect?.x ?? 60) + offset,
          y: (partial?.rect?.y ?? this.menuBarHeight + 20) + offset,
          width: baseWidth,
          height: baseHeight,
        },
        zIndex: this.nextZ++,
        appId: partial?.appId,
        resizable: partial?.resizable ?? true,
        minimizable: partial?.minimizable ?? true,
        maximizable: partial?.maximizable ?? true,
        closable: partial?.closable ?? true,
        displayState: 'normal',
      }
      this.windows.push(w)
      this.bringToFront(w.id)
      this.saveSession()
      return w.id
    },

    closeWindow(id: WindowId): void {
      if (this.drag.windowId === id) {
        this.endDrag()
      }
      this.windows = this.windows.filter((w) => w.id !== id)
      if (this.focusedId === id) {
        this.focusTopMost()
      }
      this.saveSessionImmediate()
    },

    bringToFront(id: WindowId): void {
      const w = this.windows.find((w) => w.id === id)
      if (!w) return
      w.zIndex = this.nextZ++
      this.setFocused(id)
      if (this.nextZ > 10000) {
        this.normalizeZOrder()
      }
      this.saveSession()
    },

    normalizeZOrder(): void {
      const base = 100
      const sorted = [...this.windows].sort((a, b) => a.zIndex - b.zIndex)
      let z = base
      for (const w of sorted) {
        w.zIndex = z++
      }
      this.nextZ = z
    },

    // --- Dragging ---
    startDrag(id: WindowId, clientX: number, clientY: number): void {
      const w = this.windows.find((w) => w.id === id)
      if (!w) return
      this.drag.active = true
      this.drag.resizing = false
      this.drag.windowId = id
      this.drag.startX = clientX
      this.drag.startY = clientY
      this.drag.originX = w.rect.x
      this.drag.originY = w.rect.y
      this.bringToFront(id)
    },

    dragTo(clientX: number, clientY: number): void {
      if (!this.drag.active || this.drag.windowId == null || this.drag.resizing) return
      const w = this.windows.find((w) => w.id === this.drag.windowId)
      if (!w) return
      const dx = clientX - this.drag.startX
      const dy = clientY - this.drag.startY
      w.rect.x = this.drag.originX + dx
      w.rect.y = this.drag.originY + dy
      this.ensureBounds(w)
    },

    endDrag(): void {
      this.drag.active = false
      this.drag.resizing = false
      this.drag.windowId = null
      this.drag.edge = null
      this.saveSession()
    },

    // --- Resizing ---
    startResize(id: WindowId, edge: ResizeEdge | null, clientX: number, clientY: number): void {
      const w = this.windows.find((w) => w.id === id)
      if (!w || w.resizable === false || !edge) return
      this.drag.active = true
      this.drag.resizing = true
      this.drag.edge = edge
      this.drag.windowId = id
      this.drag.startX = clientX
      this.drag.startY = clientY
      this.drag.originX = w.rect.x
      this.drag.originY = w.rect.y
      this.drag.originW = w.rect.width
      this.drag.originH = w.rect.height
      this.bringToFront(id)
    },

    resizeTo(clientX: number, clientY: number): void {
      if (!this.drag.active || !this.drag.resizing || this.drag.windowId == null) return
      const w = this.windows.find((w) => w.id === this.drag.windowId)
      if (!w) return
      const dx = clientX - this.drag.startX
      const dy = clientY - this.drag.startY
      const originX = this.drag.originX
      const originY = this.drag.originY
      const originW = this.drag.originW ?? w.rect.width
      const originH = this.drag.originH ?? w.rect.height
      const { vw, vh } = getViewport()
      const pad = this.desktopPadding
      const minX = pad
      const minY = this.menuBarHeight
      const eastEdge = originX + originW
      const southEdge = originY + originH
      let x = originX, y = originY, width = originW, height = originH
      const edge = this.drag.edge
      if (edge?.includes('e')) {
        const maxWidthE = Math.max(MIN_W, vw - pad - originX)
        width = clamp(originW + dx, MIN_W, maxWidthE)
      }
      if (edge?.includes('s')) {
        const maxHeightS = Math.max(MIN_H, vh - pad - originY)
        height = clamp(originH + dy, MIN_H, maxHeightS)
      }
      if (edge?.includes('w')) {
        const maxWidthW = Math.max(MIN_W, eastEdge - minX)
        width = clamp(originW - dx, MIN_W, maxWidthW)
        x = eastEdge - width
      }
      if (edge?.includes('n')) {
        const maxHeightN = Math.max(MIN_H, southEdge - minY)
        height = clamp(originH - dy, MIN_H, maxHeightN)
        y = southEdge - height
      }
      const maxX = vw - width - pad
      const maxY = vh - height - pad
      x = clamp(x, minX, Math.max(minX, maxX))
      y = clamp(y, minY, Math.max(minY, maxY))
      w.rect = { x: Math.round(x), y: Math.round(y), width: Math.floor(width), height: Math.floor(height) }
    },

    endResize(): void {
      this.endDrag()
    },

    // --- Maximize / Minimize ---
    toggleMaximize(id: WindowId): void {
      const w = this.windows.find((w) => w.id === id)
      if (!w) return
      const { vw, vh } = getViewport()
      const pad = this.desktopPadding
      if (w.displayState !== 'maximized') {
        w.lastNormalRect = { ...w.rect }
        w.rect.x = pad
        w.rect.y = this.menuBarHeight
        w.rect.width = Math.floor(Math.max(MIN_W, vw - pad * 2))
        w.rect.height = Math.floor(Math.max(MIN_H, vh - this.menuBarHeight - pad))
        w.displayState = 'maximized'
      } else {
        if (w.lastNormalRect) {
          w.rect = { ...w.lastNormalRect }
        }
        w.displayState = 'normal'
      }
      this.bringToFront(id)
      this.saveSessionImmediate()
    },

    minimizeWindow(id: WindowId): void {
      const w = this.windows.find((w) => w.id === id)
      if (!w) return
      w.displayState = 'minimized'
      if (this.focusedId === id) this.focusTopMost()
      this.saveSessionImmediate()
    },

    restoreWindow(id: WindowId): void {
      const w = this.windows.find((w) => w.id === id)
      if (!w) return
      w.displayState = 'normal'
      this.bringToFront(id)
      this.saveSessionImmediate()
    },

    toggleMinimize(id: WindowId): void {
      const w = this.windows.find((w) => w.id === id)
      if (!w) return
      if (w.displayState === 'minimized') this.restoreWindow(id)
      else this.minimizeWindow(id)
    },

    setWindowRect(id: WindowId, rect: Partial<OSWindowRect>): void {
      const w = this.windows.find((w) => w.id === id)
      if (!w) return
      w.rect = { ...w.rect, ...rect }
      this.ensureBounds(w)
      this.saveSession()
    },

    // --- Menu ---
    openMenubar(index?: number): void {
      this.menu.openType = 'menubar'
      this.menu.menubarIndex = typeof index === 'number' ? index : 0
      this.menu.activePath = []
      this.menu.contextPos = null
      this.menu.contextTemplate = null
    },

    openContext(x: number, y: number, template: MenuTemplate): void {
      this.menu.openType = 'context'
      this.menu.menubarIndex = null
      this.menu.activePath = []
      this.menu.contextPos = { x, y }
      this.menu.contextTemplate = template
    },

    setActivePath(path: number[]): void {
      this.menu.activePath = Array.isArray(path) ? [...path] : []
    },

    closeMenu(): void {
      this.menu.openType = 'none'
      this.menu.menubarIndex = null
      this.menu.activePath = []
      this.menu.contextPos = null
      this.menu.contextTemplate = null
    },

    // --- Wallpaper & Theme ---
    setWallpaper(wallpaper: { type: string; value: string } | null): void {
      this.wallpaper = wallpaper
      this.saveSessionImmediate()
    },

    setTheme(theme: string): void {
      this.theme = theme
      this.applyTheme(theme)
      this.saveSessionImmediate()
    },

    applyTheme(theme: string): void {
      if (typeof document === 'undefined') return
      document.documentElement.setAttribute('data-theme', theme)
    },

    initTheme(): void {
      if (this.theme) {
        this.applyTheme(this.theme)
      }
    },
  },
})
