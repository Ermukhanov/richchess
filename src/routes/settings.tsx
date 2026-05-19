import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Moon, Sun, Monitor, Bell, Palette } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

const BOARD_THEMES = [
  { k: "wall_street", label: "Wall Street", swatch: ["oklch(0.32 0.04 255)", "oklch(0.85 0.04 90)"] },
  { k: "silicon_valley", label: "Silicon Valley", swatch: ["oklch(0.55 0.06 200)", "oklch(0.95 0.02 200)"] },
  { k: "tokyo_office", label: "Tokyo Office", swatch: ["oklch(0.42 0.08 50)", "oklch(0.88 0.06 70)"] },
];

const SKINS = [
  { k: "classic", label: "Classic", cost: 0 },
  { k: "corporate", label: "Corporate Pack", cost: 100 },
  { k: "neon", label: "Neon Exec", cost: 200 },
];

function SettingsPage() {
  const { t, lang, setLang } = useI18n();
  const { user, profile, refreshProfile } = useRequireAuth();
  const [theme, setTheme] = useState<"light" | "dark" | "system">("dark");
  const [notif, setNotif] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setTheme((localStorage.getItem("csc-theme") as any) ?? "dark");
    setNotif(localStorage.getItem("csc-notif") !== "0");
  }, []);

  const applyTheme = (t: "light" | "dark" | "system") => {
    setTheme(t);
    localStorage.setItem("csc-theme", t);
    const root = document.documentElement;
    const eff = t === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : t;
    root.classList.toggle("dark", eff === "dark");
  };

  const setBoard = async (b: string) => {
    if (!user) return;
    await supabase.from("profiles").update({ board_theme: b }).eq("id", user.id);
    await refreshProfile();
    toast.success("Board theme updated");
  };

  const unlockSkin = async (s: { k: string; cost: number }) => {
    if (!user || !profile) return;
    if ((profile.unlocked_skins ?? []).includes(s.k)) {
      await supabase.from("profiles").update({ piece_skin: s.k }).eq("id", user.id);
      await refreshProfile();
      return;
    }
    if (profile.corporate_budget < s.cost) return toast.error("Not enough Corporate Budget");
    const newSkins = [...(profile.unlocked_skins ?? []), s.k];
    await supabase.from("profiles").update({
      unlocked_skins: newSkins,
      piece_skin: s.k,
      corporate_budget: profile.corporate_budget - s.cost,
    }).eq("id", user.id);
    await refreshProfile();
    toast.success(`Skin unlocked`);
  };

  if (!profile) return <AppShell><div className="p-8">{t("loading")}</div></AppShell>;

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto p-6 md:p-8 space-y-6">
        <h1 className="text-3xl font-bold">{t("settings")}</h1>

        <Section title="Language">
          <div className="flex gap-2">
            <Pill active={lang === "en"} onClick={() => setLang("en")}>English</Pill>
            <Pill active={lang === "ru"} onClick={() => setLang("ru")}>Русский</Pill>
          </div>
        </Section>

        <Section title="Theme">
          <div className="flex gap-2">
            <Pill active={theme === "light"} onClick={() => applyTheme("light")}><Sun className="h-3 w-3 mr-1 inline" />Light</Pill>
            <Pill active={theme === "dark"} onClick={() => applyTheme("dark")}><Moon className="h-3 w-3 mr-1 inline" />Dark</Pill>
            <Pill active={theme === "system"} onClick={() => applyTheme("system")}><Monitor className="h-3 w-3 mr-1 inline" />System</Pill>
          </div>
        </Section>

        <Section title="Board theme">
          <div className="grid grid-cols-3 gap-3">
            {BOARD_THEMES.map((b) => (
              <button key={b.k} onClick={() => setBoard(b.k)}
                className={cn("rounded-lg border p-3 text-sm transition",
                  profile.board_theme === b.k ? "border-gold glow-gold" : "border-border hover:border-gold/50")}>
                <div className="grid grid-cols-2 h-10 mb-2 rounded overflow-hidden">
                  <div style={{ background: b.swatch[0] }} />
                  <div style={{ background: b.swatch[1] }} />
                  <div style={{ background: b.swatch[1] }} />
                  <div style={{ background: b.swatch[0] }} />
                </div>
                {b.label}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Piece skin">
          <div className="grid grid-cols-3 gap-3">
            {SKINS.map((s) => {
              const owned = (profile.unlocked_skins ?? []).includes(s.k);
              const active = profile.piece_skin === s.k;
              return (
                <button key={s.k} onClick={() => unlockSkin(s)}
                  className={cn("rounded-lg border p-3 text-sm transition",
                    active ? "border-gold glow-gold" : "border-border hover:border-gold/50")}>
                  <Palette className="h-5 w-5 mx-auto text-gold mb-1" />
                  <div className="font-medium">{s.label}</div>
                  <div className="text-xs text-muted-foreground">{owned ? (active ? "Active" : "Owned") : `$${s.cost} CB`}</div>
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="Notifications">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={notif} onChange={(e) => { setNotif(e.target.checked); localStorage.setItem("csc-notif", e.target.checked ? "1" : "0"); }} />
            <Bell className="h-4 w-4" /> Enable game notifications
          </label>
        </Section>
      </div>
    </AppShell>
  );
}

function Section({ title, children }: any) {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h2 className="text-sm font-semibold mb-3">{title}</h2>
      {children}
    </div>
  );
}
function Pill({ active, onClick, children }: any) {
  return <Button size="sm" variant={active ? "default" : "outline"} onClick={onClick}>{children}</Button>;
}
