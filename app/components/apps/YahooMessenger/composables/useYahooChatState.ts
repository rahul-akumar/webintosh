import { ref, computed, type Ref } from 'vue'
import type { User } from 'firebase/auth'
import type { Channel, DirectMessage, OnlineUser } from '../types/yahooMessenger'
import { playMessageSound } from '../types/yahooMessenger'
import {
  sendChannelMessage,
  sendDirectMessage as sendDM,
  createDirectMessage
} from './useFirebase'
import { clearChannelMessages } from '~/utils/clearChatData'

export function useYahooChatState(
  currentUser: Ref<User | null>,
  onlineUsers: Ref<OnlineUser[]>,
  directMessages: Ref<DirectMessage[]>
) {
  const chatMode = ref<'channels' | 'direct'>('channels')
  const selectedChannel = ref<Channel | null>(null)
  const selectedDM = ref<DirectMessage | null>(null)
  const messageText = ref('')
  const showNewDMModal = ref(false)

  const availableUsersForDM = computed(() => {
    return onlineUsers.value.filter(user =>
      user.uid !== currentUser.value?.uid &&
      !directMessages.value.some(dm => dm.otherUserId === user.uid)
    )
  })

  const selectChannel = (
    channel: Channel,
    markAsRead: (channelId: string) => void,
    loadMessages: (channelId: string) => void
  ) => {
    selectedChannel.value = channel
    selectedDM.value = null
    markAsRead(channel.id)
    loadMessages(channel.id)
  }

  const selectDirectMessage = (
    dm: DirectMessage,
    loadMessages: (conversationId: string) => void
  ) => {
    selectedDM.value = dm
    selectedChannel.value = null
    loadMessages(dm.id)
  }

  const startDirectMessage = async (
    user: OnlineUser,
    loadMessages: (conversationId: string) => void
  ) => {
    if (!currentUser.value) return

    const conversationId = await createDirectMessage(currentUser.value, user)

    const newDM: DirectMessage = {
      id: conversationId,
      otherUser: user.displayName,
      otherUserId: user.uid,
      online: true
    }

    directMessages.value.push(newDM)
    selectedDM.value = newDM
    selectedChannel.value = null
    showNewDMModal.value = false

    loadMessages(conversationId)
  }

  const sendMessage = async () => {
    if (!messageText.value.trim() || !currentUser.value) return

    const text = messageText.value.trim()
    messageText.value = ''

    try {
      if (selectedChannel.value) {
        await sendChannelMessage(currentUser.value, selectedChannel.value.id, text)
      } else if (selectedDM.value) {
        await sendDM(currentUser.value, selectedDM.value.id, text)
      }

      playMessageSound()
    } catch (error) {
      console.error('Failed to send message:', error)
      alert('Failed to send message. Check console for details.')
      messageText.value = text
    }
  }

  const sendBuzz = async () => {
    if (!currentUser.value) return

    const buzzText = '🐝 BUZZ! 🐝'

    if (selectedChannel.value) {
      await sendChannelMessage(currentUser.value, selectedChannel.value.id, buzzText, 'buzz')
    } else if (selectedDM.value) {
      await sendDM(currentUser.value, selectedDM.value.id, buzzText, 'buzz')
    }

    playMessageSound()

    // Shake effect
    const chatArea = document.querySelector('.chat-area')
    if (chatArea) {
      chatArea.classList.add('buzz-shake')
      setTimeout(() => {
        chatArea.classList.remove('buzz-shake')
      }, 500)
    }
  }

  const insertEmoji = (emoji: string) => {
    messageText.value += emoji
  }

  const clearCurrentChannel = async (currentMessages: Ref<any[]>) => {
    if (!selectedChannel.value) return

    if (confirm(`Clear all messages in #${selectedChannel.value.name}?`)) {
      try {
        const count = await clearChannelMessages(selectedChannel.value.id)
        currentMessages.value = []
        alert(`Cleared ${count} messages from #${selectedChannel.value.name}`)
      } catch (error) {
        console.error('Failed to clear channel:', error)
        alert('Failed to clear messages. Check console for details.')
      }
    }
  }

  return {
    chatMode,
    selectedChannel,
    selectedDM,
    messageText,
    showNewDMModal,
    availableUsersForDM,
    selectChannel,
    selectDirectMessage,
    startDirectMessage,
    sendMessage,
    sendBuzz,
    insertEmoji,
    clearCurrentChannel
  }
}
