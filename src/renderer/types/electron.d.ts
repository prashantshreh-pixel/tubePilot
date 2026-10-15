import { tubePilotAPI } from '../../preload';

declare global {
  interface Window {
    tubePilotAPI: typeof tubePilotAPI;
  }
}

export {};
