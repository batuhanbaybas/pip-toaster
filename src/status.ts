export const STATUSES = ["default", "info", "success", "warning", "error"] as const;

export type ToastStatus = (typeof STATUSES)[number];

export function parseStatus(value: unknown): ToastStatus {
  return typeof value === "string" && (STATUSES as readonly string[]).includes(value)
    ? (value as ToastStatus)
    : "default";
}
