/**
 * Strongly-typed command registry for menu and keyboard commands.
 * Provides type-safe command execution with proper payload types.
 */

/**
 * Command payload types - maps each command ID to its expected arguments.
 * Commands with no arguments use `void`.
 */
export interface CommandPayloads {
  // OS-level commands
  'os.openWindow': undefined
  'os.openTestWindow': undefined
  'os.closeFocused': undefined
  'os.minimizeFocused': undefined
  'os.maximizeFocused': undefined
  'os.restoreWindowById': { id: number }
  'os.cycleWindows': undefined

  // View commands
  'view.toggleZoom': undefined
  'view.toggleFullScreen': undefined

  // App-level commands
  'app.launch': { appId: string }
  'app.newWindow': { appId?: string }
  'app.newDocument': { appId?: string }

  // System utilities
  'system.showShortcuts': undefined
  'system.showAbout': undefined

  // Desktop commands
  'desktop.changeWallpaper': undefined
  'desktop.cleanUpIcons': undefined
  'desktop.sortIcons': { sortBy: 'name' | 'type' }
  'desktop.setIconDirection': { direction: 'left' | 'right' }
  'desktop.setIconSize': { size: 'small' | 'medium' | 'large' }

  // Edit commands (shared)
  'edit.undo': undefined
  'edit.redo': undefined
  'edit.cut': undefined
  'edit.copy': undefined
  'edit.paste': undefined
  'edit.selectAll': undefined

  // Document commands (shared)
  'document.copy': undefined
  'document.paste': undefined
  'document.selectAll': undefined

  // TextEdit commands
  'textedit.save': undefined
  'textedit.open': undefined
  'textedit.saveAs': undefined
  'textedit.print': undefined
  'textedit.undo': undefined
  'textedit.redo': undefined
  'textedit.cut': undefined
  'textedit.copy': undefined
  'textedit.paste': undefined
  'textedit.pasteAndMatchStyle': undefined
  'textedit.selectAll': undefined
  'textedit.find': undefined
  'textedit.findAndReplace': undefined
  'textedit.findNext': undefined
  'textedit.findPrevious': undefined
  'textedit.bold': undefined
  'textedit.italic': undefined
  'textedit.underline': undefined
  'textedit.strikethrough': undefined
  'textedit.alignLeft': undefined
  'textedit.alignCenter': undefined
  'textedit.alignRight': undefined
  'textedit.justify': undefined
  'textedit.bulletList': undefined
  'textedit.numberedList': undefined
  'textedit.increaseIndent': undefined
  'textedit.decreaseIndent': undefined
  'textedit.showFonts': undefined
  'textedit.fontSizeSmaller': undefined
  'textedit.fontSizeLarger': undefined
  'textedit.clearFormatting': undefined
  'textedit.zoomIn': undefined
  'textedit.zoomOut': undefined
  'textedit.zoomReset': undefined
  'textedit.toggleToolbar': undefined
  'textedit.toggleRuler': undefined
  'textedit.toggleInvisibles': undefined
  'textedit.bringAllToFront': undefined

  // Finder commands
  'finder.newFolder': undefined
  'finder.viewAs': { view: 'icons' | 'list' | 'columns' | 'gallery' }
  'finder.sortBy': { sortBy: 'name' | 'date' | 'size' | 'kind' }
  'finder.togglePathBar': undefined
  'finder.toggleStatusBar': undefined
  'finder.toggleSidebar': undefined
  'finder.toggleIconPreview': undefined
  'finder.goTo': { path: string }
  'finder.bringAllToFront': undefined

  // Help commands
  'help.showFinderHelp': undefined
  'help.shareApp': undefined
  'help.showAboutFinder': undefined

  // TypingTest commands
  'typingtest.newTest': undefined
  'typingtest.restartTest': undefined
  'typingtest.changeText': undefined
  'typingtest.setDifficulty': { difficulty: 'easy' | 'medium' | 'hard' }
  'typingtest.toggleSound': undefined
  'typingtest.toggleKeyboard': undefined
  'typingtest.setTheme': { theme: string }
  'typingtest.toggleTimer': undefined
  'typingtest.toggleLiveWPM': undefined
  'typingtest.toggleLiveAccuracy': undefined
  'typingtest.showSessionStats': undefined
  'typingtest.toggleFullscreen': undefined
  'typingtest.showTips': undefined
  'typingtest.togglePracticeMode': undefined
  'typingtest.toggleFocusMode': undefined
  'typingtest.toggleNightMode': undefined
  'typingtest.showAllTimeStats': undefined
  'typingtest.showPersonalBest': undefined
  'typingtest.showHistory': undefined
  'typingtest.resetStats': undefined
  'typingtest.exportStats': undefined
  'typingtest.showTutorial': undefined
  'typingtest.showFingerGuide': undefined

  // KeyStation commands
  'keystation.newSession': undefined
  'keystation.startRecording': undefined
  'keystation.stopRecording': undefined
  'keystation.playRecording': undefined
  'keystation.clearRecording': undefined
  'keystation.exportAudio': undefined
  'keystation.importMidi': undefined
  'keystation.undo': undefined
  'keystation.redo': undefined
  'keystation.copyPattern': undefined
  'keystation.pastePattern': undefined
  'keystation.clearAll': undefined
  'keystation.setInstrument': { instrument: string }
  'keystation.setOscillator': { oscillator: string }
  'keystation.setReverb': { level: number }
  'keystation.setDelay': { level: number }
  'keystation.toggleSustain': undefined
  'keystation.setOctave': { octave: number }
  'keystation.octaveUp': undefined
  'keystation.octaveDown': undefined
  'keystation.setVolume': { volume: number }
  'keystation.volumeUp': undefined
  'keystation.volumeDown': undefined
  'keystation.resetAudio': undefined
  'keystation.toggleWaveform': undefined
  'keystation.toggleKeyLabels': undefined
  'keystation.toggleOctaveLabels': undefined
  'keystation.toggleCompactMode': undefined
  'keystation.showKeyboardGuide': undefined
  'keystation.toggleMidiLearn': undefined
  'keystation.showDocumentation': undefined

  // Yahoo Messenger commands
  'yahooMessenger.signOut': undefined
  'yahooMessenger.newMessage': undefined
  'yahooMessenger.joinChannel': undefined
  'yahooMessenger.switchChannel': { channel: string }
  'yahooMessenger.showDirectMessages': undefined
  'yahooMessenger.clearChat': undefined
  'yahooMessenger.clearAllChats': undefined
  'yahooMessenger.setStatus': { status: 'online' | 'away' | 'busy' | 'invisible' }
  'yahooMessenger.setStatusMessage': { message: string }
  'yahooMessenger.sendBuzz': undefined
  'yahooMessenger.insertEmoticon': { emoticon: string }
  'yahooMessenger.toggleSounds': undefined
  'yahooMessenger.toggleNotifications': undefined
  'yahooMessenger.findInChat': undefined
  'yahooMessenger.toggleSidebar': undefined
  'yahooMessenger.toggleOnlineUsers': undefined
  'yahooMessenger.toggleCompactMode': undefined
  'yahooMessenger.zoomIn': undefined
  'yahooMessenger.zoomOut': undefined
  'yahooMessenger.resetZoom': undefined
  'yahooMessenger.showAbout': undefined
  'yahooMessenger.showWhatsNew': undefined

  // WhiteNoise commands
  'whitenoise.stopAll': undefined
  'whitenoise.toggleSound': { soundId: string }
  'whitenoise.loadPreset': { presetId: string }
  'whitenoise.savePreset': undefined
  'whitenoise.managePresets': undefined
  'whitenoise.masterVolumeUp': undefined
  'whitenoise.masterVolumeDown': undefined
  'whitenoise.muteAll': undefined
  'whitenoise.fadeIn': undefined
  'whitenoise.fadeOut': undefined
  'whitenoise.toggleCompactMode': undefined
  'whitenoise.toggleVolumeSliders': undefined
  'whitenoise.showSoundInfo': undefined
  'whitenoise.showTips': undefined
  'whitenoise.showAudioHelp': undefined

  // Chess commands
  'chess.newGame': undefined
  'chess.undoMove': undefined
  'chess.setMode': { mode: 'pvp' | 'ai' }
  'chess.setDifficulty': { difficulty: 'easy' | 'medium' | 'hard' }
}

/**
 * Union type of all valid command IDs.
 * This replaces the manual CommandId union in types/menu.ts
 */
export type CommandId = keyof CommandPayloads

/**
 * Type-safe command handler signature.
 */
export type CommandHandler<K extends CommandId> = 
  CommandPayloads[K] extends undefined 
    ? () => void 
    : (args: CommandPayloads[K]) => void

/**
 * Generic command handler that accepts unknown args (for internal registry).
 */
export type AnyCommandHandler = (args?: unknown) => void

/**
 * Helper to safely extract a typed property from args.
 */
export function getArg<T>(args: unknown, key: string): T | undefined {
  if (args && typeof args === 'object' && key in (args as Record<string, unknown>)) {
    return (args as Record<string, unknown>)[key] as T
  }
  return undefined
}

// Build a Set of valid commands at module load for O(1) lookup
const VALID_COMMANDS: ReadonlySet<string> = new Set<CommandId>([
  // OS-level commands
  'os.openWindow',
  'os.openTestWindow',
  'os.closeFocused',
  'os.minimizeFocused',
  'os.maximizeFocused',
  'os.restoreWindowById',
  'os.cycleWindows',
  // View commands
  'view.toggleZoom',
  'view.toggleFullScreen',
  // App-level commands
  'app.launch',
  'app.newWindow',
  'app.newDocument',
  // System utilities
  'system.showShortcuts',
  'system.showAbout',
  // Desktop commands
  'desktop.changeWallpaper',
  'desktop.cleanUpIcons',
  'desktop.sortIcons',
  'desktop.setIconDirection',
  'desktop.setIconSize',
  // Edit commands
  'edit.undo',
  'edit.redo',
  'edit.cut',
  'edit.copy',
  'edit.paste',
  'edit.selectAll',
  // Document commands
  'document.copy',
  'document.paste',
  'document.selectAll',
  // TextEdit commands
  'textedit.save',
  'textedit.open',
  'textedit.saveAs',
  'textedit.print',
  'textedit.undo',
  'textedit.redo',
  'textedit.cut',
  'textedit.copy',
  'textedit.paste',
  'textedit.pasteAndMatchStyle',
  'textedit.selectAll',
  'textedit.find',
  'textedit.findAndReplace',
  'textedit.findNext',
  'textedit.findPrevious',
  'textedit.bold',
  'textedit.italic',
  'textedit.underline',
  'textedit.strikethrough',
  'textedit.alignLeft',
  'textedit.alignCenter',
  'textedit.alignRight',
  'textedit.justify',
  'textedit.bulletList',
  'textedit.numberedList',
  'textedit.increaseIndent',
  'textedit.decreaseIndent',
  'textedit.showFonts',
  'textedit.fontSizeSmaller',
  'textedit.fontSizeLarger',
  'textedit.clearFormatting',
  'textedit.zoomIn',
  'textedit.zoomOut',
  'textedit.zoomReset',
  'textedit.toggleToolbar',
  'textedit.toggleRuler',
  'textedit.toggleInvisibles',
  'textedit.bringAllToFront',
  // Finder commands
  'finder.newFolder',
  'finder.viewAs',
  'finder.sortBy',
  'finder.togglePathBar',
  'finder.toggleStatusBar',
  'finder.toggleSidebar',
  'finder.toggleIconPreview',
  'finder.goTo',
  'finder.bringAllToFront',
  // Help commands
  'help.showFinderHelp',
  'help.shareApp',
  'help.showAboutFinder',
  // TypingTest commands
  'typingtest.newTest',
  'typingtest.restartTest',
  'typingtest.changeText',
  'typingtest.setDifficulty',
  'typingtest.toggleSound',
  'typingtest.toggleKeyboard',
  'typingtest.setTheme',
  'typingtest.toggleTimer',
  'typingtest.toggleLiveWPM',
  'typingtest.toggleLiveAccuracy',
  'typingtest.showSessionStats',
  'typingtest.toggleFullscreen',
  'typingtest.showTips',
  'typingtest.togglePracticeMode',
  'typingtest.toggleFocusMode',
  'typingtest.toggleNightMode',
  'typingtest.showAllTimeStats',
  'typingtest.showPersonalBest',
  'typingtest.showHistory',
  'typingtest.resetStats',
  'typingtest.exportStats',
  'typingtest.showTutorial',
  'typingtest.showFingerGuide',
  // KeyStation commands
  'keystation.newSession',
  'keystation.startRecording',
  'keystation.stopRecording',
  'keystation.playRecording',
  'keystation.clearRecording',
  'keystation.exportAudio',
  'keystation.importMidi',
  'keystation.undo',
  'keystation.redo',
  'keystation.copyPattern',
  'keystation.pastePattern',
  'keystation.clearAll',
  'keystation.setInstrument',
  'keystation.setOscillator',
  'keystation.setReverb',
  'keystation.setDelay',
  'keystation.toggleSustain',
  'keystation.setOctave',
  'keystation.octaveUp',
  'keystation.octaveDown',
  'keystation.setVolume',
  'keystation.volumeUp',
  'keystation.volumeDown',
  'keystation.resetAudio',
  'keystation.toggleWaveform',
  'keystation.toggleKeyLabels',
  'keystation.toggleOctaveLabels',
  'keystation.toggleCompactMode',
  'keystation.showKeyboardGuide',
  'keystation.toggleMidiLearn',
  'keystation.showDocumentation',
  // Yahoo Messenger commands
  'yahooMessenger.signOut',
  'yahooMessenger.newMessage',
  'yahooMessenger.joinChannel',
  'yahooMessenger.switchChannel',
  'yahooMessenger.showDirectMessages',
  'yahooMessenger.clearChat',
  'yahooMessenger.clearAllChats',
  'yahooMessenger.setStatus',
  'yahooMessenger.setStatusMessage',
  'yahooMessenger.sendBuzz',
  'yahooMessenger.insertEmoticon',
  'yahooMessenger.toggleSounds',
  'yahooMessenger.toggleNotifications',
  'yahooMessenger.findInChat',
  'yahooMessenger.toggleSidebar',
  'yahooMessenger.toggleOnlineUsers',
  'yahooMessenger.toggleCompactMode',
  'yahooMessenger.zoomIn',
  'yahooMessenger.zoomOut',
  'yahooMessenger.resetZoom',
  'yahooMessenger.showAbout',
  'yahooMessenger.showWhatsNew',
  // WhiteNoise commands
  'whitenoise.stopAll',
  'whitenoise.toggleSound',
  'whitenoise.loadPreset',
  'whitenoise.savePreset',
  'whitenoise.managePresets',
  'whitenoise.masterVolumeUp',
  'whitenoise.masterVolumeDown',
  'whitenoise.muteAll',
  'whitenoise.fadeIn',
  'whitenoise.fadeOut',
  'whitenoise.toggleCompactMode',
  'whitenoise.toggleVolumeSliders',
  'whitenoise.showSoundInfo',
  'whitenoise.showTips',
  'whitenoise.showAudioHelp',
  // Chess commands
  'chess.newGame',
  'chess.undoMove',
  'chess.setMode',
  'chess.setDifficulty',
])

/**
 * Type guard to check if a string is a valid CommandId.
 * Uses O(1) Set lookup for performance.
 */
export function isValidCommand(cmd: string): cmd is CommandId {
  return VALID_COMMANDS.has(cmd)
}
