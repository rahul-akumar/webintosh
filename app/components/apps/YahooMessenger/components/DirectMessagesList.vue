<template>
  <div class="direct-messages-list">
    <div class="section-header">
      DIRECT MESSAGES
      <button class="add-dm-btn" @click="$emit('openNewDM')">+</button>
    </div>
    <div
      v-for="dm in directMessages"
      :key="dm.id"
      :class="['dm-item', { active: selectedDMId === dm.id }]"
      @click="$emit('select', dm)"
    >
      <div class="dm-avatar" :style="{ background: getAvatarColor(dm.otherUser) }">
        {{ getInitials(dm.otherUser) }}
      </div>
      <div class="dm-info">
        <div class="dm-name">{{ dm.otherUser }}</div>
        <div class="dm-status" :class="{ online: dm.online }">
          {{ dm.online ? 'Online' : (dm.lastSeen ? formatTime(dm.lastSeen) : 'offline') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Timestamp } from 'firebase/firestore'
import type { DirectMessage } from '../types/yahooMessenger'

defineProps<{
  directMessages: DirectMessage[]
  selectedDMId: string | null
  getAvatarColor: (name: string) => string
  getInitials: (name: string) => string
  formatTime: (timestamp: Timestamp | null) => string
}>()

defineEmits<{
  select: [dm: DirectMessage]
  openNewDM: []
}>()
</script>
