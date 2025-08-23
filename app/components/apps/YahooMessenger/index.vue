<template>
    <div class="yahoo-messenger">
      <!-- Header -->
      <div class="ym-header">
        <img src="/icons/apps/yahooMessenger.png" alt="Y!" class="ym-logo">
        <span class="ym-title">Yahoo! Messenger</span>
        <div class="ym-status">
          <span class="status-indicator" :class="{ online: isConnected }"></span>
          {{ isConnected ? 'Online' : 'Offline' }}
        </div>
      </div>
  
      <!-- Connection Panel -->
      <div class="ym-connection-panel" v-if="!currentChat">
        <div class="connection-section">
          <h3>Your ID</h3>
          <div class="id-display">
            <input type="text" :value="myPeerId" readonly class="id-input">
            <button @click="copyId" class="ym-button">Copy</button>
          </div>
          <p class="help-text">Share this ID with your friend to connect</p>
        </div>
        
        <div class="divider"></div>
        
        <div class="connection-section">
          <h3>Connect to Friend</h3>
          <div class="connect-form">
            <input 
              v-model="friendId" 
              type="text" 
              placeholder="Enter friend's ID"
              class="friend-input"
              @keyup.enter="connectToPeer"
            >
            <button @click="connectToPeer" class="ym-button primary">Connect</button>
          </div>
        </div>
  
        <!-- Active Chats List -->
        <div class="active-chats" v-if="activeConnections.length > 0">
          <h3>Active Chats</h3>
          <div class="chat-list">
            <div 
              v-for="conn in activeConnections" 
              :key="conn.peer"
              @click="selectChat(conn)"
              class="chat-item"
            >
              <span class="status-indicator online"></span>
              <span class="chat-name">{{ conn.peer.substring(0, 8) }}...</span>
              <span v-if="conn.unread" class="unread-badge">{{ conn.unread }}</span>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Chat Window -->
      <div class="ym-chat-window" v-else>
        <div class="chat-header">
          <button @click="currentChat = null" class="back-button">←</button>
          <span class="chat-buddy">{{ currentChat.peer.substring(0, 8) }}...</span>
          <span class="typing-indicator" v-if="isTyping">is typing...</span>
          <button @click="disconnect" class="disconnect-button">×</button>
        </div>
  
        <div class="chat-messages" ref="messagesContainer">
          <div 
            v-for="(msg, index) in messages" 
            :key="index"
            class="message"
            :class="{ 'own': msg.sender === 'me', 'buddy': msg.sender === 'buddy' }"
          >
            <div class="message-bubble">
              <span class="message-text">{{ msg.text }}</span>
              <span class="message-time">{{ formatTime(msg.timestamp) }}</span>
            </div>
          </div>
        </div>
  
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
              @input="handleTyping"
              type="text"
              placeholder="Type a message..."
              class="message-input"
            >
            <button @click="sendMessage" class="send-button">Send</button>
            <button @click="sendBuzz" class="buzz-button">BUZZ!!</button>
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
  import { ref, onMounted, onUnmounted, nextTick } from 'vue'
  
  interface Message {
    text: string
    sender: 'me' | 'buddy'
    timestamp: Date
  }
  
  interface Connection {
    peer: string
    conn: any
    unread: number
  }
  
  // State
  const myPeerId = ref('')
  const friendId = ref('')
  const isConnected = ref(false)
  const messageInput = ref('')
  const messages = ref<Message[]>([])
  const currentChat = ref<Connection | null>(null)
  const activeConnections = ref<Connection[]>([])
  const isTyping = ref(false)
  const messagesContainer = ref<HTMLElement>()
  const messageSound = ref<HTMLAudioElement>()
  const buzzSound = ref<HTMLAudioElement>()
  
  // PeerJS instance
  let peer: any = null
  let typingTimeout: NodeJS.Timeout
  
  // Emoticons
  const emoticons = ['😊', '😂', '❤️', '👍', '😎', '🤔', '😭', '🎉']
  
  // Initialize PeerJS
  onMounted(async () => {
    // Load PeerJS library
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js'
    script.onload = () => {
      initializePeer()
    }
    document.head.appendChild(script)
  })
  
  const initializePeer = () => {
    // @ts-ignore
    peer = new Peer()
    
    peer.on('open', (id: string) => {
      myPeerId.value = id
      isConnected.value = true
    })
  
    peer.on('connection', (conn: any) => {
      setupConnection(conn)
    })
  
    peer.on('error', (err: any) => {
      console.error('PeerJS error:', err)
      isConnected.value = false
    })
  }
  
  const setupConnection = (conn: any) => {
    const connection: Connection = {
      peer: conn.peer,
      conn: conn,
      unread: 0
    }
  
    conn.on('open', () => {
      activeConnections.value.push(connection)
      playSound('message')
    })
  
    conn.on('data', (data: any) => {
      if (data.type === 'message') {
        handleIncomingMessage(connection, data.text)
      } else if (data.type === 'typing') {
        if (currentChat.value?.peer === connection.peer) {
          isTyping.value = true
          clearTimeout(typingTimeout)
          typingTimeout = setTimeout(() => {
            isTyping.value = false
          }, 1000)
        }
      } else if (data.type === 'buzz') {
        handleBuzz()
      }
    })
  
    conn.on('close', () => {
      activeConnections.value = activeConnections.value.filter(c => c.peer !== connection.peer)
      if (currentChat.value?.peer === connection.peer) {
        currentChat.value = null
      }
    })
  }
  
  const connectToPeer = () => {
    if (!friendId.value || !peer) return
    
    const conn = peer.connect(friendId.value)
    setupConnection(conn)
    friendId.value = ''
  }
  
  const selectChat = (connection: Connection) => {
    currentChat.value = connection
    connection.unread = 0
    messages.value = [] // In real app, you'd store messages per connection
  }
  
  const sendMessage = () => {
    if (!messageInput.value || !currentChat.value) return
    
    const message: Message = {
      text: messageInput.value,
      sender: 'me',
      timestamp: new Date()
    }
    
    messages.value.push(message)
    currentChat.value.conn.send({
      type: 'message',
      text: messageInput.value
    })
    
    messageInput.value = ''
    scrollToBottom()
  }
  
  const handleIncomingMessage = (connection: Connection, text: string) => {
    if (currentChat.value?.peer === connection.peer) {
      messages.value.push({
        text: text,
        sender: 'buddy',
        timestamp: new Date()
      })
      scrollToBottom()
    } else {
      connection.unread++
    }
    playSound('message')
  }
  
  const handleTyping = () => {
    if (!currentChat.value) return
    currentChat.value.conn.send({ type: 'typing' })
  }
  
  const sendBuzz = () => {
    if (!currentChat.value) return
    currentChat.value.conn.send({ type: 'buzz' })
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
  
  const copyId = () => {
    navigator.clipboard.writeText(myPeerId.value)
  }
  
  const disconnect = () => {
    if (currentChat.value) {
      currentChat.value.conn.close()
      currentChat.value = null
    }
  }
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }
  
  const scrollToBottom = () => {
    nextTick(() => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
    })
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
  
  onUnmounted(() => {
    if (peer) {
      peer.destroy()
    }
  })
  </script>
  
  <style scoped>
  .yahoo-messenger {
    width: 100%;
    height: 100%;
    background: linear-gradient(180deg, #6B46C1 0%, #9333EA 100%);
    display: flex;
    flex-direction: column;
    font-family: 'Tahoma', 'Segoe UI', sans-serif;
    color: #333;
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
    background: #ccc;
  }
  
  .status-indicator.online {
    background: #4ade80;
    box-shadow: 0 0 4px #4ade80;
  }
  
  /* Connection Panel */
  .ym-connection-panel {
    flex: 1;
    background: white;
    padding: 20px;
    overflow-y: auto;
  }
  
  .connection-section {
    margin-bottom: 20px;
  }
  
  .connection-section h3 {
    margin-bottom: 10px;
    color: #7C3AED;
    font-size: 14px;
  }
  
  .id-display {
    display: flex;
    gap: 10px;
  }
  
  .id-input {
    flex: 1;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-family: monospace;
    font-size: 12px;
    background: #f5f5f5;
  }
  
  .friend-input {
    flex: 1;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 12px;
  }
  
  .connect-form {
    display: flex;
    gap: 10px;
  }
  
  .help-text {
    margin-top: 5px;
    font-size: 11px;
    color: #666;
  }
  
  .divider {
    height: 1px;
    background: #e5e5e5;
    margin: 20px 0;
  }
  
  .ym-button {
    padding: 8px 16px;
    background: #f0f0f0;
    border: 1px solid #ccc;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.2s;
  }
  
  .ym-button:hover {
    background: #e0e0e0;
  }
  
  .ym-button.primary {
    background: #7C3AED;
    color: white;
    border-color: #7C3AED;
  }
  
  .ym-button.primary:hover {
    background: #6B46C1;
  }
  
  /* Active Chats */
  .active-chats {
    margin-top: 30px;
  }
  
  .active-chats h3 {
    margin-bottom: 10px;
    color: #7C3AED;
    font-size: 14px;
  }
  
  .chat-list {
    border: 1px solid #e5e5e5;
    border-radius: 4px;
  }
  
  .chat-item {
    padding: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    transition: background 0.2s;
    border-bottom: 1px solid #f0f0f0;
  }
  
  .chat-item:last-child {
    border-bottom: none;
  }
  
  .chat-item:hover {
    background: #f8f8f8;
  }
  
  .chat-name {
    flex: 1;
    font-size: 13px;
  }
  
  .unread-badge {
    background: #ef4444;
    color: white;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 10px;
  }
  
  /* Chat Window */
  .ym-chat-window {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: white;
  }
  
  .chat-header {
    background: linear-gradient(90deg, #7C3AED, #A855F7);
    padding: 10px 15px;
    display: flex;
    align-items: center;
    gap: 10px;
    color: white;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }
  
  .back-button,
  .disconnect-button {
    background: none;
    border: none;
    color: white;
    font-size: 18px;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .chat-buddy {
    flex: 1;
    font-weight: bold;
    font-size: 14px;
  }
  
  .typing-indicator {
    font-size: 11px;
    font-style: italic;
    opacity: 0.8;
  }
  
  .chat-messages {
    flex: 1;
    padding: 15px;
    overflow-y: auto;
    background: #f8f8f8;
  }
  
  .message {
    margin-bottom: 10px;
    display: flex;
  }
  
  .message.own {
    justify-content: flex-end;
  }
  
  .message.buddy {
    justify-content: flex-start;
  }
  
  .message-bubble {
    max-width: 70%;
    padding: 8px 12px;
    border-radius: 15px;
    position: relative;
  }
  
  .message.own .message-bubble {
    background: #7C3AED;
    color: white;
    border-bottom-right-radius: 5px;
  }
  
  .message.buddy .message-bubble {
    background: white;
    border: 1px solid #e5e5e5;
    border-bottom-left-radius: 5px;
  }
  
  .message-text {
    font-size: 13px;
    word-wrap: break-word;
  }
  
  .message-time {
    display: block;
    font-size: 10px;
    margin-top: 3px;
    opacity: 0.7;
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
    padding: 8px;
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