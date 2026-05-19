import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Zap, Clock, Timer, Users, Trophy, Briefcase, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

function Dashboard() {
  const { t } = useI18n();
  const { profile } = useRequireAuth();
  const navigate = useNavigate();
  const [recentGames, setRecentGames] = useState<any[]>([]);
  const [topPlayers, setTopPlayers] = useState<any[]>([]);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from("games")
      .select("id, result, game_mode, created_at, ai_difficulty")
      .or(`white_player_id.eq.${profile.id},black_player_id.eq.${profile.id}`)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => setRecentGames(data ?? []));

    let query = supabase.from("profiles").select("id, username, elo_rating, city, company_title").order("elo_rating", { ascending: false }).limit(3);
    if (profile.city) query = query.eq("city", profile.city);
    query.then(({ data }) => setTopPlayers(data ?? []));
  }, [profile]);

  if (!profile) return <AppShell><div className="p-8">{t("loading")}</div></AppShell>;

  const quickPlay = [
    { key: "bullet", label: t("bullet"), tc: "1+0", icon: Zap },
    { key: "blitz", label: t("blitz"), tc: "3+2", icon: Timer },
    { key: "blitz5", label: t("blitz5"), tc: "5+0", icon: Timer },
    { key: "rapid", label: t("rapid"), tc: "10+0", icon: Clock },
    { key: "classical", label: t("classical"), tc: "30+0", icon: Clock },
  ];

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-6">
        {/* Welcome card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-6 flex items-center justify-between flex-wrap gap-4"
        >
          <div>
            <p className="text-sm text-muted-foreground">{t("goodMorning")},</p>
            <h1 className="text-3xl font-bold">{profile.username ?? "Shark"} 🦈</h1>
            <p className="text-sm text-muted-foreground mt-1">{profile.company_title ?? "Executive"}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("corporateBudget")}</p>
            <p className="text-3xl font-bold text-gradient-gold font-mono">${profile.corporate_budget.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">ELO {profile.elo_rating}</p>
          </div>
        </motion.div>

        {/* Quick play */}
        <section>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Zap className="h-4 w-4 text-gold" /> {t("quickPlay")}</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {quickPlay.map((qp) => {
              const Icon = qp.icon;
              return (
                <button
                  key={qp.key}
                  onClick={() => navigate({ to: "/play/ai", search: { tc: qp.tc, level: "manager" } })}
                  className="bg-card border border-border hover:border-gold/60 rounded-xl p-4 text-left transition group"
                >
                  <Icon className="h-5 w-5 text-gold mb-2 group-hover:scale-110 transition" />
                  <div className="font-semibold text-sm">{qp.label}</div>
                  <div className="text-xs text-muted-foreground">{qp.tc}</div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Mode cards */}
        <div className="grid md:grid-cols-3 gap-3">
          <Link to="/play" className="bg-card border border-border hover:border-gold/60 rounded-xl p-5 transition">
            <Briefcase className="h-6 w-6 text-gold mb-2" />
            <div className="font-bold">{t("playVsAi")}</div>
            <div className="text-xs text-muted-foreground mt-1">Train against Stockfish</div>
          </Link>
          <div className="bg-card border border-border rounded-xl p-5 opacity-60">
            <TrendingUp className="h-6 w-6 text-gold mb-2" />
            <div className="font-bold">{t("challengeFriend")}</div>
            <div className="text-xs text-muted-foreground mt-1">{t("comingSoon")}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5 opacity-60">
            <Users className="h-6 w-6 text-gold mb-2" />
            <div className="font-bold">{t("join4Player")}</div>
            <div className="text-xs text-muted-foreground mt-1">{t("comingSoon")}</div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent games */}
          <section className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-bold mb-3">{t("recentGames")}</h3>
            {recentGames.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noGamesYet")}</p>
            ) : (
              <ul className="space-y-2">
                {recentGames.map((g) => (
                  <li key={g.id} className="flex items-center justify-between text-sm border-b border-border/50 pb-2">
                    <span className="capitalize">{g.game_mode ?? "vs AI"} {g.ai_difficulty ? `(${g.ai_difficulty})` : ""}</span>
                    <span className={
                      g.result === "win" ? "text-success font-semibold" :
                      g.result === "loss" ? "text-destructive font-semibold" :
                      "text-muted-foreground"
                    }>{g.result ?? "—"}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Top city */}
          <section className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-bold mb-3 flex items-center gap-2"><Trophy className="h-4 w-4 text-gold" /> {t("topInCity")} {profile.city ? `— ${profile.city}` : ""}</h3>
            {topPlayers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet</p>
            ) : (
              <ol className="space-y-2">
                {topPlayers.map((p, i) => (
                  <li key={p.id} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="text-gold font-bold w-5">#{i + 1}</span>
                      <span>{p.username ?? "Shark"}</span>
                    </span>
                    <span className="font-mono text-muted-foreground">{p.elo_rating}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <Button asChild size="lg" className="w-full md:w-auto glow-gold font-semibold">
          <Link to="/play">{t("startGame")} →</Link>
        </Button>
      </div>
    </AppShell>
  );
}
