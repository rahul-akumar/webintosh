<template>
  <div
    class="desktop"
    :style="desktopStyle"
    @click="onDesktopClick"
    @contextmenu.prevent="onDesktopContextmenu"
  >
    <!-- Desktop app icons -->
    <OsDesktopIcons />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useOSStore } from '../../../stores/os'
import { useAppsStore } from '../../../stores/apps'
import { Menu } from '../../../types/menu'
import OsDesktopIcons from './DesktopIcons.vue'

defineOptions({ name: 'OsDesktop' })

const store = useOSStore()
const apps = useAppsStore()

const desktopStyle = computed(() => {
  if (store.wallpaper) {
    return {
      backgroundImage: `url(${store.wallpaper})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }
  }
  return {}
})

function onDesktopClick() {
  // Close any menus and clear focused window when clicking the desktop
  store.closeMenu()
  store.setFocused(null)
}

function onDesktopContextmenu(e: MouseEvent) {
  // Build desktop context menu with all options
  const ctx = Menu.template('desktop-context', 'Webintosh', [
    Menu.section('wallpaper', 'Wallpaper', [
      Menu.item('ctx.changeWallpaper', 'Change Wallpaper...', { 
        command: 'desktop.changeWallpaper' 
      })
    ]),
    Menu.section('icons', 'Icons', [
      Menu.item('ctx.cleanUp', 'Clean Up Icons', { 
        command: 'desktop.cleanUpIcons' 
      }),
      Menu.submenu('ctx.iconSorting', 'Sort Icons By', [
        Menu.item('ctx.sort.name', 'Name', { 
          command: 'desktop.sortIcons',
          args: { sortBy: 'name' }
        }),
        Menu.item('ctx.sort.type', 'Type', { 
          command: 'desktop.sortIcons',
          args: { sortBy: 'type' }
        })
      ]),
      Menu.submenu('ctx.iconDirection', 'Icon Direction', [
        Menu.item('ctx.dir.left', apps.iconLayoutDirection === 'left' ? '✓ Start from Left' : 'Start from Left', { 
          command: 'desktop.setIconDirection',
          args: { direction: 'left' }
        }),
        Menu.item('ctx.dir.right', apps.iconLayoutDirection === 'right' ? '✓ Start from Right' : 'Start from Right', { 
          command: 'desktop.setIconDirection',
          args: { direction: 'right' }
        })
      ]),
      Menu.submenu('ctx.iconSize', 'Icon Size', [
        Menu.item('ctx.size.small', apps.iconSize === 'small' ? '✓ Small' : 'Small', { 
          command: 'desktop.setIconSize',
          args: { size: 'small' }
        }),
        Menu.item('ctx.size.medium', apps.iconSize === 'medium' ? '✓ Medium' : 'Medium', { 
          command: 'desktop.setIconSize',
          args: { size: 'medium' }
        }),
        Menu.item('ctx.size.large', apps.iconSize === 'large' ? '✓ Large' : 'Large', { 
          command: 'desktop.setIconSize',
          args: { size: 'large' }
        })
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