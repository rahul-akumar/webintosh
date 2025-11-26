// Menu Templates Resolver (Phase 2)
// Convention-based menu discovery: apps export createMenuTemplate() from menu.ts
import type { MenuTemplate } from "../../../types/menu";
import { createSystemMenuTemplate } from "./systemMenu";
import { createDockMenuForApp } from "./dockMenu";

// Legacy imports (will be removed as apps migrate to convention)
import { createFinderMenuTemplate } from "../../apps/Finder/finderMenu";
import { createTextEditMenuTemplate } from "../../apps/TextEdit/textEditMenu";
import { createTypingTestMenuTemplate } from "../../apps/TypingTest/typingTestMenu";
import { createYahooMessengerMenuTemplate } from "../../apps/YahooMessenger/yahooMessengerMenu";
import { createWhiteNoiseMenuTemplate } from "../../apps/WhiteNoise/whiteNoiseMenu";
import { createChessMenuTemplate } from "../../apps/Chess/chessMenu";

// Convention-based menu discovery using Vite's import.meta.glob
// Apps that follow convention: export createMenuTemplate() from menu.ts
type MenuModule = { createMenuTemplate: () => MenuTemplate };

const menuModules = import.meta.glob<MenuModule>(
  "../../apps/*/menu.ts",
  { eager: true }
);

// Build app ID to menu template map from discovered modules
const conventionMenus = new Map<string, () => MenuTemplate>();

for (const [path, module] of Object.entries(menuModules)) {
  if (module.createMenuTemplate) {
    // Extract app folder name from path: ../../apps/{folder}/menu.ts
    const match = path.match(/\/apps\/([^/]+)\/menu\.ts$/);
    if (match) {
      // Normalize to lowercase for consistent lookup
      const appId = match[1]!.toLowerCase().replace(/-/g, "");
      conventionMenus.set(appId, module.createMenuTemplate);
    }
  }
}

// Legacy menu map for apps not yet migrated to convention
const legacyMenus: Record<string, () => MenuTemplate> = {
  finder: createFinderMenuTemplate,
  textedit: createTextEditMenuTemplate,
  typingtest: createTypingTestMenuTemplate,
  yahoomessenger: createYahooMessengerMenuTemplate,
  whitenoise: createWhiteNoiseMenuTemplate,
  chess: createChessMenuTemplate,
};

/**
 * Return the system (desktop) menu template.
 */
export function getSystemMenuTemplate(): MenuTemplate {
  return createSystemMenuTemplate();
}

/**
 * Resolve an app-specific menu template by appId.
 * Uses convention-based discovery first, then falls back to legacy imports,
 * and finally to a system-like template with custom title.
 */
export function getAppMenuTemplate(
  appId: string,
  appTitle?: string
): MenuTemplate {
  const normalizedId = (appId || "").toLowerCase().replace(/-/g, "");

  // Special case: About app shows the desktop menubar
  if (normalizedId === "about") {
    return createSystemMenuTemplate();
  }

  // Try convention-based menu first (apps with menu.ts exporting createMenuTemplate)
  const conventionFactory = conventionMenus.get(normalizedId);
  if (conventionFactory) {
    return conventionFactory();
  }

  // Fall back to legacy imports
  const legacyFactory = legacyMenus[normalizedId];
  if (legacyFactory) {
    return legacyFactory();
  }

  // Default: system menu with custom title
  const base = createSystemMenuTemplate();
  return {
    ...base,
    id: `app-${appId || "unknown"}`,
    title: appTitle ?? "App",
  };
}

/**
 * Get set of app IDs with custom menus (convention + legacy).
 */
export function getKnownMenuApps(): Set<string> {
  const apps = new Set<string>(conventionMenus.keys());
  for (const id of Object.keys(legacyMenus)) {
    apps.add(id);
  }
  return apps;
}

// Backward compatibility export
export const KnownMenuApps = getKnownMenuApps();

// Re-export Dock context menu builder
export { createDockMenuForApp };
