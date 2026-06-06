"use client";

import { motion } from "framer-motion";

const COLORS = ["#00f5a0", "#ffaa00", "#ff3d8a", "#3da5ff", "#b388ff", "#ffd166", "#ff6b6b"];

// Looping confetti rain for the winner screen. Index-based pseudo-random (no
// Math.random) so server/client render the same and there's no hydration flash.
export function Confetti({ count = 80 }: { count?: number }) {
  const pieces = Array.from({ length: count }, (_, i) => ({
    i,
    left: (i * 41) % 100,
    delay: (i % 12) * 0.22,
    dur: 3.2 + (i % 6) * 0.6,
    color: COLORS[i % COLORS.length],
    w: 6 + (i % 4) * 2,
    rot: (i * 53) % 360,
    drift: ((i % 7) - 3) * 12,
  }));
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
      {pieces.map((p) => (
        <motion.div
          key={p.i}
          initial={{ y: -60, x: 0, opacity: 0, rotate: p.rot }}
          animate={{ y: "112vh", x: p.drift, opacity: [0, 1, 1, 0.85], rotate: p.rot + 540 }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: "linear" }}
          style={{
            position: "absolute",
            left: `${p.left}%`,
            width: p.w,
            height: p.w * 1.7,
            background: p.color,
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
}
