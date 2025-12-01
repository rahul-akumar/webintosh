<template>
  <div class="chat-header">
    <template v-if="chatMode === 'channels' && selectedChannel">
      <span class="channel-icon">#</span>
      <span class="chat-title">{{ selectedChannel.name }}</span>
      <span class="chat-description">{{ selectedChannel.description }}</span>
    </template>
    <template v-else-if="chatMode === 'direct' && selectedDM">
      <div class="dm-header-avatar" :style="{ background: getAvatarColor(selectedDM.otherUser) }">
        {{ getInitials(selectedDM.otherUser) }}
      </div>
      <span class="chat-title">{{ selectedDM.otherUser }}</span>
      <span class="chat-status" :class="{ online: selectedDM.online }">
        {{ selectedDM.online ? 'Online' : (selectedDM.lastSeen ? 'Last seen ' + formatTime(selectedDM.lastSeen) : 'Offline') }}
      </span>
    </template>
    <template v-else>
      <span class="chat-title">Select a conversation</span>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Timestamp } from 'firebase/firestore'
import type { Channel, DirectMessage } from '../types/yahooMessenger'

defineProps<{
  chatMode: 'channels' | 'direct'
  selectedChannel: Channel | null
  selectedDM: DirectMessage | null
  getAvatarColor: (name: string) => string
  getInitials: (name: string) => string
  formatTime: (timestamp: Timestamp | null) => string
}>()
</script>
