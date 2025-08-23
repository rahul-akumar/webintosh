import { ref, onUnmounted } from 'vue';
import { 
  collection, 
  query, 
  onSnapshot, 
  where, 
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { db, auth } from '../../config/firebase';
import { useNotifications } from './useNotifications';

interface Message {
  id: string;
  text: string;
  userId: string;
  userName: string;
  timestamp: Timestamp | null;
  channelId?: string;
  conversationId?: string;
  type?: 'message' | 'buzz';
}

// Global state - shared across all instances
const currentUser = ref<User | null>(null);
const processedMessageIds = new Set<string>();
const channelUnsubscribes = new Map<string, () => void>();
let dmUnsubscribe: (() => void) | null = null;
const isAppOpen = ref(false);  // Start as false, Yahoo Messenger will set to true when it mounts
let isInitialized = false;

export const useGlobalChat = () => {
  const { notifyMessage } = useNotifications();
  
  // Track whether Yahoo Messenger is open
  const setAppOpen = (open: boolean) => {
    console.log('[GlobalChat] App open state changed:', open);
    isAppOpen.value = open;
    if (open) {
      // Clear processed messages when app opens to avoid duplicate notifications
      processedMessageIds.clear();
    }
  };

  // Initialize global listeners
  const initializeGlobalListeners = () => {
    if (isInitialized) return; // Prevent multiple initializations
    isInitialized = true;
    
    console.log('[GlobalChat] Initializing global listeners');
    
    // Listen for auth state changes
    onAuthStateChanged(auth, (user) => {
      console.log('[GlobalChat] Auth state changed:', user?.displayName || 'null');
      currentUser.value = user;
      
      if (user) {
        // Add a delay to mark all existing messages as processed
        setTimeout(() => {
          // Start listening to all channels
          startChannelListeners();
          // Start listening to DMs for this user
          startDMListener();
        }, 2000); // Wait 2 seconds to ensure all existing messages are skipped
      } else {
        // Clean up listeners if user logs out
        stopAllListeners();
      }
    });
  };

  // Start listening to all channels (NO NOTIFICATIONS for channels)
  const startChannelListeners = () => {
    // We can skip channel listeners entirely since we don't want notifications for them
    console.log('[GlobalChat] Skipping channel listeners - notifications disabled for channels');
  };

  // Start listening to DMs
  const startDMListener = () => {
    if (!currentUser.value || dmUnsubscribe) return;
    
    console.log('[GlobalChat] Starting DM listeners for user:', currentUser.value.displayName);
    
    // Mark current time to only process messages after this point
    const startTime = Date.now();
    
    const q = query(
      collection(db, 'directMessages'),
      where('participants', 'array-contains', currentUser.value.uid)
    );

    dmUnsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docs.forEach(doc => {
        const conversationId = doc.id;
        
        // Listen to messages in this conversation (remove orderBy to avoid index issues)
        const msgQuery = query(
          collection(db, 'messages'),
          where('conversationId', '==', conversationId),
          limit(50)
        );
        
        onSnapshot(msgQuery, (msgSnapshot) => {
          if (!currentUser.value) return;
          
          msgSnapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const message = {
                id: change.doc.id,
                ...change.doc.data()
              } as Message;
              
              // Skip if we've already processed this message
              if (processedMessageIds.has(message.id)) {
                return;
              }
              
              // Mark as processed immediately
              processedMessageIds.add(message.id);
              
              // Check if message is truly new (within last 10 seconds)
              const messageTime = message.timestamp?.toMillis() || 0;
              const isNewMessage = messageTime > startTime && (Date.now() - messageTime < 10000);
              
              console.log('[GlobalChat] DM detected:', {
                from: message.userName,
                isAppOpen: isAppOpen.value,
                isFromSelf: message.userId === currentUser.value!.uid,
                isNewMessage,
                messageAge: messageTime ? `${(Date.now() - messageTime) / 1000}s ago` : 'no timestamp'
              });
              
              // Only notify for truly new DMs from others when app is closed
              if (!isAppOpen.value && 
                  message.userId !== currentUser.value!.uid &&
                  isNewMessage) {
                
                console.log('[GlobalChat] 🔔 Showing DM notification from:', message.userName, ':', message.text);
                
                notifyMessage(
                  message.userName,
                  message.text,
                  undefined, // No channel for DMs
                  'yahooMessenger'
                );
              }
            }
          });
        });
      });
    });
  };

  // Stop all listeners
  const stopAllListeners = () => {
    channelUnsubscribes.forEach(unsubscribe => unsubscribe());
    channelUnsubscribes.clear();
    
    if (dmUnsubscribe) {
      dmUnsubscribe();
      dmUnsubscribe = null;
    }
    
    processedMessageIds.clear();
  };

  // Clean up on unmount
  onUnmounted(() => {
    stopAllListeners();
  });

  return {
    initializeGlobalListeners,
    setAppOpen,
    stopAllListeners,
    currentUser: readonly(currentUser)
  };
};
