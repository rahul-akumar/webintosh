<template>
  <div class="wm-root">
    <!-- Debug info (development only) -->
    <div v-if="isDev" class="debug">Windows: {{ store.windows.length }}</div>

    <!-- Translucent preview of the zone a dragged window would snap into -->
    <div v-if="previewRect" class="snap-preview" :style="previewStyle"/>

    <!-- Windows with open/close animations -->
    <TransitionGroup name="window">
      <OsWindow
        v-for="w in store.orderedWindows"
        :key="w.id"
        :win="w"
      />
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'
import { useOSStore } from '../../stores/os'
import { useDragStore } from '../../stores/drag'
import OsWindow from './Window.vue'
import { useWindowEvents } from '../../composables/useWindowEvents'

defineOptions({ name: 'OsWindowManager' })

const store = useOSStore()
const dragStore = useDragStore()

// Development mode check for debug UI
const isDev = import.meta.dev ?? process.env.NODE_ENV === 'development'

// Set up global window management events (drag, resize, keyboard shortcuts)
useWindowEvents()

// Snap preview: target rect for the drag store's current snap candidate,
// using the same geometry endDrag() applies on release.
const previewRect = computed(() => {
  const zone = dragStore.snapCandidate
  return zone ? store.previewRectForZone(zone) : null
})

const previewStyle = computed<CSSProperties>(() => {
  const rect = previewRect.value
  if (!rect) return {}

  // Sit just above the dragged window rather than a fixed z-index: window
  // z-indexes come from the store's unbounded, persisted nextZ counter (not
  // the --z-windows/--z-window-active CSS scale), so any hard-coded number
  // is wrong in both directions in a non-fresh session - too low to clear
  // windows stacked above 150, or (in a fresh session, nextZ starting at
  // 100) higher than the dragged window itself, burying it under the tint.
  // startDrag() always brings the dragged window to front first, so its
  // zIndex is the ceiling among all windows for the duration of the drag.
  const draggedId = dragStore.activeWindowId
  const draggedWindow = draggedId != null ? store.windows.find((w) => w.id === draggedId) : undefined

  return {
    position: 'absolute',
    left: rect.x + 'px',
    // .wm-root lives inside .os-desktop-area (offset below the menu bar),
    // so subtract menuBarHeight - same convention as Window.vue's styleObject.
    top: (rect.y - store.menuBarHeight) + 'px',
    width: rect.width + 'px',
    height: rect.height + 'px',
    zIndex: (draggedWindow?.zIndex ?? 0) + 1,
  }
})
</script>

<style scoped>
/* Make the window layer cover the entire desktop area (which is relative) */
.wm-root {
  position: absolute;
  inset: 0;        /* top:0; right:0; bottom:0; left:0 */
  width: 100%;
  height: 100%;
  z-index: var(--z-windows);
  /* Allow underlying elements (like the test button) to be clickable except on windows */
  pointer-events: none;
}
/* Re-enable interactions for actual window elements rendered inside */
.wm-root > * {
  pointer-events: auto;
}

/* Snap preview must stay click-through - higher specificity than
   `.wm-root > *` above, which would otherwise win and re-enable it. */
.wm-root > .snap-preview {
  pointer-events: none;
  /* z-index is set inline (previewStyle) - derived from the dragged window's
     actual zIndex, not a fixed number here. */
  background: color-mix(in srgb, var(--accent-color, #0a84ff) 25%, transparent);
  border: 2px solid color-mix(in srgb, var(--accent-color, #0a84ff) 70%, transparent);
  border-radius: var(--window-border-radius, 8px);
  transition: opacity 0.1s ease-out;
}

.debug {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--bg-window);
  backdrop-filter: blur(var(--blur-amount));
  -webkit-backdrop-filter: blur(var(--blur-amount));
  border: 1px solid var(--border-window);
  border-radius: 6px;
  padding: 2px 6px;
  z-index: 10000;
}

/* Window open/close animations */
.window-enter-active {
  animation: window-open 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.window-leave-active {
  animation: window-close 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes window-open {
  0% {
    opacity: 0;
    transform: scale(0.88);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes window-close {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(0.88);
  }
}
</style>
