import { applyCardColors } from "../helper/card.js";
import { POSITIONS } from "../types/placement.js";
import { DEFAULTS } from "../types/payload.js";
import type { DockMap, MountHostOptions, ToastHost } from "../types/host.js";
import { createCharacter } from "./character.js";

const stylesheetHref = new URL("../style/styles.css", import.meta.url).href;

function linkHasSheet(link: HTMLLinkElement): boolean {
  try {
    return link.sheet != null;
  } catch {
    return false;
  }
}

/**
 * Overlay on document.body (fixed) or a custom target (absolute).
 * Styles live in Shadow DOM so host-page CSS cannot leak in (or out).
 */
export function mountHost({ target, zIndex, card }: MountHostOptions = {}): ToastHost {
  const mountAt = target ?? document.body;
  const contained = mountAt !== document.body;

  const host = document.createElement("div");
  host.className = "pip-toaster-host";
  host.style.cssText = [
    `position:${contained ? "absolute" : "fixed"}`,
    "inset:0",
    `z-index:${zIndex ?? DEFAULTS.zIndex}`,
    "pointer-events:none",
    "overflow:clip",
    "overflow-anchor:none",
  ].join(";");

  const shadow = host.attachShadow({ mode: "open" });
  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = stylesheetHref;
  shadow.append(css);

  const ready = new Promise<void>((resolve) => {
    if (linkHasSheet(css)) {
      resolve();
      return;
    }
    css.addEventListener("load", () => resolve(), { once: true });
    css.addEventListener("error", () => resolve(), { once: true });
  });

  const root = document.createElement("div");
  root.className = "pip-toaster";
  root.setAttribute("aria-live", "polite");

  const toasterLayer = document.createElement("div");
  toasterLayer.className = "toaster-layer";
  const docks = {} as DockMap;
  for (const position of POSITIONS) {
    const dock = document.createElement("div");
    dock.className = "dock";
    dock.dataset.position = position;
    toasterLayer.append(dock);
    docks[position] = dock;
  }

  const lane = document.createElement("div");
  lane.className = "lane";
  const character = createCharacter();
  lane.append(character);

  root.append(toasterLayer, lane);
  shadow.append(root);
  mountAt.append(host);
  if (card) applyCardColors(host, card);

  return {
    host,
    root,
    stage: root,
    lane,
    character,
    docks,
    ready,
    setZIndex(value) {
      host.style.zIndex = String(value);
    },
    setCardColors(colors) {
      applyCardColors(host, colors);
    },
    destroy() {
      host.remove();
    },
  };
}
