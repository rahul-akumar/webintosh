// Menu Command Registry (Phase 0)
import type { CommandId } from '../../types/menu'
import { useOSStore } from '../../stores/os'
import { useAppsStore } from '../../stores/apps'

type CommandHandler = (args?: unknown) => void

const registry: Partial<Record<CommandId, CommandHandler>> = {}

/**
 * Execute a command by id with optional args.
 * No-ops on unknown commands; logs a warning in dev.
 */
export function execute(command: CommandId, args?: unknown): void {
  const handler = registry[command]
  if (typeof handler === 'function') {
    try {
      handler(args)
    } catch (err) {
      if (import.meta.dev) {
        // eslint-disable-next-line no-console
        console.warn(`[menuCommands] Error executing "${command}":`, err)
      }
    }
  } else {
    if (import.meta.dev) {
      // eslint-disable-next-line no-console
      console.warn(`[menuCommands] Unknown command "${command}"`)
    }
  }
}

/**
 * Register a single command handler (allows override/extension).
 */
export function register(command: CommandId, handler: CommandHandler): void {
  registry[command] = handler
}

/**
 * Register the default set of OS/App commands exactly once.
 * Safe to call multiple times; subsequent calls are ignored.
 */
export function registerDefaultCommands(): void {
  // Idempotent by design: re-registering overwrites the same keys in the registry (useful during HMR)

  // OS-level commands
  register('os.openWindow', () => {
    const os = useOSStore()
    os.openWindow()
  })

  register('os.openTestWindow', () => {
    const os = useOSStore()
    os.openWindow({ title: 'Test Window' })
  })

  register('os.closeFocused', () => {
    const os = useOSStore()
    const f = os.focused
    if (f) os.closeWindow(f.id)
  })

  register('os.minimizeFocused', () => {
    const os = useOSStore()
    const f = os.focused
    if (f) os.toggleMinimize(f.id)
  })

  register('os.maximizeFocused', () => {
    const os = useOSStore()
    const f = os.focused
    if (f) os.toggleMaximize(f.id)
  })

  // View commands (placeholder)
  register('view.toggleZoom', () => {
    // For now, treat "zoom" as maximize toggle on the focused window
    const os = useOSStore()
    const f = os.focused
    if (f) os.toggleMaximize(f.id)
  })

  // App-level commands
  // New Window: ALWAYS open a new window for the target app (do not reuse/focus existing)
  register('app.newWindow', (args?: unknown) => {
    const apps = useAppsStore()
    const os = useOSStore()

    const providedAppId = getArg<string>(args, 'appId')
    const focusedAppId = os.focused?.appId ?? null
    const appId = providedAppId ?? focusedAppId

    if (appId) {
      const d = apps.registry[appId]
      const title = d?.title ?? 'App'
      const rect = d?.defaultRect ?? {
        x: 80,
        y: os.menuBarHeight + 24,
        width: 520,
        height: 360
      }
      os.openWindow({
        appId,
        title,
        kind: d?.kind ?? 'app',
        rect
      })
    } else {
      // No app context available; open a generic window
      os.openWindow({ title: 'New Window' })
    }
  })

  // New Document: for TextEdit (or target apps) ALWAYS create a new window/document instance
  register('app.newDocument', (args?: unknown) => {
    const apps = useAppsStore()
    const os = useOSStore()

    const providedAppId = getArg<string>(args, 'appId')
    // Prefer provided app id; if none, default to textedit when available
    const appId = providedAppId ?? (apps.registry['textedit'] ? 'textedit' : undefined)

    if (appId) {
      const d = apps.registry[appId]
      const title = d?.title ?? 'Document'
      const rect = d?.defaultRect ?? {
        x: 96,
        y: os.menuBarHeight + 28,
        width: 640,
        height: 420
      }
      os.openWindow({
        appId,
        title,
        kind: d?.kind ?? 'app',
        rect
      })
    } else {
      os.openWindow({ title: 'New Document' })
    }
  })

  // System utilities
  register('system.showShortcuts', () => {
    const apps = useAppsStore()
    const os = useOSStore()

    if (apps.registry['shortcuts']) {
      apps.launchOrFocus('shortcuts')
      return
    }
    // Fallback: show a simple window until the Shortcuts app is implemented (Phase 5)
    os.openWindow({ title: 'Shortcuts' })
  })
}

/**
 * Helper to safely extract a property from a generic args object.
 */
function getArg<T>(args: unknown, key: string): T | undefined {
  if (args && typeof args === 'object' && key in (args as Record<string, unknown>)) {
    return (args as Record<string, unknown>)[key] as T
  }
  return undefined
}