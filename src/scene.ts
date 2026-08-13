import { getProfile, sampleCurve, type EffortId, type EffortProfile } from "./effort.js";
import {
  crewSize,
  getPlacement,
  insertSlot,
  lerpPoint,
  measureTravel,
  offsetAlong,
  parsePosition,
  withMode,
  type ActingLayout,
  type Placement,
  type Point,
  type ToastPosition,
} from "./placement.js";
import type { DockMap } from "./host.js";
import type { ToasterLabels } from "./types.js";

const DEFAULT_LABELS = {
  kicker: "Notice",
  close: "Dismiss",
} as const;

type ResolvedLabels = {
  kicker: string;
  close: string;
};

type CharacterState =
  | "hidden"
  | "enter"
  | "grab"
  | "pull"
  | "push"
  | "strain"
  | "slip"
  | "release"
  | "exhausted"
  | "exit";

interface DeliverJob {
  kind: "deliver";
  id: string;
  title: string;
  body: string;
  position: ToastPosition;
  durationMs: number;
}

interface DismissJob {
  kind: "dismiss";
  id: string;
}

type Job = DeliverJob | DismissJob;

interface ParkedToast {
  id: string;
  title: string;
  body: string;
  profile: EffortProfile;
  placement: Placement;
  el: HTMLElement;
  durationMs: number;
  timer: number;
  closing: boolean;
}

export interface SceneOptions {
  character: HTMLElement;
  lane: HTMLElement;
  stage: HTMLElement;
  docks: DockMap;
  labels?: ToasterLabels;
  ready?: Promise<void>;
}

export interface EnqueueInput {
  title: string;
  body: string;
  position: ToastPosition;
  durationMs: number;
}

export interface Scene {
  enqueue(input: EnqueueInput): string;
  dismiss(id: string): void;
  dismissAll(): void;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

function setWrapPos(el: HTMLElement, point: Point): void {
  el.style.transform = `translate(${point.x}px, ${point.y}px)`;
}

function effortLabel(id: EffortId): string {
  if (id === "light") return "light";
  if (id === "heavy") return "heavy";
  if (id === "massive") return "massive";
  return "normal";
}

function buildCard({
  title,
  body,
  effort,
  closable,
  id,
  labels,
}: {
  title: string;
  body: string;
  effort: EffortId;
  closable: boolean;
  id?: string;
  labels: ResolvedLabels;
}): HTMLElement {
  const article = document.createElement("article");
  article.className = closable ? "note" : "delivery__card";
  article.dataset.effort = effort;
  if (id) article.dataset.id = id;

  const kicker = document.createElement("div");
  kicker.className = "note__kicker";

  const kind = document.createElement("span");
  kind.textContent = labels.kicker;
  const weight = document.createElement("span");
  weight.className = "note__weight";
  weight.textContent = effortLabel(effort);
  kicker.append(kind, weight);

  const heading = document.createElement("h2");
  heading.className = "note__title";
  heading.textContent = title || labels.kicker;

  const text = document.createElement("p");
  text.className = "note__body";
  text.textContent = body;

  article.append(kicker, heading, text);

  if (closable) {
    const close = document.createElement("button");
    close.type = "button";
    close.className = "note__close";
    close.setAttribute("aria-label", labels.close);
    close.textContent = "×";
    article.append(close);
  }

  return article;
}

export function createScene({
  character,
  lane,
  stage,
  docks,
  labels,
  ready,
}: SceneOptions): Scene {
  const copy: ResolvedLabels = { ...DEFAULT_LABELS, ...labels };
  const jobs: Job[] = [];
  const toasts = new Map<string, ParkedToast>();
  let busy = false;
  let seq = 0;
  let dismissInFlight = false;

  let activeWrap: HTMLElement | null = null;

  function crewOf(wrap: HTMLElement | null): HTMLElement[] {
    if (!wrap) return [character];
    const pips = [...wrap.querySelectorAll<HTMLElement>(".character")];
    return pips.length > 0 ? pips : [character];
  }

  function setCharacterState(
    state: CharacterState,
    effort: EffortId,
    profile: EffortProfile | undefined,
    layout: ActingLayout | undefined,
  ): void {
    const crew = crewOf(activeWrap);
    const dual = crew.length > 1;
    crew.forEach((pip, index) => {
      pip.dataset.state = state;
      pip.dataset.effort = effort;
      pip.dataset.bothHands = String(
        dual || layout?.axis === "y" || layout?.mode === "push" || Boolean(profile?.bothHands),
      );
      if (layout) {
        pip.dataset.axis = layout.axis ?? "x";
        if (dual) {
          pip.dataset.face = index === 0 ? "1" : "-1";
          pip.dataset.push = index === 0 ? "right" : "left";
        } else if (layout.axis === "y") {
          pip.dataset.face = "1";
          pip.dataset.push = "right";
        } else {
          pip.dataset.face = layout.face;
          pip.dataset.push = layout.mode === "push" ? layout.direction : "";
        }
      }
      if (profile) pip.style.setProperty("--walk-ms", `${profile.walkMs}ms`);
    });
  }

  function hideCharacter(): void {
    character.dataset.state = "hidden";
    character.dataset.push = "";
    character.style.removeProperty("--lean");
  }

  function mountWrap(layout: ActingLayout, card: HTMLElement, profile: EffortProfile): HTMLElement {
    const wrap = document.createElement("div");
    const crew = crewSize(layout, profile.id);
    wrap.className = "delivery";
    wrap.dataset.effort = card.dataset.effort;
    wrap.dataset.pipSide = layout.pipSide;
    wrap.dataset.axis = layout.axis ?? "x";
    wrap.dataset.dir = layout.direction ?? layout.from;
    wrap.dataset.edge = layout.from;
    wrap.dataset.crew = String(crew);
    wrap.style.visibility = "hidden";

    if (crew === 2) {
      const mate = character.cloneNode(true) as HTMLElement;
      mate.removeAttribute("id");
      mate.dataset.role = "mate";
      wrap.append(character, card, mate);
    } else if (layout.pipSide === "before") {
      wrap.append(character, card);
    } else {
      wrap.append(card, character);
    }

    lane.append(wrap);
    activeWrap = wrap;
    return wrap;
  }

  function revealWrap(wrap: HTMLElement, point: Point): void {
    setWrapPos(wrap, point);
    wrap.style.visibility = "";
  }

  function parkCharacter(): void {
    lane.querySelectorAll('.character[data-role="mate"]').forEach((el) => el.remove());
    lane.append(character);
    hideCharacter();
    activeWrap = null;
  }

  async function playPull({
    wrap,
    from,
    to,
    profile,
    placement,
    stateWhenMoving,
    leanSign,
  }: {
    wrap: HTMLElement;
    from: Point;
    to: Point;
    profile: EffortProfile;
    placement: ActingLayout;
    stateWhenMoving: CharacterState;
    leanSign?: number;
  }): Promise<void> {
    const sign = leanSign ?? placement.leanSign;

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

        const crew = crewOf(wrap);
        const axisScale = placement.axis === "y" ? 0.35 : 1;
        crew.forEach((pip, index) => {
          const dir = crew.length > 1 ? (index === 0 ? 1 : -1) : sign;
          pip.style.setProperty("--lean", `${dir * lean * axisScale}deg`);
        });

        if (slipping) setCharacterState("slip", profile.id, profile, placement);
        else if (resisting && t > 0.08 && t < 0.95) {
          setCharacterState("strain", profile.id, profile, placement);
        } else {
          setCharacterState(stateWhenMoving, profile.id, profile, placement);
        }
      },
    });

    setWrapPos(wrap, to);
    crewOf(wrap).forEach((pip) => {
      pip.style.setProperty("--lean", "0deg");
    });
  }

  async function playDelivery(job: DeliverJob): Promise<void> {
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
      labels: copy,
    });

    const layout = withMode(placement, "pull");
    const wrap = mountWrap(layout, card, profile);
    const spacer = insertSlot(dock, placement, Math.max(72, card.getBoundingClientRect().height));
    const travel = measureTravel({ stage, wrap, card, slot: spacer, placement: layout });
    const grab = offsetAlong(travel.start, travel.end, 80);

    if (reduced) {
      revealWrap(wrap, travel.end);
      settleToast(job, wrap, spacer, profile, placement);
      return;
    }

    setCharacterState("enter", profile.id, profile, layout);
    revealWrap(wrap, travel.start);
    await animatePos(wrap, travel.start, grab, profile.enterMs);
    setCharacterState("grab", profile.id, profile, layout);
    await wait(profile.grabMs);

    await playPull({
      wrap,
      from: grab,
      to: travel.end,
      profile,
      placement: layout,
      stateWhenMoving: layout.axis === "y" ? "push" : "pull",
    });

    setCharacterState("release", profile.id, profile, layout);
    await wait(profile.releaseMs);

    if (profile.exhaustedMs > 0) {
      setCharacterState("exhausted", profile.id, profile, layout);
      await wait(profile.exhaustedMs);
    }

    setCharacterState("exit", profile.id, profile, layout);
    await wait(profile.exitMs);

    settleToast(job, wrap, spacer, profile, placement);
  }

  function settleToast(
    job: DeliverJob,
    wrap: HTMLElement,
    spacer: HTMLElement,
    profile: EffortProfile,
    placement: Placement,
  ): void {
    const parked = buildCard({
      id: job.id,
      title: job.title,
      body: job.body,
      effort: profile.id,
      closable: true,
      labels: copy,
    });

    spacer.replaceWith(parked);
    wrap.remove();
    parkCharacter();

    const toast: ParkedToast = {
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

    if (dismissInFlight) {
      requestDismiss(job.id);
      return;
    }

    if (toast.durationMs > 0) {
      toast.timer = window.setTimeout(() => {
        requestDismiss(job.id);
      }, toast.durationMs);
    }
  }

  async function playDismiss(job: DismissJob): Promise<void> {
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
      labels: copy,
    });
    const layout = withMode(placement, "push");
    const wrap = mountWrap(layout, card, profile);

    const travel = measureTravel({ stage, wrap, card, slot: spacer, placement: layout });

    if (reduced) {
      wrap.remove();
      spacer.remove();
      parkCharacter();
      toasts.delete(job.id);
      return;
    }

    setCharacterState("enter", profile.id, profile, layout);
    revealWrap(wrap, travel.end);
    await wait(Math.max(280, profile.enterMs * 0.65));
    setCharacterState("grab", profile.id, profile, layout);
    await wait(profile.grabMs);

    await playPull({
      wrap,
      from: travel.end,
      to: travel.start,
      profile,
      placement: layout,
      stateWhenMoving: "push",
      leanSign: layout.leanSign,
    });

    setCharacterState("exit", profile.id, profile, layout);
    await wait(profile.exitMs);

    wrap.remove();
    spacer.remove();
    parkCharacter();
    toasts.delete(job.id);
  }

  async function drain(): Promise<void> {
    busy = true;
    if (ready) await ready;
    while (jobs.length > 0) {
      const next = jobs.shift();
      if (!next) break;
      if (next.kind === "deliver") await playDelivery(next);
      else await playDismiss(next);
    }
    busy = false;
    if (toasts.size === 0) dismissInFlight = false;
  }

  function pump(): void {
    if (!busy) void drain();
  }

  function requestDismiss(id: string): void {
    const toast = toasts.get(id);
    if (!toast || toast.closing) return;
    toast.closing = true;
    window.clearTimeout(toast.timer);
    jobs.push({ kind: "dismiss", id });
    pump();
  }

  stage.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const close = target.closest(".note__close");
    if (!close) return;
    const note = close.closest(".note");
    if (note instanceof HTMLElement && note.dataset.id) requestDismiss(note.dataset.id);
  });

  return {
    enqueue({ title, body, position, durationMs }) {
      dismissInFlight = false;
      const id = `toast-${++seq}`;
      jobs.push({
        kind: "deliver",
        id,
        title: title.trim(),
        body: body.trim(),
        position: parsePosition(position),
        durationMs: Number.isFinite(durationMs) ? Math.max(0, durationMs) : 5000,
      });
      pump();
      return id;
    },
    dismiss: requestDismiss,
    dismissAll() {
      dismissInFlight = true;
      for (let i = jobs.length - 1; i >= 0; i -= 1) {
        if (jobs[i]?.kind === "deliver") jobs.splice(i, 1);
      }
      for (const id of [...toasts.keys()]) requestDismiss(id);
    },
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function animatePos(el: HTMLElement, from: Point, to: Point, duration: number): Promise<void> {
  return new Promise((resolve) => {
    const start = performance.now();
    setWrapPos(el, from);
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setWrapPos(el, lerpPoint(from, to, easeOutCubic(t)));
      if (t < 1) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });
}

function pullSlope(profile: EffortProfile, t: number): number {
  const dt = 0.03;
  const a = sampleCurve(profile, Math.max(0, t - dt));
  const b = sampleCurve(profile, Math.min(1, t + dt));
  return (b - a) / (2 * dt);
}

function animatePull({
  duration,
  onFrame,
}: {
  duration: number;
  onFrame: (t: number) => void;
}): Promise<void> {
  return new Promise((resolve) => {
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      onFrame(t);
      if (t < 1) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });
}
