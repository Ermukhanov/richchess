import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { cn } from "@/lib/utils";
import { Bot, Users, Swords, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/play/")({ component: PlayPicker });

type Mode = "ai" | "friend" | "random" | "hostile";

function PlayPicker() {
  const { t } = useI18n();
  const { user, profile } = useRequireAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("ai");
  const [level, setLevel] = useState<"intern" | "manager" | "director" | "ceo">("manager");
  const [tc, setTc] = useState("10+0");
  const [bet, setBet] = useState(0);
  const [searching, setSearching] = useState(false);

  const levels = [
    { k: "intern", label: t("diffIntern") },
    { k: "manager", label: t("diffManager") },
    { k: "director", label: t("diffDirector") },
    { k: "ceo", label: t("diffCEO") },
  ] as const;
  const tcs = ["1+0", "2+1", "3+2", "5+0", "5+3", "10+0", "15+10", "30+0"];

  const modes: { k: Mode; label: string; icon: any; desc: string }[] = [
    { k: "ai", label: t("playVsAi"), icon: Bot, desc: "Stockfish — 4 levels" },
    { k: "friend", label: t("playVsFriend"), icon: Share2, desc: "Share a link" },
    { k: "random", label: t("playRandom"), icon: Swords, desc: "Matchmaking ±200 ELO" },
    { k: "hostile", label: t("hostileTakeover"), icon: Users, desc: "4-player free-for-all" },
  ];

  const start = async () => {
    if (mode === "ai") {
      navigate({ to: "/play/ai", search: { tc, level, bet } });
    } else if (mode === "friend") {
      const id = crypto.randomUUID();
      navigate({ to: "/play/online/$gameId", params: { gameId: id }, search: { tc, bet, host: 1 } });
    } else if (mode === "random") {
      if (!user || !profile) return;
      setSearching(true);
      await supabase.from("matchmaking_queue").delete().eq("user_id", user.id);
      await supabase.from("matchmaking_queue").insert({
        user_id: user.id,
        elo: profile.elo_rating,
        time_control: tc,
      });
      // Poll for opponent
      const start = Date.now();
      const poll = setInterval(async () => {
        const { data: queue } = await supabase
          .from("matchmaking_queue")
          .select("*")
          .neq("user_id", user.id)
          .eq("time_control", tc)
          .gte("elo", profile.elo_rating - 200)
          .lte("elo", profile.elo_rating + 200)
          .limit(1);
        if (queue && queue.length > 0) {
          clearInterval(poll);
          const opp = queue[0] as any;
          const id = crypto.randomUUID();
          await supabase.from("matchmaking_queue").delete().eq("user_id", user.id);
          await supabase.from("matchmaking_queue").delete().eq("user_id", opp.user_id);
          navigate({ to: "/play/online/$gameId", params: { gameId: id }, search: { tc, bet, host: 1 } });
        } else if (Date.now() - start > 60000) {
          clearInterval(poll);
          setSearching(false);
          await supabase.from("matchmaking_queue").delete().eq("user_id", user.id);
          toast.error("No opponents found. Try again.");
        }
      }, 3000);
    } else if (mode === "hostile") {
      const id = crypto.randomUUID();
      navigate({ to: "/play/hostile/$gameId", params: { gameId: id }, search: { bet, host: 1 } });
    }
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto p-6 md:p-8">
        <h1 className="text-3xl font-bold mb-2">{t("play")}</h1>
        <p className="text-muted-foreground mb-6">{t("chooseMode")}</p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {modes.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.k}
                onClick={() => setMode(m.k)}
                className={cn(
                  "rounded-xl border p-4 text-left transition",
                  mode === m.k ? "border-gold bg-gold/10 glow-gold" : "border-border hover:border-gold/50"
                )}
              >
                <Icon className="h-6 w-6 mb-2 text-gold" />
                <div className="font-semibold text-sm">{m.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{m.desc}</div>
              </button>
            );
          })}
        </div>

        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
          {mode === "ai" && (
            <div>
              <label className="text-sm font-semibold mb-2 block">{t("difficulty")}</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {levels.map((l) => (
                  <button key={l.k} onClick={() => setLevel(l.k)}
                    className={cn("rounded-lg border p-3 text-sm font-medium transition",
                      level === l.k ? "border-gold bg-gold/10 text-gold" : "border-border hover:border-gold/50")}>
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode !== "hostile" && (
            <div>
              <label className="text-sm font-semibold mb-2 block">{t("timeControl")}</label>
              <div className="grid grid-cols-4 gap-2">
                {tcs.map((x) => (
                  <button key={x} onClick={() => setTc(x)}
                    className={cn("rounded-lg border p-2 text-sm font-mono transition",
                      tc === x ? "border-gold bg-gold/10 text-gold" : "border-border hover:border-gold/50")}>
                    {x}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-semibold mb-2 block">{t("bet")} ($CB)</label>
            <div className="grid grid-cols-5 gap-2">
              {[0, 50, 100, 250, 500].map((b) => (
                <button key={b} onClick={() => setBet(b)}
                  className={cn("rounded-lg border p-2 text-sm font-mono transition",
                    bet === b ? "border-gold bg-gold/10 text-gold" : "border-border hover:border-gold/50")}>
                  ${b}
                </button>
              ))}
            </div>
            {profile && bet > profile.corporate_budget && (
              <p className="text-xs text-destructive mt-1">Insufficient budget (you have ${profile.corporate_budget})</p>
            )}
          </div>

          <Button onClick={start} size="lg" disabled={searching || (profile != null && bet > profile.corporate_budget)} className="w-full glow-gold font-semibold">
            {searching ? "Searching for opponent..." : t("startGame")}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-4 text-center">
          <Link to="/learn" className="hover:text-gold">Need practice? Try the Learn module →</Link>
        </p>
      </div>
    </AppShell>
  );
}
