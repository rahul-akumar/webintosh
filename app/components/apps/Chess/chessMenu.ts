// Chess App Menu Template
import { Menu, type MenuTemplate } from '../../../types/menu'

export function createChessMenuTemplate(): MenuTemplate {
  return Menu.template('chess', 'Chess', [
    // App menu
    Menu.section('chess', 'Chess', [
      Menu.item('chess.about', 'About Chess', {
        command: 'system.showAbout'
      }),
      Menu.item('chess.preferences', 'Preferences…', { enabled: false }),
      Menu.sep('chess.sep1'),
      Menu.item('chess.quit', 'Quit Chess', {
        command: 'os.closeFocused',
        accel: { key: 'Q', alt: true }
      })
    ]),

    // Game menu
    Menu.section('game', 'Game', [
      Menu.item('game.newGame', 'New Game', {
        command: 'chess.newGame',
        accel: { key: 'N', alt: true }
      }),
      Menu.item('game.undoMove', 'Undo Move', {
        command: 'chess.undoMove',
        accel: { key: 'Z', alt: true }
      }),
      Menu.sep('game.sep1'),
      Menu.submenu('game.mode', 'Mode', [
        Menu.item('game.mode.ai', 'vs AI', {
          command: 'chess.setMode',
          args: { mode: 'ai' }
        }),
        Menu.item('game.mode.player', 'vs Player', {
          command: 'chess.setMode',
          args: { mode: 'player' }
        })
      ]),
      Menu.submenu('game.difficulty', 'Difficulty', [
        Menu.item('game.difficulty.easy', 'Easy', {
          command: 'chess.setDifficulty',
          args: { level: 'easy' }
        }),
        Menu.item('game.difficulty.medium', 'Medium', {
          command: 'chess.setDifficulty',
          args: { level: 'medium' }
        }),
        Menu.item('game.difficulty.hard', 'Hard', {
          command: 'chess.setDifficulty',
          args: { level: 'hard' }
        })
      ])
    ]),

    // View menu
    Menu.section('view', 'View', [
      Menu.item('view.zoom', 'Zoom', {
        command: 'view.toggleZoom'
      }),
      Menu.item('view.enterFullScreen', 'Enter Full Screen', {
        command: 'view.toggleFullScreen',
        accel: { key: 'F', alt: true, shift: true }
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
      Menu.item('window.cycle', 'Cycle Through Windows', {
        command: 'os.cycleWindows',
        accel: { key: '`', alt: true }
      })
    ]),

    // Help menu
    Menu.section('help', 'Help', [
      Menu.item('help.keyboardShortcuts', 'Keyboard Shortcuts', {
        command: 'system.showShortcuts',
        accel: { key: '/', alt: true }
      })
    ])
  ])
}


