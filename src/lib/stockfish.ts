// Lightweight Stockfish wrapper. Loads stockfish.js from a CDN as a Blob worker
// so it works under our bundler without needing a copy in /public.

let workerPromise: Promise<Worker> | null = null;

async function getWorker(): Promise<Worker> {
  if (workerPromise) return workerPromise;
  workerPromise = (async () => {
    // stockfish.js 10.0.2 is a single-file classic worker — small and reliable
    const url = "https://cdn.jsdelivr.net/npm/stockfish.js@10.0.2/stockfish.js";
    const res = await fetch(url);
    const code = await res.text();
    const blob = new Blob([code], { type: "application/javascript" });
    const w = new Worker(URL.createObjectURL(blob));
    // Initialize UCI
    await new Promise<void>((resolve) => {
      const onMsg = (e: MessageEvent) => {
        if (typeof e.data === "string" && e.data.includes("uciok")) {
          w.removeEventListener("message", onMsg);
          resolve();
        }
      };
      w.addEventListener("message", onMsg);
      w.postMessage("uci");
    });
    return w;
  })();
  return workerPromise;
}

export type AiLevel = "intern" | "manager" | "director" | "ceo";

const depthFor: Record<AiLevel, number> = {
  intern: 1,
  manager: 5,
  director: 10,
  ceo: 18,
};

export async function getBestMove(fen: string, level: AiLevel): Promise<string | null> {
  const w = await getWorker();
  return new Promise((resolve) => {
    const handler = (e: MessageEvent) => {
      const line = typeof e.data === "string" ? e.data : "";
      if (line.startsWith("bestmove")) {
        w.removeEventListener("message", handler);
        const move = line.split(" ")[1];
        resolve(move && move !== "(none)" ? move : null);
      }
    };
    w.addEventListener("message", handler);
    w.postMessage("ucinewgame");
    w.postMessage(`position fen ${fen}`);
    w.postMessage(`go depth ${depthFor[level]}`);
  });
}

export type AnalysisInfo = {
  scoreCp: number | null;
  scoreMate: number | null;
  bestMove: string | null;
};

export async function analyzeFen(fen: string, depth = 12): Promise<AnalysisInfo> {
  const w = await getWorker();
  return new Promise((resolve) => {
    let lastInfo: AnalysisInfo = { scoreCp: null, scoreMate: null, bestMove: null };
    const handler = (e: MessageEvent) => {
      const line = typeof e.data === "string" ? e.data : "";
      if (line.startsWith("info") && line.includes(" pv ")) {
        const cpMatch = line.match(/score cp (-?\d+)/);
        const mateMatch = line.match(/score mate (-?\d+)/);
        if (cpMatch) lastInfo.scoreCp = parseInt(cpMatch[1], 10);
        if (mateMatch) lastInfo.scoreMate = parseInt(mateMatch[1], 10);
      } else if (line.startsWith("bestmove")) {
        const move = line.split(" ")[1];
        lastInfo.bestMove = move && move !== "(none)" ? move : null;
        w.removeEventListener("message", handler);
        resolve(lastInfo);
      }
    };
    w.addEventListener("message", handler);
    w.postMessage("ucinewgame");
    w.postMessage(`position fen ${fen}`);
    w.postMessage(`go depth ${depth}`);
  });
}
