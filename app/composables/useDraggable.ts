import { ref, onUnmounted, type Ref } from 'vue'

/**
 * Unified pointer event type for mouse and touch events.
 */
export interface PointerPosition {
  clientX: number
  clientY: number
}

export interface DraggableOptions {
  /** Callback when drag starts */
  onDragStart?: (e: MouseEvent | TouchEvent) => void
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
  /** Only allow dragging with left mouse button (ignored for touch) */
  leftButtonOnly?: boolean
  /** Enable touch support (default: true) */
  enableTouch?: boolean
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
  /** Start drag handler for touch - attach to touchstart */
  startTouchDrag: (e: TouchEvent) => void
  /** Update position programmatically */
  setPosition: (x: number, y: number) => void
}

/**
 * Composable for handling drag operations on elements.
 * Provides position tracking, bounds checking, and drag state management.
 * Supports both mouse and touch events.
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
    enableTouch = true,
  } = options

  const isDragging = ref(false)
  const currentX = ref(initialX)
  const currentY = ref(initialY)

  let startPointerX = 0
  let startPointerY = 0
  let startPosX = 0
  let startPosY = 0
  let isTouchDrag = false

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

  /**
   * Extract clientX/clientY from mouse or touch event.
   */
  function getPointerPosition(e: MouseEvent | TouchEvent): PointerPosition | null {
    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0]
      if (!touch) return null
      return { clientX: touch.clientX, clientY: touch.clientY }
    }
    return { clientX: e.clientX, clientY: e.clientY }
  }

  function handleMove(clientX: number, clientY: number): void {
    const deltaX = clientX - startPointerX
    const deltaY = clientY - startPointerY

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

  function handleMouseMove(e: MouseEvent): void {
    handleMove(e.clientX, e.clientY)
  }

  function handleTouchMove(e: TouchEvent): void {
    // Prevent scrolling while dragging
    e.preventDefault()
    const pos = getPointerPosition(e)
    if (pos) {
      handleMove(pos.clientX, pos.clientY)
    }
  }

  function handleEnd(): void {
    isDragging.value = false
    onDragEnd?.({ x: currentX.value, y: currentY.value })
    removeListeners()
  }

  function handleMouseUp(): void {
    handleEnd()
  }

  function handleTouchEnd(): void {
    handleEnd()
  }

  function removeListeners(): void {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    document.removeEventListener('touchmove', handleTouchMove)
    document.removeEventListener('touchend', handleTouchEnd)
    document.removeEventListener('touchcancel', handleTouchEnd)
  }

  function startDrag(e: MouseEvent): void {
    // Only left click if specified
    if (leftButtonOnly && e.button !== 0) return

    e.preventDefault()
    isTouchDrag = false

    startPointerX = e.clientX
    startPointerY = e.clientY
    startPosX = currentX.value
    startPosY = currentY.value

    isDragging.value = true
    onDragStart?.(e)

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  function startTouchDrag(e: TouchEvent): void {
    if (!enableTouch) return
    
    const pos = getPointerPosition(e)
    if (!pos) return

    // Prevent default to avoid scrolling
    e.preventDefault()
    isTouchDrag = true

    startPointerX = pos.clientX
    startPointerY = pos.clientY
    startPosX = currentX.value
    startPosY = currentY.value

    isDragging.value = true
    onDragStart?.(e)

    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd)
    document.addEventListener('touchcancel', handleTouchEnd)
  }

  function setPosition(x: number, y: number): void {
    if (!isDragging.value) {
      const clamped = clampToBounds(x, y)
      currentX.value = clamped.x
      currentY.value = clamped.y
    }
  }

  // Cleanup on unmount
  onUnmounted(() => {
    removeListeners()
  })

  return {
    isDragging,
    currentX,
    currentY,
    startDrag,
    startTouchDrag,
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
