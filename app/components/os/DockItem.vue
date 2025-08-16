<template>
  <li class="dock-item">
    <button
      class="dock-button"
      @click="$emit('launch')"
      @contextmenu.prevent="$emit('context')"
      :title="title"
      aria-haspopup="true"
    >
      <span class="dock-icon" aria-hidden="true">{{ emoji }}</span>
      <span v-if="running" class="running-dot" :class="{ hidden: minimized }" aria-hidden="true"></span>
      <span class="sr-only">{{ title }}</span>
    </button>
  </li>
</template>

<script setup lang="ts">
defineOptions({ name: 'OsDockItem' })

const { title, emoji, running = false, minimized = false } = defineProps<{
  title: string
  emoji: string
  running?: boolean
  minimized?: boolean
}>()

defineEmits<{
  (e: 'launch' | 'context', ev?: MouseEvent): void
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

.dock-icon {
  font-size: 26px;
  line-height: 1;
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

/* a11y */
.sr-only {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0,0,1px,1px);
  border: 0;
}
</style>