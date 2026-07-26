<template>
  <!-- Contract with the seam e2e spec (tests/e2e/overlay-hotkeys.spec.ts):
       root element keeps data-testid="os-app-switcher" and only exists
       while the switcher is active. Pure presentation - all cycling/commit
       logic lives in the overlay store; clicking a cell commits to it. -->
  <div
    v-if="overlay.isSwitcherOpen"
    class="os-app-switcher"
    data-testid="os-app-switcher"
  >
    <div class="switcher-bar">
      <button
        v-for="(appId, i) in overlay.switcherCandidates"
        :key="appId"
        type="button"
        class="switcher-cell"
        :class="{ 'is-selected': i === overlay.switcherIndex }"
        :aria-selected="i === overlay.switcherIndex"
        @click="overlay.switcherCommit(i)"
      >
        <OsAppIcon
          :icon="apps.registry[appId]?.icon"
          :emoji="apps.registry[appId]?.emoji"
          :alt="apps.registry[appId]?.title ?? appId"
          size="large"
        />
        <span class="switcher-cell-title">{{ apps.registry[appId]?.title ?? appId }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useOverlayStore } from '../../stores/overlay'
import { useAppsStore } from '../../stores/apps'
import OsAppIcon from './AppIcon.vue'

defineOptions({ name: 'OsAppSwitcher' })

const overlay = useOverlayStore()
const apps = useAppsStore()
</script>

<style scoped>
.os-app-switcher {
  position: fixed;
  inset: 0;
  z-index: var(--z-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  /* Don't steal clicks outside the bar; only the bar itself is interactive. */
  pointer-events: none;
}

.switcher-bar {
  pointer-events: auto;
  display: flex;
  align-items: stretch;
  gap: 8px;
  padding: 14px;
  background: var(--bg-dock);
  backdrop-filter: blur(var(--blur-amount));
  -webkit-backdrop-filter: blur(var(--blur-amount));
  border: 1px solid var(--border-dock);
  border-radius: 16px;
  box-shadow: var(--shadow-dock);
}

.switcher-cell {
  appearance: none;
  border: 0;
  background: transparent;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  width: 96px;
  padding: 10px 8px;
  border-radius: 10px;
  color: var(--text-secondary);
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.switcher-cell:hover {
  background: var(--bg-button-hover);
}

.switcher-cell.is-selected {
  background: var(--bg-selection);
  /* --text-selection pairs with --bg-selection (white-on-blue in light
     themes); --text-primary would render black-on-blue in oldschool-light. */
  color: var(--text-selection);
}

.switcher-cell-title {
  font-size: 12px;
  line-height: 1.2;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}
</style>
