"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// -----------------------------------------------------------------------------
// SpeechSynthesis (TTS) — single shared queue per device.
// -----------------------------------------------------------------------------

let synth: SpeechSynthesis | null = null;
const pickedVoiceCache: Record<string, SpeechSynthesisVoice | null> = {};

function ensureSynth(): SpeechSynthesis | null {
  if (typeof window === "undefined") return null;
  if (!synth) synth = window.speechSynthesis ?? null;
  return synth;
}

/**
 * Heuristic gender-of-voice from name. SpeechSynthesisVoice doesn't expose
 * a gender field, so we inspect known names + substring hints. Returns
 * "f", "m", or null if unknown.
 */
function voiceGender(v: SpeechSynthesisVoice): "f" | "m" | null {
  const n = v.name.toLowerCase();
  if (/(female|woman|girl|samantha|victoria|karen|tessa|fiona|moira|veena|rishi|priya|aria|emma|amy|ella|joanna|olivia|salli|ivy|kendra|aditi|raveena|zira|catherine|kate|kira|serena)/.test(n)) return "f";
  if (/(male|man|boy|alex|daniel|fred|tom|albert|ralph|bruce|aaron|arthur|gordon|lee|oliver|reed|rocko|nathan|david|mark|justin|kevin|hemant|brian|matthew|joey|george|james)/.test(n)) return "m";
  return null;
}

type Voice = "default" | "f" | "m" | "axiom";

const VOICE_PREFERENCES: Record<Voice, string[]> = {
  default: ["Daniel", "Samantha", "Google UK English Male", "Google US English"],
  f: ["Samantha", "Victoria", "Tessa", "Fiona", "Moira", "Karen", "Veena", "Google UK English Female"],
  m: ["Daniel", "Alex", "Tom", "Aaron", "Arthur", "Rishi", "Google UK English Male"],
  axiom: ["Daniel", "Alex", "Google UK English Male"],
};

function pickVoice(role: Voice): SpeechSynthesisVoice | null {
  const s = ensureSynth();
  if (!s) return null;
  if (pickedVoiceCache[role]) return pickedVoiceCache[role]!;
  const voices = s.getVoices();
  if (voices.length === 0) return null;

  // 1. Try named preferences first.
  for (const name of VOICE_PREFERENCES[role]) {
    const v = voices.find((x) => x.name === name);
    if (v) {
      pickedVoiceCache[role] = v;
      return v;
    }
  }
  // 2. Fall back to a voice whose name hints at the right gender.
  if (role === "f" || role === "m") {
    const v = voices.find((x) => voiceGender(x) === role && x.lang.startsWith("en"));
    if (v) {
      pickedVoiceCache[role] = v;
      return v;
    }
  }
  // 3. Any English voice.
  const fallback = voices.find((v) => v.lang.startsWith("en")) ?? voices[0];
  pickedVoiceCache[role] = fallback;
  return fallback;
}

export type SpeakOpts = {
  rate?: number;
  pitch?: number;
  voice?: Voice;
  onEnd?: () => void; // fires when this utterance finishes (not when cancelled)
};

// Monotonic id so a cancelled utterance's onend can't fire a stale callback.
// Every speak() bumps it; any in-flight chunk chain whose seq no longer matches
// silently stops (this is how a new line supersedes an old one without overlap).
let speakSeq = 0;

// Chrome drops utterances longer than ~15s and renders long ones unevenly.
// Splitting into sentence-sized chunks and speaking them back-to-back keeps the
// audio smooth and complete. Cap each chunk so no single utterance is too long.
function splitIntoChunks(text: string): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const sentences = clean.match(/[^.!?]+[.!?]*/g) ?? [clean];
  const chunks: string[] = [];
  let buf = "";
  for (const raw of sentences) {
    const s = raw.trim();
    if (!s) continue;
    if (buf && (buf.length + s.length) > 180) {
      chunks.push(buf);
      buf = s;
    } else {
      buf = buf ? `${buf} ${s}` : s;
    }
  }
  if (buf) chunks.push(buf);
  return chunks;
}

export function speak(text: string, opts: SpeakOpts = {}) {
  const s = ensureSynth();
  if (!s || !text) return;
  const mySeq = ++speakSeq;
  // Stop whatever is playing. cancel() + an immediate speak() is a known Chrome
  // race that silently drops the new utterance, so we wait a beat before
  // starting (see the setTimeout below).
  try { s.cancel(); } catch { /* noop */ }

  const chunks = splitIntoChunks(text);
  if (chunks.length === 0) return;
  const v = pickVoice(opts.voice ?? "default");
  let idx = 0;

  const speakNext = () => {
    if (mySeq !== speakSeq) return; // superseded by a newer speak()/stop()
    if (idx >= chunks.length) {
      opts.onEnd?.();
      return;
    }
    const u = new SpeechSynthesisUtterance(chunks[idx++]);
    if (v) u.voice = v;
    u.rate = opts.rate ?? 0.95; // a touch slower by default — clearer in a room
    u.pitch = opts.pitch ?? 1.0;
    u.volume = 1.0;
    // Advance to the next chunk on end; on error, skip it but keep going so one
    // bad chunk never strands the rest of the line silent.
    u.onend = () => { if (mySeq === speakSeq) speakNext(); };
    u.onerror = () => { if (mySeq === speakSeq) speakNext(); };
    try { s.resume(); } catch { /* noop */ }
    try { s.speak(u); } catch { /* noop */ }
  };

  // Let cancel() settle, then start. Also nudge resume() shortly after in case
  // Chrome parked the engine.
  setTimeout(() => { if (mySeq === speakSeq) speakNext(); }, 90);
  setTimeout(() => { try { ensureSynth()?.resume(); } catch { /* noop */ } }, 220);
}

export function stopSpeaking() {
  speakSeq++; // invalidate any pending chunk chain + onEnd callback
  const s = ensureSynth();
  if (s) {
    try { s.cancel(); } catch { /* noop */ }
  }
}

// -----------------------------------------------------------------------------
// Speech priming + keep-alive. SpeechSynthesis needs a user gesture to start,
// and Chrome stalls it after idle/background. We prime on the first gesture and
// run a resume() heartbeat so the projector keeps talking through the game.
// -----------------------------------------------------------------------------
let speechPrimed = false;
let keepAliveTimer: ReturnType<typeof setInterval> | null = null;

export function primeSpeech() {
  const s = ensureSynth();
  if (!s) return;
  try { s.resume(); } catch { /* noop */ }
  if (!speechPrimed) {
    speechPrimed = true;
    // A near-silent utterance unlocks the engine within the user gesture.
    const u = new SpeechSynthesisUtterance(" ");
    u.volume = 0;
    try { s.speak(u); } catch { /* noop */ }
  }
  if (keepAliveTimer == null && typeof window !== "undefined") {
    keepAliveTimer = setInterval(() => {
      try { ensureSynth()?.resume(); } catch { /* noop */ }
    }, 8000);
  }
}

let speechUnlockInstalled = false;

/** One-time listener: prime speech on the first user interaction. */
export function installSpeechUnlock() {
  if (typeof window === "undefined" || speechUnlockInstalled) return;
  speechUnlockInstalled = true;
  const handler = () => {
    primeSpeech();
    window.removeEventListener("click", handler);
    window.removeEventListener("keydown", handler);
    window.removeEventListener("touchstart", handler);
  };
  window.addEventListener("click", handler);
  window.addEventListener("keydown", handler);
  window.addEventListener("touchstart", handler);
}

export function useTTSEnabled(storageKey: string, defaultEnabled: boolean) {
  const [enabled, setEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return defaultEnabled;
    const v = window.localStorage.getItem(storageKey);
    if (v === null) return defaultEnabled;
    return v === "1";
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, enabled ? "1" : "0");
  }, [storageKey, enabled]);
  // Warm up the voice list (some browsers populate asynchronously).
  useEffect(() => {
    const s = ensureSynth();
    if (!s) return;
    pickVoice("default");
    pickVoice("f");
    pickVoice("m");
    pickVoice("axiom");
    const handler = () => {
      pickVoice("default");
      pickVoice("f");
      pickVoice("m");
      pickVoice("axiom");
    };
    s.addEventListener("voiceschanged", handler);
    return () => s.removeEventListener("voiceschanged", handler);
  }, []);
  return { enabled, setEnabled };
}

// -----------------------------------------------------------------------------
// SpeechRecognition (push-to-talk).
// -----------------------------------------------------------------------------

type RecognitionStatus = "idle" | "listening" | "denied" | "unsupported" | "error";

interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((ev: SpeechRecognitionResultLike) => void) | null;
  onerror: ((ev: SpeechRecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionResultLike {
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string; confidence: number };
  }>;
}

interface SpeechRecognitionErrorLike {
  error: string;
  message?: string;
}

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useSpeechRecognition() {
  const [status, setStatus] = useState<RecognitionStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  // True while the user intends to be dictating. Chrome's SpeechRecognition
  // auto-stops after a beat of silence (fires onend); if the user is still
  // holding the mic open we transparently restart it so dictation doesn't die
  // mid-sentence — the #1 cause of "shaky" transcription.
  const wantListeningRef = useRef(false);
  // Text finalized across auto-restarts. Each restart resets ev.results, so we
  // keep a running base of everything already finalized and append the live
  // segment's final + interim on top.
  const committedRef = useRef("");

  useEffect(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setStatus("unsupported");
      return;
    }
    const r = new Ctor();
    r.lang = "en-US";
    r.continuous = true;
    r.interimResults = true;
    r.onresult = (ev) => {
      let finalText = "";
      let interim = "";
      for (let i = 0; i < ev.results.length; i++) {
        const res = ev.results[i];
        if (res.isFinal) finalText += res[0].transcript;
        else interim += res[0].transcript;
      }
      const base = committedRef.current;
      setTranscript(`${base} ${finalText} ${interim}`.replace(/\s+/g, " ").trim());
    };
    r.onerror = (ev) => {
      if (ev.error === "not-allowed" || ev.error === "service-not-allowed") {
        wantListeningRef.current = false;
        setStatus("denied");
      } else if (ev.error === "no-speech" || ev.error === "aborted") {
        // benign — keep listening; onend will restart if still wanted
      } else {
        setStatus("error");
      }
    };
    r.onend = () => {
      // Auto-restart if the user is still holding the mic; otherwise idle.
      if (wantListeningRef.current) {
        // Fold the live segment into the committed base before restarting.
        setTranscript((t) => { committedRef.current = t; return t; });
        try { r.start(); } catch { /* already started race */ }
      } else {
        setStatus("idle");
      }
    };
    recognitionRef.current = r;
    return () => {
      wantListeningRef.current = false;
      r.abort();
      recognitionRef.current = null;
    };
  }, []);

  // Pass `seed` to CONTINUE from existing text (new speech is appended). Omit it
  // to start fresh. This lets a team dictate in chunks — tap, talk, tap, talk —
  // without losing what they already said (the main "stuck at a few lines" fix).
  const start = useCallback((seed?: string) => {
    const r = recognitionRef.current;
    if (!r) return;
    const base = (seed ?? "").trim();
    committedRef.current = base;
    setTranscript(base);
    wantListeningRef.current = true;
    try {
      r.start();
      setStatus("listening");
    } catch {
      // ignore "already started" races
    }
  }, []);

  const stop = useCallback(() => {
    const r = recognitionRef.current;
    if (!r) return;
    wantListeningRef.current = false;
    try {
      r.stop();
    } catch {
      // ignore
    }
  }, []);

  const reset = useCallback(() => {
    committedRef.current = "";
    setTranscript("");
  }, []);

  return { status, transcript, start, stop, reset };
}
