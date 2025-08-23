import { ref, reactive } from 'vue';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error' | 'message';
  icon?: string;
  timestamp: Date;
  duration?: number; // milliseconds, 0 = persistent
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
  sound?: boolean;
  appId?: string; // which app sent this notification
}

// Global notification state
const notifications = ref<Notification[]>([]);
const notificationQueue = ref<Notification[]>([]);
const maxVisibleNotifications = 3;

export const useNotifications = () => {
  // Add a new notification
  const showNotification = (options: Omit<Notification, 'id' | 'timestamp'>) => {
    const notification: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      duration: 5000, // default 5 seconds
      sound: true,
      type: 'info',
      ...options
    };

    // Add to queue
    notificationQueue.value.push(notification);
    
    // Process queue
    processNotificationQueue();
    
    // Play sound if enabled
    if (notification.sound) {
      playNotificationSound(notification.type);
    }

    // Auto-dismiss if duration is set
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        dismissNotification(notification.id);
      }, notification.duration);
    }

    return notification.id;
  };

  // Process notification queue
  const processNotificationQueue = () => {
    while (
      notificationQueue.value.length > 0 && 
      notifications.value.length < maxVisibleNotifications
    ) {
      const notification = notificationQueue.value.shift();
      if (notification) {
        notifications.value.push(notification);
      }
    }
  };

  // Dismiss a notification
  const dismissNotification = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id);
    if (index !== -1) {
      notifications.value.splice(index, 1);
      // Process queue to show any waiting notifications
      processNotificationQueue();
    }
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    notifications.value = [];
    notificationQueue.value = [];
  };

  // Play notification sound
  const playNotificationSound = (type?: string) => {
    let soundData = '';
    
    switch (type) {
      case 'message':
        // Yahoo Messenger style sound
        soundData = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZijYIG2m98OScTgwOUqzn4';
        break;
      case 'error':
        soundData = 'data:audio/wav;base64,UklGRi4CAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQoCAADw/wAA8P8AAPD/AADw/wAA8P8AAPD/AADw/wAA8P8AAPD/AADw/wAA';
        break;
      default:
        // Default notification sound
        soundData = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQg8AAIQ+AAACABAAZGF0YQoGAADa2trd3d3g4ODj4+Pm5ubo6Ojq6urr6+vs7Ozs7Ozr6+vq6uro6Ojm5ubj4+Pg4ODd3d3a2tra2tra2tra2tra2tra2tra2tra2tra';
        break;
    }
    
    if (soundData) {
      const audio = new Audio(soundData);
      audio.volume = 0.4;
      audio.play().catch(() => {});
    }
  };

  // Show a simple message notification
  const notify = (title: string, message: string, type: Notification['type'] = 'info') => {
    return showNotification({ title, message, type });
  };

  // Show a message notification for chat
  const notifyMessage = (
    senderName: string, 
    message: string, 
    channelName?: string,
    appId: string = 'yahooMessenger'
  ) => {
    const title = channelName ? `${senderName} in #${channelName}` : senderName;
    return showNotification({
      title,
      message,
      type: 'message',
      icon: '/icons/apps/yahooMessenger.png',
      duration: 4000,
      appId
    });
  };

  // Test notification (for debugging)
  const testNotification = () => {
    console.log('[Notifications] Testing notification system...');
    return showNotification({
      title: 'Test Notification',
      message: 'This is a test. If you see this, notifications are working!',
      type: 'info',
      duration: 5000
    });
  };

  return {
    notifications: readonly(notifications),
    notificationQueue: readonly(notificationQueue),
    showNotification,
    dismissNotification,
    clearAllNotifications,
    notify,
    notifyMessage,
    testNotification
  };
};
