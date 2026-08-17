import type { CardColors } from "./card.js";
import type { ToastPosition } from "./placement.js";

export type DockMap = Record<ToastPosition, HTMLElement>;

export interface MountHostOptions {
  target?: HTMLElement | null;
  zIndex?: number;
  card?: CardColors;
}

export interface ToastHost {
  host: HTMLElement;
  root: HTMLElement;
  stage: HTMLElement;
  lane: HTMLElement;
  character: HTMLElement;
  docks: DockMap;
  ready: Promise<void>;
  setZIndex(value: number): void;
  setCardColors(colors: CardColors): void;
  destroy(): void;
}
