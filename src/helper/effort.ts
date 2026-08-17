/**
 * Notification "weight" is derived from content length.
 * Character behavior is a view of this weight — keep the mapping here,
 * not in animation code. Curve sampling lives in motion.ts.
 */

import { EFFORT, type EffortId, type EffortProfile } from "../types/effort.js";

const THRESHOLDS: readonly { max: number; id: EffortId }[] = [
  { max: 42, id: EFFORT.LIGHT },
  { max: 118, id: EFFORT.NORMAL },
  { max: 260, id: EFFORT.HEAVY },
];

const PROFILES: Record<EffortId, EffortProfile> = {
  [EFFORT.LIGHT]: {
    id: EFFORT.LIGHT,
    label: "light",
    duration: 780,
    enterMs: 420,
    grabMs: 240,
    releaseMs: 280,
    exhaustedMs: 0,
    exitMs: 380,
    leanMax: 8,
    walkMs: 280,
    bothHands: false,
    curve: [
      { t: 0, v: 0 },
      { t: 1, v: 1 },
    ],
    ease: "easeOut",
  },
  [EFFORT.NORMAL]: {
    id: EFFORT.NORMAL,
    label: "normal",
    duration: 1280,
    enterMs: 480,
    grabMs: 300,
    releaseMs: 340,
    exhaustedMs: 0,
    exitMs: 420,
    leanMax: 14,
    walkMs: 360,
    bothHands: false,
    curve: [
      { t: 0, v: 0 },
      { t: 0.18, v: 0.08 },
      { t: 1, v: 1 },
    ],
    ease: "easeInOut",
  },
  [EFFORT.HEAVY]: {
    id: EFFORT.HEAVY,
    label: "heavy",
    duration: 2400,
    enterMs: 520,
    grabMs: 380,
    releaseMs: 400,
    exhaustedMs: 720,
    exitMs: 480,
    leanMax: 22,
    walkMs: 480,
    bothHands: true,
    curve: [
      { t: 0, v: 0 },
      { t: 0.16, v: 0.11 },
      { t: 0.22, v: 0.07 },
      { t: 0.4, v: 0.34 },
      { t: 0.48, v: 0.3 },
      { t: 0.72, v: 0.78 },
      { t: 0.9, v: 1.05 },
      { t: 1, v: 1 },
    ],
    ease: "linear",
  },
  [EFFORT.MASSIVE]: {
    id: EFFORT.MASSIVE,
    label: "massive",
    duration: 3900,
    enterMs: 560,
    grabMs: 460,
    releaseMs: 480,
    exhaustedMs: 1500,
    exitMs: 520,
    leanMax: 30,
    walkMs: 560,
    bothHands: true,
    curve: [
      { t: 0, v: 0 },
      { t: 0.1, v: 0.05 },
      { t: 0.16, v: 0.015 },
      { t: 0.28, v: 0.16 },
      { t: 0.34, v: 0.1 },
      { t: 0.48, v: 0.38 },
      { t: 0.56, v: 0.33 },
      { t: 0.7, v: 0.68 },
      { t: 0.78, v: 0.62 },
      { t: 0.9, v: 1.08 },
      { t: 1, v: 1 },
    ],
    ease: "linear",
  },
};

export function contentLength(title = "", body = ""): number {
  return `${title} ${body}`.replace(/\s+/g, " ").trim().length;
}

export function classifyEffort(title = "", body = ""): EffortId {
  const len = contentLength(title, body);
  const match = THRESHOLDS.find((t) => len <= t.max);
  return match?.id ?? EFFORT.MASSIVE;
}

export function getProfile(title = "", body = ""): EffortProfile {
  return getProfileById(classifyEffort(title, body));
}

export function getProfileById(id: EffortId): EffortProfile {
  const profile = PROFILES[id];
  if (!profile) throw new Error(`Unknown effort: ${id}`);
  return profile;
}
