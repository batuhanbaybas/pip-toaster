export interface CardColors {
  background?: string;
  color?: string;
  accent?: string;
}

const CARD_VARS = {
  background: "--toast-bg",
  color: "--toast-color",
  accent: "--toast-accent",
} as const satisfies Record<keyof CardColors, `--toast-${string}`>;

export function applyCardColors(host: HTMLElement, colors: CardColors): void {
  for (const key of Object.keys(CARD_VARS) as (keyof CardColors)[]) {
    if (!Object.prototype.hasOwnProperty.call(colors, key)) continue;
    const cssVar = CARD_VARS[key];
    const value = colors[key];
    if (value == null || value === "") host.style.removeProperty(cssVar);
    else host.style.setProperty(cssVar, value);
  }
}
