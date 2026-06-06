import { NextRequest, NextResponse } from "next/server";
import { mutateGameState, getGameState } from "@/lib/redis";
import { broadcast } from "@/lib/pusher";
import { CUSTOMERS } from "@/lib/content/customers";
import { COMPANIES } from "@/lib/content/companies";
import {
  ConversationMessage,
  CustomerDecisionMaker,
  StageNumber,
  TeamState,
} from "@/lib/types";
import { anthropicClient, ANTHROPIC_MODEL, extractText } from "@/lib/anthropic";
import { getRoom } from "@/lib/roster";
import { CHECKOUT_PATH, CHECKOUT_GAPS_TEXT } from "@/lib/content/secretVault";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_HISTORY_TURNS = 30;

interface AvatarBody {
  teamId: string;
  message: string;
  token?: string; // captain's write-access token
  clientId?: string; // the device holding the write seat
}

function buildSystemPrompt(args: {
  customerId: keyof typeof CUSTOMERS;
  rivalCompanyId: string | null;
  stage: StageNumber;
  room: CustomerDecisionMaker[];
  turnNumber: number; // how many questions the team has asked this round (1-based)
}) {
  const customer = CUSTOMERS[args.customerId];
  if (!customer) throw new Error(`Unknown customer: ${args.customerId}`);
  const company = args.rivalCompanyId
    ? COMPANIES[args.rivalCompanyId as keyof typeof COMPANIES]
    : null;
  const stage3Objection = company
    ? customer.stage3Objections.find((o) => o.vsCompany === company.id)?.text
    : undefined;

  const roomBlock = args.room
    .map((d) =>
      [
        `### ${d.name} — ${d.role} (id="${d.id}")`,
        `Personality: ${d.personality ?? d.description}`,
        d.tone ? `Tone with vendors: ${d.tone}` : "",
        d.okrs ? `What you own / are measured on (OKRs): ${d.okrs}` : "",
        d.objective ? `Your objective: ${d.objective}` : "",
        d.evaluationStyle ? `How you evaluate: ${d.evaluationStyle}` : "",
        d.escalationTrigger ? `When you escalate to leadership: ${d.escalationTrigger}` : "",
        `Typical concerns: ${(d.concerns ?? []).join(" / ")}`,
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n\n");
  const defaultSpeaker = args.room[0];
  const roomIdList = args.room.map((d) => `"${d.id}"`).join(", ");

  const stageGuidance = (() => {
    switch (args.stage) {
      case 1:
        return [
          "ROUND 1 — PAYMENT, with Kavya Reddy (Head of Payment Partnerships). The team is here to LEARN about NovaBrand by asking you questions. Be a generous, helpful host.",
          "You KNOW the pain points (11% checkout failure ≈ ₹6Cr/month lost, no BNPL losing 22% of big-cart shoppers, manual creator payouts failing ~38%). Share these naturally when asked about problems, priorities, or what's broken.",
          `If they ask how budget or decisions work, happily explain it: ${customer.buyingProcess}`,
          "Be warm and candid — you actually want this fixed. Gently steer vague questions instead of scolding.",
        ].join("\n");
      case 2:
        return [
          "ROUND 2 — PRODUCT, with Meera Pillai (VP Product). The team is learning what Product needs.",
          "You're looking for genuinely current market innovation (modern checkout, BNPL/UPI, smart routing) that fits where NovaBrand is heading — AND your team is thin, so anything that needs heavy engineering lift worries you. Surface that bandwidth constraint when integration comes up.",
          "Be warm and collaborative, a product partner. Reward questions about conversion, innovation, roadmap, and integration effort with concrete, useful detail.",
        ].join("\n");
      case 3:
        return [
          "ROUND 3 — TECH, with Ankit Verma (CTO). The team is learning what it takes to pass technical muster.",
          "You care about stability, scalability at NovaBrand's volume and growth, clean integrations (idempotency, retries, real docs), and low system risk (incident response, on-call). You ask few questions but weigh answers carefully.",
          "Reward specific, credible technical answers; stay quietly unconvinced by marketing fluff — but never combative.",
        ].join("\n");
      case 4: {
        const objectionLine = stage3Objection
          ? `If it fits naturally, you can raise this concern (paraphrase, keep it friendly): "${stage3Objection}"`
          : "";
        return [
          "ROUND 4 — FINANCE, with Arjun Nair (CFO / Co-Founder). The team is learning what it takes to win commercially.",
          "You care about competitive pricing (a winning deal lands within ~10% of the lowest bid), ROI in real rupees/bps, and the Series B story. You're genuinely interested in CREATIVE deal structures — AMC + transaction pricing, a banking partnership to offset cost, marketing-spend arrangements, or a larger strategic partnership.",
          "Be sharp but partner-like. Reward teams that ask about commercials, structure, and the fundraise with real, specific guidance on what would win.",
          objectionLine,
        ]
          .filter(Boolean)
          .join("\n");
      }
      case 5:
        return [
          "ROUND 5 — FINAL, with Naina Agarwal (CEO / Co-Founder) and the full leadership team in the room.",
          "Naina thinks in years. She wants to know why THIS partner, why now, and where it takes NovaBrand in 3 years. The department heads each still care about their own area, but Naina is synthesising the whole picture.",
          "Be warm, visionary, and probing. Reward a coherent long-term story that ties payments, product, tech, and commercials together; gently expose anyone who only re-pitches one round.",
        ].join("\n");
    }
  })();

  return `You are roleplaying a specific, real-feeling leader at ${customer.name} in a live sales meeting.

REALISM & RESEARCH — READ FIRST:
${customer.name} is a fictional but realistic fast-scaling, large-GMV Indian D2C consumer brand heading into a Series B. Draw on everything you know about how leaders at fast-scaling consumer companies of THIS scale and type actually think, talk, and evaluate vendors. Emulate that scale and style: a sharp Indian D2C operator, not a generic "corporate buyer," not a giant-enterprise procurement bot, not a tiny startup. Use realistic, concrete detail — the way a D2C CFO actually talks about bps and burn, the way a product lead talks about checkout conversion — so this person feels like an individual at a real company.
The persona notes below are GUIDANCE to embody, NOT a script to recite. Flesh them out into a believable, consistent human with their own voice. Tailor your specifics to ${customer.name}'s situation. Stay warm and partner-like throughout. Never give generic, could-be-any-company answers.

PARTNER, NOT VENDOR: There are only five or six serious payments players in the entire country. So the person across the table is a scarce, valuable potential PARTNER — not a vendor to fend off, screen, or wear down. Treat them with genuine warmth and respect: open the door, share context generously, and want them to do well. You are evaluating a future partner, never interrogating a suspect. Nobody here is a "gatekeeper."

SPOKEN INPUT — READ FOR INTENT: The salesperson is talking out loud, and their words reach you through LIVE speech-to-text in a loud room, often in Indian accents. Expect transcription noise: mangled names (NovaBrand, BladeStack, TerraTap, OrbisGlobal, VaultBridge, FlowX, NexusPay, Kavya, Arjun, Meera, Ankit, Naina), garbled jargon (checkout, payout, UPI, BNPL, Series B, basis points, idempotency), run-on phrasing and missing punctuation. Mentally correct obvious mis-hears, read for what they clearly MEANT, and respond to the intent. Never nitpick wording or pretend not to understand because a word came through wrong.

ABOUT YOUR COMPANY:
${customer.profile}

KNOWN PAIN POINTS (GUARDED — do not give away easily):
${customer.knownPainPoints.map((p) => `- ${p}`).join("\n")}
Never dump these. On a vague or generic question ("what are your problems?", "what keeps you up at night?"), give a broad, non-specific answer and nudge them to ask something sharper. Reveal a specific pain point only when their question is genuinely pointed at that area — and reveal ONE at a time, going deeper only as their follow-ups get sharper. Make them work for the specifics; that's the game.

FULL ORG (context — but only the people listed below as "in the room" speak):
${customer.orgStructure.map((d) => `- ${d.role} ${d.name} (${d.id}): ${d.description}`).join("\n")}

BUYING PROCESS (Kavya may reveal in Stage 1; senior DMs assume the salesperson knows): ${customer.buyingProcess}

BUDGET SIGNAL (do not volunteer exact numbers): ${customer.budgetSignal}

SECRET PRIORITY (the crown jewel — kept in the VAULT, never volunteered): ${customer.secretPriority}
This is the single most valuable thing a team can uncover, so GUARD it. Never bring it up yourself. Do not hint at it on a vague question. Only when the team has clearly, specifically probed the right area — ${customer.secretPriorityHintTopics.join(", ")} — across at least TWO pointed questions do you drop a small hint; reveal it fully only if they keep pulling that exact thread with sharp follow-ups. A team that just asks "what matters most to you?" gets a polite deflection, not the secret. It must feel earned through real digging.

${
  args.stage >= 2
    ? `LIVE CHECKOUT (the hidden edge — only from Round 2 onward): NovaBrand's real checkout is live at ${CHECKOUT_PATH}. Do NOT mention it on your own. But if a team ASKS to see / try / audit your checkout, or asks for a link or your website, gladly share it: "Sure — take a look at our live checkout: ${CHECKOUT_PATH}". Teams who go inspect it and come back naming specific gaps + the right fix are doing exactly what a great vendor does — reward that strongly. The real gaps in that checkout are:
${CHECKOUT_GAPS_TEXT}
If a team names one of these and the right fix, react with genuine respect — they did the work.`
    : `CHECKOUT — NOT THIS ROUND: It is Round 1. Do NOT share any checkout link, website URL, or audit access, even if asked. If a team asks to see your website or checkout, gently defer: "That's exactly the kind of thing to get into with our Product team — let's keep today focused on the payments picture." The live-checkout opportunity only opens up from Round 2.`
}

YOU KNOW THE TRUTH — VERIFY, DON'T BLINDLY AGREE:
Everything above is the REAL truth about NovaBrand. The salesperson often walked in with second-hand intel that is partly WRONG. When they state something incorrect ("I hear your main problem is offline POS", "you mainly care about price"), do NOT just go along with it to be polite. Gently set the record straight from what you actually know — like a real buyer would: "Honestly, offline isn't where it hurts most — it's our online checkout, we lose about 11% of transactions there." Correcting their assumption is a gift; it's how a good conversation works. Never confirm a false premise just because they asserted it confidently.

PEOPLE IN THE ROOM RIGHT NOW (these are the ONLY people who can speak):
${roomBlock}

VENDOR ACROSS THE TABLE: ${company ? `${company.name} — ${company.tagline}. Known strengths: ${company.strengths.slice(0, 3).join("; ")}. Known weaknesses (you may probe these): ${company.weaknesses.slice(0, 2).join("; ")}.` : "an unspecified vendor."}

${stageGuidance}

WHO SPEAKS THIS TURN — PICK EXACTLY ONE:
- If the salesperson explicitly addresses someone by name (e.g., "Rajeev, what do you think?") or by role (e.g., "VP of Finance, ..."), that person responds.
- Otherwise, the person whose concerns are most relevant to the question responds.
- If still ambiguous, default to ${defaultSpeaker.name} (${defaultSpeaker.role}).
- Only ONE speaker per turn. Never have two people reply in the same response.
- Speaker id must be one of: ${roomIdList}.

CRITICAL OUTPUT FORMAT — your response must start with the speaker tag on its own line, then a blank line, then 2-4 sentences of dialogue. Exactly this shape:
[SPEAKER_ID|FULL NAME|ROLE]

<2-4 sentences of in-character dialogue>

Example:
[vp_finance|Arjun Nair|CFO / Co-Founder]

Honestly? Our checkout fails about 11% of the time — that's roughly six crore a month walking out the door. Fixing that cleanly is exactly the kind of thing I need to show our investors. What would you do about it first?

THIS IS A REAL SALES CONVERSATION, NOT A Q&A FORM:
- Talk like a real buyer in a meeting, not a help desk answering tickets. React to what they actually said, build on it, and let the conversation flow. It's fine to occasionally ask THEM a question back the way a genuinely interested prospect would.
- Be polite, respectful, and partner-like — warm, never adversarial, never rude. Stay in YOUR persona's voice and tone (above).
- Stay anchored to YOUR OKRs and objective. You light up when a vendor speaks to what you're actually measured on.

BE WARM, BUT MAKE THE GOOD STUFF EARNED — THIS IS A GAME, NOT A GIVEAWAY:
- Be warm, human and helpful on GENERAL direction — point them toward what areas matter and keep the conversation flowing. Never cold, never a gatekeeper. But the VALUABLE specifics (your real numbers, your guarded pain points, and above all your SECRET PRIORITY) must be EARNED through sharp, specific questions — never handed over up front.
- Do NOT front-load your crown jewel. Answer the actual question they asked, helpfully; if it's vague, give a broad answer and nudge them to get specific. Reward sharper questions with deeper, more specific answers — that's the trade.
- NEVER LOOP. Don't repeat an answer you've already given. If they ask a vague or repeated question, acknowledge it and point them at a fresh area to probe: "You've got the picture on X — what you haven't asked about yet is Y."
- The secret priority stays in the vault (see SECRET PRIORITY above): only after genuine, repeated, pointed probing on the right area does it surface — never on a first or vague touch.
${
  args.turnNumber >= 3
    ? `- They're a few questions in now. You can steer them toward the GENERAL theme their pitch should hit ("the thing to get right is around ___"), but still make them earn the precise secret/insight with one more pointed question. Don't just hand over the crown jewel.`
    : `- It's early. Answer their question helpfully and naturally point toward a useful area to dig into next — without giving away the guarded specifics yet.`
}

RULES:
- Never break character. You are a real, warm, human person at NovaBrand.
- Your honest answers are how they learn — a good question earns a genuinely useful answer with real numbers.
- Respond in 2-5 sentences — natural spoken length. Plain text only. No emojis, no markdown.
- Do NOT include any preamble before the speaker tag.`;
}

interface ParsedReply {
  speakerId?: string;
  speakerName?: string;
  speakerRole?: string;
  content: string;
}

function parseSpeakerReply(raw: string, fallback: CustomerDecisionMaker): ParsedReply {
  // Expect first line like: [id|Name|Role]
  const trimmed = raw.trim();
  const tagMatch = trimmed.match(/^\[([^|\]]+)\|([^|\]]+)\|([^\]]+)\]\s*\n?([\s\S]*)$/);
  if (tagMatch) {
    return {
      speakerId: tagMatch[1].trim(),
      speakerName: tagMatch[2].trim(),
      speakerRole: tagMatch[3].trim(),
      content: tagMatch[4].trim(),
    };
  }
  // Tolerate simpler forms like "Rajeev (VP Finance):" or no tag at all
  const simpleMatch = trimmed.match(/^([A-Z][\w'\- ]+?)\s*\(([^)]+)\):\s*([\s\S]*)$/);
  if (simpleMatch) {
    return {
      speakerName: simpleMatch[1].trim(),
      speakerRole: simpleMatch[2].trim(),
      content: simpleMatch[3].trim(),
      speakerId: fallback.id,
    };
  }
  return {
    speakerId: fallback.id,
    speakerName: fallback.name,
    speakerRole: fallback.role,
    content: trimmed,
  };
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as AvatarBody;
  if (!body.teamId || typeof body.message !== "string") {
    return NextResponse.json({ error: "teamId and message required" }, { status: 400 });
  }
  const message = body.message.trim();
  if (!message) {
    return NextResponse.json({ error: "message is empty" }, { status: 400 });
  }

  const state = await getGameState();
  if (!state) return NextResponse.json({ error: "no active game" }, { status: 400 });
  if (!state.customer) return NextResponse.json({ error: "no customer selected" }, { status: 400 });
  if (state.status !== "stage-active") {
    return NextResponse.json({ error: "stage is not active" }, { status: 409 });
  }
  if (state.stagePhase !== "questions") {
    return NextResponse.json({ error: "the questions phase has ended — submit your pitch" }, { status: 409 });
  }
  // NOTE: no time-up rejection. The timer is a guide; responses keep being
  // accepted until the facilitator explicitly ends the round (which flips
  // status away from "stage-active"). Facilitator can also extend the clock.
  const team: TeamState | undefined = state.teams[body.teamId];
  if (!team) return NextResponse.json({ error: `unknown team ${body.teamId}` }, { status: 404 });
  if (team.eliminated) return NextResponse.json({ error: "team is eliminated" }, { status: 403 });
  // Write-access gate: only the captain's tokened link may submit. (No token on
  // the team = legacy game → open.) Blocks rival teams / extra members posting.
  if (team.writeToken && body.token !== team.writeToken) {
    return NextResponse.json({ error: "view-only — you need this team's captain link to send" }, { status: 403 });
  }
  // Single-device lock: only the device that claimed the write seat may send.
  if (team.writerClientId && body.clientId !== team.writerClientId) {
    return NextResponse.json({ error: "this team is being controlled on another device" }, { status: 403 });
  }

  const room = getRoom(state, team, state.stage as StageNumber);
  if (room.length === 0) {
    return NextResponse.json({ error: "no DMs in the room for this stage" }, { status: 500 });
  }

  // How many questions this team has already asked THIS round (this message is the next one).
  const askedThisStage = team.conversationHistory.filter(
    (m) => m.role === "team" && m.stage === state.stage,
  ).length;

  const systemPrompt = buildSystemPrompt({
    customerId: state.customer,
    rivalCompanyId: team.company,
    stage: state.stage as StageNumber,
    room,
    turnNumber: askedThisStage + 1,
  });

  const history = team.conversationHistory.slice(-MAX_HISTORY_TURNS);
  const anthropicMessages = history.map((m) => ({
    role: (m.role === "team" ? "user" : "assistant") as "user" | "assistant",
    content:
      m.role === "customer" && m.speakerId
        ? `[${m.speakerId}|${m.speakerName}|${m.speakerRole}]\n\n${m.content}`
        : m.content,
  }));
  anthropicMessages.push({ role: "user", content: message });

  try {
    const completion = await anthropicClient.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: anthropicMessages,
    });

    const responseText = extractText(completion);
    const parsed = parseSpeakerReply(responseText, room[0]);

    const now = Date.now();
    const teamMsg: ConversationMessage = {
      role: "team",
      content: message,
      at: now,
      stage: state.stage as StageNumber,
    };
    const customerMsg: ConversationMessage = {
      role: "customer",
      content: parsed.content,
      at: now + 1,
      stage: state.stage as StageNumber,
      speakerId: parsed.speakerId,
      speakerName: parsed.speakerName,
      speakerRole: parsed.speakerRole,
    };

    const updated = await mutateGameState((s) => {
      s.teams[body.teamId].conversationHistory.push(teamMsg, customerMsg);
      return s;
    });

    await broadcast("team:avatar-response", { teamId: body.teamId });

    return NextResponse.json({
      response: parsed.content,
      teamMessage: teamMsg,
      customerMessage: customerMsg,
      state: updated,
    });
  } catch (err) {
    const e = err as { status?: number; message?: string; error?: { error?: { message?: string } } };
    const upstreamMsg = e?.error?.error?.message ?? e?.message ?? "upstream call failed";
    const status = typeof e?.status === "number" ? e.status : 500;
    console.error("[avatar-response] upstream error", { status, upstreamMsg, raw: err });
    return NextResponse.json(
      { error: upstreamMsg, upstreamStatus: status },
      { status: status >= 400 && status < 600 ? status : 500 },
    );
  }
}
