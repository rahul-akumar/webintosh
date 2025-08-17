<template>
  <div class="wm-root">
    <div class="debug">Windows: {{ store.windows.length }}</div>

    <!-- Windows -->
    <OsWindow
      v-for="w in store.orderedWindows"
      :key="w.id"
      :win="w"
    />

  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useOSStore } from '../../../stores/os'
import OsWindow from './Window.vue'
import { execute, registerDefaultCommands } from '../../composables/menuCommands'

defineOptions({ name: 'OsWindowManager' })

const store = useOSStore()

function onMove(e: MouseEvent) {
  // Support both dragging and resizing depending on store.drag.resizing
  store.resizeTo(e.clientX, e.clientY)
  store.dragTo(e.clientX, e.clientY)
}
function onUp() {
  store.endDrag()
}

let resizeTimer: number | undefined
function onResize() {
  if (resizeTimer) window.clearTimeout(resizeTimer)
  resizeTimer = window.setTimeout(() => {
    store.realignAllToBounds()
  }, 100)
}

function cycleWindowsForward() {
  const list = store.orderedWindows
  if (list.length === 0) return
  const focusedId = store.focusedId ?? null
  const idx = focusedId != null ? list.findIndex(w => w.id === focusedId) : -1
  const next = list[(idx + 1) % list.length]
  if (next) store.bringToFront(next.id)
}

function onKeyDown(e: KeyboardEvent) {
  // ESC: cancel drag/resize and close menus
  if (e.key === 'Escape') {
    store.endDrag()
    store.closeMenu()
    e.preventDefault()
    return
  }

  // Alt-based accelerators (avoid browser conflicts)
  if (e.altKey && !e.metaKey && !e.ctrlKey) {
    const k = e.key.toLowerCase()
    switch (k) {
      case 'n': {
        // New/Open window behavior:
        // - If TextEdit focused: New Document
        // - If any app focused: New Window for that app
        // - Else (desktop): OS Open Window
        const appId = store.focused?.appId ?? null
        if (appId === 'textedit') {
          execute('app.newDocument', { appId })
        } else if (appId) {
          execute('app.newWindow', { appId })
        } else {
          execute('os.openWindow')
        }
        e.preventDefault()
        return
      }
      case 'w': {
        execute('os.closeFocused')
        e.preventDefault()
        return
      }
      case 'm': {
        execute('os.minimizeFocused')
        e.preventDefault()
        return
      }
      case 'z': {
        execute('view.toggleZoom')
        e.preventDefault()
        return
      }
      case '/': {
        execute('system.showShortcuts')
        e.preventDefault()
        return
      }
      case '`': {
        // Cycle windows forward using existing helper
        cycleWindowsForward()
        e.preventDefault()
        return
      }
      default:
        break
    }
  }

  // Cmd/Ctrl combos (existing behavior)
  const mod = e.metaKey || e.ctrlKey
  if (!mod) return

  switch (e.key.toLowerCase()) {
    case 'm': { // minimize
      const f = store.focused
      if (f) store.toggleMinimize(f.id)
      e.preventDefault()
      break
    }
    case 'w': { // close
      const f = store.focused
      if (f) store.closeWindow(f.id)
      e.preventDefault()
      break
    }
    case '`': { // cycle
      cycleWindowsForward()
      e.preventDefault()
      break
    }
    default:
      break
  }
}

onMounted(() => {
  // Ensure command registry is initialized (idempotent; safe across HMR)
  registerDefaultCommands()
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('resize', onResize)
})
onUnmounted(() => {
  window.removeEventListener('mousemove', onMove)
  window.removeEventListener('mouseup', onUp)
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('resize', onResize)
})
</script>

<style scoped>
/* Make the window layer cover the entire desktop area (which is relative) */
.wm-root {
  position: absolute;
  inset: 0;        /* top:0; right:0; bottom:0; left:0 */
  width: 100%;
  height: 100%;
  z-index: 2;      /* above desktop background and helper/test UI */
  /* Allow underlying elements (like the test button) to be clickable except on windows */
  pointer-events: none;
}
/* Re-enable interactions for actual window elements rendered inside */
.wm-root > * {
  pointer-events: auto;
}

.debug {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 12px;
  color: #444;
  background: rgba(255,255,255,0.8);
  border: 1px solid #e3e3e3;
  border-radius: 6px;
  padding: 2px 6px;
  z-index: 10000;
}

</style>