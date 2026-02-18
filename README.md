# Native Market POS

A fast, reliable, and low-friction Point-of-Sale (POS) system designed for short-term events and solo operations. Built with a focus on simplicity, robustness, and the "MimiVibe" aesthetic.

## 🚀 Features

- **Inventory Management**: Track stock levels and unit prices.
- **POS Grid UI**: Intuitive interface for selecting products and summarizing totals.
- **Promotion Engine**: Server-authoritative calculation for complex promotion rules (e.g., "Buy X get Y").
- **Secure Ledger**: Detailed transaction logs with audit-friendly metadata.
- **Auth Protected**: Secure login via password protection.
- **Supabase Integration**: Real-time database persistence.

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS (MimiVibe Glassmorphism)
- **Database**: Supabase (PostgreSQL)
- **Validation**: Zod
- **Icons**: Lucide React

## 📦 Getting Started

### Prerequisites

- Node.js (Latest LTS)
- Supabase Project

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/mojisejr/native-market.git
   cd native-market
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file based on `.env.example`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
   MARKET_PASS=your_pos_password
   JWT_SECRET=your_jwt_secret
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## 🗺️ Project Map

Refer to [project_map.md](./project_map.md) for detailed architecture and landmarks.

## 📄 License

MIT
