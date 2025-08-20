// TypingTest Menu Command Handlers
import { register } from '../../../composables/menuCommands'

export interface TypingTestAPI {
  startNewTest: () => void
  changeText: () => void
  toggleSound: () => void
  selectedDifficulty: { value: 'easy' | 'medium' | 'hard' }
  hasStarted: { value: boolean }
  isComplete: { value: boolean }
  showKeyboard?: { value: boolean }
  showStats?: { value: boolean }
}

/**
 * Register all TypingTest menu command handlers
 * Call this in the component's onMounted hook
 */
export function registerTypingTestCommands(api: TypingTestAPI) {
  // Test menu commands
  register('typingtest.newTest', () => {
    api.startNewTest()
  })
  
  register('typingtest.restartTest', () => {
    api.startNewTest()
  })
  
  register('typingtest.changeText', () => {
    if (!api.hasStarted.value || api.isComplete.value) {
      api.changeText()
    }
  })
  
  register('typingtest.setDifficulty', (args) => {
    const level = (args as Record<string, unknown>)?.level as 'easy' | 'medium' | 'hard' | undefined
    if (level && ['easy', 'medium', 'hard'].includes(level)) {
      api.selectedDifficulty.value = level
      if (!api.hasStarted.value || api.isComplete.value) {
        api.changeText()
      }
    }
  })
  
  // Settings menu commands
  register('typingtest.toggleSound', () => {
    api.toggleSound()
  })
  
  register('typingtest.toggleKeyboard', () => {
    if (api.showKeyboard) {
      api.showKeyboard.value = !api.showKeyboard.value
    }
  })
  
  register('typingtest.showSessionStats', () => {
    if (api.showStats) {
      api.showStats.value = !api.showStats.value
    }
  })
  
  // Help menu commands
  register('typingtest.showTips', () => {
    // Show typing tips modal
    alert(`Typing Tips:

1. Keep your fingers on the home row (ASDF JKL;)
2. Use the correct finger for each key
3. Focus on accuracy first, speed will follow
4. Practice regularly for best results
5. Take breaks to avoid fatigue`)
  })
}

/**
 * Example usage in your component:
 * 
 * import { registerTypingTestCommands } from './typingTestCommands'
 * 
 * onMounted(() => {
 *   registerTypingTestCommands({
 *     startNewTest,
 *     changeText,
 *     toggleSound,
 *     selectedDifficulty,
 *     hasStarted,
 *     isComplete,
 *     showKeyboard,
 *     showStats
 *   })
 * })
 */
