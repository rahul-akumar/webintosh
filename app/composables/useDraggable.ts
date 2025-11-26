import { ref, onUnmounted, type Ref } from 'vue'

export interface DraggableOptions {
  /** Callback when drag starts */
  onDragStart?: (e: MouseEvent) => void
  /** Callback during drag with delta and current position */
  onDrag?: (data: { deltaX: number; deltaY: number; currentX: number; currentY: number }) => void
  /** Callback when drag ends with final position */
  onDragEnd?: (data: { x: number; y: number }) => void
  /** Initial X position */
  initialX?: number
  /** Initial Y position */
  initialY?: number
  /** Bounds constraints */
  bounds?: {
    minX?: number
    maxX?: number
    minY?: number
    maxY?: number
  }
  /** Only allow dragging with left mouse button */
  leftButtonOnly?: boolean
}

export interface DraggableReturn {
  /** Whether currently dragging */
  isDragging: Ref<boolean>
  /** Current X position */
  currentX: Ref<number>
  /** Current Y position */
  currentY: Ref<number>
  /** Start drag handler - attach to mousedown */
  startDrag: (e: MouseEvent) => void
  /** Update position programmatically */
  setPosition: (x: number, y: number) => void
}

/**
 * Composable for handling drag operations on elements.
 * Provides position tracking, bounds checking, and drag state management.
 */
export function useDraggable(options: DraggableOptions = {}): DraggableReturn {
  const {
    onDragStart,
    onDrag,
    onDragEnd,
    initialX = 0,
    initialY = 0,
    bounds,
    leftButtonOnly = true,
  } = options

  const isDragging = ref(false)
  const currentX = ref(initialX)
  const currentY = ref(initialY)

  let startMouseX = 0
  let startMouseY = 0
  let startPosX = 0
  let startPosY = 0

  function clampToBounds(x: number, y: number): { x: number; y: number } {
    let clampedX = x
    let clampedY = y

    if (bounds) {
      if (bounds.minX !== undefined) clampedX = Math.max(bounds.minX, clampedX)
      if (bounds.maxX !== undefined) clampedX = Math.min(bounds.maxX, clampedX)
      if (bounds.minY !== undefined) clampedY = Math.max(bounds.minY, clampedY)
      if (bounds.maxY !== undefined) clampedY = Math.min(bounds.maxY, clampedY)
    }

    return { x: clampedX, y: clampedY }
  }

  function handleMouseMove(e: MouseEvent) {
    const deltaX = e.clientX - startMouseX
    const deltaY = e.clientY - startMouseY

    const newX = startPosX + deltaX
    const newY = startPosY + deltaY

    const clamped = clampToBounds(newX, newY)
    currentX.value = clamped.x
    currentY.value = clamped.y

    onDrag?.({
      deltaX,
      deltaY,
      currentX: clamped.x,
      currentY: clamped.y,
    })
  }

  function handleMouseUp() {
    isDragging.value = false
    onDragEnd?.({ x: currentX.value, y: currentY.value })

    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  function startDrag(e: MouseEvent) {
    // Only left click if specified
    if (leftButtonOnly && e.button !== 0) return

    e.preventDefault()

    startMouseX = e.clientX
    startMouseY = e.clientY
    startPosX = currentX.value
    startPosY = currentY.value

    isDragging.value = true
    onDragStart?.(e)

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  function setPosition(x: number, y: number) {
    if (!isDragging.value) {
      const clamped = clampToBounds(x, y)
      currentX.value = clamped.x
      currentY.value = clamped.y
    }
  }

  // Cleanup on unmount
  onUnmounted(() => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  })

  return {
    isDragging,
    currentX,
    currentY,
    startDrag,
    setPosition,
  }
}

/**
 * Helper to calculate viewport bounds for draggable elements
 */
export function getViewportBounds(elementWidth: number, elementHeight: number, padding = 0) {
  return {
    minX: padding,
    maxX: (typeof window !== 'undefined' ? window.innerWidth : 1280) - elementWidth - padding,
    minY: padding,
    maxY: (typeof window !== 'undefined' ? window.innerHeight : 768) - elementHeight - padding,
  }
}
