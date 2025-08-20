// TypingTest App Menu Template
import { Menu, type MenuTemplate } from '../../../../types/menu'

export function createTypingTestMenuTemplate(): MenuTemplate {
  return Menu.template('typingtest', 'TypingTest', [
    // App menu
    Menu.section('typingtest', 'TypingTest', [
      Menu.item('typingtest.about', 'About TypingTest', { 
        command: 'system.showAbout'
      }),
      Menu.item('typingtest.preferences', 'Preferences…', { 
        enabled: false 
      }),
      Menu.sep('typingtest.sep1'),
      Menu.item('typingtest.quit', 'Quit TypingTest', {
        command: 'os.closeFocused',
        accel: { key: 'Q', alt: true }
      })
    ]),

    // Test menu
    Menu.section('test', 'Test', [
      Menu.item('test.new', 'New Test', {
        command: 'typingtest.newTest',
        accel: { key: 'N', alt: true }
      }),
      Menu.item('test.restart', 'Restart Test', {
        command: 'typingtest.restartTest',
        accel: { key: 'R', alt: true }
      }),
      Menu.sep('test.sep1'),
      Menu.item('test.changeText', 'Change Text', {
        command: 'typingtest.changeText',
        accel: { key: 'T', alt: true }
      }),
      Menu.sep('test.sep2'),
      Menu.submenu('test.difficulty', 'Difficulty', [
        Menu.item('test.difficulty.easy', 'Easy', {
          command: 'typingtest.setDifficulty',
          args: { level: 'easy' },
          checked: true
        }),
        Menu.item('test.difficulty.medium', 'Medium', {
          command: 'typingtest.setDifficulty',
          args: { level: 'medium' }
        }),
        Menu.item('test.difficulty.hard', 'Hard', {
          command: 'typingtest.setDifficulty',
          args: { level: 'hard' }
        })
      ]),
      Menu.sep('test.sep3'),
      Menu.item('test.practiceMode', 'Practice Mode', {
        command: 'typingtest.togglePracticeMode',
        checked: false,
        enabled: false
      })
    ]),

    // Settings menu
    Menu.section('settings', 'Settings', [
      Menu.item('settings.sound', 'Sound Effects', {
        command: 'typingtest.toggleSound',
        checked: true,
        accel: { key: 'S', alt: true, shift: true }
      }),
      Menu.item('settings.showKeyboard', 'Show Keyboard', {
        command: 'typingtest.toggleKeyboard',
        checked: true,
        accel: { key: 'K', alt: true }
      }),
      Menu.sep('settings.sep1'),
      Menu.submenu('settings.theme', 'Test Theme', [
        Menu.item('settings.theme.light', 'Light', {
          command: 'typingtest.setTheme',
          args: { theme: 'light' },
          checked: true
        }),
        Menu.item('settings.theme.dark', 'Dark', {
          command: 'typingtest.setTheme',
          args: { theme: 'dark' }
        }),
        Menu.item('settings.theme.highContrast', 'High Contrast', {
          command: 'typingtest.setTheme',
          args: { theme: 'highContrast' }
        })
      ]),
      Menu.sep('settings.sep2'),
      Menu.item('settings.showTimer', 'Show Timer', {
        command: 'typingtest.toggleTimer',
        checked: true
      }),
      Menu.item('settings.showWPM', 'Show Live WPM', {
        command: 'typingtest.toggleLiveWPM',
        checked: true
      }),
      Menu.item('settings.showAccuracy', 'Show Live Accuracy', {
        command: 'typingtest.toggleLiveAccuracy',
        checked: true
      })
    ]),

    // Statistics menu
    Menu.section('stats', 'Statistics', [
      Menu.item('stats.currentSession', 'Current Session', {
        command: 'typingtest.showSessionStats',
        accel: { key: 'I', alt: true }
      }),
      Menu.item('stats.allTime', 'All Time Stats', {
        command: 'typingtest.showAllTimeStats',
        enabled: false
      }),
      Menu.sep('stats.sep1'),
      Menu.item('stats.personalBest', 'Personal Best', {
        command: 'typingtest.showPersonalBest',
        enabled: false
      }),
      Menu.item('stats.history', 'Test History', {
        command: 'typingtest.showHistory',
        enabled: false
      }),
      Menu.sep('stats.sep2'),
      Menu.item('stats.reset', 'Reset Statistics', {
        command: 'typingtest.resetStats',
        enabled: false
      }),
      Menu.item('stats.export', 'Export Statistics…', {
        command: 'typingtest.exportStats',
        enabled: false
      })
    ]),

    // View menu
    Menu.section('view', 'View', [
      Menu.item('view.zoom', 'Zoom', {
        command: 'view.toggleZoom',
        accel: { key: 'Z', alt: true }
      }),
      Menu.item('view.fullscreen', 'Enter Full Screen', {
        command: 'typingtest.toggleFullscreen',
        accel: { key: 'F', alt: true, shift: true }
      }),
      Menu.sep('view.sep1'),
      Menu.item('view.focusMode', 'Focus Mode', {
        command: 'typingtest.toggleFocusMode',
        checked: false,
        enabled: false
      }),
      Menu.item('view.nightMode', 'Night Mode', {
        command: 'typingtest.toggleNightMode',
        checked: false,
        enabled: false
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
      Menu.item('window.cycle', 'Cycle Windows', {
        accel: { key: '`', alt: true },
        enabled: false
      }),
      Menu.sep('window.sep1'),
      Menu.item('window.bringAllToFront', 'Bring All to Front', {
        enabled: false
      })
    ]),

    // Help menu
    Menu.section('help', 'Help', [
      Menu.item('help.typingTips', 'Typing Tips', {
        command: 'typingtest.showTips'
      }),
      Menu.item('help.keyboardShortcuts', 'Keyboard Shortcuts', {
        command: 'system.showShortcuts',
        accel: { key: '/', alt: true }
      }),
      Menu.sep('help.sep1'),
      Menu.item('help.learnToType', 'Learn to Type', {
        command: 'typingtest.showTutorial',
        enabled: false
      }),
      Menu.item('help.fingerPlacement', 'Finger Placement Guide', {
        command: 'typingtest.showFingerGuide',
        enabled: false
      })
    ])
  ])
}
