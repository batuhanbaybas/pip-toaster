/**
 * Frame-level motion helpers. haul.ts owns pull-frame choreography
 * (lean / strain / slip); this module only knows time, easing, and points.
 */

import type { CurveEase, EffortProfile } from "./effort.js";
import { lerpPoint, type Point } from "./geometry.js";

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function setWrapPos(el: HTMLElement, point: Point): void {
  el.style.transform = `translate(${point.x}px, ${point.y}px)`;
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

function applyEase(t: number, kind: CurveEase): number {
  if (kind === "easeOut") return easeOutCubic(t);
  if (kind === "easeInOut") return easeInOutCubic(t);
  return t;
}

export function sampleCurve(profile: EffortProfile, t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  const { curve, ease } = profile;
  let i = 0;
  while (i < curve.length - 2 && clamped > (curve[i + 1]?.t ?? 1)) i += 1;

  const a = curve[i];
  const b = curve[i + 1];
  if (!a || !b) return 0;
  const span = b.t - a.t || 1;
  const local = applyEase((clamped - a.t) / span, ease);
  return a.v + (b.v - a.v) * local;
}

export function animatePos(el: HTMLElement, from: Point, to: Point, duration: number): Promise<void> {
  return new Promise((resolve) => {
    const start = performance.now();
    setWrapPos(el, from);
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setWrapPos(el, lerpPoint(from, to, easeOutCubic(t)));
      if (t < 1) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });
}

export function pullSlope(profile: EffortProfile, t: number): number {
  const dt = 0.03;
  const a = sampleCurve(profile, Math.max(0, t - dt));
  const b = sampleCurve(profile, Math.min(1, t + dt));
  return (b - a) / (2 * dt);
}

export function animatePull({
  duration,
  onFrame,
}: {
  duration: number;
  onFrame: (t: number) => void;
}): Promise<void> {
  return new Promise((resolve) => {
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      onFrame(t);
      if (t < 1) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });
}
