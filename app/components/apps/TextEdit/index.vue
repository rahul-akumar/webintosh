<template>
  <div class="textedit-app">
    <!-- Formatting Toolbar -->
    <div class="toolbar">
      <!-- Text Formatting -->
      <div class="toolbar-group">
        <button 
          @click="format('bold')" 
          :class="{ active: isFormatActive('bold') }"
          title="Bold (Cmd+B)"
        >
          <strong>B</strong>
        </button>
        <button 
          @click="format('italic')" 
          :class="{ active: isFormatActive('italic') }"
          title="Italic (Cmd+I)"
        >
          <em>I</em>
        </button>
        <button 
          @click="format('underline')" 
          :class="{ active: isFormatActive('underline') }"
          title="Underline (Cmd+U)"
        >
          <u>U</u>
        </button>
        <button 
          @click="format('strikeThrough')" 
          :class="{ active: isFormatActive('strikeThrough') }"
          title="Strikethrough"
        >
          <s>S</s>
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <!-- Text Alignment -->
      <div class="toolbar-group">
        <button 
          @click="format('justifyLeft')" 
          :class="{ active: isFormatActive('justifyLeft') }"
          title="Align Left"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 3h12v1H2zM2 6h8v1H2zM2 9h12v1H2zM2 12h8v1H2z"/>
          </svg>
        </button>
        <button 
          @click="format('justifyCenter')" 
          :class="{ active: isFormatActive('justifyCenter') }"
          title="Align Center"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 3h8v1H4zM2 6h12v1H2zM4 9h8v1H4zM2 12h12v1H2z"/>
          </svg>
        </button>
        <button 
          @click="format('justifyRight')" 
          :class="{ active: isFormatActive('justifyRight') }"
          title="Align Right"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 3h12v1H2zM6 6h8v1H6zM2 9h12v1H2zM6 12h8v1H6z"/>
          </svg>
        </button>
        <button 
          @click="format('justifyFull')" 
          :class="{ active: isFormatActive('justifyFull') }"
          title="Justify"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 3h12v1H2zM2 6h12v1H2zM2 9h12v1H2zM2 12h12v1H2z"/>
          </svg>
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <!-- Lists -->
      <div class="toolbar-group">
        <button 
          @click="format('insertUnorderedList')" 
          :class="{ active: isFormatActive('insertUnorderedList') }"
          title="Bullet List"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="3" cy="4" r="1"/>
            <circle cx="3" cy="8" r="1"/>
            <circle cx="3" cy="12" r="1"/>
            <path d="M6 3.5h8v1H6zM6 7.5h8v1H6zM6 11.5h8v1H6z"/>
          </svg>
        </button>
        <button 
          @click="format('insertOrderedList')" 
          :class="{ active: isFormatActive('insertOrderedList') }"
          title="Numbered List"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <text x="2" y="5" font-size="5" font-family="Arial">1</text>
            <text x="2" y="9" font-size="5" font-family="Arial">2</text>
            <text x="2" y="13" font-size="5" font-family="Arial">3</text>
            <path d="M6 3.5h8v1H6zM6 7.5h8v1H6zM6 11.5h8v1H6z"/>
          </svg>
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <!-- Font Controls -->
      <div class="toolbar-group">
        <select 
          v-model="selectedFont" 
          @change="changeFont"
          class="font-selector"
        >
          <option value="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">System</option>
          <option value="'Helvetica Neue', Helvetica, Arial, sans-serif">Helvetica</option>
          <option value="'Times New Roman', Times, serif">Times</option>
          <option value="Georgia, serif">Georgia</option>
          <option value="'Courier New', Courier, monospace">Courier</option>
          <option value="'Monaco', 'Courier New', monospace">Monaco</option>
          <option value="'Arial', sans-serif">Arial</option>
          <option value="'Verdana', sans-serif">Verdana</option>
          <option value="'Comic Sans MS', cursive">Comic Sans</option>
        </select>

        <select 
          v-model="selectedSize" 
          @change="changeFontSize"
          class="size-selector"
        >
          <option value="1">8pt</option>
          <option value="2">10pt</option>
          <option value="3">12pt</option>
          <option value="4">14pt</option>
          <option value="5">18pt</option>
          <option value="6">24pt</option>
          <option value="7">36pt</option>
        </select>
      </div>

      <div class="toolbar-divider"></div>

      <!-- Additional Actions -->
      <div class="toolbar-group">
        <button 
          @click="format('removeFormat')" 
          title="Clear Formatting"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8.5 2L3 7.5 4.5 9l2-2v7h2V7l2 2L12 7.5 8.5 2zM2 14h12v1H2z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Rich Text Editor -->
    <div 
      ref="editor"
      class="editor"
      contenteditable="true"
      @input="onInput"
      @keydown="handleKeyDown"
      @paste="handlePaste"
      spellcheck="true"
    >
      <p>Start typing...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, reactive } from 'vue'

defineOptions({ name: 'TextEditApp' })

const editor = ref<HTMLElement>()
const selectedFont = ref("-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif")
const selectedSize = ref("3")

// Reactive state for tracking active formats
const activeFormats = reactive({
  bold: false,
  italic: false,
  underline: false,
  strikeThrough: false,
  justifyLeft: false,
  justifyCenter: false,
  justifyRight: false,
  justifyFull: false,
  insertUnorderedList: false,
  insertOrderedList: false
})

const format = (command: string, value?: string) => {
  document.execCommand(command, false, value)
  editor.value?.focus()
  // Update active states after formatting
  updateActiveFormats()
}

const isFormatActive = (command: string) => {
  return activeFormats[command as keyof typeof activeFormats] || false
}

const updateActiveFormats = () => {
  // Update text formatting states
  activeFormats.bold = document.queryCommandState('bold')
  activeFormats.italic = document.queryCommandState('italic')
  activeFormats.underline = document.queryCommandState('underline')
  activeFormats.strikeThrough = document.queryCommandState('strikeThrough')
  
  // Update alignment states
  activeFormats.justifyLeft = document.queryCommandState('justifyLeft')
  activeFormats.justifyCenter = document.queryCommandState('justifyCenter')
  activeFormats.justifyRight = document.queryCommandState('justifyRight')
  activeFormats.justifyFull = document.queryCommandState('justifyFull')
  
  // Update list states
  activeFormats.insertUnorderedList = document.queryCommandState('insertUnorderedList')
  activeFormats.insertOrderedList = document.queryCommandState('insertOrderedList')
  
  // Update font selectors with current values
  const fontName = document.queryCommandValue('fontName')
  if (fontName) {
    // Remove quotes from font name for comparison
    const cleanFontName = fontName.replace(/['"]/g, '')
    const matchingOption = Array.from(document.querySelectorAll('.font-selector option')).find(
      option => option.getAttribute('value')?.includes(cleanFontName)
    )
    if (matchingOption) {
      selectedFont.value = matchingOption.getAttribute('value') || selectedFont.value
    }
  }
  
  const fontSize = document.queryCommandValue('fontSize')
  if (fontSize) {
    selectedSize.value = fontSize
  }
}

const changeFont = () => {
  format('fontName', selectedFont.value)
}

const changeFontSize = () => {
  format('fontSize', selectedSize.value)
}

const onInput = () => {
  // Handle empty editor
  if (editor.value && editor.value.innerHTML === '<br>') {
    editor.value.innerHTML = '<p>Start typing...</p>'
  }
  // Update active formats on input
  updateActiveFormats()
}

const handleKeyDown = (e: KeyboardEvent) => {
  // Add keyboard shortcuts
  if (e.metaKey || e.ctrlKey) {
    switch(e.key) {
      case 'b':
        e.preventDefault()
        format('bold')
        break
      case 'i':
        e.preventDefault()
        format('italic')
        break
      case 'u':
        e.preventDefault()
        format('underline')
        break
    }
  }
}

const handlePaste = (e: ClipboardEvent) => {
  // Handle paste to maintain formatting
  e.preventDefault()
  const text = e.clipboardData?.getData('text/html') || e.clipboardData?.getData('text/plain')
  if (text) {
    document.execCommand('insertHTML', false, text)
  }
}

// Handle selection changes
const handleSelectionChange = () => {
  updateActiveFormats()
}

onMounted(() => {
  // Focus editor and clear placeholder on first click
  editor.value?.addEventListener('focus', function handleFocus() {
    if (editor.value?.innerHTML === '<p>Start typing...</p>') {
      editor.value.innerHTML = ''
    }
    updateActiveFormats()
  })

  editor.value?.addEventListener('blur', function handleBlur() {
    if (editor.value?.innerHTML === '') {
      editor.value.innerHTML = '<p>Start typing...</p>'
    }
  })
  
  // Add selection change listener to update toolbar states
  document.addEventListener('selectionchange', handleSelectionChange)
  
  // Add click listener to editor to update states
  editor.value?.addEventListener('click', updateActiveFormats)
  editor.value?.addEventListener('keyup', updateActiveFormats)
  
  // Set initial alignment state
  updateActiveFormats()
})

onUnmounted(() => {
  // Clean up event listeners
  document.removeEventListener('selectionchange', handleSelectionChange)
})
</script>

<style scoped>
.textedit-app {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
}

.toolbar {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: linear-gradient(to bottom, #f6f6f6, #e8e8e8);
  border-bottom: 1px solid #d1d1d1;
  gap: 8px;
  flex-wrap: wrap;
}

.toolbar-group {
  display: flex;
  gap: 4px;
  align-items: center;
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: #c8c8c8;
}

.toolbar button {
  width: 32px;
  height: 28px;
  border: 1px solid transparent;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #333;
  transition: all 0.2s;
}

.toolbar button:hover {
  background: rgba(0, 0, 0, 0.05);
  border-color: rgba(0, 0, 0, 0.1);
}

.toolbar button:active {
  background: rgba(0, 0, 0, 0.1);
}

.toolbar button.active {
  background: rgba(0, 122, 255, 0.15);
  border-color: rgba(0, 122, 255, 0.3);
  color: #007AFF;
}

.font-selector,
.size-selector {
  padding: 4px 8px;
  border: 1px solid #c8c8c8;
  border-radius: 4px;
  background: white;
  font-size: 12px;
  color: #333;
  cursor: pointer;
  outline: none;
}

.font-selector:hover,
.size-selector:hover {
  border-color: #999;
}

.font-selector:focus,
.size-selector:focus {
  border-color: #007AFF;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.font-selector {
  min-width: 120px;
}

.size-selector {
  min-width: 60px;
}

.editor {
  flex: 1;
  padding: 20px;
  outline: none;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  line-height: 1.6;
  background: white;
  overflow-y: auto;
  word-wrap: break-word;
}

.editor:focus {
  outline: none;
}

.editor p {
  margin: 0 0 1em 0;
}

.editor p:last-child {
  margin-bottom: 0;
}

.editor ul,
.editor ol {
  margin: 0 0 1em 0;
  padding-left: 2em;
}

.editor li {
  margin-bottom: 0.25em;
}

.editor blockquote {
  margin: 0 0 1em 0;
  padding-left: 1em;
  border-left: 3px solid #ddd;
  color: #666;
}

/* Placeholder styling */
.editor:empty:before,
.editor p:only-child:empty:before {
  content: attr(placeholder);
  color: #999;
  pointer-events: none;
}

/* Print styles */
@media print {
  .toolbar {
    display: none;
  }
  
  .editor {
    border: none;
    padding: 0;
  }
}
</style>
