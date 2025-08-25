<template>
  <div
    class="os-window"
    :class="{ 'active': isFocused, 'inactive': !isFocused }"
    :style="styleObject"
    @mousedown.stop="onFocus"
  >
    <div class="os-window-header" @mousedown.stop="onStartDrag" @dblclick.stop="onTitlebarDblClick">
      <div class="os-window-controls">
        <button class="os-window-control close" v-if="win.closable" @click.stop="store.closeWindow(win.id)" aria-label="Close"></button>
        <button class="os-window-control minimize" v-if="win.minimizable !== false" @click.stop="store.toggleMinimize(win.id)" aria-label="Minimize"></button>
        <button 
          class="os-window-control maximize" 
          :class="{ disabled: win.maximizable === false }"
          v-if="win.resizable !== false" 
          @click.stop="handleMaximize" 
          aria-label="Maximize"
          :disabled="win.maximizable === false"
        ></button>
      </div>
      <div class="os-window-title">{{ win.title }}</div>
    </div>

    <!-- Resize handles -->
    <div class="resize-handle handle-n"  @mousedown.stop="onStartResize('n',  $event)" />
    <div class="resize-handle handle-s"  @mousedown.stop="onStartResize('s',  $event)" />
    <div class="resize-handle handle-e"  @mousedown.stop="onStartResize('e',  $event)" />
    <div class="resize-handle handle-w"  @mousedown.stop="onStartResize('w',  $event)" />
    <div class="resize-handle handle-ne" @mousedown.stop="onStartResize('ne', $event)" />
    <div class="resize-handle handle-nw" @mousedown.stop="onStartResize('nw', $event)" />
    <div class="resize-handle handle-se" @mousedown.stop="onStartResize('se', $event)" />
    <div class="resize-handle handle-sw" @mousedown.stop="onStartResize('sw', $event)" />

    <div class="os-window-content">
      <slot>
        <!-- Default content for known app windows -->
        <template v-if="win.kind === 'app' || win.kind === 'system'">
          <AppsFinder v-if="win.appId === 'finder'" />
          <AppsTextEdit v-else-if="win.appId === 'textedit'" :window-id="win.id" />
          <AppsShortcuts v-else-if="win.appId === 'shortcuts'" />
          <AppsAbout v-else-if="win.appId === 'about'" />
          <AppsSettings v-else-if="win.appId === 'settings'" />
          <AppsTypingTest v-else-if="win.appId === 'typingtest'" />
          <AppsKeyStation v-else-if="win.appId === 'keystation'" />
          <AppsYahooMessenger v-else-if="win.appId === 'yahoomessenger'" />
        </template>

        <!-- Placeholder content -->
        <template v-else>
          <p>This is a window body (id: {{ win.id }})</p>
        </template>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type CSSProperties, provide } from 'vue'
import type { OSWindowModel } from '../../../types/os'
import { useOSStore } from '../../../stores/os'

defineOptions({ name: 'OsWindow' })

const props = defineProps<{
  win: OSWindowModel
}>()

const store = useOSStore()

provide('window', props.win)

const styleObject = computed<CSSProperties>(() => ({
  position: 'absolute',
  left: props.win.rect.x + 'px',
  top: (props.win.rect.y - store.menuBarHeight) + 'px',
  width: props.win.rect.width + 'px',
  height: props.win.rect.height + 'px',
  zIndex: props.win.zIndex
}))

const isFocused = computed(() => store.focusedId === props.win.id)

function onStartDrag(e: MouseEvent) {
  store.closeMenu()
  store.startDrag(props.win.id, e.clientX, e.clientY)
}

function onStartResize(edge: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw', e: MouseEvent) {
  store.closeMenu()
  store.startResize(props.win.id, edge, e.clientX, e.clientY)
}

function onTitlebarDblClick() {
  // Only maximize if the window is maximizable
  if (props.win.maximizable !== false) {
    store.toggleMaximize(props.win.id)
  }
}

function handleMaximize() {
  // Only maximize if the window is maximizable
  if (props.win.maximizable !== false) {
    store.toggleMaximize(props.win.id)
  }
}

function onFocus() {
  store.closeMenu()
  store.bringToFront(props.win.id)
}
</script>

<style scoped>
.os-window {
  background: var(--bg-window);
  backdrop-filter: blur(var(--blur-amount));
  -webkit-backdrop-filter: blur(var(--blur-amount));
  border: 1px solid var(--border-window);
  border-radius: var(--window-border-radius);
  box-shadow: var(--shadow-window);
  position: absolute;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.os-window.active {
  z-index: var(--z-window-active);
}

.os-window.inactive .os-window-control {
  background: var(--bg-window-action-inactive);
  border-color: var(--border-window);
}

.os-window.inactive .os-window-title {
  color: var(--text-secondary);
}

.os-window-header {
  background: var(--bg-window-header);
  backdrop-filter: blur(var(--blur-amount));
  -webkit-backdrop-filter: blur(var(--blur-amount));
  border-bottom: 1px solid var(--border-window-header);
  height: 32px;
  display: flex;
  align-items: center;
  padding: 0 8px;
  user-select: none;
  cursor: grab;
  position: relative;
}

.os-window-header:active {
  cursor: grabbing;
}

.os-window-controls {
  display: flex;
  gap: 6px;
  align-items: center;
  z-index: 1;
}

.os-window-control {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.12);
  cursor: pointer;
  transition: opacity var(--transition-fast);
}

.os-window-control:hover {
  opacity: 0.8;
}

.os-window-control.close {
  background: #FF5F57;
}

.os-window-control.minimize {
  background: #FFBD2E;
}

.os-window-control.maximize {
  background: #28CA42;
}

.os-window-control.disabled {
  background: var(--border-window);
  cursor: not-allowed;
  opacity: var(--opacity-disabled);
}

.os-window-control.disabled:hover {
  opacity: var(--opacity-disabled);
}

.os-window-title {
  flex: 1;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: none;
}

.os-window-content {
  flex: 1;
  overflow: auto;
  padding: 0;
  color: var(--text-primary);
  background: transparent;
}

/* Resize handles */
.resize-handle {
  position: absolute;
  z-index: 10;
}
.handle-n  { top: -4px; left: 8px; right: 8px; height: 8px; cursor: n-resize; }
.handle-s  { bottom: -4px; left: 8px; right: 8px; height: 8px; cursor: s-resize; }
.handle-e  { right: -4px; top: 8px; bottom: 8px; width: 8px; cursor: e-resize; }
.handle-w  { left: -4px; top: 8px; bottom: 8px; width: 8px; cursor: w-resize; }
.handle-ne { top: -4px; right: -4px; width: 12px; height: 12px; cursor: ne-resize; }
.handle-nw { top: -4px; left:  -4px; width: 12px; height: 12px; cursor: nw-resize; }
.handle-se { bottom: -4px; right: -4px; width: 12px; height: 12px; cursor: se-resize; }
.handle-sw { bottom: -4px; left:  -4px; width: 12px; height: 12px; cursor: sw-resize; }
</style>