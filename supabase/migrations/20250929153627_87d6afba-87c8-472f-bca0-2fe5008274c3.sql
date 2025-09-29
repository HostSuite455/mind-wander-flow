-- ICAL SOURCES
create table if not exists public.ical_sources (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  channel text not null check (channel in ('airbnb','booking','vrbo','other')),
  url text not null,
  active boolean not null default true,
  last_sync_at timestamptz,
  last_status text,
  last_error text,
  created_at timestamptz default now()
);

-- RESERVATIONS (normalizzate da iCal)
create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  source_id uuid references public.ical_sources(id) on delete set null,
  ext_uid text not null, -- UID ICS
  guest_name text,
  guest_count int,
  check_in timestamptz not null,
  check_out timestamptz not null,
  status text not null default 'booked' check (status in ('booked','canceled')),
  notes text,
  created_at timestamptz default now(),
  unique (property_id, ext_uid)
);

-- CLEANERS (anagrafica addetti)
create table if not exists public.cleaners (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,       -- = properties.host_id dell'host
  name text not null,
  phone text,
  email text,
  user_id uuid                   -- se il cleaner accede con email/password
);

-- CLEANING TASKS (generati da reservations)
create table if not exists public.cleaning_tasks (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  reservation_id uuid references public.reservations(id) on delete set null,
  type text not null check (type in ('turnover','midstay','inspection')),
  scheduled_start timestamptz not null,
  scheduled_end timestamptz not null,
  duration_min int not null default 120,
  assigned_cleaner_id uuid references public.cleaners(id) on delete set null,
  status text not null default 'todo' check (status in ('todo','in_progress','done','blocked')),
  notes text,
  created_at timestamptz default now(),
  unique (reservation_id, type)
);

-- RLS abilitato
alter table public.ical_sources enable row level security;
alter table public.reservations enable row level security;
alter table public.cleaners enable row level security;
alter table public.cleaning_tasks enable row level security;

-- OWNER policies (vede/gestisce solo ciò che appartiene alle sue properties)
drop policy if exists "owner_select_ical_sources" on public.ical_sources;
create policy "owner_select_ical_sources"
on public.ical_sources for select using (
  exists (select 1 from public.properties p where p.id = ical_sources.property_id and p.host_id = auth.uid())
);

drop policy if exists "owner_cud_ical_sources" on public.ical_sources;
create policy "owner_cud_ical_sources"
on public.ical_sources for all using (
  exists (select 1 from public.properties p where p.id = ical_sources.property_id and p.host_id = auth.uid())
) with check (
  exists (select 1 from public.properties p where p.id = ical_sources.property_id and p.host_id = auth.uid())
);

drop policy if exists "owner_select_reservations" on public.reservations;
create policy "owner_select_reservations"
on public.reservations for select using (
  exists (select 1 from public.properties p where p.id = reservations.property_id and p.host_id = auth.uid())
);

drop policy if exists "owner_cud_reservations" on public.reservations;
create policy "owner_cud_reservations"
on public.reservations for all using (
  exists (select 1 from public.properties p where p.id = reservations.property_id and p.host_id = auth.uid())
) with check (
  exists (select 1 from public.properties p where p.id = reservations.property_id and p.host_id = auth.uid())
);

drop policy if exists "owner_select_cleaners" on public.cleaners;
create policy "owner_select_cleaners"
on public.cleaners for select using (owner_id = auth.uid());

drop policy if exists "owner_cud_cleaners" on public.cleaners;
create policy "owner_cud_cleaners"
on public.cleaners for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "owner_select_cleaning_tasks" on public.cleaning_tasks;
create policy "owner_select_cleaning_tasks"
on public.cleaning_tasks for select using (
  exists (select 1 from public.properties p where p.id = cleaning_tasks.property_id and p.host_id = auth.uid())
);

drop policy if exists "owner_cud_cleaning_tasks" on public.cleaning_tasks;
create policy "owner_cud_cleaning_tasks"
on public.cleaning_tasks for all using (
  exists (select 1 from public.properties p where p.id = cleaning_tasks.property_id and p.host_id = auth.uid())
) with check (
  exists (select 1 from public.properties p where p.id = cleaning_tasks.property_id and p.host_id = auth.uid())
);

-- CLEANER policies: può vedere/aggiornare SOLO i task assegnati a lui
drop policy if exists "cleaner_select_assigned_tasks" on public.cleaning_tasks;
create policy "cleaner_select_assigned_tasks"
on public.cleaning_tasks for select using (
  assigned_cleaner_id in (select c.id from public.cleaners c where c.user_id = auth.uid())
);

drop policy if exists "cleaner_update_assigned_tasks" on public.cleaning_tasks;
create policy "cleaner_update_assigned_tasks"
on public.cleaning_tasks for update using (
  assigned_cleaner_id in (select c.id from public.cleaners c where c.user_id = auth.uid())
) with check (
  assigned_cleaner_id in (select c.id from public.cleaners c where c.user_id = auth.uid())
);