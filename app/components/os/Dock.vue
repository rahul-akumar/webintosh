<template>
  <nav class="os-dock" aria-label="Dock">
    <ul class="dock-list">
      <li v-for="app in pinned" :key="app.id" class="dock-item">
        <button class="dock-button" @click="onLaunch(app)" :title="app.title" aria-haspopup="true">
          <span class="dock-icon" aria-hidden="true">{{ app.emoji }}</span>
          <span class="sr-only">{{ app.title }}</span>
        </button>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppsStore } from '../../../stores/apps'

defineOptions({ name: 'OsDock' })

const apps = useAppsStore()

type PinnedApp = {
  id: string
  title: string
  emoji: string
}

const pinned = computed<PinnedApp[]>(() =>
  apps.pinnedDescriptors.map(d => ({
    id: d.id,
    title: d.title,
    emoji: d.emoji ?? '🗂️'
  }))
)

function onLaunch(app: PinnedApp) {
  apps.launchOrFocus(app.id)
}
</script>

<style scoped>
/* Dock container */
.os-dock {
  position: absolute;
  left: 50%;
  bottom: 12px;
  transform: translateX(-50%);
  z-index: 3; /* above windows overlay (z-index: 2) */
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  border: 1px solid #e3e3e3;
  border-radius: 14px;
  padding: 8px 10px;
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.12);
}

/* Items */
.dock-list {
  display: flex;
  align-items: center;
  gap: 10px;
  list-style: none;
  padding: 0;
  margin: 0;
}

.dock-item {
  display: inline-flex;
}

.dock-button {
  appearance: none;
  border: 0;
  background: transparent;
  cursor: pointer;
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  transition: transform 0.12s ease, background-color 0.12s ease;
}
.dock-button:hover {
  background: rgba(0, 0, 0, 0.06);
  transform: translateY(-2px);
}

.dock-icon {
  font-size: 26px;
  line-height: 1;
}

/* a11y */
.sr-only {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0,0,1px,1px);
  border: 0;
}
</style>