<template>
  <div v-if="visible" class="modal-overlay" @click="$emit('close')">
    <div class="modal" @click.stop>
      <h3>Start Direct Message</h3>
      <p>Select a user to message:</p>
      <div class="user-list">
        <div
          v-for="user in users"
          :key="user.uid"
          class="user-option"
          @click="$emit('select', user)"
        >
          <div class="user-avatar" :style="{ background: getAvatarColor(user.displayName) }">
            {{ getInitials(user.displayName) }}
          </div>
          <span>{{ user.displayName }}</span>
        </div>
      </div>
      <button class="cancel-btn" @click="$emit('close')">Cancel</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { OnlineUser } from '../types/yahooMessenger'

defineProps<{
  visible: boolean
  users: OnlineUser[]
  getAvatarColor: (name: string) => string
  getInitials: (name: string) => string
}>()

defineEmits<{
  select: [user: OnlineUser]
  close: []
}>()
</script>
