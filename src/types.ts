import type { EffortId } from "./effort.js";
import type { ToastPosition } from "./placement.js";

export type { EffortId, ToastPosition };

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
}

export type ToasterConfig = Pick<ToasterOptions, "position" | "duration" | "zIndex">;

export interface Toaster {
  (input: string | ToastPayload): string;
  configure(options: ToasterConfig): void;
  dismiss(id: string): void;
  dismissAll(): void;
  destroy(): void;
}
