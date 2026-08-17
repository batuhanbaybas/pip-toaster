import type { Actor } from "./actor.js";
import type { EffortId, EffortProfile } from "./effort.js";
import type { DockMap } from "./host.js";
import type { Placement, ToastPosition } from "./placement.js";
import type { ToastStatus } from "./status.js";
import type { ToastAction, ToastContent } from "./toast.js";

export interface DeliverJob {
  kind: "deliver";
  id: string;
  title: string;
  message: string;
  content?: ToastContent;
  actions: ToastAction[];
  status: ToastStatus;
  position: ToastPosition;
  durationMs: number;
}

export interface DismissJob {
  kind: "dismiss";
  id: string;
}

export type Job = DeliverJob | DismissJob;

export interface ParkedToast {
  id: string;
  title: string;
  message: string;
  content?: ToastContent;
  actions: ToastAction[];
  status: ToastStatus;
  profile: EffortProfile;
  placement: Placement;
  el: HTMLElement;
  durationMs: number;
  timer: number;
  closing: boolean;
}

export interface QueueState {
  jobs: Job[];
  toasts: Map<string, ParkedToast>;
  dismissInFlight: boolean;
  waitingOnId: string | null;
}

export interface CardModel {
  id: string;
  title: string;
  message: string;
  content?: ToastContent;
  actions: ToastAction[];
  status: ToastStatus;
}

export interface PlayContext {
  actor: Actor;
  character: HTMLElement;
  stage: HTMLElement;
  docks: DockMap;
  queue: QueueState;
  paintCard: (item: CardModel, effort: EffortId, closable: boolean) => HTMLElement;
  requestDismiss: (id: string) => void;
}

export interface Playback {
  playDelivery(job: DeliverJob): Promise<void>;
  playDismiss(job: DismissJob, fromWait?: boolean): Promise<void>;
  closeBook(): Promise<void>;
}
