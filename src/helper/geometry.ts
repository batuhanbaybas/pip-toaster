/**
 * Points and travel paths. Dock/position policy lives in placement.ts.
 */

import type { Edge } from "./placement.js";

export interface Point {
  x: number;
  y: number;
}

export function offsetAlong(from: Point, to: Point, distance: number): Point {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  return {
    x: from.x + (dx / len) * distance,
    y: from.y + (dy / len) * distance,
  };
}

export function lerpPoint(from: Point, to: Point, t: number): Point {
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
  };
}

/**
 * Align the CARD to the spacer slot; wrap (pip + card) is offset around it.
 * Off-screen start is along `from`.
 */
export function measureTravel({
  stage,
  wrap,
  card,
  slot,
  from,
}: {
  stage: HTMLElement;
  wrap: HTMLElement;
  card: HTMLElement;
  slot: HTMLElement;
  from: Edge;
}): { start: Point; end: Point } {
  const stageRect = stage.getBoundingClientRect();
  const wrapRect = wrap.getBoundingClientRect();
  const cardRect = card.getBoundingClientRect();
  const slotRect = slot.getBoundingClientRect();

  const end = {
    x: slotRect.left - stageRect.left - (cardRect.left - wrapRect.left),
    y: slotRect.top - stageRect.top - (cardRect.top - wrapRect.top),
  };

  const pad = 32;
  const start = { ...end };
  if (from === "right") start.x = stageRect.width + pad;
  if (from === "left") start.x = -wrapRect.width - pad;
  if (from === "top") start.y = -wrapRect.height - pad;
  if (from === "bottom") start.y = stageRect.height + pad;

  return { start, end };
}
