<template>
  <div class="os-root">
    <OsMenuBar />

    <main class="os-desktop-area">
      <OsDesktop />
      <OsWindowManager />
      <OsDock />
      <OsContextMenu
        v-if="store.menu.openType === 'context' && store.menu.contextTemplate && store.menu.contextPos"
        :sections="store.menu.contextTemplate.sections"
        :origin="store.menu.contextPos"
        :z="3000"
        @request-close="store.closeMenu()"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useOSStore } from '../stores/os'
import { useAppsStore } from '../stores/apps'
import { onMounted } from 'vue'
import { registerDefaultCommands } from './composables/menuCommands'
import OsContextMenu from './components/os/ContextMenu.vue'

defineOptions({ name: 'AppRoot' })

const store = useOSStore()
const apps = useAppsStore()

onMounted(() => {
  // Load persisted session first
  store.loadSession()
  
  // Load icon positions and layout early
  apps.loadIconPositions()
  apps.loadIconLayout()

  // Do not auto-open any window on fresh sessions

  // Register core apps
  apps.registerApps([
    { id: 'finder', title: 'Finder', emoji: '🗂️', kind: 'system' },
    { id: 'textedit', title: 'TextEdit', emoji: '📝', kind: 'app' },
    { id: 'shortcuts', title: 'Shortcuts', emoji: '⌨️', kind: 'system' }
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
.os-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Keep in sync with store.menuBarHeight (40px) */
.os-desktop-area {
  position: relative;
  height: calc(100vh - 40px);
  user-select: none;
  overflow: hidden; /* Clip window shadows/edges to viewport to avoid 1-2px scrollbars */
}

</style>