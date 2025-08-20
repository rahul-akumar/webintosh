<template>
  <div class="os-root">
    <!-- Wallpaper layer - full viewport background -->
    <div 
      class="os-wallpaper"
      :class="{ 'has-wallpaper': !!store.wallpaper }"
      :style="wallpaperStyle"
    />
    
    <!-- MenuBar positioned over wallpaper -->
    <OsMenuBar />

    <!-- Desktop area with apps and windows -->
    <main class="os-desktop-area">
      <OsDesktop />
      <OsWindowManager />
      <OsDock />
      <OsContextMenu
        v-if="store.menu.openType === 'context' && store.menu.contextTemplate && store.menu.contextPos"
        :sections="store.menu.contextTemplate.sections"
        :origin="store.menu.contextPos"
        :z="3000"
        @executed="store.closeMenu()"
        @request-close="store.closeMenu()"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useOSStore } from '../stores/os'
import { useAppsStore } from '../stores/apps'
import { onMounted, computed } from 'vue'
import { registerDefaultCommands } from './composables/menuCommands'
import OsContextMenu from './components/os/ContextMenu.vue'

defineOptions({ name: 'AppRoot' })

const store = useOSStore()
const apps = useAppsStore()

// Wallpaper style computed property
const wallpaperStyle = computed(() => {
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

onMounted(() => {
  // Load persisted session first
  store.loadSession()
  
  // Initialize theme system
  store.initTheme()
  
  // Load icon positions and layout early
  apps.loadIconPositions()
  apps.loadIconLayout()

  // Do not auto-open any window on fresh sessions

  // Register core apps
  apps.registerApps([
    { id: 'finder', title: 'Finder', icon: 'icons/system/finder.svg', emoji: '🗂️', kind: 'system' },
    { id: 'textedit', title: 'TextEdit', icon: 'icons/apps/textEdit.svg', emoji: '📝', kind: 'app' },
    { id: 'shortcuts', title: 'Shortcuts', icon: 'icons/system/shortcuts.svg', emoji: '⌨️', kind: 'system', showOnDesktop: false },
    { 
      id: 'about', 
      title: 'About Webintosh', 
      icon: 'icons/system/about.svg',
      emoji: 'ℹ️',
      kind: 'system',
      defaultRect: { x: 100, y: 80, width: 400, height: 600 },
      showOnDesktop: false
    },
    {
      id: 'settings',
      title: 'System Settings',
      icon: 'icons/system/settings.svg',
      emoji: '⚙️',
      kind: 'system',
      defaultRect: { x: 100, y: 80, width: 900, height: 600 }
    },
    {
      id: 'typingtest',
      title: 'Typing Test',
      icon: 'icons/apps/typingtest.svg',
      emoji: '⌨️',
      kind: 'app',
      defaultRect: { x: 100, y: 80, width: 900, height: 600 }
    }
  ])
  // Load Dock minimized ordering (Dock now shows minimized apps only)
  apps.loadMinOrder()

  // Menu commands: register default command handlers once
  registerDefaultCommands()
})
</script>

<style>
/* Use border-box globally to avoid 1–2px overflow from borders/padding */
*, *::before, *::after {
  box-sizing: border-box;
}
html, body, #__nuxt {
  height: 100%;
  overflow: hidden; /* Prevent page-level scrollbars; only windows may scroll internally */
}
body {
  margin: 0;
  background: #f5f6f8;
  color: #111;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
}
button {
  border: none;
}
.os-root {
  position: relative;
  height: 100vh;
  overflow: hidden;
}

/* Wallpaper layer - full viewport background */
.os-wallpaper {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  background: var(--bg-desktop);
}

/* MenuBar now positioned over the wallpaper */
.os-menubar {
  position: relative;
  z-index: 100;
}

/* Desktop area positioned below menubar but above wallpaper */
.os-desktop-area {
  position: relative;
  height: calc(100vh - 40px);
  user-select: none;
  overflow: hidden;
  z-index: 1;
}
</style>