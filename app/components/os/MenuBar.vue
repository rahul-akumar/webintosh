<template>
  <header class="menu-bar" @click="store.closeMenu()">
    <div ref="menuLeftEl" class="menu-left" role="menubar">
      <!-- System logo button with icon -->
      <button
        class="menu-logo"
        role="menuitem"
        aria-haspopup="true"
        :data-index="0"
        :aria-expanded="isMenubarOpen ? 'true' : 'false'"
        @click.stop="openSection(0, $event)"
        @mouseenter="onHoverSection(0, $event)"
      >
        <img v-if="logoUrl" :src="logoUrl" alt="Logo" class="logo-icon" @error="logoUrl = null">
        <span v-else class="logo-fallback">🍎</span>
      </button>

      <!-- App name after logo -->
      <span class="app-name">{{ activeAppName }}</span>

      <!-- Dynamic top-level sections (excluding the first, which is opened by the logo button) -->
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
    <Teleport to="body">
      <OsMenuDropdown
        v-if="isMenubarOpen && currentEntries.length"
        :entries="currentEntries"
        :origin="dropdownOrigin"
        :z="2000"
        @executed="onExecuted"
        @nav-left="onNavLeft"
        @nav-right="onNavRight"
      />
    </Teleport>
  </header>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useOSStore } from '../../stores/os'
import { useAppsStore } from '../../stores/apps'
import { getSystemMenuTemplate, getAppMenuTemplate } from './menus'
import { useAssetUrl } from '../../composables/useAssetUrl'
import { useClock } from '../../composables/useClock'

defineOptions({ name: 'OsMenuBar' })

const store = useOSStore()
const apps = useAppsStore()
const menuLeftEl = ref<HTMLElement | null>(null)
const logoUrl = ref<string | null>(useAssetUrl("/icons/system/apple.png") || null)

// Initialize clock
useClock()

// Resolve active template - default to system menu when no windows are open
const activeTemplate = computed(() => {
  const appId = store.activeAppId
  if (!appId) {
    // Default to system menu when no app is focused
    return getSystemMenuTemplate()
  }
  const title = apps.registry[appId]?.title
  return getAppMenuTemplate(appId, title)
})

// Get the active app name for display
const activeAppName = computed(() => {
  const appId = store.activeAppId
  if (!appId) return 'Webintosh'
  return apps.registry[appId]?.title ?? 'App'
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  height: 40px;
  background: var(--bg-menubar);
  backdrop-filter: blur(var(--blur-amount));
  -webkit-backdrop-filter: blur(var(--blur-amount));
  border-bottom: 1px solid var(--border-window);
  color: var(--text-menubar);
  user-select: none;
  position: relative;
  z-index: 100;
}

.menu-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.menu-logo {
  border: 0;
  background: transparent;
  color: var(--text-menubar);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
}
.menu-logo:hover {
  background: var(--bg-button-hover);
}

.logo-icon {
  width: 20px;
  height: 20px;
}

.logo-fallback {
  font-size: 16px;
  margin-right: 4px;
}

.app-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-menubar);
}

.menu-item {
  color: var(--text-menubar);
  font-size: 14px;
  padding: 4px 6px;
  border-radius: 6px;
  cursor: pointer;
  border: 0;
  background: transparent;
}
.menu-item:hover {
  background: var(--bg-button-hover);
}

.menu-right .clock {
  font-size: 13px;
  color: var(--text-menubar);
}
</style>