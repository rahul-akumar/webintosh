/**
 * Yahoo Messenger App Types and Constants
 */
import type { Timestamp } from 'firebase/firestore'

// Types
export interface Channel {
  id: string
  name: string
  description: string
  unread?: number
}

export interface Message {
  id: string
  text: string
  userId: string
  userName: string
  timestamp: Timestamp | null
  channelId?: string
  conversationId?: string
  type?: 'message' | 'buzz'
}

export interface DirectMessage {
  id: string
  otherUser: string
  otherUserId: string
  lastMessage?: string
  lastSeen?: Timestamp
  online?: boolean
  unread?: number
}

export interface OnlineUser {
  uid: string
  displayName: string
  lastSeen: Timestamp
  online: boolean
}

// Default Channels
export const DEFAULT_CHANNELS: Channel[] = [
  { id: 'general', name: 'general', description: 'General discussion' },
  { id: 'design', name: 'design', description: 'Design and UI/UX' },
  { id: 'gaming', name: 'gaming', description: 'Gaming chat' },
  { id: 'music', name: 'music', description: 'Music and audio' },
  { id: 'random', name: 'random', description: 'Random topics' },
  { id: 'tech', name: 'tech', description: 'Technology discussion' }
]

// Emoticons
export const EMOTICONS = ['😊', '😂', '❤️', '👍', '😎', '🤔', '😭', '🎉', '🔥', '💯']

// Utility Functions
export const getInitials = (name: string): string => {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export const formatTime = (timestamp: Timestamp | null): string => {
  if (!timestamp) return ''
  const date = timestamp.toDate()
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`
  return date.toLocaleDateString()
}

export const playMessageSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    
    if (!AudioContextClass) {
      console.warn('Web Audio API not supported')
      return
    }
    
    const audioContext = new AudioContextClass()
    
    if (audioContext.state === 'suspended') {
      audioContext.resume()
    }
    
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime)
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.05)
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.01)
    gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.05)
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.15)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.15)
    
    setTimeout(() => {
      audioContext.close()
    }, 200)
  } catch (error) {
    console.error('Failed to play message sound:', error)
  }
}
