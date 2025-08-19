<template>
  <div
    class="os-window"
    :class="{ 'is-focused': isFocused }"
    :style="styleObject"
    @mousedown.stop="onFocus"
  >
    <div class="titlebar" @mousedown.stop="onStartDrag" @dblclick.stop="onTitlebarDblClick">
      <div class="controls">
        <button class="ctrl close" v-if="win.closable" @click.stop="store.closeWindow(win.id)" aria-label="Close"></button>
        <button class="ctrl min" v-if="win.minimizable !== false" @click.stop="store.toggleMinimize(win.id)" aria-label="Minimize"></button>
        <button 
          class="ctrl max" 
          :class="{ disabled: win.maximizable === false }"
          v-if="win.resizable !== false" 
          @click.stop="handleMaximize" 
          aria-label="Maximize"
          :disabled="win.maximizable === false"
        ></button>
      </div>
      <div class="title">{{ win.title }}</div>
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

    <div class="content">
      <slot>
        <!-- Default content for known app windows -->
        <template v-if="win.kind === 'app' || win.kind === 'system'">
          <AppsFinder v-if="win.appId === 'finder'" />
          <AppsTextEdit v-else-if="win.appId === 'textedit'" />
          <AppsShortcuts v-else-if="win.appId === 'shortcuts'" />
          <AppsAbout v-else-if="win.appId === 'about'" />
          <AppsSettings v-else-if="win.appId === 'settings'" />
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
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.15);
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: absolute;
}
.os-window.is-focused {
  box-shadow: 0 0 0 2px rgba(51, 132, 255, 0.5), 0 12px 28px rgba(0,0,0,0.18);
  border-color: #c9defc;
}

.titlebar {
  height: 32px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 8px;
  background: #f8f8f8;
  border-bottom: 1px solid #ececec;
  cursor: grab;
  user-select: none;
}
.titlebar:active {
  cursor: grabbing;
}

.controls {
  display: flex;
  gap: 6px;
  align-items: center;
}
.ctrl {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 0;
  display: inline-block;
  cursor: pointer;
}
.ctrl.close { background: #ff605c; }
.ctrl.min   { background: #ffbd44; }
.ctrl.max   { background: #00ca4e; }
.ctrl:hover { filter: brightness(0.95) }
.ctrl.disabled { 
  background: #c8c8c8; 
  cursor: not-allowed;
  opacity: 0.5;
}
.ctrl.disabled:hover { 
  filter: none; 
}

.title {
  font-size: 13px;
  color: #333;
  font-weight: 600;
  margin-left: 6px;
}

.content {
  padding: 0px;
  font-size: 14px;
  color: #222;
  background: #fff;
  flex: 1;
  overflow: auto;
}

/* Resize handles */
.resize-handle {
  position: absolute;
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