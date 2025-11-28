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

