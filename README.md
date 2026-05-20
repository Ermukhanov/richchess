# RichChess — Boardroom Edition

> Where Boardrooms Trade Moves. Where Sharks Play Chess.

RichChess is a Wall Street–themed chess platform for directors, top managers and ambitious careerists. Chess pieces are reframed as corporate roles (Intern, Marketer, HR, Developer, COO, CEO), and an AI Coach narrates the game in business metaphors — sacrifices become "leveraged buyouts", blunders become "Q3 revenue gone".

## Target audience
Founders, executives, MBAs, ambitious careerists and corporate teams who want to sharpen strategic thinking through a game that speaks their language.

## Key features
- Play vs Stockfish AI — 4 difficulty tiers (Intern / Manager / Director / CEO)
- 1v1 online multiplayer with link sharing and ±200 ELO matchmaking
- 4-player "Hostile Takeover" mode
- **Live AI Coach** — narrates key moments mid-game in corporate language (sacrifices, blunders, captures of major pieces, checks)
- Post-game deep AI analysis (accuracy, blunders, best moments)
- Real-time boardroom chat per game
- Corporate Budget ($CB) economy with optional bets and daily rewards
- City / country / global leaderboards
- Learn module with strategic puzzles
- **Analytics** — full match history, ELO progression, win-rate by mode
- Glassmorphism Wall Street design system (navy + gold)
- EN / RU bilingual

## Free vs Pro
| | Free | Pro ($4.99/mo) |
|---|---|---|
| AI games / day | 5 | Unlimited |
| Live AI Coach | — | Unlimited |
| Post-game analysis | 3 / month | Unlimited |
| Priority matchmaking | — | ✓ |
| Diamond CEO skin + all board themes | — | ✓ |

## Tech stack
- TanStack Start (React 19, Vite 7) on Cloudflare Workers
- Tailwind CSS v4 with custom oklch design tokens
- Lovable Cloud (Supabase) — Auth, Postgres, Realtime, Storage
- Stockfish.js 10 as Web Worker for AI moves
- Lovable AI Gateway (Gemini 3 Flash) for coach commentary
- chess.js for rules / move validation
- react-chessboard for the board UI
- Framer Motion for animations

## Run locally
```bash
bun install
bun dev
```

## Business model
Freemium: 5 AI games/day on the free tier; $4.99/mo or $39/yr Pro unlocks unlimited AI, the live coach, deep analysis, cosmetics and priority matchmaking. B2B opportunity: corporate team-building licenses and executive training packages.

## Why this matters
Chess teaches strategy. RichChess teaches strategy in the language of business — the first chess platform with a clear B2B angle: a team-building tool, executive training program, and corporate onboarding game wrapped in a competitive multiplayer experience.
