import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { Chess } from "chess.js";
import { ChessGame } from "@/components/ChessGame";
import { BookOpen, CheckCircle2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/learn")({ component: LearnPage });

type Lesson = {
  id: string;
  title: string;
  intro: string;
  puzzle: { fen: string; solution: string; hint: string };
  reward: number;
};

const LESSONS: Lesson[] = [
  {
    id: "opening",
    title: "Opening Principles",
    intro: "In any boardroom, the first 5 minutes set the tone. Develop your Marketers (knights) and HR (bishops) early, secure the center, and protect your CEO with castling.",
    puzzle: { fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2", solution: "Nf3", hint: "Develop a Marketer to f3 to attack the central pawn." },
    reward: 50,
  },
  {
    id: "center",
    title: "Control the Center",
    intro: "Whoever owns the central market gets pricing power. Place pawns on d4 and e4. Pieces in the center attack twice as many squares.",
    puzzle: { fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", solution: "e4", hint: "The classic CEO move — claim the central market." },
    reward: 50,
  },
  {
    id: "values",
    title: "Piece Values",
    intro: "Know your headcount cost: Intern=1, Marketer/HR=3, Developer=5, COO=9, CEO=∞. Never trade a Developer for a Marketer without a clear ROI.",
    puzzle: { fen: "4k3/8/8/8/4r3/8/4R3/4K3 w - - 0 1", solution: "Rxe4", hint: "Equal trade — but you're a tempo up. Take it." },
    reward: 50,
  },
  {
    id: "kingsafety",
    title: "King Safety",
    intro: "Your CEO must never be exposed to a hostile takeover. Castle early. Keep three Interns in front of him. Never move them without a plan.",
    puzzle: { fen: "rnbqk2r/ppppbppp/5n2/4p3/4P3/5N2/PPPPBPPP/RNBQK2R w KQkq - 4 4", solution: "O-O", hint: "Move your CEO to safety with castling (O-O)." },
    reward: 75,
  },
  {
    id: "endgame",
    title: "Endgame Basics",
    intro: "When the board empties, your CEO becomes a power player. Activate him toward the center. Push Interns to be promoted to COOs.",
    puzzle: { fen: "8/8/8/4k3/8/8/4P3/4K3 w - - 0 1", solution: "Kd2", hint: "Bring the CEO forward to support the Intern's promotion." },
    reward: 75,
  },
];

function LearnPage() {
  const { user, profile, refreshProfile } = useRequireAuth();
  const { t } = useI18n();
  const [active, setActive] = useState<Lesson | null>(null);
  const [solved, setSolved] = useState(false);

  const completed: string[] = profile?.lessons_completed ?? [];

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto p-6 md:p-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2"><BookOpen className="h-7 w-7 text-gold" /> {t("learn")}</h1>
        <p className="text-muted-foreground mb-6">Strategic thinking modules for tomorrow's executives. {profile && `XP: ${profile.xp} • Streak: ${profile.streak_days}d`}</p>

        {!active ? (
          <div className="grid md:grid-cols-2 gap-4">
            {LESSONS.map((l, i) => {
              const done = completed.includes(l.id);
              return (
                <button key={l.id} onClick={() => { setActive(l); setSolved(false); }}
                  className={cn("text-left bg-card border rounded-xl p-5 transition hover:border-gold",
                    done ? "border-gold/50" : "border-border")}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Lesson {i + 1}</span>
                    {done && <CheckCircle2 className="h-4 w-4 text-gold" />}
                  </div>
                  <h3 className="font-semibold mb-1">{l.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">{l.intro}</p>
                  <div className="mt-3 text-xs text-gold">+{l.reward} $CB</div>
                </button>
              );
            })}
          </div>
        ) : (
          <LessonView lesson={active} solved={solved} onClose={() => setActive(null)}
            onSolve={async () => {
              setSolved(true);
              if (!user || !profile) return;
              if (completed.includes(active.id)) return;
              const next = [...completed, active.id];
              await supabase.from("profiles").update({
                lessons_completed: next,
                xp: profile.xp + 25,
                corporate_budget: profile.corporate_budget + active.reward,
              }).eq("id", user.id);
              await refreshProfile();
              toast.success(`+${active.reward} $CB earned`);
            }} />
        )}
      </div>
    </AppShell>
  );
}

function LessonView({ lesson, solved, onSolve, onClose }: { lesson: Lesson; solved: boolean; onSolve: () => void; onClose: () => void }) {
  const [chess] = useState(() => new Chess(lesson.puzzle.fen));
  const [fen, setFen] = useState(chess.fen());
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);

  const onMove = (m: { san: string; fen: string }) => {
    setFen(m.fen);
    const ok = m.san.replace("+", "").replace("#", "") === lesson.puzzle.solution.replace("+", "").replace("#", "");
    if (ok) {
      setFeedback("correct");
      onSolve();
    } else {
      setFeedback("wrong");
      setTimeout(() => {
        chess.undo();
        setFen(chess.fen());
        setFeedback(null);
      }, 1200);
    }
  };

  return (
    <div className="grid md:grid-cols-[1fr,300px] gap-6">
      <div className="bg-card border border-border rounded-xl p-4">
        <ChessGame externalChess={chess} fen={fen} onMove={onMove} disabled={solved} />
        {feedback === "correct" && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center mt-3 text-green-500 font-semibold">
            ✓ Correct! Brilliant executive thinking.
          </motion.div>
        )}
        {feedback === "wrong" && <div className="text-center mt-3 text-destructive">Not the move. Try again.</div>}
      </div>
      <aside className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-bold mb-2">{lesson.title}</h2>
        <p className="text-sm text-muted-foreground mb-4">{lesson.intro}</p>
        <div className="text-xs uppercase text-gold mb-1">Puzzle</div>
        <p className="text-sm mb-4">{lesson.puzzle.hint}</p>
        {solved ? (
          <Button onClick={onClose} className="w-full"><ArrowRight className="h-4 w-4 mr-1" />Next</Button>
        ) : (
          <Button variant="outline" onClick={onClose} className="w-full">Back</Button>
        )}
      </aside>
    </div>
  );
}
