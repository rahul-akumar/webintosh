<template>
  <div 
    class="desktop-icon"
    :class="`icon-size-${appsStore.iconSize}`"
    :style="positionStyle"
    @mousedown="handleMouseDown"
  >
    <button
      class="icon-button"
      :title="title"
      @dblclick.stop="$emit('open')"
      @contextmenu.prevent.stop="$emit('context', $event)"
    >
      <OsAppIcon :icon="icon" :emoji="emoji" :alt="title" :size="appsStore.iconSize" />
      <span class="icon-label">{{ title }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useAppsStore } from '../../stores/apps'
import { useDraggable, getViewportBounds } from '../../composables/useDraggable'
import { ICON_SIZES, LAYOUT } from '../../constants/os'
import OsAppIcon from './AppIcon.vue'

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

// Get current icon dimensions
function getIconDimensions() {
  const size = ICON_SIZES[appsStore.iconSize]
  return { width: size.width, height: size.height }
}

// Calculate viewport bounds for dragging
function calculateBounds() {
  const { width, height } = getIconDimensions()
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1280
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768
  
  return {
    minX: 0,
    maxX: viewportWidth - width - LAYOUT.DESKTOP_PADDING,
    minY: 0,
    maxY: viewportHeight - LAYOUT.MENU_BAR_HEIGHT - height,
  }
}

const { isDragging, currentX, currentY, startDrag, setPosition } = useDraggable({
  initialX: props.x ?? 0,
  initialY: props.y ?? 0,
  bounds: calculateBounds(),
  onDragEnd: (data) => {
    emit('move', data)
  },
})

// Update local position when props change
watch(() => props.x, (newX) => {
  if (newX !== undefined) setPosition(newX, currentY.value)
})

watch(() => props.y, (newY) => {
  if (newY !== undefined) setPosition(currentX.value, newY)
})

const positionStyle = computed(() => {
  if (props.x !== undefined && props.y !== undefined) {
    return {
      position: 'absolute' as const,
      left: `${currentX.value}px`,
      top: `${currentY.value}px`,
      opacity: isDragging.value ? 0.6 : 1,
      transition: isDragging.value ? 'none' : 'opacity 0.2s'
    }
  }
  return {}
})

function handleMouseDown(e: MouseEvent) {
  startDrag(e)
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
