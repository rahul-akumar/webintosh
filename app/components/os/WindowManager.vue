<template>
  <div class="wm-root">
    <div class="debug">Windows: {{ store.windows.length }}</div>

    <!-- Windows -->
    <OsWindow
      v-for="w in store.orderedWindows"
      :key="w.id"
      :win="w"
    />

    <!-- Minimized Shelf overlay (above windows, inside overlay layer) -->
    <div v-if="minimized.length" class="shelf">
      <div class="shelf-title">Minimized</div>
      <div class="shelf-items">
        <button
          v-for="w in minimized"
          :key="w.id"
          class="shelf-chip"
          @click="store.restoreWindow(w.id)"
          :title="`Restore ${w.title}`"
        >
          {{ w.title }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, computed } from 'vue'
import { useOSStore } from '../../../stores/os'
import OsWindow from './Window.vue'

defineOptions({ name: 'OsWindowManager' })

const store = useOSStore()
const minimized = computed(() => store.windows.filter(w => !!w.minimized))

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
    store.toggleAppleMenu(false)
    e.preventDefault()
    return
  }

  // Cmd/Ctrl combos
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

/* Minimized Shelf */
.shelf {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 12px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid #e3e3e3;
  border-radius: 10px;
  padding: 8px 10px;
  box-shadow: 0 8px 22px rgba(0,0,0,0.12);
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 3; /* above windows within overlay */
}
.shelf-title {
  font-size: 12px;
  color: #666;
  margin-right: 6px;
}
.shelf-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.shelf-chip {
  background: #f1f1f1;
  color: #222;
  border: 1px solid #e1e1e1;
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 12px;
  cursor: pointer;
}
.shelf-chip:hover {
  background: #eaeaea;
}
</style>