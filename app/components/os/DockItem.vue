<template>
  <li class="dock-item">
    <button
      class="dock-button"
      @click="$emit('launch')"
      @contextmenu.prevent="$emit('context', $event)"
      :title="title"
      aria-haspopup="true"
      draggable="true"
      @dragstart="$emit('drag-start', { id, ev: $event })"
      @dragover.prevent="$emit('drag-over', { id, ev: $event })"
      @drop.prevent="$emit('drop', { id, ev: $event })"
    >
      <OsAppIcon :icon="icon" :emoji="emoji" :alt="title" size="dock" />
      <!-- Optional minimized count badge (shown when 2+ minimized windows exist) -->
      <span v-if="minimizedCount && minimizedCount > 1" class="count-badge" aria-hidden="true">{{ minimizedCount }}</span>
      <!-- Legacy running indicator kept for compatibility; can be removed when Dock shows minimized-only -->
      <span v-if="running" class="running-dot" :class="{ hidden: minimized }" aria-hidden="true"></span>
      <span class="sr-only">{{ title }}</span>
    </button>
  </li>
</template>

<script setup lang="ts">
import OsAppIcon from './AppIcon.vue'

defineOptions({ name: 'OsDockItem' })

const { id, title, icon, emoji, running = false, minimized = false, minimizedCount = 0 } = defineProps<{
  id: string
  title: string
  icon?: string
  emoji?: string
  running?: boolean
  minimized?: boolean
  minimizedCount?: number
}>()

defineEmits<{
  (e: 'launch' | 'context', ev?: MouseEvent): void
  (e: 'drag-start' | 'drag-over' | 'drop', payload: { id: string; ev: DragEvent }): void
}>()
</script>

<style scoped>
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
  position: relative;
  transition: transform 0.12s ease, background-color 0.12s ease;
}
.dock-button:hover {
  background: rgba(0, 0, 0, 0.06);
  transform: translateY(-2px);
}

/* Running indicator */
.running-dot {
  position: absolute;
  bottom: 6px;
  left: 50%;
  transform: translateX(-50%);
  width: 6px;
  height: 6px;
  background: #2a7cff; /* visible */
  border-radius: 50%;
  box-shadow: 0 0 0 1px rgba(0,0,0,0.06);
}
.running-dot.hidden {
  background: #9aa4b2; /* minimized-only */
}

/* Minimized count badge */
.count-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: #2a7cff;
  color: #fff;
  font-size: 11px;
  line-height: 16px;
  text-align: center;
  box-shadow: 0 0 0 1px rgba(0,0,0,0.06);
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