import { resolveContent } from "./content.js";
import type { EffortId } from "../helper/effort.js";
import type { ToastStatus } from "../helper/status.js";
import type { ToastAction, ToastActionContext, ToastContent } from "./types.js";

type ResolvedLabels = {
  close: string;
};

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

function renderActions(
  actions: ToastAction[],
  ctx: ToastActionContext,
  interactive: boolean,
): HTMLElement | null {
  if (actions.length === 0) return null;

  const row = document.createElement("div");
  row.className = "note__actions";

  for (const action of actions) {
    const button = document.createElement("button");
    button.type = "button";
    button.className =
      action.variant === "ghost" ? "note__action note__action--ghost" : "note__action";
    button.textContent = action.label;
    if (interactive) {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        action.onClick?.(ctx);
        if (action.dismiss !== false) ctx.dismiss();
      });
    } else {
      button.tabIndex = -1;
    }
    row.append(button);
  }

  return row;
}

export function buildCard({
  id,
  title,
  message,
  effort,
  closable,
  labels,
  content,
  actions = [],
  status = "default",
  onDismiss,
}: BuildCardOptions): HTMLElement {
  const article = document.createElement("article");
  article.className = closable ? "note" : "delivery__card";
  article.dataset.effort = effort;
  article.dataset.id = id;
  article.dataset.status = status;

  const ctx: ToastActionContext = {
    id,
    dismiss: () => onDismiss(id),
  };

  if (title) {
    const heading = document.createElement("h2");
    heading.className = "note__title";
    heading.textContent = title;
    article.append(heading);
  }

  if (message) {
    const text = document.createElement("p");
    text.className = "note__body";
    text.textContent = message;
    article.append(text);
  }

  const extra = resolveContent(content, ctx, !closable);
  if (extra.length > 0) {
    const slot = document.createElement("div");
    slot.className = "note__content";
    slot.append(...extra);
    article.append(slot);
  }

  const actionRow = renderActions(actions, ctx, closable);
  if (actionRow) article.append(actionRow);

  if (closable) {
    const close = document.createElement("button");
    close.type = "button";
    close.className = "note__close";
    close.setAttribute("aria-label", labels.close);
    close.textContent = "×";
    article.append(close);
  }

  return article;
}
