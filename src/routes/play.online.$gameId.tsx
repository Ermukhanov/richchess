import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { Chess } from "chess.js";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, Copy, Crown, RotateCcw, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { ChessGame } from "@/components/ChessGame";
import { ChessClock, parseTimeControl } from "@/components/ChessClock";
import { ChatPanel } from "@/components/ChatPanel";
import { LiveCoach } from "@/components/LiveCoach";
import { useI18n } from "@/lib/i18n";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { sanToCorporate } from "@/lib/pieces";
import { supabase } from "@/integrations/supabase/client";

const search = z.object({
  tc: z.string().optional().default("10+0"),
  bet: z.coerce.number().optional().default(0),
  host: z.coerce.number().optional().default(0),
});

export const Route = createFileRoute("/play/online/$gameId")({
  validateSearch: search,
  component: OnlineGame,
});

type PresencePlayer = { user_id: string; username: string; color: "w" | "b" | "spectator" };

function OnlineGame() {
  const { t } = useI18n();
  const { user, profile } = useRequireAuth();
  const navigate = useNavigate();
  const { gameId } = Route.useParams();
  const { tc, bet, host } = Route.useSearch();
  const { initialMs, incMs } = parseTimeControl(tc);

  const [chess] = useState(() => new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [history, setHistory] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [color, setColor] = useState<"w" | "b" | "spectator" | null>(null);
  const [players, setPlayers] = useState<PresencePlayer[]>([]);
  const [over, setOver] = useState<null | { result: "win" | "loss" | "draw"; reason: string }>(null);
  const channelRef = useRef<any>(null);
  const savedRef = useRef(false);

  // Place bet once
  useEffect(() => {
    if (bet > 0 && user) {
      supabase.rpc("place_bet", { p_amount: bet });
    }
  }, [bet, user]);

  useEffect(() => {
    if (!user || !profile) return;
    const channel = supabase.channel(`game:${gameId}`, { config: { presence: { key: user.id } } });
    channelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState() as Record<string, PresencePlayer[]>;
        const all = Object.values(state).flat();
        setPlayers(all);
        // Assign color
        if (!color) {
          const me = all.find((p) => p.user_id === user.id);
          if (me) setColor(me.color);
        }
      })
      .on("broadcast", { event: "move" }, ({ payload }: any) => {
        try {
          const m = chess.move({ from: payload.from, to: payload.to, promotion: payload.promotion ?? "q" });
          if (m) {
            setFen(chess.fen());
            setLastMove({ from: payload.from, to: payload.to });
            setHistory((h) => [...h, m.san]);
          }
        } catch {}
      })
      .on("broadcast", { event: "resign" }, ({ payload }: any) => {
        const youLost = payload.color === color;
        setOver({ result: youLost ? "loss" : "win", reason: youLost ? t("youLost") : t("youWon") });
      })
      .subscribe(async (status) => {
        if (status !== "SUBSCRIBED") return;
        // Determine color: host=white, second joiner=black, others=spectator
        const existing = channel.presenceState() as Record<string, PresencePlayer[]>;
        const others = Object.values(existing).flat();
        const hasWhite = others.some((p) => p.color === "w");
        const hasBlack = others.some((p) => p.color === "b");
        let myColor: "w" | "b" | "spectator" = "spectator";
        if (host && !hasWhite) myColor = "w";
        else if (!hasBlack) myColor = "b";
        else if (!hasWhite) myColor = "w";
        setColor(myColor);
        await channel.track({ user_id: user.id, username: profile.username ?? "Anon", color: myColor });
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId, user, profile]);

  const handleMove = (m: { from: string; to: string; promotion?: string; san: string; fen: string }) => {
    setFen(m.fen);
    setLastMove({ from: m.from, to: m.to });
    setHistory((h) => [...h, m.san]);
    channelRef.current?.send({
      type: "broadcast",
      event: "move",
      payload: { from: m.from, to: m.to, promotion: m.promotion },
    });
  };

  // Detect game over
  useEffect(() => {
    if (over || !chess.isGameOver()) return;
    let result: "win" | "loss" | "draw" = "draw";
    let reason = t("draw");
    if (chess.isCheckmate()) {
      const loserColor = chess.turn();
      result = loserColor === color ? "loss" : "win";
      reason = result === "win" ? t("youWon") : t("youLost");
    }
    setOver({ result, reason });
    if (!savedRef.current && user && (color as string) !== "spectator") {
      savedRef.current = true;
      const eloDelta = result === "win" ? 20 : result === "loss" ? -15 : 0;
      const opp = players.find((p) => p.user_id !== user.id && (p.color as string) !== "spectator");
      supabase.from("games").insert({
        white_player_id: color === "w" ? user.id : opp?.user_id ?? null,
        black_player_id: color === "b" ? user.id : opp?.user_id ?? null,
        pgn: chess.pgn(),
        result,
        game_mode: "online",
        time_control: tc,
        bet,
      }).then(() => {});
      supabase.rpc("settle_game", { p_result: result, p_bet: bet, p_elo_delta: eloDelta });
    }
  }, [fen, over, chess, color, user, players, bet, tc, t]);

  const resign = () => {
    if (!color || (color as string) === "spectator" || over) return;
    if (!confirm("Resign and forfeit your bet?")) return;
    channelRef.current?.send({ type: "broadcast", event: "resign", payload: { color } });
    setOver({ result: "loss", reason: t("youLost") });
  };

  const copyLink = () => {
    const url = `${window.location.origin}/play/online/${gameId}?tc=${tc}&bet=${bet}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied — share with your opponent");
  };

  const myTurn = (color as string) !== "spectator" && color === chess.turn();
  const orientation = color === "b" ? "black" : "white";
  const opp = players.find((p) => p.user_id !== user?.id && (p.color as string) !== "spectator");
  const waiting = (color as string) !== "spectator" && players.filter((p) => (p.color as string) !== "spectator").length < 2;

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="flex items-center justify-between mb-4">
          <Button asChild variant="ghost" size="sm">
            <Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-1" /> {t("backToDashboard")}</Link>
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={copyLink}>
              <Copy className="h-3 w-3 mr-1" /> Share Link
            </Button>
            {bet > 0 && <span className="font-mono text-gold text-sm">${bet} CB</span>}
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr,320px] gap-6">
          <div className="relative">
            <div className="bg-card border border-border rounded-2xl p-3 md:p-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground mb-2 px-1">
                <span className="flex items-center gap-1">
                  <Crown className="h-3 w-3 text-destructive" /> {opp?.username ?? "Waiting..."}
                </span>
                <span>{(color as string) === "spectator" ? "Spectator mode" : myTurn && !over ? t("yourTurn") : ""}</span>
              </div>
              <ChessGame
                externalChess={chess}
                fen={fen}
                disabled={!myTurn || !!over || waiting || (color as string) === "spectator"}
                theme={(profile?.board_theme as any) ?? "wall_street"}
                lastMove={lastMove}
                orientation={orientation}
                onMove={handleMove}
              />
              <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground mt-2 px-1">
                <span className="flex items-center gap-1">
                  <Crown className="h-3 w-3 text-gold" /> {profile?.username ?? "You"} ({color})
                </span>
              </div>
            </div>

            {waiting && (color as string) !== "spectator" && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-2xl">
                <div className="bg-card border border-gold rounded-xl p-6 text-center max-w-sm">
                  <div className="text-4xl mb-2">🤝</div>
                  <h2 className="font-bold mb-2">Waiting for opponent</h2>
                  <p className="text-sm text-muted-foreground mb-4">Share the link below.</p>
                  <Button onClick={copyLink} className="w-full"><Copy className="h-4 w-4 mr-1" /> Copy Link</Button>
                </div>
              </div>
            )}

            {over && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-2xl">
                <div className="bg-card border border-gold rounded-xl p-6 text-center glow-gold max-w-sm">
                  <div className="text-4xl mb-2">{over.result === "win" ? "🏆" : over.result === "loss" ? "📉" : "🤝"}</div>
                  <h2 className="text-xl font-bold mb-2">{over.reason}</h2>
                  <Button onClick={() => navigate({ to: "/play" })} className="mt-2"><RotateCcw className="h-4 w-4 mr-1" /> {t("newGame")}</Button>
                </div>
              </motion.div>
            )}
          </div>

          <aside className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-4">
            <ChessClock
              initialMs={initialMs}
              incMs={incMs}
              activeColor={chess.turn()}
              running={!over && !waiting && history.length > 0}
              onFlag={(c) => {
                if (over || (color as string) === "spectator") return;
                setOver({ result: c === color ? "loss" : "win", reason: c === color ? t("youLost") : t("youWon") });
              }}
              label={{ w: "White", b: "Black" }}
            />
            <div>
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{t("moveHistory")}</h3>
              <div className="bg-background/40 rounded-md p-2 max-h-64 overflow-y-auto text-sm font-mono space-y-1">
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
            {(color as string) !== "spectator" && (
              <Button variant="outline" onClick={resign}>{t("resign")}</Button>
            )}
          </aside>
        </div>
      </div>
      <ChatPanel gameId={gameId} />
    </AppShell>
  );
}
