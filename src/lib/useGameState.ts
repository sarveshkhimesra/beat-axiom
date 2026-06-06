"use client";

import { useEffect, useState, useCallback } from "react";
import { subscribeGame, getPusherConnection } from "./pusherClient";
import { GameState, computeTimeRemainingSec } from "./types";

export function computeRemaining(state: GameState | null): number {
  if (!state) return 0;
  return computeTimeRemainingSec(state);
}

export function useGameState(pollMs: number = 5000): {
  state: GameState | null;
  loading: boolean;
  refresh: () => Promise<void>;
} {
  const [state, setState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const r = await fetch("/api/game/state", { cache: "no-store" });
    const j = await r.json();
    setState(j.state ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const channel = subscribeGame();
    const handler = () => {
      void refresh();
    };
    channel.bind("game:updated", handler);
    channel.bind("game:stage-start", handler);
    channel.bind("game:stage-end", handler);
    channel.bind("game:stage-evaluating", handler);
    channel.bind("team:avatar-response", handler);
    // Re-sync on reconnect (e.g., projector tab regained focus after throttling).
    getPusherConnection().bind("connected", handler);
    // Polling backstop: if a Pusher event is ever dropped (flaky wifi, a tab that
    // reconnected late, Pusher at capacity), every screen still converges — so
    // the projector NEVER needs a manual refresh. The projector passes a short
    // interval so video/elimination/score switches feel instant even when the
    // realtime push is slow; other screens use the default to spare quota.
    const poll = setInterval(() => { void refresh(); }, pollMs);
    return () => {
      clearInterval(poll);
      channel.unbind("game:updated", handler);
      channel.unbind("game:stage-start", handler);
      channel.unbind("game:stage-end", handler);
      channel.unbind("game:stage-evaluating", handler);
      channel.unbind("team:avatar-response", handler);
      try { getPusherConnection().unbind("connected", handler); } catch { /* noop */ }
    };
  }, [refresh, pollMs]);

  return { state, loading, refresh };
}

export function useCountdown(state: GameState | null): number {
  const [remaining, setRemaining] = useState(() => computeRemaining(state));
  useEffect(() => {
    setRemaining(computeRemaining(state));
    if (!state || state.status !== "stage-active") return;
    const id = setInterval(() => setRemaining(computeRemaining(state)), 250);
    return () => clearInterval(id);
  }, [state]);
  return remaining;
}

export function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}
