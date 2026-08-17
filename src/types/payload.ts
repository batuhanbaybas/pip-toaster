import type { ToastPosition } from "./placement.js";
import type { ToastStatus } from "./status.js";
import type { ToastAction, ToastContent } from "./toast.js";

export interface RuntimeConfig {
  position: ToastPosition;
  duration: number;
  zIndex: number;
}

export interface NormalizedToast {
  title: string;
  message: string;
  content?: ToastContent;
  actions: ToastAction[];
  status: ToastStatus;
  position: ToastPosition;
  durationMs: number;
}

export const DEFAULTS: RuntimeConfig = {
  position: "bottom-right",
  duration: 5000,
  zIndex: 2147483000,
};
