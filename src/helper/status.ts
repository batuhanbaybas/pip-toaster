import { STATUSES, type ToastStatus } from "../types/status.js";

export function parseStatus(value: unknown): ToastStatus {
  return typeof value === "string" && (STATUSES as readonly string[]).includes(value)
    ? (value as ToastStatus)
    : "default";
}
