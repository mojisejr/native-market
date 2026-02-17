# Native Market - Project Map

## 1) Philosophy
Native Market exists to provide a fast, reliable, low-friction POS for short event operations.
Core principle: **Simple + Robust** for solo operation.

## 2) Key Landmarks
- README.md: project purpose and setup summary
- project_map.md: architecture map and navigation
- .env.example: required environment keys (no secrets)
- .env.local: local environment values (git-ignored)

## 3) Data Flow (Planned)
UI (Next.js) -> Server Actions -> Supabase (market_* tables)

## 4) Known Challenges
- Keep scope small to avoid over-engineering
- Enforce strict secret hygiene
- Preserve git isolation from HQ root repo
