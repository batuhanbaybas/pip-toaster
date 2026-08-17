/**
 * Job queue for toast delivery. Pose/DOM live in actor.ts;
 * pull-in / push-out live in deliver.ts and dismiss.ts.
 */

import { wait } from "../helper/motion.js";
import { parsePosition } from "../helper/placement.js";
import { parseStatus } from "../helper/status.js";
import type { EffortId } from "../types/effort.js";
import type { CardModel, Job, QueueState } from "../types/jobs.js";
import type { Scene, SceneOptions } from "../types/scene.js";
import { DEFAULT_LABELS } from "../types/toast.js";
import { createActor } from "./actor.js";
import { buildCard } from "./note.js";
import { createPlayback } from "./playback.js";

export function createScene({
  character,
  lane,
  stage,
  docks,
  labels,
  ready,
}: SceneOptions): Scene {
  const copy = { ...DEFAULT_LABELS, ...labels };
  const actor = createActor(character, lane);
  const queue: QueueState = {
    jobs: [],
    toasts: new Map(),
    dismissInFlight: false,
    waitingOnId: null,
  };
  let busy = false;
  let seq = 0;

  function requestDismiss(id: string): void {
    const toast = queue.toasts.get(id);
    if (!toast || toast.closing) return;
    toast.closing = true;
    window.clearTimeout(toast.timer);
    queue.jobs.push({ kind: "dismiss", id });
    pump();
  }

  function paintCard(item: CardModel, effort: EffortId, closable: boolean): HTMLElement {
    return buildCard({
      id: item.id,
      title: item.title,
      message: item.message,
      effort,
      closable,
      labels: { close: copy.close },
      content: item.content,
      actions: item.actions,
      status: item.status,
      onDismiss: requestDismiss,
    });
  }

  const playback = createPlayback({
    actor,
    character,
    stage,
    docks,
    queue,
    paintCard,
    requestDismiss,
  });

  async function drain(): Promise<void> {
    busy = true;
    if (ready) await ready;
    while (queue.jobs.length > 0) {
      const next = queue.jobs.shift();
      if (!next) break;
      const fromWait = next.kind === "dismiss" && queue.waitingOnId === next.id;
      if (queue.waitingOnId) {
        if (fromWait) {
          character.style.setProperty("--lean", "0deg");
          actor.setCharacterState("release", (character.dataset.effort as EffortId) || "normal");
          await wait(180);
        } else {
          await playback.closeBook();
        }
      }
      if (next.kind === "deliver") await playback.playDelivery(next);
      else await playback.playDismiss(next, fromWait);
    }
    busy = false;
    if (queue.toasts.size === 0) queue.dismissInFlight = false;
  }

  function pump(): void {
    if (!busy) void drain();
  }

  stage.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const close = target.closest(".note__close");
    if (!close) return;
    const note = close.closest(".note");
    if (note instanceof HTMLElement && note.dataset.id) requestDismiss(note.dataset.id);
  });

  return {
    enqueue({ title, message, content, actions, status, position, durationMs }) {
      queue.dismissInFlight = false;
      const id = `toast-${++seq}`;
      const job: Job = {
        kind: "deliver",
        id,
        title: title.trim(),
        message: message.trim(),
        content,
        actions,
        status: parseStatus(status),
        position: parsePosition(position),
        durationMs: Number.isFinite(durationMs) ? Math.max(0, durationMs) : 5000,
      };
      queue.jobs.push(job);
      pump();
      return id;
    },
    dismiss: requestDismiss,
    dismissAll() {
      queue.dismissInFlight = true;
      for (let i = queue.jobs.length - 1; i >= 0; i -= 1) {
        if (queue.jobs[i]?.kind === "deliver") queue.jobs.splice(i, 1);
      }
      for (const id of [...queue.toasts.keys()]) requestDismiss(id);
    },
  };
}
