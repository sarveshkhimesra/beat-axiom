"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { AxiomAvatar } from "./AxiomAvatar";
import { CUSTOMERS } from "@/lib/content/customers";
import { buildDemoScript } from "@/lib/demoScript";
import { speak, stopSpeaking, useTTSEnabled } from "@/lib/useSpeech";
import { playDemoStart, playDemoStep, playDemoEnd, unlockAudio } from "@/lib/sfx";
import { GameState } from "@/lib/types";

interface AxiomDemoProps {
  state: GameState;
}

const BLUE = "#3da5ff";
const BLUE_SOFT = "#8fd0ff";

// Cinematic, AUTO-PLAYING intro. Once the facilitator starts the demo, the
// projector runs the whole sequence on its own — slow, with the AI face as the
// hero, big title cards, and subtitles along the bottom. No clicking through.
export function AxiomDemo({ state }: AxiomDemoProps) {
  const { enabled: ttsEnabled, setEnabled: setTtsEnabled } = useTTSEnabled("thedeal:tts:projector", true);
  const [beat, setBeat] = useState(0);
  const [talking, setTalking] = useState(false);
  const customer = state.customer ? CUSTOMERS[state.customer] : null;
  const script = state.customer ? buildDemoScript(state.customer) : [];
  const step = script[beat];
  const isLast = beat >= script.length - 1;
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Drive each beat: cue + voice + subtitle, then advance ONLY when the voice
  // finishes (so audio never overlaps). A generous fallback timer covers the
  // case where the browser drops onend, or voice is muted.
  useEffect(() => {
    if (!step) return;
    unlockAudio();
    if (step.cue === "open") playDemoStart();
    else if (step.cue === "close") playDemoEnd();
    else playDemoStep();

    const lead = step.cue === "open" ? 1600 : 700; // let the title land + sfx clear first
    const timers = timersRef.current;
    const t = (fn: () => void, ms: number) => { const id = setTimeout(fn, ms); timers.push(id); return id; };
    let advanced = false;
    const goNext = () => {
      if (advanced || isLast) return;
      advanced = true;
      setTalking(false);
      setBeat((b) => b + 1);
    };

    if (ttsEnabled) {
      t(() => {
        setTalking(true);
        // Advance ~1s after the line actually ends — never before.
        speak(step.speech, { rate: 0.95, voice: "axiom", onEnd: () => { setTalking(false); t(goNext, 1100); } });
      }, lead);
      // Fallback if onend never fires (rough upper bound on speech length).
      t(goNext, lead + Math.max(11000, step.speech.length * 130));
    } else {
      // Muted: advance on a readable dwell so subtitles can be read.
      t(goNext, Math.min(15000, Math.max(6500, step.speech.length * 80)));
    }

    return () => {
      timers.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [beat, step, ttsEnabled, isLast]);

  useEffect(() => {
    if (!ttsEnabled) {
      stopSpeaking();
      setTalking(false);
    }
  }, [ttsEnabled]);

  if (!step) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: "#05060d" }}>
        <div className="muted-text font-mono-display">no intro script — pick a customer first</div>
      </main>
    );
  }

  const isOpen = step.cue === "open";
  const isClose = step.cue === "close";
  const isPomp = isOpen || isClose;

  return (
    <main className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center px-10" style={{ background: "#04050b" }}>
      {/* Drifting ambient glows */}
      <motion.div aria-hidden className="pointer-events-none absolute"
        style={{ width: 980, height: 980, borderRadius: "50%", background: `radial-gradient(circle, ${BLUE}22 0%, transparent 60%)`, filter: "blur(50px)" }}
        animate={{ x: [-170, 130, -170], y: [-130, 90, -130] }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div aria-hidden className="pointer-events-none absolute"
        style={{ width: 800, height: 800, borderRadius: "50%", background: "radial-gradient(circle, #7b2fff22 0%, transparent 60%)", filter: "blur(60px)" }}
        animate={{ x: [190, -130, 190], y: [130, -100, 130] }}
        transition={{ duration: 34, repeat: Infinity, ease: "easeInOut" }} />
      {/* Faint grid, masked to center */}
      <div aria-hidden className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "linear-gradient(rgba(61,165,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(61,165,255,0.05) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(circle at center, black 28%, transparent 78%)",
        }} />
      {isPomp && (
        <motion.div aria-hidden initial={{ opacity: 0 }} animate={{ opacity: [0, 0.85, 0.35] }}
          transition={{ duration: 1.6, times: [0, 0.25, 1] }} className="pointer-events-none absolute inset-0"
          style={{ boxShadow: `inset 0 0 260px ${BLUE}40, inset 0 0 100px #7b2fff33` }} />
      )}

      <button className="btn text-xs absolute top-6 right-6 z-20" onClick={() => setTtsEnabled(!ttsEnabled)}>
        {ttsEnabled ? "🔊 VOICE ON" : "🔇 VOICE OFF"}
      </button>

      {/* The AI host — emerges in 3D */}
      <div style={{ perspective: 1100 }} className="relative z-10">
        <motion.div
          initial={{ scale: 0.2, rotateX: 35, opacity: 0 }}
          animate={{
            scale: 1,
            rotateX: 0,
            opacity: 1,
            rotateY: isPomp ? [0, 8, -8, 0] : 0,
          }}
          transition={{
            scale: { duration: 1.4, ease: "easeOut" },
            rotateX: { duration: 1.4, ease: "easeOut" },
            opacity: { duration: 1.0 },
            rotateY: { duration: 9, repeat: Infinity, ease: "easeInOut" },
          }}
          style={{ transformStyle: "preserve-3d" }}
        >
          <AxiomAvatar size={isOpen ? 300 : 220} primary={BLUE} secondary={BLUE_SOFT} talking={talking} />
        </motion.div>
      </div>

      {/* Title card */}
      <div className="relative z-10 w-full max-w-4xl text-center mt-8" style={{ minHeight: 150 }}>
        <AnimatePresence mode="wait">
          <motion.div key={beat}
            initial={{ opacity: 0, y: 26, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -18, filter: "blur(10px)" }}
            transition={{ duration: 0.7, ease: "easeOut" }}>
            <div className="font-mono-display text-xs tracking-[0.45em] mb-3" style={{ color: "#4a5a78" }}>
              {step.badge}
            </div>
            <h1 className="font-mono-display tracking-widest"
              style={{
                fontSize: isOpen ? "6rem" : isClose ? "4.2rem" : "3rem",
                lineHeight: 1.04,
                color: "#eaf4ff",
                textShadow: `0 0 36px ${BLUE}66`,
              }}>
              {step.title}
            </h1>
            {customer && isOpen && (
              <div className="font-mono-display text-sm mt-3" style={{ color: "#5a6a88" }}>
                presented by AXIOM · facilitated by Rahul
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Subtitles — for reference, always shown even if voice is muted */}
      <div className="absolute bottom-16 left-0 right-0 flex justify-center px-10 z-10">
        <AnimatePresence mode="wait">
          <motion.div key={`sub-${beat}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl text-center font-mono-display text-lg px-6 py-3 rounded-lg"
            style={{ background: "rgba(4,5,11,0.7)", border: "1px solid #1a2740", color: "#cfe2f7" }}>
            {step.speech}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Beat progress + status */}
      <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-3 z-10">
        <div className="flex gap-2">
          {script.map((_, i) => (
            <div key={i} style={{ width: i === beat ? 24 : 7, height: 7, borderRadius: 9, background: i === beat ? BLUE : "#1f2c44", transition: "all 0.4s" }} />
          ))}
        </div>
        {isLast && (
          <div className="font-mono-display text-xs" style={{ color: "#3a4a68" }}>
            Facilitator: start Round 1 when ready.
          </div>
        )}
      </div>
    </main>
  );
}
