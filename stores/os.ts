import { defineStore } from 'pinia'
import type {
  OSState,
  OSWindowModel,
  OSWindowRect,
  WindowId
} from '../types/os'

const MIN_W = 240
const MIN_H = 160

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function getViewport() {
  if (typeof window !== 'undefined') {
    return { vw: window.innerWidth, vh: window.innerHeight }
  }
  // SSR/defaults
  return { vw: 1280, vh: 800 }
}

export const useOSStore = defineStore('os', {
  state: (): OSState => ({
    windows: [],
    nextWindowId: 1,
    nextZ: 100,
    drag: {
      active: false,
      windowId: null,
      startX: 0,
      startY: 0,
      originX: 0,
      originY: 0,
      // resize fields
      resizing: false,
      edge: null,
      originW: 0,
      originH: 0
    },
    menu: {
      isAppleOpen: false
    },
    focusedId: null,
    clock: '',
    menuBarHeight: 40,
    desktopPadding: 8
  }),

  getters: {
    orderedWindows: (s): OSWindowModel[] =>
      [...s.windows]
        .filter(w => !w.minimized)
        .sort((a, b) => a.zIndex - b.zIndex),

    focused: (s): OSWindowModel | null =>
      s.windows.find(w => w.id === s.focusedId) ?? null
  },

  actions: {
    // ---------- Helpers ----------
    saveSession() {
      if (typeof localStorage === 'undefined') return
      const snapshot = {
        windows: this.windows.map(w => ({
          id: w.id,
          title: w.title,
          kind: w.kind,
          rect: w.rect,
          zIndex: w.zIndex,
          appId: w.appId ?? null,
          resizable: w.resizable ?? true,
          minimizable: w.minimizable ?? true,
          closable: w.closable ?? true,
          maximized: !!w.maximized,
          minimized: !!w.minimized,
          lastNormalRect: w.lastNormalRect ?? null
        })),
        nextWindowId: this.nextWindowId,
        nextZ: this.nextZ
      }
      try {
        localStorage.setItem('webintosh:session:v1', JSON.stringify(snapshot))
      } catch { /* ignore */ }
    },

    loadSession() {
      if (typeof localStorage === 'undefined') return
      try {
        const raw = localStorage.getItem('webintosh:session:v1')
        if (!raw) return
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed?.windows)) {
          this.windows = parsed.windows as OSWindowModel[]
        }
        if (typeof parsed?.nextWindowId === 'number') this.nextWindowId = parsed.nextWindowId
        if (typeof parsed?.nextZ === 'number') this.nextZ = parsed.nextZ
      } catch { /* ignore */ }
    },

    setFocused(id: WindowId | null) {
      this.focusedId = id
    },

    ensureBounds(w: OSWindowModel) {
      const { vw, vh } = getViewport()
      const pad = this.desktopPadding
      const minX = pad
      const minY = this.menuBarHeight
      const maxX = vw - w.rect.width - pad
      const maxY = vh - w.rect.height - pad
      w.rect.x = clamp(w.rect.x, minX, Math.max(minX, maxX))
      w.rect.y = clamp(w.rect.y, minY, Math.max(minY, maxY))
    },

    // ---------- Clock ----------
    tickClock() {
      const d = new Date()
      this.clock = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },

    // ---------- Windows ----------
    openWindow(partial?: Partial<OSWindowModel> & { title?: string }) {
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
          y: (partial?.rect?.y ?? (this.menuBarHeight + 20)) + offset,
          width: baseWidth,
          height: baseHeight
        },
        zIndex: this.nextZ++,
        appId: partial?.appId,
        resizable: partial?.resizable ?? true,
        minimizable: partial?.minimizable ?? true,
        closable: partial?.closable ?? true,
        maximized: false,
        minimized: false
      }

      this.windows.push(w)
      this.bringToFront(w.id)
      this.saveSession()
      return w.id
    },

    closeWindow(id: WindowId) {
      this.windows = this.windows.filter(w => w.id !== id)
      if (this.drag.windowId === id) {
        this.endDrag()
      }
      if (this.focusedId === id) {
        this.focusedId = null
      }
      this.saveSession()
    },

    bringToFront(id: WindowId) {
      const w = this.windows.find(w => w.id === id)
      if (!w) return
      w.zIndex = this.nextZ++
      this.setFocused(id)
      if (this.nextZ > 10000) {
        this.normalizeZOrder()
      }
      this.saveSession()
    },

    // ---------- Dragging ----------
    startDrag(id: WindowId, clientX: number, clientY: number) {
      const w = this.windows.find(w => w.id === id)
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

    dragTo(clientX: number, clientY: number) {
      if (!this.drag.active || this.drag.windowId == null || this.drag.resizing) return
      const w = this.windows.find(w => w.id === this.drag.windowId)
      if (!w) return

      const dx = clientX - this.drag.startX
      const dy = clientY - this.drag.startY

      w.rect.x = this.drag.originX + dx
      w.rect.y = this.drag.originY + dy
      this.ensureBounds(w)
    },

    endDrag() {
      this.drag.active = false
      this.drag.resizing = false
      this.drag.windowId = null
      this.drag.edge = null
      this.saveSession()
    },

    // ---------- Resizing ----------
    startResize(id: WindowId, edge: OSState['drag']['edge'], clientX: number, clientY: number) {
      const w = this.windows.find(w => w.id === id)
      if (!w || w.resizable === false) return
      this.drag.active = true
      this.drag.resizing = true
      this.drag.edge = edge ?? null
      this.drag.windowId = id
      this.drag.startX = clientX
      this.drag.startY = clientY
      this.drag.originX = w.rect.x
      this.drag.originY = w.rect.y
      this.drag.originW = w.rect.width
      this.drag.originH = w.rect.height
      this.bringToFront(id)
    },

    resizeTo(clientX: number, clientY: number) {
      if (!this.drag.active || !this.drag.resizing || this.drag.windowId == null) return
      const w = this.windows.find(w => w.id === this.drag.windowId)
      if (!w) return

      const dx = clientX - this.drag.startX
      const dy = clientY - this.drag.startY

      let x = this.drag.originX
      let y = this.drag.originY
      let width = this.drag.originW ?? w.rect.width
      let height = this.drag.originH ?? w.rect.height

      const edge = this.drag.edge

      if (edge?.includes('e')) width = this.drag.originW! + dx
      if (edge?.includes('s')) height = this.drag.originH! + dy
      if (edge?.includes('w')) {
        x = this.drag.originX + dx
        width = this.drag.originW! - dx
      }
      if (edge?.includes('n')) {
        y = this.drag.originY + dy
        height = this.drag.originH! - dy
      }

      width = Math.max(MIN_W, width)
      height = Math.max(MIN_H, height)

      // Constrain to desktop bounds
      const { vw, vh } = getViewport()
      const pad = this.desktopPadding
      const minX = pad
      const minY = this.menuBarHeight
      const maxX = vw - width - pad
      const maxY = vh - height - pad

      x = clamp(x, minX, Math.max(minX, maxX))
      y = clamp(y, minY, Math.max(minY, maxY))

      w.rect = { x, y, width, height }
    },

    endResize() {
      // alias of endDrag currently
      this.endDrag()
    },

    // ---------- Maximize / Minimize ----------
    toggleMaximize(id: WindowId) {
      const w = this.windows.find(w => w.id === id)
      if (!w) return
      const { vw, vh } = getViewport()
      const pad = this.desktopPadding

      if (!w.maximized) {
        w.lastNormalRect = { ...w.rect }
        w.rect.x = pad
        w.rect.y = this.menuBarHeight
        w.rect.width = Math.max(MIN_W, vw - pad * 2)
        w.rect.height = Math.max(MIN_H, vh - this.menuBarHeight - pad)
        w.maximized = true
      } else {
        if (w.lastNormalRect) {
          w.rect = { ...w.lastNormalRect }
        }
        w.maximized = false
      }
      this.bringToFront(id)
      this.saveSession()
    },

    minimizeWindow(id: WindowId) {
      const w = this.windows.find(w => w.id === id)
      if (!w) return
      w.minimized = true
      if (this.focusedId === id) this.focusedId = null
      this.saveSession()
    },

    restoreWindow(id: WindowId) {
      const w = this.windows.find(w => w.id === id)
      if (!w) return
      w.minimized = false
      this.bringToFront(id)
      this.saveSession()
    },

    toggleMinimize(id: WindowId) {
      const w = this.windows.find(w => w.id === id)
      if (!w) return
      if (w.minimized) this.restoreWindow(id)
      else this.minimizeWindow(id)
    },

    setWindowRect(id: WindowId, rect: Partial<OSWindowRect>) {
      const w = this.windows.find(w => w.id === id)
      if (!w) return
      w.rect = { ...w.rect, ...rect }
      this.ensureBounds(w)
      this.saveSession()
    },

    /**
     * Re-apply bounds to all windows (e.g., when the viewport size changes).
     * Performs a single save after adjustments.
     */
    realignAllToBounds() {
      for (const w of this.windows) {
        this.ensureBounds(w)
      }
      this.saveSession()
    },

    /**
     * Compact z-index ordering to avoid runaway growth.
     * Preserves current stacking order.
     */
    normalizeZOrder() {
      const base = 100
      const sorted = [...this.windows].sort((a, b) => a.zIndex - b.zIndex)
      let z = base
      for (const w of sorted) {
        w.zIndex = z++
      }
      this.nextZ = z
    },
 
    // ---------- Menu ----------
    toggleAppleMenu(v?: boolean) {
      this.menu.isAppleOpen = typeof v === 'boolean' ? v : !this.menu.isAppleOpen
    }
  }
})