<template>
  <div class="icons-grid" role="grid">
    <OsDesktopIcon
      v-for="app in appList"
      :key="app.id"
      :title="app.title"
      :emoji="app.emoji ?? '🗂️'"
      @open="onOpenApp(app.id)"
      @context="onContextApp(app.id, $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import OsDesktopIcon from './DesktopIcon.vue'
import { useAppsStore } from '../../../stores/apps'
import { useOSStore } from '../../../stores/os'
import { execute } from '../../composables/menuCommands'
import { Menu } from '../../../types/menu'
import type { AppDescriptor, AppId } from '../../../types/app'

defineOptions({ name: 'OsDesktopIcons' })

const apps = useAppsStore()
const os = useOSStore()

const appList = computed<AppDescriptor[]>(() => {
  // Render all registered apps
  return Object.values(apps.registry)
})

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
.icons-grid {
  position: absolute;
  inset: 0;
  padding: 12px;
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 4px 8px;
  pointer-events: auto; /* ensure icons are clickable over wm-root pointer-events:none */
}
</style>