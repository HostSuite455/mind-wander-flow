-- CHANNEL MANAGER (ICS-first)

create type channel_kind as enum ('ics', 'channex', 'direct', 'mock');

create table if not exists public.channel_accounts (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null, -- auth.uid() del proprietario
  kind channel_kind not null default 'ics',
  name text not null,
  ics_pull_url text,
  ics_export_token text,
  last_sync_at timestamptz,
  last_sync_status text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null,
  name text not null,
  timezone text default 'Europe/Rome',
  created_at timestamptz default now()
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  account_id uuid references public.channel_accounts(id) on delete set null,
  external_id text,
  created_at timestamptz default now()
);

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  source text not null,           -- 'ics:<account_id>' | 'manual' | ...
  uid text,
  start_date date not null,
  end_date date not null,         -- non incluso
  guest_name text,
  created_at timestamptz default now()
);

create table if not exists public.availability_blocks (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  source text not null,           -- 'ics:<account_id>' | 'manual'
  start_date date not null,
  end_date date not null,         -- non incluso
  reason text,
  created_at timestamptz default now()
);

create table if not exists public.sync_logs (
  id bigserial primary key,
  account_id uuid references public.channel_accounts(id) on delete cascade,
  level text not null,            -- info|warn|error
  message text not null,
  at timestamptz default now()
);

-- Abilita RLS
alter table public.channel_accounts enable row level security;
alter table public.properties enable row level security;
alter table public.listings enable row level security;
alter table public.reservations enable row level security;
alter table public.availability_blocks enable row level security;
alter table public.sync_logs enable row level security;

-- Ogni host vede/scrive solo i propri dati
create policy "own accounts" on public.channel_accounts
  for all using (host_id = auth.uid()) with check (host_id = auth.uid());

create policy "own properties" on public.properties
  for all using (host_id = auth.uid()) with check (host_id = auth.uid());

create policy "own listings" on public.listings
  for all using (
    exists(select 1 from public.properties p where p.id = property_id and p.host_id = auth.uid())
  ) with check (
    exists(select 1 from public.properties p where p.id = property_id and p.host_id = auth.uid())
  );

create policy "own reservations" on public.reservations
  for all using (
    exists(select 1 from public.properties p where p.id = property_id and p.host_id = auth.uid())
  ) with check (
    exists(select 1 from public.properties p where p.id = property_id and p.host_id = auth.uid())
  );

create policy "own availability_blocks" on public.availability_blocks
  for all using (
    exists(select 1 from public.properties p where p.id = property_id and p.host_id = auth.uid())
  ) with check (
    exists(select 1 from public.properties p where p.id = property_id and p.host_id = auth.uid())
  );

create policy "own logs" on public.sync_logs
  for select using (
    exists(select 1 from public.channel_accounts a where a.id = account_id and a.host_id = auth.uid())
  );
