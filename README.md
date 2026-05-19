# Corporate Sharks Chess

**Master the Boardroom. Dominate the Board.**

A Wall Street / corporate-themed chess platform for directors, top managers, and ambitious careerists. Learn strategic thinking through chess, dressed up as a boardroom power struggle.

## What it is

Corporate Sharks Chess is a full chess web app where every piece carries a corporate title:

- **Pawn → Intern** (Стажер)
- **Knight → Marketer** (Маркетолог)
- **Bishop → HR Manager** (HR)
- **Rook → Developer** (Разработчик)
- **Queen → COO**
- **King → CEO**

The in-app currency, **Corporate Budget ($CB)**, is used for betting on games and unlocking cosmetics.

## Target audience

C-suite executives, founders, managers, marketers, developers, and anyone who wants to sharpen strategic thinking in an environment that feels closer to a Bloomberg terminal than a chess club.

## Key features (v0.1 — this release)

- 🦈 Cinematic splash + Duolingo-style 5-step onboarding wizard
- 🔐 Email/password + Google sign-in
- 🌐 Bilingual UI: English / Русский
- 🏠 Dashboard with welcome card, $CB balance, quick-play tiles, recent games, and city leaderboard preview
- ♟️ Play vs Stockfish AI at 4 levels (Intern / Manager / Director / CEO)
- 📜 Move history in corporate language ("Marketer f3", "CEO under attack!")
- 🏆 Global / City / Country leaderboards
- 📚 Learn module scaffolding (lessons coming)
- ⚙️ Settings: language toggle, sign-out
- 💰 Corporate Budget betting vs the house (win/lose $CB)

## Coming soon

- Realtime 1v1 vs friend / random matchmaking
- 4-player Hostile Takeover mode
- Post-game AI Coach analysis with deeper insights
- Interactive Learn lessons + XP / streaks
- Pro tier with exclusive piece skins and unlimited analysis
- Friends, clubs, and in-game chat

## Tech stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Framer Motion
- **Router/SSR:** TanStack Start + TanStack Router
- **Backend:** Lovable Cloud (Supabase under the hood) — Postgres + Auth + Realtime
- **Chess engine:** [chess.js](https://github.com/jhlywa/chess.js) for move validation, [Stockfish.js](https://github.com/nmrugg/stockfish.js) (WASM, loaded as a web worker) for AI
- **Board UI:** react-chessboard v5
- **UI primitives:** shadcn/ui (Radix)
- **State:** React context + Zustand-ready
- **i18n:** Lightweight custom context (EN / RU)

## Run locally

```bash
bun install
bun dev
```

The app expects Lovable Cloud env vars (auto-provisioned in Lovable). For self-hosting, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.

## Business model

- **Free tier:** Full play vs AI, leaderboards, lessons, $CB economy
- **Pro tier ($4.99/mo):** Unlimited AI Coach analysis, exclusive "Diamond CEO" skin, custom board themes, priority matchmaking, stats export
- **Cosmetics:** Piece skins purchased with $CB (Corporate Pack, Neon Exec)

## Why this is valuable (not just another chess site)

Chess sites optimise for tournament players. **Corporate Sharks Chess** repositions chess as a *strategic-thinking gym for professionals* — the people who already pay for Blinkist, Masterclass, and executive coaching. Corporate framing makes every move feel meaningful in a language they already speak, and the $CB betting layer adds the kind of skin-in-the-game tension that drives retention. The dual-language EN/RU surface targets the high-LTV Russian-speaking executive market underserved by Western platforms.
