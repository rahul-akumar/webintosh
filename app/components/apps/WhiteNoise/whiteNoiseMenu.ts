// WhiteNoise (Noise Mixer) App Menu Template
import { Menu, type MenuTemplate } from "../../../../types/menu";

export function createWhiteNoiseMenuTemplate(): MenuTemplate {
  return Menu.template("whitenoise", "Noise Mixer", [
    // App menu
    Menu.section("whitenoise", "Noise Mixer", [
      Menu.item("whitenoise.about", "About Noise Mixer", {
        command: "system.showAbout",
      }),
      Menu.item("whitenoise.preferences", "Preferences…", {
        enabled: false,
      }),
      Menu.sep("whitenoise.sep1"),
      Menu.item("whitenoise.quit", "Quit Noise Mixer", {
        command: "os.closeFocused",
        accel: { key: "Q", alt: true },
      }),
    ]),

    // Sounds menu
    Menu.section("sounds", "Sounds", [
      Menu.item("sounds.stopAll", "Stop All Sounds", {
        command: "whitenoise.stopAll",
        accel: { key: "S", alt: true },
      }),
      Menu.sep("sounds.sep1"),
      Menu.submenu("sounds.nature", "Nature Sounds", [
        Menu.item("sounds.nature.rain", "Rain", {
          command: "whitenoise.toggleSound",
          args: { soundId: "rain" },
          checked: false,
        }),
        Menu.item("sounds.nature.waves", "Ocean Waves", {
          command: "whitenoise.toggleSound",
          args: { soundId: "waves" },
          checked: false,
        }),
        Menu.item("sounds.nature.forest", "Forest", {
          command: "whitenoise.toggleSound",
          args: { soundId: "forest" },
          checked: false,
        }),
        Menu.item("sounds.nature.birds", "Birds", {
          command: "whitenoise.toggleSound",
          args: { soundId: "birds" },
          checked: false,
        }),
        Menu.item("sounds.nature.wind", "Wind", {
          command: "whitenoise.toggleSound",
          args: { soundId: "wind" },
          checked: false,
        }),
        Menu.item("sounds.nature.river", "River Stream", {
          command: "whitenoise.toggleSound",
          args: { soundId: "river" },
          checked: false,
        }),
        Menu.item("sounds.nature.thunder", "Thunderstorm", {
          command: "whitenoise.toggleSound",
          args: { soundId: "thunder" },
          checked: false,
        }),
      ]),
      Menu.submenu("sounds.ambient", "Ambient Sounds", [
        Menu.item("sounds.ambient.campfire", "Campfire", {
          command: "whitenoise.toggleSound",
          args: { soundId: "campfire" },
          checked: false,
        }),
        Menu.item("sounds.ambient.cafe", "Cafe Ambience", {
          command: "whitenoise.toggleSound",
          args: { soundId: "cafe" },
          checked: false,
        }),
        Menu.item("sounds.ambient.library", "Library", {
          command: "whitenoise.toggleSound",
          args: { soundId: "library" },
          checked: false,
        }),
        Menu.item("sounds.ambient.city", "City Traffic", {
          command: "whitenoise.toggleSound",
          args: { soundId: "city" },
          checked: false,
        }),
      ]),
      Menu.submenu("sounds.transport", "Transport Sounds", [
        Menu.item("sounds.transport.airplane", "Airplane Cabin", {
          command: "whitenoise.toggleSound",
          args: { soundId: "airplane" },
          checked: false,
        }),
        Menu.item("sounds.transport.train", "Train Journey", {
          command: "whitenoise.toggleSound",
          args: { soundId: "train" },
          checked: false,
        }),
      ]),
      Menu.submenu("sounds.other", "Other Sounds", [
        Menu.item("sounds.other.whale", "Whale", {
          command: "whitenoise.toggleSound",
          args: { soundId: "whale" },
          checked: false,
        }),
        Menu.item("sounds.other.heartbeat", "Heartbeat", {
          command: "whitenoise.toggleSound",
          args: { soundId: "heartbeat" },
          checked: false,
        }),
      ]),
    ]),

    // Presets menu
    Menu.section("presets", "Presets", [
      Menu.item("presets.focus", "Focus", {
        command: "whitenoise.loadPreset",
        args: { preset: "focus" },
        accel: { key: "1", alt: true },
      }),
      Menu.item("presets.sleep", "Sleep", {
        command: "whitenoise.loadPreset",
        args: { preset: "sleep" },
        accel: { key: "2", alt: true },
      }),
      Menu.item("presets.nature", "Nature", {
        command: "whitenoise.loadPreset",
        args: { preset: "nature" },
        accel: { key: "3", alt: true },
      }),
      Menu.item("presets.city", "City Life", {
        command: "whitenoise.loadPreset",
        args: { preset: "city" },
        accel: { key: "4", alt: true },
      }),
      Menu.item("presets.storm", "Stormy Night", {
        command: "whitenoise.loadPreset",
        args: { preset: "storm" },
        accel: { key: "5", alt: true },
      }),
      Menu.sep("presets.sep1"),
      Menu.item("presets.save", "Save Current as Preset…", {
        command: "whitenoise.savePreset",
        enabled: false,
      }),
      Menu.item("presets.manage", "Manage Presets…", {
        command: "whitenoise.managePresets",
        enabled: false,
      }),
    ]),

    // Volume menu
    Menu.section("volume", "Volume", [
      Menu.item("volume.masterUp", "Master Volume Up", {
        command: "whitenoise.masterVolumeUp",
        accel: { key: "ArrowUp", alt: true },
      }),
      Menu.item("volume.masterDown", "Master Volume Down", {
        command: "whitenoise.masterVolumeDown",
        accel: { key: "ArrowDown", alt: true },
      }),
      Menu.item("volume.mute", "Mute All", {
        command: "whitenoise.muteAll",
        accel: { key: "M", alt: true },
        checked: false,
      }),
      Menu.sep("volume.sep1"),
      Menu.item("volume.fadeIn", "Fade In", {
        command: "whitenoise.fadeIn",
        enabled: false,
      }),
      Menu.item("volume.fadeOut", "Fade Out", {
        command: "whitenoise.fadeOut",
        enabled: false,
      }),
    ]),

    // View menu
    Menu.section("view", "View", [
      Menu.item("view.zoom", "Zoom", {
        command: "view.toggleZoom",
        accel: { key: "Z", alt: true },
      }),
      Menu.item("view.fullscreen", "Enter Full Screen", {
        command: "view.toggleFullScreen",
        accel: { key: "F", alt: true, shift: true },
      }),
      Menu.sep("view.sep1"),
      Menu.item("view.compactMode", "Compact Mode", {
        command: "whitenoise.toggleCompactMode",
        checked: false,
        enabled: false,
      }),
      Menu.item("view.showVolumeSliders", "Show Volume Sliders", {
        command: "whitenoise.toggleVolumeSliders",
        checked: true,
        enabled: false,
      }),
    ]),

    // Window menu
    Menu.section("window", "Window", [
      Menu.item("window.minimize", "Minimize", {
        command: "os.minimizeFocused",
        accel: { key: "M", alt: true },
      }),
      Menu.item("window.close", "Close Window", {
        command: "os.closeFocused",
        accel: { key: "W", alt: true },
      }),
      Menu.item("window.cycle", "Cycle Windows", {
        command: "os.cycleWindows",
        accel: { key: "`", alt: true },
      }),
      Menu.sep("window.sep1"),
      Menu.item("window.bringAllToFront", "Bring All to Front", {
        enabled: false,
      }),
    ]),

    // Help menu
    Menu.section("help", "Help", [
      Menu.item("help.soundLibrary", "Sound Library Info", {
        command: "whitenoise.showSoundInfo",
        enabled: false,
      }),
      Menu.item("help.keyboardShortcuts", "Keyboard Shortcuts", {
        command: "system.showShortcuts",
        accel: { key: "/", alt: true },
      }),
      Menu.sep("help.sep1"),
      Menu.item("help.tips", "Usage Tips", {
        command: "whitenoise.showTips",
        enabled: false,
      }),
      Menu.item("help.audioSettings", "Audio Settings Help", {
        command: "whitenoise.showAudioHelp",
        enabled: false,
      }),
    ]),
  ]);
}
