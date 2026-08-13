import { classifyEffort, createToaster } from "../dist/index.js";

const PRESETS = {
  light: {
    title: "Yeni mesaj",
    body: "Toplantı 10 dk içinde.",
  },
  normal: {
    title: "Tasarım incelemesi",
    body: "Tasarım incelemesi 10 dakika içinde başlıyor. Odada hazır ol, notlarını yanına al.",
  },
  heavy: {
    title: "Sprint özeti gecikti",
    body: "Sprint review notları hâlâ eksik: API sözleşmesi, hata bütçesi ve bildirim kuyruğunun geri basma davranışı yazılmadı. Lütfen toplantıdan önce bu üç maddeyi tamamla, aksi halde demo kayar ve paydaşlara yeni bir slot açmak zorunda kalırız.",
  },
  massive: {
    title: "Üretim alarmı — okumadan geçme",
    body: "Kuyruk derinliği son 12 dakikada 4 katına çıktı. Worker’lar mesajı alıyor ama işledikten sonra ack atamıyor; retry fırtınası bildirim servisini şişiriyor. Kısa mesajlar hâlâ geçiyor, uzun gövdeli payload’lar ise worker’ı 2–3 saniye meşgul ediyor. Öncelik: tüketici timeout’unu düşür, poison mesajı ayrı kuyruğa al, ardından uzun bildirimleri parçala. Bu metin kasıtlı olarak uzun — Pip’in gerçekten ağır bir şeyi sürüklemesini izlemek için.",
  },
};

const HINTS = {
  light: "Pip bunu koşarak getirir.",
  normal: "Pip rahatça sürükler.",
  heavy: "Pip eğilecek. Birkaç hamlede çeker.",
  massive: "Bu epey ağır. Pip zorlanacak.",
};

const titleInput = document.querySelector("#title-input");
const bodyInput = document.querySelector("#body-input");
const preview = document.querySelector("#effort-preview");
const sendBtn = document.querySelector("#send-btn");
const durationInput = document.querySelector("#duration-input");

const toast = createToaster({
  target: document.querySelector("#stage"),
  position: "bottom-right",
  labels: { kicker: "Bildirim", close: "Kapat" },
});

let position = "bottom-right";

function syncPreview() {
  preview.textContent = HINTS[classifyEffort(titleInput.value, bodyInput.value)];
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
  const seconds = Number(durationInput.value);
  toast({
    title,
    body,
    position,
    duration: Number.isFinite(seconds) ? seconds * 1000 : 5000,
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
