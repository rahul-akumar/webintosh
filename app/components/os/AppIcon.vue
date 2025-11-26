<template>
  <img 
    v-if="iconUrl && !iconError" 
    :src="iconUrl" 
    :alt="alt" 
    class="app-icon app-icon-svg" 
    :class="sizeClass"
    aria-hidden="true" 
    @error="iconError = true"
  >
  <span 
    v-else 
    class="app-icon app-icon-emoji" 
    :class="sizeClass"
    aria-hidden="true"
  >{{ emoji || '🗂️' }}</span>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAssetUrl } from '../../composables/useAssetUrl'

defineOptions({ name: 'OsAppIcon' })

const props = withDefaults(defineProps<{
  /** Path to SVG/image icon */
  icon?: string
  /** Fallback emoji when icon fails to load */
  emoji?: string
  /** Alt text for image */
  alt?: string
  /** Size variant */
  size?: 'small' | 'medium' | 'large' | 'dock'
}>(), {
  emoji: '🗂️',
  alt: '',
  size: 'medium',
})

const iconError = ref(false)
const iconUrl = computed(() => useAssetUrl(props.icon))
const sizeClass = computed(() => `app-icon-${props.size}`)
</script>

<style scoped>
.app-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* SVG/Image icon base */
.app-icon-svg {
  object-fit: contain;
}

/* Emoji icon base */
.app-icon-emoji {
  line-height: 1;
}

/* Size variants */
.app-icon-small.app-icon-svg {
  width: 22px;
  height: 22px;
}
.app-icon-small.app-icon-emoji {
  font-size: 22px;
}

.app-icon-medium.app-icon-svg {
  width: 28px;
  height: 28px;
}
.app-icon-medium.app-icon-emoji {
  font-size: 28px;
}

.app-icon-large.app-icon-svg {
  width: 36px;
  height: 36px;
}
.app-icon-large.app-icon-emoji {
  font-size: 36px;
}

.app-icon-dock.app-icon-svg {
  width: 26px;
  height: 26px;
}
.app-icon-dock.app-icon-emoji {
  font-size: 26px;
}
</style>
