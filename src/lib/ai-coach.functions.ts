import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const analyzeInput = z.object({
  pgn: z.string().min(2).max(20000),
  result: z.enum(["win", "loss", "draw"]),
  level: z.string().optional(),
});

const askInput = z.object({
  pgn: z.string().min(2).max(20000),
  question: z.string().min(2).max(500),
});

const liveInput = z.object({
  pgn: z.string().min(2).max(20000),
  event: z.enum(["sacrifice", "blunder", "capture_major", "check_given", "check_received", "fork"]),
  san: z.string().min(1).max(10),
  lang: z.enum(["en", "ru"]).optional().default("en"),
});

async function callLovableAi(messages: Array<{ role: string; content: string }>, model = "google/gemini-3-flash-preview") {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages }),
  });
  if (res.status === 429) throw new Error("Rate limited. Try again in a moment.");
  if (res.status === 402) throw new Error("AI credits exhausted. Add credits in workspace settings.");
  if (!res.ok) throw new Error(`AI error ${res.status}`);
  const data = (await res.json()) as any;
  return data.choices?.[0]?.message?.content ?? "";
}

export const analyzeGame = createServerFn({ method: "POST" })
  .inputValidator((d) => analyzeInput.parse(d))
  .handler(async ({ data }) => {
    const sys = `You are an Executive Chess Coach for RichChess. Chess pieces are corporate roles: pawn=Intern, knight=Marketer, bishop=HR, rook=Developer, queen=COO, king=CEO. Speak in corporate metaphors (KPI, runway, takeover, leverage, risk, exposure). Return strict JSON with this shape:
{
  "accuracy_white": number 0-100,
  "accuracy_black": number 0-100,
  "blunders": [{"move_number": int, "san": string, "better": string, "comment": string}],
  "best_move": {"move_number": int, "san": string, "comment": string},
  "summary": string
}`;
    const user = `Game result for current player: ${data.result}. PGN:\n${data.pgn}`;
    const content = await callLovableAi([
      { role: "system", content: sys },
      { role: "user", content: user },
    ]);
    const match = content.match(/\{[\s\S]*\}/);
    try {
      return JSON.parse(match ? match[0] : content);
    } catch {
      return {
        accuracy_white: 70,
        accuracy_black: 70,
        blunders: [],
        best_move: { move_number: 1, san: "", comment: "" },
        summary: content.slice(0, 500),
      };
    }
  });

export const askCoach = createServerFn({ method: "POST" })
  .inputValidator((d) => askInput.parse(d))
  .handler(async ({ data }) => {
    const sys = `You are an Executive Chess Coach. Pieces are corporate roles (Intern, Marketer, HR, Developer, COO, CEO). Answer in 3-5 sentences using corporate language (KPI, runway, takeover, leverage).`;
    const content = await callLovableAi([
      { role: "system", content: sys },
      { role: "user", content: `PGN:\n${data.pgn}\n\nQuestion: ${data.question}` },
    ]);
    return { answer: content };
  });

export const liveCoachComment = createServerFn({ method: "POST" })
  .inputValidator((d) => liveInput.parse(d))
  .handler(async ({ data }) => {
    const language = data.lang === "ru" ? "Russian" : "English";
    const sys = `You are an Executive Chess Coach broadcasting LIVE during the player's game on RichChess. Pieces are corporate roles: pawn=Intern, knight=Marketer, bishop=HR, rook=Developer, queen=COO, king=CEO.
Speak in ${language}, ONE punchy sentence (max 18 words), in corporate metaphors (acquisition, runway, layoffs, leveraged buyout, KPI hit). Be vivid and slightly theatrical. Never explain chess rules. Never use the word "chess".
Event types:
- sacrifice: player gave up material for initiative ("sacrificed the Developer to corner the CEO")
- blunder: player made a costly move ("lost the COO — that's Q3 revenue gone")
- capture_major: captured opponent's queen/rook ("hostile takeover of their COO")
- check_given: put opponent in check ("CEO of the rival firm is cornered")
- check_received: opponent attacks player's king ("your CEO is under SEC investigation — escape now")
- fork: double-attack landed`;
    const user = `Event: ${data.event}. Move played: ${data.san}. Recent PGN tail: ${data.pgn.slice(-300)}`;
    const content = await callLovableAi([
      { role: "system", content: sys },
      { role: "user", content: user },
    ]);
    return { comment: content.trim().replace(/^["']|["']$/g, "").slice(0, 180) };
  });
