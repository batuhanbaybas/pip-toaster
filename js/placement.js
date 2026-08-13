/**
 * Toaster placement. Pip's approach, facing, and pull axis
 * are derived from the dock position — keep that mapping here.
 */

export const POSITIONS = [
  "top-left",
  "top-center",
  "top-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
];

export function parsePosition(value) {
  return POSITIONS.includes(value) ? value : "bottom-right";
}

export function getPlacement(position) {
  const id = parsePosition(position);
  const [vertical, horizontal] = id.split("-");
  const from = horizontal === "center" ? vertical : horizontal;

  return {
    id,
    vertical,
    horizontal,
    from,
    pipSide: horizontal === "left" ? "after" : "before",
    face: horizontal === "left" ? "-1" : "1",
    leanSign: horizontal === "left" ? 1 : -1,
  };
}

export function insertSlot(dock, placement, height) {
  const spacer = document.createElement("div");
  spacer.className = "note note--spacer";
  spacer.style.height = `${Math.max(72, height)}px`;
  if (placement.vertical === "top") dock.prepend(spacer);
  else dock.append(spacer);
  return spacer;
}

export function offsetAlong(from, to, distance) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  return {
    x: from.x + (dx / len) * distance,
    y: from.y + (dy / len) * distance,
  };
}

export function lerpPoint(from, to, t) {
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
  };
}

/**
 * Align the CARD to the spacer slot; wrap (pip + card) is offset around it.
 * Off-screen start is along `placement.from`.
 */
export function measureTravel({ stage, wrap, card, slot, placement }) {
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
  if (placement.from === "right") start.x = stageRect.width + pad;
  if (placement.from === "left") start.x = -wrapRect.width - pad;
  if (placement.from === "top") start.y = -wrapRect.height - pad;
  if (placement.from === "bottom") start.y = stageRect.height + pad;

  return { start, end };
}
