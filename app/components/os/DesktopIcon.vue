<template>
  <div class="desktop-icon">
    <button
      class="icon-button"
      :title="title"
      @dblclick.stop="$emit('open')"
      @contextmenu.prevent.stop="$emit('context', $event)"
    >
      <span class="icon-emoji" aria-hidden="true">{{ emoji }}</span>
      <span class="icon-label">{{ title }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'OsDesktopIcon' })

const { title, emoji } = defineProps<{
  title: string
  emoji: string
}>()

defineEmits<{
  (e: 'open'): void
  (e: 'context', ev: MouseEvent): void
}>()
</script>

<style scoped>
.desktop-icon {
  display: inline-flex;
  width: 88px;
  margin: 8px;
  justify-content: center;
}

.icon-button {
  appearance: none;
  background: transparent;
  border: 0;
  cursor: default;
  width: 88px;
  padding: 8px 6px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  gap: 6px;
  text-align: center;
  user-select: none;
}
.icon-button:hover {
  background: rgba(0, 0, 0, 0.06);
}

.icon-emoji {
  font-size: 28px;
  line-height: 1;
}

.icon-label {
  display: block;
  width: 100%;
  font-size: 12px;
  line-height: 1.15;
  color: #111;
  white-space: normal;
  word-wrap: break-word;
}
</style>