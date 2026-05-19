import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/play")({ component: PlayPicker });

function PlayPicker() {
  const { t } = useI18n();
  useRequireAuth();
  const navigate = useNavigate();
  const [level, setLevel] = useState<"intern" | "manager" | "director" | "ceo">("manager");
  const [tc, setTc] = useState("10+0");
  const [bet, setBet] = useState(0);

  const levels = [
    { k: "intern", label: t("diffIntern") },
    { k: "manager", label: t("diffManager") },
    { k: "director", label: t("diffDirector") },
    { k: "ceo", label: t("diffCEO") },
  ] as const;
  const tcs = ["1+0", "3+2", "5+0", "10+0", "30+0"];

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto p-6 md:p-8">
        <h1 className="text-3xl font-bold mb-2">{t("playVsAi")}</h1>
        <p className="text-muted-foreground mb-8">{t("chooseMode")}</p>

        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
          <div>
            <label className="text-sm font-semibold mb-2 block">{t("difficulty")}</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {levels.map((l) => (
                <button
                  key={l.k}
                  onClick={() => setLevel(l.k)}
                  className={cn("rounded-lg border p-3 text-sm font-medium transition",
                    level === l.k ? "border-gold bg-gold/10 text-gold" : "border-border hover:border-gold/50")}
                >{l.label}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">{t("timeControl")}</label>
            <div className="grid grid-cols-5 gap-2">
              {tcs.map((x) => (
                <button
                  key={x}
                  onClick={() => setTc(x)}
                  className={cn("rounded-lg border p-2 text-sm font-mono transition",
                    tc === x ? "border-gold bg-gold/10 text-gold" : "border-border hover:border-gold/50")}
                >{x}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">{t("bet")} ($CB)</label>
            <div className="grid grid-cols-4 gap-2">
              {[0, 50, 100, 250].map((b) => (
                <button
                  key={b}
                  onClick={() => setBet(b)}
                  className={cn("rounded-lg border p-2 text-sm font-mono transition",
                    bet === b ? "border-gold bg-gold/10 text-gold" : "border-border hover:border-gold/50")}
                >${b}</button>
              ))}
            </div>
          </div>

          <Button
            onClick={() => navigate({ to: "/play/ai", search: { tc, level, bet } })}
            size="lg"
            className="w-full glow-gold font-semibold"
          >
            {t("startGame")}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
