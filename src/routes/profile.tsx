import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { Camera, Save, Trophy, TrendingUp, Coins } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({ component: ProfilePage });

const ACHIEVEMENTS = [
  { code: "first_win", label: "First Win", icon: "🏆", check: (p: any) => p.wins >= 1 },
  { code: "ceo_killer", label: "CEO Killer", icon: "👑", check: (p: any) => p.wins >= 10 },
  { code: "tycoon", label: "Budget Tycoon", icon: "💰", check: (p: any) => p.cb_earned >= 1000 },
  { code: "streak_5", label: "Hot Streak", icon: "🔥", check: (p: any) => p.best_win_streak >= 5 },
  { code: "scholar", label: "Boardroom Scholar", icon: "📚", check: (p: any) => (p.lessons_completed?.length ?? 0) >= 3 },
];

function ProfilePage() {
  const { t } = useI18n();
  const { user, profile, refreshProfile } = useRequireAuth();
  const [username, setUsername] = useState("");
  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [recent, setRecent] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!profile) return;
    setUsername(profile.username ?? "");
    setTitle(profile.company_title ?? "");
    setCity(profile.city ?? "");
    setCountry(profile.country ?? "");
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    supabase.from("games").select("*").or(`white_player_id.eq.${user.id},black_player_id.eq.${user.id}`)
      .order("created_at", { ascending: false }).limit(10).then(({ data }) => setRecent(data ?? []));
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from("profiles").update({ username, company_title: title, city, country }).eq("id", user.id);
    await refreshProfile();
    setSaving(false);
    toast.success("Profile saved");
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) return toast.error(error.message);
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: data.publicUrl + `?v=${Date.now()}` }).eq("id", user.id);
    await refreshProfile();
    toast.success("Avatar updated");
  };

  if (!profile) return <AppShell><div className="p-8">{t("loading")}</div></AppShell>;

  const games = profile.wins + profile.losses + profile.draws;
  const winRate = games > 0 ? Math.round((profile.wins / games) * 100) : 0;
  const earned = ACHIEVEMENTS.filter((a) => a.check(profile));

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto p-6 md:p-8 space-y-6">
        <div className="bg-card border border-border rounded-xl p-6 flex flex-col md:flex-row gap-6 items-start">
          <div className="relative">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} className="h-24 w-24 rounded-full object-cover border-2 border-gold" />
            ) : (
              <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center text-3xl font-bold text-gold">
                {(profile.username ?? "?")[0]?.toUpperCase()}
              </div>
            )}
            <button onClick={() => fileRef.current?.click()} className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow">
              <Camera className="h-4 w-4" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
          </div>
          <div className="flex-1 grid grid-cols-2 gap-3 text-sm">
            <Field label="Username" value={username} onChange={setUsername} />
            <Field label="Company title" value={title} onChange={setTitle} />
            <Field label="City" value={city} onChange={setCity} />
            <Field label="Country" value={country} onChange={setCountry} />
            <Button onClick={save} disabled={saving} className="col-span-2 mt-2"><Save className="h-4 w-4 mr-1" /> Save</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat icon={Trophy} label="ELO" value={profile.elo_rating} />
          <Stat icon={TrendingUp} label="Win rate" value={`${winRate}%`} />
          <Stat icon={Coins} label="$CB" value={profile.corporate_budget.toLocaleString()} />
          <Stat icon={Trophy} label="Best streak" value={profile.best_win_streak} />
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-sm font-semibold mb-3">Achievements</h2>
          <div className="flex flex-wrap gap-2">
            {ACHIEVEMENTS.map((a) => {
              const got = earned.find((e) => e.code === a.code);
              return (
                <div key={a.code} className={`px-3 py-2 rounded-lg border text-sm ${got ? "border-gold bg-gold/10 text-gold" : "border-border opacity-40"}`}>
                  <span className="mr-1">{a.icon}</span>{a.label}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-sm font-semibold mb-3">Recent games</h2>
          {recent.length === 0 ? (
            <p className="text-xs text-muted-foreground">No games yet.</p>
          ) : (
            <div className="space-y-1 text-sm">
              {recent.map((g) => (
                <div key={g.id} className="flex justify-between py-1 border-b border-border/50">
                  <span className="capitalize">{g.game_mode}</span>
                  <span className={g.result === "win" ? "text-green-500" : g.result === "loss" ? "text-destructive" : "text-muted-foreground"}>{g.result}</span>
                  <span className="text-muted-foreground text-xs">{new Date(g.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (s: string) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs uppercase text-muted-foreground">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="bg-background border border-border rounded-md px-2 py-1.5" />
    </label>
  );
}
function Stat({ icon: Icon, label, value }: any) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <Icon className="h-4 w-4 text-gold mb-1" />
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
