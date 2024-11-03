/// <reference types="@qwikdev/astro/types" />

interface ViewerState {
  transform: {
    x: number;
    y: number;
    scale: number;
  };
  drag: {
    active: boolean;
    start: { x: number; y: number };
  };
  loading: boolean;
  error: string;
}

declare global {
  interface Window {
    fs: {
      readFile(
        path: string,
        options?: { encoding?: string }
      ): Promise<Uint8Array | string>;
    };
  }
}
