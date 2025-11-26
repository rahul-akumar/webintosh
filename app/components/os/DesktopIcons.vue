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
import { useIconLayout } from '../../composables/useIconLayout'
import { execute } from '../../utils/menuCommands'
import { Menu } from '../../types/menu'
import type { AppDescriptor, AppId } from '../../types/app'

defineOptions({ name: 'OsDesktopIcons' })

const apps = useAppsStore()
const os = useOSStore()
const { getX, getY } = useIconLayout()

const appList = computed<AppDescriptor[]>(() => {
  return apps.getSortedAppList().filter(app => app.showOnDesktop !== false)
})

function onIconMove(appId: AppId, data: { x: number; y: number }) {
  apps.setIconPosition(appId, data.x, data.y)
}

function onOpenApp(id: AppId) {
  // If any minimized windows for the app: restore the topmost minimized
  const minimized = os.windows
    .filter(w => w.appId === id && w.displayState === 'minimized')
    .sort((a, b) => b.zIndex - a.zIndex)
  const topMin = minimized[0]
  if (topMin) {
    os.restoreWindow(topMin.id)
    return
  }

  // Else if any visible windows exist: bring topmost visible to front
  const visible = os.windows
    .filter(w => w.appId === id && w.displayState !== 'minimized')
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