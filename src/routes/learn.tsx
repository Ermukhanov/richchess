import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { BookOpen } from "lucide-react";

export const Route = createFileRoute("/learn")({ component: Learn });

function Learn() {
  const { t } = useI18n();
  useRequireAuth();
  const lessons = [
    { title: "Opening Strategies for CEOs", xp: 50, desc: "Control the center like you control the boardroom." },
    { title: "Managing Your Team (Pieces)", xp: 75, desc: "Coordinate Marketers and Developers for maximum impact." },
    { title: "Hostile Takeovers (Endgame)", xp: 100, desc: "Convert your advantage into a decisive win." },
    { title: "Defensive Restructuring", xp: 60, desc: "When under pressure, consolidate and counterattack." },
  ];
  return (
    <AppShell>
      <div className="max-w-4xl mx-auto p-6 md:p-8">
        <h1 className="text-3xl font-bold mb-1 flex items-center gap-2"><BookOpen className="h-7 w-7 text-gold" /> {t("learn")}</h1>
        <p className="text-muted-foreground mb-6">Train like an executive</p>
        <div className="grid md:grid-cols-2 gap-4">
          {lessons.map((l) => (
            <div key={l.title} className="bg-card border border-border rounded-xl p-5 hover:border-gold/50 transition cursor-pointer">
              <div className="text-xs text-gold font-semibold mb-1">+{l.xp} XP</div>
              <h3 className="font-bold mb-1">{l.title}</h3>
              <p className="text-sm text-muted-foreground">{l.desc}</p>
              <p className="text-xs text-muted-foreground mt-3">{t("comingSoon")}</p>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
