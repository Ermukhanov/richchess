# Corporate Sharks Chess ♟️💼
> Master the Boardroom. Dominate the Board.

## What is this?
A Wall Street-themed chess platform where chess pieces are corporate roles (Intern, Marketer, HR, Developer, COO, CEO). Designed for directors, managers and ambitious professionals who want to sharpen strategic thinking through chess — with real stakes using Corporate Budget virtual currency.

## Who is it for?
Company directors, top managers, startup founders, ambitious careerists.

## Key Features
- ♟️ Full chess rules + legal move validation (highlights, promotion, check, last-move)
- 🤖 AI opponent (Stockfish, 4 difficulty levels: Intern, Manager, Director, CEO)
- 🌐 Real-time multiplayer via shareable link + matchmaking queue
- 👥 4-Player "Hostile Takeover" mode (Blue / Red / Green / Black Corp)
- 💰 Corporate Budget betting system (atomic via Postgres RPC)
- 📊 Post-game AI Coach analysis (Lovable AI, corporate-language narrative)
- 📖 5 interactive learning lessons with puzzle boards
- 🏆 Global / City / Country leaderboards with Shark-of-the-Month badges
- 🌍 English + Russian, full app i18n
- 🎨 3 board themes (Wall Street / Silicon Valley / Tokyo Office) + unlockable piece skins
- ⏱️ Time controls: Bullet, Blitz, Rapid, Classical
- 💬 In-game boardroom chat with emoji reactions
- 🏅 Achievements, win streaks, XP, daily login streak
- 👤 Avatar upload, profile stats, recent games

## Tech Stack
React 19 + TypeScript + TanStack Start + Tailwind CSS v4 + Lovable Cloud (Supabase) + chess.js + Stockfish.js (WASM Web Worker) + Framer Motion + Lovable AI Gateway (Gemini).

## How to run locally
```bash
bun install
bun run dev
```
Open http://localhost:5173. Environment variables for Supabase are auto-injected via Lovable Cloud.

## Business Model
Freemium: free tier with core gameplay. **Pro tier ($4.99/mo)** unlocks unlimited AI analysis, exclusive skins (Diamond CEO), priority matchmaking, and CSV stats export. In-game Corporate Budget economy drives engagement and retention; players can spend $CB on cosmetic piece skins or stake it on games.

## Why this is valuable
Chess teaches strategy. Corporate Sharks Chess teaches strategy in the **language of business** — making it the first chess platform with a clear B2B angle: team-building tool, executive training, corporate onboarding game. Companies can run internal tournaments where the leaderboard becomes a leadership-pipeline signal.
