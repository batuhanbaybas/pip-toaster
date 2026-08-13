import type { EffortId } from "./effort.js";
import type { ToastPosition } from "./placement.js";
import type { ToastTheme } from "./theme.js";

export type { EffortId, ToastPosition, ToastTheme };

export interface ToastPayload {
  title?: string;
  body?: string;
  /** Alias of `title`. */
  message?: string;
  /** Alias of `body`. */
  description?: string;
  position?: ToastPosition;
  /** Auto-dismiss in milliseconds. `0` stays until dismissed. */
  duration?: number;
}

export interface ToasterLabels {
  kicker?: string;
  close?: string;
}

export interface ToasterOptions {
  position?: ToastPosition;
  duration?: number;
  zIndex?: number;
  /** Mount inside this element (`position: relative`). Defaults to `document.body`. */
  target?: HTMLElement | null;
  labels?: ToasterLabels;
  /** Pip + card + dock look. Also settable later via `configure({ theme })`. */
  theme?: ToastTheme;
}

export type ToasterConfig = Pick<ToasterOptions, "position" | "duration" | "zIndex" | "theme">;

export interface Toaster {
  (input: string | ToastPayload): string;
  configure(options: ToasterConfig): void;
  dismiss(id: string): void;
  dismissAll(): void;
  destroy(): void;
}
