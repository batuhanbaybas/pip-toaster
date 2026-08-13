import { classifyEffort, createToaster } from "../dist/index.js";

const PRESETS = {
  light: {
    title: "Yeni mesaj",
    message: "Toplantı 10 dk içinde.",
  },
  normal: {
    title: "Tasarım incelemesi",
    message: "Tasarım incelemesi 10 dakika içinde başlıyor. Odada hazır ol, notlarını yanına al.",
  },
  heavy: {
    title: "Sprint özeti gecikti",
    message: "Sprint review notları hâlâ eksik: API sözleşmesi, hata bütçesi ve bildirim kuyruğunun geri basma davranışı yazılmadı. Lütfen toplantıdan önce bu üç maddeyi tamamla, aksi halde demo kayar ve paydaşlara yeni bir slot açmak zorunda kalırız.",
  },
  massive: {
    title: "Üretim alarmı — okumadan geçme",
    message: "Kuyruk derinliği son 12 dakikada 4 katına çıktı. Worker’lar mesajı alıyor ama işledikten sonra ack atamıyor; retry fırtınası bildirim servisini şişiriyor. Kısa mesajlar hâlâ geçiyor, uzun gövdeli payload’lar ise worker’ı 2–3 saniye meşgul ediyor. Öncelik: tüketici timeout’unu düşür, poison mesajı ayrı kuyruğa al, ardından uzun bildirimleri parçala. Bu metin kasıtlı olarak uzun — Pip’in gerçekten ağır bir şeyi sürüklemesini izlemek için.",
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
const actionToggle = document.querySelector("#action-toggle");

const toast = createToaster({
  position: "bottom-right",
  labels: {
    kicker: "Bildirim",
    close: "Kapat",
    info: "Bilgi",
    success: "Başarılı",
    warning: "Uyarı",
    error: "Hata",
  },
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
          { label: "Tamam" },
          {
            label: "Geri al",
            variant: "ghost",
            onClick: () => {
              console.info("Geri al");
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
