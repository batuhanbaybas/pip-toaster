import { getProfile } from "./effort.js";
import { createScene, PRESETS } from "./scene.js";

const titleInput = document.querySelector("#title-input");
const bodyInput = document.querySelector("#body-input");
const preview = document.querySelector("#effort-preview");
const sendBtn = document.querySelector("#send-btn");

const scene = createScene({
  character: document.querySelector("#character"),
  lane: document.querySelector("#lane"),
  dock: document.querySelector("#dock"),
  stage: document.querySelector("#stage"),
});

function syncPreview() {
  const profile = getProfile(titleInput.value, bodyInput.value);
  preview.textContent = profile.hint;
}

function applyPreset(id) {
  const preset = PRESETS[id];
  if (!preset) return;
  titleInput.value = preset.title;
  bodyInput.value = preset.body;
  syncPreview();
}

function send() {
  const title = titleInput.value;
  const body = bodyInput.value;
  if (!title.trim() && !body.trim()) return;
  scene.enqueue({ title, body });
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

sendBtn.addEventListener("click", send);

bodyInput.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
    send();
  }
});

syncPreview();
