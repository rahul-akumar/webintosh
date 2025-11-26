import { ref } from 'vue'
import { useAppsStore } from '../stores/apps'
import type { AppId } from '../types/app'

/**
 * Composable for handling drag-and-drop reordering of dock items.
 */
export function useDockDragDrop() {
  const apps = useAppsStore()
  const dragSource = ref<AppId | null>(null)

  function onDragStart(payload: { id: AppId; ev: DragEvent }) {
    dragSource.value = payload.id
    const dt = payload.ev.dataTransfer
    if (dt) {
      dt.setData('text/plain', payload.id)
      dt.effectAllowed = 'move'
      dt.dropEffect = 'move'
    }
  }

  function onDragOver(payload: { id: AppId; ev: DragEvent }) {
    const dt = payload.ev.dataTransfer
    if (dt) dt.dropEffect = 'move'
  }

  function onDrop(payload: { id: AppId; ev: DragEvent }) {
    const source = dragSource.value
    const target = payload.id
    if (source) {
      apps.moveInMinOrder(source, target ?? null)
    }
    dragSource.value = null
  }

  /**
   * Handle drop on the dock list background (after last item or between gaps).
   * Appends to the end of the order.
   */
  function onDropList(ev: DragEvent) {
    const data = ev.dataTransfer?.getData('text/plain') || ''
    const source = data as AppId
    if (source && typeof source === 'string') {
      apps.moveInMinOrder(source, null)
    }
    dragSource.value = null
  }

  return {
    dragSource,
    onDragStart,
    onDragOver,
    onDrop,
    onDropList
  }
}
