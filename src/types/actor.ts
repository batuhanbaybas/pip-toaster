import type { EffortId, EffortProfile } from "./effort.js";
import type { Point } from "./geometry.js";
import type { ActingLayout } from "./placement.js";
import type { ToastStatus } from "./status.js";

export const CHARACTER_STATES = [
  "hidden",
  "enter",
  "grab",
  "pull",
  "push",
  "strain",
  "slip",
  "release",
  "exhausted",
  "exit",
  "read",
] as const;

export type CharacterState = (typeof CHARACTER_STATES)[number];

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
