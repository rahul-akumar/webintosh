import { defineStore } from 'pinia'
import type { OSWindowModel, OSWindowRect, WindowId, WindowDisplayState } from '../types/os'
import { clamp, getViewport } from '../utils/math'

const MIN_W = 240
const MIN_H = 160

export interface WindowState {
  windows: OSWindowModel[]
  nextWindowId: number
  nextZ: number
  focusedId: WindowId | null
  menuBarHeight: number
  desktopPadding: number
  snapThreshold: number
  clock: string
}

/**
 * Window store manages window lifecycle, z-ordering, and display states.
 */
export const useWindowStore = defineStore('window', {
  state: (): WindowState => ({
    windows: [],
    nextWindowId: 1,
    nextZ: 100,
    focusedId: null,
    menuBarHeight: 40,
    desktopPadding: 8,
    snapThreshold: 16,
    clock: '',
  }),

  getters: {
    /** Get visible (non-minimized) windows sorted by z-index */
    orderedWindows: (state): OSWindowModel[] =>
      [...state.windows]
        .filter((w) => w.displayState !== 'minimized')
        .sort((a, b) => a.zIndex - b.zIndex),

    /** Get the currently focused window */
    focused: (state): OSWindowModel | null =>
      state.windows.find((w) => w.id === state.focusedId) ?? null,

    /** Get the app ID of the focused window */
    activeAppId(): string | null {
      return this.focused?.appId ?? null
    },

    /** Get window by ID */
    getWindow: (state) => (id: WindowId): OSWindowModel | undefined =>
      state.windows.find((w) => w.id === id),

    /** Get all windows for an app */
    getWindowsByApp: (state) => (appId: string): OSWindowModel[] =>
      state.windows.filter((w) => w.appId === appId),

    /** Get minimized windows */
    minimizedWindows: (state): OSWindowModel[] =>
      state.windows.filter((w) => w.displayState === 'minimized'),
  },

  actions: {
    // ---------- Clock ----------

    tickClock(): void {
      const d = new Date()
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const day = days[d.getDay()]
      const date = d.getDate()
      const month = months[d.getMonth()]
      const time = d.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
      this.clock = `${day} ${date} ${month} ${time}`
    },

    // ---------- Focus ----------

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

    // ---------- Bounds ----------

    ensureBounds(w: OSWindowModel): void {
      const { vw, vh } = getViewport()
      const pad = this.desktopPadding
      const minX = pad
      const minY = this.menuBarHeight

      const maxWidth = Math.max(MIN_W, vw - pad * 2)
      const maxHeight = Math.max(MIN_H, vh - this.menuBarHeight - pad)

      const clampedW = clamp(w.rect.width, MIN_W, maxWidth)
      const clampedH = clamp(w.rect.height, MIN_H, maxHeight)
      w.rect.width = Math.floor(clampedW)
      w.rect.height = Math.floor(clampedH)

      const maxX = vw - w.rect.width - pad
      const maxY = vh - w.rect.height - pad
      w.rect.x = Math.round(clamp(w.rect.x, minX, Math.max(minX, maxX)))
      w.rect.y = Math.round(clamp(w.rect.y, minY, Math.max(minY, maxY)))
    },

    realignAllToBounds(): void {
      for (const w of this.windows) {
        this.ensureBounds(w)
      }
    },

    // ---------- Window CRUD ----------

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
      return w.id
    },

    closeWindow(id: WindowId): void {
      this.windows = this.windows.filter((w) => w.id !== id)
      if (this.focusedId === id) {
        this.focusTopMost()
      }
    },

    // ---------- Z-Order ----------

    bringToFront(id: WindowId): void {
      const w = this.windows.find((w) => w.id === id)
      if (!w) return
      w.zIndex = this.nextZ++
      this.setFocused(id)
      if (this.nextZ > 10000) {
        this.normalizeZOrder()
      }
    },

    normalizeZOrder(): void {
      const base = 100
      const sorted = [...this.windows].sort((a, b) => a.zIndex - b.zIndex)
      let z = base
      for (const win of sorted) {
        win.zIndex = z++
      }
      this.nextZ = z
    },

    // ---------- Display State ----------

    setDisplayState(id: WindowId, state: WindowDisplayState): void {
      const w = this.windows.find((w) => w.id === id)
      if (!w) return
      w.displayState = state
    },

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
    },

    minimizeWindow(id: WindowId): void {
      const w = this.windows.find((w) => w.id === id)
      if (!w) return
      w.displayState = 'minimized'
      if (this.focusedId === id) {
        this.focusTopMost()
      }
    },

    restoreWindow(id: WindowId): void {
      const w = this.windows.find((w) => w.id === id)
      if (!w) return
      w.displayState = 'normal'
      this.bringToFront(id)
    },

    toggleMinimize(id: WindowId): void {
      const w = this.windows.find((w) => w.id === id)
      if (!w) return
      if (w.displayState === 'minimized') {
        this.restoreWindow(id)
      } else {
        this.minimizeWindow(id)
      }
    },

    // ---------- Rect Updates ----------

    setWindowRect(id: WindowId, rect: Partial<OSWindowRect>): void {
      const w = this.windows.find((w) => w.id === id)
      if (!w) return
      w.rect = { ...w.rect, ...rect }
      this.ensureBounds(w)
    },

    updateWindowPosition(id: WindowId, x: number, y: number): void {
      const w = this.windows.find((w) => w.id === id)
      if (!w) return
      w.rect.x = x
      w.rect.y = y
      this.ensureBounds(w)
    },

    updateWindowGeometry(id: WindowId, rect: OSWindowRect): void {
      const w = this.windows.find((w) => w.id === id)
      if (!w) return
      w.rect = rect
    },

    // ---------- Session Loading ----------

    loadWindows(windows: OSWindowModel[], nextWindowId: number, nextZ: number): void {
      // Migrate old boolean flags to displayState if needed
      this.windows = windows.map((w) => {
        if (!w.displayState) {
          // Migration from old format
          if ((w as OSWindowModel & { minimized?: boolean }).minimized) {
            w.displayState = 'minimized'
          } else if ((w as OSWindowModel & { maximized?: boolean }).maximized) {
            w.displayState = 'maximized'
          } else {
            w.displayState = 'normal'
          }
        }
        return w
      })
      this.nextWindowId = nextWindowId
      this.nextZ = nextZ
      this.focusTopMost()
    },

    // ---------- Helpers ----------

    getViewportConstraints(): {
      minW: number
      minH: number
      minX: number
      minY: number
      maxX: number
      maxY: number
      vw: number
      vh: number
      pad: number
    } {
      const { vw, vh } = getViewport()
      const pad = this.desktopPadding
      return {
        minW: MIN_W,
        minH: MIN_H,
        minX: pad,
        minY: this.menuBarHeight,
        maxX: vw - pad,
        maxY: vh - pad,
        vw,
        vh,
        pad,
      }
    },
  },
})
