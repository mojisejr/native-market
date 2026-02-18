# Native Market - Project Map

## 1) Philosophy
Native Market exists to provide a fast, reliable, low-friction POS for short event operations.
Core principle: **Simple + Robust** for solo operation.

## 2) Landmarks & Architecture
- **Repo**: [https://github.com/mojisejr/native-market](https://github.com/mojisejr/native-market)
- **Stack**: Next.js 14 (App Router), Tailwind CSS, Supabase (PostgreSQL), Lucide React.
- **Root Files**:
    - `project_map.md`: Architecture map and navigation.
    - `package.json`: Dependencies and scripts.
    - `middleware.ts`: Route protection (Auth).
- **Core Modules**:
    - `app/`: Pages for `/`, `/login`, and `/dashboard`.
    - `actions/`: Server Actions for `auth.ts`, `inventory.ts`, and `transaction.ts`.
    - `lib/`: Utilities, `market-types.ts`, and `promo-calculator.ts`.
    - `components/pos/`: POS specific UI components (`pos-grid.tsx`).
    - `sql/init.sql`: Database schema definition.

## 3) Data Flow (Verified)
UI (Next.js) -> Server Actions -> Zod Validation -> Supabase (market_* tables)

## 4) Evolution Loop (Phases)
- **Phase 1-3**: Core POS UI, Inventory, and Ledger Logic (Verified).
- **Phase 4**: Promotion Engine & Server-side Integrity (Completed).
- **Current Status**: Stable, Ready for Event usage.

## 5) Known Challenges
- Keep scope small to avoid over-engineering.
- Enforce strict secret hygiene (Supabase Keys).
- Preserve local dev environment (`.env.local`).
