"use client";

// Subtle UI sound effects via the Web Audio API — no asset files, tiny gain.
// Respects a persisted mute flag (localStorage) and is a no-op on the server.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    if (!ctx) ctx = new Ctor();
    return ctx;
  } catch {
    return null;
  }
}

export function isMuted(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem("duel:muted") === "1";
}

export function setMuted(m: boolean): void {
  if (typeof window !== "undefined") window.localStorage.setItem("duel:muted", m ? "1" : "0");
}

/** Play a short, soft sequence of sine tones. */
function blip(freqs: number[], dur = 0.12, gain = 0.035): void {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === "suspended") ac.resume().catch(() => {});
  const now = ac.currentTime;
  freqs.forEach((f, i) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = "sine";
    o.frequency.value = f;
    const t = now + i * 0.06;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(ac.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  });
}

export const sfx = {
  /** Player sends a message — a soft upward tick. */
  send: () => blip([520], 0.07, 0.025),
  /** Buyer replies — a gentle two-note. */
  reply: () => blip([392, 523], 0.11, 0.03),
  /** AXIOM verdict reveal — a small rising triad. */
  reveal: () => blip([523, 659, 784], 0.18, 0.045),
};
