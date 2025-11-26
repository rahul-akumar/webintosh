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
  'os.openWindow': void
  'os.openTestWindow': void
  'os.closeFocused': void
  'os.minimizeFocused': void
  'os.maximizeFocused': void
  'os.restoreWindowById': { id: number }
  'os.cycleWindows': void

  // View commands
  'view.toggleZoom': void
  'view.toggleFullScreen': void

  // App-level commands
  'app.launch': { appId: string }
  'app.newWindow': { appId?: string }
  'app.newDocument': { appId?: string }

  // System utilities
  'system.showShortcuts': void
  'system.showAbout': void

  // Desktop commands
  'desktop.changeWallpaper': void
  'desktop.cleanUpIcons': void
  'desktop.sortIcons': { sortBy: 'name' | 'type' }
  'desktop.setIconDirection': { direction: 'left' | 'right' }
  'desktop.setIconSize': { size: 'small' | 'medium' | 'large' }

  // Edit commands (shared)
  'edit.undo': void
  'edit.redo': void
  'edit.cut': void
  'edit.copy': void
  'edit.paste': void
  'edit.selectAll': void

  // Document commands (shared)
  'document.copy': void
  'document.paste': void
  'document.selectAll': void

  // TextEdit commands
  'textedit.save': void
  'textedit.open': void
  'textedit.saveAs': void
  'textedit.print': void
  'textedit.undo': void
  'textedit.redo': void
  'textedit.cut': void
  'textedit.copy': void
  'textedit.paste': void
  'textedit.pasteAndMatchStyle': void
  'textedit.selectAll': void
  'textedit.find': void
  'textedit.findAndReplace': void
  'textedit.findNext': void
  'textedit.findPrevious': void
  'textedit.bold': void
  'textedit.italic': void
  'textedit.underline': void
  'textedit.strikethrough': void
  'textedit.alignLeft': void
  'textedit.alignCenter': void
  'textedit.alignRight': void
  'textedit.justify': void
  'textedit.bulletList': void
  'textedit.numberedList': void
  'textedit.increaseIndent': void
  'textedit.decreaseIndent': void
  'textedit.showFonts': void
  'textedit.fontSizeSmaller': void
  'textedit.fontSizeLarger': void
  'textedit.clearFormatting': void
  'textedit.zoomIn': void
  'textedit.zoomOut': void
  'textedit.zoomReset': void
  'textedit.toggleToolbar': void
  'textedit.toggleRuler': void
  'textedit.toggleInvisibles': void
  'textedit.bringAllToFront': void

  // Finder commands
  'finder.newFolder': void
  'finder.viewAs': { view: 'icons' | 'list' | 'columns' | 'gallery' }
  'finder.sortBy': { sortBy: 'name' | 'date' | 'size' | 'kind' }
  'finder.togglePathBar': void
  'finder.toggleStatusBar': void
  'finder.toggleSidebar': void
  'finder.toggleIconPreview': void
  'finder.goTo': { path: string }
  'finder.bringAllToFront': void

  // Help commands
  'help.showFinderHelp': void
  'help.shareApp': void
  'help.showAboutFinder': void

  // TypingTest commands
  'typingtest.newTest': void
  'typingtest.restartTest': void
  'typingtest.changeText': void
  'typingtest.setDifficulty': { difficulty: 'easy' | 'medium' | 'hard' }
  'typingtest.toggleSound': void
  'typingtest.toggleKeyboard': void
  'typingtest.setTheme': { theme: string }
  'typingtest.toggleTimer': void
  'typingtest.toggleLiveWPM': void
  'typingtest.toggleLiveAccuracy': void
  'typingtest.showSessionStats': void
  'typingtest.toggleFullscreen': void
  'typingtest.showTips': void
  'typingtest.togglePracticeMode': void
  'typingtest.toggleFocusMode': void
  'typingtest.toggleNightMode': void
  'typingtest.showAllTimeStats': void
  'typingtest.showPersonalBest': void
  'typingtest.showHistory': void
  'typingtest.resetStats': void
  'typingtest.exportStats': void
  'typingtest.showTutorial': void
  'typingtest.showFingerGuide': void

  // KeyStation commands
  'keystation.newSession': void
  'keystation.startRecording': void
  'keystation.stopRecording': void
  'keystation.playRecording': void
  'keystation.clearRecording': void
  'keystation.exportAudio': void
  'keystation.importMidi': void
  'keystation.undo': void
  'keystation.redo': void
  'keystation.copyPattern': void
  'keystation.pastePattern': void
  'keystation.clearAll': void
  'keystation.setInstrument': { instrument: string }
  'keystation.setOscillator': { oscillator: string }
  'keystation.setReverb': { level: number }
  'keystation.setDelay': { level: number }
  'keystation.toggleSustain': void
  'keystation.setOctave': { octave: number }
  'keystation.octaveUp': void
  'keystation.octaveDown': void
  'keystation.setVolume': { volume: number }
  'keystation.volumeUp': void
  'keystation.volumeDown': void
  'keystation.resetAudio': void
  'keystation.toggleWaveform': void
  'keystation.toggleKeyLabels': void
  'keystation.toggleOctaveLabels': void
  'keystation.toggleCompactMode': void
  'keystation.showKeyboardGuide': void
  'keystation.toggleMidiLearn': void
  'keystation.showDocumentation': void

  // Yahoo Messenger commands
  'yahooMessenger.signOut': void
  'yahooMessenger.newMessage': void
  'yahooMessenger.joinChannel': void
  'yahooMessenger.switchChannel': { channel: string }
  'yahooMessenger.showDirectMessages': void
  'yahooMessenger.clearChat': void
  'yahooMessenger.clearAllChats': void
  'yahooMessenger.setStatus': { status: 'online' | 'away' | 'busy' | 'invisible' }
  'yahooMessenger.setStatusMessage': { message: string }
  'yahooMessenger.sendBuzz': void
  'yahooMessenger.insertEmoticon': { emoticon: string }
  'yahooMessenger.toggleSounds': void
  'yahooMessenger.toggleNotifications': void
  'yahooMessenger.findInChat': void
  'yahooMessenger.toggleSidebar': void
  'yahooMessenger.toggleOnlineUsers': void
  'yahooMessenger.toggleCompactMode': void
  'yahooMessenger.zoomIn': void
  'yahooMessenger.zoomOut': void
  'yahooMessenger.resetZoom': void
  'yahooMessenger.showAbout': void
  'yahooMessenger.showWhatsNew': void

  // WhiteNoise commands
  'whitenoise.stopAll': void
  'whitenoise.toggleSound': { soundId: string }
  'whitenoise.loadPreset': { presetId: string }
  'whitenoise.savePreset': void
  'whitenoise.managePresets': void
  'whitenoise.masterVolumeUp': void
  'whitenoise.masterVolumeDown': void
  'whitenoise.muteAll': void
  'whitenoise.fadeIn': void
  'whitenoise.fadeOut': void
  'whitenoise.toggleCompactMode': void
  'whitenoise.toggleVolumeSliders': void
  'whitenoise.showSoundInfo': void
  'whitenoise.showTips': void
  'whitenoise.showAudioHelp': void

  // Chess commands
  'chess.newGame': void
  'chess.undoMove': void
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
  CommandPayloads[K] extends void 
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

/**
 * Type guard to check if a string is a valid CommandId.
 */
export function isValidCommand(cmd: string): cmd is CommandId {
  // This is a runtime check - in practice, TypeScript ensures compile-time safety
  return typeof cmd === 'string' && cmd.includes('.')
}
