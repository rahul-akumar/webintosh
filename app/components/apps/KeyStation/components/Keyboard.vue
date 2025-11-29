<template>
  <div class="keyboard-container">
    <div class="keyboard">
      <!-- White Keys -->
      <div
        v-for="(note, index) in whiteKeys"
        :key="`white-${index}`"
        :class="['key', 'white-key', { active: activeKeys.has(note.key) }]"
        @mousedown="$emit('noteOn', note)"
        @mouseup="$emit('noteOff', note)"
        @mouseleave="$emit('noteOff', note)"
      >
        <span class="key-label">{{ note.label }}</span>
        <span class="key-note">{{ note.key }}</span>
      </div>

      <!-- Black Keys -->
      <div
        v-for="(note, index) in blackKeys"
        :key="`black-${index}`"
        :class="['key', 'black-key', { active: activeKeys.has(note.key) }]"
        :style="{ left: note.position }"
        @mousedown="$emit('noteOn', note)"
        @mouseup="$emit('noteOff', note)"
        @mouseleave="$emit('noteOff', note)"
      >
        <span class="key-label">{{ note.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PlayableNote } from '../types/keystation'
import { WHITE_KEYS, BLACK_KEYS } from '../types/keystation'

defineProps<{
  activeKeys: Set<string>
}>()

defineEmits<{
  'noteOn': [note: PlayableNote]
  'noteOff': [note: PlayableNote]
}>()

const whiteKeys = WHITE_KEYS
const blackKeys = BLACK_KEYS
</script>
