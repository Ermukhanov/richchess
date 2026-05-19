import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, Crown, RotateCcw } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { getBestMove, type AiLevel } from "@/lib/stockfish";
import { sanToCorporate } from "@/lib/pieces";
import { supabase } from "@/integrations/supabase/client";

const search = z.object({
  tc: z.string().optional().default("10+0"),
  level: z.enum(["intern", "manager", "director", "ceo"]).optional().default("manager"),
  bet: z.coerce.number().optional().default(0),
});

export const Route = createFileRoute("/play/ai")({ validateSearch: search, component: AiGame });

function AiGame() {
  const { t } = useI18n();
  const { profile, user } = useRequireAuth();
  const navigate = useNavigate();
  const { level, bet } = Route.useSearch();
  const [game, setGame] = useState(() => new Chess());
  const [fen, setFen] = useState(game.fen());
  const [history, setHistory] = useState<string[]>([]);
  const [thinking, setThinking] = useState(false);
  const [over, setOver] = useState<null | { result: "win" | "loss" | "draw"; reason: string }>(null);
  const savedRef = useRef(false);

  const onPlayerMove = (from: string, to: string) => {
    if (over || thinking || game.turn() !== "w") return false;
    try {
      const move = game.move({ from, to, promotion: "q" });
      if (!move) return false;
      setFen(game.fen());
      setHistory((h) => [...h, move.san]);
      return true;
    } catch {
      return false;
    }
  };

  // Trigger AI on black's turn
  useEffect(() => {
    if (over) return;
    if (game.turn() !== "b") return;
    if (game.isGameOver()) return;
    let cancelled = false;
    setThinking(true);
    getBestMove(game.fen(), level as AiLevel)
      .then((uci) => {
        if (cancelled || !uci) return;
        const from = uci.slice(0, 2);
        const to = uci.slice(2, 4);
        const promo = uci.length >= 5 ? uci[4] : undefined;
        try {
          const m = game.move({ from, to, promotion: (promo as any) ?? "q" });
          if (m) {
            setFen(game.fen());
            setHistory((h) => [...h, m.san]);
          }
        } catch {}
      })
      .catch(() => toast.error("AI engine error"))
      .finally(() => !cancelled && setThinking(false));
    return () => { cancelled = true; };
  }, [fen, over, level, game]);

  // Detect game over + persist
  useEffect(() => {
    if (over || !game.isGameOver()) return;
    let result: "win" | "loss" | "draw" = "draw";
    let reason = t("draw");
    if (game.isCheckmate()) {
      const loserIsWhite = game.turn() === "w";
      result = loserIsWhite ? "loss" : "win";
      reason = loserIsWhite ? t("youLost") : t("youWon");
    }
    setOver({ result, reason });
    // Save game
    if (!savedRef.current && user) {
      savedRef.current = true;
      const eloDelta = result === "win" ? 15 : result === "loss" ? -10 : 2;
      const budgetDelta = result === "win" ? bet : result === "loss" ? -bet : 0;
      supabase.from("games").insert({
        white_player_id: user.id,
        pgn: game.pgn(),
        result,
        game_mode: "vs_ai",
        ai_difficulty: level,
      }).then(() => {});
      if (profile && (eloDelta || budgetDelta)) {
        supabase.from("profiles").update({
          elo_rating: profile.elo_rating + eloDelta,
          corporate_budget: Math.max(0, profile.corporate_budget + budgetDelta),
        }).eq("id", user.id).then(() => {});
      }
    }
  }, [fen, over, game, user, profile, bet, level, t]);

  const reset = () => {
    const g = new Chess();
    setGame(g);
    setFen(g.fen());
    setHistory([]);
    setOver(null);
    savedRef.current = false;
  };

  const options = useMemo(() => ({
    position: fen,
    onPieceDrop: ({ sourceSquare, targetSquare }: any) =>
      targetSquare ? onPlayerMove(sourceSquare, targetSquare) : false,
    boardOrientation: "white" as const,
    animationDurationInMs: 250,
    darkSquareStyle: { backgroundColor: "oklch(0.32 0.04 255)" },
    lightSquareStyle: { backgroundColor: "oklch(0.85 0.04 90)" },
    id: "csc-board",
  }), [fen]);

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="flex items-center justify-between mb-4">
          <Button asChild variant="ghost" size="sm"><Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-1" /> {t("backToDashboard")}</Link></Button>
          <div className="text-sm">
            <span className="text-muted-foreground">vs </span>
            <span className="font-semibold text-gold capitalize">{level}</span>
            {bet > 0 && <span className="ml-3 font-mono text-gold">${bet} CB</span>}
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr,320px] gap-6">
          {/* Board */}
          <div className="relative">
            <div className="bg-card border border-border rounded-2xl p-3 md:p-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground mb-2 px-1">
                <span className="flex items-center gap-1"><Crown className="h-3 w-3 text-destructive" /> AI ({level})</span>
                <span>{thinking ? t("aiThinking") : ""}</span>
              </div>
              <Chessboard options={options as any} />
              <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground mt-2 px-1">
                <span className="flex items-center gap-1"><Crown className="h-3 w-3 text-gold" /> {profile?.username ?? "You"}</span>
                <span>{game.turn() === "w" && !over ? t("yourTurn") : ""}</span>
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
                  <p className="text-sm text-muted-foreground mb-4">
                    {over.result === "win" ? "Your CEO outmaneuvered the competition." : over.result === "loss" ? "Time for a strategic retreat." : "An honourable handshake."}
                  </p>
                  <div className="flex gap-2">
                    <Button onClick={reset} className="flex-1"><RotateCcw className="h-4 w-4 mr-1" /> {t("newGame")}</Button>
                    <Button variant="outline" onClick={() => navigate({ to: "/dashboard" })}>Home</Button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Side panel */}
          <aside className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-4">
            <div>
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{t("moveHistory")}</h3>
              <div className="bg-background/40 rounded-md p-2 max-h-80 overflow-y-auto text-sm font-mono space-y-1">
                {history.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4 text-xs">No moves yet</p>
                ) : history.map((san, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-muted-foreground w-6">{Math.floor(i / 2) + 1}.</span>
                    <span className="flex-1">{sanToCorporate(san, t)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => {
                if (confirm("Resign?")) { setOver({ result: "loss", reason: t("youLost") }); }
              }}>{t("resign")}</Button>
              <Button variant="ghost" className="flex-1" onClick={reset}><RotateCcw className="h-4 w-4 mr-1" /> {t("newGame")}</Button>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
