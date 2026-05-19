import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { Chess, type Square } from "chess.js";
import { Chessboard } from "react-chessboard";
import { motion, AnimatePresence } from "framer-motion";

type BoardTheme = "wall_street" | "silicon_valley" | "tokyo_office";

const themes: Record<BoardTheme, { dark: string; light: string }> = {
  wall_street: { dark: "oklch(0.32 0.04 255)", light: "oklch(0.85 0.04 90)" },
  silicon_valley: { dark: "oklch(0.55 0.06 200)", light: "oklch(0.95 0.02 200)" },
  tokyo_office: { dark: "oklch(0.42 0.08 50)", light: "oklch(0.88 0.06 70)" },
};

export type ChessGameHandle = {
  chess: Chess;
  fen: string;
};

export interface ChessGameProps {
  fen?: string;
  orientation?: "white" | "black";
  disabled?: boolean;
  theme?: BoardTheme;
  onMove?: (move: { from: string; to: string; promotion?: string; san: string; fen: string }) => void;
  lastMove?: { from: string; to: string } | null;
  externalChess?: Chess;
}

export function ChessGame({
  fen,
  orientation = "white",
  disabled = false,
  theme = "wall_street",
  onMove,
  lastMove,
  externalChess,
}: ChessGameProps) {
  const internalRef = useRef(externalChess ?? new Chess(fen));
  const chess = externalChess ?? internalRef.current;
  const [, force] = useState(0);
  const rerender = useCallback(() => force((x) => x + 1), []);
  const [selected, setSelected] = useState<string | null>(null);
  const [legalTargets, setLegalTargets] = useState<string[]>([]);
  const [promotionMove, setPromotionMove] = useState<{ from: string; to: string } | null>(null);

  useEffect(() => {
    if (fen && chess.fen() !== fen) {
      try {
        chess.load(fen);
        rerender();
      } catch {}
    }
  }, [fen, chess, rerender]);

  const colors = themes[theme] ?? themes.wall_street;

  const kingInCheckSquare = useMemo(() => {
    if (!chess.inCheck()) return null;
    const turn = chess.turn();
    const board = chess.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.type === "k" && p.color === turn) {
          return String.fromCharCode(97 + c) + (8 - r);
        }
      }
    }
    return null;
  }, [chess.fen()]);

  const squareStyles = useMemo(() => {
    const s: Record<string, React.CSSProperties> = {};
    if (lastMove) {
      s[lastMove.from] = { background: "oklch(0.7 0.15 90 / 0.35)" };
      s[lastMove.to] = { background: "oklch(0.7 0.15 90 / 0.45)" };
    }
    for (const t of legalTargets) {
      const isCapture = chess.get(t as Square);
      s[t] = isCapture
        ? { boxShadow: "inset 0 0 0 4px oklch(0.65 0.2 30 / 0.7)", borderRadius: "4px" }
        : { background: "radial-gradient(circle, oklch(0.6 0.12 150 / 0.6) 22%, transparent 25%)" };
    }
    if (selected) s[selected] = { background: "oklch(0.75 0.15 90 / 0.55)" };
    if (kingInCheckSquare) s[kingInCheckSquare] = { background: "oklch(0.55 0.25 25 / 0.7)" };
    return s;
  }, [legalTargets, selected, lastMove, kingInCheckSquare, chess]);

  const tryMove = (from: string, to: string, promotion?: string): boolean => {
    if (disabled) return false;
    // Check if promotion needed
    const piece = chess.get(from as Square);
    const isPromo =
      piece?.type === "p" &&
      ((piece.color === "w" && to[1] === "8") || (piece.color === "b" && to[1] === "1"));
    if (isPromo && !promotion) {
      const moves = chess.moves({ square: from as Square, verbose: true });
      if (moves.some((m) => m.to === to)) {
        setPromotionMove({ from, to });
        return false;
      }
    }
    try {
      const m = chess.move({ from, to, promotion: (promotion as any) ?? "q" });
      if (!m) return false;
      setSelected(null);
      setLegalTargets([]);
      rerender();
      onMove?.({ from, to, promotion, san: m.san, fen: chess.fen() });
      return true;
    } catch {
      return false;
    }
  };

  const onSquareClick = ({ square }: { square: string }) => {
    if (disabled) return;
    if (selected && legalTargets.includes(square)) {
      tryMove(selected, square);
      return;
    }
    const piece = chess.get(square as Square);
    if (piece && piece.color === chess.turn()) {
      const moves = chess.moves({ square: square as Square, verbose: true });
      setSelected(square);
      setLegalTargets(moves.map((m) => m.to));
    } else {
      setSelected(null);
      setLegalTargets([]);
    }
  };

  const options = useMemo(
    () => ({
      position: chess.fen(),
      onPieceDrop: ({ sourceSquare, targetSquare }: any) =>
        targetSquare ? tryMove(sourceSquare, targetSquare) : false,
      onSquareClick,
      boardOrientation: orientation,
      animationDurationInMs: 220,
      darkSquareStyle: { backgroundColor: colors.dark },
      lightSquareStyle: { backgroundColor: colors.light },
      squareStyles,
      id: "csc-board",
    }),
    [chess.fen(), orientation, colors, squareStyles, selected, legalTargets, disabled]
  );

  const choosePromotion = (p: "q" | "r" | "b" | "n") => {
    if (!promotionMove) return;
    const { from, to } = promotionMove;
    setPromotionMove(null);
    tryMove(from, to, p);
  };

  return (
    <div className="relative">
      <Chessboard options={options as any} />
      <AnimatePresence>
        {promotionMove && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm rounded-lg"
          >
            <div className="bg-card border border-gold rounded-xl p-4 flex gap-3">
              {(["q", "r", "b", "n"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => choosePromotion(p)}
                  className="w-16 h-16 rounded-md bg-background border border-border hover:border-gold hover:glow-gold flex items-center justify-center text-3xl"
                  title={({ q: "COO", r: "Developer", b: "HR", n: "Marketer" } as any)[p]}
                >
                  {({ q: "♛", r: "♜", b: "♝", n: "♞" } as any)[p]}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
