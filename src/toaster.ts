import { mountHost } from "./host.js";
import { parsePosition, type ToastPosition } from "./placement.js";
import { createScene } from "./scene.js";
import type { ToastPayload, Toaster, ToasterConfig, ToasterOptions } from "./types.js";

interface RuntimeConfig {
  position: ToastPosition;
  duration: number;
  zIndex: number;
}

interface NormalizedToast {
  title: string;
  body: string;
  position: ToastPosition;
  durationMs: number;
}

const DEFAULTS: RuntimeConfig = {
  position: "bottom-right",
  duration: 5000,
  zIndex: 2147483000,
};

function normalize(input: string | ToastPayload, defaults: RuntimeConfig): NormalizedToast {
  if (typeof input === "string") {
    return {
      title: input,
      body: "",
      position: defaults.position,
      durationMs: defaults.duration,
    };
  }

  const payload = input;
  const title = payload.title ?? payload.message ?? "";
  const body = payload.body ?? payload.description ?? "";

  return {
    title: String(title),
    body: String(body),
    position: payload.position ?? defaults.position,
    durationMs: payload.duration ?? defaults.duration,
  };
}

function withToasterApi(
  show: (input: string | ToastPayload) => string,
  methods: Pick<Toaster, "configure" | "dismiss" | "dismissAll" | "destroy">,
): Toaster {
  return Object.assign(show, methods);
}

function noopToaster(): Toaster {
  return withToasterApi(() => "", {
    configure() {},
    dismiss() {},
    dismissAll() {},
    destroy() {},
  });
}

/**
 * Isolated toaster. Use this when a page needs two stacks, a custom
 * mount target, or Turkish/English copy on the card.
 */
export function createToaster(options: ToasterOptions = {}): Toaster {
  if (typeof document === "undefined") return noopToaster();

  let config: RuntimeConfig = {
    position: parsePosition(options.position ?? DEFAULTS.position),
    duration: options.duration ?? DEFAULTS.duration,
    zIndex: options.zIndex ?? DEFAULTS.zIndex,
  };

  const host = mountHost({
    target: options.target,
    zIndex: config.zIndex,
    theme: options.theme,
  });

  const scene = createScene({
    character: host.character,
    lane: host.lane,
    stage: host.stage,
    docks: host.docks,
    ready: host.ready,
    labels: options.labels,
  });

  const show = (input: string | ToastPayload): string => {
    const payload = normalize(input, config);
    if (!payload.title.trim() && !payload.body.trim()) return "";
    return scene.enqueue(payload);
  };

  return withToasterApi(show, {
    configure(next: ToasterConfig = {}) {
      config = {
        position: parsePosition(next.position ?? config.position),
        duration: next.duration ?? config.duration,
        zIndex: next.zIndex ?? config.zIndex,
      };
      if (next.zIndex != null) host.setZIndex(next.zIndex);
      if (next.theme) host.setTheme(next.theme);
    },
    dismiss(id: string) {
      scene.dismiss(id);
    },
    dismissAll() {
      scene.dismissAll();
    },
    destroy() {
      scene.dismissAll();
      host.destroy();
    },
  });
}

let defaultOptions: ToasterOptions = { ...DEFAULTS };
let defaultToaster: Toaster | null = null;

function getDefault(): Toaster {
  if (!defaultToaster) defaultToaster = createToaster(defaultOptions);
  return defaultToaster;
}

function showDefault(input: string | ToastPayload): string {
  return getDefault()(input);
}

/** Shared singleton — what most apps want. */
export const toast: Toaster = withToasterApi(showDefault, {
  configure(next: ToasterConfig = {}) {
    defaultOptions = {
      ...defaultOptions,
      ...next,
      position: parsePosition(next.position ?? defaultOptions.position),
      theme: next.theme ? { ...defaultOptions.theme, ...next.theme } : defaultOptions.theme,
    };
    if (defaultToaster) defaultToaster.configure(next);
  },
  dismiss(id: string) {
    getDefault().dismiss(id);
  },
  dismissAll() {
    defaultToaster?.dismissAll();
  },
  destroy() {
    if (!defaultToaster) return;
    defaultToaster.destroy();
    defaultToaster = null;
  },
});
