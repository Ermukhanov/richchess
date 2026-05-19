import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { KZ_CITIES_UNIQUE } from "@/lib/kz-cities";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";

export const Route = createFileRoute("/onboarding")({ component: Onboarding });

function Onboarding() {
  const { t, lang, setLang } = useI18n();
  const { user, profile, refreshProfile, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    username: "",
    company_title: "",
    city: "",
    language: lang,
    level: "intermediate" as "beginner" | "intermediate" | "expert",
  });

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/auth" });
    else if (profile?.onboarded) navigate({ to: "/dashboard" });
    else if (profile?.username) setData((d) => ({ ...d, username: profile.username! }));
  }, [user, profile, loading, navigate]);

  const total = 6; // 5 steps + final
  const progress = ((step + 1) / total) * 100;

  const next = () => setStep((s) => Math.min(s + 1, total - 1));
  const skip = () => next();

  const finish = async () => {
    if (!user) return;
    const eloMap = { beginner: 800, intermediate: 1200, expert: 1600 };
    const { error } = await supabase
      .from("profiles")
      .update({
        username: data.username || null,
        company_title: data.company_title || null,
        city: data.city || null,
        language: data.language,
        elo_rating: eloMap[data.level],
        onboarded: true,
        corporate_budget: 1000,
      })
      .eq("id", user.id);
    if (error) { toast.error(error.message); return; }
    setLang(data.language);
    await refreshProfile();
    toast.success(t("welcome"));
    navigate({ to: "/dashboard" });
  };

  const roles = [
    { key: "CEO / Founder", label: t("role_ceo") },
    { key: "Manager", label: t("role_manager") },
    { key: "Developer", label: t("role_dev") },
    { key: "Marketer", label: t("role_marketer") },
    { key: "Student", label: t("role_student") },
    { key: "Other", label: t("role_other") },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Progress value={progress} className="mb-8 h-2" />
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="bg-card border border-border rounded-xl p-6"
          >
            {step === 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">{t("whatsName")}</h2>
                <Input autoFocus value={data.username} onChange={(e) => setData({ ...data, username: e.target.value })} placeholder="Alex Sharkman" />
                <Button onClick={next} disabled={!data.username} className="w-full mt-4">{t("next")}</Button>
              </div>
            )}
            {step === 1 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">{t("yourRole")}</h2>
                <div className="grid grid-cols-2 gap-2">
                  {roles.map((r) => (
                    <button
                      key={r.key}
                      onClick={() => { setData({ ...data, company_title: r.key }); setTimeout(next, 150); }}
                      className={cn(
                        "rounded-lg border p-4 text-sm font-medium transition",
                        data.company_title === r.key ? "border-gold bg-gold/10 text-gold" : "border-border hover:border-gold/50",
                      )}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
                <Button variant="ghost" onClick={skip} className="w-full mt-4 text-muted-foreground">{t("skip")}</Button>
              </div>
            )}
            {step === 2 && <CityStep data={data} setData={setData} next={next} skip={skip} t={t} />}
            {step === 3 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">{t("chooseLanguage")}</h2>
                <div className="grid grid-cols-2 gap-2">
                  {(["en", "ru"] as const).map((l) => (
                    <button
                      key={l}
                      onClick={() => { setData({ ...data, language: l }); setLang(l); }}
                      className={cn(
                        "rounded-lg border p-4 font-semibold transition",
                        data.language === l ? "border-gold bg-gold/10 text-gold" : "border-border hover:border-gold/50",
                      )}
                    >
                      {l === "en" ? "English" : "Русский"}
                    </button>
                  ))}
                </div>
                <Button onClick={next} className="w-full mt-4">{t("next")}</Button>
              </div>
            )}
            {step === 4 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">{t("pickLevel")}</h2>
                <div className="space-y-2">
                  {([
                    { k: "beginner", label: t("beginner"), elo: "ELO ~800" },
                    { k: "intermediate", label: t("intermediate"), elo: "ELO ~1200" },
                    { k: "expert", label: t("expert"), elo: "ELO ~1600" },
                  ] as const).map((l) => (
                    <button
                      key={l.k}
                      onClick={() => setData({ ...data, level: l.k })}
                      className={cn(
                        "w-full rounded-lg border p-4 text-left transition flex items-center justify-between",
                        data.level === l.k ? "border-gold bg-gold/10" : "border-border hover:border-gold/50",
                      )}
                    >
                      <span className="font-semibold">{l.label}</span>
                      <span className="text-xs text-muted-foreground">{l.elo}</span>
                    </button>
                  ))}
                </div>
                <Button onClick={next} className="w-full mt-4">{t("next")}</Button>
              </div>
            )}
            {step === 5 && (
              <div className="text-center py-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.6 }}
                  className="text-6xl mb-4"
                >
                  🦈
                </motion.div>
                <h2 className="text-2xl font-bold mb-2">{t("welcome")}, {data.username || "Shark"}!</h2>
                <p className="text-muted-foreground mb-6">+1,000 $CB</p>
                {/* Coins rain */}
                <div className="relative h-24 mb-4 overflow-hidden">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ y: -40, x: i * 24 - 120, opacity: 0 }}
                      animate={{ y: 100, opacity: [0, 1, 0] }}
                      transition={{ duration: 1.5, delay: i * 0.08, repeat: Infinity, repeatDelay: 1 }}
                      className="absolute left-1/2 text-2xl"
                    >
                      🪙
                    </motion.div>
                  ))}
                </div>
                <Button onClick={finish} size="lg" className="w-full glow-gold font-semibold">
                  {t("finish")}
                </Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
        {step < 5 && (
          <p className="text-center text-xs text-muted-foreground mt-4">{step + 1} / 5</p>
        )}
      </div>
    </div>
  );
}
