import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useOSStore } from '../../../app/stores/os'
import { STORAGE_KEYS } from '../../../app/constants/storage-keys'

// Mirrors the private constants in app/stores/os.ts
const MIN_W = 240
const MIN_H = 160
const MINIMIZE_ANIMATION_MS = 300
const RESTORE_ANIMATION_MS = 300
const MAXIMIZE_ANIMATION_MS = 250
const SAVE_DEBOUNCE_MS = 500

function stubViewport(vw: number, vh: number) {
  Object.defineProperty(document.documentElement, 'clientWidth', { value: vw, configurable: true })
  Object.defineProperty(document.documentElement, 'clientHeight', { value: vh, configurable: true })
}

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
  vi.useFakeTimers()
  // requestAnimationFrame isn't consistently faked across environments/versions -
  // stub it to run synchronously so maximize/unmaximize assertions are deterministic.
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback): number => {
    cb(0)
    return 0
  })
  stubViewport(1200, 800)
})

afterEach(() => {
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  localStorage.clear()
})

describe('stores/os - window CRUD', () => {
  it('openWindow assigns an incrementing id, a zIndex, and focuses the new window', () => {
    const os = useOSStore()
    const id1 = os.openWindow({ title: 'A' })
    const id2 = os.openWindow({ title: 'B' })

    expect(id2).toBeGreaterThan(id1)
    expect(os.windows).toHaveLength(2)
    expect(os.focusedId).toBe(id2)
    expect(os.windows.find((w) => w.id === id2)!.zIndex).toBeGreaterThan(
      os.windows.find((w) => w.id === id1)!.zIndex
    )
  })

  it('openWindow defaults kind/title and marks the window "normal"', () => {
    const os = useOSStore()
    const id = os.openWindow()
    const w = os.windows.find((w) => w.id === id)!
    expect(w.kind).toBe('blank')
    expect(w.title).toBe(`Window ${id}`)
    expect(w.displayState).toBe('normal')
  })

  it('closeWindow removes the window and refocuses the topmost remaining one', () => {
    const os = useOSStore()
    const id1 = os.openWindow({ title: 'A' })
    const id2 = os.openWindow({ title: 'B' })
    expect(os.focusedId).toBe(id2)

    os.closeWindow(id2)
    expect(os.windows.map((w) => w.id)).toEqual([id1])
    expect(os.focusedId).toBe(id1)
  })

  it('closeWindow leaves focus alone when closing a non-focused window', () => {
    const os = useOSStore()
    const id1 = os.openWindow({ title: 'A' })
    const id2 = os.openWindow({ title: 'B' })
    os.closeWindow(id1)
    expect(os.focusedId).toBe(id2)
  })
})

describe('stores/os - focus and z-order', () => {
  it('bringToFront raises a window above all others and focuses it', () => {
    const os = useOSStore()
    const id1 = os.openWindow()
    os.openWindow()
    os.openWindow()

    os.bringToFront(id1)
    expect(os.focusedId).toBe(id1)
    const ordered = os.orderedWindows
    expect(ordered[ordered.length - 1]!.id).toBe(id1)
  })

  it('orderedWindows is sorted by ascending zIndex (monotonic with bring-to-front order)', () => {
    const os = useOSStore()
    const ids = [os.openWindow(), os.openWindow(), os.openWindow()]
    os.bringToFront(ids[0]!)
    os.bringToFront(ids[1]!)

    const zs = os.orderedWindows.map((w) => w.zIndex)
    expect(zs).toEqual([...zs].sort((a, b) => a - b))
    expect(os.orderedWindows.map((w) => w.id)).toEqual([ids[2], ids[0], ids[1]])
  })

  it('orderedWindows excludes minimized windows (once animation settles)', () => {
    const os = useOSStore()
    const id = os.openWindow()
    os.minimizeWindow(id)
    vi.advanceTimersByTime(MINIMIZE_ANIMATION_MS)
    expect(os.orderedWindows.find((w) => w.id === id)).toBeUndefined()
  })

  it('normalizeZOrder compacts z-indices back to a low base while preserving order', () => {
    const os = useOSStore()
    const ids = [os.openWindow(), os.openWindow()]
    os.nextZ = 10001 // force the normalize path
    os.bringToFront(ids[0]!)

    expect(os.nextZ).toBeLessThan(200)
    const zs = os.windows.map((w) => w.zIndex)
    expect(new Set(zs).size).toBe(zs.length) // still unique
  })
})

describe('stores/os - minimize / restore / maximize', () => {
  it('minimizeWindow transitions through an animating state before settling as minimized', () => {
    const os = useOSStore()
    const id = os.openWindow()
    os.minimizeWindow(id)

    let w = os.windows.find((w) => w.id === id)!
    expect(w.animationState).toBe('minimizing')
    expect(w.displayState).toBe('normal') // not yet minimized mid-animation

    vi.advanceTimersByTime(MINIMIZE_ANIMATION_MS)
    w = os.windows.find((w) => w.id === id)!
    expect(w.displayState).toBe('minimized')
    expect(w.animationState).toBe('none')
  })

  it('minimizing the focused window clears focus to the next topmost', () => {
    const os = useOSStore()
    const id1 = os.openWindow()
    const id2 = os.openWindow()
    expect(os.focusedId).toBe(id2)

    os.minimizeWindow(id2)
    expect(os.focusedId).toBe(id1)
  })

  it('restoreWindow sets displayState immediately then clears animation after the delay', () => {
    const os = useOSStore()
    const id = os.openWindow()
    os.minimizeWindow(id)
    vi.advanceTimersByTime(MINIMIZE_ANIMATION_MS)

    os.restoreWindow(id)
    let w = os.windows.find((w) => w.id === id)!
    expect(w.displayState).toBe('normal')
    expect(w.animationState).toBe('restoring')

    vi.advanceTimersByTime(RESTORE_ANIMATION_MS)
    w = os.windows.find((w) => w.id === id)!
    expect(w.animationState).toBe('none')
  })

  it('toggleMinimize flips between minimize and restore depending on current state', () => {
    const os = useOSStore()
    const id = os.openWindow()

    os.toggleMinimize(id)
    vi.advanceTimersByTime(MINIMIZE_ANIMATION_MS)
    expect(os.windows.find((w) => w.id === id)!.displayState).toBe('minimized')

    os.toggleMinimize(id)
    vi.advanceTimersByTime(RESTORE_ANIMATION_MS)
    expect(os.windows.find((w) => w.id === id)!.displayState).toBe('normal')
  })

  it('minimizeWindow no-ops when the window is not minimizable (chokepoint for button, toggleMinimize, and the Window menu command)', () => {
    const os = useOSStore()
    const id = os.openWindow({ minimizable: false })

    os.minimizeWindow(id)
    vi.advanceTimersByTime(MINIMIZE_ANIMATION_MS)
    let w = os.windows.find((w) => w.id === id)!
    expect(w.displayState).toBe('normal')
    expect(w.animationState).toBe('none')

    // toggleMinimize() delegates to minimizeWindow() - same guard applies
    os.toggleMinimize(id)
    vi.advanceTimersByTime(MINIMIZE_ANIMATION_MS)
    w = os.windows.find((w) => w.id === id)!
    expect(w.displayState).toBe('normal')
  })

  it('toggleMaximize maximizes to fill the viewport and remembers the prior rect', () => {
    const os = useOSStore()
    const id = os.openWindow({ rect: { x: 50, y: 60, width: 300, height: 200 } })

    os.toggleMaximize(id)
    vi.advanceTimersByTime(MAXIMIZE_ANIMATION_MS)

    const w = os.windows.find((w) => w.id === id)!
    expect(w.displayState).toBe('maximized')
    expect(w.animationState).toBe('none')
    expect(w.lastNormalRect).toEqual({ x: 50, y: 60, width: 300, height: 200 })
    expect(w.rect.width).toBe(1200 - os.desktopPadding * 2)
  })

  it('toggleMaximize again restores the pre-maximize rect', () => {
    const os = useOSStore()
    const id = os.openWindow({ rect: { x: 50, y: 60, width: 300, height: 200 } })
    os.toggleMaximize(id)
    vi.advanceTimersByTime(MAXIMIZE_ANIMATION_MS)

    os.toggleMaximize(id)
    vi.advanceTimersByTime(MAXIMIZE_ANIMATION_MS)

    const w = os.windows.find((w) => w.id === id)!
    expect(w.displayState).toBe('normal')
    expect(w.rect).toEqual({ x: 50, y: 60, width: 300, height: 200 })
  })

  it('toggleMaximize is a no-op while already animating', () => {
    const os = useOSStore()
    const id = os.openWindow()
    os.toggleMaximize(id)
    // Mid-animation (rAF already ran synchronously, but the settle timeout hasn't fired)
    const w = os.windows.find((w) => w.id === id)!
    const stateBefore = w.animationState
    os.toggleMaximize(id) // should be ignored
    expect(w.animationState).toBe(stateBefore)
  })

  it('toggleMaximize no-ops when the window is not maximizable (chokepoint for the button, dblclick, and the Window menu Zoom command)', () => {
    const os = useOSStore()
    const id = os.openWindow({
      maximizable: false,
      rect: { x: 50, y: 60, width: 300, height: 200 },
    })

    os.toggleMaximize(id)
    vi.advanceTimersByTime(MAXIMIZE_ANIMATION_MS)

    const w = os.windows.find((w) => w.id === id)!
    expect(w.displayState).toBe('normal')
    expect(w.animationState).toBe('none')
    expect(w.rect).toEqual({ x: 50, y: 60, width: 300, height: 200 })
  })
})

describe('stores/os - bounds clamping', () => {
  it('ensureBounds (via setWindowRect) clamps size to MIN_W/MIN_H', () => {
    const os = useOSStore()
    const id = os.openWindow()
    os.setWindowRect(id, { width: 10, height: 5 })

    const w = os.windows.find((w) => w.id === id)!
    expect(w.rect.width).toBe(MIN_W)
    expect(w.rect.height).toBe(MIN_H)
  })

  it('ensureBounds clamps position so the window stays within the viewport', () => {
    const os = useOSStore()
    const id = os.openWindow({ rect: { x: 5000, y: 5000, width: 300, height: 200 } })
    os.realignAllToBounds()

    const w = os.windows.find((w) => w.id === id)!
    expect(w.rect.x).toBeLessThanOrEqual(1200 - 300 - os.desktopPadding)
    expect(w.rect.y).toBeLessThanOrEqual(800 - 200 - os.desktopPadding)
    expect(w.rect.x).toBeGreaterThanOrEqual(os.desktopPadding)
    expect(w.rect.y).toBeGreaterThanOrEqual(os.menuBarHeight)
  })

  it('ensureBounds never produces a negative-sized window when the viewport is tiny', () => {
    const os = useOSStore()
    stubViewport(100, 100)
    const id = os.openWindow({ rect: { x: 0, y: 0, width: 300, height: 200 } })
    os.realignAllToBounds()

    const w = os.windows.find((w) => w.id === id)!
    expect(w.rect.width).toBeGreaterThanOrEqual(MIN_W)
    expect(w.rect.height).toBeGreaterThanOrEqual(MIN_H)
  })
})

describe('stores/os - session persistence', () => {
  it('saveSessionImmediate writes windows and session snapshot to localStorage', () => {
    const os = useOSStore()
    os.openWindow({ title: 'A', appId: 'keystation', rect: { x: 1, y: 2, width: 300, height: 200 } })
    os.saveSessionImmediate()

    const raw = localStorage.getItem(STORAGE_KEYS.SESSION)
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw!)
    expect(parsed.windows).toHaveLength(1)
    expect(parsed.windows[0].appId).toBe('keystation')
    expect(parsed.nextWindowId).toBe(os.nextWindowId)
    expect(parsed).toHaveProperty('theme')
  })

  it('loadSession round-trips windows saved by a previous store instance', () => {
    const os1 = useOSStore()
    const id = os1.openWindow({ title: 'A', appId: 'keystation' })
    os1.saveSessionImmediate()

    setActivePinia(createPinia())
    const os2 = useOSStore()
    os2.loadSession()

    expect(os2.windows).toHaveLength(1)
    expect(os2.windows[0]!.id).toBe(id)
    expect(os2.windows[0]!.appId).toBe('keystation')
  })

  it('loadSession migrates legacy minimized/maximized booleans to displayState', () => {
    localStorage.setItem(
      STORAGE_KEYS.SESSION,
      JSON.stringify({
        windows: [
          { id: 1, title: 'Old', kind: 'app', rect: { x: 0, y: 40, width: 300, height: 200 }, zIndex: 100, minimized: true },
        ],
        nextWindowId: 2,
        nextZ: 101,
      })
    )
    const os = useOSStore()
    os.loadSession()
    expect(os.windows[0]!.displayState).toBe('minimized')
  })

  it('loadSession tolerates corrupt JSON without throwing', () => {
    localStorage.setItem(STORAGE_KEYS.SESSION, '{not valid json')
    const os = useOSStore()
    expect(() => os.loadSession()).not.toThrow()
    expect(os.windows).toEqual([])
  })

  it('loadSession with no prior session initializes session-store defaults', () => {
    const os = useOSStore()
    os.loadSession()
    expect(os.wallpaper).not.toBeNull()
  })

  it('saveSession debounces writes and coalesces rapid calls', () => {
    const os = useOSStore()
    os.openWindow({ title: 'A' })
    os.saveSession()
    os.saveSession()
    os.saveSession()

    expect(localStorage.getItem(STORAGE_KEYS.SESSION)).toBeNull()
    vi.advanceTimersByTime(SAVE_DEBOUNCE_MS)
    expect(localStorage.getItem(STORAGE_KEYS.SESSION)).not.toBeNull()
  })

  it('debounced save is isolated per store instance (no shared module-level timer)', () => {
    const piniaA = createPinia()
    const piniaB = createPinia()
    const osA = useOSStore(piniaA)
    const osB = useOSStore(piniaB)

    osA.openWindow({ title: 'A' })
    osB.openWindow({ title: 'B' })

    osA.saveSession()
    vi.advanceTimersByTime(SAVE_DEBOUNCE_MS)

    // A's debounced save fired; B never called saveSession, so nothing to flush for it.
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION)
    expect(raw).not.toBeNull()
    expect(JSON.parse(raw!).windows[0].title).toBe('A')

    localStorage.clear()
    osB.saveSession()
    vi.advanceTimersByTime(SAVE_DEBOUNCE_MS)
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSION)!).windows[0].title).toBe('B')
  })

  describe('unknown-appId filtering (stale session ghost-window guard)', () => {
    it('drops restored windows whose appId no longer resolves to a registered app component', () => {
      localStorage.setItem(
        STORAGE_KEYS.SESSION,
        JSON.stringify({
          windows: [
            { id: 1, title: 'Keeper', kind: 'app', rect: { x: 0, y: 40, width: 300, height: 200 }, zIndex: 100, appId: 'keystation', displayState: 'normal' },
            { id: 2, title: 'Ghost', kind: 'app', rect: { x: 0, y: 40, width: 300, height: 200 }, zIndex: 101, appId: 'chess', displayState: 'normal' },
          ],
          nextWindowId: 3,
          nextZ: 102,
        })
      )
      // Deliberately do NOT populate the apps store - the filter must check
      // the static appRegistry/hasAppComponent from config/apps.ts, not the
      // (still-empty) apps store, since loadSession() runs before
      // registerApps() during real app boot.
      const os = useOSStore()
      os.loadSession()

      expect(os.windows.map((w) => w.id)).toEqual([1])
      expect(os.windows.find((w) => w.appId === 'chess')).toBeUndefined()
    })

    it('keeps blank/appId-less windows (e.g. os.openTestWindow) untouched', () => {
      localStorage.setItem(
        STORAGE_KEYS.SESSION,
        JSON.stringify({
          windows: [
            { id: 1, title: 'Blank', kind: 'blank', rect: { x: 0, y: 40, width: 300, height: 200 }, zIndex: 100 },
          ],
          nextWindowId: 2,
          nextZ: 101,
        })
      )
      const os = useOSStore()
      os.loadSession()
      expect(os.windows).toHaveLength(1)
    })
  })
})
