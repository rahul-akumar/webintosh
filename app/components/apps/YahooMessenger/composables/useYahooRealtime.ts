import { ref, type Ref } from 'vue'
import {
  collection,
  query,
  onSnapshot,
  where,
  doc,
  limit,
  getDoc
} from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { db } from '../../../../config/firebase'
import type { Channel, Message, DirectMessage, OnlineUser } from '../types/yahooMessenger'

export function useYahooRealtime(
  currentUser: Ref<User | null>,
  notifyMessage: (sender: string, text: string, channel?: string, app?: string) => void
) {
  const currentMessages = ref<Message[]>([])
  const onlineUsers = ref<OnlineUser[]>([])
  const directMessages = ref<DirectMessage[]>([])
  const loading = ref(false)
  const unreadCounts = ref<Record<string, number>>({})
  const lastReadTimestamps = ref<Record<string, number>>({})
  
  const lastMessageIds = new Set<string>()
  
  let messagesUnsubscribe: (() => void) | null = null
  let presenceUnsubscribe: (() => void) | null = null
  let dmUnsubscribe: (() => void) | null = null

  const loadChannelMessages = (
    channelId: string,
    selectedChannelId: string | null,
    onMessagesLoaded: () => void
  ) => {
    if (messagesUnsubscribe) messagesUnsubscribe()

    loading.value = true
    const q = query(
      collection(db, 'messages'),
      where('channelId', '==', channelId),
      limit(100)
    )
    
    messagesUnsubscribe = onSnapshot(q, 
      (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Message))

        messages.sort((a, b) => {
          const timeA = a.timestamp?.toMillis() || 0
          const timeB = b.timestamp?.toMillis() || 0
          return timeA - timeB
        })

        // Check for new messages from other users
        if (!loading.value && currentUser.value) {
          messages.forEach(msg => {
            if (!lastMessageIds.has(msg.id) && msg.userId !== currentUser.value!.uid) {
              if (selectedChannelId !== channelId) {
                if (!unreadCounts.value[channelId]) {
                  unreadCounts.value[channelId] = 0
                }
                const msgTime = msg.timestamp?.toMillis() || Date.now()
                const lastRead = lastReadTimestamps.value[channelId] || 0

                if (msgTime > lastRead) {
                  unreadCounts.value[channelId]++
                }
              }
              lastMessageIds.add(msg.id)
            }
          })
        }

        messages.forEach(msg => lastMessageIds.add(msg.id))
        currentMessages.value = messages
        loading.value = false
        onMessagesLoaded()
      },
      (error) => {
        console.error('Error loading channel messages:', error)
        loading.value = false
        if (error.code === 'permission-denied') {
          alert('Permission denied. Please check Firebase security rules.')
        } else if (error.code === 'failed-precondition') {
          alert('Firebase index required. Check console for index creation link.')
        }
      }
    )
  }

  const loadDirectMessages = (conversationId: string, onMessagesLoaded: () => void) => {
    if (messagesUnsubscribe) messagesUnsubscribe()

    loading.value = true
    const q = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      limit(100)
    )

    messagesUnsubscribe = onSnapshot(q,
      (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Message))

        messages.sort((a, b) => {
          const timeA = a.timestamp?.toMillis() || 0
          const timeB = b.timestamp?.toMillis() || 0
          return timeA - timeB
        })

        // Check for new DM messages from other users
        if (!loading.value && currentUser.value) {
          messages.forEach(msg => {
            if (!lastMessageIds.has(msg.id) && msg.userId !== currentUser.value!.uid) {
              notifyMessage(msg.userName, msg.text, undefined, 'yahooMessenger')
              lastMessageIds.add(msg.id)
            }
          })
        }

        messages.forEach(msg => lastMessageIds.add(msg.id))
        currentMessages.value = messages
        loading.value = false
        onMessagesLoaded()
      },
      (error) => {
        console.error('Error loading direct messages:', error)
        loading.value = false
      }
    )
  }

  const loadOnlineUsers = () => {
    const q = query(
      collection(db, 'users'),
      where('online', '==', true)
    )

    presenceUnsubscribe = onSnapshot(q, (snapshot) => {
      onlineUsers.value = snapshot.docs
        .map(doc => ({
          uid: doc.id,
          ...doc.data()
        } as OnlineUser))
        .filter(user => user.uid !== currentUser.value?.uid)
    })
  }

  const loadDirectMessagesList = async () => {
    if (!currentUser.value) return

    const q = query(
      collection(db, 'directMessages'),
      where('participants', 'array-contains', currentUser.value.uid)
    )

    dmUnsubscribe = onSnapshot(q, async (snapshot) => {
      const dms: DirectMessage[] = []

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data()
        const otherUserId = data.participants.find((id: string) => id !== currentUser.value!.uid)
        const otherUserName = data.participantNames[otherUserId]

        const userDoc = await getDoc(doc(db, 'users', otherUserId))
        const userData = userDoc.data()

        dms.push({
          id: docSnap.id,
          otherUser: otherUserName,
          otherUserId: otherUserId,
          lastMessage: data.lastMessage,
          lastSeen: userData?.lastSeen,
          online: userData?.online || false
        })
      }

      directMessages.value = dms
    })
  }

  const monitorAllChannels = (channels: Channel[]) => {
    channels.forEach(channel => {
      const q = query(
        collection(db, 'messages'),
        where('channelId', '==', channel.id),
        limit(50)
      )

      onSnapshot(q, (snapshot) => {
        if (!currentUser.value) return

        const messages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Message))

        const lastRead = lastReadTimestamps.value[channel.id] || 0
        let unreadCount = 0

        messages.forEach(msg => {
          const msgTime = msg.timestamp?.toMillis() || 0
          if (msg.userId !== currentUser.value!.uid && msgTime > lastRead) {
            unreadCount++
          }
        })

        unreadCounts.value[channel.id] = unreadCount
      })
    })
  }

  const markChannelAsRead = (channelId: string) => {
    unreadCounts.value[channelId] = 0
    lastReadTimestamps.value[channelId] = Date.now()
  }

  const cleanup = () => {
    if (messagesUnsubscribe) messagesUnsubscribe()
    if (presenceUnsubscribe) presenceUnsubscribe()
    if (dmUnsubscribe) dmUnsubscribe()
  }

  return {
    currentMessages,
    onlineUsers,
    directMessages,
    loading,
    unreadCounts,
    lastReadTimestamps,
    loadChannelMessages,
    loadDirectMessages,
    loadOnlineUsers,
    loadDirectMessagesList,
    monitorAllChannels,
    markChannelAsRead,
    cleanup
  }
}
