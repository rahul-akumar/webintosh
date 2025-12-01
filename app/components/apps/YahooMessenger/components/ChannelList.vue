<template>
  <div class="channels-list">
    <div class="section-header">CHANNELS</div>
    <div
      v-for="channel in channels"
      :key="channel.id"
      :class="['channel-item', { active: selectedChannelId === channel.id }]"
      @click="$emit('select', channel)"
    >
      <span class="channel-icon">#</span>
      <span class="channel-name">{{ channel.name }}</span>
      <span v-if="(unreadCounts[channel.id] ?? 0) > 0" class="unread-badge">
        {{ unreadCounts[channel.id] }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Channel } from '../types/yahooMessenger'

defineProps<{
  channels: Channel[]
  selectedChannelId: string | null
  unreadCounts: Record<string, number>
}>()

defineEmits<{
  select: [channel: Channel]
}>()
</script>
