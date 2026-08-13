import { toast } from "../dist/index.js";

toast.configure({ position: "bottom-right", duration: 4500 });

const HEAVY =
  "Sprint review notes are still missing: API contract, error budget, and back-pressure on the notification queue. Finish those three before the meeting or the demo slips.";

const EXAMPLES = {
  short: () => toast("Meeting in 10 minutes."),
  success: () => toast.success("Saved."),
  warning: () =>
    toast.warning({
      title: "Queue lag",
      message: "Workers are retrying.",
    }),
  error: () =>
    toast.error({
      title: "Deploy failed",
      message: "The worker ran out of memory.",
      action: [
        { label: "Retry", onClick: () => toast.success("Retry queued.") },
        { label: "Details", variant: "ghost", dismiss: false },
      ],
    }),
  sticky: () =>
    toast({
      title: "Waiting on you",
      message: "duration: 0 — Pip sits beside the card and reads until you hit ×.",
      duration: 0,
    }),
  heavy: () =>
    toast({
      title: "Sprint summary is late",
      message: HEAVY,
    }),
};

document.querySelectorAll("[data-example]").forEach((btn) => {
  btn.addEventListener("click", () => {
    EXAMPLES[btn.dataset.example]?.();
  });
});

document.querySelectorAll("[data-position]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("[data-position]").forEach((el) => el.classList.remove("is-active"));
    btn.classList.add("is-active");
    toast.configure({ position: btn.dataset.position });
    toast({
      title: btn.dataset.position,
      message: "Pip enters from this edge.",
    });
  });
});

document.querySelectorAll("[data-copy]").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const value = btn.getAttribute("data-copy") ?? "";
    try {
      await navigator.clipboard.writeText(value);
      const prev = btn.textContent;
      btn.textContent = "Copied";
      setTimeout(() => {
        btn.textContent = prev;
      }, 1400);
    } catch {
      btn.textContent = "Copy failed";
    }
  });
});

if (!sessionStorage.getItem("pip-docs-hello")) {
  sessionStorage.setItem("pip-docs-hello", "1");
  window.setTimeout(() => {
    toast({
      title: "Pip is here",
      message: "Short copy is a sprint. A wall of text is a struggle.",
    });
  }, 500);
}
