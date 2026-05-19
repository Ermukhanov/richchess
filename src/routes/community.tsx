import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { Users } from "lucide-react";

export const Route = createFileRoute("/community")({ component: Community });

function Community() {
  const { t } = useI18n();
  useRequireAuth();
  return (
    <AppShell>
      <div className="max-w-4xl mx-auto p-6 md:p-8">
        <h1 className="text-3xl font-bold mb-1 flex items-center gap-2"><Users className="h-7 w-7 text-gold" /> {t("community")}</h1>
        <p className="text-muted-foreground mb-6">Friends, clubs, and shark talk</p>
        <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
          {t("comingSoon")} — friends, chat, and corporate clubs.
        </div>
      </div>
    </AppShell>
  );
}
