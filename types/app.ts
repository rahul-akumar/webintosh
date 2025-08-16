import type { OSWindowRect } from './os';

export type AppId = string;

export interface AppDescriptor {
  id: AppId;
  title: string;
  emoji?: string;
  kind?: 'system' | 'app';
  defaultRect?: OSWindowRect;
}

export interface LaunchOptions {
  reuseExisting?: boolean;
  initialRect?: OSWindowRect;
}