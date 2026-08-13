/**
 * Public look-and-feel tokens. Values are any valid CSS (color, length, font, shadow).
 * Applied as `--cn-*` custom properties on the overlay host — they inherit into Shadow DOM.
 */
export interface ToastTheme {
  font?: string;

  accent?: string;

  pipSkin?: string;
  pipSkinShadow?: string;
  pipShirt?: string;
  pipShirtDark?: string;
  pipHat?: string;
  pipBoots?: string;
  pipEyes?: string;
  pipBrows?: string;
  pipMouth?: string;
  pipSweat?: string;
  pipWidth?: string;
  pipHeight?: string;
  pipGrabGap?: string;
  pipMateShirt?: string;
  pipMateShirtDark?: string;
  pipMateHat?: string;

  toastBg?: string;
  toastColor?: string;
  toastMuted?: string;
  toastBody?: string;
  toastPadding?: string;
  toastRadius?: string;
  toastWidth?: string;
  toastMaxHeight?: string;
  toastShadow?: string;
  toastTitleFont?: string;
  toastTitleSize?: string;
  toastBodySize?: string;
  toastGrip?: string;

  dockGap?: string;
  dockOffset?: string;
}

/** Maps each theme key to the CSS custom property consumers can also set by hand. */
export const THEME_VARS = {
  font: "--cn-font",
  accent: "--cn-accent",

  pipSkin: "--cn-pip-skin",
  pipSkinShadow: "--cn-pip-skin-shadow",
  pipShirt: "--cn-pip-shirt",
  pipShirtDark: "--cn-pip-shirt-dark",
  pipHat: "--cn-pip-hat",
  pipBoots: "--cn-pip-boots",
  pipEyes: "--cn-pip-eyes",
  pipBrows: "--cn-pip-brows",
  pipMouth: "--cn-pip-mouth",
  pipSweat: "--cn-pip-sweat",
  pipWidth: "--cn-pip-width",
  pipHeight: "--cn-pip-height",
  pipGrabGap: "--cn-pip-grab-gap",
  pipMateShirt: "--cn-pip-mate-shirt",
  pipMateShirtDark: "--cn-pip-mate-shirt-dark",
  pipMateHat: "--cn-pip-mate-hat",

  toastBg: "--cn-toast-bg",
  toastColor: "--cn-toast-color",
  toastMuted: "--cn-toast-muted",
  toastBody: "--cn-toast-body",
  toastPadding: "--cn-toast-padding",
  toastRadius: "--cn-toast-radius",
  toastWidth: "--cn-toast-width",
  toastMaxHeight: "--cn-toast-max-height",
  toastShadow: "--cn-toast-shadow",
  toastTitleFont: "--cn-toast-title-font",
  toastTitleSize: "--cn-toast-title-size",
  toastBodySize: "--cn-toast-body-size",
  toastGrip: "--cn-toast-grip",

  dockGap: "--cn-dock-gap",
  dockOffset: "--cn-dock-offset",
} as const satisfies Record<keyof ToastTheme, `--cn-${string}`>;

export function applyTheme(host: HTMLElement, theme: ToastTheme): void {
  for (const key of Object.keys(THEME_VARS) as (keyof ToastTheme)[]) {
    if (!Object.prototype.hasOwnProperty.call(theme, key)) continue;
    const cssVar = THEME_VARS[key];
    const value = theme[key];
    if (value == null || value === "") host.style.removeProperty(cssVar);
    else host.style.setProperty(cssVar, value);
  }
}
