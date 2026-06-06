"use client";

import { useEffect, useRef, useState } from "react";
import { ConsoleLine } from "@/lib/types";

// Renders the facilitator's actions as a live Claude-Code-style terminal on the
// projector. The newest command types out character-by-character; everything
// before it is shown as completed history. `big` = full lobby screen; otherwise
// a compact strip pinned at the top during play.
export function ProjectorConsole({ lines, big }: { lines: ConsoleLine[]; big?: boolean }) {
  const last = lines[lines.length - 1];
  const [typed, setTyped] = useState("");
  const [cmdDone, setCmdDone] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Type out the newest command, then reveal its output.
  useEffect(() => {
    if (!last) return;
    setTyped("");
    setCmdDone(false);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setTyped(last.cmd.slice(0, i));
      if (i >= last.cmd.length) {
        clearInterval(id);
        setCmdDone(true);
      }
    }, 38);
    return () => clearInterval(id);
  }, [last?.at, last?.cmd]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [typed, cmdDone, lines.length]);

  const history = lines.slice(0, -1);
  const visible = big ? history.slice(-14) : history.slice(-3);

  return (
    <div
      className="font-mono w-full"
      style={{
        background: "#05060a",
        border: "1px solid #1f3a2a",
        borderRadius: 10,
        boxShadow: big ? "0 0 60px rgba(0,245,160,0.08)" : "none",
      }}
    >
      {/* title bar */}
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={{ borderBottom: "1px solid #14241a" }}
      >
        <span style={{ width: 10, height: 10, borderRadius: 9, background: "#ff5f56", display: "inline-block" }} />
        <span style={{ width: 10, height: 10, borderRadius: 9, background: "#ffbd2e", display: "inline-block" }} />
        <span style={{ width: 10, height: 10, borderRadius: 9, background: "#27c93f", display: "inline-block" }} />
        <span className="ml-2 text-xs" style={{ color: "#5a7" }}>
          deal@axiom — facilitator control
        </span>
      </div>

      <div
        ref={scrollRef}
        className="px-4 py-3 overflow-y-auto"
        style={{ maxHeight: big ? "52vh" : "8.5rem", fontSize: big ? 22 : 13, lineHeight: 1.7 }}
      >
        {visible.map((l, i) => (
          <div key={i} className="mb-1">
            <div style={{ color: "#00f5a0" }}>
              <span style={{ color: "#5a7" }}>$</span> {l.cmd}
            </div>
            {l.out && <div style={{ color: "#7c86a0" }}>↳ {l.out}</div>}
          </div>
        ))}
        {last && (
          <div className="mb-1">
            <div style={{ color: "#00f5a0" }}>
              <span style={{ color: "#5a7" }}>$</span> {typed}
              {!cmdDone && <span className="cursor-blink">▋</span>}
            </div>
            {cmdDone && last.out && <div style={{ color: "#8be9b0" }}>↳ {last.out}</div>}
          </div>
        )}
      </div>

      <style jsx>{`
        .cursor-blink {
          animation: blink 1s step-start infinite;
        }
        @keyframes blink {
          50% {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
