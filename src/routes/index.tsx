import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Briefcase, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({ component: Splash });

function Splash() {
  const { t } = useI18n();
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (user && profile) {
      navigate({ to: profile.onboarded ? "/dashboard" : "/onboarding" });
    }
  }, [user, profile, loading, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative mb-8"
      >
        <div className="relative inline-block">
          <Briefcase className="h-24 w-24 text-gold" strokeWidth={1.5} />
          <motion.div
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="absolute -top-3 -right-3"
          >
            <Crown className="h-10 w-10 text-gold drop-shadow-[0_0_8px_oklch(0.82_0.16_85)]" />
          </motion.div>
        </div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-5xl md:text-6xl font-extrabold text-gradient-gold mb-3 tracking-tight"
      >
        Corporate Sharks
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-lg md:text-xl text-muted-foreground mb-12 max-w-md"
      >
        {t("tagline")}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="flex flex-col sm:flex-row gap-3 w-full max-w-xs"
      >
        <Button asChild size="lg" className="flex-1 font-semibold glow-gold">
          <Link to="/auth" search={{ mode: "signup" }}>{t("getStarted")}</Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="flex-1">
          <Link to="/auth" search={{ mode: "login" }}>{t("login")}</Link>
        </Button>
      </motion.div>

      <p className="mt-16 text-xs text-muted-foreground">
        Pawn → Intern · Knight → Marketer · Bishop → HR · Rook → Developer · Queen → COO · King → CEO
      </p>
    </div>
  );
}
