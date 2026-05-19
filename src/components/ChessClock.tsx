import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function parseTimeControl(tc: string): { initialMs: number; incMs: number } {
  const [m, i] = tc.split("+").map((n) => parseInt(n, 10));
  return { initialMs: (m || 5) * 60_000, incMs: (i || 0) * 1000 };
}

export function ChessClock({
  initialMs,
  incMs,
  activeColor,
  running,
  onFlag,
  label,
}: {
  initialMs: number;
  incMs: number;
  activeColor: "w" | "b";
  running: boolean;
  onFlag?: (color: "w" | "b") => void;
  label?: { w: string; b: string };
}) {
  const [white, setWhite] = useState(initialMs);
  const [black, setBlack] = useState(initialMs);
  const [last, setLast] = useState(activeColor);

  useEffect(() => {
    if (last !== activeColor) {
      // Apply increment to the player who just moved
      if (last === "w") setWhite((w) => w + incMs);
      else setBlack((b) => b + incMs);
      setLast(activeColor);
    }
  }, [activeColor, incMs, last]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      if (activeColor === "w") {
        setWhite((w) => {
          const n = w - 100;
          if (n <= 0) {
            onFlag?.("w");
            return 0;
          }
          return n;
        });
      } else {
        setBlack((b) => {
          const n = b - 100;
          if (n <= 0) {
            onFlag?.("b");
            return 0;
          }
          return n;
        });
      }
    }, 100);
    return () => clearInterval(id);
  }, [running, activeColor, onFlag]);

  const fmt = (ms: number) => {
    const s = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex gap-2">
      <Clock label={label?.b ?? "Black"} time={fmt(black)} active={activeColor === "b" && running} low={black < 30000} />
      <Clock label={label?.w ?? "White"} time={fmt(white)} active={activeColor === "w" && running} low={white < 30000} />
    </div>
  );
}

function Clock({ label, time, active, low }: { label: string; time: string; active: boolean; low: boolean }) {
  return (
    <div
      className={cn(
        "flex-1 rounded-lg px-3 py-2 border transition-all font-mono",
        active ? "border-gold glow-gold bg-card" : "border-border bg-background/50",
        low && "text-destructive"
      )}
    >
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold tabular-nums">{time}</div>
    </div>
  );
}
