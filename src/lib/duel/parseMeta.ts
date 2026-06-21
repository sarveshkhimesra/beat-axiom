import { TurnMetadata, Stage } from "./types";
import { META_DELIMITER } from "./config";

const DEFAULT_META: TurnMetadata = {
  currentStage: "discovery",
  stageJustUnlocked: null,
  impatienceLevel: 0.05,
  gameOver: false,
  gameOverReason: null,
  hookLine: "",
};

export function parseResponse(raw: string): { message: string; meta: TurnMetadata } {
  const delimIdx = raw.indexOf(META_DELIMITER);
  if (delimIdx === -1) {
    return { message: raw.trim(), meta: { ...DEFAULT_META } };
  }
  const message = raw.slice(0, delimIdx).trim();
  const jsonStr = raw.slice(delimIdx + META_DELIMITER.length).trim();
  try {
    const parsed = JSON.parse(jsonStr) as Partial<TurnMetadata>;
    const meta: TurnMetadata = {
      currentStage: (parsed.currentStage as Stage) ?? "discovery",
      stageJustUnlocked: (parsed.stageJustUnlocked as Stage | null) ?? null,
      impatienceLevel: typeof parsed.impatienceLevel === "number" ? parsed.impatienceLevel : 0.05,
      gameOver: parsed.gameOver === true,
      gameOverReason: parsed.gameOverReason ?? null,
      hookLine: typeof parsed.hookLine === "string" ? parsed.hookLine : "",
    };
    return { message, meta };
  } catch {
    return { message: raw.trim(), meta: { ...DEFAULT_META } };
  }
}
