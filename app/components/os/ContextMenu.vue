<template>
  <teleport to="body">
    <!-- Fullscreen backdrop to capture click-away -->
    <div
      class="cm-overlay"
      role="presentation"
      @click="onBackdropClick"
    >
      <!-- Stop propagation so clicks inside the menu do not close it -->
      <div class="cm-root" @click.stop>
        <MenuDropdown
          :entries="entries"
          :origin="origin"
          :z="z"
          @executed="onExecuted"
        />
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import type { MenuEntry } from '../../../types/menu'
import MenuDropdown from './MenuDropdown.vue'

defineOptions({ name: 'OsContextMenu' })

const props = defineProps<{
  entries: MenuEntry[]
  origin: { x: number; y: number }
  z?: number
  closeOnExecute?: boolean
}>()

const emit = defineEmits<{
  (e: 'executed', payload: { id: string }): void
  (e: 'request-close'): void
}>()

function onBackdropClick() {
  emit('request-close')
}

function onExecuted(payload: { id: string }) {
  emit('executed', payload)
  if (props.closeOnExecute !== false) {
    emit('request-close')
  }
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault()
    emit('request-close')
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
})
</script>

<style scoped>
.cm-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999; /* Backdrop above windows and dock; menu dropdown will layer above via its :z prop */
  background: transparent; /* Invisible; only for capturing clicks */
}

.cm-root {
  position: relative; /* MenuDropdown uses absolute positioning by origin */
}
</style>