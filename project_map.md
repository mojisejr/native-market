# Native Market - Project Map

## 1) Philosophy
Native Market exists to provide a fast, reliable, low-friction POS for short event operations.
Core principle: **Simple + Robust** for solo operation.

## 2) Key Landmarks
- README.md: project purpose and setup summary
- project_map.md: architecture map and navigation
- .env.example: required environment keys (no secrets)
- .env.local: local environment values (git-ignored)
- app/: App Router pages (`/`, `/login`, `/dashboard`)
- actions/auth.ts: server actions for login/logout
- lib/auth.ts: JWT session helpers (`jose`)
- middleware.ts: route protection for login/dashboard flow
- components/ui/: MimiVibe base components (`Button`, `Card`, `Input`)

## 3) Data Flow (Planned)
UI (Next.js) -> Server Actions -> Auth Cookie/JWT -> Supabase (market_* tables)

## 4) Known Challenges
- Keep scope small to avoid over-engineering
- Enforce strict secret hygiene
- Preserve git isolation from HQ root repo
- Next.js 16 deprecates middleware convention in favor of proxy (future migration)
