<template>
  <div class="yahoo-messenger">
    <!-- Login Screen -->
    <LoginScreen
      v-if="!auth.currentUser.value"
      v-model:username="auth.username.value"
      :disabled="!auth.username.value.trim()"
      @submit="login"
    />

    <!-- Main Chat Interface -->
    <div v-else class="chat-interface">
      <!-- Sidebar -->
      <Sidebar
        v-model:chat-mode="chatMode"
        :current-user="auth.currentUser.value"
        :channels="channels"
        :direct-messages="realtime.directMessages.value"
        :online-users="realtime.onlineUsers.value"
        :unread-counts="realtime.unreadCounts.value"
        :selected-channel="selectedChannel"
        :selected-d-m="selectedDM"
        :get-avatar-color="getUserAvatarColor"
        :get-initials="getInitials"
        :format-time="formatTime"
        @select-channel="selectChannel"
        @select-d-m="selectDirectMessage"
        @open-new-d-m="showNewDMModal = true"
        @logout="logout"
      />

      <!-- Chat Area -->
      <div class="chat-area">
        <ChatHeader
          :chat-mode="chatMode"
          :selected-channel="selectedChannel"
          :selected-d-m="selectedDM"
          :get-avatar-color="getUserAvatarColor"
          :get-initials="getInitials"
          :format-time="formatTime"
        />

        <MessagesContainer
          ref="messagesContainerRef"
          :messages="realtime.currentMessages.value"
          :loading="realtime.loading.value"
          :selected-channel="selectedChannel"
          :selected-d-m="selectedDM"
          :get-avatar-color="getUserAvatarColor"
          :get-initials="getInitials"
          :format-time="formatTime"
        />

        <MessageInputBar
          v-if="selectedChannel || selectedDM"
          v-model="messageText"
          :placeholder="`Message ${chatMode === 'channels' ? '#' + selectedChannel?.name : selectedDM?.otherUser}`"
          :emoticons="emoticons"
          @send="sendMessage"
          @buzz="sendBuzz"
          @insert-emoji="insertEmoji"
        />
      </div>
    </div>

    <!-- New Direct Message Modal -->
    <NewDirectMessageModal
      :visible="showNewDMModal"
      :users="availableUsersForDM"
      :get-avatar-color="getUserAvatarColor"
      :get-initials="getInitials"
      @select="startDirectMessage"
      @close="showNewDMModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import type { Channel, DirectMessage, OnlineUser } from './types/yahooMessenger'
import { DEFAULT_CHANNELS, EMOTICONS, getInitials, formatTime, playMessageSound } from './types/yahooMessenger'
import { sendChannelMessage, sendDirectMessage, createDirectMessage } from './composables/useFirebase'
import { useNotifications } from '~/composables/useNotifications'
import { useGlobalChat } from '~/composables/useGlobalChat'

// Components
import LoginScreen from './components/LoginScreen.vue'
import Sidebar from './components/Sidebar.vue'
import ChatHeader from './components/ChatHeader.vue'
import MessagesContainer from './components/MessagesContainer.vue'
import MessageInputBar from './components/MessageInputBar.vue'
import NewDirectMessageModal from './components/NewDirectMessageModal.vue'

// Composables
import { useYahooAuth } from './composables/useYahooAuth'
import { useYahooRealtime } from './composables/useYahooRealtime'
import { usePresence } from './composables/usePresence'
import { useYahooMenu } from './composables/useYahooMenu'

// Initialize composables
const { notifyMessage } = useNotifications()
const { setAppOpen } = useGlobalChat()

const auth = useYahooAuth()
const realtime = useYahooRealtime(auth.currentUser, notifyMessage)
const presence = usePresence(auth.currentUser)

// Local state
const channels = DEFAULT_CHANNELS
const emoticons = EMOTICONS
const chatMode = ref<'channels' | 'direct'>('channels')
const selectedChannel = ref<Channel | null>(null)
const selectedDM = ref<DirectMessage | null>(null)
const messageText = ref('')
const showNewDMModal = ref(false)
const messagesContainerRef = ref<InstanceType<typeof MessagesContainer> | null>(null)

// Computed
const availableUsersForDM = computed(() => {
  return realtime.onlineUsers.value.filter(user =>
    user.uid !== auth.currentUser.value?.uid &&
    !realtime.directMessages.value.some(dm => dm.otherUserId === user.uid)
  )
})

// Scroll helper
const scrollToBottom = () => {
  messagesContainerRef.value?.scrollToBottom()
}

// Channel/DM selection handlers
const selectChannel = (channel: Channel) => {
  selectedChannel.value = channel
  selectedDM.value = null
  realtime.markChannelAsRead(channel.id)
  realtime.loadChannelMessages(channel.id, selectedChannel.value?.id ?? null, scrollToBottom)
}

const selectDirectMessage = (dm: DirectMessage) => {
  selectedDM.value = dm
  selectedChannel.value = null
  realtime.loadDirectMessages(dm.id, scrollToBottom)
}

const startDirectMessage = async (user: OnlineUser) => {
  if (!auth.currentUser.value) return

  const conversationId = await createDirectMessage(auth.currentUser.value, user)

  const newDM: DirectMessage = {
    id: conversationId,
    otherUser: user.displayName,
    otherUserId: user.uid,
    online: true
  }

  realtime.directMessages.value.push(newDM)
  selectedDM.value = newDM
  selectedChannel.value = null
  showNewDMModal.value = false

  realtime.loadDirectMessages(conversationId, scrollToBottom)
}

// Message sending
const sendMessage = async () => {
  if (!messageText.value.trim() || !auth.currentUser.value) return

  const text = messageText.value.trim()
  messageText.value = ''

  try {
    if (selectedChannel.value) {
      await sendChannelMessage(auth.currentUser.value, selectedChannel.value.id, text)
    } else if (selectedDM.value) {
      await sendDirectMessage(auth.currentUser.value, selectedDM.value.id, text)
    }

    playMessageSound()
  } catch (error) {
    console.error('Failed to send message:', error)
    alert('Failed to send message. Check console for details.')
    messageText.value = text
  }
}

const sendBuzz = async () => {
  if (!auth.currentUser.value) return

  const buzzText = '🐝 BUZZ! 🐝'

  if (selectedChannel.value) {
    await sendChannelMessage(auth.currentUser.value, selectedChannel.value.id, buzzText, 'buzz')
  } else if (selectedDM.value) {
    await sendDirectMessage(auth.currentUser.value, selectedDM.value.id, buzzText, 'buzz')
  }

  playMessageSound()

  // Shake effect
  const chatArea = document.querySelector('.chat-area')
  if (chatArea) {
    chatArea.classList.add('buzz-shake')
    setTimeout(() => chatArea.classList.remove('buzz-shake'), 500)
  }
}

const insertEmoji = (emoji: string) => {
  messageText.value += emoji
}

const clearCurrentChannel = async () => {
  if (!selectedChannel.value) return

  if (confirm(`Clear all messages in #${selectedChannel.value.name}?`)) {
    try {
      const { clearChannelMessages } = await import('~/utils/clearChatData')
      const count = await clearChannelMessages(selectedChannel.value.id)
      realtime.currentMessages.value = []
      alert(`Cleared ${count} messages from #${selectedChannel.value.name}`)
    } catch (error) {
      console.error('Failed to clear channel:', error)
      alert('Failed to clear messages. Check console for details.')
    }
  }
}

// Avatar color generation
const getUserAvatarColor = (name: string | undefined): string => {
  if (!name) return '#ffd700'

  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#48C9B0',
    '#FD79A8', '#A29BFE', '#6C5CE7', '#00B894', '#FDCB6E', '#E17055',
    '#74B9FF', '#A8E6CF', '#FFB6B9', '#95E1D3'
  ]

  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }

  return colors[Math.abs(hash) % colors.length] ?? '#ffd700'
}

// Login handler
const login = async () => {
  try {
    await auth.login()
    presence.startPresenceUpdates()
  } catch {
    // Error already handled in useYahooAuth
  }
}

// Logout handler
const logout = async () => {
  await auth.logout()
  realtime.cleanup()
  presence.stopPresenceUpdates()
}

// Menu registration
const menu = useYahooMenu({
  logout,
  showNewDMModal,
  selectChannel,
  channels,
  chatMode,
  clearCurrentChannel,
  sendBuzz,
  insertEmoji
})

// Lifecycle
onMounted(() => {
  menu.registerMenuCommands()

  nextTick(() => {
    setAppOpen(true)
  })

  auth.setupAuthListener(() => {
    realtime.loadOnlineUsers()
    realtime.loadDirectMessagesList()
    realtime.monitorAllChannels(channels)
    if (channels[0]) selectChannel(channels[0])
  })
})

onUnmounted(() => {
  setAppOpen(false)
  realtime.cleanup()
  presence.stopPresenceUpdates()
  presence.markOffline()
})

// Watch for logout to mark user offline
watch(() => auth.currentUser.value, async (newUser, oldUser) => {
  if (oldUser && !newUser) {
    await presence.markOffline()
  }
})
</script>

<style>
@import './styles/yahooMessenger.css';
</style>
