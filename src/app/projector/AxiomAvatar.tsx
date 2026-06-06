"use client";

import { motion } from "framer-motion";

/**
 * Geometric AI character: hexagon outline with a glowing core and orbiting accents.
 * Pure SVG + Framer Motion. No audio. No external assets.
 */
// Blue geometric AI persona. `talking` makes the core/mouth pulse faster, as if
// speaking. Colors default to a cool electric blue.
export function AxiomAvatar({
  size = 180,
  primary = "#3da5ff",
  secondary = "#8fd0ff",
  talking = false,
}: {
  size?: number;
  primary?: string;
  secondary?: string;
  talking?: boolean;
}) {
  const corePulse = talking ? 0.5 : 1.8;
  const mouthGap = talking ? [115, 122, 115] : [117, 118, 117];
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* outer tetrahedron-style frame */}
        <motion.polygon
          points="100,12 184,156 16,156"
          fill="none"
          stroke={primary}
          strokeWidth="1.5"
          opacity="0.55"
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          style={{ originX: "100px", originY: "108px" }}
        />
        {/* inner hex shell */}
        <motion.polygon
          points="100,40 145,67 145,133 100,160 55,133 55,67"
          fill={`${primary}10`}
          stroke={primary}
          strokeWidth="2"
          animate={{ rotate: -360 }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          style={{ originX: "100px", originY: "100px" }}
        />
        {/* circuit traces */}
        <line x1="100" y1="60" x2="100" y2="80" stroke={secondary} strokeWidth="1.5" />
        <line x1="80" y1="70" x2="120" y2="70" stroke={secondary} strokeWidth="1.5" />
        {/* eyes */}
        <motion.circle cx="82" cy="95" r="4.5" fill={primary}
          animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }} />
        <motion.circle cx="118" cy="95" r="4.5" fill={primary}
          animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut", delay: 0.2 }} />
        {/* mouth — opens when talking */}
        <motion.line x1="82" x2="118" stroke={secondary} strokeWidth="2"
          animate={{ y1: mouthGap, y2: mouthGap }}
          transition={{ duration: talking ? 0.32 : 2, repeat: Infinity, ease: "easeInOut" }} />
        {/* glowing core */}
        <motion.circle cx="100" cy="100" r="6" fill={primary}
          animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: corePulse, repeat: Infinity, ease: "easeInOut" }} />
      </motion.svg>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, ${primary}30 0%, ${primary}00 62%)`,
          filter: "blur(22px)",
        }}
      />
    </div>
  );
}
