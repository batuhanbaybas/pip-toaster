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

toast({
  title: "Sprint review",
  body: "Bring your notes. The API contract is still missing.",
  position: "bottom-right",
  duration: 5000, // ms; 0 = sticky until ×
});

toast.configure({ position: "top-right", duration: 4000 });
toast.dismiss(id);
toast.dismissAll();
```

`toast()` returns an id. `duration: 0` stays until the close button — Pip still walks over and hauls it off.

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

### Theme

Pip, the card, and the dock are CSS custom properties (`--cn-*`) on the overlay host. Pass them as a typed `theme` object, or set the variables in your own CSS on `.pip-toast-host`.

```ts
toast.configure({
  theme: {
    pipSkin: "#f0c4a0",
    pipShirt: "#3d7a78",
    pipHat: "#e07a5f",
    pipBoots: "#3a2a22",
    toastBg: "#f7f1e6",
    toastColor: "#2c241c",
    toastPadding: "16px 18px",
    toastRadius: "20px",
    toastWidth: "320px",
    dockOffset: "24px",
    dockGap: "12px",
    accent: "#e07a5f",
  },
});
```

```css
.pip-toast-host {
  --cn-pip-shirt: navy;
  --cn-toast-padding: 18px 20px;
  --cn-dock-offset: 16px;
}
```

`THEME_VARS` lists every key → CSS variable. Empty string / omitted keys keep the default.

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
