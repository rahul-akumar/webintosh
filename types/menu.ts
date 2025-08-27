// Unified Menu Domain Model (Phase 0)

export type MenuRole = "item" | "submenu" | "separator";

/**
 * Command identifiers executable via the menu command registry.
 * Note: Add new commands here and implement them in app/composables/menuCommands.ts
 */
export type CommandId =
  | "os.openWindow"
  | "os.openTestWindow"
  | "os.closeFocused"
  | "os.minimizeFocused"
  | "os.maximizeFocused"
  | "os.restoreWindowById"
  | "os.cycleWindows"
  | "view.toggleZoom"
  | "view.toggleFullScreen"
  | "app.launch"
  | "app.newWindow"
  | "app.newDocument"
  | "textedit.save"
  | "system.showShortcuts"
  | "system.showAbout"
  | "desktop.changeWallpaper"
  | "desktop.cleanUpIcons"
  | "desktop.sortIcons"
  | "desktop.setIconDirection"
  | "desktop.setIconSize"
  // TypingTest commands
  | "typingtest.newTest"
  | "typingtest.restartTest"
  | "typingtest.changeText"
  | "typingtest.setDifficulty"
  | "typingtest.toggleSound"
  | "typingtest.toggleKeyboard"
  | "typingtest.setTheme"
  | "typingtest.toggleTimer"
  | "typingtest.toggleLiveWPM"
  | "typingtest.toggleLiveAccuracy"
  | "typingtest.showSessionStats"
  | "typingtest.toggleFullscreen"
  | "typingtest.showTips"
  | "typingtest.togglePracticeMode"
  | "typingtest.toggleFocusMode"
  | "typingtest.toggleNightMode"
  | "typingtest.showAllTimeStats"
  | "typingtest.showPersonalBest"
  | "typingtest.showHistory"
  | "typingtest.resetStats"
  | "typingtest.exportStats"
  | "typingtest.showTutorial"
  | "typingtest.showFingerGuide"
  // KeyStation commands
  | "keystation.newSession"
  | "keystation.startRecording"
  | "keystation.stopRecording"
  | "keystation.playRecording"
  | "keystation.clearRecording"
  | "keystation.exportAudio"
  | "keystation.importMidi"
  | "keystation.undo"
  | "keystation.redo"
  | "keystation.copyPattern"
  | "keystation.pastePattern"
  | "keystation.clearAll"
  | "keystation.setInstrument"
  | "keystation.setOscillator"
  | "keystation.setReverb"
  | "keystation.setDelay"
  | "keystation.toggleSustain"
  | "keystation.setOctave"
  | "keystation.octaveUp"
  | "keystation.octaveDown"
  | "keystation.setVolume"
  | "keystation.volumeUp"
  | "keystation.volumeDown"
  | "keystation.resetAudio"
  | "keystation.toggleWaveform"
  | "keystation.toggleKeyLabels"
  | "keystation.toggleOctaveLabels"
  | "keystation.toggleCompactMode"
  | "keystation.showKeyboardGuide"
  | "keystation.toggleMidiLearn"
  | "keystation.showDocumentation"
  // Yahoo Messenger commands
  | "yahooMessenger.signOut"
  | "yahooMessenger.newMessage"
  | "yahooMessenger.joinChannel"
  | "yahooMessenger.switchChannel"
  | "yahooMessenger.showDirectMessages"
  | "yahooMessenger.clearChat"
  | "yahooMessenger.clearAllChats"
  | "yahooMessenger.setStatus"
  | "yahooMessenger.setStatusMessage"
  | "yahooMessenger.sendBuzz"
  | "yahooMessenger.insertEmoticon"
  | "yahooMessenger.toggleSounds"
  | "yahooMessenger.toggleNotifications"
  | "yahooMessenger.findInChat"
  | "yahooMessenger.toggleSidebar"
  | "yahooMessenger.toggleOnlineUsers"
  | "yahooMessenger.toggleCompactMode"
  | "yahooMessenger.zoomIn"
  | "yahooMessenger.zoomOut"
  | "yahooMessenger.resetZoom"
  | "yahooMessenger.showAbout"
  | "yahooMessenger.showWhatsNew"
  // WhiteNoise commands
  | "whitenoise.stopAll"
  | "whitenoise.toggleSound"
  | "whitenoise.loadPreset"
  | "whitenoise.savePreset"
  | "whitenoise.managePresets"
  | "whitenoise.masterVolumeUp"
  | "whitenoise.masterVolumeDown"
  | "whitenoise.muteAll"
  | "whitenoise.fadeIn"
  | "whitenoise.fadeOut"
  | "whitenoise.toggleCompactMode"
  | "whitenoise.toggleVolumeSliders"
  | "whitenoise.showSoundInfo"
  | "whitenoise.showTips"
  | "whitenoise.showAudioHelp";

/**
 * Keyboard accelerator description.
 * - key: canonical key name (case-insensitive for letter keys), e.g., 'N', 'W', '/', '`', 'F1'
 * - modifier flags indicate which modifiers must be held
 */
export interface Accelerator {
  key: string;
  alt?: boolean;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
}

/**
 * Base properties for all menu entries.
 * Each entry must have a stable id for e2e tests and analytics.
 */
interface BaseEntry {
  id: string;
  visible?: boolean; // default: true
}

/**
 * Clickable item that may trigger a command.
 */
export interface MenuItem extends BaseEntry {
  role: "item";
  label: string;
  command?: CommandId;
  args?: Record<string, unknown>;
  accel?: Accelerator;
  enabled?: boolean; // default: true
  checked?: boolean; // optional (for checkbox-like items)
}

/**
 * Horizontal divider within a menu section or submenu.
 */
export interface MenuSeparator extends BaseEntry {
  role: "separator";
}

/**
 * Nested menu with children entries.
 */
export interface MenuSubmenu extends BaseEntry {
  role: "submenu";
  label: string;
  children: MenuEntry[];
}

/**
 * Any supported entry type.
 */
export type MenuEntry = MenuItem | MenuSeparator | MenuSubmenu;

/**
 * A top-level section rendered in the menubar, with its own dropdown content.
 */
export interface MenuSection {
  id: string;
  label: string;
  entries: MenuEntry[];
}

/**
 * Menu template chosen by focus context (system vs app).
 * - title is shown as the left-most label in the menubar (e.g., 'Webintosh', 'Finder').
 */
export interface MenuTemplate {
  id: string;
  title: string;
  sections: MenuSection[];
}

/**
 * Utility helpers for runtime usage (optional).
 */

/**
 * Returns a human-readable string for an accelerator.
 * Platform-aware: Shows Ctrl on Mac, Alt on Windows/Linux
 */
export function formatAccelerator(a?: Accelerator): string {
  if (!a) return "";

  // Detect platform
  const isMac =
    typeof navigator !== "undefined" &&
    (navigator.platform.toLowerCase().includes("mac") ||
      navigator.userAgent.toLowerCase().includes("mac"));

  const parts: string[] = [];

  // For our shortcuts, we use platform-specific modifiers
  // Mac: Ctrl (⌃) to avoid Cmd conflicts
  // Windows/Linux: Alt to avoid Ctrl conflicts
  if (a.alt) {
    if (isMac) {
      parts.push("⌃"); // Use Ctrl symbol on Mac when Alt is specified
    } else {
      parts.push("Alt");
    }
  }

  // Handle other modifiers if explicitly set
  if (a.ctrl && !a.alt) parts.push(isMac ? "⌃" : "Ctrl");
  if (a.meta) parts.push(isMac ? "⌘" : "Meta");
  if (a.shift) parts.push(isMac ? "⇧" : "Shift");

  // Format the key
  const key = a.key === "`" ? "`" : a.key.toUpperCase();
  parts.push(key);

  return isMac && parts.length > 1 ? parts.join("") : parts.join("+");
}

/**
 * Convenience constructors to reduce verbosity when defining templates.
 */
export const Menu = {
  item(
    id: string,
    label: string,
    opts?: Partial<Omit<MenuItem, "role" | "id" | "label">>
  ): MenuItem {
    return {
      role: "item",
      id,
      label,
      enabled: true,
      visible: true,
      ...opts,
    };
  },
  sep(id: string): MenuSeparator {
    return { role: "separator", id, visible: true };
  },
  submenu(id: string, label: string, children: MenuEntry[]): MenuSubmenu {
    return { role: "submenu", id, label, children, visible: true };
  },
  section(id: string, label: string, entries: MenuEntry[]): MenuSection {
    return { id, label, entries };
  },
  template(id: string, title: string, sections: MenuSection[]): MenuTemplate {
    return { id, title, sections };
  },
};
