<template>
  <div class="icons-container" role="grid">
    <OsDesktopIcon
      v-for="(app, index) in appList"
      :key="app.id"
      :title="app.title"
      :icon="app.icon"
      :emoji="app.emoji ?? '🗂️'"
      :x="getX(app.id, index)"
      :y="getY(app.id, index)"
      @open="onOpenApp(app.id)"
      @context="onContextApp(app.id, $event)"
      @move="onIconMove(app.id, $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppsStore } from '../../stores/apps'
import { useOSStore } from '../../stores/os'
import { execute } from '../../utils/menuCommands'
import { Menu } from '../../types/menu'
import type { AppDescriptor, AppId } from '../../types/app'
import { LAYOUT } from './constants'

defineOptions({ name: 'OsDesktopIcons' })

const apps = useAppsStore()
const os = useOSStore()

const appList = computed<AppDescriptor[]>(() => {
  return apps.getSortedAppList().filter(app => app.showOnDesktop !== false)
})

function getX(appId: AppId, index: number): number {
  const pos = apps.iconPositions[appId]
  if (pos) return pos.x
  
  // Calculate column based on vertical-first layout
  const iconHeight = LAYOUT.ICON_GRID_HEIGHT
  const iconWidth = LAYOUT.ICON_GRID_WIDTH
  const topPadding = LAYOUT.DESKTOP_TOP_PADDING
  const menuBarHeight = LAYOUT.MENU_BAR_HEIGHT
  
  // Calculate max icons per column based on viewport height
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768
  const availableHeight = viewportHeight - menuBarHeight - topPadding
  const iconsPerColumn = Math.floor(availableHeight / iconHeight)
  
  // Determine which column this icon belongs to
  const col = Math.floor(index / iconsPerColumn)
  
  if (apps.iconLayoutDirection === 'right') {
    // Start from right edge
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1280
    return viewportWidth - iconWidth - (col * iconWidth) - topPadding
  } else {
    // Start from left edge (default)
    return topPadding + (col * iconWidth)
  }
}

function getY(appId: AppId, index: number): number {
  const pos = apps.iconPositions[appId]
  if (pos) return pos.y
  
  // Calculate row within column for vertical-first layout
  const iconHeight = LAYOUT.ICON_GRID_HEIGHT
  const topPadding = LAYOUT.DESKTOP_TOP_PADDING
  const menuBarHeight = LAYOUT.MENU_BAR_HEIGHT
  
  // Calculate max icons per column based on viewport height
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768
  const availableHeight = viewportHeight - menuBarHeight - topPadding
  const iconsPerColumn = Math.floor(availableHeight / iconHeight)
  
  // Determine which row within the column this icon belongs to
  const row = index % iconsPerColumn
  
  return topPadding + (row * iconHeight)
}

function onIconMove(appId: AppId, data: { x: number; y: number }) {
  apps.setIconPosition(appId, data.x, data.y)
}

function onOpenApp(id: AppId) {
  // If any minimized windows for the app: restore the topmost minimized
  const minimized = os.windows
    .filter(w => w.appId === id && w.minimized)
    .sort((a, b) => b.zIndex - a.zIndex)
  const topMin = minimized[0]
  if (topMin) {
    os.restoreWindow(topMin.id)
    return
  }

  // Else if any visible windows exist: bring topmost visible to front
  const visible = os.windows
    .filter(w => w.appId === id && !w.minimized)
    .sort((a, b) => b.zIndex - a.zIndex)
  const topVis = visible[0]
  if (topVis) {
    os.bringToFront(topVis.id)
    return
  }

  // Else: create a new window for the app
  execute('app.newWindow', { appId: id })
}

function onContextApp(id: AppId, e: MouseEvent) {
  const tpl = Menu.template(`desktop-app-context-${id}`, 'Webintosh', [
    Menu.section('app', 'App', [
      Menu.item('app.open', 'Open', {
        command: 'app.newWindow',
        args: { appId: id }
      })
    ])
  ])
  os.openContext(e.clientX, e.clientY, tpl)
}
</script>

<style scoped>
.icons-container {
  position: relative;
  width: 100%;
  height: 100%;
  pointer-events: auto;
}
</style>