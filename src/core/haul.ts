/**
 * Shared carry: move the wrap along a path while Pip leans, strains, or slips.
 * Used by both pull-in (deliver) and push-out (dismiss).
 */

import { lerpPoint } from "../helper/geometry.js";
import { animatePull, clamp, pullSlope, sampleCurve, setWrapPos } from "../helper/motion.js";
import type { Actor } from "../types/actor.js";
import type { PullMove } from "../types/motion.js";

export async function playPull(actor: Actor, move: PullMove): Promise<void> {
  const sign = move.leanSign ?? move.placement.leanSign;
  const { wrap, from, to, profile, placement, stateWhenMoving } = move;

  await animatePull({
    duration: profile.duration,
    onFrame(t) {
      const progress = sampleCurve(profile, t);
      const slope = pullSlope(profile, t);
      setWrapPos(wrap, lerpPoint(from, to, clamp(progress, 0, 1.12)));

      const hard = profile.id === "heavy" || profile.id === "massive";
      const slipping = hard && slope < -0.3;
      const resisting = hard && slope < 0.4;
      const lean = slipping
        ? profile.leanMax
        : resisting
          ? profile.leanMax * 0.85
          : Math.min(profile.leanMax, 6 + Math.max(0, slope) * 8);

      const crew = actor.crewOf(wrap);
      const axisScale = placement.axis === "y" ? 0.35 : 1;
      crew.forEach((pip, index) => {
        const dir = crew.length > 1 ? (index === 0 ? 1 : -1) : sign;
        pip.style.setProperty("--lean", `${dir * lean * axisScale}deg`);
      });

      if (slipping) actor.setCharacterState("slip", profile.id, profile, placement);
      else if (resisting && t > 0.08 && t < 0.95) {
        actor.setCharacterState("strain", profile.id, profile, placement);
      } else {
        actor.setCharacterState(stateWhenMoving, profile.id, profile, placement);
      }
    },
  });

  setWrapPos(wrap, to);
  actor.crewOf(wrap).forEach((pip) => {
    pip.style.setProperty("--lean", "0deg");
  });
}
