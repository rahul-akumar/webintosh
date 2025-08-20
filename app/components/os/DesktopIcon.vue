<template>
  <div 
    class="desktop-icon"
    :class="`icon-size-${appsStore.iconSize}`"
    :style="positionStyle"
    @mousedown="startDrag"
  >
    <button
      class="icon-button"
      :title="title"
      @dblclick.stop="$emit('open')"
      @contextmenu.prevent.stop="$emit('context', $event)"
    >
      <!-- Use SVG icon if available, otherwise fall back to emoji -->
      <img v-if="iconUrl && !iconError" :src="iconUrl" :alt="title" class="icon-svg" aria-hidden="true" @error="iconError = true">
      <span v-else class="icon-emoji" aria-hidden="true">{{ emoji || '🗂️' }}</span>
      <span class="icon-label">{{ title }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useAssetUrl } from '../../composables/useAssetUrl'
import { useAppsStore } from '../../../stores/apps'

defineOptions({ name: 'OsDesktopIcon' })

const props = defineProps<{
  title: string
  icon?: string
  emoji?: string
  x?: number
  y?: number
}>()

const emit = defineEmits<{
  (e: 'open'): void
  (e: 'context', ev: MouseEvent): void
  (e: 'move', data: { x: number; y: number }): void
}>()

const appsStore = useAppsStore()
const isDragging = ref(false)
const currentX = ref(props.x ?? 0)
const currentY = ref(props.y ?? 0)
const iconError = ref(false)
const iconUrl = computed(() => useAssetUrl(props.icon))

// Update local position when props change
watch(() => props.x, (newX) => {
  if (newX !== undefined && !isDragging.value) {
    currentX.value = newX
  }
})

watch(() => props.y, (newY) => {
  if (newY !== undefined && !isDragging.value) {
    currentY.value = newY
  }
})

const positionStyle = computed(() => {
  if (props.x !== undefined && props.y !== undefined) {
    return {
      position: 'absolute',
      left: `${currentX.value}px`,
      top: `${currentY.value}px`,
      opacity: isDragging.value ? 0.6 : 1,
      transition: isDragging.value ? 'none' : 'opacity 0.2s'
    }
  }
  return {}
})

function startDrag(e: MouseEvent) {
  if (e.button !== 0) return // Only left click
  
  e.preventDefault()
  
  const startX = e.clientX
  const startY = e.clientY
  const origX = currentX.value
  const origY = currentY.value
  
  isDragging.value = true
  
  function onMouseMove(e: MouseEvent) {
    const deltaX = e.clientX - startX
    const deltaY = e.clientY - startY
    
    // Get viewport dimensions
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    // Icon dimensions based on size setting
    const iconSizes = {
      small: { width: 72, height: 68 },
      medium: { width: 88, height: 80 },
      large: { width: 104, height: 92 }
    }
    const { width: iconWidth, height: iconHeight } = iconSizes[appsStore.iconSize]
    const menuBarHeight = 40 // OS menu bar height
    const desktopPadding = 8 // Desktop padding to match OS store
    
    // Calculate new position with bounds checking
    const newX = origX + deltaX
    const newY = origY + deltaY
    
    // Constrain to viewport bounds with padding
    currentX.value = Math.max(0, Math.min(newX, viewportWidth - iconWidth - desktopPadding))
    currentY.value = Math.max(0, Math.min(newY, viewportHeight - menuBarHeight - iconHeight))
  }
  
  function onMouseUp() {
    isDragging.value = false
    // Emit final position
    emit('move', { x: currentX.value, y: currentY.value })
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }
  
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}
</script>

<style scoped>
.desktop-icon {
  display: inline-flex;
  width: 88px;
  margin: 8px;
  justify-content: center;
  user-select: none;
}

/* Small size */
.desktop-icon.icon-size-small {
  width: 72px;
  margin: 6px;
}

.desktop-icon.icon-size-small .icon-button {
  width: 72px;
  padding: 6px 4px;
}

/* Medium size (default) */
.desktop-icon.icon-size-medium {
  width: 88px;
  margin: 8px;
}

.desktop-icon.icon-size-medium .icon-button {
  width: 88px;
  padding: 8px 6px;
}

/* Large size */
.desktop-icon.icon-size-large {
  width: 104px;
  margin: 10px;
}

.desktop-icon.icon-size-large .icon-button {
  width: 104px;
  padding: 10px 8px;
}

.icon-button {
  appearance: none;
  background: transparent;
  border: 0;
  cursor: inherit;
  border-radius: 10px;
  display: grid;
  place-items: center;
  gap: 6px;
  text-align: center;
  user-select: none;
  pointer-events: none;
}

.desktop-icon:hover .icon-button {
  background: rgba(0, 0, 0, 0.06);
  pointer-events: auto;
}

/* Icon sizes */
.icon-svg {
  width: 28px;
  height: 28px;
}

.icon-emoji {
  font-size: 28px;
  line-height: 1;
}

/* Small icon sizes */
.icon-size-small .icon-svg {
  width: 22px;
  height: 22px;
}

.icon-size-small .icon-emoji {
  font-size: 22px;
}

/* Large icon sizes */
.icon-size-large .icon-svg {
  width: 36px;
  height: 36px;
}

.icon-size-large .icon-emoji {
  font-size: 36px;
}

/* Label sizes */
.icon-label {
  display: block;
  width: 100%;
  font-size: 12px;
  line-height: 1.15;
  color: white;
  text-shadow: rgba(0, 0, 0, 0.9) 0px 1px 0px, rgba(0, 0, 0, 0.9) 0px 1px 3px, rgba(0, 0, 0, 0.6) 0px 2px 3px;
  white-space: normal;
  word-wrap: break-word;
  letter-spacing: 0.1rem;
}

.icon-size-small .icon-label {
  font-size: 11px;
}

.icon-size-large .icon-label {
  font-size: 13px;
}
</style>