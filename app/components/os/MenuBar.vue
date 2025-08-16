<template>
  <header class="menu-bar" @click="store.toggleAppleMenu(false)">
    <div class="menu-left">
      <button class="menu-title" @click.stop="store.toggleAppleMenu()">
        Webintosh
      </button>
      <!-- Placeholder static menus -->
      <span class="menu-item">File</span>
      <span class="menu-item">Edit</span>
      <span class="menu-item">View</span>
    </div>
    <div class="menu-right">
      <span class="clock">{{ store.clock }}</span>
    </div>

    <!-- Simple dropdown to prove menu toggling works -->
    <div v-if="store.menu.isAppleOpen" class="dropdown" @click.stop>
      <div class="dropdown-item">About</div>
      <div class="dropdown-item">Preferences…</div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useOSStore } from '../../../stores/os'

defineOptions({ name: 'OsMenuBar' })

const store = useOSStore()

let t: number | undefined
onMounted(() => {
  store.tickClock()
  t = window.setInterval(() => store.tickClock(), 1000)
})
onUnmounted(() => {
  if (t) window.clearInterval(t)
})
</script>

<style scoped>
.menu-bar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px; /* keep in sync with store.menuBarHeight */
  padding: 0 12px;
  border-bottom: 1px solid #e1e1e1;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(6px);
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  user-select: none;
}

.menu-left {
  display: flex;
  gap: 12px;
  align-items: center;
}

.menu-title {
  border: none;
  background: transparent;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
}
.menu-title:hover {
  background: rgba(0, 0, 0, 0.06);
}

.menu-item {
  color: #333;
  font-size: 14px;
  padding: 4px 6px;
  border-radius: 6px;
  cursor: default;
}
.menu-item:hover {
  background: rgba(0, 0, 0, 0.06);
}

.menu-right .clock {
  font-size: 13px;
  color: #444;
}

/* Dropdown */
.dropdown {
  position: absolute;
  top: 40px;
  left: 10px;
  min-width: 180px;
  background: #fff;
  border: 1px solid #e3e3e3;
  border-radius: 8px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.12);
  padding: 6px;
  z-index: 1000;
}
.dropdown-item {
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}
.dropdown-item:hover {
  background: rgba(0, 0, 0, 0.06);
}
</style>