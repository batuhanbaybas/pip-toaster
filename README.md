# character-notification

Toast notifications delivered by a small character. Pip pulls the card in from the nearest edge, parks it in a toaster dock, then comes back and pushes it out when it dismisses.

Weight comes from content length: short copy is a sprint, a wall of text is a struggle (lean, slips, two Pips on top/bottom).

No framework. Styles are injected into a Shadow DOM overlay so host-app CSS does not collide.

The published package is compiled ESM plus generated `.d.ts`. Source lives in TypeScript; `tsc` is the only build step.

## Install

```bash
npm install character-notification
```

## Usage

```ts
import { toast } from "character-notification";

toast("Meeting in 10 minutes.");

toast.success("Saved.");
toast.warning({ title: "Queue lag", message: "Workers are retrying." });
toast.error({
  title: "Deploy failed",
  message: "The worker ran out of memory.",
  action: [
    { label: "Retry", onClick: () => {} },
    { label: "Details", variant: "ghost", dismiss: false },
  ],
});

toast({
  title: "Sprint review",
  message: "Bring your notes. The API contract is still missing.",
  position: "bottom-right",
  duration: 5000, // ms; 0 = sticky until ×
});

toast({
  title: "Deploy failed",
  message: "The worker ran out of memory.",
  action: [
    { label: "Retry", onClick: () => {} },
    { label: "Details", variant: "ghost", dismiss: false },
  ],
});

toast({
  title: "File deleted",
  content: (ctx) => {
    const undo = document.createElement("button");
    undo.textContent = "Undo";
    undo.addEventListener("click", () => ctx.dismiss());
    return undo;
  },
});

toast.configure({ position: "top-right", duration: 4000 });
toast.dismiss(id);
toast.dismissAll();
```

`toast()` returns an id. `duration: 0` stays until the close button — Pip still walks over and hauls it off.

`title` and `message` are the card copy (`body` / `description` still work as aliases of `message`). `status` is `default` · `info` · `success` · `warning` · `error` — Pip’s shirt and the card accent follow it (`toast.success()` / `.warning()` / `.error()` / `.info()` are shortcuts). `action` renders footer buttons. `content` is a slot for your own nodes (buttons, links, anything `Node`). Host CSS does not pierce the Shadow DOM — unstyled `button` / `a` inside `content` pick up the toast styles, or pass a factory so listeners survive the carry animation.

### Isolated instance

Use `createToaster` when you need a second stack, a custom mount node, or different card copy.

```ts
import { createToaster } from "character-notification";

const notify = createToaster({
  position: "bottom-left",
  duration: 5000,
  target: document.querySelector("#app"), // position: relative
  labels: { kicker: "Bildirim", close: "Kapat" },
});

notify("Merhaba");
notify.destroy();
```

If `target` is omitted, the overlay is `position: fixed` on `document.body` and covers the viewport.

### Card colors

Pip stays as-is. Only the toast card is recolorable:

```ts
toast.configure({
  card: {
    background: "#111827",
    color: "#f9fafb",
    accent: "#e07a5f",
  },
});
```

Or set `--toast-bg`, `--toast-color`, `--toast-accent` on `.pip-toast-host`.

## Positions

`top-left` · `top-center` · `top-right` · `bottom-left` · `bottom-center` · `bottom-right`

Left/right: Pip walks beside the card. Top/bottom center: Pip flanks the card (so it stays on screen). Heavy/massive vertical toasts get two Pips.

## Playground

```bash
npm install
npm run dev
```

Then open http://localhost:5173. `npm run build` compiles `src/` → `dist/` (the demo imports from there).

## Publish

```bash
npm publish --access public
```

If the name `character-notification` is taken, change `"name"` in `package.json` (scoped names like `@you/character-notification` work well).
