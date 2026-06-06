"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import { COMPANIES } from "@/lib/content/companies";
import { GameState } from "@/lib/types";
import { AxiomAvatar } from "./AxiomAvatar";
import { speak, useTTSEnabled } from "@/lib/useSpeech";
import { playBuzzer } from "@/lib/sfx";

// Full-screen elimination announcement, fired by the facilitator's cut. Two
// flavours: a normal cut, and an "AI detected" flavour framed as AXIOM catching
// AI-assisted play (manual under the hood, but the room reads it as the system).
export function EliminationStage({
  announce,
  state,
}: {
  announce: NonNullable<GameState["elimAnnounce"]>;
  state: GameState;
}) {
  const { enabled: ttsEnabled } = useTTSEnabled("thedeal:tts:projector", true);
  const team = state.teams[announce.teamId];
  const name = team?.company ? COMPANIES[team.company].name : (team?.playerName ?? "—");
  const isAI = announce.reason === "ai";

  useEffect(() => {
    playBuzzer();
    if (ttsEnabled) {
      const line = isAI
        ? `Integrity flag. ${name}. AXIOM has detected A.I.-assisted play. That is an automatic elimination.`
        : `${name} is eliminated.`;
      const t = setTimeout(() => speak(line, { rate: 1.0, voice: "axiom" }), 700);
      return () => clearTimeout(t);
    }
  }, [announce.at, ttsEnabled, isAI, name]);

  const danger = "#ff3d3d";
  const accent = isAI ? "#ffb454" : danger;

  return (
    <main
      className="h-screen w-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: "radial-gradient(circle at 50% 40%, rgba(255,61,61,0.10), #06070d 60%)" }}
    >
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 180, damping: 16 }}
        className="flex flex-col items-center"
      >
        <AxiomAvatar size={150} />

        {isAI ? (
          <div
            className="font-mono-display text-xl tracking-[0.4em] mt-8 px-4 py-1 rounded"
            style={{ color: accent, border: `1px solid ${accent}`, background: "rgba(255,180,84,0.06)" }}
          >
            ⚠ AXIOM INTEGRITY PROTOCOL
          </div>
        ) : (
          <div className="font-mono-display text-xl tracking-[0.5em] mt-8" style={{ color: "#5a6a88" }}>
            // AXIOM RULES
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="font-mono-display tracking-widest mt-6 text-center"
          style={{ fontSize: 84, color: danger, lineHeight: 1.05 }}
        >
          {name}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="font-mono-display text-3xl tracking-[0.3em] mt-3"
          style={{ color: danger }}
        >
          ✗ ELIMINATED
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-lg mt-6 max-w-[60ch] text-center"
          style={{ color: isAI ? accent : "#8fb0e0" }}
        >
          {isAI
            ? "AI-assisted play detected. The Deal is closed to those who don't play it themselves."
            : `Out of The Deal at Round ${team?.eliminatedAtStage ?? state.stage}.`}
        </motion.div>
      </motion.div>
    </main>
  );
}
