<template>
  <div class="wm-root">
    <!-- Debug info (development only) -->
    <div v-if="isDev" class="debug">Windows: {{ store.windows.length }}</div>

    <!-- Windows -->
    <OsWindow
      v-for="w in store.orderedWindows"
      :key="w.id"
      :win="w"
    />
  </div>
</template>

<script setup lang="ts">
import { useOSStore } from '../../stores/os'
import OsWindow from './Window.vue'
import { useWindowEvents } from '../../composables/useWindowEvents'

defineOptions({ name: 'OsWindowManager' })

const store = useOSStore()

// Development mode check for debug UI
const isDev = import.meta.dev ?? process.env.NODE_ENV === 'development'

// Set up global window management events (drag, resize, keyboard shortcuts)
useWindowEvents()
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

</style>