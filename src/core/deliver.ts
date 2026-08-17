/**
 * Pull a toast onto the dock and park it. Dismiss is the inverse (dismiss.ts).
 */

import { getProfile } from "../helper/effort.js";
import { measureTravel, offsetAlong } from "../helper/geometry.js";
import { animatePos, prefersReducedMotion, wait } from "../helper/motion.js";
import { getPlacement, insertSlot, revealDockSlot, withMode } from "../helper/placement.js";
import type { EffortProfile } from "../types/effort.js";
import type { DeliverJob, ParkedToast, PlayContext } from "../types/jobs.js";
import type { ActingLayout, Placement } from "../types/placement.js";
import { playPull } from "./haul.js";

function settleToast(
  ctx: PlayContext,
  job: DeliverJob,
  wrap: HTMLElement,
  spacer: HTMLElement,
  profile: EffortProfile,
  placement: Placement,
  waitLayout: ActingLayout | null,
): void {
  const { actor, character, docks, queue, paintCard, requestDismiss } = ctx;
  const parked = paintCard(job, profile.id, true);

  actor.clearMates();

  if (waitLayout) {
    const slot = document.createElement("div");
    slot.className = "slot";
    slot.dataset.pipSide = waitLayout.pipSide;
    if (waitLayout.pipSide === "before") slot.append(character, parked);
    else slot.append(parked, character);
    spacer.replaceWith(slot);
    wrap.remove();
    actor.releaseWrap();
    queue.waitingOnId = job.id;
    actor.setCharacterState("read", profile.id, profile, waitLayout);
    character.style.setProperty("--lean", "0deg");
  } else {
    spacer.replaceWith(parked);
    wrap.remove();
    actor.parkCharacter();
    queue.waitingOnId = null;
  }

  revealDockSlot(docks[placement.id], placement);

  const toast: ParkedToast = {
    id: job.id,
    title: job.title,
    message: job.message,
    content: job.content,
    actions: job.actions,
    status: job.status,
    profile,
    placement,
    el: parked,
    durationMs: job.durationMs,
    timer: 0,
    closing: false,
  };
  queue.toasts.set(job.id, toast);

  if (queue.dismissInFlight) {
    requestDismiss(job.id);
    return;
  }

  if (toast.durationMs > 0) {
    toast.timer = window.setTimeout(() => {
      requestDismiss(job.id);
    }, toast.durationMs);
  }
}

export async function playDelivery(ctx: PlayContext, job: DeliverJob): Promise<void> {
  const { actor, stage, docks, queue, paintCard } = ctx;
  actor.setActingStatus(job.status);
  const placement = getPlacement(job.position);
  const profile = getProfile(job.title, job.message);
  const dock = docks[placement.id];
  const reduced = prefersReducedMotion();

  const card = paintCard(job, profile.id, false);

  const layout = withMode(placement, "pull");
  const wrap = actor.mountWrap(layout, card, profile);
  const spacer = insertSlot(dock, placement, Math.max(72, card.getBoundingClientRect().height));
  const travel = measureTravel({ stage, wrap, card, slot: spacer, from: layout.from });
  const grab = offsetAlong(travel.start, travel.end, 80);

  if (reduced) {
    actor.revealWrap(wrap, travel.end);
    const stay = job.durationMs === 0 && queue.jobs.length === 0 && !queue.dismissInFlight;
    settleToast(ctx, job, wrap, spacer, profile, placement, stay ? layout : null);
    return;
  }

  actor.setCharacterState("enter", profile.id, profile, layout);
  actor.revealWrap(wrap, travel.start);
  await animatePos(wrap, travel.start, grab, profile.enterMs);
  actor.setCharacterState("grab", profile.id, profile, layout);
  await wait(profile.grabMs);

  await playPull(actor, {
    wrap,
    from: grab,
    to: travel.end,
    profile,
    placement: layout,
    stateWhenMoving: layout.axis === "y" ? "push" : "pull",
  });

  actor.setCharacterState("release", profile.id, profile, layout);
  await wait(profile.releaseMs);

  const stay = job.durationMs === 0 && queue.jobs.length === 0 && !queue.dismissInFlight;

  if (!stay) {
    if (profile.exhaustedMs > 0) {
      actor.setCharacterState("exhausted", profile.id, profile, layout);
      await wait(profile.exhaustedMs);
    }
    actor.setCharacterState("exit", profile.id, profile, layout);
    await wait(profile.exitMs);
  }

  settleToast(ctx, job, wrap, spacer, profile, placement, stay ? layout : null);
}
