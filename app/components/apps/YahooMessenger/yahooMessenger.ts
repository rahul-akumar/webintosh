// Yahoo Messenger Firebase Types and Utilities
import type {
  Timestamp
} from 'firebase/firestore';
import { 
  collection, 
  addDoc, 
  serverTimestamp,
  doc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { 
  signInAnonymously, 
  updateProfile, 
  signOut
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { db, auth } from '../../../config/firebase';

// Types
export interface Channel {
  id: string;
  name: string;
  description: string;
  unread?: number;
}

export interface Message {
  id: string;
  text: string;
  userId: string;
  userName: string;
  timestamp: Timestamp | null;
  channelId?: string;
  conversationId?: string;
  type?: 'message' | 'buzz';
}

export interface DirectMessage {
  id: string;
  otherUser: string;
  otherUserId: string;
  lastMessage?: string;
  lastSeen?: Timestamp;
  online?: boolean;
  unread?: number;
}

export interface OnlineUser {
  uid: string;
  displayName: string;
  lastSeen: Timestamp;
  online: boolean;
}

// Default Channels
export const defaultChannels: Channel[] = [
  { id: 'general', name: 'general', description: 'General discussion' },
  { id: 'design', name: 'design', description: 'Design and UI/UX' },
  { id: 'gaming', name: 'gaming', description: 'Gaming chat' },
  { id: 'music', name: 'music', description: 'Music and audio' },
  { id: 'random', name: 'random', description: 'Random topics' },
  { id: 'tech', name: 'tech', description: 'Technology discussion' }
];

// Emoticons
export const emoticons = ['😊', '😂', '❤️', '👍', '😎', '🤔', '😭', '🎉', '🔥', '💯'];

// Utility Functions
export const getInitials = (name: string): string => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const formatTime = (timestamp: Timestamp | null): string => {
  if (!timestamp) return '';
  const date = timestamp.toDate();
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return date.toLocaleDateString();
};

export const getTimeAgo = (timestamp: Timestamp | null): string => {
  if (!timestamp) return 'offline';
  return formatTime(timestamp);
};

export const playMessageSound = () => {
  try {
    // Create a simple notification sound using Web Audio API
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    
    if (!AudioContextClass) {
      console.warn('Web Audio API not supported');
      return;
    }
    
    const audioContext = new AudioContextClass();
    
    // Resume context if it's suspended (required for some browsers)
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    
    // Create oscillator for the beep
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Set the frequency for a pleasant notification sound (two-tone beep)
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.05);
    oscillator.type = 'sine';
    
    // Set volume and envelope
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.15);
    
    // Play the sound
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.15);
    
    // Clean up after playing
    setTimeout(() => {
      audioContext.close();
    }, 200);
  } catch (error) {
    console.error('Failed to play message sound:', error);
  }
};

// Firebase Auth Functions
export const loginUser = async (username: string): Promise<User> => {
  const userCredential = await signInAnonymously(auth);
  await updateProfile(userCredential.user, {
    displayName: username.trim()
  });
  
  // Set user as online
  await setDoc(doc(db, 'users', userCredential.user.uid), {
    displayName: username.trim(),
    lastSeen: serverTimestamp(),
    online: true
  });
  
  return userCredential.user;
};

export const logoutUser = async (userId: string) => {
  // Set user as offline
  await updateDoc(doc(db, 'users', userId), {
    online: false,
    lastSeen: serverTimestamp()
  });
  
  await signOut(auth);
};

// Message Functions
export const sendChannelMessage = async (
  user: User,
  channelId: string,
  text: string,
  type: 'message' | 'buzz' = 'message'
) => {
  const messageData = {
    text: text.trim(),
    userId: user.uid,
    userName: user.displayName || 'Anonymous',
    timestamp: serverTimestamp(),
    channelId,
    type
  };
  
  try {
    await addDoc(collection(db, 'messages'), messageData);
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const sendDirectMessage = async (
  user: User,
  conversationId: string,
  text: string,
  type: 'message' | 'buzz' = 'message'
) => {
  await addDoc(collection(db, 'messages'), {
    text: text.trim(),
    userId: user.uid,
    userName: user.displayName || 'Anonymous',
    timestamp: serverTimestamp(),
    conversationId,
    type
  });
  
  // Update last message in DM
  await updateDoc(doc(db, 'directMessages', conversationId), {
    lastMessage: text.trim(),
    lastMessageTime: serverTimestamp()
  });
};

// DM Functions
export const createDirectMessage = async (
  currentUser: User,
  otherUser: OnlineUser
) => {
  const conversationId = [currentUser.uid, otherUser.uid].sort().join('_');
  
  const dmDoc = doc(db, 'directMessages', conversationId);
  await setDoc(dmDoc, {
    participants: [currentUser.uid, otherUser.uid],
    participantNames: {
      [currentUser.uid]: currentUser.displayName,
      [otherUser.uid]: otherUser.displayName
    },
    createdAt: serverTimestamp(),
    lastMessage: null,
    lastMessageTime: serverTimestamp()
  }, { merge: true });
  
  return conversationId;
};

// Presence Functions
export const updateUserPresence = async (userId: string) => {
  await updateDoc(doc(db, 'users', userId), {
    lastSeen: serverTimestamp(),
    online: true
  });
};
