"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { combineSegments, committedText, liveText } from "./transcript";

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
 *
 * CRITICAL invariant — no feedback loop:
 * The text that existed before the current speaking session ("base") is a
 * SNAPSHOT captured once in start(). We never read our own onText() output
 * back in as the base. Doing so (the previous bug) caused runaway duplication:
 * each recognition event re-appended the whole accumulated transcript onto a
 * base that already contained it, producing "...quickhi I want to have a
 * quickhi I want to have a quick discussionhi...".
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
  // Latest external text — read ONLY when a new session starts, never used as
  // the running base during a session (that would create a feedback loop).
  const latestText = useRef(opts.currentText);
  latestText.current = opts.currentText;
  // Snapshot of text that existed before the current speaking session begins.
  const baseSnapshot = useRef("");
  // Finalized transcript accumulated across the current speaking session
  // (survives browser auto-restarts; reset on intentional start/pause).
  const sessionFinalized = useRef("");

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

    // Holds the current rec instance's finalized text, folded into the
    // session accumulator on (auto-)restart so e.results resetting is safe.
    let pendingInstanceFinal = "";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      // In continuous mode `e.results` holds every result for THIS recognition
      // instance from index 0. Recompute the full final/interim split each time;
      // this instance's finalized text fully replaces (not appends to) the
      // per-instance accumulator.
      const segments = [];
      for (let i = 0; i < e.results.length; i++) {
        segments.push({ transcript: e.results[i][0].transcript, isFinal: e.results[i].isFinal });
      }
      const { finalized, interim: interimPart } = combineSegments(segments);

      setInterim(interimPart);

      // Always derive from the immutable base snapshot — never from our own output.
      onText.current(liveText(baseSnapshot.current, sessionFinalized.current, finalized, interimPart));

      // Stash this instance's finalized text so an auto-restart preserves it.
      pendingInstanceFinal = finalized;
    };

    rec.onend = () => {
      // Fold this instance's finalized text into the session accumulator and
      // commit clean text (no interim artifacts) to the input.
      const committed = committedText(baseSnapshot.current, sessionFinalized.current, pendingInstanceFinal);
      sessionFinalized.current = committedText("", sessionFinalized.current, pendingInstanceFinal);
      pendingInstanceFinal = "";
      onText.current(committed);
      setInterim("");

      if (!intentionalStop.current) {
        // Browser killed us (timeout/silence) but the user didn't pause.
        // e.results will reset on restart — the session accumulator above
        // already captured what we had, so restarting appends cleanly.
        try {
          rec.start();
        } catch {
          setListening(false);
        }
      } else {
        // Intentional pause: lock the committed text in as the new base so a
        // later resume appends after it.
        baseSnapshot.current = committed;
        sessionFinalized.current = "";
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
    // Snapshot the text that exists right now; new speech appends after it.
    baseSnapshot.current = latestText.current;
    sessionFinalized.current = "";
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
