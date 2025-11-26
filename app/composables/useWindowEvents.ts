import { onMounted, onUnmounted } from 'vue'
import { useOSStore } from '../stores/os'
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
    // ESC: cancel drag/resize and close menus
    if (e.key === 'Escape') {
      store.endDrag()
      store.closeMenu()
      e.preventDefault()
      return
    }

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
    // Viewport resize
    window.removeEventListener('resize', onViewportResize)
    if (resizeTimer) window.clearTimeout(resizeTimer)
  })

  return {
    cycleWindowsForward
  }
}
