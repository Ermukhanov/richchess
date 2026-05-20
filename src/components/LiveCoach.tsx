import { useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { liveCoachComment } from "@/lib/ai-coach.functions";
import { useI18n } from "@/lib/i18n";

const PIECE_VALUE: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

type Event = "sacrifice" | "blunder" | "capture_major" | "check_given" | "check_received" | "fork";

function materialCount(chess: Chess, color: "w" | "b") {
  let total = 0;
  for (const row of chess.board()) {
    for (const sq of row) {
      if (sq && sq.color === color) total += PIECE_VALUE[sq.type] ?? 0;
    }
  }
  return total;
}

/**
 * Watches a Chess instance via FEN/history change and fires the AI coach
 * on key moments: capture of major piece, sacrifice, check, big material swing.
 * Only triggers for moves made by `playerColor`.
 */
export function LiveCoach({
  chess,
  fen,
  history,
  playerColor,
  enabled = true,
}: {
  chess: Chess;
  fen: string;
  history: string[];
  playerColor: "w" | "b";
  enabled?: boolean;
}) {
  const { t, lang } = useI18n();
  const ask = useServerFn(liveCoachComment);
  const [messages, setMessages] = useState<{ id: number; text: string; ts: number; event: Event }[]>([]);
  const [busy, setBusy] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const lastPliesProcessed = useRef(0);
  const prevMaterial = useRef<{ w: number; b: number }>({ w: 39, b: 39 });
  const cooldown = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    if (history.length === 0) {
      prevMaterial.current = { w: 39, b: 39 };
      lastPliesProcessed.current = 0;
      return;
    }
    if (history.length <= lastPliesProcessed.current) return;

    // Process only the latest ply
    const lastSan = history[history.length - 1];
    const moverColor: "w" | "b" = chess.turn() === "w" ? "b" : "w";
    lastPliesProcessed.current = history.length;

    if (moverColor !== playerColor) {
      // opponent moved — update material baseline but don't fire
      prevMaterial.current = { w: materialCount(chess, "w"), b: materialCount(chess, "b") };
      return;
    }

    // Detect events
    const currentMat = { w: materialCount(chess, "w"), b: materialCount(chess, "b") };
    const myDelta = currentMat[playerColor] - prevMaterial.current[playerColor];
    const oppColor: "w" | "b" = playerColor === "w" ? "b" : "w";
    const oppDelta = currentMat[oppColor] - prevMaterial.current[oppColor];

    let event: Event | null = null;
    const isCapture = lastSan.includes("x");
    const givesCheck = lastSan.includes("+") || lastSan.includes("#");

    if (isCapture && oppDelta <= -5) {
      event = "capture_major"; // took a rook+ piece
    } else if (myDelta <= -5 && isCapture) {
      event = "sacrifice"; // we captured but lost more
    } else if (myDelta <= -3 && !isCapture) {
      event = "blunder"; // we lost material without capturing
    } else if (givesCheck) {
      event = "check_given";
    } else if (chess.inCheck() && chess.turn() === playerColor) {
      event = "check_received";
    }

    prevMaterial.current = currentMat;
    if (!event) return;

    // Cooldown: at least 2 plies between AI calls to save credits
    if (lastPliesProcessed.current - cooldown.current < 2) return;
    cooldown.current = lastPliesProcessed.current;

    setBusy(true);
    ask({
      data: { pgn: chess.pgn(), event, san: lastSan, lang: lang as "en" | "ru" },
    })
      .then((r) => {
        if (r?.comment) {
          setMessages((m) => [
            ...m.slice(-3),
            { id: Date.now(), text: r.comment, ts: Date.now(), event: event! },
          ]);
        }
      })
      .catch(() => {})
      .finally(() => setBusy(false));
  }, [fen, history.length, enabled, playerColor, chess, lang, ask]);

  if (!enabled || (messages.length === 0 && !busy)) return null;

  return (
    <div className="fixed top-4 right-4 z-40 w-80 max-w-[calc(100vw-2rem)] pointer-events-none">
      <div className="pointer-events-auto glass-gold rounded-2xl p-3 shadow-2xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gold">
            <Sparkles className="h-3.5 w-3.5" /> {t("liveCoach")}
            {busy && <span className="text-muted-foreground normal-case">— {t("coachThinking")}</span>}
          </div>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="text-muted-foreground hover:text-foreground"
            aria-label="collapse"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <AnimatePresence>
          {!collapsed &&
            messages.slice(-3).map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, x: 20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20 }}
                className="text-sm leading-snug bg-background/50 rounded-lg px-3 py-2 mb-1.5 border border-gold/15"
              >
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground mr-1">
                  {m.event.replace("_", " ")}
                </span>
                <span>{m.text}</span>
              </motion.div>
            ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
