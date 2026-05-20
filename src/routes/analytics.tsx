import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Trophy, TrendingUp, Target, Flame, BarChart3, Crown } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/analytics")({ component: AnalyticsPage });

type GameRow = {
  id: string;
  result: string | null;
  game_mode: string | null;
  ai_difficulty: string | null;
  created_at: string;
  bet: number;
  pgn: string | null;
  white_player_id: string | null;
  black_player_id: string | null;
};

function AnalyticsPage() {
  const { t } = useI18n();
  const { profile } = useRequireAuth();
  const [games, setGames] = useState<GameRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from("games")
      .select("*")
      .or(`white_player_id.eq.${profile.id},black_player_id.eq.${profile.id}`)
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => {
        setGames((data as GameRow[]) ?? []);
        setLoading(false);
      });
  }, [profile]);

  const stats = useMemo(() => {
    const total = games.length;
    const wins = games.filter((g) => g.result === "win").length;
    const losses = games.filter((g) => g.result === "loss").length;
    const draws = games.filter((g) => g.result === "draw").length;
    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

    const byMode = new Map<string, { w: number; l: number; d: number }>();
    for (const g of games) {
      const mode = g.game_mode ?? "unknown";
      const row = byMode.get(mode) ?? { w: 0, l: 0, d: 0 };
      if (g.result === "win") row.w++;
      else if (g.result === "loss") row.l++;
      else if (g.result === "draw") row.d++;
      byMode.set(mode, row);
    }

    // Simulated ELO line from win/loss (since we don't store snapshots)
    let elo = (profile?.elo_rating ?? 1200) - wins * 15 + losses * 10;
    const eloSeries: { i: number; elo: number }[] = [];
    const chrono = [...games].reverse();
    chrono.forEach((g, i) => {
      if (g.result === "win") elo += 15;
      else if (g.result === "loss") elo -= 10;
      else elo += 2;
      eloSeries.push({ i, elo });
    });

    return { total, wins, losses, draws, winRate, byMode, eloSeries };
  }, [games, profile]);

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="h-7 w-7 text-gold" /> {t("analytics")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Track your boardroom performance.</p>
          </div>
        </div>

        {loading ? (
          <div className="glass rounded-2xl p-10 text-center text-muted-foreground">{t("loading")}</div>
        ) : games.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center">
            <Crown className="h-10 w-10 text-gold/40 mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">{t("noAnalytics")}</p>
            <Link to="/play" className="inline-flex items-center gap-1 text-gold hover:underline">
              {t("startGame")} →
            </Link>
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: t("totalGames"), value: stats.total, icon: Trophy, color: "text-gold" },
                { label: t("winRate"), value: `${stats.winRate}%`, icon: TrendingUp, color: "text-success" },
                {
                  label: "Wins / Losses",
                  value: `${stats.wins} / ${stats.losses}`,
                  icon: Target,
                  color: "text-foreground",
                },
                {
                  label: t("bestStreak"),
                  value: profile?.best_win_streak ?? 0,
                  icon: Flame,
                  color: "text-destructive",
                },
              ].map((s, i) => {
                const Icon = s.icon;
                return (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-gold rounded-2xl p-4"
                  >
                    <Icon className={cn("h-4 w-4 mb-2", s.color)} />
                    <div className="text-2xl font-bold">{s.value}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                      {s.label}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* ELO chart */}
            <div className="glass rounded-2xl p-5">
              <h3 className="font-bold text-sm flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-gold" /> {t("eloHistory")}
              </h3>
              <EloChart series={stats.eloSeries} />
            </div>

            {/* By mode */}
            <div className="glass rounded-2xl p-5">
              <h3 className="font-bold text-sm mb-4">{t("byMode")}</h3>
              <div className="space-y-2">
                {[...stats.byMode.entries()].map(([mode, row]) => {
                  const total = row.w + row.l + row.d;
                  const wPct = (row.w / total) * 100;
                  const lPct = (row.l / total) * 100;
                  const dPct = (row.d / total) * 100;
                  return (
                    <div key={mode} className="text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="capitalize font-medium">{mode.replace("_", " ")}</span>
                        <span className="text-muted-foreground text-xs font-mono">
                          {row.w}W · {row.l}L · {row.d}D
                        </span>
                      </div>
                      <div className="flex h-2 rounded-full overflow-hidden bg-background/40">
                        <div style={{ width: `${wPct}%` }} className="bg-success" />
                        <div style={{ width: `${dPct}%` }} className="bg-muted-foreground" />
                        <div style={{ width: `${lPct}%` }} className="bg-destructive" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* All games table */}
            <div className="glass rounded-2xl p-5">
              <h3 className="font-bold text-sm mb-4">
                {t("allGames")} <span className="text-muted-foreground font-normal">({games.length})</span>
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                      <th className="text-left py-2">Date</th>
                      <th className="text-left py-2">Mode</th>
                      <th className="text-left py-2">Difficulty</th>
                      <th className="text-right py-2">Bet</th>
                      <th className="text-right py-2">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {games.map((g) => (
                      <tr key={g.id} className="border-b border-border/40 hover:bg-white/[0.02]">
                        <td className="py-2 text-muted-foreground">
                          {new Date(g.created_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-2 capitalize">{(g.game_mode ?? "—").replace("_", " ")}</td>
                        <td className="py-2 text-xs text-muted-foreground capitalize">
                          {g.ai_difficulty ?? "—"}
                        </td>
                        <td className="py-2 text-right font-mono text-gold">
                          {g.bet > 0 ? `$${g.bet}` : "—"}
                        </td>
                        <td
                          className={cn(
                            "py-2 text-right font-semibold uppercase text-xs",
                            g.result === "win"
                              ? "text-success"
                              : g.result === "loss"
                              ? "text-destructive"
                              : "text-muted-foreground"
                          )}
                        >
                          {g.result ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

function EloChart({ series }: { series: { i: number; elo: number }[] }) {
  if (series.length === 0) return <p className="text-xs text-muted-foreground">No data.</p>;
  const min = Math.min(...series.map((s) => s.elo)) - 20;
  const max = Math.max(...series.map((s) => s.elo)) + 20;
  const range = max - min || 1;
  const w = 100;
  const h = 40;
  const points = series.map((s, i) => {
    const x = (i / Math.max(series.length - 1, 1)) * w;
    const y = h - ((s.elo - min) / range) * h;
    return `${x},${y}`;
  });
  return (
    <div className="relative h-40">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-full">
        <defs>
          <linearGradient id="eloGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.84 0.16 86)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="oklch(0.84 0.16 86)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          points={`0,${h} ${points.join(" ")} ${w},${h}`}
          fill="url(#eloGrad)"
        />
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke="oklch(0.84 0.16 86)"
          strokeWidth="0.6"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="absolute top-0 right-0 text-xs text-gold font-mono">{Math.round(series[series.length - 1].elo)}</div>
      <div className="absolute bottom-0 left-0 text-[10px] text-muted-foreground">{Math.round(min)}</div>
    </div>
  );
}
