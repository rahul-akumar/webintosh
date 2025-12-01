import type { Ref } from 'vue'
import type { Channel } from '../types/yahooMessenger'

interface MenuHandlers {
  logout: () => void
  showNewDMModal: Ref<boolean>
  selectChannel: (channel: Channel) => void
  channels: Channel[]
  chatMode: Ref<'channels' | 'direct'>
  clearCurrentChannel: () => void
  sendBuzz: () => void
  insertEmoji: (emoji: string) => void
}

export function useYahooMenu(handlers: MenuHandlers) {
  const registerMenuCommands = () => {
    const { register } = useMenuCommand()

    // Conversations menu commands
    register('yahooMessenger.signOut', () => {
      handlers.logout()
    })

    register('yahooMessenger.newMessage', () => {
      handlers.showNewDMModal.value = true
    })

    register('yahooMessenger.joinChannel', () => {
      if (handlers.channels[0]) handlers.selectChannel(handlers.channels[0])
    })

    register('yahooMessenger.switchChannel', (args?: { channel?: string }) => {
      const channel = handlers.channels.find(c => c.id === args?.channel)
      if (channel) handlers.selectChannel(channel)
    })

    register('yahooMessenger.showDirectMessages', () => {
      handlers.chatMode.value = 'direct'
    })

    register('yahooMessenger.clearChat', () => {
      handlers.clearCurrentChannel()
    })

    // Status menu commands
    register('yahooMessenger.setStatus', (_args?: { status?: string }) => {
      // TODO: Implement status changes
    })

    // Tools menu commands
    register('yahooMessenger.sendBuzz', () => {
      handlers.sendBuzz()
    })

    register('yahooMessenger.insertEmoticon', (args?: { emoticon?: string }) => {
      if (args?.emoticon) handlers.insertEmoji(args.emoticon)
    })

    register('yahooMessenger.toggleSounds', () => {
      // TODO: Implement sound toggle
    })
    
    register('yahooMessenger.toggleNotifications', () => {
      // TODO: Implement notification toggle
    })
    
    // View menu commands
    register('yahooMessenger.toggleSidebar', () => {
      // TODO: Implement sidebar toggle
    })
    
    register('yahooMessenger.toggleOnlineUsers', () => {
      // TODO: Implement online users toggle
    })
    
    // Help menu commands
    register('yahooMessenger.showAbout', () => {
      // TODO: Implement about dialog
    })
  }

  return {
    registerMenuCommands
  }
}
