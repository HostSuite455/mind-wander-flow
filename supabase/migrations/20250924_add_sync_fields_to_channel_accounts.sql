alter table public.channel_accounts
  add column if not exists last_sync_at timestamptz,
  add column if not exists last_sync_status text;