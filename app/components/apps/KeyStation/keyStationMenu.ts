// KeyStation App Menu Template
import { Menu, type MenuTemplate } from '../../../../types/menu'

export function createKeyStationMenuTemplate(): MenuTemplate {
  return Menu.template('keystation', 'KeyStation', [
    // App menu
    Menu.section('keystation', 'KeyStation', [
      Menu.item('keystation.about', 'About KeyStation', { 
        command: 'system.showAbout'
      }),
      Menu.item('keystation.preferences', 'Preferences…', { 
        enabled: false 
      }),
      Menu.sep('keystation.sep1'),
      Menu.item('keystation.quit', 'Quit KeyStation', {
        command: 'os.closeFocused',
        accel: { key: 'Q', alt: true }
      })
    ]),

    // File menu
    Menu.section('file', 'File', [
      Menu.item('file.newSession', 'New Session', {
        command: 'keystation.newSession',
        accel: { key: 'N', alt: true }
      }),
      Menu.sep('file.sep1'),
      Menu.item('file.startRecording', 'Start Recording', {
        command: 'keystation.startRecording',
        accel: { key: 'R', alt: true }
      }),
      Menu.item('file.stopRecording', 'Stop Recording', {
        command: 'keystation.stopRecording',
        accel: { key: 'R', alt: true, shift: true },
        enabled: false
      }),
      Menu.item('file.playRecording', 'Play Recording', {
        command: 'keystation.playRecording',
        accel: { key: 'P', alt: true }
      }),
      Menu.item('file.clearRecording', 'Clear Recording', {
        command: 'keystation.clearRecording'
      }),
      Menu.sep('file.sep2'),
      Menu.item('file.export', 'Export Audio…', {
        command: 'keystation.exportAudio',
        enabled: false
      }),
      Menu.item('file.importMidi', 'Import MIDI…', {
        command: 'keystation.importMidi',
        enabled: false
      })
    ]),

    // Edit menu
    Menu.section('edit', 'Edit', [
      Menu.item('edit.undo', 'Undo', {
        command: 'keystation.undo',
        accel: { key: 'Z', alt: true },
        enabled: false
      }),
      Menu.item('edit.redo', 'Redo', {
        command: 'keystation.redo',
        accel: { key: 'Z', alt: true, shift: true },
        enabled: false
      }),
      Menu.sep('edit.sep1'),
      Menu.item('edit.copy', 'Copy Pattern', {
        command: 'keystation.copyPattern',
        accel: { key: 'C', alt: true },
        enabled: false
      }),
      Menu.item('edit.paste', 'Paste Pattern', {
        command: 'keystation.pastePattern',
        accel: { key: 'V', alt: true },
        enabled: false
      }),
      Menu.sep('edit.sep2'),
      Menu.item('edit.clearAll', 'Clear All', {
        command: 'keystation.clearAll'
      })
    ]),

    // Instrument menu
    Menu.section('instrument', 'Instrument', [
      Menu.item('instrument.piano', 'Piano', {
        command: 'keystation.setInstrument',
        args: { instrument: 'piano' },
        checked: true
      }),
      Menu.item('instrument.synth', 'Synth', {
        command: 'keystation.setInstrument',
        args: { instrument: 'synth' }
      }),
      Menu.item('instrument.organ', 'Organ', {
        command: 'keystation.setInstrument',
        args: { instrument: 'organ' }
      }),
      Menu.item('instrument.strings', 'Strings', {
        command: 'keystation.setInstrument',
        args: { instrument: 'strings' }
      }),
      Menu.item('instrument.brass', 'Brass', {
        command: 'keystation.setInstrument',
        args: { instrument: 'brass' }
      }),
      Menu.item('instrument.flute', 'Flute', {
        command: 'keystation.setInstrument',
        args: { instrument: 'flute' }
      }),
      Menu.sep('instrument.sep1'),
      Menu.submenu('instrument.oscillator', 'Oscillator Type', [
        Menu.item('instrument.oscillator.sine', 'Sine', {
          command: 'keystation.setOscillator',
          args: { type: 'sine' },
          checked: true
        }),
        Menu.item('instrument.oscillator.triangle', 'Triangle', {
          command: 'keystation.setOscillator',
          args: { type: 'triangle' }
        }),
        Menu.item('instrument.oscillator.sawtooth', 'Sawtooth', {
          command: 'keystation.setOscillator',
          args: { type: 'sawtooth' }
        }),
        Menu.item('instrument.oscillator.square', 'Square', {
          command: 'keystation.setOscillator',
          args: { type: 'square' }
        })
      ])
    ]),

    // Effects menu
    Menu.section('effects', 'Effects', [
      Menu.submenu('effects.reverb', 'Reverb', [
        Menu.item('effects.reverb.off', 'Off', {
          command: 'keystation.setReverb',
          args: { level: 0 },
          checked: false
        }),
        Menu.item('effects.reverb.low', 'Low (20%)', {
          command: 'keystation.setReverb',
          args: { level: 20 },
          checked: true
        }),
        Menu.item('effects.reverb.medium', 'Medium (50%)', {
          command: 'keystation.setReverb',
          args: { level: 50 }
        }),
        Menu.item('effects.reverb.high', 'High (80%)', {
          command: 'keystation.setReverb',
          args: { level: 80 }
        }),
        Menu.item('effects.reverb.max', 'Maximum', {
          command: 'keystation.setReverb',
          args: { level: 100 }
        })
      ]),
      Menu.submenu('effects.delay', 'Delay', [
        Menu.item('effects.delay.off', 'Off', {
          command: 'keystation.setDelay',
          args: { level: 0 },
          checked: true
        }),
        Menu.item('effects.delay.low', 'Low (25%)', {
          command: 'keystation.setDelay',
          args: { level: 25 }
        }),
        Menu.item('effects.delay.medium', 'Medium (50%)', {
          command: 'keystation.setDelay',
          args: { level: 50 }
        }),
        Menu.item('effects.delay.high', 'High (75%)', {
          command: 'keystation.setDelay',
          args: { level: 75 }
        }),
        Menu.item('effects.delay.max', 'Maximum', {
          command: 'keystation.setDelay',
          args: { level: 100 }
        })
      ]),
      Menu.sep('effects.sep1'),
      Menu.item('effects.sustain', 'Sustain Pedal', {
        command: 'keystation.toggleSustain',
        accel: { key: ' ', alt: false },
        checked: false
      })
    ]),

    // Octave menu
    Menu.section('octave', 'Octave', [
      Menu.item('octave.c1', 'C1', {
        command: 'keystation.setOctave',
        args: { octave: 1 }
      }),
      Menu.item('octave.c2', 'C2', {
        command: 'keystation.setOctave',
        args: { octave: 2 }
      }),
      Menu.item('octave.c3', 'C3', {
        command: 'keystation.setOctave',
        args: { octave: 3 }
      }),
      Menu.item('octave.c4', 'C4', {
        command: 'keystation.setOctave',
        args: { octave: 4 },
        checked: true
      }),
      Menu.item('octave.c5', 'C5', {
        command: 'keystation.setOctave',
        args: { octave: 5 }
      }),
      Menu.item('octave.c6', 'C6', {
        command: 'keystation.setOctave',
        args: { octave: 6 }
      }),
      Menu.item('octave.c7', 'C7', {
        command: 'keystation.setOctave',
        args: { octave: 7 }
      }),
      Menu.sep('octave.sep1'),
      Menu.item('octave.up', 'Octave Up', {
        command: 'keystation.octaveUp',
        accel: { key: ']', alt: true }
      }),
      Menu.item('octave.down', 'Octave Down', {
        command: 'keystation.octaveDown',
        accel: { key: '[', alt: true }
      })
    ]),

    // Audio menu
    Menu.section('audio', 'Audio', [
      Menu.submenu('audio.volume', 'Master Volume', [
        Menu.item('audio.volume.mute', 'Mute', {
          command: 'keystation.setVolume',
          args: { level: 0 }
        }),
        Menu.item('audio.volume.25', '25%', {
          command: 'keystation.setVolume',
          args: { level: 25 }
        }),
        Menu.item('audio.volume.50', '50%', {
          command: 'keystation.setVolume',
          args: { level: 50 },
          checked: true
        }),
        Menu.item('audio.volume.75', '75%', {
          command: 'keystation.setVolume',
          args: { level: 75 }
        }),
        Menu.item('audio.volume.100', '100%', {
          command: 'keystation.setVolume',
          args: { level: 100 }
        })
      ]),
      Menu.sep('audio.sep1'),
      Menu.item('audio.volumeUp', 'Volume Up', {
        command: 'keystation.volumeUp',
        accel: { key: '=', alt: true }
      }),
      Menu.item('audio.volumeDown', 'Volume Down', {
        command: 'keystation.volumeDown',
        accel: { key: '-', alt: true }
      }),
      Menu.sep('audio.sep2'),
      Menu.item('audio.resetAudio', 'Reset Audio Context', {
        command: 'keystation.resetAudio'
      })
    ]),

    // View menu
    Menu.section('view', 'View', [
      Menu.item('view.zoom', 'Zoom', {
        command: 'view.toggleZoom',
        accel: { key: 'Z', alt: true }
      }),
      Menu.sep('view.sep1'),
      Menu.item('view.showWaveform', 'Show Waveform', {
        command: 'keystation.toggleWaveform',
        checked: true
      }),
      Menu.item('view.showKeyLabels', 'Show Key Labels', {
        command: 'keystation.toggleKeyLabels',
        checked: true
      }),
      Menu.item('view.showOctaveLabels', 'Show Octave Labels', {
        command: 'keystation.toggleOctaveLabels',
        checked: true
      }),
      Menu.sep('view.sep2'),
      Menu.item('view.compactMode', 'Compact Mode', {
        command: 'keystation.toggleCompactMode',
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
      Menu.sep('window.sep1'),
      Menu.item('window.newWindow', 'New KeyStation Window', {
        command: 'app.newWindow',
        args: { appId: 'keystation' },
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
      Menu.item('help.keyboardLayout', 'Keyboard Layout Guide', {
        command: 'keystation.showKeyboardGuide'
      }),
      Menu.item('help.midiLearn', 'MIDI Learn Mode', {
        command: 'keystation.toggleMidiLearn',
        enabled: false
      }),
      Menu.sep('help.sep2'),
      Menu.item('help.documentation', 'KeyStation Documentation', {
        command: 'keystation.showDocumentation',
        enabled: false
      })
    ])
  ])
}
