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
