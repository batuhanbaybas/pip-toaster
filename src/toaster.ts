import { mountHost } from "./host.js";
import { DEFAULTS, isEmpty, normalize, type RuntimeConfig } from "./payload.js";
import { parsePosition } from "./placement.js";
import { createScene } from "./scene.js";
import type { ToastPayload, Toaster, ToasterConfig, ToasterOptions } from "./types.js";
import type { ToastStatus } from "./status.js";

function statusMethods(
  show: (input: string | ToastPayload) => string,
): Pick<Toaster, "info" | "success" | "warning" | "error"> {
  const bind = (status: ToastStatus) => (input: string | ToastPayload) => {
    if (typeof input === "string") return show({ message: input, status });
    return show({ ...input, status });
  };
  return {
    info: bind("info"),
    success: bind("success"),
    warning: bind("warning"),
    error: bind("error"),
  };
}

function withToasterApi(
  show: (input: string | ToastPayload) => string,
  methods: Pick<Toaster, "configure" | "dismiss" | "dismissAll" | "destroy">,
): Toaster {
  return Object.assign(show, statusMethods(show), methods);
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
 * mount target, or a localized close label.
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
    card: options.card,
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
    if (isEmpty(payload)) return "";
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
      if (next.card) host.setCardColors(next.card);
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
      card: next.card ? { ...defaultOptions.card, ...next.card } : defaultOptions.card,
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
