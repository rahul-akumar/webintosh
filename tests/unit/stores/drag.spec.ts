import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDragStore } from '../../../app/stores/drag'

const constraints = {
  minW: 100,
  minH: 100,
  minX: 0,
  minY: 40,
  maxX: 1000,
  maxY: 800,
  vw: 1000,
  vh: 800,
  pad: 8,
}

describe('stores/drag', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts idle', () => {
    const drag = useDragStore()
    expect(drag.isActive).toBe(false)
    expect(drag.isDragging).toBe(false)
    expect(drag.isResizing).toBe(false)
    expect(drag.activeWindowId).toBeNull()
  })

  it('startDrag enters dragging mode and tracks the window id', () => {
    const drag = useDragStore()
    drag.startDrag(1, 10, 20, 100, 200)

    expect(drag.isActive).toBe(true)
    expect(drag.isDragging).toBe(true)
    expect(drag.isResizing).toBe(false)
    expect(drag.activeWindowId).toBe(1)
  })

  it('calculateDragPosition returns delta-adjusted origin, null when not dragging', () => {
    const drag = useDragStore()
    expect(drag.calculateDragPosition(50, 60)).toBeNull()

    drag.startDrag(1, 10, 20, 100, 200)
    expect(drag.calculateDragPosition(30, 25)).toEqual({ x: 120, y: 205 })
  })

  it('startResize enters resizing mode with the given edge and origin rect', () => {
    const drag = useDragStore()
    const rect = { x: 0, y: 40, width: 300, height: 200 }
    drag.startResize(2, 'se', 5, 5, rect)

    expect(drag.isResizing).toBe(true)
    expect(drag.resizeEdge).toBe('se')
    expect(drag.activeWindowId).toBe(2)
  })

  it('calculateResizeGeometry returns null when not resizing', () => {
    const drag = useDragStore()
    expect(drag.calculateResizeGeometry(0, 0, constraints)).toBeNull()
  })

  it('calculateResizeGeometry grows/shrinks from the correct anchor per edge', () => {
    const drag = useDragStore()
    const rect = { x: 100, y: 100, width: 300, height: 200 }

    drag.startResize(1, 'se', 0, 0, rect)
    let geom = drag.calculateResizeGeometry(20, 30, constraints)
    expect(geom).toEqual({ x: 100, y: 100, width: 320, height: 230 })

    drag.startResize(1, 'nw', 0, 0, rect)
    geom = drag.calculateResizeGeometry(20, 30, constraints)
    // nw drag moves x/y and shrinks width/height, anchored at the opposite (se) edge
    expect(geom).toEqual({ x: 120, y: 130, width: 280, height: 170 })
  })

  it('calculateResizeGeometry clamps below the minimum size', () => {
    const drag = useDragStore()
    const rect = { x: 100, y: 100, width: 300, height: 200 }
    drag.startResize(1, 'se', 0, 0, rect)

    const geom = drag.calculateResizeGeometry(-1000, -1000, constraints)
    expect(geom!.width).toBe(constraints.minW)
    expect(geom!.height).toBe(constraints.minH)
  })

  it('endInteraction resets to idle', () => {
    const drag = useDragStore()
    drag.startDrag(1, 0, 0, 0, 0)
    drag.endInteraction()

    expect(drag.isActive).toBe(false)
    expect(drag.activeWindowId).toBeNull()
  })

  it('isInteractingWith matches only the active window id', () => {
    const drag = useDragStore()
    expect(drag.isInteractingWith(1)).toBe(false)

    drag.startDrag(1, 0, 0, 0, 0)
    expect(drag.isInteractingWith(1)).toBe(true)
    expect(drag.isInteractingWith(2)).toBe(false)
  })
})
