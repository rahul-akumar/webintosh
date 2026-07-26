import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useOverlayStore } from '../../../app/stores/overlay'
import { useOSStore } from '../../../app/stores/os'
import { useMenuStore } from '../../../app/stores/menu'

function stubViewport(vw: number, vh: number) {
  Object.defineProperty(document.documentElement, 'clientWidth', { value: vw, configurable: true })
  Object.defineProperty(document.documentElement, 'clientHeight', { value: vh, configurable: true })
}

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
  vi.useFakeTimers()
  stubViewport(1200, 800)
})

afterEach(() => {
  vi.clearAllTimers()
  vi.useRealTimers()
  localStorage.clear()
})

/** Open a window for an app and return its id. Later calls sit higher in z. */
function openAppWindow(appId: string): number {
  const os = useOSStore()
  return os.openWindow({ appId, title: appId })
}

describe('stores/overlay - launcher', () => {
  it('starts with no overlay active', () => {
    const overlay = useOverlayStore()
    expect(overlay.activeOverlay).toBeNull()
    expect(overlay.isLauncherOpen).toBe(false)
    expect(overlay.isSwitcherOpen).toBe(false)
  })

  it('toggleLauncher opens and closes', () => {
    const overlay = useOverlayStore()
    overlay.toggleLauncher()
    expect(overlay.isLauncherOpen).toBe(true)
    overlay.toggleLauncher()
    expect(overlay.activeOverlay).toBeNull()
  })

  it('opening the launcher closes any open menu', () => {
    const overlay = useOverlayStore()
    const menu = useMenuStore()
    menu.openMenubar(1)
    overlay.openLauncher()
    expect(menu.isMenuOpen).toBe(false)
    expect(overlay.isLauncherOpen).toBe(true)
  })

  it('closeLauncher does not close a different overlay', () => {
    const overlay = useOverlayStore()
    openAppWindow('textedit')
    overlay.switcherStart()
    overlay.closeLauncher()
    expect(overlay.isSwitcherOpen).toBe(true)
  })
})

describe('stores/overlay - switcher lifecycle', () => {
  it('switcherStart is a no-op with no app windows', () => {
    const overlay = useOverlayStore()
    overlay.switcherStart()
    expect(overlay.activeOverlay).toBeNull()
    expect(overlay.switcherCandidates).toEqual([])
  })

  it('ignores windows without an appId', () => {
    const os = useOSStore()
    const overlay = useOverlayStore()
    os.openWindow({ title: 'Blank' }) // no appId
    overlay.switcherStart()
    expect(overlay.activeOverlay).toBeNull()
  })

  it('orders distinct apps by topmost window z, most recent first, and preselects the second', () => {
    const overlay = useOverlayStore()
    openAppWindow('textedit')
    openAppWindow('settings')
    openAppWindow('keystation') // topmost
    overlay.switcherStart()

    expect(overlay.isSwitcherOpen).toBe(true)
    expect(overlay.switcherCandidates).toEqual(['keystation', 'settings', 'textedit'])
    expect(overlay.switcherIndex).toBe(1)
    expect(overlay.switcherSelected).toBe('settings')
  })

  it('dedupes multiple windows of one app by its topmost window', () => {
    const os = useOSStore()
    const overlay = useOverlayStore()
    const first = openAppWindow('textedit')
    openAppWindow('settings')
    os.bringToFront(first) // textedit tops again
    overlay.switcherStart()
    expect(overlay.switcherCandidates).toEqual(['textedit', 'settings'])
  })

  it('includes minimized windows (real cmd+tab includes hidden apps)', () => {
    const os = useOSStore()
    const overlay = useOverlayStore()
    const id = openAppWindow('textedit')
    openAppWindow('settings')
    os.minimizeWindow(id)
    vi.advanceTimersByTime(1000) // let the minimize animation settle
    overlay.switcherStart()
    expect(overlay.switcherCandidates).toContain('textedit')
  })

  it('preselects the sole app when only one candidate exists', () => {
    const overlay = useOverlayStore()
    openAppWindow('textedit')
    overlay.switcherStart()
    expect(overlay.switcherIndex).toBe(0)
    expect(overlay.switcherSelected).toBe('textedit')
  })

  it('reverse start preselects the last candidate (shift+tab entry)', () => {
    const overlay = useOverlayStore()
    openAppWindow('textedit')
    openAppWindow('settings')
    openAppWindow('keystation')
    overlay.switcherStart(true)
    expect(overlay.switcherSelected).toBe('textedit')
  })

  it('closes an open menu when starting', () => {
    const overlay = useOverlayStore()
    const menu = useMenuStore()
    openAppWindow('textedit')
    menu.openMenubar(0)
    overlay.switcherStart()
    expect(menu.isMenuOpen).toBe(false)
  })

  it('starting the switcher replaces an open launcher (single-overlay invariant)', () => {
    const overlay = useOverlayStore()
    openAppWindow('textedit')
    overlay.openLauncher()
    overlay.switcherStart()
    expect(overlay.activeOverlay).toBe('switcher')
    overlay.openLauncher()
    expect(overlay.activeOverlay).toBe('launcher')
    expect(overlay.switcherCandidates).toEqual([])
  })
})

describe('stores/overlay - switcher cycling and commit', () => {
  it('switcherNext wraps forward and backward', () => {
    const overlay = useOverlayStore()
    openAppWindow('textedit')
    openAppWindow('settings')
    overlay.switcherStart() // candidates: [settings, textedit], index 1
    overlay.switcherNext(1)
    expect(overlay.switcherIndex).toBe(0)
    overlay.switcherNext(-1)
    expect(overlay.switcherIndex).toBe(1)
    overlay.switcherNext(1)
    overlay.switcherNext(1)
    expect(overlay.switcherIndex).toBe(1) // wrapped fully around
  })

  it('switcherNext is a no-op when the switcher is not active', () => {
    const overlay = useOverlayStore()
    overlay.switcherNext(1)
    expect(overlay.switcherIndex).toBe(0)
  })

  it('switcherCommit focuses the selected app topmost window and closes', () => {
    const os = useOSStore()
    const overlay = useOverlayStore()
    const teId = openAppWindow('textedit')
    openAppWindow('settings') // topmost; focused
    overlay.switcherStart() // preselects textedit (index 1)
    overlay.switcherCommit()

    expect(overlay.activeOverlay).toBeNull()
    expect(overlay.switcherCandidates).toEqual([])
    expect(os.focusedId).toBe(teId)
  })

  it('switcherCommit restores a minimized window', () => {
    const os = useOSStore()
    const overlay = useOverlayStore()
    const teId = openAppWindow('textedit')
    openAppWindow('settings')
    os.minimizeWindow(teId)
    vi.advanceTimersByTime(1000)
    expect(os.windows.find((w) => w.id === teId)?.displayState).toBe('minimized')

    overlay.switcherStart()
    overlay.switcherCommit() // preselected textedit
    vi.advanceTimersByTime(1000) // restore animation
    expect(os.windows.find((w) => w.id === teId)?.displayState).toBe('normal')
    expect(os.focusedId).toBe(teId)
  })

  it('switcherCommit honors an explicit index override (click-to-commit)', () => {
    const os = useOSStore()
    const overlay = useOverlayStore()
    openAppWindow('textedit')
    const stId = openAppWindow('settings')
    openAppWindow('keystation')
    overlay.switcherStart() // [keystation, settings, textedit]
    overlay.switcherCommit(1)
    expect(os.focusedId).toBe(stId)
  })

  it('switcherCancel closes without changing focus', () => {
    const os = useOSStore()
    const overlay = useOverlayStore()
    openAppWindow('textedit')
    const stId = openAppWindow('settings')
    overlay.switcherStart()
    overlay.switcherCancel()
    expect(overlay.activeOverlay).toBeNull()
    expect(os.focusedId).toBe(stId)
  })

  it('commit/cancel are no-ops when the switcher is not active', () => {
    const os = useOSStore()
    const overlay = useOverlayStore()
    const teId = openAppWindow('textedit')
    overlay.switcherCommit()
    overlay.switcherCancel()
    expect(os.focusedId).toBe(teId)
    expect(overlay.activeOverlay).toBeNull()
  })

  it('closeAll clears any overlay and switcher state', () => {
    const overlay = useOverlayStore()
    openAppWindow('textedit')
    openAppWindow('settings')
    overlay.switcherStart()
    overlay.closeAll()
    expect(overlay.activeOverlay).toBeNull()
    expect(overlay.switcherCandidates).toEqual([])
    expect(overlay.switcherIndex).toBe(0)
  })
})
