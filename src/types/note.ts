import type { EffortId } from "./effort.js";
import type { ToastStatus } from "./status.js";
import type { ToastAction, ToastContent, ToasterLabels } from "./toast.js";

export type ResolvedLabels = Required<Pick<ToasterLabels, "close">>;

export interface BuildCardOptions {
  id: string;
  title: string;
  message: string;
  effort: EffortId;
  closable: boolean;
  labels: ResolvedLabels;
  content?: ToastContent;
  actions?: ToastAction[];
  status?: ToastStatus;
  onDismiss: (id: string) => void;
}
