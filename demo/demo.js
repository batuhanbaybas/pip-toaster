import { classifyEffort, createToaster } from "../dist/index.js";

const PRESETS = {
  light: {
    title: "New message",
    message: "Meeting in 10 minutes.",
  },
  normal: {
    title: "Design review",
    message: "Design review starts in 10 minutes. Be in the room and bring your notes.",
  },
  heavy: {
    title: "Sprint summary is late",
    message:
      "Sprint review notes are still missing: API contract, error budget, and back-pressure on the notification queue. Finish those three before the meeting or the demo slips and we have to book a new slot with stakeholders.",
  },
  massive: {
    title: "Production alarm — read this",
    message:
      "Queue depth quadrupled in the last 12 minutes. Workers take the message but never ack; the retry storm is inflating the notification service. Short payloads still get through; long bodies keep a worker busy for 2–3 seconds. Priority: drop consumer timeout, isolate poison messages, then split long notifications. This copy is long on purpose — so you can watch Pip drag something heavy.",
  },
};

const HINTS = {
  light: "Pip sprints this in.",
  normal: "Pip carries it at a walk.",
  heavy: "Pip will lean. A few slips.",
  massive: "This is heavy. Pip will struggle.",
};

const titleInput = document.querySelector("#title-input");
const bodyInput = document.querySelector("#body-input");
const preview = document.querySelector("#effort-preview");
const sendBtn = document.querySelector("#send-btn");
const durationInput = document.querySelector("#duration-input");
const actionToggle = document.querySelector("#action-toggle");

const toast = createToaster({
  position: "bottom-right",
});

let position = "bottom-right";
let status = "default";

const cardBg = document.querySelector("#card-bg");
const cardColor = document.querySelector("#card-color");
const cardAccent = document.querySelector("#card-accent");

function hexLuminance(hex) {
  const raw = hex.replace("#", "");
  const n = raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw;
  const r = Number.parseInt(n.slice(0, 2), 16) / 255;
  const g = Number.parseInt(n.slice(2, 4), 16) / 255;
  const b = Number.parseInt(n.slice(4, 6), 16) / 255;
  const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function syncCard() {
  toast.configure({
    card: {
      background: cardBg.value,
      color: cardColor.value,
      accent: cardAccent.value,
    },
  });
}

cardBg.addEventListener("input", () => {
  cardColor.value = hexLuminance(cardBg.value) > 0.42 ? "#2c241c" : "#f3eee6";
  syncCard();
});
cardColor.addEventListener("input", syncCard);
cardAccent.addEventListener("input", syncCard);
syncCard();

function syncPreview() {
  preview.textContent = HINTS[classifyEffort(titleInput.value, bodyInput.value)];
}

function applyPreset(id) {
  const preset = PRESETS[id];
  if (!preset) return;
  titleInput.value = preset.title;
  bodyInput.value = preset.message;
  syncPreview();
}

function send() {
  const title = titleInput.value;
  const message = bodyInput.value;
  if (!title.trim() && !message.trim()) return;
  const seconds = Number(durationInput.value);
  toast({
    title,
    message,
    position,
    status,
    duration: Number.isFinite(seconds) ? seconds * 1000 : 5000,
    action: actionToggle.checked
      ? [
          { label: "OK" },
          {
            label: "Undo",
            variant: "ghost",
            onClick: () => {
              console.info("Undo");
            },
          },
        ]
      : undefined,
  });
}

titleInput.addEventListener("input", syncPreview);
bodyInput.addEventListener("input", syncPreview);

document.querySelectorAll("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("[data-preset]").forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    applyPreset(btn.dataset.preset);
  });
});

document.querySelectorAll(".statuses [data-status]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".statuses [data-status]").forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    status = btn.dataset.status;
  });
});

document.querySelectorAll("[data-position]").forEach((btn) => {
  if (!btn.classList.contains("placement__cell")) return;
  btn.addEventListener("click", () => {
    document.querySelectorAll(".placement__cell").forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    position = btn.dataset.position;
  });
});

sendBtn.addEventListener("click", send);

bodyInput.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
    send();
  }
});

syncPreview();
