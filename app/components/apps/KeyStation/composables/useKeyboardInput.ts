/**
 * Keyboard Input composable for KeyStation
 * Handles keyboard event listeners for playing notes
 */
import { onMounted, onUnmounted } from 'vue'
import type { PlayableNote } from '../types/keystation'
import { WHITE_KEYS, BLACK_KEYS } from '../types/keystation'

export function useKeyboardInput(
  playNote: (note: PlayableNote) => void,
  stopNote: (note: PlayableNote) => void,
  toggleSustain: () => void
) {
  const handleKeyDown = (e: KeyboardEvent) => {
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
