/**
 * Turn ToastContent into DOM nodes. Card chrome (title, close, actions)
 * stays in note.ts.
 */

import type { ToastActionContext, ToastContent } from "../types/toast.js";

function flattenNodes(value: Node | string | Array<Node | string> | null | undefined): Node[] {
  if (value == null || value === "") return [];
  if (typeof value === "string") return [document.createTextNode(value)];
  if (Array.isArray(value)) return value.flatMap((item) => flattenNodes(item));
  if (value instanceof DocumentFragment) return [...value.childNodes];
  return [value];
}

export function resolveContent(
  content: ToastContent | undefined,
  ctx: ToastActionContext,
  clone: boolean,
): Node[] {
  if (content == null) return [];
  const resolved = typeof content === "function" ? content(ctx) : content;
  const nodes = flattenNodes(resolved);
  if (!clone) return nodes;
  return nodes.map((node) => node.cloneNode(true));
}
