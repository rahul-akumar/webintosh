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
import { computed, watch } from 'vue'
import { useOSStore } from '../../../stores/os'
import { useAppsStore } from '../../../stores/apps'
import { Menu } from '../../../types/menu'
import OsDesktopIcons from './DesktopIcons.vue'

defineOptions({ name: 'OsDesktop' })

const store = useOSStore()
const apps = useAppsStore()

const desktopStyle = computed(() => {
  if (store.wallpaper) {
    // Check if wallpaper is already a complete CSS value (url() or gradient)
    if (store.wallpaper.startsWith('url(') || store.wallpaper.includes('gradient')) {
      return {
        background: store.wallpaper,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }
    }
    // For solid colors (hex, rgb, etc)
    return {
      background: store.wallpaper
    }
  }
  return {}
})

// Reactive context menu template that updates when state changes
const contextMenuTemplate = computed(() => 
  Menu.template('desktop-context', 'Webintosh', [
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
        Menu.item('ctx.dir.left', 'Start from Left', { 
          command: 'desktop.setIconDirection',
          args: { direction: 'left' },
          checked: apps.iconLayoutDirection === 'left'
        }),
        Menu.item('ctx.dir.right', 'Start from Right', { 
          command: 'desktop.setIconDirection',
          args: { direction: 'right' },
          checked: apps.iconLayoutDirection === 'right'
        })
      ]),
      Menu.submenu('ctx.iconSize', 'Icon Size', [
        Menu.item('ctx.size.small', 'Small', { 
          command: 'desktop.setIconSize',
          args: { size: 'small' },
          checked: apps.iconSize === 'small'
        }),
        Menu.item('ctx.size.medium', 'Medium', { 
          command: 'desktop.setIconSize',
          args: { size: 'medium' },
          checked: apps.iconSize === 'medium'
        }),
        Menu.item('ctx.size.large', 'Large', { 
          command: 'desktop.setIconSize',
          args: { size: 'large' },
          checked: apps.iconSize === 'large'
        })
      ])
    ])
  ])
)

// Watch for changes in icon settings and update the context menu if it's open
watch([() => apps.iconLayoutDirection, () => apps.iconSize], () => {
  // If the desktop context menu is currently open, update it with the new template
  if (store.menu.openType === 'context' && store.menu.contextTemplate?.id === 'desktop-context') {
    store.menu.contextTemplate = contextMenuTemplate.value
  }
})

function onDesktopClick() {
  // Close any menus and clear focused window when clicking the desktop
  store.closeMenu()
  store.setFocused(null)
}

function onDesktopContextmenu(e: MouseEvent) {
  // Open context menu with the reactive template
  store.openContext(e.clientX, e.clientY, contextMenuTemplate.value)
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