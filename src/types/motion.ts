import type { Actor, CharacterState } from "./actor.js";
import type { EffortProfile } from "./effort.js";
import type { Point } from "./geometry.js";
import type { ActingLayout } from "./placement.js";

export interface PullMove {
  wrap: HTMLElement;
  from: Point;
  to: Point;
  profile: EffortProfile;
  placement: ActingLayout;
  stateWhenMoving: CharacterState;
  leanSign?: number;
}

export interface AnimatePullOptions {
  duration: number;
  onFrame: (t: number) => void;
}
