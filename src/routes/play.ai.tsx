import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { Chess } from "chess.js";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, Crown, RotateCcw, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { ChessGame } from "@/components/ChessGame";
import { ChessClock, parseTimeControl } from "@/components/ChessClock";
import { useI18n } from "@/lib/i18n";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { getBestMove, type AiLevel } from "@/lib/stockfish";
import { sanToCorporate } from "@/lib/pieces";
import { supabase } from "@/integrations/supabase/client";
import { analyzeGame, askCoach } from "@/lib/ai-coach.functions";
import { useServerFn } from "@tanstack/react-start";

const search = z.object({
  tc: z.string().optional().default("10+0"),
  level: z.enum(["intern", "manager", "director", "ceo"]).optional().default("manager"),
  bet: z.coerce.number().optional().default(0),
});

export const Route = createFileRoute("/play/ai")({ validateSearch: search, component: AiGame });

function AiGame() {
  const { t, lang } = useI18n();
  const { profile, user } = useRequireAuth();
  const navigate = useNavigate();
  const { level, bet, tc } = Route.useSearch();
  const { initialMs, incMs } = parseTimeControl(tc);
  const [chess] = useState(() => new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [history, setHistory] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [thinking, setThinking] = useState(false);
  const [over, setOver] = useState<null | { result: "win" | "loss" | "draw"; reason: string }>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [coachQ, setCoachQ] = useState("");
  const [coachA, setCoachA] = useState("");
  const savedRef = useRef(false);
  const analyze = useServerFn(analyzeGame);
  const ask = useServerFn(askCoach);

  const placeBetOnce = useRef(false);
  useEffect(() => {
    if (bet > 0 && user && !placeBetOnce.current) {
      placeBetOnce.current = true;
      supabase.rpc("place_bet", { p_amount: bet }).then(({ data }) => {
        if (data === false) toast.error("Insufficient Corporate Budget");
      });
    }
  }, [bet, user]);

  // AI move on black's turn
  useEffect(() => {
    if (over || chess.turn() !== "b" || chess.isGameOver()) return;
    let cancelled = false;
    setThinking(true);
    getBestMove(chess.fen(), level as AiLevel)
      .then((uci) => {
        if (cancelled || !uci) return;
        const from = uci.slice(0, 2);
        const to = uci.slice(2, 4);
        const promo = uci.length >= 5 ? uci[4] : undefined;
        try {
          const m = chess.move({ from, to, promotion: (promo as any) ?? "q" });
          if (m) {
            setFen(chess.fen());
            setLastMove({ from, to });
            setHistory((h) => [...h, m.san]);
          }
        } catch {}
      })
      .catch(() => toast.error("AI engine error"))
      .finally(() => !cancelled && setThinking(false));
    return () => {
      cancelled = true;
    };
  }, [fen, over, level, chess]);

  // Detect game over
  useEffect(() => {
    if (over || !chess.isGameOver()) return;
    let result: "win" | "loss" | "draw" = "draw";
    let reason = t("draw");
    if (chess.isCheckmate()) {
      const loserIsWhite = chess.turn() === "w";
      result = loserIsWhite ? "loss" : "win";
      reason = loserIsWhite ? t("youLost") : t("youWon");
    }
    setOver({ result, reason });
    if (!savedRef.current && user) {
      savedRef.current = true;
      const eloDelta = result === "win" ? 15 : result === "loss" ? -10 : 2;
      supabase
        .from("games")
        .insert({
          white_player_id: user.id,
          pgn: chess.pgn(),
          result,
          game_mode: "vs_ai",
          ai_difficulty: level,
          bet,
        })
        .then(() => {});
      supabase.rpc("settle_game", { p_result: result, p_bet: bet, p_elo_delta: eloDelta }).then(() => {});
    }
  }, [fen, over, chess, user, profile, bet, level, t]);

  const handleMove = (m: { from: string; to: string; san: string; fen: string }) => {
    setFen(m.fen);
    setLastMove({ from: m.from, to: m.to });
    setHistory((h) => [...h, m.san]);
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const a = await analyze({ data: { pgn: chess.pgn(), result: over?.result ?? "draw", level } });
      setAnalysis(a);
    } catch (e: any) {
      toast.error(e?.message ?? "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const askQuestion = async () => {
    if (!coachQ.trim()) return;
    setCoachA("...");
    try {
      const r = await ask({ data: { pgn: chess.pgn(), question: coachQ } });
      setCoachA(r.answer);
    } catch (e: any) {
      setCoachA(e?.message ?? "Coach unavailable");
    }
  };

  const reset = () => navigate({ to: "/play" });

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="flex items-center justify-between mb-4">
          <Button asChild variant="ghost" size="sm">
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-1" /> {t("backToDashboard")}
            </Link>
          </Button>
          <div className="text-sm">
            <span className="text-muted-foreground">vs </span>
            <span className="font-semibold text-gold capitalize">{level}</span>
            {bet > 0 && <span className="ml-3 font-mono text-gold">${bet} CB</span>}
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr,340px] gap-6">
          <div className="relative">
            <div className="bg-card border border-border rounded-2xl p-3 md:p-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground mb-2 px-1">
                <span className="flex items-center gap-1">
                  <Crown className="h-3 w-3 text-destructive" /> AI ({level})
                </span>
                <span>{thinking ? t("aiThinking") : ""}</span>
              </div>
              <ChessGame
                externalChess={chess}
                fen={fen}
                disabled={thinking || !!over || chess.turn() !== "w"}
                theme={(profile?.board_theme as any) ?? "wall_street"}
                lastMove={lastMove}
                onMove={handleMove}
              />
              <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground mt-2 px-1">
                <span className="flex items-center gap-1">
                  <Crown className="h-3 w-3 text-gold" /> {profile?.username ?? "You"}
                </span>
                <span>{chess.turn() === "w" && !over ? t("yourTurn") : ""}</span>
              </div>
            </div>

            {over && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-2xl"
              >
                <div className="bg-card border border-gold rounded-xl p-6 text-center glow-gold max-w-sm">
                  <div className="text-4xl mb-2">{over.result === "win" ? "🏆" : over.result === "loss" ? "📉" : "🤝"}</div>
                  <h2 className="text-xl font-bold mb-2">{over.reason}</h2>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={runAnalysis} disabled={analyzing} className="flex-1">
                      <Sparkles className="h-4 w-4 mr-1" /> {analyzing ? "..." : t("aiAnalysis")}
                    </Button>
                    <Button variant="outline" onClick={reset}>
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <aside className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-4">
            <ChessClock
              initialMs={initialMs}
              incMs={incMs}
              activeColor={chess.turn()}
              running={!over && history.length > 0}
              onFlag={(c) => {
                if (over) return;
                const r = c === "w" ? "loss" : "win";
                setOver({ result: r, reason: r === "win" ? t("youWon") : t("youLost") });
              }}
              label={{ w: profile?.username ?? "You", b: `AI ${level}` }}
            />
            <div>
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{t("moveHistory")}</h3>
              <div className="bg-background/40 rounded-md p-2 max-h-48 overflow-y-auto text-sm font-mono space-y-1">
                {history.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4 text-xs">No moves yet</p>
                ) : (
                  history.map((san, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-muted-foreground w-6">{Math.floor(i / 2) + 1}.</span>
                      <span className="flex-1">{sanToCorporate(san, t)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  if (confirm("Resign?")) setOver({ result: "loss", reason: t("youLost") });
                }}
              >
                {t("resign")}
              </Button>
              <Button variant="ghost" className="flex-1" onClick={reset}>
                <RotateCcw className="h-4 w-4 mr-1" /> {t("newGame")}
              </Button>
            </div>

            {analysis && (
              <div className="border-t border-border pt-4 space-y-3">
                <h3 className="text-xs uppercase tracking-wider text-gold flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> {t("aiAnalysis")}
                </h3>
                <div className="flex justify-between text-sm">
                  <div>
                    <div className="text-muted-foreground text-xs">You</div>
                    <div className="font-bold text-gold">{Math.round(analysis.accuracy_white)}%</div>
                  </div>
                  <div className="text-right">
                    <div className="text-muted-foreground text-xs">AI</div>
                    <div className="font-bold">{Math.round(analysis.accuracy_black)}%</div>
                  </div>
                </div>
                <p className="text-xs italic text-muted-foreground">{analysis.summary}</p>
                {analysis.blunders?.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs uppercase text-destructive">{t("topMistakes")}</div>
                    {analysis.blunders.slice(0, 3).map((b: any, i: number) => (
                      <div key={i} className="text-xs bg-background/50 rounded p-2">
                        <span className="font-mono text-destructive">#{b.move_number} {b.san}</span>
                        <span className="text-muted-foreground"> → better: </span>
                        <span className="font-mono text-gold">{b.better}</span>
                        <p className="mt-1 text-muted-foreground">{b.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="border-t border-border pt-3 space-y-2">
                  <div className="text-xs uppercase text-gold">Ask the Coach</div>
                  <div className="flex gap-1">
                    <input
                      value={coachQ}
                      onChange={(e) => setCoachQ(e.target.value)}
                      placeholder={lang === "ru" ? "Что я упустил?" : "What did I miss?"}
                      className="flex-1 bg-background border border-border rounded-md px-2 py-1 text-xs"
                    />
                    <Button size="sm" onClick={askQuestion}>Ask</Button>
                  </div>
                  {coachA && <p className="text-xs bg-background/50 rounded p-2 whitespace-pre-wrap">{coachA}</p>}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
