<template>
  <div class="display-panel">
    <div class="waveform-display">
      <canvas ref="canvasRef"/>
      <div class="oscillator-type-indicator">{{ oscillatorType.toUpperCase() }}</div>
    </div>
    <div class="info-display">
      <span v-if="currentNote">{{ currentNote }}</span>
      <span v-else class="hint">Press keys A-L for white keys, W-E-T-Y-U for black keys</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

const props = defineProps<{
  oscillatorType: OscillatorType
  currentNote: string
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)

defineExpose({
  canvas: canvasRef
})

// Watch for changes to update canvas reference
watch(canvasRef, (newCanvas) => {
  if (newCanvas) {
    // Canvas is ready
  }
})
</script>
