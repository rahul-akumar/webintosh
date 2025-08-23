import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';

// Clear all messages from a specific channel
export const clearChannelMessages = async (channelId: string) => {
  try {
    const q = query(
      collection(db, 'messages'),
      where('channelId', '==', channelId)
    );
    
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, 'messages', d.id)));
    
    await Promise.all(deletePromises);
    console.log(`✅ Cleared ${snapshot.size} messages from channel: ${channelId}`);
    return snapshot.size;
  } catch (error) {
    console.error('Error clearing channel:', error);
    throw error;
  }
};

// Clear all messages from all channels
export const clearAllChannels = async () => {
  const channels = ['general', 'design', 'gaming', 'music', 'random', 'tech'];
  let totalDeleted = 0;
  
  for (const channel of channels) {
    const deleted = await clearChannelMessages(channel);
    totalDeleted += deleted;
  }
  
  console.log(`✅ Total messages cleared: ${totalDeleted}`);
  return totalDeleted;
};

// Clear all direct messages
export const clearAllDirectMessages = async () => {
  try {
    const q = query(
      collection(db, 'messages'),
      where('conversationId', '!=', null)
    );
    
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, 'messages', d.id)));
    
    await Promise.all(deletePromises);
    console.log(`✅ Cleared ${snapshot.size} direct messages`);
    return snapshot.size;
  } catch (error) {
    console.error('Error clearing DMs:', error);
    throw error;
  }
};

// Clear EVERYTHING (use with caution!)
export const clearAllChatData = async () => {
  console.log('🗑️ Starting complete chat data cleanup...');
  
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
  
  console.log('✅ Cleared all chat data:');
  console.log(`   - ${messagesSnapshot.size} messages`);
  console.log(`   - ${dmSnapshot.size} DM conversations`);
  console.log(`   - ${usersSnapshot.size} user records`);
  
  return {
    messages: messagesSnapshot.size,
    conversations: dmSnapshot.size,
    users: usersSnapshot.size
  };
};
