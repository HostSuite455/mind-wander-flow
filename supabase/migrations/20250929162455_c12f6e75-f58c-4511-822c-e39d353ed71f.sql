-- Permetti 'per_hour'
alter table public.cleaner_rates drop constraint if exists cleaner_rates_rate_type_check;
alter table public.cleaner_rates add constraint cleaner_rates_rate_type_check
  check (rate_type in ('per_task','per_hour'));

-- Durata turnover predefinita per property
alter table public.properties add column if not exists default_turnover_duration_min int not null default 120;

-- Task: minuti fatturabili + tempi reali (per future time-tracking)
alter table public.cleaning_tasks add column if not exists billable_min int;
alter table public.cleaning_tasks add column if not exists actual_start timestamptz;
alter table public.cleaning_tasks add column if not exists actual_end timestamptz;

-- Alla creazione, se billable_min è null → = duration_min
create or replace function public.fn_cleaning_tasks_default_billable()
returns trigger language plpgsql as $$
begin
  if new.billable_min is null then
    new.billable_min := new.duration_min;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_cleaning_tasks_default_billable on public.cleaning_tasks;
create trigger trg_cleaning_tasks_default_billable
before insert on public.cleaning_tasks
for each row execute function public.fn_cleaning_tasks_default_billable();

-- Aggiorna il trigger turnover per usare la durata di default della property
create or replace function public.fn_upsert_turnover_task()
returns trigger language plpgsql as $$
declare d int;
begin
  select default_turnover_duration_min into d from public.properties where id = new.property_id;
  if d is null then d := 120; end if;

  if new.status = 'booked' then
    insert into public.cleaning_tasks (property_id, reservation_id, type, scheduled_start, scheduled_end, duration_min, status, billable_min)
    values (new.property_id, new.id, 'turnover', new.end_date, new.end_date + make_interval(mins => d), d, 'todo', d)
    on conflict (reservation_id, type) do update
      set scheduled_start = excluded.scheduled_start,
          scheduled_end   = excluded.scheduled_end,
          duration_min    = excluded.duration_min,
          billable_min    = excluded.billable_min,
          status          = case when public.cleaning_tasks.status='done' then 'done' else 'todo' end;
  elsif new.status = 'canceled' then
    update public.cleaning_tasks
      set status='blocked'
      where reservation_id=new.id and type='turnover';
  end if;
  return new;
end;
$$;