"use client";

// Synthesized SFX library. No audio files — everything is built from
// oscillators + envelopes via the Web Audio API. Fits the Bloomberg-meets-
// sci-fi aesthetic and avoids licensing.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") {
    void ctx.resume();
  }
  return ctx;
}

interface ToneOpts {
  freq: number;
  start?: number; // seconds from now
  duration: number;
  type?: OscillatorType;
  attack?: number;
  release?: number;
  peak?: number;
  pitchSlide?: number; // hz delta over duration
  filter?: { freq: number; q?: number };
}

function tone(opts: ToneOpts) {
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime + (opts.start ?? 0);
  const end = now + opts.duration;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = opts.type ?? "sine";
  osc.frequency.setValueAtTime(opts.freq, now);
  if (opts.pitchSlide) {
    osc.frequency.linearRampToValueAtTime(opts.freq + opts.pitchSlide, end);
  }
  const peak = opts.peak ?? 0.18;
  const attack = opts.attack ?? 0.01;
  const release = opts.release ?? 0.12;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(peak, now + attack);
  gain.gain.setValueAtTime(peak, Math.max(now, end - release));
  gain.gain.linearRampToValueAtTime(0, end);

  let node: AudioNode = osc;
  if (opts.filter) {
    const f = c.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = opts.filter.freq;
    f.Q.value = opts.filter.q ?? 1;
    osc.connect(f);
    node = f;
  }
  node.connect(gain).connect(c.destination);
  osc.start(now);
  osc.stop(end + 0.05);
}

function noiseBurst(opts: { duration: number; start?: number; peak?: number; sweep?: boolean }) {
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime + (opts.start ?? 0);
  const end = now + opts.duration;
  const bufferSize = Math.max(1, Math.floor(c.sampleRate * opts.duration));
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const source = c.createBufferSource();
  source.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(opts.sweep ? 4000 : 1800, now);
  if (opts.sweep) filter.frequency.exponentialRampToValueAtTime(300, end);
  const gain = c.createGain();
  const peak = opts.peak ?? 0.15;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(peak, now + 0.02);
  gain.gain.linearRampToValueAtTime(0, end);
  source.connect(filter).connect(gain).connect(c.destination);
  source.start(now);
  source.stop(end + 0.05);
}

// Frequencies for a few notes used in arpeggios (A4 = 440).
const NOTES = {
  C4: 261.63, E4: 329.63, G4: 392.0, A4: 440, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880,
  C3: 130.81, E3: 164.81, G3: 196.0, A3: 220, C6: 1046.5,
  // minor 3rds for tension
  Eb4: 311.13, Ab4: 415.3, Bb4: 466.16,
};

// ---------------------------------------------------------------------------
// Cues
// ---------------------------------------------------------------------------

export function playDemoStart() {
  // Rising arpeggio + sustained bass — "the show begins"
  tone({ freq: NOTES.C3, duration: 1.8, type: "triangle", peak: 0.18, attack: 0.05, release: 0.4 });
  tone({ freq: NOTES.C4, duration: 0.35, type: "sine", start: 0.0, peak: 0.18 });
  tone({ freq: NOTES.E4, duration: 0.35, type: "sine", start: 0.12, peak: 0.18 });
  tone({ freq: NOTES.G4, duration: 0.35, type: "sine", start: 0.24, peak: 0.18 });
  tone({ freq: NOTES.C5, duration: 0.5, type: "sine", start: 0.36, peak: 0.22 });
  tone({ freq: NOTES.G5, duration: 0.8, type: "triangle", start: 0.55, peak: 0.18, release: 0.6 });
}

export function playDemoStep() {
  // Brief whoosh — slide between sections
  noiseBurst({ duration: 0.45, sweep: true, peak: 0.08 });
  tone({ freq: 880, duration: 0.18, type: "sine", peak: 0.12, pitchSlide: 220 });
}

export function playDemoEnd() {
  // Closing chord — confident outro
  tone({ freq: NOTES.C3, duration: 1.6, type: "triangle", peak: 0.2 });
  tone({ freq: NOTES.C4, duration: 1.6, type: "sine", peak: 0.16, start: 0.02 });
  tone({ freq: NOTES.E4, duration: 1.6, type: "sine", peak: 0.14, start: 0.04 });
  tone({ freq: NOTES.G4, duration: 1.6, type: "sine", peak: 0.14, start: 0.06 });
  tone({ freq: NOTES.C5, duration: 1.4, type: "sine", peak: 0.18, start: 0.1 });
}

export function playStageRevealStart() {
  // Low gong + ticking - "AXIOM is delivering judgment"
  tone({ freq: NOTES.A3, duration: 1.8, type: "triangle", peak: 0.22, attack: 0.05, release: 0.8, pitchSlide: -20 });
  for (let i = 0; i < 6; i++) {
    tone({ freq: NOTES.C6, duration: 0.05, start: 0.15 + i * 0.1, peak: 0.06, type: "square" });
  }
}

export function playCardLand() {
  // Subtle "click + ping" as each card lands
  tone({ freq: 1200, duration: 0.06, start: 0, peak: 0.1, type: "sine" });
  tone({ freq: NOTES.E5, duration: 0.18, start: 0.03, peak: 0.12, type: "sine", release: 0.16 });
}

export function playElimination() {
  // Descending minor sting — the cut
  tone({ freq: NOTES.A4, duration: 0.45, type: "sawtooth", peak: 0.16, filter: { freq: 1400, q: 2 } });
  tone({ freq: NOTES.Eb4, duration: 0.55, type: "sawtooth", start: 0.18, peak: 0.18, filter: { freq: 1100, q: 2 } });
  tone({ freq: NOTES.A3, duration: 0.9, type: "triangle", start: 0.35, peak: 0.22, release: 0.6 });
  noiseBurst({ duration: 0.6, start: 0.35, peak: 0.08 });
}

export function playScoringPulse() {
  // Tense, casino-style build pulse while AXIOM tallies — a low throb under a
  // couple of high ticks. Call on an interval for a "wheel spinning" feel.
  tone({ freq: NOTES.A3, duration: 0.55, type: "triangle", peak: 0.1, release: 0.45, pitchSlide: 10 });
  tone({ freq: NOTES.C6, duration: 0.04, start: 0.0, peak: 0.05, type: "square" });
  tone({ freq: NOTES.E5, duration: 0.04, start: 0.28, peak: 0.04, type: "square" });
}

export function playWinnerFanfare() {
  // Triumphant ascending major arpeggio with bass
  tone({ freq: NOTES.C3, duration: 2.2, type: "triangle", peak: 0.18 });
  const lead: Array<[number, number]> = [
    [NOTES.G4, 0.0], [NOTES.C5, 0.15], [NOTES.E5, 0.3], [NOTES.G5, 0.45],
    [NOTES.C5, 0.7], [NOTES.E5, 0.85], [NOTES.G5, 1.0],
    [NOTES.C6, 1.2],
  ];
  for (const [f, t] of lead) {
    tone({ freq: f, duration: 0.22, start: t, peak: 0.18, type: "sine" });
  }
  // Sustained closing chord
  tone({ freq: NOTES.C5, duration: 1.6, start: 1.2, peak: 0.16, type: "sine", release: 1.0 });
  tone({ freq: NOTES.E5, duration: 1.6, start: 1.25, peak: 0.14, type: "sine", release: 1.0 });
  tone({ freq: NOTES.G5, duration: 1.6, start: 1.3, peak: 0.14, type: "sine", release: 1.0 });
}

export function playBuzzer() {
  // Classic game-show buzzer — two harsh low square honks + a noise edge. The
  // "you're out" sound when a team is eliminated.
  tone({ freq: 155, duration: 0.34, type: "square", peak: 0.24, attack: 0.004, release: 0.05, filter: { freq: 900, q: 1 } });
  tone({ freq: 110, duration: 0.5, start: 0.36, type: "square", peak: 0.26, attack: 0.004, release: 0.1, filter: { freq: 800, q: 1 } });
  tone({ freq: 78, duration: 0.7, start: 0.36, type: "sawtooth", peak: 0.14, release: 0.4 });
  noiseBurst({ duration: 0.55, start: 0, peak: 0.05 });
}

// ── Celebration building blocks (noise-based percussion + crowd) ───────────
function noiseSource(c: AudioContext, duration: number): AudioBufferSourceNode {
  const buf = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * duration)), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const s = c.createBufferSource();
  s.buffer = buf;
  return s;
}

function snareHit(start: number, peak: number) {
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime + start;
  const s = noiseSource(c, 0.13);
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 1400;
  const g = c.createGain();
  g.gain.setValueAtTime(peak, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
  s.connect(hp).connect(g).connect(c.destination);
  s.start(now);
  s.stop(now + 0.14);
}

function crash(start: number, peak: number, dur = 1.4) {
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime + start;
  const s = noiseSource(c, dur);
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 3000;
  const g = c.createGain();
  g.gain.setValueAtTime(peak, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + dur);
  s.connect(hp).connect(g).connect(c.destination);
  s.start(now);
  s.stop(now + dur + 0.05);
}

function cheer(start: number, dur: number, peak: number) {
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime + start;
  const s = noiseSource(c, dur);
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.setValueAtTime(650, now);
  bp.frequency.linearRampToValueAtTime(1700, now + dur * 0.5);
  bp.Q.value = 0.7;
  const g = c.createGain();
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(peak, now + 0.6);
  g.gain.setValueAtTime(peak, now + dur - 0.7);
  g.gain.linearRampToValueAtTime(0, now + dur);
  s.connect(bp).connect(g).connect(c.destination);
  s.start(now);
  s.stop(now + dur + 0.05);
}

function drumRoll(dur: number) {
  let t = 0;
  let gap = 0.13;
  while (t < dur) {
    snareHit(t, 0.08 + 0.16 * (t / dur)); // grow louder toward the peak
    t += gap;
    gap = Math.max(0.028, gap * 0.9); // accelerate
  }
  for (let k = 0; k < 4; k++) tone({ freq: 60, duration: 0.2, start: k * (dur / 4), type: "sine", peak: 0.2 });
}

export function playCheer() {
  // A lighter celebratory flourish (no drumroll) — crash + cheer + applause.
  crash(0, 0.2, 1.2);
  cheer(0, 2.4, 0.12);
  for (let i = 0; i < 7; i++) noiseBurst({ duration: 0.5, start: 0.15 + i * 0.3, peak: 0.06 });
  const lead = [NOTES.C5, NOTES.E5, NOTES.G5, NOTES.C6];
  lead.forEach((f, i) => tone({ freq: f, duration: 0.22, start: 0.1 + i * 0.13, type: "sine", peak: 0.12 }));
}

export function playCelebration() {
  // The big "HURRAY": drumroll build → cymbal CRASH → brass fanfare → crowd
  // cheer + applause + a sustained major chord.
  drumRoll(1.8);
  crash(1.8, 0.26, 1.6);
  // Rising brass-ish fanfare on the crash.
  const lead = [NOTES.G4, NOTES.C5, NOTES.E5, NOTES.G5, NOTES.C6];
  lead.forEach((f, i) =>
    tone({ freq: f, duration: 0.34, start: 1.85 + i * 0.13, type: "sawtooth", peak: 0.16, filter: { freq: 2400, q: 1 }, release: 0.2 }),
  );
  // Sustained triumphant chord under it.
  tone({ freq: NOTES.C3, duration: 2.4, start: 2.4, type: "triangle", peak: 0.2 });
  tone({ freq: NOTES.C5, duration: 2.2, start: 2.5, type: "sine", peak: 0.14 });
  tone({ freq: NOTES.E5, duration: 2.2, start: 2.55, type: "sine", peak: 0.13 });
  tone({ freq: NOTES.G5, duration: 2.2, start: 2.6, type: "sine", peak: 0.13 });
  // Crowd erupts from the crash onward.
  cheer(1.8, 3.0, 0.13);
  for (let i = 0; i < 9; i++) noiseBurst({ duration: 0.5, start: 1.9 + i * 0.3, peak: 0.06 });
}

export function unlockAudio() {
  // Tiny silent ping to unlock the AudioContext on user gesture.
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") void c.resume();
}

let autoUnlockInstalled = false;

/**
 * Install a one-time document-level listener that unlocks the AudioContext
 * on the first user interaction. Safe to call multiple times.
 */
export function installAutoUnlock() {
  if (typeof window === "undefined" || autoUnlockInstalled) return;
  autoUnlockInstalled = true;
  const handler = () => {
    unlockAudio();
    window.removeEventListener("click", handler);
    window.removeEventListener("keydown", handler);
    window.removeEventListener("touchstart", handler);
  };
  window.addEventListener("click", handler);
  window.addEventListener("keydown", handler);
  window.addEventListener("touchstart", handler);
}
