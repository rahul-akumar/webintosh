<template>
  <!-- Root/backdrop contract with the seam e2e spec
       (tests/e2e/overlay-hotkeys.spec.ts): keep data-testid="os-launcher"
       on the root element, rendered only while the launcher is open. -->
  <div
    v-if="overlay.isLauncherOpen"
    class="os-launcher"
    data-testid="os-launcher"
    role="presentation"
    @click="overlay.closeLauncher()"
  >
    <div class="launcher-panel" role="dialog" aria-label="App Launcher" @click.stop>
      <input
        ref="inputEl"
        v-model="query"
        type="text"
        class="launcher-input"
        data-testid="os-launcher-input"
        placeholder="Search apps..."
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        @keydown.up.prevent.stop="moveSelection(-1)"
        @keydown.down.prevent.stop="moveSelection(1)"
        @keydown.enter.prevent.stop="launchSelected"
      >

      <ul v-if="results.length" class="launcher-results">
        <li
          v-for="(app, i) in results"
          :key="app.id"
          class="launcher-row"
          :class="{ 'is-selected': i === selectedIndex }"
          @mouseenter="selectedIndex = i"
          @click="launch(app.id)"
        >
          <OsAppIcon :icon="app.icon" :emoji="app.emoji" :alt="app.title" size="medium" />
          <span class="launcher-row-title">{{ app.title }}</span>
        </li>
      </ul>
      <p v-else class="launcher-empty">No results</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useOverlayStore } from '../../stores/overlay'
import { useAppsStore } from '../../stores/apps'
import { fuzzySearch } from '../../utils/fuzzy'
import type { AppDescriptor } from '../../types/app'
import OsAppIcon from './AppIcon.vue'

defineOptions({ name: 'OsLauncher' })

const overlay = useOverlayStore()
const apps = useAppsStore()

const query = ref('')
const selectedIndex = ref(0)
const inputEl = ref<HTMLInputElement | null>(null)

// Registration order (Object.values preserves string-key insertion order),
// fuzzy-ranked by the query; an empty query keeps that registration order.
const results = computed<AppDescriptor[]>(() =>
  fuzzySearch(query.value, Object.values(apps.registry), (a) => a.title)
)

// The result set reshuffles on every keystroke - always land on the best
// match, like Spotlight.
watch(results, () => {
  selectedIndex.value = 0
})

watch(
  () => overlay.isLauncherOpen,
  async (open) => {
    if (!open) return
    query.value = ''
    selectedIndex.value = 0
    await nextTick()
    inputEl.value?.focus()
  }
)

function moveSelection(delta: number): void {
  const len = results.value.length
  if (len === 0) return
  selectedIndex.value = ((selectedIndex.value + delta) % len + len) % len
}

function launch(id: string): void {
  apps.launchOrFocus(id)
  overlay.closeLauncher()
}

function launchSelected(): void {
  const selected = results.value[selectedIndex.value]
  if (selected) launch(selected.id)
}
</script>

<style scoped>
.os-launcher {
  position: fixed;
  inset: 0;
  z-index: var(--z-overlay);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 14vh;
  background: rgba(0, 0, 0, 0.2);
}

.launcher-panel {
  display: flex;
  flex-direction: column;
  width: 560px;
  max-width: 90vw;
  max-height: 60vh;
  overflow: hidden;
  background: var(--bg-context-menu);
  backdrop-filter: blur(var(--blur-amount));
  -webkit-backdrop-filter: blur(var(--blur-amount));
  border-radius: 14px;
  box-shadow: var(--shadow-dock);
  /* Don't inherit body's #111: unselected rows must follow the theme. */
  color: var(--text-primary);
}

.launcher-input {
  flex-shrink: 0;
  width: 100%;
  padding: 16px 20px;
  border: 0;
  border-bottom: 1px solid var(--border-dock);
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 20px;
  font-family: inherit;
}

.launcher-input:focus {
  outline: none;
}

.launcher-results {
  overflow-y: auto;
  list-style: none;
  margin: 0;
  padding: 8px;
}

.launcher-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.launcher-row.is-selected {
  background: var(--bg-selection);
  color: var(--text-selection);
}

.launcher-row-title {
  font-size: 15px;
  color: inherit;
}

.launcher-empty {
  margin: 0;
  padding: 24px 20px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 14px;
}
</style>
