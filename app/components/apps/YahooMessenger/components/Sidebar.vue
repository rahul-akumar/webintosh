<template>
  <div class="sidebar">
    <!-- User Info -->
    <div class="user-info">
      <div class="user-avatar" :style="{ background: getAvatarColor(currentUser?.displayName || '') }">
        {{ getInitials(currentUser?.displayName || '') }}
      </div>
      <div class="user-details">
        <div class="username">{{ currentUser?.displayName }}</div>
        <div class="status-indicator online">Online</div>
      </div>
      <button class="logout-btn" title="Sign Out" @click="$emit('logout')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
      </button>
    </div>

    <!-- Chat Mode Toggle -->
    <div class="chat-mode-toggle">
      <button :class="{ active: chatMode === 'channels' }" @click="$emit('update:chatMode', 'channels')">
        Channels
      </button>
      <button :class="{ active: chatMode === 'direct' }" @click="$emit('update:chatMode', 'direct')">
        Direct Messages
      </button>
    </div>

    <!-- Channels List -->
    <ChannelList
      v-if="chatMode === 'channels'"
      :channels="channels"
      :selected-channel-id="selectedChannel?.id ?? null"
      :unread-counts="unreadCounts"
      @select="$emit('selectChannel', $event)"
    />

    <!-- Direct Messages List -->
    <DirectMessagesList
      v-else
      :direct-messages="directMessages"
      :selected-d-m-id="selectedDM?.id ?? null"
      :get-avatar-color="getAvatarColor"
      :get-initials="getInitials"
      :format-time="formatTime"
      @select="$emit('selectDM', $event)"
      @open-new-d-m="$emit('openNewDM')"
    />

    <!-- Online Users -->
    <OnlineUsersList
      :users="onlineUsers"
      :get-avatar-color="getAvatarColor"
      :get-initials="getInitials"
    />
  </div>
</template>

<script setup lang="ts">
import type { User } from 'firebase/auth'
import type { Timestamp } from 'firebase/firestore'
import type { Channel, DirectMessage, OnlineUser } from '../types/yahooMessenger'
import ChannelList from './ChannelList.vue'
import DirectMessagesList from './DirectMessagesList.vue'
import OnlineUsersList from './OnlineUsersList.vue'

defineProps<{
  currentUser: User | null
  chatMode: 'channels' | 'direct'
  channels: Channel[]
  directMessages: DirectMessage[]
  onlineUsers: OnlineUser[]
  unreadCounts: Record<string, number>
  selectedChannel: Channel | null
  selectedDM: DirectMessage | null
  getAvatarColor: (name: string) => string
  getInitials: (name: string) => string
  formatTime: (timestamp: Timestamp | null) => string
}>()

defineEmits<{
  'update:chatMode': [mode: 'channels' | 'direct']
  selectChannel: [channel: Channel]
  selectDM: [dm: DirectMessage]
  openNewDM: []
  logout: []
}>()
</script>
