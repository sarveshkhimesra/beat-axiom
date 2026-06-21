import { NextRequest, NextResponse } from "next/server";
import { DUEL_PAUSED } from "@/lib/duel/config";
import { getTemplate } from "@/lib/duel/templates";
import { generateScenario } from "@/lib/duel/variator";
import { TemplateId, ClientScenario } from "@/lib/duel/types";
import { createGame } from "@/lib/duel/gameStore";

export const runtime = "nodejs";
export const maxDuration = 30;

interface Body {
  templateId: TemplateId;
  filters?: { industry?: string };
}

export async function POST(req: NextRequest) {
  if (DUEL_PAUSED) return NextResponse.json({ error: "AXIOM is resting." }, { status: 503 });

  const body = (await req.json()) as Body;
  if (!body.templateId) return NextResponse.json({ error: "templateId required" }, { status: 400 });

  let template;
  try {
    template = getTemplate(body.templateId);
  } catch {
    return NextResponse.json({ error: "unknown template" }, { status: 404 });
  }

  try {
    const scenario = await generateScenario(template, body.filters);
    // Store full scenario server-side; return only safe fields to client
    const gameId = await createGame(scenario);

    const clientScenario: ClientScenario = {
      gameId,
      templateId: scenario.templateId,
      title: scenario.title,
      companyName: scenario.companyName,
      buyerName: scenario.buyerName,
      buyerRole: scenario.buyerRole,
      product: scenario.product,
      sellerStrength: scenario.sellerStrength,
      sellerWeakness: scenario.sellerWeakness,
      brief: scenario.brief,
    };

    return NextResponse.json({ scenario: clientScenario });
  } catch (err) {
    const e = err as { message?: string };
    console.error("[duel/start] variator error", e);
    return NextResponse.json({ error: e?.message ?? "scenario generation failed" }, { status: 502 });
  }
}
