/**
 * Keyboard Input composable for KeyStation
 * Handles keyboard event listeners for playing notes
 */
import { onMounted, onUnmounted } from 'vue'
import type { PlayableNote } from '../types/keystation'
import { WHITE_KEYS, BLACK_KEYS } from '../types/keystation'
import { useOverlayStore } from '../../../../stores/overlay'

/**
 * True when a global key event should NOT play notes: an OS overlay
 * (launcher/app switcher) owns the keyboard, the user is typing in an
 * editable element, or a modifier chord is held (those are OS/browser
 * shortcuts - without this guard, modifier+Space would also toggle sustain).
 * Keyup is deliberately not guarded: stopping a note is always safe, and
 * skipping keyup would leave notes stuck if an overlay opened mid-press.
 */
function shouldIgnoreKeyDown(e: KeyboardEvent): boolean {
  if (e.metaKey || e.ctrlKey || e.altKey) return true
  const overlay = useOverlayStore()
  if (overlay.activeOverlay !== null) return true
  const t = e.target as HTMLElement | null
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return true
  return false
}

export function useKeyboardInput(
  playNote: (note: PlayableNote) => void,
  stopNote: (note: PlayableNote) => void,
  toggleSustain: () => void
) {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (shouldIgnoreKeyDown(e)) return

    const key = e.key.toUpperCase()

    // Find matching key
    const whiteKey = WHITE_KEYS.find(k => k.key === key)
    const blackKey = BLACK_KEYS.find(k => k.key === key)

    if (whiteKey) {
      playNote(whiteKey)
    } else if (blackKey) {
      playNote(blackKey)
    } else if (e.code === 'Space') {
      e.preventDefault()
      toggleSustain()
    }
  }

  const handleKeyUp = (e: KeyboardEvent) => {
    const key = e.key.toUpperCase()

    const whiteKey = WHITE_KEYS.find(k => k.key === key)
    const blackKey = BLACK_KEYS.find(k => k.key === key)

    if (whiteKey) {
      stopNote(whiteKey)
    } else if (blackKey) {
      stopNote(blackKey)
    }
  }

  const setupListeners = () => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
  }

  const cleanupListeners = () => {
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('keyup', handleKeyUp)
  }

  onMounted(setupListeners)
  onUnmounted(cleanupListeners)

  return {
    handleKeyDown,
    handleKeyUp,
  }
}
