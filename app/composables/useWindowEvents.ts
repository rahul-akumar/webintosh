import { onMounted, onUnmounted } from 'vue'
import { useOSStore } from '../stores/os'
import { useOverlayStore } from '../stores/overlay'
import { execute, registerDefaultCommands } from '../utils/menuCommands'
import { useKeyboardShortcuts } from './useKeyboardShortcuts'

/**
 * Extract clientX/clientY from touch event.
 */
function getTouchPosition(e: TouchEvent): { clientX: number; clientY: number } | null {
  const touch = e.touches[0] || e.changedTouches[0]
  if (!touch) return null
  return { clientX: touch.clientX, clientY: touch.clientY }
}

/**
 * Composable that sets up global event listeners for window management.
 * Handles mouse/touch drag/resize, keyboard shortcuts, and viewport resize.
 */
export function useWindowEvents() {
  const store = useOSStore()
  const overlay = useOverlayStore()
  const { isModifierPressed } = useKeyboardShortcuts()

  let resizeTimer: number | undefined

  // --- Mouse handlers ---

  function onMouseMove(e: MouseEvent) {
    store.resizeTo(e.clientX, e.clientY)
    store.dragTo(e.clientX, e.clientY)
  }

  function onMouseUp() {
    store.endDrag()
  }

  // --- Touch handlers ---

  function onTouchMove(e: TouchEvent) {
    const pos = getTouchPosition(e)
    if (!pos) return
    
    // Prevent scrolling while dragging/resizing
    if (store.drag.active) {
      e.preventDefault()
    }
    
    store.resizeTo(pos.clientX, pos.clientY)
    store.dragTo(pos.clientX, pos.clientY)
  }

  function onTouchEnd() {
    store.endDrag()
  }

  // --- Viewport resize handler (debounced) ---

  function onViewportResize() {
    if (resizeTimer) window.clearTimeout(resizeTimer)
    resizeTimer = window.setTimeout(() => {
      store.realignAllToBounds()
    }, 100)
  }

  // --- Window cycling ---

  function cycleWindowsForward() {
    const list = store.orderedWindows
    if (list.length === 0) return
    const focusedId = store.focusedId ?? null
    const idx = focusedId != null ? list.findIndex(w => w.id === focusedId) : -1
    const next = list[(idx + 1) % list.length]
    if (next) store.bringToFront(next.id)
  }

  // --- Keyboard handler ---

  function onKeyDown(e: KeyboardEvent) {
    // ESC: overlays first, then cancel drag/resize and close menus
    if (e.key === 'Escape') {
      if (overlay.activeOverlay !== null) {
        overlay.closeAll()
        e.preventDefault()
        return
      }
      store.cancelDrag()
      store.closeMenu()
      e.preventDefault()
      return
    }

    // Overlay hotkeys accept ANY of meta/ctrl/alt, deliberately looser than
    // isModifierPressed below: browsers/OSes reserve different combos per
    // platform (macOS swallows Cmd+Space/Cmd+Tab, Chrome reserves Ctrl+Tab,
    // Windows reserves Alt+Tab), so we take whichever modifier gets through
    // - e.g. Option+Tab is the only Tab combo a macOS browser delivers, and
    // isModifierPressed would reject it.
    const anyOverlayModifier = e.metaKey || e.ctrlKey || e.altKey
    if (anyOverlayModifier) {
      // Space matched via e.code: Option+Space produces U+00A0 in e.key.
      if (e.code === 'Space') {
        overlay.toggleLauncher()
        e.preventDefault()
        return
      }
      if (e.key === 'Tab') {
        if (overlay.isSwitcherOpen) {
          overlay.switcherNext(e.shiftKey ? -1 : 1)
        } else {
          overlay.switcherStart(e.shiftKey)
        }
        e.preventDefault()
        return
      }
    }

    // While an overlay is open it owns the keyboard; don't let plain typing
    // fall through to window shortcuts.
    if (overlay.activeOverlay !== null) return

    // Platform-aware modifier shortcuts
    const hasModifier = isModifierPressed(e) || e.metaKey || e.ctrlKey
    if (!hasModifier) return

    const k = e.key.toLowerCase()
    switch (k) {
      case 'n': {
        const appId = store.focused?.appId ?? null
        if (appId === 'textedit') {
          execute('app.newDocument', { appId })
        } else if (appId) {
          execute('app.newWindow', { appId })
        } else {
          execute('os.openWindow')
        }
        e.preventDefault()
        break
      }
      case 'w': {
        execute('os.closeFocused')
        e.preventDefault()
        break
      }
      case 'm': {
        execute('os.minimizeFocused')
        e.preventDefault()
        break
      }
      case 'z': {
        execute('view.toggleZoom')
        e.preventDefault()
        break
      }
      case '/': {
        execute('system.showShortcuts')
        e.preventDefault()
        break
      }
      case '`': {
        cycleWindowsForward()
        e.preventDefault()
        break
      }
      default:
        break
    }
  }

  // --- Switcher hold-modifier semantics ---

  // Releasing the initiating modifier commits the cmd+tab-style selection;
  // losing window focus (e.g. a real OS app switch) cancels it.
  function onKeyUp(e: KeyboardEvent) {
    if (!overlay.isSwitcherOpen) return
    if (e.key === 'Meta' || e.key === 'Control' || e.key === 'Alt') {
      overlay.switcherCommit()
    }
  }

  function onWindowBlur() {
    if (overlay.isSwitcherOpen) overlay.switcherCancel()
  }

  // --- Lifecycle ---

  onMounted(() => {
    registerDefaultCommands()
    // Mouse events
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    // Touch events (passive: false to allow preventDefault)
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd)
    window.addEventListener('touchcancel', onTouchEnd)
    // Keyboard
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onWindowBlur)
    // Viewport resize
    window.addEventListener('resize', onViewportResize)
  })

  onUnmounted(() => {
    // Mouse events
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
    // Touch events
    window.removeEventListener('touchmove', onTouchMove)
    window.removeEventListener('touchend', onTouchEnd)
    window.removeEventListener('touchcancel', onTouchEnd)
    // Keyboard
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
    window.removeEventListener('blur', onWindowBlur)
    // Viewport resize
    window.removeEventListener('resize', onViewportResize)
    if (resizeTimer) window.clearTimeout(resizeTimer)
  })

  return {
    cycleWindowsForward
  }
}
