/**
 * Push a parked toast off stage, and drop a “reading” pose before the next job.
 */

import { measureTravel } from "../helper/geometry.js";
import { prefersReducedMotion, wait } from "../helper/motion.js";
import { withMode } from "../helper/placement.js";
import type { EffortId } from "../types/effort.js";
import type { DismissJob, PlayContext } from "../types/jobs.js";
import { playPull } from "./haul.js";

export async function playDismiss(
  ctx: PlayContext,
  job: DismissJob,
  fromWait = false,
): Promise<void> {
  const { actor, stage, queue, paintCard } = ctx;
  const toast = queue.toasts.get(job.id);
  if (!toast?.el) {
    queue.toasts.delete(job.id);
    return;
  }

  window.clearTimeout(toast.timer);
  toast.closing = true;
  queue.waitingOnId = null;
  actor.setActingStatus(toast.status);

  const { profile, placement, el } = toast;
  const reduced = prefersReducedMotion();
  const slot = el.closest(".slot");

  const spacer = document.createElement("div");
  spacer.className = "note note--spacer";
  spacer.style.height = `${el.offsetHeight}px`;

  const card = paintCard(toast, profile.id, false);
  const layout = withMode(placement, "push");
  const wrap = actor.mountWrap(layout, card, profile);

  if (slot instanceof HTMLElement) slot.replaceWith(spacer);
  else el.replaceWith(spacer);

  const travel = measureTravel({ stage, wrap, card, slot: spacer, from: layout.from });

  if (reduced) {
    wrap.remove();
    spacer.remove();
    actor.parkCharacter();
    queue.toasts.delete(job.id);
    return;
  }

  if (fromWait) {
    actor.setCharacterState("grab", profile.id, profile, layout);
    actor.revealWrap(wrap, travel.end);
    await wait(profile.grabMs);
  } else {
    actor.setCharacterState("enter", profile.id, profile, layout);
    actor.revealWrap(wrap, travel.end);
    await wait(Math.max(280, profile.enterMs * 0.65));
    actor.setCharacterState("grab", profile.id, profile, layout);
    await wait(profile.grabMs);
  }

  await playPull(actor, {
    wrap,
    from: travel.end,
    to: travel.start,
    profile,
    placement: layout,
    stateWhenMoving: "push",
    leanSign: layout.leanSign,
  });

  actor.setCharacterState("exit", profile.id, profile, layout);
  await wait(profile.exitMs);

  wrap.remove();
  spacer.remove();
  actor.parkCharacter();
  queue.toasts.delete(job.id);
}

export async function closeBook(ctx: PlayContext): Promise<void> {
  const { actor, character, queue } = ctx;
  if (!queue.waitingOnId) return;
  character.style.setProperty("--lean", "0deg");
  actor.setCharacterState("release", (character.dataset.effort as EffortId) || "normal");
  await wait(220);
  actor.detachFromSlot();
  actor.hideCharacter();
  queue.waitingOnId = null;
}
