import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Trophy, Medal } from "lucide-react";

export const Route = createFileRoute("/leaderboard")({ component: Leaderboard });

type Row = {
  id: string;
  username: string | null;
  city: string | null;
  country: string | null;
  company_title: string | null;
  elo_rating: number;
  corporate_budget: number;
  wins: number;
  losses: number;
  avatar_url: string | null;
};

function Leaderboard() {
  const { t } = useI18n();
  const { user, profile } = useRequireAuth();
  const [tab, setTab] = useState<"global" | "city" | "country">("global");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    let q = supabase.from("profiles").select("id,username,city,country,company_title,elo_rating,corporate_budget,wins,losses,avatar_url").order("elo_rating", { ascending: false }).limit(50);
    if (tab === "city" && profile?.city) q = q.eq("city", profile.city);
    if (tab === "country" && profile?.country) q = q.eq("country", profile.country);
    q.then(({ data }) => {
      setRows((data as Row[]) ?? []);
      setLoading(false);
    });
  }, [tab, profile?.city, profile?.country]);

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto p-6 md:p-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2"><Trophy className="h-7 w-7 text-gold" /> {t("leaderboard")}</h1>
        <p className="text-muted-foreground mb-6">The sharks at the top of the food chain.</p>

        <div className="flex gap-2 mb-4 border-b border-border">
          {(["global", "city", "country"] as const).map((tk) => (
            <button key={tk} onClick={() => setTab(tk)}
              className={cn("px-4 py-2 text-sm font-medium border-b-2 -mb-px transition",
                tab === tk ? "border-gold text-gold" : "border-transparent text-muted-foreground hover:text-foreground")}>
              {tk === "global" ? "Global" : tk === "city" ? `My City${profile?.city ? ` (${profile.city})` : ""}` : `My Country${profile?.country ? ` (${profile.country})` : ""}`}
            </button>
          ))}
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="grid grid-cols-[40px_1fr_80px_100px_60px] md:grid-cols-[40px_1fr_120px_100px_120px_80px] gap-2 px-3 py-2 text-xs uppercase text-muted-foreground border-b border-border bg-background/30">
            <div>#</div>
            <div>Player</div>
            <div className="hidden md:block">Title</div>
            <div>ELO</div>
            <div className="hidden md:block">$CB</div>
            <div>W/L</div>
          </div>
          {loading ? (
            <p className="text-center text-sm text-muted-foreground p-8">{t("loading")}</p>
          ) : rows.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground p-8">No players yet.</p>
          ) : (
            rows.map((r, i) => (
              <div key={r.id}
                className={cn("grid grid-cols-[40px_1fr_80px_100px_60px] md:grid-cols-[40px_1fr_120px_100px_120px_80px] gap-2 px-3 py-2 items-center text-sm border-b border-border/50 last:border-b-0",
                  r.id === user?.id && "bg-gold/10")}>
                <div className="flex items-center">
                  {i < 3 ? <Medal className={cn("h-4 w-4", i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : "text-amber-600")} /> : <span className="text-muted-foreground">{i + 1}</span>}
                </div>
                <div className="flex items-center gap-2 truncate">
                  {r.avatar_url ? <img src={r.avatar_url} className="h-6 w-6 rounded-full object-cover" /> : <div className="h-6 w-6 rounded-full bg-primary/20" />}
                  <span className="truncate font-medium">{r.username ?? "Anon"}</span>
                  {i < 10 && <span className="text-[10px] bg-gold/20 text-gold px-1 rounded">🦈</span>}
                </div>
                <div className="hidden md:block text-xs text-muted-foreground truncate">{r.company_title ?? "—"}</div>
                <div className="font-mono font-semibold">{r.elo_rating}</div>
                <div className="hidden md:block font-mono text-gold text-xs">${r.corporate_budget.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">{r.wins}/{r.losses}</div>
              </div>
            ))
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-4 text-center">🦈 Shark of the Month — top 10 ranked. Resets monthly.</p>
      </div>
    </AppShell>
  );
}
