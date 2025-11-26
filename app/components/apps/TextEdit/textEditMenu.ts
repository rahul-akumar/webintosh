// TextEdit App Menu Template
import { Menu, type MenuTemplate } from '../../../types/menu'

export function createTextEditMenuTemplate(): MenuTemplate {
  return Menu.template('textedit', 'TextEdit', [
    // App menu
    Menu.section('textedit', 'TextEdit', [
      Menu.item('textedit.about', 'About TextEdit'),
      Menu.item('textedit.preferences', 'Preferences…', { enabled: false }),
      Menu.sep('textedit.sep1'),
      Menu.item('textedit.quit', 'Quit TextEdit', {
        command: 'os.closeFocused',
        accel: { key: 'Q', alt: true }
      })
    ]),

    // File
    Menu.section('file', 'File', [
      Menu.item('file.new', 'New', {
        command: 'app.newDocument',
        args: { appId: 'textedit' },
        accel: { key: 'N', alt: true }
      }),
      Menu.item('file.open', 'Open…', {
        command: 'textedit.open',
        accel: { key: 'O', alt: true }
      }),
      Menu.item('file.openRecent', 'Open Recent', { enabled: false }),
      Menu.sep('file.sep1'),
      Menu.item('file.save', 'Save', {
        command: 'textedit.save',
        accel: { key: 'S', alt: true }
      }),
      Menu.item('file.saveAs', 'Save As…', {
        command: 'textedit.saveAs',
        accel: { key: 'S', alt: true, shift: true }
      }),
      Menu.item('file.export', 'Export As PDF…', { enabled: false }),
      Menu.sep('file.sep2'),
      Menu.item('file.print', 'Print…', {
        command: 'textedit.print',
        accel: { key: 'P', alt: true }
      }),
      Menu.sep('file.sep3'),
      Menu.item('file.close', 'Close', {
        command: 'os.closeFocused',
        accel: { key: 'W', alt: true }
      })
    ]),

    // Edit
    Menu.section('edit', 'Edit', [
      Menu.item('edit.undo', 'Undo', {
        command: 'textedit.undo',
        accel: { key: 'Z', alt: true }
      }),
      Menu.item('edit.redo', 'Redo', {
        command: 'textedit.redo',
        accel: { key: 'Z', alt: true, shift: true }
      }),
      Menu.sep('edit.sep1'),
      Menu.item('edit.cut', 'Cut', {
        command: 'textedit.cut',
        accel: { key: 'X', alt: true }
      }),
      Menu.item('edit.copy', 'Copy', {
        command: 'textedit.copy',
        accel: { key: 'C', alt: true }
      }),
      Menu.item('edit.paste', 'Paste', {
        command: 'textedit.paste',
        accel: { key: 'V', alt: true }
      }),
      Menu.item('edit.pasteAndMatchStyle', 'Paste and Match Style', {
        command: 'textedit.pasteAndMatchStyle',
        accel: { key: 'V', alt: true, shift: true }
      }),
      Menu.item('edit.delete', 'Delete'),
      Menu.item('edit.selectAll', 'Select All', {
        command: 'textedit.selectAll',
        accel: { key: 'A', alt: true }
      }),
      Menu.sep('edit.sep2'),
      Menu.item('edit.find', 'Find…', {
        command: 'textedit.find',
        accel: { key: 'F', alt: true }
      }),
      Menu.item('edit.findAndReplace', 'Find and Replace…', {
        command: 'textedit.findAndReplace',
        accel: { key: 'F', alt: true, shift: true }
      }),
      Menu.item('edit.findNext', 'Find Next', {
        command: 'textedit.findNext',
        accel: { key: 'G', alt: true }
      }),
      Menu.item('edit.findPrevious', 'Find Previous', {
        command: 'textedit.findPrevious',
        accel: { key: 'G', alt: true, shift: true }
      })
    ]),

    // Format
    Menu.section('format', 'Format', [
      Menu.item('format.bold', 'Bold', {
        command: 'textedit.bold',
        accel: { key: 'B', alt: true }
      }),
      Menu.item('format.italic', 'Italic', {
        command: 'textedit.italic',
        accel: { key: 'I', alt: true }
      }),
      Menu.item('format.underline', 'Underline', {
        command: 'textedit.underline',
        accel: { key: 'U', alt: true }
      }),
      Menu.item('format.strikethrough', 'Strikethrough', {
        command: 'textedit.strikethrough'
      }),
      Menu.sep('format.sep1'),
      Menu.item('format.alignLeft', 'Align Left', {
        command: 'textedit.alignLeft',
        accel: { key: 'L', alt: true, shift: true }
      }),
      Menu.item('format.alignCenter', 'Center', {
        command: 'textedit.alignCenter',
        accel: { key: 'E', alt: true, shift: true }
      }),
      Menu.item('format.alignRight', 'Align Right', {
        command: 'textedit.alignRight',
        accel: { key: 'R', alt: true, shift: true }
      }),
      Menu.item('format.justify', 'Justify', {
        command: 'textedit.justify',
        accel: { key: 'J', alt: true, shift: true }
      }),
      Menu.sep('format.sep2'),
      Menu.item('format.bulletList', 'Bullet List', {
        command: 'textedit.bulletList',
        accel: { key: '8', alt: true, shift: true }
      }),
      Menu.item('format.numberedList', 'Numbered List', {
        command: 'textedit.numberedList',
        accel: { key: '7', alt: true, shift: true }
      }),
      Menu.sep('format.sep3'),
      Menu.item('format.increaseIndent', 'Increase Indent', {
        command: 'textedit.increaseIndent',
        accel: { key: ']', alt: true }
      }),
      Menu.item('format.decreaseIndent', 'Decrease Indent', {
        command: 'textedit.decreaseIndent',
        accel: { key: '[', alt: true }
      }),
      Menu.sep('format.sep4'),
      Menu.item('format.font', 'Font…', {
        command: 'textedit.showFonts'
      }),
      Menu.submenu('format.fontSize', 'Font Size', [
        Menu.item('format.fontSize.smaller', 'Smaller', {
          command: 'textedit.fontSizeSmaller',
          accel: { key: '-', alt: true }
        }),
        Menu.item('format.fontSize.larger', 'Larger', {
          command: 'textedit.fontSizeLarger',
          accel: { key: '=', alt: true }
        })
      ]),
      Menu.sep('format.sep5'),
      Menu.item('format.clearFormatting', 'Clear Formatting', {
        command: 'textedit.clearFormatting'
      })
    ]),

    // View
    Menu.section('view', 'View', [
      Menu.item('view.zoomIn', 'Zoom In', {
        command: 'textedit.zoomIn',
        accel: { key: '=', alt: true }
      }),
      Menu.item('view.zoomOut', 'Zoom Out', {
        command: 'textedit.zoomOut',
        accel: { key: '-', alt: true }
      }),
      Menu.item('view.actualSize', 'Actual Size', {
        command: 'textedit.zoomReset',
        accel: { key: '0', alt: true }
      }),
      Menu.sep('view.sep1'),
      Menu.item('view.showToolbar', 'Show Toolbar', {
        command: 'textedit.toggleToolbar',
        checkable: true,
        checked: true
      }),
      Menu.item('view.showRuler', 'Show Ruler', {
        command: 'textedit.toggleRuler',
        checkable: true
      }),
      Menu.item('view.showInvisibles', 'Show Invisibles', {
        command: 'textedit.toggleInvisibles',
        checkable: true
      }),
      Menu.sep('view.sep2'),
      Menu.item('view.enterFullScreen', 'Enter Full Screen', {
        command: 'view.toggleFullScreen',
        accel: { key: 'F', alt: true, shift: true }
      })
    ]),

    // Window
    Menu.section('window', 'Window', [
      Menu.item('window.minimize', 'Minimize', {
        command: 'os.minimizeFocused',
        accel: { key: 'M', alt: true }
      }),
      Menu.item('window.zoom', 'Zoom', {
        command: 'view.toggleZoom'
      }),
      Menu.sep('window.sep1'),
      Menu.item('window.bringAllToFront', 'Bring All to Front', {
        command: 'textedit.bringAllToFront'
      }),
      Menu.sep('window.sep2'),
      Menu.item('window.cycle', 'Cycle Through Windows', {
        command: 'os.cycleWindows',
        accel: { key: '`', alt: true }
      })
    ]),

    // Help
    Menu.section('help', 'Help', [
      Menu.item('help.textEditHelp', 'TextEdit Help', { enabled: false }),
      Menu.item('help.shortcuts', 'Keyboard Shortcuts', {
        command: 'system.showShortcuts',
        accel: { key: '/', alt: true }
      })
    ])
  ])
}