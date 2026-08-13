# pip-toaster

Toast notifications delivered by a small character. Pip pulls the card in from the nearest edge, parks it in a toaster dock, then comes back and pushes it out when it dismisses.

**[Documentation](https://batuhanbaybas.github.io/pip-toaster/)** · **[Playground](https://batuhanbaybas.github.io/pip-toaster/playground.html)**

> **Experimental.** This library has not been tested at enterprise scale and is not recommended for production use.

Weight comes from content length: short copy is a sprint, a wall of text is a struggle (lean, slips, two Pips on top/bottom).

No framework. Styles are injected into a Shadow DOM overlay so host-app CSS does not collide.

The published package is compiled ESM plus generated `.d.ts`. Source lives in TypeScript; `tsc` is the only build step.

## Install

```bash
npm install pip-toaster
```

## Usage

```ts
import { toast } from "pip-toaster";

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

`toast()` returns an id. `duration: 0` stays until dismissed — Pip sits beside the card and reads until you hit ×.

`title` and `message` are the card copy (`body` / `description` still work as aliases of `message`). `status` is `default` · `info` · `success` · `warning` · `error` — Pip’s shirt and the card accent follow it (`toast.success()` / `.warning()` / `.error()` / `.info()` are shortcuts). `action` renders footer buttons. `content` is a slot for your own nodes (buttons, links, anything `Node`). Host CSS does not pierce the Shadow DOM — unstyled `button` / `a` inside `content` pick up the toast styles, or pass a factory so listeners survive the carry animation.

Full payload, `createToaster`, labels, and card colors: [API docs](https://batuhanbaybas.github.io/pip-toaster/#api).

### Isolated instance

Use `createToaster` when you need a second stack, a custom mount node, or different card copy.

```ts
import { createToaster } from "pip-toaster";

const notify = createToaster({
  position: "bottom-left",
  duration: 5000,
  target: document.querySelector("#app"), // position: relative
  labels: { kicker: "Notice", close: "Dismiss" },
});

notify("Hello");
notify.destroy();
```

If `target` is omitted, the overlay is `position: fixed` on `document.body` and covers the viewport.

### Card colors

Only the toast card is recolorable. Pip’s shirt still follows `status` (teal / blue / green / amber / red); hat and skin stay as they are.

```ts
toast.configure({
  card: {
    background: "#111827",
    color: "#f9fafb",
    accent: "#e07a5f",
  },
});
```

`accent` is the default-status highlight. `info` / `success` / `warning` / `error` keep their own accent. Or set `--toast-bg`, `--toast-color`, `--toast-accent` on `.pip-toaster-host`.

## Positions

`top-left` · `top-center` · `top-right` · `bottom-left` · `bottom-center` · `bottom-right`

Left/right: Pip walks beside the card. Top/bottom center: Pip flanks the card (so it stays on screen). Heavy/massive vertical toasts get two Pips.

## Playground

```bash
npm install
npm run dev
```

Then open http://localhost:5173 for the docs site and http://localhost:5173/playground.html for the composer.

`npm run build` compiles `src/` → `dist/` (the demo imports from there).

## GitHub Pages

The site deploys from `.github/workflows/pages.yml` on push to `master`.

One-time: **Settings → Pages → Source → GitHub Actions**. After the workflow runs, the site is at `https://batuhanbaybas.github.io/pip-toaster/`.

## Publish

```bash
npm publish --access public
```
