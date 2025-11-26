// Finder App Menu Template (Phase 2)
import { Menu, type MenuTemplate } from '../../../types/menu'
import { useAppsStore } from '../../../stores/apps'

export function createFinderMenuTemplate(): MenuTemplate {
  // Get all apps for the system submenu
  const appsStore = useAppsStore()
  const appItems = Object.values(appsStore.registry).map(app => 
    Menu.item(`finder.app.${app.id}`, app.title, {
      command: 'app.launch',
      args: { appId: app.id }
    })
  )

  return Menu.template('finder', '', [
    // System menu with logo (empty title since logo is shown)
    Menu.section('finder', '', [
      Menu.item('finder.about', 'About Webintosh', { 
        command: 'system.showAbout'
      }),
      Menu.item('finder.settings', 'System Settings...', { 
        command: 'app.launch',
        args: { appId: 'settings' }
      }),
      Menu.sep('finder.sep1'),
      ...appItems
    ]),

    // File
    Menu.section('file', 'File', [
      Menu.item('file.newWindow', 'New Finder Window', {
        command: 'app.newWindow',
        args: { appId: 'finder' },
        accel: { key: 'N', alt: true }
      }),
      Menu.item('file.newFolder', 'New Folder', {
        command: 'finder.newFolder',
        accel: { key: 'N', alt: true, shift: true }
      }),
      Menu.sep('file.sep1'),
      Menu.item('file.getInfo', 'Get Info', { 
        enabled: false,
        accel: { key: 'I', alt: true }
      }),
      Menu.item('file.rename', 'Rename', { enabled: false }),
      Menu.sep('file.sep2'),
      Menu.item('file.duplicate', 'Duplicate', { enabled: false }),
      Menu.item('file.trash', 'Move to Trash', { 
        enabled: false,
        accel: { key: 'Delete', alt: true }
      })
    ]),

    // Edit
    Menu.section('edit', 'Edit', [
      Menu.item('edit.undo', 'Undo', { 
        command: 'edit.undo',
        accel: { key: 'Z', alt: true }
      }),
      Menu.item('edit.redo', 'Redo', { 
        command: 'edit.redo',
        accel: { key: 'Z', alt: true, shift: true }
      }),
      Menu.sep('edit.sep1'),
      Menu.item('edit.cut', 'Cut', { 
        command: 'edit.cut',
        accel: { key: 'X', alt: true }
      }),
      Menu.item('edit.copy', 'Copy', { 
        command: 'edit.copy',
        accel: { key: 'C', alt: true }
      }),
      Menu.item('edit.paste', 'Paste', { 
        command: 'edit.paste',
        accel: { key: 'V', alt: true }
      }),
      Menu.sep('edit.sep2'),
      Menu.item('edit.selectAll', 'Select All', { 
        command: 'edit.selectAll',
        accel: { key: 'A', alt: true }
      })
    ]),

    // View
    Menu.section('view', 'View', [
      Menu.submenu('view.as', 'View As', [
        Menu.item('view.as.icons', 'Icons', { 
          command: 'finder.viewAs',
          args: { view: 'icons' }
        }),
        Menu.item('view.as.list', 'List', { 
          command: 'finder.viewAs',
          args: { view: 'list' }
        }),
        Menu.item('view.as.columns', 'Columns', { 
          command: 'finder.viewAs',
          args: { view: 'columns' }
        }),
        Menu.item('view.as.gallery', 'Gallery', { 
          command: 'finder.viewAs',
          args: { view: 'gallery' }
        })
      ]),
      Menu.sep('view.sep1'),
      Menu.submenu('view.sortBy', 'Sort By', [
        Menu.item('view.sortBy.name', 'Name', { 
          command: 'finder.sortBy',
          args: { sort: 'name' }
        }),
        Menu.item('view.sortBy.kind', 'Kind', { 
          command: 'finder.sortBy',
          args: { sort: 'kind' }
        }),
        Menu.item('view.sortBy.dateModified', 'Date Modified', { 
          command: 'finder.sortBy',
          args: { sort: 'dateModified' }
        }),
        Menu.item('view.sortBy.size', 'Size', { 
          command: 'finder.sortBy',
          args: { sort: 'size' }
        })
      ]),
      Menu.sep('view.sep2'),
      Menu.item('view.showPathBar', 'Show Path Bar', { 
        command: 'finder.togglePathBar',
        checkable: true
      }),
      Menu.item('view.showStatusBar', 'Show Status Bar', { 
        command: 'finder.toggleStatusBar',
        checkable: true
      }),
      Menu.item('view.showSidebar', 'Show Sidebar', { 
        command: 'finder.toggleSidebar',
        checkable: true
      }),
      Menu.sep('view.sep3'),
      Menu.item('view.showIconPreview', 'Show Icon Preview', { 
        command: 'finder.toggleIconPreview',
        checkable: true
      })
    ]),

    // Go
    Menu.section('go', 'Go', [
      Menu.item('go.desktop', 'Desktop', {
        command: 'finder.goTo',
        args: { location: 'desktop' },
        accel: { key: 'D', alt: true, shift: true }
      }),
      Menu.item('go.documents', 'Documents', {
        command: 'finder.goTo',
        args: { location: 'documents' },
        accel: { key: 'O', alt: true, shift: true }
      }),
      Menu.item('go.downloads', 'Downloads', {
        command: 'finder.goTo',
        args: { location: 'downloads' },
        accel: { key: 'L', alt: true }
      }),
      Menu.item('go.pictures', 'Pictures', {
        command: 'finder.goTo',
        args: { location: 'pictures' }
      }),
      Menu.item('go.music', 'Music', {
        command: 'finder.goTo',
        args: { location: 'music' }
      }),
      Menu.item('go.videos', 'Videos', {
        command: 'finder.goTo',
        args: { location: 'videos' }
      }),
      Menu.sep('go.sep1'),
      Menu.item('go.applications', 'Applications', {
        command: 'finder.goTo',
        args: { location: 'applications' },
        accel: { key: 'A', alt: true, shift: true }
      }),
      Menu.item('go.utilities', 'Utilities', {
        command: 'finder.goTo',
        args: { location: 'utilities' },
        accel: { key: 'U', alt: true, shift: true }
      }),
      Menu.sep('go.sep2'),
      Menu.item('go.recent', 'Recent', {
        command: 'finder.goTo',
        args: { location: 'recent' }
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
      }),
      Menu.sep('window.sep1'),
      Menu.item('window.bringAllToFront', 'Bring All to Front', {
        command: 'finder.bringAllToFront'
      })
    ]),

    // Help
    Menu.section('help', 'Help', [
      Menu.item('help.finderHelp', 'Finder Help', { 
        command: 'help.showFinderHelp'
      }),
      Menu.item('help.shareApp', 'Share Webintosh...', { 
        command: 'help.shareApp'
      }),
      Menu.sep('help.sep1'),
      Menu.item('help.aboutFinder', 'About Finder', { 
        command: 'help.showAboutFinder'
      })
    ])
  ])
}