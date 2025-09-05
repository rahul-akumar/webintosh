// Menu Templates Resolver (Phase 2)
import type { MenuTemplate } from "../../../../types/menu";
import { createSystemMenuTemplate } from "./systemMenu";
import { createFinderMenuTemplate } from "../../apps/Finder/finderMenu";
import { createTextEditMenuTemplate } from "../../apps/TextEdit/textEditMenu";
import { createTypingTestMenuTemplate } from "../../apps/TypingTest/typingTestMenu";
import { createKeyStationMenuTemplate } from "../../apps/KeyStation/keyStationMenu";
import { createYahooMessengerMenuTemplate } from "../../apps/YahooMessenger/yahooMessengerMenu";
import { createWhiteNoiseMenuTemplate } from "../../apps/WhiteNoise/whiteNoiseMenu";
import { createChessMenuTemplate } from "../../apps/Chess/chessMenu";
import { createDockMenuForApp } from "./dockMenu";

/**
 * Return the system (desktop) menu template.
 */
export function getSystemMenuTemplate(): MenuTemplate {
  return createSystemMenuTemplate();
}

/**
 * Resolve an app-specific menu template by appId.
 * Falls back to a system-like template with a custom title when unknown.
 */
export function getAppMenuTemplate(
  appId: string,
  appTitle?: string
): MenuTemplate {
  switch ((appId || "").toLowerCase()) {
    case "finder":
      return createFinderMenuTemplate();
    case "textedit":
      return createTextEditMenuTemplate();
    case "typingtest":
      return createTypingTestMenuTemplate();
    case "keystation":
      return createKeyStationMenuTemplate();
    case "yahoomessenger":
      return createYahooMessengerMenuTemplate();
    case "whitenoise":
      return createWhiteNoiseMenuTemplate();
    case "chess":
      return createChessMenuTemplate();
    case "about":
      // About app shows the desktop menubar itself
      return createSystemMenuTemplate();
    default: {
      const base = createSystemMenuTemplate();
      return {
        ...base,
        id: `app-${appId || "unknown"}`,
        title: appTitle ?? "App",
      };
    }
  }
}

/**
 * Optional helper: list of known app ids with first-party menus.
 */
export const KnownMenuApps = new Set<string>([
  "finder",
  "textedit",
  "typingtest",
  "keystation",
  "yahoomessenger",
  "whitenoise",
  "chess",
]);

// Re-export Dock context menu builder
export { createDockMenuForApp };
