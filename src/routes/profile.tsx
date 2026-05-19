import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { User } from "lucide-react";

export const Route = createFileRoute("/profile")({ component: ProfilePage });

function ProfilePage() {
  const { t } = useI18n();
  const { profile } = useRequireAuth();
  if (!profile) return <AppShell><div className="p-8">{t("loading")}</div></AppShell>;
  return (
    <AppShell>
      <div className="max-w-2xl mx-auto p-6 md:p-8">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2"><User className="h-7 w-7 text-gold" /> {t("profile")}</h1>
        <div className="bg-card border border-border rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gold/20 flex items-center justify-center text-2xl">🦈</div>
            <div>
              <div className="text-xl font-bold">{profile.username ?? "Shark"}</div>
              <div className="text-sm text-muted-foreground">{profile.company_title ?? "Executive"}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
            <Stat label={t("corporateBudget")} value={`$${profile.corporate_budget}`} />
            <Stat label="ELO" value={profile.elo_rating} />
            <Stat label="City" value={profile.city ?? "—"} />
            <Stat label="Email" value={profile.email ?? "—"} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}
