<template>
  <nav class="os-dock" aria-label="Dock">
    <ul
      class="dock-list"
      @dragover.prevent
      @drop.prevent="onDropList"
    >
      <OsDockItem
        v-for="it in items"
        :key="it.id"
        :id="it.id"
        :title="it.title"
        :icon="it.icon"
        :emoji="it.emoji"
        :minimized-count="it.minimizedCount"
        @launch="onLaunchId(it.id)"
        @context="onContextId(it.id, $event)"
        @drag-start="onDragStart"
        @drag-over="onDragOver"
        @drop="onDrop"
      />
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAppsStore } from '../../../stores/apps'
import { useOSStore } from '../../../stores/os'
import { createDockMenuForApp } from './menus'
import type { AppId } from '../../../types/app'

defineOptions({ name: 'OsDock' })

const apps = useAppsStore()
const os = useOSStore()

type DockItem = {
  id: AppId
  title: string
  icon?: string
  emoji?: string
  minimizedCount: number
}

const items = computed<DockItem[]>(() => {
  // Collect minimized windows per app
  const byApp = new Map<AppId, { count: number }>()
  for (const w of os.windows) {
    if (!w.appId) continue
    if (!w.minimized) continue
    const cur = byApp.get(w.appId as AppId) ?? { count: 0 }
    cur.count++
    byApp.set(w.appId as AppId, cur)
  }

  const ids: AppId[] = Array.from(byApp.keys())
  const orderedIds: AppId[] =
    typeof apps.orderMinimizedAppIds === 'function'
      ? apps.orderMinimizedAppIds(ids)
      : ids

  return orderedIds
    .map((id: AppId) => {
      const d = apps.registry[id]
      const count = byApp.get(id)?.count ?? 0
      if (!d) return null
      return {
        id,
        title: d.title,
        icon: d.icon,
        emoji: d.emoji ?? '🗂️',
        minimizedCount: count
      }
    })
    .filter((x: DockItem | null): x is DockItem => x !== null)
})

function onLaunchId(id: AppId) {
  // Restore the topmost minimized window for the app
  const minimized = os.windows
    .filter(w => w.appId === id && w.minimized)
    .sort((a, b) => b.zIndex - a.zIndex)
  const top = minimized[0]
  if (top) {
    os.restoreWindow(top.id)
  }
}

function onContextId(id: AppId, e?: MouseEvent) {
  const minimized = os.windows
    .filter(w => w.appId === id && w.minimized)
    .map(w => ({ id: w.id, title: w.title }))

  const appTitle = apps.registry[id]?.title
  const tpl = createDockMenuForApp(id, minimized, appTitle)

  // Position near the cursor but keep within viewport:
  const rawX = e?.clientX ?? Math.round(window.innerWidth / 2)
  const rawY = e?.clientY ?? Math.round(window.innerHeight / 2)

  // Heuristic dropdown size
  const menuW = 240
  const menuH = 240

  // Clamp horizontally if near right edge
  const maxX = Math.max(8, window.innerWidth - menuW - 8)
  const x = Math.min(rawX, maxX)

  // If near bottom edge (Dock), open upward by offsetting Y origin
  const spaceBelow = window.innerHeight - rawY
  const y = spaceBelow < menuH + 20 ? Math.max(8, rawY - menuH) : rawY

  os.openContext(x, y, tpl)
}

/**
 * Drag and drop ordering for minimized app tiles
 */
const dragSource = ref<AppId | null>(null)

function onDragStart(payload: { id: AppId; ev: DragEvent }) {
  dragSource.value = payload.id
  const dt = payload.ev.dataTransfer
  if (dt) {
    dt.setData('text/plain', payload.id)
    dt.effectAllowed = 'move'
    // Some UAs require an explicit dropEffect during drag
    dt.dropEffect = 'move'
  }
}

function onDragOver(payload: { id: AppId; ev: DragEvent }) {
  // Ensure cursor shows as a move operation while hovering targets
  const dt = payload.ev.dataTransfer
  if (dt) dt.dropEffect = 'move'
}

function onDrop(payload: { id: AppId; ev: DragEvent }) {
  const source = dragSource.value
  const target = payload.id
  if (source) {
    // Place source before target
    apps.moveInMinOrder(source, target ?? null)
  }
  dragSource.value = null
}

/**
 * Handle drop on the dock list background (e.g., after last item or between gaps).
 * Falls back to appending to the end of the order.
 */
function onDropList(ev: DragEvent) {
  const data = ev.dataTransfer?.getData('text/plain') || ''
  const source = data as AppId
  if (source && typeof source === 'string') {
    apps.moveInMinOrder(source, null)
  }
  dragSource.value = null
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