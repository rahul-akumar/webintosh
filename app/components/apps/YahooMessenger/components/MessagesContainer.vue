<template>
  <div ref="containerRef" class="messages-container">
    <div v-if="!selectedChannel && !selectedDM" class="no-selection">
      <img src="/icons/apps/yahooMessenger.png" alt="Yahoo Messenger" class="watermark">
      <p>Select a channel or start a direct message</p>
    </div>
    <div v-else-if="loading" class="loading">
      Loading messages...
    </div>
    <div v-else>
      <div v-for="message in messages" :key="message.id" class="message">
        <div class="message-avatar" :style="{ background: getAvatarColor(message.userName) }">
          {{ getInitials(message.userName) }}
        </div>
        <div class="message-content">
          <div class="message-header">
            <span class="message-author">{{ message.userName }}</span>
            <span class="message-time">{{ formatTime(message.timestamp) }}</span>
          </div>
          <div class="message-text" :class="{ buzz: message.type === 'buzz' }">
            {{ message.text }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import type { Timestamp } from 'firebase/firestore'
import type { Channel, DirectMessage, Message } from '../types/yahooMessenger'

defineProps<{
  messages: Message[]
  loading: boolean
  selectedChannel: Channel | null
  selectedDM: DirectMessage | null
  getAvatarColor: (name: string) => string
  getInitials: (name: string) => string
  formatTime: (timestamp: Timestamp | null) => string
}>()

const containerRef = ref<HTMLElement>()

const scrollToBottom = () => {
  nextTick(() => {
    if (containerRef.value) {
      containerRef.value.scrollTop = containerRef.value.scrollHeight
    }
  })
}

defineExpose({ scrollToBottom })
</script>
