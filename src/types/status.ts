export const STATUSES = ["default", "info", "success", "warning", "error"] as const;

export type ToastStatus = (typeof STATUSES)[number];
