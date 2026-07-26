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
const SNAP_ANIMATION_MS = 200
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

  it('realignAllToBounds re-snaps a snapped window to the new viewport\'s zone rect instead of merely clamping', () => {
    const os = useOSStore()
    const id = os.openWindow({ rect: { x: 300, y: 100, width: 400, height: 300 } })

    os.startDrag(id, 350, 120)
    os.dragTo(6, 130)
    os.endDrag()
    const snapped = os.windows.find((w) => w.id === id)!
    expect(snapped.snapped).toBe('left')
    expect(snapped.rect).toEqual({ x: 8, y: 40, width: 592, height: 752 }) // at the original 1200x800 viewport

    stubViewport(1000, 700)
    os.realignAllToBounds()

    const w = os.windows.find((w) => w.id === id)!
    // New work area: width 1000-16=984 -> left half floor(984/2)=492; height 700-40-8=652.
    // A plain clamp would have left the old 592-wide rect merely repositioned/clipped,
    // not re-tiled to exactly half of the new work width.
    expect(w.rect).toEqual({ x: 8, y: 40, width: 492, height: 652 })
    expect(w.snapped).toBe('left') // still snapped, just re-tiled
  })
})

describe('stores/os - edge snapping', () => {
  it('dragging to the left edge and releasing snaps the window and stashes preSnapRect', () => {
    const os = useOSStore()
    const id = os.openWindow({ rect: { x: 300, y: 100, width: 400, height: 300 } })

    os.startDrag(id, 350, 120)
    os.dragTo(6, 130)
    const midDrag = os.windows.find((w) => w.id === id)!
    expect(midDrag.rect).toEqual({ x: 8, y: 110, width: 400, height: 300 })

    os.endDrag()

    const w = os.windows.find((w) => w.id === id)!
    expect(w.snapped).toBe('left')
    expect(w.preSnapRect).toEqual({ x: 8, y: 110, width: 400, height: 300 })
    expect(w.rect).toEqual({ x: 8, y: 40, width: 592, height: 752 })
  })

  it('endDrag applying a snap transitions through a "snapping" animation state before settling to "none"', () => {
    const os = useOSStore()
    const id = os.openWindow({ rect: { x: 300, y: 100, width: 400, height: 300 } })

    os.startDrag(id, 350, 120)
    os.dragTo(6, 130)
    os.endDrag()

    // rAF is stubbed to run synchronously, so the rect already reflects the
    // snap target even though the animation state hasn't settled yet.
    let w = os.windows.find((w) => w.id === id)!
    expect(w.animationState).toBe('snapping')
    expect(w.rect).toEqual({ x: 8, y: 40, width: 592, height: 752 })

    vi.advanceTimersByTime(SNAP_ANIMATION_MS)
    w = os.windows.find((w) => w.id === id)!
    expect(w.animationState).toBe('none')
  })

  it('endDrag never snaps when the pointer never entered a snap zone', () => {
    const os = useOSStore()
    const id = os.openWindow({ rect: { x: 300, y: 100, width: 400, height: 300 } })

    os.startDrag(id, 350, 120)
    os.dragTo(400, 150) // mid-desktop, well clear of any edge
    os.endDrag()

    const w = os.windows.find((w) => w.id === id)!
    expect(w.snapped).toBeUndefined()
    expect(w.preSnapRect).toBeUndefined()
    expect(w.rect).toEqual({ x: 350, y: 130, width: 400, height: 300 })
  })

  it('cancelDrag (ESC) drops a pending snap candidate instead of applying it', () => {
    const os = useOSStore()
    const id = os.openWindow({ rect: { x: 300, y: 100, width: 400, height: 300 } })

    os.startDrag(id, 350, 120)
    os.dragTo(6, 130) // in the left snap zone - candidate would apply on endDrag
    const midDrag = os.windows.find((w) => w.id === id)!
    expect(midDrag.rect).toEqual({ x: 8, y: 110, width: 400, height: 300 })

    os.cancelDrag()

    const w = os.windows.find((w) => w.id === id)!
    expect(w.snapped).toBeUndefined()
    expect(w.preSnapRect).toBeUndefined()
    expect(w.rect).toEqual({ x: 8, y: 110, width: 400, height: 300 }) // left wherever dragTo put it
    expect(os.drag.active).toBe(false)
  })

  it('dragging a snapped window restores its exact pre-snap dimensions, keeps the pointer proportionally placed, and continues the drag', () => {
    const os = useOSStore()
    const id = os.openWindow({ rect: { x: 300, y: 100, width: 400, height: 300 } })

    // Snap left first.
    os.startDrag(id, 350, 120)
    os.dragTo(6, 130)
    os.endDrag()
    const snapped = os.windows.find((w) => w.id === id)!
    expect(snapped.rect).toEqual({ x: 8, y: 40, width: 592, height: 752 })

    // Grab exactly at the snapped window's horizontal midpoint (50% across
    // its 592px width) and move the pointer - x unchanged, y moves - which
    // is enough to trigger unsnap (no dead zone).
    const midX = snapped.rect.x + snapped.rect.width / 2 // 304
    os.startDrag(id, midX, 60)
    os.dragTo(midX, 200)

    const w = os.windows.find((w) => w.id === id)!
    expect(w.snapped).toBeUndefined()
    expect(w.preSnapRect).toBeUndefined()
    expect(w.rect.width).toBe(400) // pre-snap size restored exactly
    expect(w.rect.height).toBe(300)
    // Pointer was at the 50% mark, so the restored (400px) window is centered under it.
    expect(w.rect.x).toBe(midX - 400 / 2) // 104
    // Window top carries over unchanged from the snapped rect at unsnap time.
    expect(w.rect.y).toBe(40)

    // The drag continues normally from here (real deltas apply). `w` is a
    // live reference, so snapshot the pre-move values before mutating it.
    const beforeX = w.rect.x
    const beforeY = w.rect.y
    os.dragTo(midX + 50, 250)
    expect(w.rect.x).toBe(beforeX + 50)
    expect(w.rect.y).toBe(beforeY + 50)
  })

  it('startResize clears snap state but leaves the rect as-is', () => {
    const os = useOSStore()
    const id = os.openWindow({ rect: { x: 300, y: 100, width: 400, height: 300 } })

    os.startDrag(id, 350, 120)
    os.dragTo(6, 130)
    os.endDrag()
    const snapped = os.windows.find((w) => w.id === id)!
    expect(snapped.snapped).toBe('left')
    const rectAtSnap = { ...snapped.rect }

    os.startResize(id, 'se', snapped.rect.x, snapped.rect.y)

    const w = os.windows.find((w) => w.id === id)!
    expect(w.snapped).toBeUndefined()
    expect(w.preSnapRect).toBeUndefined()
    expect(w.rect).toEqual(rectAtSnap) // geometry untouched by clearing snap state
  })

  it('maximizing a snapped window then unmaximizing returns the true pre-snap rect (not the snapped rect)', () => {
    const os = useOSStore()
    const id = os.openWindow({ rect: { x: 300, y: 100, width: 400, height: 300 } })

    os.startDrag(id, 350, 120)
    os.dragTo(6, 130)
    os.endDrag()
    const snapped = os.windows.find((w) => w.id === id)!
    expect(snapped.snapped).toBe('left')
    const preSnap = { ...snapped.preSnapRect! }
    expect(preSnap).toEqual({ x: 8, y: 110, width: 400, height: 300 })

    os.toggleMaximize(id)
    vi.advanceTimersByTime(MAXIMIZE_ANIMATION_MS)
    const maximized = os.windows.find((w) => w.id === id)!
    expect(maximized.displayState).toBe('maximized')
    expect(maximized.snapped).toBeUndefined()
    expect(maximized.preSnapRect).toBeUndefined()
    expect(maximized.lastNormalRect).toEqual(preSnap) // seeded from preSnapRect, not the snapped rect

    os.toggleMaximize(id)
    vi.advanceTimersByTime(MAXIMIZE_ANIMATION_MS)
    const restored = os.windows.find((w) => w.id === id)!
    expect(restored.displayState).toBe('normal')
    expect(restored.rect).toEqual(preSnap)
  })

  it('dragging a maximized window into a snap zone normalizes displayState to normal (not left dangling as maximized)', () => {
    const os = useOSStore()
    const id = os.openWindow({ rect: { x: 300, y: 100, width: 400, height: 300 } })

    os.toggleMaximize(id)
    vi.advanceTimersByTime(MAXIMIZE_ANIMATION_MS)
    const maximized = os.windows.find((w) => w.id === id)!
    expect(maximized.displayState).toBe('maximized')

    // The maximized window's header is still draggable - drag it into the
    // left snap zone and release.
    os.startDrag(id, maximized.rect.x + 50, maximized.rect.y + 10)
    os.dragTo(6, maximized.rect.y + 10)
    os.endDrag()

    const w = os.windows.find((w) => w.id === id)!
    expect(w.snapped).toBe('left')
    expect(w.displayState).toBe('normal') // no longer stuck reporting 'maximized'
  })

  it('unmaximizing a window whose snap fields are (defensively) still set clears them, so a later nudge does not balloon it', () => {
    const os = useOSStore()
    const id = os.openWindow({ rect: { x: 300, y: 100, width: 400, height: 300 } })
    os.toggleMaximize(id)
    vi.advanceTimersByTime(MAXIMIZE_ANIMATION_MS)

    // Simulate the corrupted state a pre-fix endDrag could leave behind:
    // displayState 'maximized' with stale snap fields dangling from a drag
    // that happened while still maximized.
    const w = os.windows.find((w) => w.id === id)!
    w.snapped = 'left'
    w.preSnapRect = { x: 8, y: 40, width: 1264, height: 672 }

    os.toggleMaximize(id) // unmaximize
    vi.advanceTimersByTime(MAXIMIZE_ANIMATION_MS)

    const restored = os.windows.find((w) => w.id === id)!
    expect(restored.displayState).toBe('normal')
    expect(restored.snapped).toBeUndefined()
    expect(restored.preSnapRect).toBeUndefined()
    expect(restored.rect).toEqual({ x: 300, y: 100, width: 400, height: 300 }) // true lastNormalRect

    // A small nudge afterward must not balloon the window via a stale unsnap.
    os.startDrag(id, restored.rect.x + 50, restored.rect.y + 10)
    os.dragTo(restored.rect.x + 60, restored.rect.y + 10) // tiny 10px move
    const nudged = os.windows.find((w) => w.id === id)!
    expect(nudged.rect.width).toBe(restored.rect.width)
    expect(nudged.rect.height).toBe(restored.rect.height)
  })

  it('a non-resizable window never snaps (snapping is a resize)', () => {
    const os = useOSStore()
    const id = os.openWindow({ resizable: false, rect: { x: 300, y: 100, width: 400, height: 300 } })

    os.startDrag(id, 350, 120)
    os.dragTo(6, 130) // pointer sits in the left snap zone throughout
    const beforeEndDrag = { ...os.windows.find((w) => w.id === id)!.rect }
    os.endDrag()

    const w = os.windows.find((w) => w.id === id)!
    expect(w.snapped).toBeUndefined()
    expect(w.preSnapRect).toBeUndefined()
    expect(w.rect).toEqual(beforeEndDrag) // endDrag left the rect exactly as dragTo did
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

  it('session snapshot roundtrips snapped/preSnapRect', () => {
    const os1 = useOSStore()
    const id = os1.openWindow({ rect: { x: 300, y: 100, width: 400, height: 300 } })
    os1.startDrag(id, 350, 120)
    os1.dragTo(6, 130)
    os1.endDrag()
    const snapped = os1.windows.find((w) => w.id === id)!
    expect(snapped.snapped).toBe('left')
    const preSnapRect = { ...snapped.preSnapRect! }
    os1.saveSessionImmediate()

    setActivePinia(createPinia())
    const os2 = useOSStore()
    os2.loadSession()

    const w = os2.windows.find((w) => w.id === id)!
    expect(w.snapped).toBe('left')
    expect(w.preSnapRect).toEqual(preSnapRect)
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
