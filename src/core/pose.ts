/**
 * Dataset/CSS pose for one or more Pips. Wrap mount/park stays in actor.ts.
 */

import type { EffortId, EffortProfile } from "../helper/effort.js";
import type { ActingLayout } from "../helper/placement.js";
import type { ToastStatus } from "../helper/status.js";

export type CharacterState =
  | "hidden"
  | "enter"
  | "grab"
  | "pull"
  | "push"
  | "strain"
  | "slip"
  | "release"
  | "exhausted"
  | "exit"
  | "read";

export function applyPose(
  crew: HTMLElement[],
  state: CharacterState,
  effort: EffortId,
  status: ToastStatus,
  profile?: EffortProfile,
  layout?: ActingLayout,
): void {
  const dual = crew.length > 1;
  crew.forEach((pip, index) => {
    pip.dataset.state = state;
    pip.dataset.effort = effort;
    pip.dataset.status = status;
    pip.dataset.bothHands = String(
      state !== "read" &&
        (dual || layout?.axis === "y" || layout?.mode === "push" || Boolean(profile?.bothHands)),
    );
    if (layout) {
      pip.dataset.axis = layout.axis ?? "x";
      if (dual) {
        pip.dataset.face = index === 0 ? "1" : "-1";
        pip.dataset.push = index === 0 ? "right" : "left";
      } else if (layout.axis === "y") {
        pip.dataset.face = "1";
        pip.dataset.push = "right";
      } else {
        pip.dataset.face = layout.face;
        pip.dataset.push = layout.mode === "push" ? layout.direction : "";
      }
    }
    if (profile) pip.style.setProperty("--walk-ms", `${profile.walkMs}ms`);
  });
}
