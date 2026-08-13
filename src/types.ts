import type { EffortId } from "./effort.js";
import type { ToastPosition } from "./placement.js";
import type { CardColors } from "./card.js";
import type { ToastStatus } from "./status.js";

export type { CardColors, EffortId, ToastPosition, ToastStatus };

export interface ToastActionContext {
  id: string;
  dismiss: () => void;
}

export interface ToastAction {
  label: string;
  onClick?: (ctx: ToastActionContext) => void;
  /** Dismiss after click. Default `true`. */
  dismiss?: boolean;
  variant?: "primary" | "ghost";
}

/**
 * Extra toast body. Prefer a factory if the node has listeners — the card is
 * rebuilt for delivery, parking, and dismiss. A live `Node` is moved onto the
 * parked card (clicks work after Pip drops it) and cloned for the carry.
 */
export type ToastContent =
  | Node
  | string
  | Array<Node | string>
  | ((ctx: ToastActionContext) => Node | string | Array<Node | string> | null | undefined);

export interface ToastPayload {
  title?: string;
  /** Main copy. */
  message?: string;
  /** Alias of `message`. */
  body?: string;
  /** Alias of `message`. */
  description?: string;
  /** Arbitrary nodes (buttons, links, custom widgets). */
  content?: ToastContent;
  /** Convenience footer buttons. */
  action?: ToastAction | ToastAction[];
  /** Visual tone. Pip’s shirt and the card accent follow this. */
  status?: ToastStatus;
  position?: ToastPosition;
  /** Auto-dismiss in milliseconds. `0` stays until dismissed. */
  duration?: number;
}

export interface ToasterLabels {
  kicker?: string;
  close?: string;
  info?: string;
  success?: string;
  warning?: string;
  error?: string;
}

export interface ToasterOptions {
  position?: ToastPosition;
  duration?: number;
  zIndex?: number;
  /** Mount inside this element (`position: relative`). Defaults to `document.body`. */
  target?: HTMLElement | null;
  labels?: ToasterLabels;
  /** Toast card colors. Pip’s shirt follows `status`, not these. */
  card?: CardColors;
}

export type ToasterConfig = Pick<ToasterOptions, "position" | "duration" | "zIndex" | "card">;

export interface Toaster {
  (input: string | ToastPayload): string;
  info(input: string | ToastPayload): string;
  success(input: string | ToastPayload): string;
  warning(input: string | ToastPayload): string;
  error(input: string | ToastPayload): string;
  configure(options: ToasterConfig): void;
  dismiss(id: string): void;
  dismissAll(): void;
  destroy(): void;
}
