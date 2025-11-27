<template>
  <Teleport to="body">
    <div class="notifications-container">
      <TransitionGroup name="notification" tag="div">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          :class="['notification', `notification-${notification.type}`]"
          @click="handleNotificationClick(notification)"
        >
          <img 
            v-if="notification.icon" 
            :src="notification.icon" 
            class="notification-icon"
            alt=""
          >
          <div v-else class="notification-icon-default">
            <svg v-if="notification.type === 'success'" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
            </svg>
            <svg v-else-if="notification.type === 'error'" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <svg v-else-if="notification.type === 'warning'" viewBox="0 0 24 24" fill="currentColor">
              <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
          </div>
          
          <div class="notification-content">
            <div class="notification-title">{{ notification.title }}</div>
            <div class="notification-message">{{ notification.message }}</div>
            <div v-if="notification.actions" class="notification-actions">
              <button
                v-for="(action, index) in notification.actions"
                :key="index"
                class="notification-action"
                @click.stop="handleAction(notification, action)"
              >
                {{ action.label }}
              </button>
            </div>
          </div>
          
          <button 
            class="notification-close"
            aria-label="Close notification"
            @click.stop="dismissNotification(notification.id)"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { DeepReadonly } from 'vue'
import { useNotifications, type Notification } from '~/composables/useNotifications'
import { useOSStore } from '../../stores/os'
import type { OSWindowModel } from '../../types/os'

const { notifications, dismissNotification } = useNotifications()
const osStore = useOSStore()

// Readonly notification type for template iteration
type ReadonlyNotification = DeepReadonly<Notification>

interface NotificationAction {
  label: string
  action: () => void
}

const handleNotificationClick = (notification: ReadonlyNotification) => {
  // If notification has an appId, focus that app
  if (notification.appId) {
    const window = osStore.windows.find((w: OSWindowModel) => w.appId === notification.appId)
    if (window) {
      osStore.bringToFront(window.id)
    }
    // Note: Opening apps that aren't already open would require useAppsStore
  }
}

const handleAction = (notification: ReadonlyNotification, action: Readonly<NotificationAction>) => {
  action.action()
  dismissNotification(notification.id)
}
</script>

<style scoped>
/* CSS Variables for notification theming */
:root {
  --notif-success: #4caf50;
  --notif-error: #f44336;
  --notif-warning: #ff9800;
  --notif-message: #764ba2;
  --notif-info: #2196f3;
}

.notifications-container {
  position: fixed;
  top: 40px; /* Below menubar */
  right: 20px;
  z-index: var(--z-notifications, 9999);
  pointer-events: none;
}

.notification {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 320px;
  max-width: 420px;
  margin-bottom: 10px;
  padding: 12px;
  background: var(--bg-notification, rgba(255, 255, 255, 0.98));
  backdrop-filter: blur(var(--blur-amount, 20px));
  -webkit-backdrop-filter: blur(var(--blur-amount, 20px));
  border: 1px solid var(--border-notification, rgba(0, 0, 0, 0.1));
  border-radius: var(--notification-border-radius, 8px);
  box-shadow: var(--shadow-notification, 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05));
  pointer-events: auto;
  cursor: pointer;
  transition: all var(--transition-normal, 0.2s) ease;
}

.notification:hover {
  transform: translateX(-5px);
  box-shadow: var(--shadow-notification-hover, 0 6px 16px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.1));
}

/* Type-specific colors */
.notification-success {
  border-left: 4px solid var(--notif-success);
}

.notification-error {
  border-left: 4px solid var(--notif-error);
}

.notification-warning {
  border-left: 4px solid var(--notif-warning);
}

.notification-message {
  border-left: 4px solid var(--notif-message);
}

.notification-info {
  border-left: 4px solid var(--notif-info);
}

.notification-icon {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 6px;
}

.notification-icon-default {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: var(--bg-button-hover, rgba(0, 0, 0, 0.05));
}

.notification-icon-default svg {
  width: 20px;
  height: 20px;
}

.notification-success .notification-icon-default {
  background: color-mix(in srgb, var(--notif-success) 10%, transparent);
  color: var(--notif-success);
}

.notification-error .notification-icon-default {
  background: color-mix(in srgb, var(--notif-error) 10%, transparent);
  color: var(--notif-error);
}

.notification-warning .notification-icon-default {
  background: color-mix(in srgb, var(--notif-warning) 10%, transparent);
  color: var(--notif-warning);
}

.notification-message .notification-icon-default {
  background: color-mix(in srgb, var(--notif-message) 10%, transparent);
  color: var(--notif-message);
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #1a1a1a);
  margin-bottom: 4px;
  line-height: 1.2;
}

.notification-message {
  font-size: 13px;
  color: var(--text-secondary, #666);
  line-height: 1.4;
  word-break: break-word;
}

.notification-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.notification-action {
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-primary, var(--notif-message));
  background: color-mix(in srgb, var(--color-primary, var(--notif-message)) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-primary, var(--notif-message)) 20%, transparent);
  border-radius: var(--button-border-radius, 4px);
  cursor: pointer;
  transition: all var(--transition-fast, 0.12s);
}

.notification-action:hover {
  background: color-mix(in srgb, var(--color-primary, var(--notif-message)) 20%, transparent);
  border-color: color-mix(in srgb, var(--color-primary, var(--notif-message)) 30%, transparent);
}

.notification-close {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  opacity: 0.5;
  transition: opacity var(--transition-fast, 0.12s);
  padding: 0;
  color: var(--text-primary, currentColor);
}

.notification-close:hover {
  opacity: 1;
}

.notification-close svg {
  width: 16px;
  height: 16px;
}

/* Animations */
.notification-enter-active {
  transition: all 0.3s ease-out;
}

.notification-leave-active {
  transition: all 0.2s ease-in;
}

.notification-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.notification-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
