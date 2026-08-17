export interface CardColors {
  background?: string;
  color?: string;
  accent?: string;
}

export const CARD_VARS = {
  background: "--toast-bg",
  color: "--toast-color",
  accent: "--toast-accent",
} as const satisfies Record<keyof CardColors, `--toast-${string}`>;
