/**
 * Wires deliver / dismiss / haul into the API scene.ts pumps.
 * Sequence logic lives in those modules, not here.
 */

import type { Playback, PlayContext } from "../types/jobs.js";
import { playDelivery } from "./deliver.js";
import { closeBook, playDismiss } from "./dismiss.js";

export function createPlayback(ctx: PlayContext): Playback {
  return {
    playDelivery: (job) => playDelivery(ctx, job),
    playDismiss: (job, fromWait) => playDismiss(ctx, job, fromWait),
    closeBook: () => closeBook(ctx),
  };
}
