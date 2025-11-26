import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Clear all messages from a specific channel
 * @returns Number of deleted messages
 */
export const clearChannelMessages = async (channelId: string): Promise<number> => {
  const q = query(
    collection(db, 'messages'),
    where('channelId', '==', channelId)
  );
  
  const snapshot = await getDocs(q);
  const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, 'messages', d.id)));
  
  await Promise.all(deletePromises);
  return snapshot.size;
};

/**
 * Clear all messages from all channels
 * @returns Total number of deleted messages
 */
export const clearAllChannels = async (): Promise<number> => {
  const channels = ['general', 'design', 'gaming', 'music', 'random', 'tech'];
  let totalDeleted = 0;
  
  for (const channel of channels) {
    const deleted = await clearChannelMessages(channel);
    totalDeleted += deleted;
  }
  
  return totalDeleted;
};

/**
 * Clear all direct messages
 * @returns Number of deleted direct messages
 */
export const clearAllDirectMessages = async (): Promise<number> => {
  const q = query(
    collection(db, 'messages'),
    where('conversationId', '!=', null)
  );
  
  const snapshot = await getDocs(q);
  const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, 'messages', d.id)));
  
  await Promise.all(deletePromises);
  return snapshot.size;
};

interface ClearAllResult {
  messages: number;
  conversations: number;
  users: number;
}

/**
 * Clear ALL chat data (use with caution!)
 * Removes all messages, DM conversations, and user presence records
 */
export const clearAllChatData = async (): Promise<ClearAllResult> => {
  // Clear all messages
  const messagesSnapshot = await getDocs(collection(db, 'messages'));
  const messageDeletes = messagesSnapshot.docs.map(d => deleteDoc(doc(db, 'messages', d.id)));
  await Promise.all(messageDeletes);
  
  // Clear all direct message metadata
  const dmSnapshot = await getDocs(collection(db, 'directMessages'));
  const dmDeletes = dmSnapshot.docs.map(d => deleteDoc(doc(db, 'directMessages', d.id)));
  await Promise.all(dmDeletes);
  
  // Clear all user presence data
  const usersSnapshot = await getDocs(collection(db, 'users'));
  const userDeletes = usersSnapshot.docs.map(d => deleteDoc(doc(db, 'users', d.id)));
  await Promise.all(userDeletes);
  
  return {
    messages: messagesSnapshot.size,
    conversations: dmSnapshot.size,
    users: usersSnapshot.size
  };
};
