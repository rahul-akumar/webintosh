/**
 * Main OS store - orchestrates window management and delegates to sub-stores.
 * Uses debounced session persistence (500ms).
 */
import { defineStore } from 'pinia'
import type { OSWindowModel, OSWindowRect, WindowId, ResizeEdge, SnapZone } from '../types/os'
import type { MenuTemplate } from '../types/menu'
import { useDragStore } from './drag'
import { useMenuStore } from './menu'
import { useSessionStore } from './session'
import { STORAGE_KEYS } from '../constants/storage-keys'
import { debounce } from '../utils/debounce'
import { clamp, getViewport } from '../utils/math'
import { getSnapZone, getSnapRect, SNAP_THRESHOLD } from '../utils/snap'
import { hasAppComponent } from '../config/apps'

// Constants
const MIN_W = 240
const MIN_H = 160
const SAVE_DEBOUNCE_MS = 500
const MINIMIZE_ANIMATION_MS = 300
const RESTORE_ANIMATION_MS = 300
const MAXIMIZE_ANIMATION_MS = 250
const SNAP_ANIMATION_MS = 200

// Per-store-instance debounced save, keyed by store instance (not Pinia
// state - a function in state would pollute devtools serialization, and a
// single module-level singleton would leak `this` across store re-creation,
// breaking test isolation).
const debouncedSaveFns = new WeakMap<object, ReturnType<typeof debounce>>()

interface OSState {
  // Window state (kept here as core OS concern)
  windows: OSWindowModel[]
  nextWindowId: number
  nextZ: number
  focusedId: WindowId | null
  // OS config
  clock: string
  menuBarHeight: number
  desktopPadding: number
}

/**
 * Main OS store - orchestrates sub-stores for drag, menu, and session.
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
  }),

  getters: {
    orderedWindows: (s): OSWindowModel[] =>
      [...s.windows]
        .filter((w) => w.displayState !== 'minimized' || w.animationState === 'minimizing' || w.animationState === 'restoring')
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

    // --- Delegated getters from sub-stores ---
    /** Current drag state (delegated to drag store) */
    drag(): { active: boolean; windowId: WindowId | null; resizing: boolean; edge: ResizeEdge | null } {
      const dragStore = useDragStore()
      return {
        active: dragStore.isActive,
        windowId: dragStore.activeWindowId,
        resizing: dragStore.isResizing,
        edge: dragStore.resizeEdge,
      }
    },

    /** Current menu state (delegated to menu store) */
    menu(): { openType: 'none' | 'menubar' | 'context'; menubarIndex: number | null; activePath: number[]; contextPos: { x: number; y: number } | null; contextTemplate: MenuTemplate | null } {
      const menuStore = useMenuStore()
      return {
        openType: menuStore.openType,
        menubarIndex: menuStore.menubarIndex,
        activePath: menuStore.activePath,
        contextPos: menuStore.contextPos,
        contextTemplate: menuStore.contextTemplate,
      }
    },

    /** Wallpaper (delegated to session store) */
    wallpaper(): { type: string; value: string } | null {
      return useSessionStore().wallpaper
    },

    /** Theme (delegated to session store) */
    theme(): string {
      return useSessionStore().theme
    },

    /**
     * Resolve the target rect for a snap zone, using the same viewport/pad/
     * min-size constants endDrag applies on release - so the preview overlay
     * (WindowManager.vue) always matches exactly what dropping will produce.
     */
    previewRectForZone() {
      return (zone: SnapZone): OSWindowRect => {
        const { vw, vh } = getViewport()
        return getSnapRect(zone, {
          vw,
          vh,
          pad: this.desktopPadding,
          menuBarHeight: this.menuBarHeight,
          minW: MIN_W,
          minH: MIN_H,
        })
      }
    },
  },

  actions: {
    // --- Session persistence (debounced) ---
    _getDebouncedSave() {
      let fn = debouncedSaveFns.get(this)
      if (!fn) {
        fn = debounce(() => {
          this._writeToStorage()
        }, SAVE_DEBOUNCE_MS)
        debouncedSaveFns.set(this, fn)
      }
      return fn
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
      const sessionStore = useSessionStore()
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
          snapped: w.snapped ?? null,
          preSnapRect: w.preSnapRect ?? null,
        })),
        nextWindowId: this.nextWindowId,
        nextZ: this.nextZ,
        ...sessionStore.getSnapshot(),
      }
      try {
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(snapshot))
      } catch { /* ignore */ }
    },

    loadSession(): void {
      if (typeof localStorage === 'undefined') return
      const sessionStore = useSessionStore()
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.SESSION)
        if (!raw) {
          sessionStore.initDefaults()
          return
        }
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed?.windows)) {
          // Migrate old format to new displayState, then drop windows whose
          // appId no longer resolves to a registered app (e.g. a culled app
          // left behind in a stale saved session) to avoid ghost windows.
          // Checked against the static app registry, not the apps store:
          // loadSession() runs before registerApps(), so the store would
          // still be empty here.
          this.windows = parsed.windows
            .map((w: OSWindowModel & { minimized?: boolean; maximized?: boolean }) => ({
              ...w,
              displayState: w.displayState ?? (w.minimized ? 'minimized' : w.maximized ? 'maximized' : 'normal'),
            }))
            .filter((w: OSWindowModel) => !w.appId || hasAppComponent(w.appId))
        }
        if (typeof parsed?.nextWindowId === 'number') this.nextWindowId = parsed.nextWindowId
        if (typeof parsed?.nextZ === 'number') this.nextZ = parsed.nextZ
        // Delegate session state loading
        sessionStore.loadFromSnapshot(parsed)
        this.focusTopMost()
      } catch { /* ignore */ }
    },

    // --- Focus ---
    setFocused(id: WindowId | null): void {
      this.focusedId = id
    },

    focusTopMost(): void {
      // Exclude windows mid-minimize too: minimizeWindow() calls this
      // synchronously, before displayState flips to 'minimized' (that only
      // happens once the animation timeout fires), so without this the
      // window being minimized would just re-select itself as "topmost".
      const candidates = this.windows
        .filter((w) => w.displayState !== 'minimized' && w.animationState !== 'minimizing')
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
      const { vw, vh } = getViewport()
      for (const w of this.windows) {
        if (w.snapped) {
          // Re-apply the snap rect instead of clamping, so halves keep
          // tiling the new viewport exactly - clamping after the fact would
          // fight the snap rect and leave stale half-sizes.
          w.rect = getSnapRect(w.snapped, {
            vw,
            vh,
            pad: this.desktopPadding,
            menuBarHeight: this.menuBarHeight,
            minW: MIN_W,
            minH: MIN_H,
          })
        } else {
          this.ensureBounds(w)
        }
      }
      this.saveSession()
    },

    getViewportConstraints() {
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
        animationState: 'none',
      }
      this.windows.push(w)
      this.bringToFront(w.id)
      this.saveSession()
      return w.id
    },

    closeWindow(id: WindowId): void {
      const dragStore = useDragStore()
      if (dragStore.isInteractingWith(id)) {
        dragStore.endInteraction()
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

    // --- Dragging (delegates to drag store) ---
    startDrag(id: WindowId, clientX: number, clientY: number): void {
      const w = this.windows.find((w) => w.id === id)
      if (!w) return
      const dragStore = useDragStore()
      dragStore.startDrag(id, clientX, clientY, w.rect.x, w.rect.y)
      this.bringToFront(id)
    },

    dragTo(clientX: number, clientY: number): void {
      const dragStore = useDragStore()
      if (!dragStore.isDragging) return
      const w = this.windows.find((w) => w.id === dragStore.activeWindowId)
      if (!w) return

      // Unsnap under the cursor: any pointer movement during a drag of a
      // snapped window restores its pre-snap size, keeping the pointer's
      // proportional x-position in the title bar and its y-offset, then
      // rebases the drag origin so the normal move below doesn't jump the
      // window using stale start coordinates.
      if (w.snapped && w.preSnapRect) {
        const xFraction = w.rect.width > 0 ? (clientX - w.rect.x) / w.rect.width : 0.5
        const yOffset = clientY - w.rect.y
        const newWidth = w.preSnapRect.width
        const newHeight = w.preSnapRect.height
        const newX = clientX - xFraction * newWidth
        const newY = clientY - yOffset
        w.rect = { x: newX, y: newY, width: newWidth, height: newHeight }
        w.snapped = undefined
        w.preSnapRect = undefined
        dragStore.rebaseDragOrigin(clientX, clientY, newX, newY)
      }

      const pos = dragStore.calculateDragPosition(clientX, clientY)
      if (!pos) return
      w.rect.x = pos.x
      w.rect.y = pos.y
      this.ensureBounds(w)

      // Track the snap candidate under the pointer (resizable windows only -
      // snapping is a resize).
      const zone = w.resizable === false ? null : getSnapZone(clientX, clientY, getViewport().vw, SNAP_THRESHOLD)
      dragStore.setSnapCandidate(zone)
    },

    endDrag(): void {
      const dragStore = useDragStore()
      const windowId = dragStore.activeWindowId
      const candidate = dragStore.snapCandidate
      const w = windowId != null ? this.windows.find((w) => w.id === windowId) : undefined

      dragStore.endInteraction()

      if (w && candidate) {
        w.preSnapRect = { ...w.rect }
        w.snapped = candidate
        // A snap always lands the window in a normal, partial-screen state -
        // even if it was still 'maximized' (its header stays draggable while
        // maximized). Left uncleared, this would strand the window reporting
        // 'maximized' while snapped, and a later unmaximize would restore
        // lastNormalRect but skip clearing snapped/preSnapRect, leaving a
        // stale unsnap ready to balloon the window on the next drag.
        w.displayState = 'normal'
        w.animationState = 'snapping'

        const targetRect = getSnapRect(candidate, {
          vw: getViewport().vw,
          vh: getViewport().vh,
          pad: this.desktopPadding,
          menuBarHeight: this.menuBarHeight,
          minW: MIN_W,
          minH: MIN_H,
        })

        // Use requestAnimationFrame to ensure the 'snapping' transition class
        // is applied before the rect changes (mirrors toggleMaximize).
        requestAnimationFrame(() => {
          w.rect = targetRect
        })

        setTimeout(() => {
          const win = this.windows.find((win) => win.id === windowId)
          if (win && win.animationState === 'snapping') {
            win.animationState = 'none'
            this.saveSessionImmediate()
          }
        }, SNAP_ANIMATION_MS)
      }

      this.saveSession()
    },

    /**
     * Cancel the active drag/resize without applying a pending snap (used by
     * the ESC key path). Unlike endDrag(), a live snap candidate is dropped,
     * not applied - the window stays wherever dragTo() last left it.
     */
    cancelDrag(): void {
      const dragStore = useDragStore()
      dragStore.endInteraction()
      this.saveSession()
    },

    // --- Resizing (delegates to drag store) ---
    startResize(id: WindowId, edge: ResizeEdge | null, clientX: number, clientY: number): void {
      const w = this.windows.find((w) => w.id === id)
      if (!w || w.resizable === false || !edge) return
      // Manual geometry change ends snap; the rect itself is left as-is.
      w.snapped = undefined
      w.preSnapRect = undefined
      const dragStore = useDragStore()
      dragStore.startResize(id, edge, clientX, clientY, { ...w.rect })
      this.bringToFront(id)
    },

    resizeTo(clientX: number, clientY: number): void {
      const dragStore = useDragStore()
      if (!dragStore.isResizing) return
      const constraints = this.getViewportConstraints()
      const newRect = dragStore.calculateResizeGeometry(clientX, clientY, constraints)
      if (!newRect) return
      const w = this.windows.find((w) => w.id === dragStore.activeWindowId)
      if (!w) return
      w.rect = newRect
    },

    endResize(): void {
      this.endDrag()
    },

    // --- Maximize / Minimize ---
    toggleMaximize(id: WindowId): void {
      const w = this.windows.find((w) => w.id === id)
      if (!w) return

      // Respect the maximizable flag here, at the single chokepoint - not
      // just in the UI (button/dblclick guards in Window.vue) - so the
      // Window menu's Zoom command and its accelerator can't bypass it too.
      if (w.maximizable === false) return

      // Skip if already animating
      if (w.animationState === 'maximizing' || w.animationState === 'unmaximizing') return
      
      const { vw, vh } = getViewport()
      const pad = this.desktopPadding
      
      if (w.displayState !== 'maximized') {
        // Maximizing. If the window is snapped, seed lastNormalRect from its
        // true pre-snap geometry (not the snapped rect) so unmaximize
        // returns there, then clear the snap flags.
        w.lastNormalRect = w.snapped && w.preSnapRect ? { ...w.preSnapRect } : { ...w.rect }
        w.snapped = undefined
        w.preSnapRect = undefined
        w.animationState = 'maximizing'
        
        // Use requestAnimationFrame to ensure animation class is applied before rect changes
        requestAnimationFrame(() => {
          w.rect.x = pad
          w.rect.y = this.menuBarHeight
          w.rect.width = Math.floor(Math.max(MIN_W, vw - pad * 2))
          w.rect.height = Math.floor(Math.max(MIN_H, vh - this.menuBarHeight - pad))
          w.displayState = 'maximized'
        })
        
        setTimeout(() => {
          const win = this.windows.find((win) => win.id === id)
          if (win && win.animationState === 'maximizing') {
            win.animationState = 'none'
            this.saveSessionImmediate()
          }
        }, MAXIMIZE_ANIMATION_MS)
      } else {
        // Unmaximizing. Defensively clear snap fields too - normally already
        // undefined (the maximizing branch above clears them), but a window
        // dragged into a snap zone while still maximized could otherwise
        // leave them set, priming a stale unsnap on the next drag.
        w.snapped = undefined
        w.preSnapRect = undefined
        w.animationState = 'unmaximizing'

        requestAnimationFrame(() => {
          if (w.lastNormalRect) {
            w.rect = { ...w.lastNormalRect }
          }
          w.displayState = 'normal'
        })
        
        setTimeout(() => {
          const win = this.windows.find((win) => win.id === id)
          if (win && win.animationState === 'unmaximizing') {
            win.animationState = 'none'
            this.saveSessionImmediate()
          }
        }, MAXIMIZE_ANIMATION_MS)
      }
      
      this.bringToFront(id)
    },

    minimizeWindow(id: WindowId): void {
      const w = this.windows.find((w) => w.id === id)
      if (!w || w.animationState === 'minimizing') return

      // Respect the minimizable flag here, at the single chokepoint used by
      // the window control button, toggleMinimize(), the Window menu's
      // Minimize command, and its accelerator - so none of those paths can
      // orphan a window whose appId has no Dock entry (e.g. KeyStation's
      // Keyboard Layout Guide) by minimizing it with no way back.
      if (w.minimizable === false) return

      // Start minimize animation
      w.animationState = 'minimizing'
      if (this.focusedId === id) this.focusTopMost()
      
      // After animation completes, set final state
      setTimeout(() => {
        const win = this.windows.find((win) => win.id === id)
        if (win && win.animationState === 'minimizing') {
          win.displayState = 'minimized'
          win.animationState = 'none'
          this.saveSessionImmediate()
        }
      }, MINIMIZE_ANIMATION_MS)
    },

    restoreWindow(id: WindowId): void {
      const w = this.windows.find((w) => w.id === id)
      if (!w || w.animationState === 'restoring') return
      
      // Set display state immediately so window is visible, then animate
      w.displayState = 'normal'
      w.animationState = 'restoring'
      this.bringToFront(id)
      
      // After animation completes, clear animation state
      setTimeout(() => {
        const win = this.windows.find((win) => win.id === id)
        if (win && win.animationState === 'restoring') {
          win.animationState = 'none'
          this.saveSessionImmediate()
        }
      }, RESTORE_ANIMATION_MS)
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

    // --- Menu (delegates to menu store) ---
    openMenubar(index?: number): void {
      const menuStore = useMenuStore()
      menuStore.openMenubar(index)
    },

    openContext(x: number, y: number, template: MenuTemplate): void {
      const menuStore = useMenuStore()
      menuStore.openContext(x, y, template)
    },

    setActivePath(path: number[]): void {
      const menuStore = useMenuStore()
      menuStore.setActivePath(path)
    },

    closeMenu(): void {
      const menuStore = useMenuStore()
      menuStore.closeMenu()
    },

    // --- Wallpaper & Theme (delegates to session store) ---
    setWallpaper(wallpaper: { type: string; value: string } | null): void {
      const sessionStore = useSessionStore()
      sessionStore.setWallpaper(wallpaper)
      this.saveSessionImmediate()
    },

    setTheme(theme: string): void {
      const sessionStore = useSessionStore()
      sessionStore.setTheme(theme)
      this.saveSessionImmediate()
    },

    applyTheme(theme: string): void {
      const sessionStore = useSessionStore()
      sessionStore.applyTheme(theme)
    },

    initTheme(): void {
      const sessionStore = useSessionStore()
      if (sessionStore.theme) {
        sessionStore.applyTheme(sessionStore.theme)
      }
    },
  },
})
