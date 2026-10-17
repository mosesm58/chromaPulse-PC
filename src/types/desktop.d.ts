export {};

declare global {
  interface Window {
    chromaDesktop?: {
      minimizeToTray: () => void;
      quit: () => void;
    };
  }
}
