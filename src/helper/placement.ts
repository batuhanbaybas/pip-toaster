/**
 * Toaster placement. Left/right: Pip stands beside the card.
 * Top/bottom: same flanking carry, sliding on Y — two Pips when huge.
 * Travel math lives in geometry.ts.
 */

import type { EffortId } from "./effort.js";

export const POSITIONS = [
  "top-left",
  "top-center",
  "top-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
] as const;

export type ToastPosition = (typeof POSITIONS)[number];

export type Axis = "x" | "y";
export type PipSide = "before" | "after";
export type Edge = "top" | "bottom" | "left" | "right";
export type Face = "1" | "-1";
export type Vertical = "top" | "bottom";
export type Horizontal = "left" | "center" | "right";

export interface Pose {
  from: Edge;
  axis: Axis;
  pipSide: PipSide;
  direction: string;
  face: Face;
  leanSign: number;
}

export interface Placement {
  id: ToastPosition;
  vertical: Vertical;
  horizontal: Horizontal;
  from: Edge;
  pull: Pose;
  push: Pose;
}

export type ActingLayout = Placement & Pose & { mode: "pull" | "push" };

export function parsePosition(value: unknown): ToastPosition {
  return typeof value === "string" && (POSITIONS as readonly string[]).includes(value)
    ? (value as ToastPosition)
    : "bottom-right";
}

export function getPlacement(position: unknown): Placement {
  const id = parsePosition(position);
  const [vertical, horizontal] = id.split("-") as [Vertical, Horizontal];
  const edge: Edge = horizontal === "center" ? vertical : horizontal;
  const verticalEnter = horizontal === "center";

  return {
    id,
    vertical,
    horizontal,
    from: edge,
    pull: verticalEnter
      ? {
          from: edge,
          axis: "y",
          pipSide: "before",
          direction: "right",
          face: "1",
          leanSign: 1,
        }
      : {
          from: edge,
          axis: "x",
          pipSide: horizontal === "left" ? "after" : "before",
          direction: edge,
          face: horizontal === "left" ? "-1" : "1",
          leanSign: horizontal === "left" ? 1 : -1,
        },
    push: verticalEnter
      ? {
          from: edge,
          axis: "y",
          pipSide: "before",
          direction: "right",
          face: "1",
          leanSign: 1,
        }
      : {
          from: edge,
          direction: edge,
          axis: "x",
          pipSide: edge === "left" ? "after" : "before",
          face: edge === "left" ? "-1" : "1",
          leanSign: edge === "right" ? 1 : -1,
        },
  };
}

/** Vertical travel still flanks the card so Pip stays on-screen. Huge cards get two Pips. */
export function crewSize(layout: Pick<Pose, "axis">, effortId: EffortId): 1 | 2 {
  if (layout.axis !== "y") return 1;
  return effortId === "heavy" || effortId === "massive" ? 2 : 1;
}

/** Merge pull or push fields onto the placement for a single acting layout. */
export function withMode(placement: Placement, mode: "pull" | "push"): ActingLayout {
  const pose = mode === "push" ? placement.push : placement.pull;
  return { ...placement, ...pose, mode };
}

export function revealDockSlot(_dock: HTMLElement, _placement: Placement): void {}

export function insertSlot(dock: HTMLElement, placement: Placement, height: number): HTMLElement {
  const spacer = document.createElement("div");
  spacer.className = "note note--spacer";
  spacer.style.height = `${Math.max(72, height)}px`;
  if (placement.vertical === "top") dock.prepend(spacer);
  else dock.append(spacer);
  revealDockSlot(dock, placement);
  return spacer;
}
