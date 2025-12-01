/**
 * Firebase operations for Yahoo Messenger
 */
import { 
  collection, 
  addDoc, 
  serverTimestamp,
  doc,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { 
  signInAnonymously, 
  updateProfile, 
  signOut
} from 'firebase/auth'
import type { User } from 'firebase/auth'
import { db, auth } from '../../../../config/firebase'
import type { OnlineUser } from '../types/yahooMessenger'

// Auth Functions
export const loginUser = async (username: string): Promise<User> => {
  const userCredential = await signInAnonymously(auth)
  await updateProfile(userCredential.user, {
    displayName: username.trim()
  })
  
  await setDoc(doc(db, 'users', userCredential.user.uid), {
    displayName: username.trim(),
    lastSeen: serverTimestamp(),
    online: true
  })
  
  return userCredential.user
}

export const logoutUser = async (userId: string) => {
  await updateDoc(doc(db, 'users', userId), {
    online: false,
    lastSeen: serverTimestamp()
  })
  
  await signOut(auth)
}

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
  }
  
  try {
    await addDoc(collection(db, 'messages'), messageData)
  } catch (error) {
    console.error('Error sending message:', error)
    throw error
  }
}

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
  })
  
  await updateDoc(doc(db, 'directMessages', conversationId), {
    lastMessage: text.trim(),
    lastMessageTime: serverTimestamp()
  })
}

// DM Functions
export const createDirectMessage = async (
  currentUser: User,
  otherUser: OnlineUser
) => {
  const conversationId = [currentUser.uid, otherUser.uid].sort().join('_')
  
  const dmDoc = doc(db, 'directMessages', conversationId)
  await setDoc(dmDoc, {
    participants: [currentUser.uid, otherUser.uid],
    participantNames: {
      [currentUser.uid]: currentUser.displayName,
      [otherUser.uid]: otherUser.displayName
    },
    createdAt: serverTimestamp(),
    lastMessage: null,
    lastMessageTime: serverTimestamp()
  }, { merge: true })
  
  return conversationId
}

// Presence Functions
export const updateUserPresence = async (userId: string) => {
  await updateDoc(doc(db, 'users', userId), {
    lastSeen: serverTimestamp(),
    online: true
  })
}

export { auth, db }
