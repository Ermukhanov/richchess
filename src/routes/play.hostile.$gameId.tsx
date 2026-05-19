import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, Copy, RotateCcw, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { ChatPanel } from "@/components/ChatPanel";
import { useI18n } from "@/lib/i18n";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const search = z.object({
  bet: z.coerce.number().optional().default(0),
  host: z.coerce.number().optional().default(0),
});

export const Route = createFileRoute("/play/hostile/$gameId")({
  validateSearch: search,
  component: HostileGame,
});

/**
 * Simplified 4-player on 8x8:
 * - 4 corporations: North(blue), East(red), South(green), West(black)
 * - Each owns one "CEO" (king) at their corner + pieces along their side
 * - Turn order rotates N → E → S → W
 * - Any piece can capture any other color
 * - When a CEO is captured, that player is eliminated
 * - Last CEO standing wins the pot
 *
 * Move rules (simplified): each piece moves like its standard chess counterpart,
 * direction-agnostic (no "forward" for pawns — they move 1 square in any orthogonal dir).
 */

type Corp = "N" | "E" | "S" | "W";
const CORP_COLOR: Record<Corp, string> = {
  N: "oklch(0.55 0.20 240)",
  E: "oklch(0.55 0.22 30)",
  S: "oklch(0.55 0.20 150)",
  W: "oklch(0.30 0.02 280)",
};
const CORP_LABEL: Record<Corp, string> = { N: "Blue Corp", E: "Red Corp", S: "Green Corp", W: "Black Corp" };
const TURN_ORDER: Corp[] = ["N", "E", "S", "W"];

type PieceKind = "k" | "q" | "r" | "b" | "n" | "p";
type Cell = { kind: PieceKind; owner: Corp } | null;

function initialBoard(): Cell[][] {
  const b: Cell[][] = Array.from({ length: 8 }, () => Array(8).fill(null));
  // North on row 0, pawns row 1
  b[0][3] = { kind: "k", owner: "N" };
  b[0][4] = { kind: "q", owner: "N" };
  b[0][0] = b[0][7] = { kind: "r", owner: "N" } as Cell;
  b[0][7] = { kind: "r", owner: "N" };
  b[0][1] = b[0][6] = { kind: "n", owner: "N" } as Cell;
  b[0][6] = { kind: "n", owner: "N" };
  b[0][2] = b[0][5] = { kind: "b", owner: "N" } as Cell;
  b[0][5] = { kind: "b", owner: "N" };
  for (let c = 0; c < 8; c++) b[1][c] = { kind: "p", owner: "N" };
  // South row 7, pawns row 6
  b[7][3] = { kind: "q", owner: "S" };
  b[7][4] = { kind: "k", owner: "S" };
  b[7][0] = { kind: "r", owner: "S" }; b[7][7] = { kind: "r", owner: "S" };
  b[7][1] = { kind: "n", owner: "S" }; b[7][6] = { kind: "n", owner: "S" };
  b[7][2] = { kind: "b", owner: "S" }; b[7][5] = { kind: "b", owner: "S" };
  for (let c = 0; c < 8; c++) b[6][c] = { kind: "p", owner: "S" };
  // West col 0 rows 3-4 mini squad
  b[3][0] = { kind: "k", owner: "W" };
  b[4][0] = { kind: "q", owner: "W" };
  b[3][1] = { kind: "n", owner: "W" };
  b[4][1] = { kind: "b", owner: "W" };
  // East col 7 rows 3-4
  b[3][7] = { kind: "q", owner: "E" };
  b[4][7] = { kind: "k", owner: "E" };
  b[3][6] = { kind: "b", owner: "E" };
  b[4][6] = { kind: "n", owner: "E" };
  return b;
}

const GLYPH: Record<PieceKind, string> = { k: "♔", q: "♕", r: "♖", b: "♗", n: "♘", p: "♙" };
const ROLE: Record<PieceKind, string> = { k: "CEO", q: "COO", r: "Developer", b: "HR", n: "Marketer", p: "Intern" };

function legalMoves(board: Cell[][], r: number, c: number): Array<[number, number]> {
  const p = board[r][c];
  if (!p) return [];
  const out: Array<[number, number]> = [];
  const enemy = (r2: number, c2: number) => board[r2]?.[c2] && board[r2][c2]!.owner !== p.owner;
  const empty = (r2: number, c2: number) => board[r2]?.[c2] === null;
  const inB = (r2: number, c2: number) => r2 >= 0 && r2 < 8 && c2 >= 0 && c2 < 8;
  const slide = (dr: number, dc: number) => {
    for (let s = 1; s < 8; s++) {
      const r2 = r + dr * s, c2 = c + dc * s;
      if (!inB(r2, c2)) break;
      if (empty(r2, c2)) out.push([r2, c2]);
      else { if (enemy(r2, c2)) out.push([r2, c2]); break; }
    }
  };
  const step = (dr: number, dc: number) => {
    const r2 = r + dr, c2 = c + dc;
    if (inB(r2, c2) && (empty(r2, c2) || enemy(r2, c2))) out.push([r2, c2]);
  };
  switch (p.kind) {
    case "p":
      [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dr, dc]) => step(dr, dc));
      break;
    case "n":
      [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr,dc]) => step(dr,dc));
      break;
    case "b":
      [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([dr,dc]) => slide(dr,dc));
      break;
    case "r":
      [[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr,dc]) => slide(dr,dc));
      break;
    case "q":
      [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr,dc]) => slide(dr,dc));
      break;
    case "k":
      [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([dr,dc]) => step(dr,dc));
      break;
  }
  return out;
}

type PresenceP = { user_id: string; username: string; corp: Corp | "spectator" };

function HostileGame() {
  const { t } = useI18n();
  const { user, profile } = useRequireAuth();
  const navigate = useNavigate();
  const { gameId } = Route.useParams();
  const { bet, host } = Route.useSearch();
  const [board, setBoard] = useState<Cell[][]>(initialBoard);
  const [turnIdx, setTurnIdx] = useState(0);
  const [alive, setAlive] = useState<Record<Corp, boolean>>({ N: true, E: true, S: true, W: true });
  const [sel, setSel] = useState<[number, number] | null>(null);
  const [over, setOver] = useState<Corp | null>(null);
  const [players, setPlayers] = useState<PresenceP[]>([]);
  const [myCorp, setMyCorp] = useState<Corp | "spectator" | null>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (bet > 0 && user) supabase.rpc("place_bet", { p_amount: bet });
  }, [bet, user]);

  useEffect(() => {
    if (!user || !profile) return;
    const channel = supabase.channel(`hostile:${gameId}`, { config: { presence: { key: user.id } } });
    channelRef.current = channel;
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState() as Record<string, PresenceP[]>;
        setPlayers(Object.values(state).flat());
      })
      .on("broadcast", { event: "move" }, ({ payload }: any) => {
        applyMove(payload.from, payload.to, false);
      })
      .subscribe(async (s) => {
        if (s !== "SUBSCRIBED") return;
        const existing = Object.values(channel.presenceState() as Record<string, PresenceP[]>).flat();
        const used = new Set(existing.map((p) => p.corp));
        let assigned: Corp | "spectator" = "spectator";
        for (const c of TURN_ORDER) if (!used.has(c)) { assigned = c; break; }
        setMyCorp(assigned);
        await channel.track({ user_id: user.id, username: profile.username ?? "Anon", corp: assigned });
      });
    return () => { supabase.removeChannel(channel); };
  }, [gameId, user, profile]);

  const applyMove = (from: [number, number], to: [number, number], broadcast: boolean) => {
    setBoard((prev) => {
      const nb = prev.map((row) => [...row]);
      const moving = nb[from[0]][from[1]];
      const target = nb[to[0]][to[1]];
      if (!moving) return prev;
      if (target?.kind === "k") {
        setAlive((a) => ({ ...a, [target.owner]: false }));
      }
      nb[to[0]][to[1]] = moving;
      nb[from[0]][from[1]] = null;
      return nb;
    });
    setTurnIdx((i) => {
      let next = (i + 1) % 4;
      // skip eliminated
      for (let k = 0; k < 4; k++) {
        if (alive[TURN_ORDER[next]]) break;
        next = (next + 1) % 4;
      }
      return next;
    });
    if (broadcast) channelRef.current?.send({ type: "broadcast", event: "move", payload: { from, to } });
  };

  // Detect winner
  useEffect(() => {
    const remaining = TURN_ORDER.filter((c) => alive[c]);
    if (remaining.length === 1 && !over) {
      setOver(remaining[0]);
      if (user && bet > 0) {
        const won = remaining[0] === myCorp;
        const eloDelta = won ? 25 : -10;
        supabase.rpc("settle_game", { p_result: won ? "win" : "loss", p_bet: won ? bet * 3 : bet, p_elo_delta: eloDelta });
      }
    }
  }, [alive, over, user, bet, myCorp]);

  const currentCorp = TURN_ORDER[turnIdx];
  const myTurn = myCorp === currentCorp;

  const onCellClick = (r: number, c: number) => {
    if (over || !myTurn || (myCorp as string) === "spectator") return;
    const cell = board[r][c];
    if (sel) {
      const moves = legalMoves(board, sel[0], sel[1]);
      const ok = moves.some(([mr, mc]) => mr === r && mc === c);
      if (ok) {
        applyMove(sel, [r, c], true);
        setSel(null);
        return;
      }
    }
    if (cell && cell.owner === myCorp) setSel([r, c]);
    else setSel(null);
  };

  const moves = sel ? legalMoves(board, sel[0], sel[1]) : [];

  const copyLink = () => {
    const url = `${window.location.origin}/play/hostile/${gameId}?bet=${bet}`;
    navigator.clipboard.writeText(url);
    toast.success("Invite link copied — share with 3 others");
  };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="flex items-center justify-between mb-4">
          <Button asChild variant="ghost" size="sm">
            <Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-1" /> {t("backToDashboard")}</Link>
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={copyLink}><Copy className="h-3 w-3 mr-1" /> Share</Button>
            {bet > 0 && <span className="font-mono text-gold text-sm">${bet} CB</span>}
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr,300px] gap-6">
          <div className="bg-card border border-border rounded-2xl p-4">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-gold" /> {t("hostileTakeover")}
              <span className="ml-auto text-xs" style={{ color: CORP_COLOR[currentCorp] }}>
                {CORP_LABEL[currentCorp]}'s turn
              </span>
            </h2>
            <div className="grid grid-cols-8 aspect-square gap-0 select-none">
              {board.map((row, r) =>
                row.map((cell, c) => {
                  const dark = (r + c) % 2 === 1;
                  const isSel = sel && sel[0] === r && sel[1] === c;
                  const isMove = moves.some(([mr, mc]) => mr === r && mc === c);
                  return (
                    <button
                      key={`${r}-${c}`}
                      onClick={() => onCellClick(r, c)}
                      className={cn(
                        "aspect-square flex items-center justify-center text-2xl md:text-3xl relative transition",
                        dark ? "bg-[oklch(0.32_0.04_255)]" : "bg-[oklch(0.85_0.04_90)]",
                        isSel && "ring-2 ring-gold ring-inset",
                      )}
                    >
                      {cell && (
                        <span style={{ color: CORP_COLOR[cell.owner] }} className="drop-shadow-md font-bold">
                          {GLYPH[cell.kind]}
                        </span>
                      )}
                      {isMove && (
                        <span className={cn(
                          "absolute inset-0 m-auto rounded-full",
                          cell ? "ring-4 ring-destructive/60 ring-inset" : "h-3 w-3 bg-green-500/60"
                        )} style={{ maxWidth: cell ? "100%" : "20%", maxHeight: cell ? "100%" : "20%" }} />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <aside className="bg-card border border-border rounded-2xl p-4 space-y-4">
            <div>
              <h3 className="text-xs uppercase text-muted-foreground mb-2">Players</h3>
              <div className="space-y-2">
                {TURN_ORDER.map((corp) => {
                  const p = players.find((x) => x.corp === corp);
                  return (
                    <div key={corp} className={cn(
                      "flex items-center justify-between rounded-md p-2 text-sm border",
                      currentCorp === corp && alive[corp] ? "border-gold bg-gold/5" : "border-border",
                      !alive[corp] && "opacity-40 line-through"
                    )}>
                      <span className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ background: CORP_COLOR[corp] }} />
                        {CORP_LABEL[corp]}
                      </span>
                      <span className="text-xs text-muted-foreground">{p?.username ?? "—"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Turn order: N → E → S → W. Pieces follow standard moves (pawns walk 1 square orthogonally). Eliminate other CEOs to win the pot.
            </p>
          </aside>
        </div>

        {over && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="bg-card border border-gold rounded-xl p-6 text-center max-w-sm">
              <div className="text-5xl mb-2">🏆</div>
              <h2 className="text-xl font-bold mb-2" style={{ color: CORP_COLOR[over] }}>{CORP_LABEL[over]} wins!</h2>
              <p className="text-sm text-muted-foreground mb-4">Total takeover complete.</p>
              <Button onClick={() => navigate({ to: "/play" })}><RotateCcw className="h-4 w-4 mr-1" /> {t("newGame")}</Button>
            </div>
          </motion.div>
        )}
      </div>
      <ChatPanel gameId={gameId} />
    </AppShell>
  );
}
