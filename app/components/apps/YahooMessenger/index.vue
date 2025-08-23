<template>
    <div class="yahoo-messenger">
      <!-- Header -->
      <div class="ym-header">
        <img src="/icons/apps/yahooMessenger.png" alt="Y!" class="ym-logo">
        <span class="ym-title">Yahoo! Messenger</span>
        <div class="ym-status">
          <span class="status-indicator online"></span>
          Online
        </div>
      </div>
  
      <div class="ym-main">
        <!-- Sidebar -->
        <div class="ym-sidebar">
          <!-- User Section -->
          <div class="user-section">
            <div class="user-setup" v-if="!userName">
              <input 
                v-model="nameInput"
                @keyup.enter="setUserName"
                type="text" 
                placeholder="Enter your name"
                class="name-input"
              >
              <button @click="setUserName" class="set-name-btn">Join</button>
            </div>
            <div v-else class="user-item active">
              <span class="user-avatar">😊</span>
              <span class="user-name">{{ userName }}</span>
              <span class="status-dot online"></span>
            </div>
          </div>
  
          <div class="section-divider"></div>
  
          <!-- Online Users -->
          <div class="users-section" v-if="userName">
            <h4 class="section-title">Online</h4>
            <div class="user-item">
              <span class="user-avatar">👤</span>
              <span class="user-name">Rahul</span>
              <span class="status-dot online"></span>
            </div>
            <div 
              v-for="user in onlineUsers" 
              :key="user"
              class="user-item"
              v-show="user !== userName"
            >
              <span class="user-avatar">👥</span>
              <span class="user-name">{{ user }}</span>
              <span class="status-dot online"></span>
            </div>
          </div>
  
          <div class="section-divider" v-if="userName"></div>
  
          <!-- Channels Section -->
          <div class="channels-section" v-if="userName">
            <h4 class="section-title">Channels</h4>
            <div 
              v-for="channel in channels" 
              :key="channel.id"
              @click="selectChannel(channel)"
              class="channel-item"
              :class="{ active: currentChannel?.id === channel.id }"
            >
              <span class="channel-icon">#</span>
              <span class="channel-name">{{ channel.name }}</span>
            </div>
          </div>
        </div>
  
        <!-- Chat Area -->
        <div class="ym-chat-area">
          <template v-if="currentChannel && userName">
            <!-- Chat Header -->
            <div class="chat-header">
              <span class="channel-icon">#</span>
              <span class="channel-title">{{ currentChannel.name }}</span>
              <span class="channel-topic">{{ currentChannel.topic }}</span>
            </div>
  
            <!-- Messages -->
            <div class="chat-messages" ref="messagesContainer">
              <div 
                v-for="(msg, index) in messages" 
                :key="index"
                class="message"
                :class="{ 'own': msg.sender === userName }"
              >
                <div class="message-avatar">{{ msg.avatar }}</div>
                <div class="message-content">
                  <div class="message-header">
                    <span class="message-sender">{{ msg.sender }}</span>
                    <span class="message-time">{{ formatTime(msg.timestamp) }}</span>
                  </div>
                  <div class="message-text">{{ msg.text }}</div>
                </div>
              </div>
            </div>
  
            <!-- Input Area -->
            <div class="chat-input-area">
              <div class="emoticons">
                <button 
                  v-for="emoji in emoticons" 
                  :key="emoji"
                  @click="insertEmoticon(emoji)"
                  class="emoji-btn"
                >
                  {{ emoji }}
                </button>
              </div>
              <div class="input-row">
                <input 
                  v-model="messageInput"
                  @keyup.enter="sendMessage"
                  type="text"
                  :placeholder="`Message #${currentChannel.name}`"
                  class="message-input"
                >
                <button @click="sendMessage" class="send-button">Send</button>
                <button @click="sendBuzz" class="buzz-button">BUZZ!!</button>
              </div>
            </div>
          </template>
  
          <!-- Welcome Screen -->
          <div v-else class="welcome-screen">
            <img src="/icons/apps/yahooMessenger.png" alt="Y!" class="welcome-logo">
            <h2>Welcome to Yahoo! Messenger</h2>
            <p v-if="!userName">Enter your name to start chatting</p>
            <p v-else>Select a channel to start chatting</p>
          </div>
        </div>
      </div>
  
      <!-- Audio elements for sounds -->
      <audio ref="messageSound" preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhCTGH0fPTgjMGHm7A7+OZURE" type="audio/wav">
      </audio>
      <audio ref="buzzSound" preload="auto">
        <source src="data:audio/wav;base64,UklGRr4EAABXQVZFZm10IBAAAAABAAEAiBUAAIgVAAACABAAZGF0YQoEAAD//////////0BA/////////0BA//////////9AQP////////9AQP//////////QED/////////QED//////////0BA/////////0BA//////////9AQP////////9AQP//////////QED/////////QED//////////0BA/////////0BA" type="audio/wav">
      </audio>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
  
  interface Message {
    text: string
    sender: string
    avatar: string
    timestamp: number
    id?: string
  }
  
  interface Channel {
    id: string
    name: string
    topic: string
  }
  
  // State
  const userName = ref('')
  const nameInput = ref('')
  const messageInput = ref('')
  const currentChannel = ref<Channel | null>(null)
  const messages = ref<Message[]>([])
  const onlineUsers = ref<string[]>([])
  const messagesContainer = ref<HTMLElement>()
  const messageSound = ref<HTMLAudioElement>()
  const buzzSound = ref<HTMLAudioElement>()
  
  // Gun instance
  let gun: any = null
  let channelRef: any = null
  let usersRef: any = null
  
  // Emoticons
  const emoticons = ['😊', '😂', '❤️', '👍', '😎', '🤔', '😭', '🎉']
  
  // Channels data
  const channels: Channel[] = [
    {
      id: 'general',
      name: 'general',
      topic: 'General discussion and announcements'
    },
    {
      id: 'design',
      name: 'design',
      topic: 'Design discussions and feedback'
    },
    {
      id: 'gaming',
      name: 'gaming',
      topic: 'Gaming news and discussions'
    },
    {
      id: 'music',
      name: 'music',
      topic: 'Share and discuss music'
    }
  ]
  
  // Initialize Gun.js on mount
  onMounted(() => {
    // Load Gun.js library
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/gun/gun.js'
    script.onload = () => {
      initializeGun()
    }
    document.head.appendChild(script)
  
    // Check for saved username
    const savedName = localStorage.getItem('yahoomessenger:username')
    if (savedName) {
      userName.value = savedName
      nameInput.value = savedName
    }
  })
  
  const initializeGun = () => {
    // @ts-ignore
    // Use multiple Gun relay servers for better reliability
    gun = Gun([
      'https://gun-manhattan.herokuapp.com/gun',
      'https://gun-us.herokuapp.com/gun',
      'https://gunjs.herokuapp.com/gun'
    ])
    
    // Track online users
    usersRef = gun.get('webintosh-yahoomessenger-users')
    usersRef.map().on((data: any, key: string) => {
      if (data && data.online) {
        if (!onlineUsers.value.includes(data.name)) {
          onlineUsers.value.push(data.name)
        }
      }
    })
  
    // If user already has a name, announce presence
    if (userName.value) {
      announcePresence()
    }
  }
  
  const setUserName = () => {
    if (!nameInput.value.trim()) return
    
    userName.value = nameInput.value.trim()
    localStorage.setItem('yahoomessenger:username', userName.value)
    
    if (gun && usersRef) {
      announcePresence()
    }
    
    // Auto-select first channel
    if (channels.length > 0) {
      selectChannel(channels[0])
    }
  }
  
  const announcePresence = () => {
    if (!usersRef || !userName.value) return
    
    const userRef = usersRef.get(userName.value)
    userRef.put({
      name: userName.value,
      online: true,
      lastSeen: Date.now()
    })
    
    // Update presence every 30 seconds
    const presenceInterval = setInterval(() => {
      if (userName.value) {
        userRef.put({
          name: userName.value,
          online: true,
          lastSeen: Date.now()
        })
      }
    }, 30000)
    
    // Clean up on unmount
    onUnmounted(() => {
      clearInterval(presenceInterval)
      userRef.put({
        name: userName.value,
        online: false,
        lastSeen: Date.now()
      })
    })
  }
  
  const selectChannel = (channel: Channel) => {
    currentChannel.value = channel
    messages.value = []
    
    // Unsubscribe from previous channel
    if (channelRef) {
      channelRef.off()
    }
    
    // Subscribe to new channel
    if (gun) {
      channelRef = gun.get(`webintosh-yahoomessenger-channel-${channel.id}`)
      
      // Load existing messages
      channelRef.map().once((data: any, key: string) => {
        if (data && data.text) {
          const msg: Message = {
            id: key,
            text: data.text,
            sender: data.sender,
            avatar: data.avatar || '👤',
            timestamp: data.timestamp
          }
          
          // Add message if not already present
          if (!messages.value.find(m => m.id === key)) {
            messages.value.push(msg)
            messages.value.sort((a, b) => a.timestamp - b.timestamp)
            nextTick(() => scrollToBottom())
          }
        }
      })
      
      // Listen for new messages
      channelRef.map().on((data: any, key: string) => {
        if (data && data.text) {
          const existingIndex = messages.value.findIndex(m => m.id === key)
          if (existingIndex === -1) {
            const msg: Message = {
              id: key,
              text: data.text,
              sender: data.sender,
              avatar: data.avatar || '👤',
              timestamp: data.timestamp
            }
            messages.value.push(msg)
            messages.value.sort((a, b) => a.timestamp - b.timestamp)
            
            // Play sound for new messages from others
            if (data.sender !== userName.value) {
              playSound('message')
            }
            
            nextTick(() => scrollToBottom())
          }
        }
      })
    }
    
    nextTick(() => scrollToBottom())
  }
  
  const sendMessage = () => {
    if (!messageInput.value || !currentChannel.value || !channelRef) return
    
    const message = {
      text: messageInput.value,
      sender: userName.value,
      avatar: '😊',
      timestamp: Date.now()
    }
    
    // Send to Gun
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    channelRef.get(messageId).put(message)
    
    // Clear input
    messageInput.value = ''
    
    // Removed automated Rahul responses - real chat only
  }
  
  const sendBuzz = () => {
    if (!currentChannel.value || !channelRef) return
    
    const buzzMessage = {
      text: '🔔 BUZZ!! 🔔',
      sender: userName.value,
      avatar: '😊',
      timestamp: Date.now()
    }
    
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    channelRef.get(messageId).put(buzzMessage)
    
    handleBuzz()
  }
  
  const handleBuzz = () => {
    playSound('buzz')
    // Shake the window
    const element = document.querySelector('.yahoo-messenger') as HTMLElement
    if (element) {
      element.classList.add('buzz-shake')
      setTimeout(() => {
        element.classList.remove('buzz-shake')
      }, 500)
    }
  }
  
  const insertEmoticon = (emoji: string) => {
    messageInput.value += emoji
  }
  
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / 3600000)
    
    if (hours < 1) {
      const mins = Math.floor(diff / 60000)
      return mins <= 1 ? 'just now' : `${mins}m ago`
    } else if (hours < 24) {
      return `${hours}h ago`
    } else {
      return date.toLocaleDateString()
    }
  }
  
  const scrollToBottom = () => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  }
  
  const playSound = (type: 'message' | 'buzz') => {
    try {
      if (type === 'message' && messageSound.value) {
        messageSound.value.play()
      } else if (type === 'buzz' && buzzSound.value) {
        buzzSound.value.play()
      }
    } catch (e) {
      console.log('Could not play sound')
    }
  }
  
  // Clean up on unmount
  onUnmounted(() => {
    if (channelRef) {
      channelRef.off()
    }
    if (usersRef && userName.value) {
      usersRef.get(userName.value).put({
        name: userName.value,
        online: false,
        lastSeen: Date.now()
      })
    }
  })
  </script>
  
  <style scoped>
  .yahoo-messenger {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    font-family: 'Tahoma', 'Segoe UI', sans-serif;
    background: #f0f0f0;
  }
  
  /* Header */
  .ym-header {
    background: linear-gradient(90deg, #7C3AED, #A855F7);
    padding: 10px 15px;
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  }
  
  .ym-logo {
    width: 24px;
    height: 24px;
  }
  
  .ym-title {
    flex: 1;
    font-weight: bold;
    color: white;
    font-size: 14px;
  }
  
  .ym-status {
    display: flex;
    align-items: center;
    gap: 5px;
    color: white;
    font-size: 12px;
  }
  
  .status-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #4ade80;
    box-shadow: 0 0 4px #4ade80;
  }
  
  /* Main Layout */
  .ym-main {
    flex: 1;
    display: flex;
    overflow: hidden;
  }
  
  /* Sidebar */
  .ym-sidebar {
    width: 200px;
    background: #2c2c2c;
    color: white;
    display: flex;
    flex-direction: column;
    border-right: 1px solid #404040;
  }
  
  .user-section {
    padding: 15px;
  }
  
  .user-setup {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .name-input {
    padding: 8px;
    border: 1px solid #555;
    border-radius: 4px;
    background: #1a1a1a;
    color: white;
    font-size: 13px;
  }
  
  .set-name-btn {
    padding: 8px;
    background: #7C3AED;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
  }
  
  .set-name-btn:hover {
    background: #6B46C1;
  }
  
  .user-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.2s;
  }
  
  .user-item:hover {
    background: #404040;
  }
  
  .user-item.active {
    background: #404040;
  }
  
  .user-avatar {
    font-size: 20px;
  }
  
  .user-name {
    flex: 1;
    font-size: 13px;
    font-weight: 600;
  }
  
  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #4ade80;
  }
  
  .section-divider {
    height: 1px;
    background: #404040;
    margin: 0 15px;
  }
  
  .users-section {
    padding: 15px;
    max-height: 200px;
    overflow-y: auto;
  }
  
  .channels-section {
    flex: 1;
    padding: 15px;
    overflow-y: auto;
  }
  
  .section-title {
    font-size: 11px;
    text-transform: uppercase;
    color: #999;
    margin-bottom: 10px;
    font-weight: 600;
  }
  
  .channel-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: 2px;
  }
  
  .channel-item:hover {
    background: #404040;
  }
  
  .channel-item.active {
    background: #7C3AED;
  }
  
  .channel-icon {
    color: #999;
    font-size: 14px;
  }
  
  .channel-item.active .channel-icon {
    color: white;
  }
  
  .channel-name {
    flex: 1;
    font-size: 13px;
  }
  
  /* Chat Area */
  .ym-chat-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: white;
  }
  
  .chat-header {
    padding: 15px 20px;
    border-bottom: 1px solid #e5e5e5;
    display: flex;
    align-items: center;
    gap: 8px;
    background: white;
  }
  
  .channel-title {
    font-weight: 600;
    font-size: 15px;
    color: #333;
  }
  
  .channel-topic {
    color: #666;
    font-size: 12px;
    margin-left: auto;
  }
  
  .chat-messages {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
    background: #f8f8f8;
  }
  
  .message {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
  }
  
  .message.own {
    flex-direction: row-reverse;
  }
  
  .message-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #7C3AED;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    flex-shrink: 0;
  }
  
  .message.own .message-avatar {
    background: #A855F7;
  }
  
  .message-content {
    flex: 1;
    max-width: 60%;
  }
  
  .message.own .message-content {
    align-items: flex-end;
  }
  
  .message-header {
    display: flex;
    gap: 8px;
    align-items: baseline;
    margin-bottom: 4px;
  }
  
  .message.own .message-header {
    flex-direction: row-reverse;
  }
  
  .message-sender {
    font-weight: 600;
    font-size: 13px;
    color: #333;
  }
  
  .message-time {
    font-size: 11px;
    color: #999;
  }
  
  .message-text {
    background: white;
    padding: 10px 14px;
    border-radius: 18px;
    font-size: 14px;
    color: #333;
    border: 1px solid #e5e5e5;
    word-wrap: break-word;
  }
  
  .message.own .message-text {
    background: #7C3AED;
    color: white;
    border: none;
  }
  
  /* Input Area */
  .chat-input-area {
    background: white;
    border-top: 1px solid #e5e5e5;
    padding: 10px;
  }
  
  .emoticons {
    display: flex;
    gap: 5px;
    margin-bottom: 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid #f0f0f0;
  }
  
  .emoji-btn {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    padding: 2px 6px;
    border-radius: 4px;
    transition: background 0.2s;
  }
  
  .emoji-btn:hover {
    background: #f0f0f0;
  }
  
  .input-row {
    display: flex;
    gap: 8px;
  }
  
  .message-input {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 20px;
    font-size: 13px;
    outline: none;
  }
  
  .message-input:focus {
    border-color: #7C3AED;
  }
  
  .send-button {
    padding: 8px 16px;
    background: #7C3AED;
    color: white;
    border: none;
    border-radius: 20px;
    cursor: pointer;
    font-size: 12px;
    font-weight: bold;
    transition: background 0.2s;
  }
  
  .send-button:hover {
    background: #6B46C1;
  }
  
  .buzz-button {
    padding: 8px 12px;
    background: #fbbf24;
    color: #7c2d12;
    border: none;
    border-radius: 20px;
    cursor: pointer;
    font-size: 11px;
    font-weight: bold;
    transition: all 0.2s;
  }
  
  .buzz-button:hover {
    background: #f59e0b;
    transform: scale(1.05);
  }
  
  /* Welcome Screen */
  .welcome-screen {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #666;
  }
  
  .welcome-logo {
    width: 80px;
    height: 80px;
    margin-bottom: 20px;
    opacity: 0.5;
  }
  
  .welcome-screen h2 {
    font-size: 24px;
    color: #333;
    margin-bottom: 10px;
  }
  
  .welcome-screen p {
    font-size: 14px;
  }
  
  /* Buzz shake animation */
  @keyframes buzz-shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
  }
  
  .buzz-shake {
    animation: buzz-shake 0.5s;
  }
  </style>
  