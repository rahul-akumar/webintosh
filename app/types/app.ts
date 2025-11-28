import type { OSWindowRect } from './os';

export type AppId = string;

export interface AppDescriptor {
  id: AppId;
  title: string;
  icon?: string;  // Path to SVG icon (e.g., '/icons/system/finder.svg')
  emoji?: string; // Fallback emoji if no icon provided
  kind?: 'system' | 'app';
  defaultRect?: OSWindowRect;
  showOnDesktop?: boolean;  // defaults to true if not specified
}
