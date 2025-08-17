<template>
  <div
    class="desktop"
    @click="onDesktopClick"
    @contextmenu.prevent="onDesktopContextmenu"
  >
    <!-- Desktop app icons -->
    <OsDesktopIcons />
  </div>
</template>

<script setup lang="ts">
import { useOSStore } from '../../../stores/os'
import { Menu } from '../../../types/menu'
import OsDesktopIcons from './DesktopIcons.vue'

defineOptions({ name: 'OsDesktop' })

const store = useOSStore()

function onDesktopClick() {
  // Close any menus and clear focused window when clicking the desktop
  store.closeMenu()
  store.setFocused(null)
}

function onDesktopContextmenu(e: MouseEvent) {
  // Build a minimal context template using the shared menu model
  const ctx = Menu.template('desktop-context', 'Webintosh', [
    Menu.section('file', 'File', [
      Menu.item('ctx.openWindow', 'Open Window', { command: 'os.openWindow' }),
      Menu.item('ctx.shortcuts', 'Shortcuts', { command: 'system.showShortcuts' }),
      Menu.submenu('ctx.dev', 'Developer', [
        Menu.item('ctx.dev.openTest', 'Open Test Window', { command: 'os.openTestWindow' })
      ])
    ])
  ])
  store.openContext(e.clientX, e.clientY, ctx)
}
</script>

<style scoped>
.desktop {
  position: relative;
  width: 100%;
  height: calc(100vh - 40px); /* keep in sync with menu bar height */
  background: #f5f6f8;
}
</style>