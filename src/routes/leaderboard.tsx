import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leaderboard")({ component: Leaderboard });

function Leaderboard() {
  const { t } = useI18n();
  const { profile } = useRequireAuth();
  const [tab, setTab] = useState<"global" | "city" | "country">("global");
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    let q = supabase.from("profiles").select("id, username, elo_rating, city, country, company_title, corporate_budget").order("elo_rating", { ascending: false }).limit(50);
    if (tab === "city" && profile?.city) q = q.eq("city", profile.city);
    if (tab === "country" && profile?.country) q = q.eq("country", profile.country);
    q.then(({ data }) => setRows(data ?? []));
  }, [tab, profile]);

  const tabs = [
    { k: "global", label: "Global" },
    { k: "city", label: profile?.city ? `City — ${profile.city}` : "City" },
    { k: "country", label: profile?.country ? `Country — ${profile.country}` : "Country" },
  ] as const;

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto p-6 md:p-8">
        <h1 className="text-3xl font-bold mb-1 flex items-center gap-2"><Trophy className="h-7 w-7 text-gold" /> {t("leaderboard")}</h1>
        <p className="text-muted-foreground mb-6">Top sharks of the season</p>

        <div className="flex gap-2 mb-4">
          {tabs.map((x) => (
            <button key={x.k} onClick={() => setTab(x.k)}
              className={cn("px-4 py-2 rounded-md text-sm font-medium border",
                tab === x.k ? "bg-gold text-gold-foreground border-gold" : "border-border hover:border-gold/50")}>
              {x.label}
            </button>
          ))}
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {rows.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground text-sm">No players yet — be the first!</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-background/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="text-left p-3">#</th><th className="text-left p-3">Player</th><th className="text-left p-3 hidden md:table-cell">Role</th><th className="text-right p-3">ELO</th><th className="text-right p-3 hidden md:table-cell">$CB</th></tr>
              </thead>
              <tbody>
                {rows.map((p, i) => (
                  <tr key={p.id} className={cn("border-t border-border/40", p.id === profile?.id && "bg-gold/10")}>
                    <td className="p-3 font-bold text-gold">{i + 1}</td>
                    <td className="p-3">{p.username ?? "Anonymous Shark"}</td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground">{p.company_title ?? "—"}</td>
                    <td className="p-3 text-right font-mono">{p.elo_rating}</td>
                    <td className="p-3 text-right font-mono hidden md:table-cell text-gold">${p.corporate_budget}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppShell>
  );
}
