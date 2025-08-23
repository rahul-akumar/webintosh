// Yahoo Messenger App Menu Template
import { Menu, type MenuTemplate } from '../../../../types/menu'

export function createYahooMessengerMenuTemplate(): MenuTemplate {
  return Menu.template('yahooMessenger', 'Yahoo! Messenger', [
    // App menu
    Menu.section('yahooMessenger', 'Yahoo! Messenger', [
      Menu.item('yahooMessenger.about', 'About Yahoo! Messenger', { 
        command: 'system.showAbout'
      }),
      Menu.item('yahooMessenger.preferences', 'Preferences…', { 
        enabled: false 
      }),
      Menu.sep('yahooMessenger.sep1'),
      Menu.item('yahooMessenger.signOut', 'Sign Out', {
        command: 'yahooMessenger.signOut'
      }),
      Menu.sep('yahooMessenger.sep2'),
      Menu.item('yahooMessenger.quit', 'Quit Yahoo! Messenger', {
        command: 'os.closeFocused',
        accel: { key: 'Q', alt: true }
      })
    ]),

    // Conversations menu
    Menu.section('conversations', 'Conversations', [
      Menu.item('conversations.newMessage', 'New Message', {
        command: 'yahooMessenger.newMessage',
        accel: { key: 'N', alt: true }
      }),
      Menu.item('conversations.joinChannel', 'Join Channel', {
        command: 'yahooMessenger.joinChannel',
        accel: { key: 'J', alt: true }
      }),
      Menu.sep('conversations.sep1'),
      Menu.submenu('conversations.channels', 'Channels', [
        Menu.item('conversations.channels.general', '#general', {
          command: 'yahooMessenger.switchChannel',
          args: { channel: 'general' }
        }),
        Menu.item('conversations.channels.design', '#design', {
          command: 'yahooMessenger.switchChannel',
          args: { channel: 'design' }
        }),
        Menu.item('conversations.channels.gaming', '#gaming', {
          command: 'yahooMessenger.switchChannel',
          args: { channel: 'gaming' }
        }),
        Menu.item('conversations.channels.music', '#music', {
          command: 'yahooMessenger.switchChannel',
          args: { channel: 'music' }
        })
      ]),
      Menu.sep('conversations.sep2'),
      Menu.item('conversations.directMessages', 'Direct Messages', {
        command: 'yahooMessenger.showDirectMessages',
        accel: { key: 'D', alt: true }
      }),
      Menu.sep('conversations.sep3'),
      Menu.item('conversations.clearChat', 'Clear Current Chat', {
        command: 'yahooMessenger.clearChat',
        accel: { key: 'L', alt: true }
      })
    ]),

    // Edit menu
    Menu.section('edit', 'Edit', [
      Menu.item('edit.copy', 'Copy', {
        command: 'document.copy',
        accel: { key: 'C', alt: true }
      }),
      Menu.item('edit.paste', 'Paste', {
        command: 'document.paste',
        accel: { key: 'V', alt: true }
      }),
      Menu.sep('edit.sep1'),
      Menu.item('edit.selectAll', 'Select All', {
        command: 'document.selectAll',
        accel: { key: 'A', alt: true }
      }),
      Menu.sep('edit.sep2'),
      Menu.item('edit.findInChat', 'Find in Chat…', {
        command: 'yahooMessenger.findInChat',
        accel: { key: 'F', alt: true },
        enabled: false
      })
    ]),

    // Status menu
    Menu.section('status', 'Status', [
      Menu.item('status.available', 'Available', {
        command: 'yahooMessenger.setStatus',
        args: { status: 'available' },
        checked: true
      }),
      Menu.item('status.busy', 'Busy', {
        command: 'yahooMessenger.setStatus',
        args: { status: 'busy' }
      }),
      Menu.item('status.away', 'Away', {
        command: 'yahooMessenger.setStatus',
        args: { status: 'away' }
      }),
      Menu.item('status.invisible', 'Invisible', {
        command: 'yahooMessenger.setStatus',
        args: { status: 'invisible' }
      }),
      Menu.sep('status.sep1'),
      Menu.item('status.customMessage', 'Set Status Message…', {
        command: 'yahooMessenger.setStatusMessage',
        enabled: false
      })
    ]),

    // Tools menu
    Menu.section('tools', 'Tools', [
      Menu.item('tools.buzz', 'Send BUZZ!', {
        command: 'yahooMessenger.sendBuzz',
        accel: { key: 'B', alt: true }
      }),
      Menu.sep('tools.sep1'),
      Menu.submenu('tools.emoticons', 'Emoticons', [
        Menu.item('tools.emoticons.smile', '😊 Smile', {
          command: 'yahooMessenger.insertEmoticon',
          args: { emoticon: '😊' }
        }),
        Menu.item('tools.emoticons.laugh', '😂 Laugh', {
          command: 'yahooMessenger.insertEmoticon',
          args: { emoticon: '😂' }
        }),
        Menu.item('tools.emoticons.heart', '❤️ Heart', {
          command: 'yahooMessenger.insertEmoticon',
          args: { emoticon: '❤️' }
        }),
        Menu.item('tools.emoticons.thumbsUp', '👍 Thumbs Up', {
          command: 'yahooMessenger.insertEmoticon',
          args: { emoticon: '👍' }
        }),
        Menu.item('tools.emoticons.cool', '😎 Cool', {
          command: 'yahooMessenger.insertEmoticon',
          args: { emoticon: '😎' }
        }),
        Menu.item('tools.emoticons.thinking', '🤔 Thinking', {
          command: 'yahooMessenger.insertEmoticon',
          args: { emoticon: '🤔' }
        }),
        Menu.item('tools.emoticons.cry', '😭 Cry', {
          command: 'yahooMessenger.insertEmoticon',
          args: { emoticon: '😭' }
        }),
        Menu.item('tools.emoticons.party', '🎉 Party', {
          command: 'yahooMessenger.insertEmoticon',
          args: { emoticon: '🎉' }
        })
      ]),
      Menu.sep('tools.sep2'),
      Menu.item('tools.sounds', 'Message Sounds', {
        command: 'yahooMessenger.toggleSounds',
        checked: true
      }),
      Menu.item('tools.notifications', 'Desktop Notifications', {
        command: 'yahooMessenger.toggleNotifications',
        checked: true
      }),
      Menu.sep('tools.sep3'),
      Menu.item('tools.clearAllChats', 'Clear All Chats…', {
        command: 'yahooMessenger.clearAllChats',
        enabled: false
      })
    ]),

    // View menu
    Menu.section('view', 'View', [
      Menu.item('view.showSidebar', 'Show Sidebar', {
        command: 'yahooMessenger.toggleSidebar',
        checked: true
      }),
      Menu.item('view.showOnlineUsers', 'Show Online Users', {
        command: 'yahooMessenger.toggleOnlineUsers',
        checked: true
      }),
      Menu.sep('view.sep1'),
      Menu.item('view.compactMode', 'Compact Mode', {
        command: 'yahooMessenger.toggleCompactMode',
        enabled: false
      }),
      Menu.sep('view.sep2'),
      Menu.item('view.zoomIn', 'Zoom In', {
        command: 'yahooMessenger.zoomIn',
        accel: { key: '=', alt: true }
      }),
      Menu.item('view.zoomOut', 'Zoom Out', {
        command: 'yahooMessenger.zoomOut',
        accel: { key: '-', alt: true }
      }),
      Menu.item('view.resetZoom', 'Reset Zoom', {
        command: 'yahooMessenger.resetZoom',
        accel: { key: '0', alt: true }
      })
    ]),

    // Window menu
    Menu.section('window', 'Window', [
      Menu.item('window.minimize', 'Minimize', {
        command: 'os.minimizeFocused',
        accel: { key: 'M', alt: true }
      }),
      Menu.item('window.close', 'Close Window', {
        command: 'os.closeFocused',
        accel: { key: 'W', alt: true }
      }),
      Menu.sep('window.sep1'),
      Menu.item('window.newWindow', 'New Messenger Window', {
        command: 'app.newWindow',
        args: { appId: 'yahooMessenger' },
        accel: { key: 'N', alt: true, shift: true }
      })
    ]),

    // Help menu
    Menu.section('help', 'Help', [
      Menu.item('help.keyboardShortcuts', 'Keyboard Shortcuts', {
        command: 'system.showShortcuts',
        accel: { key: '/', alt: true }
      }),
      Menu.sep('help.sep1'),
      Menu.item('help.about', 'About Yahoo! Messenger', {
        command: 'yahooMessenger.showAbout'
      }),
      Menu.item('help.whatsnew', "What's New", {
        command: 'yahooMessenger.showWhatsNew',
        enabled: false
      })
    ])
  ])
}
