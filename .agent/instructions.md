# Webintosh Development Instructions for AI Agents

## Project Overview
Webintosh is a web-based desktop environment that mimics macOS interface and behavior, built with Nuxt 4, Vue 3, TypeScript, and Tailwind CSS v4.

## Critical Implementation Guidelines

### 1. Component Structure

#### App Components in Folders
When creating app components that need to be in their own folder:
```
app/components/apps/AppName/index.vue  ✅ CORRECT
app/components/apps/AppName/AppName.vue  ❌ WRONG (causes double naming)
```

**Why:** Nuxt auto-imports components based on folder structure. Using `index.vue` prevents double naming like `AppsAppNameAppName`.

#### Component Registration in Window.vue
```vue
<!-- For app in folder with index.vue -->
<AppsAppName v-if="win.appId === 'appname'" />

<!-- Example -->
<AppsFinder v-if="win.appId === 'finder'" />
<AppsTextEdit v-if="win.appId === 'textedit'" />
<AppsAbout v-if="win.appId === 'about'" />
```

### 2. Tailwind CSS v4 Usage

#### In Scoped Styles
```vue
<style scoped>
@import "tailwindcss";  /* Required at the top */

.class-name {
  /* Use theme() function for Tailwind values */
  background: theme('colors.gray.100');
  padding: theme('spacing.4');
  font-size: theme('fontSize.sm');
  border-radius: theme('borderRadius.md');
}
</style>
```

#### Available Theme Functions
- **Colors:** `theme('colors.gray.500')`, `theme('colors.blue.500')`
- **Spacing:** `theme('spacing.4')` (1rem), `theme('spacing.2')` (0.5rem)
- **Font Sizes:** `theme('fontSize.sm')`, `theme('fontSize.xl')`
- **Font Weights:** `theme('fontWeight.medium')`, `theme('fontWeight.semibold')`
- **Border Radius:** `theme('borderRadius.md')`, `theme('borderRadius.lg')`
- **Opacity:** `theme('colors.white/50')` for 50% opacity

#### What DOESN'T Work
```css
/* These will cause errors in scoped styles */
@apply bg-gray-100;  /* ❌ @apply doesn't work in scoped styles */
theme(colors.gray.100)  /* ❌ Wrong syntax - needs quotes */
var(--color-gray-100)  /* ❌ CSS variables not available by default */
```

### 3. App Registration

Apps must be registered in `app/app.vue`:
```typescript
apps.registerApps([
  { 
    id: 'appname',  // lowercase, no spaces
    title: 'App Name',  // Display name
    emoji: '📱',  // Icon
    kind: 'app' | 'system',  // Type of app
    showOnDesktop: true | false,  // Show on desktop
    defaultRect: { x: 100, y: 80, width: 600, height: 400 }  // Default window size
  }
])
```

### 4. Window Rendering

In `app/components/os/Window.vue`, ensure the condition checks for both app types:
```vue
<template v-if="win.kind === 'app' || win.kind === 'system'">
```

### 5. Content Management

For app-specific content/configuration:
- **Option 1:** Embed directly in component (simple, works immediately)
- **Option 2:** Use composables in `app/composables/` (auto-imported by Nuxt)
- **Option 3:** JSON files need special handling (not recommended due to import issues)

Example composable:
```typescript
// app/composables/useAppContent.ts
export const useAppContent = () => {
  return {
    // Your content object
  }
}
```

### 6. Common Pitfalls & Solutions

#### Issue: Component not rendering
- **Check:** Component name in Window.vue matches auto-import name
- **Check:** App is registered in app.vue
- **Check:** Window kind matches the condition in Window.vue

#### Issue: Tailwind classes not working
- **Solution:** Add `@import "tailwindcss";` at top of `<style scoped>`
- **Solution:** Use `theme()` function with quotes: `theme('colors.gray.100')`
- **Solution:** Use RGB values as fallback: `rgb(243 244 246)` for gray-100

#### Issue: JSON imports failing
- **Solution:** Use composables or embed content directly in component

### 7. File Structure

```
app/
├── components/
│   ├── apps/
│   │   ├── Finder/
│   │   │   └── index.vue
│   │   ├── TextEdit/
│   │   │   └── index.vue
│   │   └── About/
│   │       └── index.vue
│   └── os/
│       ├── Window.vue
│       ├── Dock.vue
│       └── MenuBar.vue
├── composables/
│   └── useAppContent.ts
└── app.vue
```

### 8. Development Workflow

1. **Creating a new app:**
   - Create folder in `app/components/apps/AppName/`
   - Create `index.vue` in that folder
   - Register app in `app/app.vue`
   - Add component reference in `Window.vue`

2. **Styling with Tailwind:**
   - Always start with `@import "tailwindcss";`
   - Use `theme()` function for all Tailwind values
   - Test in browser to ensure styles apply

3. **Testing:**
   - Check browser console for errors
   - Verify component name in Vue DevTools
   - Ensure app appears in dock/desktop as configured

### 9. TypeScript Considerations

- Define proper types for window models in `types/os.ts`
- Use `defineOptions({ name: 'ComponentName' })` in script setup
- Import types explicitly when needed

### 10. Session Persistence

Apps should handle their own state persistence if needed:
```typescript
// Save to localStorage
localStorage.setItem('app-state', JSON.stringify(state))

// Restore from localStorage
const saved = localStorage.getItem('app-state')
if (saved) {
  state.value = JSON.parse(saved)
}
```

## Quick Reference

### Tailwind Color Values (for fallback)
- `gray-50`: rgb(249 250 251)
- `gray-100`: rgb(243 244 246)
- `gray-200`: rgb(229 231 235)
- `gray-300`: rgb(209 213 219)
- `gray-500`: rgb(107 114 128)
- `gray-900`: rgb(17 24 39)
- `blue-500`: rgb(59 130 246)

### Common Patterns
```vue
<!-- App Component Template -->
<template>
  <div class="app-container">
    <!-- Your app content -->
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineOptions({ name: 'AppName' })

// Your logic here
</script>

<style scoped>
@import "tailwindcss";

.app-container {
  display: flex;
  height: 100%;
  background: theme('colors.white');
}
</style>
```

## Notes for Future Development

- Nuxt 3 auto-imports components from `app/components/`
- Nuxt 3 auto-imports composables from `app/composables/`
- Tailwind CSS v4 uses different syntax than v3
- The project uses Pinia for state management
- Alt key is used for shortcuts to avoid browser conflicts

---

Last Updated: 2025-08-18
Version: 1.0.0
