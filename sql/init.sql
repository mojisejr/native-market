-- Native Market POS - Phase 2 SQL Init
-- Shared Supabase instance with `market_` prefix strategy

create extension if not exists pgcrypto;

create table if not exists public.market_inventory (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10,2) not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  category text not null,
  promo_rule jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name)
);

alter table public.market_inventory
  add column if not exists promo_rule jsonb;

create table if not exists public.market_transactions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  type text not null check (type in ('sale', 'expense', 'float', 'withdraw')),
  amount numeric(10,2) not null check (amount >= 0),
  items jsonb,
  note text,
  payment_method text check (payment_method in ('cash', 'transfer')),
  event_tag text
);

create index if not exists idx_market_inventory_active on public.market_inventory (is_active);
create index if not exists idx_market_inventory_category on public.market_inventory (category);
create index if not exists idx_market_inventory_promo_rule on public.market_inventory using gin (promo_rule);
create index if not exists idx_market_transactions_created_at on public.market_transactions (created_at desc);
create index if not exists idx_market_transactions_type on public.market_transactions (type);

insert into public.market_inventory (name, price, stock, category, promo_rule, is_active)
values
  ('หมอนทองเบอร์ 9 (กิ่งข้าง)', 450.00, 20, 'durian-graft', null, true),
  ('หมอนทองเบอร์ 9 (กิ่งกระโดง)', 550.00, 20, 'durian-graft', null, true),
  ('หมอนทองเบอร์ 12 (กิ่งข้าง)', 70.00, 15, 'durian-graft', '{"type":"buy_x_get_y","buy":10,"free":1}'::jsonb, true),
  ('หมอนทองเบอร์ 12 (กิ่งกระโดง)', 80.00, 15, 'durian-graft', '{"type":"bulk","threshold":2,"price":150}'::jsonb, true),
  ('หมอนทองเบอร์ 7 (กิ่งข้าง)', 350.00, 25, 'durian-graft', null, true),
  ('หมอนทองเบอร์ 7 (กิ่งกระโดง)', 420.00, 25, 'durian-graft', null, true)
on conflict (name)
do update set
  price = excluded.price,
  stock = excluded.stock,
  category = excluded.category,
  promo_rule = excluded.promo_rule,
  is_active = excluded.is_active,
  updated_at = now();
