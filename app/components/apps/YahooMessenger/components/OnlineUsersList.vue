<template>
  <div class="online-users">
    <div class="section-header">ONLINE NOW ({{ users.length }})</div>
    <div v-for="user in users" :key="user.uid" class="online-user">
      <div class="user-avatar small" :style="{ background: getAvatarColor(user.displayName) }">
        {{ getInitials(user.displayName) }}
      </div>
      <span class="user-name">{{ user.displayName }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { OnlineUser } from '../types/yahooMessenger'

defineProps<{
  users: OnlineUser[]
  getAvatarColor: (name: string) => string
  getInitials: (name: string) => string
}>()
</script>
