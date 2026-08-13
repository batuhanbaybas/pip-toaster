import { getProfile, sampleCurve } from "./effort.js";

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

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function interpolate(from, to, t) {
  return from + (to - from) * t;
}

function buildCard({ title, body, effort, closable }) {
  const article = document.createElement("article");
  article.className = closable ? "note" : "delivery__card";
  article.dataset.effort = effort;

  const kicker = document.createElement("div");
  kicker.className = "note__kicker";
  kicker.innerHTML = `<span>Bildirim</span><span class="note__weight">${effortLabel(effort)}</span>`;

  const heading = document.createElement("h2");
  heading.className = "note__title";
  heading.textContent = title || "Bildirim";

  const text = document.createElement("p");
  text.className = "note__body";
  text.textContent = body;

  article.append(kicker, heading, text);

  if (closable) {
    const close = document.createElement("button");
    close.type = "button";
    close.className = "note__close";
    close.setAttribute("aria-label", "Kapat");
    close.textContent = "×";
    close.addEventListener("click", () => dismissNote(article));
    article.append(close);
  }

  return article;
}

function effortLabel(id) {
  if (id === "light") return "tüy";
  if (id === "heavy") return "ağır";
  if (id === "massive") return "devasa";
  return "normal";
}

function dismissNote(note) {
  note.classList.add("is-leaving");
  note.addEventListener("animationend", () => note.remove(), { once: true });
}

export function createScene({ character, lane, dock, stage }) {
  const queue = [];
  let busy = false;

  function setCharacterState(state, effort, profile) {
    character.dataset.state = state;
    character.dataset.effort = effort;
    character.dataset.bothHands = String(Boolean(profile?.bothHands));
    if (profile) {
      character.style.setProperty("--walk-ms", `${profile.walkMs}ms`);
    }
  }

  function hideCharacter() {
    character.dataset.state = "hidden";
    character.style.removeProperty("--lean");
  }

  async function playDelivery(payload) {
    const profile = getProfile(payload.title, payload.body);
    const reduced = prefersReducedMotion();

    const wrap = document.createElement("div");
    wrap.className = "delivery";
    wrap.dataset.effort = profile.id;

    const card = buildCard({
      title: payload.title,
      body: payload.body,
      effort: profile.id,
      closable: false,
    });

    wrap.append(character, card);
    wrap.style.transform = `translateX(${lane.clientWidth + 24}px)`;
    lane.append(wrap);

    const travel = measureTravel(lane, wrap);
    const grabX = travel.start - 80;

    if (reduced) {
      setCharacterState("idle", profile.id, profile);
      wrap.style.transform = `translateX(${travel.end}px)`;
      await wait(200);
      settle(wrap, card, profile);
      return;
    }

    setCharacterState("enter", profile.id, profile);
    await animateTransform(wrap, travel.start, grabX, profile.enterMs, "easeOut");

    setCharacterState("grab", profile.id, profile);
    await wait(profile.grabMs);

    let heaved = false;

    await animatePull({
      duration: profile.duration,
      onFrame(t) {
        const progress = sampleCurve(profile, t);
        const slope = pullSlope(profile, t);

        const x = interpolate(grabX, travel.end, clamp(progress, 0, 1.12));
        wrap.style.transform = `translateX(${x}px)`;

        const hard = profile.id === "heavy" || profile.id === "massive";
        const slipping = hard && slope < -0.3;
        const resisting = hard && slope < 0.4;
        const lean = slipping
          ? profile.leanMax
          : resisting
            ? profile.leanMax * 0.85
            : Math.min(profile.leanMax, 6 + Math.max(0, slope) * 8);

        character.style.setProperty("--lean", `${-lean}deg`);

        if (slipping) setCharacterState("slip", profile.id, profile);
        else if (resisting && t > 0.08 && t < 0.95) {
          setCharacterState("strain", profile.id, profile);
        } else {
          setCharacterState("pull", profile.id, profile);
        }

        if (!heaved && slipping) {
          heaved = true;
          stage.classList.remove("is-heave");
          void stage.offsetWidth;
          stage.classList.add("is-heave");
        }
      },
    });

    wrap.style.transform = `translateX(${travel.end}px)`;
    character.style.setProperty("--lean", "0deg");
    setCharacterState("release", profile.id, profile);
    await wait(profile.releaseMs);

    if (profile.exhaustedMs > 0) {
      setCharacterState("exhausted", profile.id, profile);
      await wait(profile.exhaustedMs);
    }

    setCharacterState("exit", profile.id, profile);
    await wait(profile.exitMs);

    settle(wrap, card, profile);
  }

  function settle(wrap, card, profile) {
    const parked = buildCard({
      title: card.querySelector(".note__title")?.textContent ?? "",
      body: card.querySelector(".note__body")?.textContent ?? "",
      effort: profile.id,
      closable: true,
    });
    dock.append(parked);

    const from = card.getBoundingClientRect();
    const to = parked.getBoundingClientRect();
    parked.style.transform = `translate(${from.left - to.left}px, ${from.top - to.top}px)`;

    lane.append(character);
    wrap.remove();
    hideCharacter();
    stage.classList.remove("is-heave");

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        parked.style.transition = "transform 480ms cubic-bezier(0.16, 1, 0.3, 1)";
        parked.style.transform = "none";
      });
    });
  }

  async function drain() {
    busy = true;
    while (queue.length > 0) {
      const next = queue.shift();
      await playDelivery(next);
    }
    busy = false;
  }

  return {
    enqueue(payload) {
      queue.push({
        title: payload.title.trim(),
        body: payload.body.trim(),
      });
      if (!busy) drain();
    },
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function measureTravel(lane, wrap) {
  const laneWidth = lane.clientWidth;
  const wrapWidth = wrap.getBoundingClientRect().width;
  const start = laneWidth + 24;
  const end = laneWidth - wrapWidth;
  return { start, end };
}

function animateTransform(el, from, to, duration, easeName) {
  const ease = easeName === "easeOut" ? (t) => 1 - (1 - t) ** 3 : (t) => t;
  return new Promise((resolve) => {
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const x = interpolate(from, to, ease(t));
      el.style.transform = `translateX(${x}px)`;
      if (t < 1) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });
}

function pullSlope(profile, t) {
  const dt = 0.03;
  const a = sampleCurve(profile, Math.max(0, t - dt));
  const b = sampleCurve(profile, Math.min(1, t + dt));
  return (b - a) / (2 * dt);
}

function animatePull({ duration, onFrame }) {
  return new Promise((resolve) => {
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      onFrame(t);
      if (t < 1) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });
}

export { PRESETS };
