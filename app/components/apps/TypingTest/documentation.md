# TypingTest App Documentation

## Overview
A comprehensive typing speed test application for Webintosh OS with retro 2000s aesthetics. This app provides real-time WPM tracking, accuracy measurement, and visual/audio feedback to help users improve their typing skills.

## Features

### 1. Core Typing Test Functionality

#### WPM Calculation
- **Formula**: `(correct_characters / 5) / minutes_elapsed`
- **Standard**: 5 characters = 1 word
- **Update Frequency**: Real-time, every second
- **Display**: Prominent display in stats bar

#### Accuracy Tracking
- **Formula**: `(correct_keystrokes / total_keystrokes) * 100`
- **Real-time Updates**: Recalculates on each keystroke
- **Visual Feedback**: Green for correct, red for incorrect
- **Final Score**: Displayed in results modal

#### Timer System
- **Auto-start**: Begins on first keystroke
- **Format**: MM:SS display
- **Interval**: Updates every second
- **Stop Condition**: Automatically stops on test completion

### 2. Test Content Management

#### Difficulty Levels
```javascript
const testPhrases = {
  easy: [
    "The quick brown fox jumps over the lazy dog.",
    "A journey of a thousand miles begins with a single step.",
    // ... more easy phrases
  ],
  medium: [
    "To be or not to be, that is the question.",
    "Success is not final; failure is not fatal.",
    // ... more medium phrases
  ],
  hard: [
    "The @complexity of modern software requires !careful attention.",
    "Revenue grew by 47% year-over-year to $2.3 billion.",
    // ... more hard phrases
  ]
}
```

#### Text Selection
- Random phrase selection from chosen difficulty
- Change text button for new phrase
- Maintains difficulty selection across tests

### 3. Visual Feedback System

#### Character Highlighting
- **Correct**: Green background (#c0ffc0)
- **Incorrect**: Red background (#ff0000) with white text
- **Current**: Yellow background (#ffff00) with blinking animation
- **Pending**: Gray text (#404040)

#### Keyboard Visualization
```vue
<div class="keyboard-container">
  <!-- Number Row -->
  <div class="keyboard-row">
    <!-- Keys with next-key highlighting -->
  </div>
  <!-- QWERTY Rows -->
  <!-- Modifier Keys and Space Bar -->
</div>
```

#### Key States
- **Normal**: Light gray (#e0e0e0)
- **Pressed**: Dark gray (#808080) with inset shadow
- **Next Key**: Yellow (#ffff00) with pulsing animation
- **Caps Active**: Green (#00ff00)

### 4. Audio System

#### Sound Synthesis
```javascript
function playKeySound(isCorrect: boolean) {
  const audioContext = new AudioContext()
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()
  
  // Frequency based on correctness
  oscillator.frequency.value = isCorrect ? 400 : 600
  oscillator.type = 'sine'
  
  // Quick fade out
  gainNode.gain.exponentialRampToValueAtTime(0.001, 
    audioContext.currentTime + 0.05)
}
```

#### Audio Parameters
- **Correct Key**: 400Hz sine wave
- **Incorrect Key**: 600Hz sine wave
- **Duration**: 100ms with fade out
- **Volume**: 3% of max (0.03 gain)

### 5. Results Modal

#### Displayed Metrics
- **WPM**: Final words per minute
- **Accuracy**: Percentage of correct keystrokes
- **Time**: Total time taken
- **Characters**: Total character count

#### Actions
- **Try Again**: Restarts with same difficulty
- **Close**: Returns to typing interface

### 6. Retro 2000s Design

#### Color Palette
```css
/* Primary Colors */
--background: #008080;      /* Teal */
--ui-gray: #c0c0c0;         /* Windows 95 gray */
--text-navy: #000080;       /* Navy blue */
--text-black: #000000;      /* Black */

/* Accent Colors */
--correct: #008000;         /* Green */
--incorrect: #ff0000;       /* Red */
--highlight: #ffff00;       /* Yellow */
```

#### Visual Effects
- **3D Borders**: Beveled edges using light/dark borders
- **Inset Shadows**: Recessed input fields
- **Raised Buttons**: Outset appearance
- **System Fonts**: MS Sans Serif, Tahoma, Courier New

## Component Structure

### File Organization
```
/app/components/apps/TypingTest/
├── index.vue           # Main component
├── typingtest.css      # Standalone styles
└── documentation.md    # This file
```

### State Management
```javascript
// Core State
const testText = ref<string>('')
const userInput = ref<string>('')
const currentIndex = ref<number>(0)
const hasStarted = ref<boolean>(false)
const isComplete = ref<boolean>(false)

// Statistics
const startTime = ref<number>(0)
const elapsedTime = ref<number>(0)
const totalKeystrokes = ref<number>(0)
const correctKeystrokes = ref<number>(0)

// UI State
const selectedDifficulty = ref<'easy'|'medium'|'hard'>('easy')
const activeKeys = ref<Set<string>>(new Set())
```

### Computed Properties
```javascript
const wpm = computed(() => {
  if (elapsedTime.value === 0) return 0
  const minutes = elapsedTime.value / 60
  const words = correctKeystrokes.value / 5
  return Math.round(words / minutes)
})

const accuracy = computed(() => {
  if (totalKeystrokes.value === 0) return 100
  return Math.round((correctKeystrokes.value / totalKeystrokes.value) * 100)
})
```

## Event Handling

### Keyboard Events
```javascript
function handleKeyDown(e: KeyboardEvent) {
  // Track active keys for visualization
  activeKeys.value.add(e.code)
  
  // Handle special keys
  if (e.key === 'Backspace') {
    e.preventDefault()
    handleBackspace()
  }
}

function handleKeyUp(e: KeyboardEvent) {
  // Remove from active keys with debounce
  setTimeout(() => {
    activeKeys.value.delete(e.code)
  }, 50)
}
```

### Input Processing
```javascript
function handleInput(e: Event) {
  const newChar = input.value.slice(-1)
  
  // Start test on first character
  if (!hasStarted.value && newChar) {
    startTest()
  }
  
  // Check character correctness
  const expectedChar = testText.value[currentIndex.value]
  const isCorrect = newChar === expectedChar
  
  // Update statistics
  totalKeystrokes.value++
  if (isCorrect) {
    correctKeystrokes.value++
    currentIndex.value++
  }
  
  // Play sound feedback
  playKeySound(isCorrect)
  
  // Check completion
  if (currentIndex.value >= testText.value.length) {
    completeTest()
  }
}
```

## CSS Architecture

### Standalone Styling
- No dependency on Webintosh theme system
- Hardcoded retro colors for consistent appearance
- Self-contained in `typingtest.css`

### Key Classes
```css
.typing-test-app           /* Main container */
.stats-bar                 /* Statistics display */
.test-area                 /* Text and input area */
.test-text-container       /* Test phrase display */
.keyboard-container        /* Virtual keyboard */
.results-modal            /* Completion overlay */
```

## Performance Considerations

### Optimizations
1. **Key Debouncing**: 50ms delay prevents flicker
2. **Set for Active Keys**: O(1) lookup performance
3. **Computed Properties**: Cached calculations
4. **Single Audio Context**: Reused for all sounds
5. **Minimal DOM Updates**: Only changed characters re-render

### Memory Management
- Audio context cleanup on unmount
- Timer cleanup on component destroy
- Event listener removal

## Browser Compatibility

### Requirements
- **ES6+**: Modern JavaScript features
- **Web Audio API**: For sound effects
- **CSS Grid**: For layout
- **CSS Variables**: Not used (hardcoded colors)

### Tested Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Future Enhancement Ideas

1. **Statistics Tracking**
   - Historical WPM graphs
   - Personal best records
   - Progress over time

2. **Advanced Features**
   - Custom text input
   - Import text from clipboard
   - Typing lessons/tutorials
   - Finger position guide

3. **Gamification**
   - Achievements/badges
   - Leaderboards
   - Multiplayer races
   - Daily challenges

4. **Accessibility**
   - Screen reader support
   - High contrast mode
   - Adjustable font sizes
   - Keyboard navigation

5. **Additional Layouts**
   - Dvorak keyboard
   - Colemak layout
   - International layouts
   - Programmable layouts

## Troubleshooting

### Common Issues

1. **Input not registering**
   - Check if hidden input has focus
   - Verify event listeners are attached

2. **Sound not playing**
   - Check browser audio permissions
   - Ensure AudioContext is initialized

3. **Timer not starting**
   - Verify hasStarted flag is set
   - Check timer interval is created

4. **Incorrect WPM calculation**
   - Verify elapsed time is updating
   - Check correct keystroke counting

## Contributing

### Code Style
- Vue 3 Composition API
- TypeScript for type safety
- BEM-like CSS naming
- Comprehensive comments

### Testing Checklist
- [ ] All difficulty levels work
- [ ] WPM calculation is accurate
- [ ] Accuracy tracking is correct
- [ ] Sound plays on keystrokes
- [ ] Keyboard visualization updates
- [ ] Results modal displays correctly
- [ ] Restart functionality works
- [ ] Focus management is proper

---

*Last Updated: August 20, 2025*
