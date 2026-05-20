import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Crown, TrendingUp, Trophy, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import heroImg from "@/assets/hero-trading.jpg";
import boardImg from "@/assets/board-luxury.jpg";

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

  const tickers = [
    { sym: "RICH", val: "+12.4%", up: true },
    { sym: "ELO·1847", val: "▲ 24", up: true },
    { sym: "CB", val: "$10,420", up: true },
    { sym: "COO→e5", val: "★★★★", up: true },
    { sym: "DEV·b3", val: "▼ 5", up: false },
    { sym: "HR×INT", val: "+ M8", up: true },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Hero background image with overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImg}
          alt=""
          width={1920}
          height={1080}
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/70 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.84_0.16_86/0.18),transparent_55%)]" />
      </div>

      {/* Top brand bar */}
      <div className="relative z-10 flex items-center justify-between px-6 md:px-10 pt-6">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Crown className="h-7 w-7 text-gold" strokeWidth={1.6} />
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-gold animate-pulse" />
          </div>
          <span className="font-extrabold tracking-tight text-lg">
            <span className="text-gradient-gold">Rich</span>Chess
          </span>
        </div>
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-gold">
          <Link to="/auth" search={{ mode: "login" }}>{t("login")}</Link>
        </Button>
      </div>

      {/* Ticker */}
      <div className="relative z-10 mt-4 overflow-hidden ticker-mask">
        <motion.div
          animate={{ x: [0, -800] }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
          className="flex gap-6 whitespace-nowrap font-mono text-xs"
        >
          {[...tickers, ...tickers, ...tickers].map((t, i) => (
            <span key={i} className="inline-flex items-center gap-2">
              <span className="text-muted-foreground">{t.sym}</span>
              <span className={t.up ? "text-success" : "text-destructive"}>{t.val}</span>
              <span className="text-border">•</span>
            </span>
          ))}
        </motion.div>
      </div>

      <main className="relative z-10 max-w-6xl mx-auto px-6 md:px-10 pt-12 md:pt-20 pb-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left: copy */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs mb-6"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
              <span className="text-muted-foreground">Live boardroom · 1,247 sharks online</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.05 }}
              className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[0.95]"
            >
              <span className="text-gradient-gold">Rich</span>
              <span className="text-foreground">Chess</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-lg md:text-xl text-muted-foreground mt-5 max-w-lg leading-relaxed"
            >
              {t("tagline")}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-3 mt-8"
            >
              <Button asChild size="lg" className="font-semibold glow-gold-strong group">
                <Link to="/auth" search={{ mode: "signup" }}>
                  {t("getStarted")}
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="glass">
                <Link to="/auth" search={{ mode: "login" }}>{t("login")}</Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="grid grid-cols-3 gap-3 mt-10 max-w-md"
            >
              {[
                { icon: Zap, label: "Live AI Coach", sub: "Mid-game advice" },
                { icon: Trophy, label: "City Rankings", sub: "Compete locally" },
                { icon: TrendingUp, label: "Real ELO", sub: "Tracked moves" },
              ].map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.label} className="glass rounded-xl p-3">
                    <Icon className="h-4 w-4 text-gold mb-2" />
                    <div className="text-xs font-semibold">{f.label}</div>
                    <div className="text-[10px] text-muted-foreground">{f.sub}</div>
                  </div>
                );
              })}
            </motion.div>
          </div>

          {/* Right: floating board card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.9, delay: 0.4 }}
            className="relative hidden md:block"
          >
            <div className="absolute inset-0 rounded-3xl bg-gold/20 blur-3xl" />
            <div className="relative glass-gold rounded-3xl p-3 rotate-2 hover:rotate-0 transition-transform duration-500">
              <img
                src={boardImg}
                alt="Luxury chess board with golden executive pieces"
                width={1024}
                height={1024}
                className="w-full rounded-2xl"
                loading="eager"
              />
              <div className="absolute bottom-6 left-6 right-6 glass-strong rounded-xl p-3 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Live Match</div>
                  <div className="font-mono text-sm">COO → e5 · M-in-3</div>
                </div>
                <div className="text-gold font-bold text-sm">+$420 CB</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom roles strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-16 md:mt-24 glass rounded-2xl px-6 py-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs md:text-sm"
        >
          {[
            ["Pawn", "Intern"],
            ["Knight", "Marketer"],
            ["Bishop", "HR"],
            ["Rook", "Developer"],
            ["Queen", "COO"],
            ["King", "CEO"],
          ].map(([p, r]) => (
            <span key={p} className="inline-flex items-center gap-1.5">
              <span className="text-muted-foreground">{p}</span>
              <ArrowRight className="h-3 w-3 text-gold" />
              <span className="font-semibold">{r}</span>
            </span>
          ))}
        </motion.div>
      </main>
    </div>
  );
}
