import { CARD_VARS, type CardColors } from "../types/card.js";

export function applyCardColors(host: HTMLElement, colors: CardColors): void {
  for (const key of Object.keys(CARD_VARS) as (keyof CardColors)[]) {
    if (!Object.prototype.hasOwnProperty.call(colors, key)) continue;
    const cssVar = CARD_VARS[key];
    const value = colors[key];
    if (value == null || value === "") host.style.removeProperty(cssVar);
    else host.style.setProperty(cssVar, value);
  }
}
