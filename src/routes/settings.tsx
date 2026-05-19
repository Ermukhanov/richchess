import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { Settings as SettingsIcon, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

function SettingsPage() {
  const { t, lang, setLang } = useI18n();
  useRequireAuth();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <AppShell>
      <div className="max-w-2xl mx-auto p-6 md:p-8 space-y-4">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2"><SettingsIcon className="h-7 w-7 text-gold" /> {t("settings")}</h1>

        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-3">{t("chooseLanguage")}</h3>
          <div className="grid grid-cols-2 gap-2">
            {(["en", "ru"] as const).map((l) => (
              <button key={l} onClick={() => setLang(l)}
                className={cn("rounded-lg border p-3 font-semibold transition",
                  lang === l ? "border-gold bg-gold/10 text-gold" : "border-border hover:border-gold/50")}>
                {l === "en" ? "English" : "Русский"}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-1">Account</h3>
          <p className="text-sm text-muted-foreground mb-3">Sign out of Corporate Sharks Chess.</p>
          <Button variant="outline" onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
            <LogOut className="h-4 w-4 mr-2" /> {t("logout")}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
