<template>
  <div class="yahoo-messenger">
    <!-- Login Screen -->
    <div v-if="!currentUser" class="login-screen">
      <div class="login-box">
        <img src="/icons/apps/yahooMessenger.png" alt="Yahoo Messenger" class="logo">
        <h2>Yahoo! Messenger</h2>
        <p>Enter your name to join</p>
        <input 
          v-model="username" 
          @keyup.enter="login"
          placeholder="Your name"
          class="username-input"
        >
        <button @click="login" :disabled="!username.trim()" class="login-btn">
          Sign In
        </button>
      </div>
    </div>

    <!-- Main Chat Interface -->
    <div v-else class="chat-interface">
      <!-- Sidebar -->
      <div class="sidebar">
        <div class="user-info">
          <div class="user-avatar">{{ getInitials(currentUser.displayName || '') }}</div>
          <div class="user-details">
            <div class="username">{{ currentUser.displayName }}</div>
            <div class="status-indicator online">Online</div>
          </div>
          <button @click="logout" class="logout-btn" title="Sign Out">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>

        <!-- Chat Mode Toggle -->
        <div class="chat-mode-toggle">
          <button 
            @click="chatMode = 'channels'" 
            :class="{ active: chatMode === 'channels' }"
          >
            Channels
          </button>
          <button 
            @click="chatMode = 'direct'" 
            :class="{ active: chatMode === 'direct' }"
          >
            Direct Messages
          </button>
        </div>

        <!-- Channels List -->
        <div v-if="chatMode === 'channels'" class="channels-list">
          <div class="section-header">CHANNELS</div>
          <div 
            v-for="channel in channels" 
            :key="channel.id"
            @click="selectChannel(channel)"
            :class="['channel-item', { active: selectedChannel?.id === channel.id }]"
          >
            <span class="channel-icon">#</span>
            <span class="channel-name">{{ channel.name }}</span>
            <span v-if="(unreadCounts[channel.id] ?? 0) > 0" class="unread-badge">{{ unreadCounts[channel.id] }}</span>
          </div>
        </div>

        <!-- Direct Messages List -->
        <div v-else class="direct-messages-list">
          <div class="section-header">
            DIRECT MESSAGES
            <button @click="showNewDMModal = true" class="add-dm-btn">+</button>
          </div>
          <div 
            v-for="dm in directMessages" 
            :key="dm.id"
            @click="selectDirectMessage(dm)"
            :class="['dm-item', { active: selectedDM?.id === dm.id }]"
          >
            <div class="dm-avatar">{{ getInitials(dm.otherUser) }}</div>
            <div class="dm-info">
              <div class="dm-name">{{ dm.otherUser }}</div>
              <div class="dm-status" :class="{ online: dm.online }">
                {{ dm.online ? 'Online' : getTimeAgo(dm.lastSeen || null) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Online Users -->
        <div class="online-users">
          <div class="section-header">ONLINE NOW ({{ onlineUsers.length }})</div>
          <div v-for="user in onlineUsers" :key="user.uid" class="online-user">
            <div class="user-avatar small">{{ getInitials(user.displayName) }}</div>
            <span class="user-name">{{ user.displayName }}</span>
          </div>
        </div>
      </div>

      <!-- Chat Area -->
      <div class="chat-area">
        <!-- Chat Header -->
        <div class="chat-header">
          <template v-if="chatMode === 'channels' && selectedChannel">
            <span class="channel-icon">#</span>
            <span class="chat-title">{{ selectedChannel.name }}</span>
            <span class="chat-description">{{ selectedChannel.description }}</span>
          </template>
          <template v-else-if="chatMode === 'direct' && selectedDM">
            <div class="dm-header-avatar">{{ getInitials(selectedDM.otherUser) }}</div>
            <span class="chat-title">{{ selectedDM.otherUser }}</span>
            <span class="chat-status" :class="{ online: selectedDM.online }">
              {{ selectedDM.online ? 'Online' : 'Last seen ' + getTimeAgo(selectedDM.lastSeen || null) }}
            </span>
          </template>
          <template v-else>
            <span class="chat-title">Select a conversation</span>
          </template>
        </div>

        <!-- Messages -->
        <div ref="messagesContainer" class="messages-container">
          <div v-if="!selectedChannel && !selectedDM" class="no-selection">
            <img src="/icons/apps/yahooMessenger.png" alt="Yahoo Messenger" class="watermark">
            <p>Select a channel or start a direct message</p>
          </div>
          <div v-else-if="loading" class="loading">
            Loading messages...
          </div>
          <div v-else>
            <div v-for="message in currentMessages" :key="message.id" class="message">
              <div class="message-avatar">{{ getInitials(message.userName) }}</div>
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

        <!-- Message Input -->
        <div v-if="selectedChannel || selectedDM" class="message-input-container">
          <div class="emoticons">
            <button 
              v-for="emoji in emoticons" 
              :key="emoji"
              @click="insertEmoji(emoji)"
              class="emoji-btn"
            >
              {{ emoji }}
            </button>
          </div>
          <div class="input-row">
            <button @click="sendBuzz" class="buzz-btn" title="Send BUZZ!">
              BUZZ!
            </button>
            <input 
              v-model="messageText"
              @keyup.enter="sendMessage"
              :placeholder="`Message ${chatMode === 'channels' ? '#' + selectedChannel?.name : selectedDM?.otherUser}`"
              class="message-input"
            >
            <button @click="sendMessage" :disabled="!messageText.trim()" class="send-btn">
              Send
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- New Direct Message Modal -->
    <div v-if="showNewDMModal" class="modal-overlay" @click="showNewDMModal = false">
      <div class="modal" @click.stop>
        <h3>Start Direct Message</h3>
        <p>Select a user to message:</p>
        <div class="user-list">
          <div 
            v-for="user in availableUsersForDM" 
            :key="user.uid"
            @click="startDirectMessage(user)"
            class="user-option"
          >
            <div class="user-avatar">{{ getInitials(user.displayName) }}</div>
            <span>{{ user.displayName }}</span>
          </div>
        </div>
        <button @click="showNewDMModal = false" class="cancel-btn">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  where, 
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  limit
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { db, auth } from '../../../../config/firebase';
import type {
  Channel,
  Message,
  DirectMessage,
  OnlineUser
} from './yahooMessenger';
import {
  defaultChannels,
  emoticons,
  getInitials,
  formatTime,
  getTimeAgo,
  playMessageSound,
  loginUser,
  logoutUser,
  sendChannelMessage,
  sendDirectMessage,
  createDirectMessage,
  updateUserPresence
} from './yahooMessenger';
import { useNotifications } from '~/composables/useNotifications';
import { useGlobalChat } from '~/composables/useGlobalChat';
import { clearChannelMessages } from '~/composables/clearChatData';
import { createYahooMessengerMenuTemplate } from './yahooMessengerMenu';
import { useMenuCommand } from '~/composables/menuCommands';
import { useOSStore } from '../../../../stores/os';

// State
const currentUser = ref<User | null>(null);
const username = ref('');
const chatMode = ref<'channels' | 'direct'>('channels');
const selectedChannel = ref<Channel | null>(null);
const selectedDM = ref<DirectMessage | null>(null);
const messageText = ref('');
const currentMessages = ref<Message[]>([]);
const onlineUsers = ref<OnlineUser[]>([]);
const directMessages = ref<DirectMessage[]>([]);
const loading = ref(false);
const showNewDMModal = ref(false);
const messagesContainer = ref<HTMLElement>();
const channels = defaultChannels;
const unreadCounts = ref<Record<string, number>>({});
const lastReadTimestamps = ref<Record<string, number>>({});

// Notifications
const { notifyMessage } = useNotifications();
const { setAppOpen } = useGlobalChat();
const lastMessageIds = new Set<string>();

// Subscriptions
let messagesUnsubscribe: (() => void) | null = null;
let presenceUnsubscribe: (() => void) | null = null;
let dmUnsubscribe: (() => void) | null = null;
let presenceInterval: NodeJS.Timeout | null = null;

// Computed
const availableUsersForDM = computed(() => {
  return onlineUsers.value.filter(user => 
    user.uid !== currentUser.value?.uid &&
    !directMessages.value.some(dm => dm.otherUserId === user.uid)
  );
});

// Methods
const login = async () => {
  if (!username.value.trim()) return;
  
  try {
    await loginUser(username.value);
    startPresenceUpdates();
  } catch (error: any) {
    console.error('Login error:', error);
    let errorMessage = 'Failed to sign in. ';
    
    if (error.code === 'permission-denied') {
      errorMessage += 'Firebase permissions error. Please check Firestore rules.';
    } else if (error.code === 'unavailable') {
      errorMessage += 'Firebase is unavailable. Check your internet connection.';
    } else {
      errorMessage += error.message || 'Please try again.';
    }
    
    alert(errorMessage);
  }
};

const logout = async () => {
  if (currentUser.value) {
    await logoutUser(currentUser.value.uid);
    cleanupSubscriptions();
  }
};

const selectChannel = (channel: Channel) => {
  selectedChannel.value = channel;
  selectedDM.value = null;
  // Clear unread count for this channel
  unreadCounts.value[channel.id] = 0;
  // Update last read timestamp to current time
  lastReadTimestamps.value[channel.id] = Date.now();
  loadChannelMessages(channel.id);
};

const selectDirectMessage = (dm: DirectMessage) => {
  selectedDM.value = dm;
  selectedChannel.value = null;
  loadDirectMessages(dm.id);
};

const startDirectMessage = async (user: OnlineUser) => {
  if (!currentUser.value) return;
  
  const conversationId = await createDirectMessage(currentUser.value, user);
  
  const newDM: DirectMessage = {
    id: conversationId,
    otherUser: user.displayName,
    otherUserId: user.uid,
    online: true
  };
  
  directMessages.value.push(newDM);
  selectedDM.value = newDM;
  selectedChannel.value = null;
  showNewDMModal.value = false;
  
  loadDirectMessages(conversationId);
};

const loadChannelMessages = (channelId: string) => {
  if (messagesUnsubscribe) messagesUnsubscribe();
  
  loading.value = true;
  // Remove orderBy initially to avoid issues with null timestamps
  const q = query(
    collection(db, 'messages'),
    where('channelId', '==', channelId),
    limit(100)
  );

  messagesUnsubscribe = onSnapshot(q, 
    (snapshot) => {
      console.log(`Received ${snapshot.docs.length} messages for channel ${channelId}`);
      const messages = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Message data:', data);
        return {
          id: doc.id,
          ...data
        } as Message;
      });
      
      // Sort messages client-side
      messages.sort((a, b) => {
        const timeA = a.timestamp?.toMillis() || 0;
        const timeB = b.timestamp?.toMillis() || 0;
        return timeA - timeB;
      });
      
      // Check for new messages from other users
      if (!loading.value && currentUser.value) {
        messages.forEach(msg => {
          if (!lastMessageIds.has(msg.id) && 
              msg.userId !== currentUser.value!.uid) {
            // Only increment unread count if this channel is not currently selected
            if (selectedChannel.value?.id !== channelId) {
              if (!unreadCounts.value[channelId]) {
                unreadCounts.value[channelId] = 0;
              }
              const msgTime = msg.timestamp?.toMillis() || Date.now();
              const lastRead = lastReadTimestamps.value[channelId] || 0;
              
              // Only count as unread if message is newer than last read time
              if (msgTime > lastRead) {
                unreadCounts.value[channelId]++;
              }
            }
            lastMessageIds.add(msg.id);
          }
        });
      }
      
      // Update message IDs set
      messages.forEach(msg => lastMessageIds.add(msg.id));
      
      currentMessages.value = messages;
      loading.value = false;
      scrollToBottom();
    },
    (error) => {
      console.error('Error loading channel messages:', error);
      loading.value = false;
      if (error.code === 'permission-denied') {
        alert('Permission denied. Please check Firebase security rules.');
      } else if (error.code === 'failed-precondition') {
        alert('Firebase index required. Check console for index creation link.');
      }
    }
  );
};

const loadDirectMessages = (conversationId: string) => {
  if (messagesUnsubscribe) messagesUnsubscribe();
  
  loading.value = true;
  // Remove orderBy initially to avoid issues with null timestamps
  const q = query(
    collection(db, 'messages'),
    where('conversationId', '==', conversationId),
    limit(100)
  );

  messagesUnsubscribe = onSnapshot(q, 
    (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Message));
      
      // Sort messages client-side
      messages.sort((a, b) => {
        const timeA = a.timestamp?.toMillis() || 0;
        const timeB = b.timestamp?.toMillis() || 0;
        return timeA - timeB;
      });
      
      // Check for new DM messages from other users
      if (!loading.value && currentUser.value) {
        messages.forEach(msg => {
          if (!lastMessageIds.has(msg.id) && 
              msg.userId !== currentUser.value!.uid) {
            // Show notification for new DM
            notifyMessage(
              msg.userName,
              msg.text,
              undefined, // No channel for DMs
              'yahooMessenger'
            );
            lastMessageIds.add(msg.id);
          }
        });
      }
      
      // Update message IDs set
      messages.forEach(msg => lastMessageIds.add(msg.id));
      
      currentMessages.value = messages;
      loading.value = false;
      scrollToBottom();
    },
    (error) => {
      console.error('Error loading direct messages:', error);
      loading.value = false;
    }
  );
};

const sendMessage = async () => {
  if (!messageText.value.trim() || !currentUser.value) return;
  
  const text = messageText.value.trim();
  messageText.value = '';
  
  try {
    if (selectedChannel.value) {
      console.log('Sending to channel:', selectedChannel.value.id);
      await sendChannelMessage(currentUser.value, selectedChannel.value.id, text);
    } else if (selectedDM.value) {
      console.log('Sending DM to:', selectedDM.value.id);
      await sendDirectMessage(currentUser.value, selectedDM.value.id, text);
    }
    
    playMessageSound();
  } catch (error) {
    console.error('Failed to send message:', error);
    alert('Failed to send message. Check console for details.');
    messageText.value = text; // Restore message on error
  }
};

const sendBuzz = async () => {
  if (!currentUser.value) return;
  
  const buzzText = '🐝 BUZZ! 🐝';
  
  if (selectedChannel.value) {
    await sendChannelMessage(currentUser.value, selectedChannel.value.id, buzzText, 'buzz');
  } else if (selectedDM.value) {
    await sendDirectMessage(currentUser.value, selectedDM.value.id, buzzText, 'buzz');
  }
  
  playMessageSound();
  
  // Shake effect
  const chatArea = document.querySelector('.chat-area');
  if (chatArea) {
    chatArea.classList.add('buzz-shake');
    setTimeout(() => {
      chatArea.classList.remove('buzz-shake');
    }, 500);
  }
};

const insertEmoji = (emoji: string) => {
  messageText.value += emoji;
};

const clearCurrentChannel = async () => {
  if (!selectedChannel.value) return;
  
  if (confirm(`Clear all messages in #${selectedChannel.value.name}?`)) {
    try {
      const count = await clearChannelMessages(selectedChannel.value.id);
      currentMessages.value = [];
      alert(`Cleared ${count} messages from #${selectedChannel.value.name}`);
    } catch (error) {
      console.error('Failed to clear channel:', error);
      alert('Failed to clear messages. Check console for details.');
    }
  }
};

const loadOnlineUsers = () => {
  const q = query(
    collection(db, 'users'),
    where('online', '==', true)
  );

  presenceUnsubscribe = onSnapshot(q, (snapshot) => {
    onlineUsers.value = snapshot.docs
      .map(doc => ({
        uid: doc.id,
        ...doc.data()
      } as OnlineUser))
      .filter(user => user.uid !== currentUser.value?.uid);
  });
};

const loadDirectMessagesList = async () => {
  if (!currentUser.value) return;
  
  const q = query(
    collection(db, 'directMessages'),
    where('participants', 'array-contains', currentUser.value.uid)
  );

  dmUnsubscribe = onSnapshot(q, async (snapshot) => {
    const dms: DirectMessage[] = [];
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const otherUserId = data.participants.find((id: string) => id !== currentUser.value!.uid);
      const otherUserName = data.participantNames[otherUserId];
      
      // Check if other user is online
      const userDoc = await getDoc(doc(db, 'users', otherUserId));
      const userData = userDoc.data();
      
      dms.push({
        id: docSnap.id,
        otherUser: otherUserName,
        otherUserId: otherUserId,
        lastMessage: data.lastMessage,
        lastSeen: userData?.lastSeen,
        online: userData?.online || false
      });
    }
    
    directMessages.value = dms;
  });
};

const startPresenceUpdates = () => {
  if (!currentUser.value) return;
  
  presenceInterval = setInterval(async () => {
    if (currentUser.value) {
      await updateUserPresence(currentUser.value.uid);
    }
  }, 30000);
};

const cleanupSubscriptions = () => {
  if (messagesUnsubscribe) messagesUnsubscribe();
  if (presenceUnsubscribe) presenceUnsubscribe();
  if (dmUnsubscribe) dmUnsubscribe();
  if (presenceInterval) clearInterval(presenceInterval);
};

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

// Monitor all channels for unread messages
const monitorAllChannels = () => {
  channels.forEach(channel => {
    // Don't monitor the currently selected channel
    if (selectedChannel.value?.id === channel.id) return;
    
    const q = query(
      collection(db, 'messages'),
      where('channelId', '==', channel.id),
      limit(50)
    );
    
    onSnapshot(q, (snapshot) => {
      if (!currentUser.value) return;
      
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Message));
      
      // Count unread messages for this channel
      const lastRead = lastReadTimestamps.value[channel.id] || 0;
      let unreadCount = 0;
      
      messages.forEach(msg => {
        const msgTime = msg.timestamp?.toMillis() || 0;
        if (msg.userId !== currentUser.value!.uid && msgTime > lastRead) {
          unreadCount++;
        }
      });
      
      unreadCounts.value[channel.id] = unreadCount;
    });
  });
};

// Register menu command handlers
const registerMenuCommands = () => {
  const { register } = useMenuCommand();
  
  // Conversations menu commands
  register('yahooMessenger.signOut', () => {
    logout();
  });
  
  register('yahooMessenger.newMessage', () => {
    showNewDMModal.value = true;
  });
  
  register('yahooMessenger.joinChannel', () => {
    if (channels[0]) selectChannel(channels[0]);
  });
  
  register('yahooMessenger.switchChannel', (args: any) => {
    const channel = channels.find(c => c.id === args.channel);
    if (channel) selectChannel(channel);
  });
  
  register('yahooMessenger.showDirectMessages', () => {
    chatMode.value = 'direct';
  });
  
  register('yahooMessenger.clearChat', () => {
    clearCurrentChannel();
  });
  
  // Status menu commands
  register('yahooMessenger.setStatus', (args: any) => {
    // TODO: Implement status changes
    console.log('Set status to:', args.status);
  });
  
  // Tools menu commands
  register('yahooMessenger.sendBuzz', () => {
    sendBuzz();
  });
  
  register('yahooMessenger.insertEmoticon', (args: any) => {
    insertEmoji(args.emoticon);
  });
  
  register('yahooMessenger.toggleSounds', () => {
    // TODO: Implement sound toggle
    console.log('Toggle sounds');
  });
  
  register('yahooMessenger.toggleNotifications', () => {
    // TODO: Implement notification toggle
    console.log('Toggle notifications');
  });
  
  // View menu commands
  register('yahooMessenger.toggleSidebar', () => {
    // TODO: Implement sidebar toggle
    console.log('Toggle sidebar');
  });
  
  register('yahooMessenger.toggleOnlineUsers', () => {
    // TODO: Implement online users toggle
    console.log('Toggle online users');
  });
  
  // Help menu commands
  register('yahooMessenger.showAbout', () => {
    // TODO: Implement about dialog
    console.log('Show about');
  });
};

// Lifecycle
onMounted(() => {
  // Register menu commands
  registerMenuCommands();
  
  // Only mark app as open after component is actually mounted
  nextTick(() => {
    setAppOpen(true);
  });
  
  onAuthStateChanged(auth, (user) => {
    currentUser.value = user;
    if (user) {
      loadOnlineUsers();
      loadDirectMessagesList();
      monitorAllChannels(); // Start monitoring all channels
      if (channels[0]) selectChannel(channels[0]); // Select general channel by default
    }
  });
});

onUnmounted(() => {
  // Mark app as closed when component unmounts
  setAppOpen(false);
  
  cleanupSubscriptions();
  
  if (currentUser.value) {
    updateDoc(doc(db, 'users', currentUser.value.uid), {
      online: false,
      lastSeen: serverTimestamp()
    }).catch(() => {});
  }
});

// Watch for logout
watch(() => currentUser.value, async (newUser, oldUser) => {
  if (oldUser && !newUser) {
    await updateDoc(doc(db, 'users', oldUser.uid), {
      online: false,
      lastSeen: serverTimestamp()
    }).catch(() => {});
  }
});
</script>

<style scoped>
@import './yahooClassic.css';
</style>