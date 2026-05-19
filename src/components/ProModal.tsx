import { Crown, Check, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ProModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const features = [
    { label: "Play vs AI", free: true, pro: true },
    { label: "Multiplayer + 4-player", free: true, pro: true },
    { label: "AI Coach analysis", free: "3 / month", pro: "Unlimited" },
    { label: "Priority matchmaking", free: false, pro: true },
    { label: "Diamond CEO skin", free: false, pro: true },
    { label: "Stats export (CSV)", free: false, pro: true },
    { label: "Ad-free experience", free: true, pro: true },
  ];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Crown className="h-6 w-6 text-gold" /> Go Pro
          </DialogTitle>
        </DialogHeader>
        <div className="text-sm text-muted-foreground -mt-2">
          Unlock the executive suite. <span className="text-gold font-semibold">$4.99 / mo</span>
        </div>
        <table className="w-full text-sm mt-2">
          <thead>
            <tr className="text-xs uppercase text-muted-foreground border-b border-border">
              <th className="text-left py-2">Feature</th>
              <th className="py-2">Free</th>
              <th className="py-2 text-gold">Pro</th>
            </tr>
          </thead>
          <tbody>
            {features.map((f) => (
              <tr key={f.label} className="border-b border-border/50">
                <td className="py-2">{f.label}</td>
                <td className="text-center py-2">
                  {typeof f.free === "boolean" ? f.free ? <Check className="h-4 w-4 inline text-green-500" /> : <X className="h-4 w-4 inline text-muted-foreground" /> : <span className="text-xs">{f.free}</span>}
                </td>
                <td className="text-center py-2">
                  {typeof f.pro === "boolean" ? f.pro ? <Check className="h-4 w-4 inline text-gold" /> : <X className="h-4 w-4 inline text-muted-foreground" /> : <span className="text-xs text-gold">{f.pro}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Button
          className="w-full mt-2 font-semibold"
          onClick={() => toast.info("Stripe checkout coming soon — sales@corporatesharks.chess")}
        >
          <Crown className="h-4 w-4 mr-2" /> Subscribe — $4.99 / mo
        </Button>
        <p className="text-[10px] text-muted-foreground text-center">Cancel anytime. Pro applies to the workspace owner.</p>
      </DialogContent>
    </Dialog>
  );
}
