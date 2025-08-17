// Finder App Menu Template (Phase 2)
import { Menu, type MenuTemplate } from '../../../../types/menu'

export function createFinderMenuTemplate(): MenuTemplate {
  return Menu.template('finder', 'Finder', [
    // App menu
    Menu.section('finder', 'Finder', [
      Menu.item('finder.about', 'About Finder', { enabled: false }),
      Menu.item('finder.preferences', 'Preferences…', { enabled: false })
    ]),

    // File
    Menu.section('file', 'File', [
      Menu.item('file.newWindow', 'New Window', {
        command: 'app.newWindow',
        args: { appId: 'finder' },
        accel: { key: 'N', alt: true }
      }),
      Menu.item('file.shortcuts', 'Shortcuts', {
        command: 'system.showShortcuts',
        accel: { key: '/', alt: true }
      })
    ]),

    // Edit (placeholders)
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