/**
 * Wires deliver / dismiss / haul into the API scene.ts pumps.
 * Sequence logic lives in those modules, not here.
 */

import { playDelivery } from "./deliver.js";
import { closeBook, playDismiss } from "./dismiss.js";
import type { DeliverJob, DismissJob, PlayContext } from "./jobs.js";

export interface Playback {
  playDelivery(job: DeliverJob): Promise<void>;
  playDismiss(job: DismissJob, fromWait?: boolean): Promise<void>;
  closeBook(): Promise<void>;
}

export function createPlayback(ctx: PlayContext): Playback {
  return {
    playDelivery: (job) => playDelivery(ctx, job),
    playDismiss: (job, fromWait) => playDismiss(ctx, job, fromWait),
    closeBook: () => closeBook(ctx),
  };
}
