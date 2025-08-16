<template>
  <nav class="os-dock" aria-label="Dock">
    <ul class="dock-list">
      <OsDockItem
        v-for="it in items"
        :key="it.id"
        :title="it.title"
        :emoji="it.emoji"
        :running="it.running"
        :minimized="it.minimized"
        @launch="onLaunchId(it.id)"
        @context="onContextId(it.id)"
      />
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppsStore } from '../../../stores/apps'
import { useOSStore } from '../../../stores/os'

defineOptions({ name: 'OsDock' })

const apps = useAppsStore()
const os = useOSStore()

type DockItem = {
  id: string
  title: string
  emoji: string
  running: boolean        // any window exists for appId
  minimized: boolean      // true when only minimized windows exist (no visible)
}

const items = computed<DockItem[]>(() => {
  // Build quick index of app run-state
  const appWindows = new Map<string, { any: boolean; anyVisible: boolean }>()
  for (const w of os.windows) {
    if (!w.appId) continue
    const cur = appWindows.get(w.appId) ?? { any: false, anyVisible: false }
    cur.any = true
    if (!w.minimized) cur.anyVisible = true
    appWindows.set(w.appId, cur)
  }

  return apps.pinnedDescriptors.map(d => {
    const state = appWindows.get(d.id) ?? { any: false, anyVisible: false }
    return {
      id: d.id,
      title: d.title,
      emoji: d.emoji ?? '🗂️',
      running: state.any,
      minimized: state.any && !state.anyVisible
    }
  })
})

function onLaunchId(id: string) {
  apps.launchOrFocus(id)
}

function onContextId(id: string) {
  apps.togglePin(id)
}
</script>

<style scoped>
/* Dock container */
.os-dock {
  position: absolute;
  left: 50%;
  bottom: 12px;
  transform: translateX(-50%);
  z-index: 3; /* above windows overlay (z-index: 2) */
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  border: 1px solid #e3e3e3;
  border-radius: 14px;
  padding: 8px 10px;
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.12);
}

/* Items */
.dock-list {
  display: flex;
  align-items: center;
  gap: 10px;
  list-style: none;
  padding: 0;
  margin: 0;
}

.dock-item {
  display: inline-flex;
}

.dock-button {
  appearance: none;
  border: 0;
  background: transparent;
  cursor: pointer;
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  transition: transform 0.12s ease, background-color 0.12s ease;
}
.dock-button:hover {
  background: rgba(0, 0, 0, 0.06);
  transform: translateY(-2px);
}

.dock-icon {
  font-size: 26px;
  line-height: 1;
}

/* a11y */
.sr-only {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0,0,1px,1px);
  border: 0;
}
</style>