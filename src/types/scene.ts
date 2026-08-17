import type { DockMap } from "./host.js";
import type { ToastPosition } from "./placement.js";
import type { ToastStatus } from "./status.js";
import type { ToastAction, ToastContent, ToasterLabels } from "./toast.js";

export interface SceneOptions {
  character: HTMLElement;
  lane: HTMLElement;
  stage: HTMLElement;
  docks: DockMap;
  labels?: ToasterLabels;
  ready?: Promise<void>;
}

export interface EnqueueInput {
  title: string;
  message: string;
  content?: ToastContent;
  actions: ToastAction[];
  status: ToastStatus;
  position: ToastPosition;
  durationMs: number;
}

export interface Scene {
  enqueue(input: EnqueueInput): string;
  dismiss(id: string): void;
  dismissAll(): void;
}
