/**
 * Map a public toast payload onto the scene’s enqueue shape.
 * Instance/singleton lifecycle stays in toaster.ts.
 */

import { parseStatus } from "../helper/status.js";
import type { NormalizedToast, RuntimeConfig } from "../types/payload.js";
import type { ToastAction, ToastPayload } from "../types/toast.js";

function asActions(action: ToastPayload["action"]): ToastAction[] {
  if (!action) return [];
  return Array.isArray(action) ? action : [action];
}

export function normalize(input: string | ToastPayload, defaults: RuntimeConfig): NormalizedToast {
  if (typeof input === "string") {
    return {
      title: "",
      message: input,
      actions: [],
      status: "default",
      position: defaults.position,
      durationMs: defaults.duration,
    };
  }

  const title = String(input.title ?? "");
  const message = String(input.message ?? input.body ?? input.description ?? "");
  const actions = asActions(input.action);

  return {
    title,
    message,
    content: input.content,
    actions,
    status: parseStatus(input.status),
    position: input.position ?? defaults.position,
    durationMs: input.duration ?? defaults.duration,
  };
}

export function isEmpty(payload: NormalizedToast): boolean {
  return (
    !payload.title.trim() &&
    !payload.message.trim() &&
    payload.content == null &&
    payload.actions.length === 0
  );
}
