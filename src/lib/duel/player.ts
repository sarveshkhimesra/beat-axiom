"use client";
import { PlayerProfile, TemplateId } from "./types";

const STORAGE_KEY = "beat-axiom:player";

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage ?? null;
}

export function getPlayer(): PlayerProfile | null {
  const s = storage();
  if (!s) return null;
  try {
    const raw = s.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PlayerProfile) : null;
  } catch { return null; }
}

export function savePlayer(profile: PlayerProfile): void {
  const s = storage();
  if (!s) return;
  s.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function createPlayer(username: string): PlayerProfile {
  const profile: PlayerProfile = { username, games: [] };
  savePlayer(profile);
  return profile;
}

export function recordGame(game: { templateId: TemplateId; score: number; title: string; shareId: string }): void {
  const profile = getPlayer();
  if (!profile) return;
  profile.games.push({ ...game, date: Date.now() });
  if (profile.games.length > 50) profile.games = profile.games.slice(-50);
  savePlayer(profile);
}
