// Dock Menu Template for Dock per-app minimized windows
import { Menu, type MenuTemplate } from '../../../../types/menu'

export interface DockWindowEntry {
  id: number
  title?: string
}

export function createDockMenuForApp(
  appId: string,
  windows: DockWindowEntry[],
  appTitle?: string
): MenuTemplate {
  const entries = windows.length
    ? windows.map((w) =>
        Menu.item(
          `dock.${appId}.win.${w.id}`,
          (w.title && w.title.trim().length ? w.title : `Window ${w.id}`),
          {
            command: 'os.restoreWindowById',
            args: { id: w.id }
          }
        )
      )
    : [Menu.item(`dock.${appId}.empty`, 'No minimized windows', { enabled: false })]

  return Menu.template(`dock-${appId}`, appTitle ?? 'Windows', [
    Menu.section('windows', 'Windows', entries)
  ])
}