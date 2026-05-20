import { Crown, Check, X, Sparkles, Zap, Trophy, BarChart3, Palette } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ProModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const features = [
    { icon: Zap, label: "AI games per day", free: "5", pro: "Unlimited" },
    { icon: Sparkles, label: "Live AI Coach in-game", free: "—", pro: "Unlimited" },
    { icon: BarChart3, label: "Post-game deep analysis", free: "3 / mo", pro: "Unlimited" },
    { icon: Trophy, label: "Priority matchmaking", free: false, pro: true },
    { icon: Palette, label: "All board themes + Diamond CEO skin", free: false, pro: true },
    { icon: Check, label: "Ad-free + CSV export", free: true, pro: true },
  ];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg glass-strong border-gold/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Crown className="h-6 w-6 text-gold" />
            <span>
              Go <span className="text-gradient-gold">Pro</span>
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="rounded-xl glass-gold p-4 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Boardroom Pass</div>
            <div className="text-3xl font-extrabold text-gradient-gold">$4.99<span className="text-base text-muted-foreground font-normal">/mo</span></div>
            <div className="text-[10px] text-muted-foreground mt-0.5">or $39/yr · save 35%</div>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-1 rounded-full bg-gold/15 text-gold px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
              <Sparkles className="h-3 w-3" /> 7-day trial
            </div>
          </div>
        </div>

        <div className="space-y-2 mt-2">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.label} className="flex items-center gap-3 text-sm border-b border-border/50 pb-2">
                <Icon className="h-4 w-4 text-gold flex-shrink-0" />
                <span className="flex-1">{f.label}</span>
                <span className="text-xs text-muted-foreground w-16 text-center">
                  {typeof f.free === "boolean" ? (f.free ? <Check className="h-3 w-3 inline text-success" /> : <X className="h-3 w-3 inline" />) : f.free}
                </span>
                <span className="text-xs text-gold font-semibold w-20 text-center">
                  {typeof f.pro === "boolean" ? (f.pro ? <Check className="h-3 w-3 inline" /> : <X className="h-3 w-3 inline" />) : f.pro}
                </span>
              </div>
            );
          })}
        </div>

        <Button
          className="w-full mt-3 font-semibold glow-gold-strong h-11"
          onClick={() => toast.info("Payments coming soon — sales@richchess.app", { description: "We're finalizing Stripe integration." })}
        >
          <Crown className="h-4 w-4 mr-2" /> Start 7-day free trial
        </Button>
        <p className="text-[10px] text-muted-foreground text-center">Cancel anytime. No charge during trial.</p>
      </DialogContent>
    </Dialog>
  );
}
