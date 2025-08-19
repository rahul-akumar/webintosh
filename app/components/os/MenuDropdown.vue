<template>
  <div
    class="menu-dropdown"
    :class="{ 'no-hover': justOpened }"
    :style="positionStyle"
    role="menu"
    @keydown.stop.prevent="onKeydown"
  >
    <ul ref="listEl" class="menu-list" role="none">
      <template v-for="(entry, idx) in entries" :key="entry.id">
        <!-- Separator -->
        <li v-if="entry.role === 'separator' && isVisible(entry)" class="menu-sep" role="separator" />

        <!-- Item -->
        <li
          v-else-if="entry.role === 'item' && isVisible(entry)"
          class="menu-item"
          :class="{ disabled: entry.enabled === false, checked: !!entry.checked, active: idx === activeIndex }"
          :role="entry.checked ? 'menuitemcheckbox' : 'menuitem'"
          :aria-checked="entry.checked === true ? 'true' : undefined"
          :aria-disabled="entry.enabled === false ? 'true' : 'false'"
          :tabindex="-1"
          :data-idx="idx"
          @mouseenter="onHoverIndex(idx)"
          @mouseleave="onHoverIndex(-1)"
          @click="onClickItem(entry)"
        >
          <div class="menu-item-left">
            <span class="checkmark" aria-hidden="true">{{ entry.checked ? '✓' : '' }}</span>
            <span class="label">{{ entry.label }}</span>
          </div>
          <div class="menu-item-right">
            <span v-if="entry.accel" class="accel">{{ formatAccelerator(entry.accel) }}</span>
          </div>
        </li>

        <!-- Submenu -->
        <li
          v-else-if="entry.role === 'submenu' && isVisible(entry)"
          class="menu-item submenu"
          :class="{ active: idx === activeIndex }"
          role="menuitem"
          aria-haspopup="true"
          :aria-expanded="idx === activeIndex ? 'true' : 'false'"
          :tabindex="-1"
          :data-idx="idx"
          @mouseenter="onHoverIndex(idx)"
        >
          <div class="menu-item-left">
            <!-- Reserve checkmark space so submenu rows align with regular items -->
            <span class="checkmark" aria-hidden="true"></span>
            <span class="label">{{ entry.label }}</span>
          </div>
          <div class="menu-item-right">
            <span class="submenu-arrow" aria-hidden="true">›</span>
          </div>

          <!-- Nested submenu panel: open to the side of the parent item -->
          <MenuDropdown
            v-if="idx === activeIndex"
            class="submenu-panel"
            :entries="entry.children"
            :teleport="teleport"
            :z="childZ"
            @executed="onExecuted"
          />
        </li>
      </template>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick, onMounted } from 'vue'
import type { CSSProperties } from 'vue'
import type { MenuEntry, MenuItem, Accelerator } from '../../../types/menu'
import { formatAccelerator } from '../../../types/menu'
import { execute } from '../../composables/menuCommands'

defineOptions({ name: 'MenuDropdown' })

const props = defineProps<{
  entries: MenuEntry[]
  // Optional absolute position for root dropdown (e.g., context menu).
  // When omitted, the dropdown renders at natural flow/parent-relative position.
  origin?: { x: number; y: number }
  // Whether to Teleport to body (future use by a wrapper; for now this component can be in-flow)
  teleport?: boolean
  // Base z-index for stacking submenus
  z?: number
}>()

const emit = defineEmits<{
  (e: 'executed', payload: { id: string }): void
  (e: 'navLeft' | 'navRight'): void
}>()

const listEl = ref<HTMLElement | null>(null)

const activeIndex = ref<number>(-1)

/**
 * Avoid immediately highlighting the first item when the dropdown opens under the cursor.
 * We ignore initial mouseenter until the user moves the mouse (or a brief timeout elapses).
 */
const justOpened = ref(true)
onMounted(() => {
  // Clear "just opened" as soon as the mouse moves, or after a short delay.
  const clear = () => { justOpened.value = false; window.removeEventListener('mousemove', clear) }
  window.addEventListener('mousemove', clear, { once: true })
  window.setTimeout(() => { justOpened.value = false }, 150)
})

const positionStyle = computed<CSSProperties>(() => {
  const baseZ = props.z ?? 1000
  const style: CSSProperties = {
    position: 'absolute',
    zIndex: baseZ
  }
  if (props.origin) {
    style.left = `${props.origin.x}px`
    style.top = `${props.origin.y}px`
  }
  return style
})


const childZ = computed(() => (props.z ?? 1000) + 1)

function isVisible(e: MenuEntry): boolean {
  return e.visible !== false
}

// Navigable entry indices (skip separators and hidden)
const navigable = computed<number[]>(() =>
  props.entries
    .map((e, i) => (e.role !== 'separator' && e.visible !== false ? i : -1))
    .filter(i => i >= 0)
)

function focusCurrent() {
  // Focus the currently active item if present
  const idx = activeIndex.value
  const root = listEl.value
  if (!root) return
  const el = root.querySelector<HTMLElement>(`.menu-item[data-idx="${idx}"]`)
  el?.focus()
}

function focusIndex(i: number) {
  activeIndex.value = i
  nextTick(() => focusCurrent())
}

function focusFirst() {
  const nav = navigable.value
  if (!nav.length) return
  const first = nav[0] as number
  focusIndex(first)
}

function focusLast() {
  const nav = navigable.value
  if (!nav.length) return
  const last = nav[nav.length - 1] as number
  focusIndex(last)
}

function move(delta: 1 | -1) {
  const nav = navigable.value
  if (!nav.length) return
  const curPos = nav.indexOf(activeIndex.value)
  const nextPos = curPos >= 0 ? (curPos + delta + nav.length) % nav.length : (delta > 0 ? 0 : nav.length - 1)
  // TS safeguard: nextPos is guaranteed in-range, but provide a fallback for the type system
  const nextIdx = (nav[nextPos] ?? nav[0]) as number
  focusIndex(nextIdx)
}

function accelToText(a?: Accelerator): string {
  if (!a) return ''
  const parts: string[] = []
  if (a.ctrl) parts.push('Ctrl')
  if (a.meta) parts.push('Meta')
  if (a.alt) parts.push('Alt')
  if (a.shift) parts.push('Shift')
  parts.push(a.key.toUpperCase())
  return parts.join('+')
}

function onHoverIndex(i: number) {
  if (justOpened.value) return
  activeIndex.value = i
}

function onClickItem(entry: MenuItem) {
  if (entry.enabled === false) return
  if (entry.command) {
    execute(entry.command, entry.args)
    emit('executed', { id: entry.id })
  }
}

function onExecuted(payload: { id: string }) {
  emit('executed', payload)
}

// Basic keyboard navigation for vertical menus
function onKeydown(e: KeyboardEvent) {
  const nav = navigable.value
  if (!nav.length) return

  switch (e.key) {
    case 'ArrowDown':
      move(1)
      break
    case 'ArrowUp':
      move(-1)
      break
    case 'Home':
      focusFirst()
      break
    case 'End':
      focusLast()
      break
    case 'Enter': {
      const idx = activeIndex.value
      const entry = props.entries[idx]
      if (entry && entry.role === 'item' && entry.enabled !== false) {
        onClickItem(entry)
      }
      break
    }
    case 'Escape':
      // Let parent manage close
      break
    case 'ArrowRight':
      emit('navRight')
      break
    case 'ArrowLeft':
      emit('navLeft')
      break
    default:
      break
  }
}
</script>

<style scoped>
.menu-dropdown {
  min-width: 220px;
  background: #fff;
  border: 1px solid #e3e3e3;
  border-radius: 8px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.12);
  padding: 8px; /* slightly roomier shell to match menubar spacing */
}

.menu-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.menu-sep {
  height: 1px;
  margin: 8px 6px; /* wider breathing space between logical groups */
  background: #ececec;
}

.menu-item {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 8px 10px; /* increase horizontal padding for balance with menubar */
  min-height: 28px;  /* consistent hit target and rhythm */
  border-radius: 6px;
  font-size: 14px;
  color: #222;
  cursor: default;
  user-select: none;
  position: relative;
}

.menu-item.disabled {
  color: #aaa;
}

.menu-item.active:not(.disabled) {
  background: rgba(0, 0, 0, 0.06);
}

/* Visible focus ring for keyboard navigation */
.menu-item:focus {
  outline: 2px solid rgba(51, 132, 255, 0.8);
  outline-offset: 1px;
  background: rgba(0, 0, 0, 0.06);
}

.menu-item .menu-item-left {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1 1 auto; /* let label area take remaining space */
}

.menu-item .menu-item-right {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;     /* push accelerators to the right edge */
  text-align: right;
  min-width: 80px;       /* keep accel column aligned */
}

.checkmark {
  width: 16px;
  display: inline-block;
  text-align: center;
}

.accel {
  color: #666;
  font-size: 12px;
}

.submenu .submenu-arrow {
  color: #666;
  display: inline-flex;       /* ensure vertical centering like accelerators */
  align-items: center;
  justify-content: center;
  width: 14px;                /* small, consistent icon box */
  height: 14px;
  line-height: 14px;
  font-size: 12px;            /* slightly smaller than label text */
}

/* When the menu just opened under the cursor, suppress hover highlight briefly */
.no-hover .menu-item:hover {
  background: transparent;
}

/* Ensure the parent submenu row acts as an anchor and has a small hover bridge */
.submenu {
  position: relative;
}
/* Hover bridge to prevent flicker while crossing into the submenu panel */
.submenu::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 100%;
  width: 8px;            /* extend hover area into the gap */
  background: transparent;
}

.submenu .submenu-panel {
  position: absolute;
  top: 0;
  left: 100%;            /* no gap; panel touches the parent item */
}
</style>
