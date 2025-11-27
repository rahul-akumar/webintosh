<template>
  <div
    class="os-window"
    :class="windowClasses"
    :style="styleObject"
    @mousedown.stop="onFocus"
  >
    <div class="os-window-header" @mousedown.stop="onStartDrag" @touchstart.stop="onTouchStartDrag" @dblclick.stop="onTitlebarDblClick">
      <div class="os-window-controls">
        <button v-if="win.closable" class="os-window-control close" aria-label="Close" @click.stop="store.closeWindow(win.id)"/>
        <button v-if="win.minimizable !== false" class="os-window-control minimize" aria-label="Minimize" @click.stop="store.toggleMinimize(win.id)"/>
        <button 
          v-if="win.resizable !== false" 
          class="os-window-control maximize"
          :class="{ disabled: win.maximizable === false }" 
          aria-label="Maximize" 
          :disabled="win.maximizable === false"
          @click.stop="handleMaximize"
        />
      </div>
      <div class="os-window-title">{{ win.title }}</div>
    </div>

    <!-- Resize handles with accessibility labels -->
    <div
      v-for="h in resizeHandles"
      :key="h.edge"
      :class="['resize-handle', `handle-${h.edge}`]"
      role="separator"
      :aria-label="h.label"
      @mousedown.stop="onStartResize(h.edge, $event)"
      @touchstart.stop="onTouchStartResize(h.edge, $event)"
    />

    <div class="os-window-content">
      <slot>
        <!-- Dynamic app content from registry with error boundary -->
        <Suspense v-if="appComponent">
          <component 
            :is="appComponent" 
            :window-id="win.id"
          />
          <template #fallback>
            <div class="app-loading">
              <span class="loading-spinner"/>
              <span>Loading...</span>
            </div>
          </template>
        </Suspense>
        <!-- Placeholder content for unknown apps -->
        <p v-else>This is a window body (id: {{ win.id }})</p>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type CSSProperties, provide } from 'vue'
import type { OSWindowModel } from '../../types/os'
import { useOSStore } from '../../stores/os'
import { getAppComponent } from '../../config/apps'

defineOptions({ name: 'OsWindow' })

const props = defineProps<{
  win: OSWindowModel
}>()

const store = useOSStore()

provide('window', props.win)

const resizeHandles = [
  { edge: 'n', label: 'Resize top' },
  { edge: 's', label: 'Resize bottom' },
  { edge: 'e', label: 'Resize right' },
  { edge: 'w', label: 'Resize left' },
  { edge: 'ne', label: 'Resize top-right corner' },
  { edge: 'nw', label: 'Resize top-left corner' },
  { edge: 'se', label: 'Resize bottom-right corner' },
  { edge: 'sw', label: 'Resize bottom-left corner' },
] as const

// Resolve app component from registry
const appComponent = computed(() => {
  if (props.win.kind === 'app' || props.win.kind === 'system') {
    return getAppComponent(props.win.appId)
  }
  return undefined
})

const styleObject = computed<CSSProperties>(() => ({
  position: 'absolute',
  left: props.win.rect.x + 'px',
  top: (props.win.rect.y - store.menuBarHeight) + 'px',
  width: props.win.rect.width + 'px',
  height: props.win.rect.height + 'px',
  zIndex: props.win.zIndex
}))

const isFocused = computed(() => store.focusedId === props.win.id)

const windowClasses = computed(() => ({
  'active': isFocused.value,
  'inactive': !isFocused.value,
  'minimizing': props.win.animationState === 'minimizing',
  'restoring': props.win.animationState === 'restoring',
  'maximizing': props.win.animationState === 'maximizing',
  'unmaximizing': props.win.animationState === 'unmaximizing',
}))

function onStartDrag(e: MouseEvent) {
  store.closeMenu()
  store.startDrag(props.win.id, e.clientX, e.clientY)
}

function onTouchStartDrag(e: TouchEvent) {
  const touch = e.touches[0]
  if (!touch) return
  store.closeMenu()
  store.startDrag(props.win.id, touch.clientX, touch.clientY)
}

function onStartResize(edge: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw', e: MouseEvent) {
  store.closeMenu()
  store.startResize(props.win.id, edge, e.clientX, e.clientY)
}

function onTouchStartResize(edge: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw', e: TouchEvent) {
  const touch = e.touches[0]
  if (!touch) return
  store.closeMenu()
  store.startResize(props.win.id, edge, touch.clientX, touch.clientY)
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

/* App loading state */
.app-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  height: 100%;
  min-height: 120px;
  color: var(--text-secondary);
  font-size: 14px;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--border-window);
  border-top-color: var(--text-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Minimize animation - scale down and fade towards dock */
.os-window.minimizing {
  animation: window-minimize 0.3s cubic-bezier(0.2, 0, 0, 1) forwards;
  transform-origin: bottom center;
  pointer-events: none;
}

/* Restore animation - scale up and fade from dock */
.os-window.restoring {
  animation: window-restore 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  transform-origin: bottom center;
}

@keyframes window-minimize {
  0% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 0;
    transform: scale(0.4) translateY(80vh);
  }
}

@keyframes window-restore {
  0% {
    opacity: 0;
    transform: scale(0.4) translateY(80vh);
  }
  50% {
    opacity: 0.8;
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Maximize/unmaximize transitions */
.os-window.maximizing,
.os-window.unmaximizing {
  transition: left 0.25s cubic-bezier(0.16, 1, 0.3, 1),
              top 0.25s cubic-bezier(0.16, 1, 0.3, 1),
              width 0.25s cubic-bezier(0.16, 1, 0.3, 1),
              height 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
