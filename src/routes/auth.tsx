import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Briefcase, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useI18n } from "@/lib/i18n";

const searchSchema = z.object({ mode: z.enum(["login", "signup"]).optional().default("login") });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(mode === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        toast.success("Account created! Welcome aboard.");
        navigate({ to: "/onboarding" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back.");
        navigate({ to: "/" });
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) {
      toast.error("Google sign-in failed");
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <Link to="/" className="flex items-center gap-2 mb-8">
        <Briefcase className="h-8 w-8 text-gold" />
        <Crown className="h-3 w-3 text-gold -ml-3 -mt-4" />
        <span className="font-bold text-gradient-gold ml-1">Corporate Sharks</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-card border border-border rounded-xl p-6 shadow-2xl"
      >
        <h1 className="text-2xl font-bold mb-1">{isSignup ? t("signup") : t("login")}</h1>
        <p className="text-sm text-muted-foreground mb-6">
          {isSignup ? "Join the boardroom" : t("welcomeBack")}
        </p>

        <Button onClick={onGoogle} variant="outline" className="w-full mb-4" disabled={loading}>
          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35 11.1h-9.17v2.92h5.25c-.23 1.5-1.7 4.4-5.25 4.4-3.16 0-5.74-2.62-5.74-5.84s2.58-5.84 5.74-5.84c1.8 0 3.01.77 3.7 1.43l2.52-2.43C16.66 4.1 14.6 3.1 12.18 3.1 6.95 3.1 2.7 7.36 2.7 12.58s4.25 9.48 9.48 9.48c5.47 0 9.1-3.84 9.1-9.25 0-.62-.07-1.1-.17-1.71z"/></svg>
          {t("continueWithGoogle")}
        </Button>

        <div className="flex items-center gap-2 text-xs text-muted-foreground my-4">
          <div className="flex-1 h-px bg-border" />
          {t("or")}
          <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <Label htmlFor="email">{t("email")}</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="password">{t("password")}</Label>
            <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="w-full font-semibold" disabled={loading}>
            {isSignup ? t("signup") : t("login")}
          </Button>
        </form>

        <button
          onClick={() => setIsSignup(!isSignup)}
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground mt-4"
        >
          {isSignup ? `${t("login")} →` : `${t("signup")} →`}
        </button>
      </motion.div>
    </div>
  );
}
