import type { OSWindowRect } from './os';

export type AppId = string;

export interface AppDescriptor {
  id: AppId;
  title: string;
  emoji?: string;
  kind?: 'system' | 'app';
  defaultRect?: OSWindowRect;
  showOnDesktop?: boolean;  // defaults to true if not specified
}

export interface LaunchOptions {
  reuseExisting?: boolean;
  initialRect?: OSWindowRect;
}