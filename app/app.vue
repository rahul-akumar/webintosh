<template>
  <div class="os-root">
    <OsMenuBar />

    <main class="os-desktop-area">
      <OsDesktop />
      <OsWindowManager />
      <OsDock />
      <div class="tester">
        <button class="btn" @click="store.openWindow()">Open Test Window</button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useOSStore } from '../stores/os'
import { useAppsStore } from '../stores/apps'
import { onMounted } from 'vue'

defineOptions({ name: 'AppRoot' })

const store = useOSStore()
const apps = useAppsStore()

onMounted(() => {
  // Load persisted session first
  store.loadSession()
  // If no windows, open one to verify wiring
  if (!store.windows.length) {
    store.openWindow()
  }

  // Phase 2: register core apps and hydrate Dock pins
  apps.registerApps([
    { id: 'finder', title: 'Finder', emoji: '🗂️', kind: 'system' },
    { id: 'textedit', title: 'TextEdit', emoji: '📝', kind: 'app' }
  ])
  apps.loadPins()
  if (apps.pinned.length === 0) {
    apps.pinApp('finder')
    apps.pinApp('textedit')
  }
})
</script>

<style>
html, body, #__nuxt {
  height: 100%;
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
}

/* Helper test button */
.tester {
  position: absolute;
  right: 12px;
  bottom: 12px;
  z-index: 1; /* Below .wm-root (z-index: 2) */
  pointer-events: none; /* Never intercept OS window events */
}
.btn {
  padding: 6px 10px;
  font-size: 14px;
  background: #222;
  color: #fff;
  border: 0;
  border-radius: 6px;
  cursor: pointer;
}
.btn:hover { background: #333; }
</style>