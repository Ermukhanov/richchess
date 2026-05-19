import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Home, Swords, BookOpen, Trophy, Users, User, Settings, Crown, LogOut, Briefcase } from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (r) => r.location.pathname });

  const nav = [
    { to: "/dashboard", label: t("home"), icon: Home },
    { to: "/play", label: t("play"), icon: Swords },
    { to: "/learn", label: t("learn"), icon: BookOpen },
    { to: "/leaderboard", label: t("leaderboard"), icon: Trophy },
    { to: "/community", label: t("community"), icon: Users },
    { to: "/profile", label: t("profile"), icon: User },
    { to: "/settings", label: t("settings"), icon: Settings },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-sidebar border-r border-sidebar-border p-4">
        <Link to="/dashboard" className="flex items-center gap-2 mb-8 px-2">
          <div className="relative">
            <Briefcase className="h-7 w-7 text-gold" />
            <Crown className="h-3 w-3 text-gold absolute -top-1 -right-1" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold text-gradient-gold">Corporate Sharks</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Chess</span>
          </div>
        </Link>

        <nav className="flex-1 space-y-1">
          {nav.map((item) => {
            const active = path === item.to || path.startsWith(item.to + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground glow-gold"
                    : "text-sidebar-foreground hover:bg-card",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 space-y-2">
          <Button variant="default" className="w-full font-semibold">
            <Crown className="h-4 w-4 mr-2" /> {t("goPro")}
          </Button>
          {profile && (
            <div className="rounded-md bg-card p-3 text-xs">
              <div className="font-semibold truncate">{profile.username ?? profile.email}</div>
              <div className="text-gold font-mono mt-1">
                ${profile.corporate_budget.toLocaleString()} CB
              </div>
              <div className="text-muted-foreground mt-0.5">ELO {profile.elo_rating}</div>
              <button onClick={handleSignOut} className="mt-2 flex items-center gap-1 text-muted-foreground hover:text-foreground">
                <LogOut className="h-3 w-3" /> {t("logout")}
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 pb-20 md:pb-0">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-sidebar border-t border-sidebar-border flex justify-around py-2">
        {nav.slice(0, 5).map((item) => {
          const active = path === item.to || path.startsWith(item.to + "/");
          const Icon = item.icon;
          return (
            <Link key={item.to} to={item.to} className={cn("flex flex-col items-center gap-1 px-2 py-1 text-[10px]", active ? "text-gold" : "text-muted-foreground")}>
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
