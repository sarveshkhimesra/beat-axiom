"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AxiomAvatar } from "./AxiomAvatar";
import { AXIOM_SCORING_GYAAN } from "@/lib/content/axiomLines";
import { speak, stopSpeaking, useTTSEnabled } from "@/lib/useSpeech";
import { playScoringPulse } from "@/lib/sfx";

// Shown while AXIOM scores a round (status === "stage-evaluating"). Instead of a
// dead "scoring…" screen, AXIOM talks — rotating self-talk gyaan — with a tense
// casino-style pulse underneath. Keeps the room engaged through the 10-30s wait.
export function ScoringWait({ stage }: { stage: number }) {
  const { enabled: ttsEnabled } = useTTSEnabled("thedeal:tts:projector", true);
  const [idx, setIdx] = useState(0);
  // Start at a stage-dependent offset so each round opens on a different line.
  const startRef = useRef((stage * 3) % AXIOM_SCORING_GYAAN.length);

  // Show + speak a gyaan line, then a 5-SECOND PAUSE before the next one.
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    let i = 0;
    const showNext = () => {
      if (cancelled) return;
      const line = AXIOM_SCORING_GYAAN[(startRef.current + i) % AXIOM_SCORING_GYAAN.length];
      setIdx(i);
      i += 1;
      let advanced = false;
      const go = () => {
        if (cancelled || advanced) return;
        advanced = true;
        timer = setTimeout(showNext, 5000); // 5s pause between lines
      };
      if (ttsEnabled) {
        speak(line, { rate: 0.95, voice: "axiom", onEnd: go });
        timer = setTimeout(go, Math.max(8000, line.length * 70)); // fallback if onEnd is lost
      } else {
        timer = setTimeout(showNext, 6000); // read time + pause when muted
      }
    };
    showNext();
    return () => {
      cancelled = true;
      clearTimeout(timer);
      stopSpeaking();
    };
  }, [ttsEnabled]);

  // Tense pulse under the talking — a "wheel spinning" build.
  useEffect(() => {
    const pulse = setInterval(() => playScoringPulse(), 2600);
    return () => clearInterval(pulse);
  }, []);

  const line = AXIOM_SCORING_GYAAN[(startRef.current + idx) % AXIOM_SCORING_GYAAN.length];

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-10" style={{ background: "#05060d" }}>
      <motion.div
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <AxiomAvatar size={240} talking />
      </motion.div>
      <div className="font-mono-display muted-text text-xs mt-6 tracking-[0.4em]">
        // STAGE {stage} CLOSED · AXIOM IS SCORING
      </div>
      <div className="font-mono-display text-lg mt-3 pulse-timer" style={{ color: "#3da5ff" }}>
        crunching the room…
      </div>
      <div className="mt-8 max-w-3xl text-center" style={{ minHeight: 72 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.6 }}
            className="font-mono-display text-xl"
            style={{ color: "#cfe2f7" }}
          >
            &ldquo;{line}&rdquo;
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="font-mono-display text-[11px] mt-6" style={{ color: "#2f3a52" }}>
        — AXIOM
      </div>
    </main>
  );
}
