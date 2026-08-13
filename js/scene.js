import { getProfile, sampleCurve } from "./effort.js";
import {
  getPlacement,
  insertSlot,
  lerpPoint,
  measureTravel,
  offsetAlong,
  parsePosition,
} from "./placement.js";

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

function easeOutCubic(t) {
  return 1 - (1 - t) ** 3;
}

function setWrapPos(el, point) {
  el.style.transform = `translate(${point.x}px, ${point.y}px)`;
}

function effortLabel(id) {
  if (id === "light") return "tüy";
  if (id === "heavy") return "ağır";
  if (id === "massive") return "devasa";
  return "normal";
}

function buildCard({ title, body, effort, closable, id }) {
  const article = document.createElement("article");
  article.className = closable ? "note" : "delivery__card";
  article.dataset.effort = effort;
  if (id) article.dataset.id = id;

  const kicker = document.createElement("div");
  kicker.className = "note__kicker";

  const kind = document.createElement("span");
  kind.textContent = "Bildirim";
  const weight = document.createElement("span");
  weight.className = "note__weight";
  weight.textContent = effortLabel(effort);
  kicker.append(kind, weight);

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
    article.append(close);
  }

  return article;
}

export function createScene({ character, lane, stage, docks }) {
  const jobs = [];
  const toasts = new Map();
  let busy = false;
  let seq = 0;

  function setCharacterState(state, effort, profile, placement) {
    character.dataset.state = state;
    character.dataset.effort = effort;
    character.dataset.bothHands = String(Boolean(profile?.bothHands));
    if (placement) character.dataset.face = placement.face;
    if (profile) character.style.setProperty("--walk-ms", `${profile.walkMs}ms`);
  }

  function hideCharacter() {
    character.dataset.state = "hidden";
    character.style.removeProperty("--lean");
  }

  function mountWrap(placement, card) {
    const wrap = document.createElement("div");
    wrap.className = "delivery";
    wrap.dataset.effort = card.dataset.effort;
    wrap.dataset.pipSide = placement.pipSide;
    wrap.style.visibility = "hidden";
    if (placement.pipSide === "before") wrap.append(character, card);
    else wrap.append(card, character);
    lane.append(wrap);
    return wrap;
  }

  function revealWrap(wrap, point) {
    setWrapPos(wrap, point);
    wrap.style.visibility = "";
  }

  function parkCharacter() {
    lane.append(character);
    hideCharacter();
    stage.classList.remove("is-heave");
  }

  async function playPull({ wrap, from, to, profile, placement, stateWhenMoving, leanSign }) {
    const sign = leanSign ?? placement.leanSign;
    let heaved = false;

    await animatePull({
      duration: profile.duration,
      onFrame(t) {
        const progress = sampleCurve(profile, t);
        const slope = pullSlope(profile, t);
        setWrapPos(wrap, lerpPoint(from, to, clamp(progress, 0, 1.12)));

        const hard = profile.id === "heavy" || profile.id === "massive";
        const slipping = hard && slope < -0.3;
        const resisting = hard && slope < 0.4;
        const lean = slipping
          ? profile.leanMax
          : resisting
            ? profile.leanMax * 0.85
            : Math.min(profile.leanMax, 6 + Math.max(0, slope) * 8);

        character.style.setProperty("--lean", `${sign * lean}deg`);

        if (slipping) setCharacterState("slip", profile.id, profile, placement);
        else if (resisting && t > 0.08 && t < 0.95) {
          setCharacterState("strain", profile.id, profile, placement);
        } else {
          setCharacterState(stateWhenMoving, profile.id, profile, placement);
        }

        if (!heaved && slipping) {
          heaved = true;
          stage.classList.remove("is-heave");
          void stage.offsetWidth;
          stage.classList.add("is-heave");
        }
      },
    });

    setWrapPos(wrap, to);
    character.style.setProperty("--lean", "0deg");
  }

  async function playDelivery(job) {
    const placement = getPlacement(job.position);
    const profile = getProfile(job.title, job.body);
    const dock = docks[placement.id];
    const reduced = prefersReducedMotion();

    const card = buildCard({
      id: job.id,
      title: job.title,
      body: job.body,
      effort: profile.id,
      closable: false,
    });

    const wrap = mountWrap(placement, card);
    const spacer = insertSlot(dock, placement, Math.max(72, card.getBoundingClientRect().height));
    const travel = measureTravel({ stage, wrap, card, slot: spacer, placement });
    const grab = offsetAlong(travel.start, travel.end, 80);

    if (reduced) {
      revealWrap(wrap, travel.end);
      settleToast(job, wrap, card, spacer, profile, placement);
      return;
    }

    setCharacterState("enter", profile.id, profile, placement);
    revealWrap(wrap, travel.start);
    await animatePos(wrap, travel.start, grab, profile.enterMs);
    setCharacterState("grab", profile.id, profile, placement);
    await wait(profile.grabMs);

    await playPull({
      wrap,
      from: grab,
      to: travel.end,
      profile,
      placement,
      stateWhenMoving: "pull",
    });

    setCharacterState("release", profile.id, profile, placement);
    await wait(profile.releaseMs);

    if (profile.exhaustedMs > 0) {
      setCharacterState("exhausted", profile.id, profile, placement);
      await wait(profile.exhaustedMs);
    }

    setCharacterState("exit", profile.id, profile, placement);
    await wait(profile.exitMs);

    settleToast(job, wrap, card, spacer, profile, placement);
  }

  function settleToast(job, wrap, card, spacer, profile, placement) {
    const parked = buildCard({
      id: job.id,
      title: job.title,
      body: job.body,
      effort: profile.id,
      closable: true,
    });

    const from = card.getBoundingClientRect();
    spacer.replaceWith(parked);
    const to = parked.getBoundingClientRect();
    parked.style.transform = `translate(${from.left - to.left}px, ${from.top - to.top}px)`;

    wrap.remove();
    parkCharacter();

    const toast = {
      id: job.id,
      title: job.title,
      body: job.body,
      profile,
      placement,
      el: parked,
      durationMs: job.durationMs,
      timer: 0,
      closing: false,
    };
    toasts.set(job.id, toast);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        parked.style.transition = "transform 480ms cubic-bezier(0.16, 1, 0.3, 1)";
        parked.style.transform = "none";
      });
    });

    if (toast.durationMs > 0) {
      toast.timer = window.setTimeout(() => {
        requestDismiss(job.id);
      }, toast.durationMs);
    }
  }

  async function playDismiss(job) {
    const toast = toasts.get(job.id);
    if (!toast?.el) {
      toasts.delete(job.id);
      return;
    }

    window.clearTimeout(toast.timer);
    toast.closing = true;

    const { profile, placement, el } = toast;
    const reduced = prefersReducedMotion();

    const spacer = document.createElement("div");
    spacer.className = "note note--spacer";
    spacer.style.height = `${el.offsetHeight}px`;
    el.replaceWith(spacer);

    const card = buildCard({
      id: toast.id,
      title: toast.title,
      body: toast.body,
      effort: profile.id,
      closable: false,
    });
    const wrap = mountWrap(placement, card);

    const travel = measureTravel({ stage, wrap, card, slot: spacer, placement });

    if (reduced) {
      wrap.remove();
      spacer.remove();
      parkCharacter();
      toasts.delete(job.id);
      return;
    }

    setCharacterState("enter", profile.id, profile, placement);
    revealWrap(wrap, travel.end);
    await wait(Math.max(280, profile.enterMs * 0.65));
    setCharacterState("grab", profile.id, profile, placement);
    await wait(profile.grabMs);

    await playPull({
      wrap,
      from: travel.end,
      to: travel.start,
      profile,
      placement,
      stateWhenMoving: "drag",
      leanSign: -placement.leanSign,
    });

    setCharacterState("exit", profile.id, profile, placement);
    await wait(profile.exitMs);

    wrap.remove();
    spacer.remove();
    parkCharacter();
    toasts.delete(job.id);
  }

  async function drain() {
    busy = true;
    while (jobs.length > 0) {
      const next = jobs.shift();
      if (next.kind === "deliver") await playDelivery(next);
      else await playDismiss(next);
    }
    busy = false;
  }

  function pump() {
    if (!busy) drain();
  }

  function requestDismiss(id) {
    const toast = toasts.get(id);
    if (!toast || toast.closing) return;
    toast.closing = true;
    window.clearTimeout(toast.timer);
    jobs.push({ kind: "dismiss", id });
    pump();
  }

  stage.addEventListener("click", (event) => {
    const close = event.target.closest(".note__close");
    if (!close) return;
    const note = close.closest(".note");
    if (note?.dataset.id) requestDismiss(note.dataset.id);
  });

  return {
    enqueue({ title, body, position, durationMs }) {
      jobs.push({
        kind: "deliver",
        id: `toast-${++seq}`,
        title: title.trim(),
        body: body.trim(),
        position: parsePosition(position),
        durationMs: Number.isFinite(durationMs) ? Math.max(0, durationMs) : 5000,
      });
      pump();
    },
    dismiss: requestDismiss,
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function animatePos(el, from, to, duration) {
  return new Promise((resolve) => {
    const start = performance.now();
    setWrapPos(el, from);
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      setWrapPos(el, lerpPoint(from, to, easeOutCubic(t)));
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
