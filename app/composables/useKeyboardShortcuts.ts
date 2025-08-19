import { ref, computed, onMounted } from 'vue'

// Detect if running on Mac
export function useKeyboardShortcuts() {
  const isMac = ref(false)
  
  onMounted(() => {
    // Detect Mac platform
    isMac.value = navigator.platform.toLowerCase().includes('mac') || 
                  navigator.userAgent.toLowerCase().includes('mac')
  })
  
  // Get the appropriate modifier key for the platform
  const modifierKey = computed(() => isMac.value ? 'ctrlKey' : 'altKey')
  const modifierName = computed(() => isMac.value ? 'Ctrl' : 'Alt')
  const modifierSymbol = computed(() => isMac.value ? '⌃' : 'Alt')
  
  // Check if the correct modifier is pressed for the platform
  function isModifierPressed(e: KeyboardEvent): boolean {
    if (isMac.value) {
      // On Mac: use Ctrl (not Cmd to avoid browser conflicts)
      return e.ctrlKey && !e.metaKey && !e.altKey
    } else {
      // On Windows/Linux: use Alt (not Ctrl to avoid browser conflicts)
      return e.altKey && !e.metaKey && !e.ctrlKey
    }
  }
  
  // Format a shortcut for display
  function formatShortcut(key: string, shift = false): string {
    const mod = isMac.value ? '⌃' : 'Alt'
    const shiftPart = shift ? (isMac.value ? '⇧' : 'Shift + ') : ''
    
    // Special key formatting
    const displayKey = key === '`' ? '`' : 
                      key === '/' ? '/' :
                      key.toUpperCase()
    
    if (isMac.value) {
      return `${mod}${shiftPart}${displayKey}`
    } else {
      return shift ? `Alt + Shift + ${displayKey}` : `Alt + ${displayKey}`
    }
  }
  
  return {
    isMac,
    modifierKey,
    modifierName,
    modifierSymbol,
    isModifierPressed,
    formatShortcut
  }
}
