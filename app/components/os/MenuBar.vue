<template>
  <header class="menu-bar" @click="store.closeMenu()">
    <div ref="menuLeftEl" class="menu-left" role="menubar">
      <!-- Left-most title: System or Active App -->
      <button
        class="menu-title"
        role="menuitem"
        aria-haspopup="true"
        :data-index="0"
        :aria-expanded="isMenubarOpen ? 'true' : 'false'"
        @click.stop="openSection(0, $event)"
        @mouseenter="onHoverSection(0, $event)"
      >
        {{ activeTemplate.title }}
      </button>

      <!-- Dynamic top-level sections (excluding the first, which is opened by the title button) -->
      <button
        v-for="(section, i) in activeTemplate.sections.slice(1)"
        :key="section.id"
        class="menu-item"
        role="menuitem"
        aria-haspopup="true"
        :data-index="i + 1"
        :aria-expanded="isMenubarOpen && store.menu.menubarIndex === (i + 1) ? 'true' : 'false'"
        @click.stop="openSection(i + 1, $event)"
        @mouseenter="onHoverSection(i + 1, $event)"
      >
        {{ section.label }}
      </button>
    </div>

    <div class="menu-right">
      <span class="clock">{{ store.clock }}</span>
    </div>

    <!-- Dropdown for the active section -->
    <MenuDropdown
      v-if="isMenubarOpen && currentEntries.length"
      :entries="currentEntries"
      :origin="dropdownOrigin"
      :z="2000"
      @executed="onExecuted"
      @navLeft="onNavLeft"
      @navRight="onNavRight"
    />
  </header>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useOSStore } from '../../../stores/os'
import { useAppsStore } from '../../../stores/apps'
import MenuDropdown from './MenuDropdown.vue'
import { getSystemMenuTemplate, getAppMenuTemplate } from './menus'

defineOptions({ name: 'OsMenuBar' })

const store = useOSStore()
const apps = useAppsStore()
const menuLeftEl = ref<HTMLElement | null>(null)

// Clock tick (unchanged behavior)
let t: number | undefined
onMounted(() => {
  store.tickClock()
  t = window.setInterval(() => store.tickClock(), 1000)
})
onUnmounted(() => {
  if (t) window.clearInterval(t)
})

// Resolve active template by focus: desktop -> system; window -> app menu
const activeTemplate = computed(() => {
  const appId = store.activeAppId
  if (!appId) return getSystemMenuTemplate()
  const title = apps.registry[appId]?.title
  return getAppMenuTemplate(appId, title)
})

const isMenubarOpen = computed(() => store.menu.openType === 'menubar')

// Entries of the currently opened section
const currentEntries = computed(() => {
  const idx = store.menu.menubarIndex ?? 0
  return activeTemplate.value.sections[idx]?.entries ?? []
})

// Position for dropdown (absolute page coords)
const dropdownOrigin = ref<{ x: number; y: number }>({ x: 10, y: 40 })

function computeOriginFromEvent(e: Event) {
  const el = e.currentTarget as HTMLElement | null
  if (!el) return
  const r = el.getBoundingClientRect()
  dropdownOrigin.value = {
    x: Math.round(r.left + 4),
    y: Math.round(r.bottom) // directly under the menubar
  }
}

function openSection(i: number, e: Event) {
  computeOriginFromEvent(e)
  store.openMenubar(i)
}

function onHoverSection(i: number, e: Event) {
  if (!isMenubarOpen.value) return
  if (store.menu.menubarIndex !== i) {
    computeOriginFromEvent(e)
    store.openMenubar(i)
  }
}

function onExecuted() {
  store.closeMenu()
}

/**
 * Helpers to move between sections via keyboard (Left/Right).
 * Finds the corresponding menubar button by data-index and repositions the dropdown.
 */
function getButtonElByIndex(i: number): HTMLElement | null {
  const root = menuLeftEl.value
  if (!root) return null
  return root.querySelector<HTMLElement>(`[data-index="${i}"]`)
}

function setOriginFromIndex(i: number) {
  const el = getButtonElByIndex(i)
  if (!el) return
  const r = el.getBoundingClientRect()
  dropdownOrigin.value = {
    x: Math.round(r.left + 4),
    y: Math.round(r.bottom)
  }
}

function switchSection(nextIndex: number) {
  setOriginFromIndex(nextIndex)
  store.openMenubar(nextIndex)
}

function onNavLeft() {
  const sections = activeTemplate.value.sections.length
  const cur = store.menu.menubarIndex ?? 0
  const next = (cur - 1 + sections) % sections
  switchSection(next)
}

function onNavRight() {
  const sections = activeTemplate.value.sections.length
  const cur = store.menu.menubarIndex ?? 0
  const next = (cur + 1) % sections
  switchSection(next)
}
</script>

<style scoped>
.menu-bar {
  position: relative;
  z-index: 4; /* Above .wm-root (z:2) and Dock (z:3) to ensure dropdown overlays windows */
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
  cursor: pointer;
  border: 0;
  background: transparent;
}
.menu-item:hover {
  background: rgba(0, 0, 0, 0.06);
}

.menu-right .clock {
  font-size: 13px;
  color: #444;
}
</style>