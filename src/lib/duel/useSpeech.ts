"use client";

import { useEffect, useRef, useState } from "react";

/** Push-to-talk speech-to-text via the browser Web Speech API. Returns a
 * `toggle` to start/stop, a `listening` flag, and whether the browser supports
 * it. Each result (interim + final) is delivered to `onText`. */
export function useSpeech(onText: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recRef = useRef<{ start: () => void; stop: () => void; abort: () => void } | null>(null);
  const cb = useRef(onText);
  cb.current = onText;

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
    rec.continuous = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      let txt = "";
      for (let i = 0; i < e.results.length; i++) txt += e.results[i][0].transcript;
      cb.current(txt);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    return () => {
      try {
        rec.abort();
      } catch {
        /* ignore */
      }
    };
  }, []);

  function toggle() {
    const rec = recRef.current;
    if (!rec) return;
    if (listening) {
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
      setListening(false);
    } else {
      try {
        rec.start();
        setListening(true);
      } catch {
        /* ignore */
      }
    }
  }

  return { listening, supported, toggle };
}
