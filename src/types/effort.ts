export const EFFORT = {
  LIGHT: "light",
  NORMAL: "normal",
  HEAVY: "heavy",
  MASSIVE: "massive",
} as const;

export type EffortId = (typeof EFFORT)[keyof typeof EFFORT];

export type CurveEase = "easeOut" | "easeInOut" | "linear";

export interface CurvePoint {
  t: number;
  v: number;
}

export interface EffortProfile {
  id: EffortId;
  label: string;
  duration: number;
  enterMs: number;
  grabMs: number;
  releaseMs: number;
  exhaustedMs: number;
  exitMs: number;
  leanMax: number;
  walkMs: number;
  bothHands: boolean;
  curve: readonly CurvePoint[];
  ease: CurveEase;
}
