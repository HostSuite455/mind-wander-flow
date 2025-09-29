create or replace function public.fn_upsert_turnover_task()
returns trigger language plpgsql as $$
begin
  if new.status = 'booked' then
    insert into public.cleaning_tasks (property_id, reservation_id, type, scheduled_start, scheduled_end, duration_min, status)
    values (new.property_id, new.id, 'turnover', new.check_out, new.check_out + interval '120 minutes', 120, 'todo')
    on conflict (reservation_id, type) do update
      set scheduled_start = excluded.scheduled_start,
          scheduled_end   = excluded.scheduled_end,
          duration_min    = excluded.duration_min,
          status          = case when public.cleaning_tasks.status='done' then 'done' else 'todo' end;
  elsif new.status = 'canceled' then
    update public.cleaning_tasks
      set status='blocked'
      where reservation_id=new.id and type='turnover';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_reservations_turnover on public.reservations;
create trigger trg_reservations_turnover
after insert or update on public.reservations
for each row execute function public.fn_upsert_turnover_task();