/**
 * Pip’s on-stage presence: crew and the delivery wrap.
 * Dataset pose lives in pose.ts; carry animation in haul.ts.
 */

import type { EffortId, EffortProfile } from "../helper/effort.js";
import type { Point } from "../helper/geometry.js";
import { setWrapPos } from "../helper/motion.js";
import { crewSize, type ActingLayout } from "../helper/placement.js";
import { applyPose, type CharacterState } from "./pose.js";
import type { ToastStatus } from "../helper/status.js";

export type { CharacterState };

export interface Actor {
  crewOf(wrap: HTMLElement | null): HTMLElement[];
  setActingStatus(status: ToastStatus): void;
  setCharacterState(
    state: CharacterState,
    effort: EffortId,
    profile?: EffortProfile,
    layout?: ActingLayout,
  ): void;
  hideCharacter(): void;
  clearMates(): void;
  mountWrap(layout: ActingLayout, card: HTMLElement, profile: EffortProfile): HTMLElement;
  revealWrap(wrap: HTMLElement, point: Point): void;
  /** Wrap is gone; Pip stays on stage (e.g. reading in a parked slot). */
  releaseWrap(): void;
  parkCharacter(): void;
  detachFromSlot(): void;
}

export function createActor(character: HTMLElement, lane: HTMLElement): Actor {
  let activeWrap: HTMLElement | null = null;
  let actingStatus: ToastStatus = "default";

  function crewOf(wrap: HTMLElement | null): HTMLElement[] {
    if (!wrap) return [character];
    const pips = [...wrap.querySelectorAll<HTMLElement>(".character")];
    return pips.length > 0 ? pips : [character];
  }

  function setCharacterState(
    state: CharacterState,
    effort: EffortId,
    profile?: EffortProfile,
    layout?: ActingLayout,
  ): void {
    applyPose(crewOf(activeWrap), state, effort, actingStatus, profile, layout);
  }

  function hideCharacter(): void {
    character.dataset.state = "hidden";
    character.dataset.push = "";
    character.style.removeProperty("--lean");
  }

  function mountWrap(layout: ActingLayout, card: HTMLElement, profile: EffortProfile): HTMLElement {
    const wrap = document.createElement("div");
    const crew = crewSize(layout, profile.id);
    wrap.className = "delivery";
    wrap.dataset.effort = card.dataset.effort;
    wrap.dataset.pipSide = layout.pipSide;
    wrap.dataset.axis = layout.axis ?? "x";
    wrap.dataset.dir = layout.direction ?? layout.from;
    wrap.dataset.edge = layout.from;
    wrap.dataset.crew = String(crew);
    wrap.dataset.status = card.dataset.status ?? "default";
    wrap.style.visibility = "hidden";

    if (crew === 2) {
      const mate = character.cloneNode(true) as HTMLElement;
      mate.removeAttribute("id");
      mate.dataset.role = "mate";
      wrap.append(character, card, mate);
    } else if (layout.pipSide === "before") {
      wrap.append(character, card);
    } else {
      wrap.append(card, character);
    }

    lane.append(wrap);
    activeWrap = wrap;
    return wrap;
  }

  function revealWrap(wrap: HTMLElement, point: Point): void {
    setWrapPos(wrap, point);
    wrap.style.visibility = "";
  }

  function releaseWrap(): void {
    activeWrap = null;
  }

  function clearMates(): void {
    lane.querySelectorAll('.character[data-role="mate"]').forEach((el) => el.remove());
  }

  function parkCharacter(): void {
    clearMates();
    lane.append(character);
    hideCharacter();
    activeWrap = null;
  }

  function detachFromSlot(): void {
    const slot = character.closest(".slot");
    lane.append(character);
    if (slot instanceof HTMLElement) {
      const note = slot.querySelector(".note");
      if (note) slot.replaceWith(note);
      else slot.remove();
    }
  }

  return {
    crewOf,
    setActingStatus(status) {
      actingStatus = status;
    },
    setCharacterState,
    hideCharacter,
    clearMates,
    mountWrap,
    revealWrap,
    releaseWrap,
    parkCharacter,
    detachFromSlot,
  };
}
