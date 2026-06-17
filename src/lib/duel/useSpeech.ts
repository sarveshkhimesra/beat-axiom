"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Robust speech-to-text hook with continuous capture + append behavior.
 *
 * Key design:
 * - `continuous: true` — keeps listening through pauses, no premature cutoff.
 * - Appends: pressing mic again adds to existing text (never overwrites).
 * - Interim results shown live so the user sees what's being captured.
 * - Auto-restarts on unexpected end (browser kills speech after ~60s silence;
 *   we restart transparently if the user hasn't explicitly paused).
 * - `pause()` = stop mic, keep all captured text intact.
 * - `toggle()` = start/pause.
 */
export function useSpeech(opts: {
  /** Current input value — new speech is appended after this. */
  currentText: string;
  /** Called with the full updated text (existing + new speech). */
  onText: (text: string) => void;
}) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [supported, setSupported] = useState(false);

  // Track whether the user has intentionally paused (vs browser auto-ending).
  const intentionalStop = useRef(false);
  // Ref to the latest currentText so the append logic always reads fresh state.
  const baseText = useRef(opts.currentText);
  baseText.current = opts.currentText;
  const onText = useRef(opts.onText);
  onText.current = opts.onText;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const Ctor =
      (window as unknown as { SpeechRecognition?: new () => unknown }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition;
    if (!Ctor) return;
    setSupported(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec: any = new (Ctor as new () => unknown)();
    rec.lang = "en-IN";
    rec.interimResults = true;
    rec.continuous = true;
    rec.maxAlternatives = 1;

    // Track finalized text accumulated THIS session (between start/pause).
    let sessionFinalized = "";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      let finalized = "";
      let interimPart = "";
      for (let i = 0; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          finalized += transcript;
        } else {
          interimPart += transcript;
        }
      }
      sessionFinalized = finalized;
      setInterim(interimPart);

      // Build the full text: what was in the box before + finalized speech + interim preview
      const base = baseText.current;
      const separator = base && !base.endsWith(" ") ? " " : "";
      const fullText = base + separator + (sessionFinalized + " " + interimPart).trim();
      onText.current(fullText);
    };

    rec.onend = () => {
      // Commit any finalized text permanently into the input (drop interim).
      if (sessionFinalized) {
        const base = baseText.current;
        // The onresult handler already pushed text, but let's make sure the
        // final commit is clean (no trailing interim artifacts).
        const separator = base && !base.endsWith(" ") ? " " : "";
        const committed = base + separator + sessionFinalized.trim();
        onText.current(committed);
        // Update baseText so the next restart appends correctly.
        baseText.current = committed;
        sessionFinalized = "";
      }
      setInterim("");

      // Auto-restart if the browser killed us (timeout/silence) but user didn't pause.
      if (!intentionalStop.current) {
        try {
          rec.start();
        } catch {
          setListening(false);
        }
      } else {
        setListening(false);
      }
    };

    rec.onerror = () => {
      setInterim("");
      setListening(false);
    };

    recRef.current = rec;
    return () => {
      try { rec.abort(); } catch { /* ignore */ }
    };
  }, []);

  const start = useCallback(() => {
    const rec = recRef.current;
    if (!rec || listening) return;
    intentionalStop.current = false;
    try {
      rec.start();
      setListening(true);
    } catch { /* ignore */ }
  }, [listening]);

  const pause = useCallback(() => {
    const rec = recRef.current;
    if (!rec || !listening) return;
    intentionalStop.current = true;
    try { rec.stop(); } catch { /* ignore */ }
    setListening(false);
    setInterim("");
  }, [listening]);

  const toggle = useCallback(() => {
    if (listening) pause();
    else start();
  }, [listening, pause, start]);

  return { listening, interim, supported, toggle, start, pause };
}
