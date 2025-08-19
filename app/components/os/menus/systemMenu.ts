// System Menu Template (Phase 2)
import { Menu, type MenuTemplate } from '../../../../types/menu'
import { useAppsStore } from '../../../../stores/apps'

export function createSystemMenuTemplate(): MenuTemplate {
  // Get all apps for the submenu
  const appsStore = useAppsStore()
  const appItems = Object.values(appsStore.registry).map(app => 
    Menu.item(`system.app.${app.id}`, app.title, {
      command: 'app.launch',
      args: { appId: app.id }
    })
  )

  return Menu.template('system', '', [
    // System menu with logo (empty title since logo is shown)
    Menu.section('system', '', [
      Menu.item('system.about', 'About Webintosh', { 
        command: 'system.showAbout'
      }),
      Menu.item('system.settings', 'System Settings...', { 
        command: 'app.launch',
        args: { appId: 'settings' }
      }),
      Menu.sep('system.sep1'),
      ...appItems
    ]),

    // File
    Menu.section('file', 'File', [
      Menu.item('file.openWindow', 'Open Window', {
        command: 'os.openWindow',
        accel: { key: 'N', alt: true }
      }),
      Menu.item('file.shortcuts', 'Shortcuts', {
        command: 'system.showShortcuts',
        accel: { key: '/', alt: true }
      }),
      Menu.submenu('file.developer', 'Developer', [
        Menu.item('file.dev.openTestWindow', 'Open Test Window', {
          command: 'os.openTestWindow'
        })
      ])
    ]),

    // Edit (placeholders, disabled)
    Menu.section('edit', 'Edit', [
      Menu.item('edit.undo', 'Undo', { enabled: false }),
      Menu.item('edit.redo', 'Redo', { enabled: false }),
      Menu.sep('edit.sep1'),
      Menu.item('edit.cut', 'Cut', { enabled: false }),
      Menu.item('edit.copy', 'Copy', { enabled: false }),
      Menu.item('edit.paste', 'Paste', { enabled: false })
    ]),

    // View
    Menu.section('view', 'View', [
      Menu.item('view.zoom', 'Zoom', {
        command: 'view.toggleZoom',
        accel: { key: 'Z', alt: true }
      })
    ]),

    // Window
    Menu.section('window', 'Window', [
      Menu.item('window.minimize', 'Minimize', {
        command: 'os.minimizeFocused',
        accel: { key: 'M', alt: true }
      }),
      Menu.item('window.close', 'Close Window', {
        command: 'os.closeFocused',
        accel: { key: 'W', alt: true }
      }),
      // Displayed for awareness; actual cycling wired in Phase 5 keyboard layer
      Menu.item('window.cycle', 'Cycle Windows', {
        accel: { key: '`', alt: true },
        enabled: false
      })
    ]),

    // Help (placeholder)
    Menu.section('help', 'Help', [
      Menu.item('help.search', 'Search', { enabled: false })
    ])
  ])
}