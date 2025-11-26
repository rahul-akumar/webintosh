import { useAppsStore } from '../stores/apps'
import { LAYOUT } from '../constants/os'
import type { AppId } from '../types/app'

export function useIconLayout() {
  const apps = useAppsStore()

  function getX(appId: AppId, index: number): number {
    const pos = apps.iconPositions[appId]
    if (pos) return pos.x
    
    // Calculate column based on vertical-first layout
    const iconHeight = LAYOUT.ICON_GRID_HEIGHT
    const iconWidth = LAYOUT.ICON_GRID_WIDTH
    const topPadding = LAYOUT.DESKTOP_TOP_PADDING
    const menuBarHeight = LAYOUT.MENU_BAR_HEIGHT
    
    // Calculate max icons per column based on viewport height
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768
    const availableHeight = viewportHeight - menuBarHeight - topPadding
    const iconsPerColumn = Math.floor(availableHeight / iconHeight)
    
    // Determine which column this icon belongs to
    const col = Math.floor(index / iconsPerColumn)
    
    if (apps.iconLayoutDirection === 'right') {
      // Start from right edge
      const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1280
      return viewportWidth - iconWidth - (col * iconWidth) - topPadding
    } else {
      // Start from left edge (default)
      return topPadding + (col * iconWidth)
    }
  }

  function getY(appId: AppId, index: number): number {
    const pos = apps.iconPositions[appId]
    if (pos) return pos.y
    
    // Calculate row within column for vertical-first layout
    const iconHeight = LAYOUT.ICON_GRID_HEIGHT
    const topPadding = LAYOUT.DESKTOP_TOP_PADDING
    const menuBarHeight = LAYOUT.MENU_BAR_HEIGHT
    
    // Calculate max icons per column based on viewport height
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768
    const availableHeight = viewportHeight - menuBarHeight - topPadding
    const iconsPerColumn = Math.floor(availableHeight / iconHeight)
    
    // Determine which row within the column this icon belongs to
    const row = index % iconsPerColumn
    
    return topPadding + (row * iconHeight)
  }

  return {
    getX,
    getY
  }
}
