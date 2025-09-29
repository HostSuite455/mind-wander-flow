-- Accounting al completamento (per_task / per_hour)
-- Percentuali MVP (sposteremo in tabella config)
create or replace function public.calculate_task_accounting()
returns trigger language plpgsql as $$
declare
  rate_type text;
  amount_cents int;
  earnings int;
  host_fee int;
  cleaner_fee int;
  minutes int;
begin
  if new.status = 'done' and (old.status is null or old.status != 'done') then
    -- trova una tariffa: per property se presente, altrimenti per cleaner
    select cr.rate_type, cr.amount_cents
      into rate_type, amount_cents
      from public.cleaner_rates cr
      where cr.cleaner_id = new.assigned_cleaner_id
        and (cr.property_id is null or cr.property_id = new.property_id)
      order by case when cr.property_id = new.property_id then 0 else 1 end
      limit 1;

    if rate_type is null then
      -- default: per_task 3000 (=30€) se non configurato
      rate_type := 'per_task';
      amount_cents := 3000;
    end if;

    minutes := coalesce(new.billable_min, new.duration_min, 120);

    if rate_type = 'per_hour' then
      -- arrotonda ai 15 minuti → ceil(minutes/15)* (rate/4)
      earnings := ceil(minutes/15.0)::int * ceil(amount_cents/4.0)::int;
    else
      earnings := amount_cents;
    end if;

    cleaner_fee := round(earnings * 0.05); -- 5% lato cleaner
    -- host paga earnings + fee_cleaner + 10% piattaforma lato host
    host_fee := round((earnings + cleaner_fee) * 0.10);

    insert into public.task_accounting (task_id, cleaner_earnings_cents, platform_fee_cleaner_cents, platform_fee_host_cents, host_amount_cents, status)
    values (new.id, earnings, cleaner_fee, host_fee, earnings + cleaner_fee + host_fee, 'pending')
    on conflict (task_id) do update
      set cleaner_earnings_cents = excluded.cleaner_earnings_cents,
          platform_fee_cleaner_cents = excluded.platform_fee_cleaner_cents,
          platform_fee_host_cents = excluded.platform_fee_host_cents,
          host_amount_cents = excluded.host_amount_cents;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_task_done_accounting on public.cleaning_tasks;
create trigger trg_task_done_accounting
after update of status on public.cleaning_tasks
for each row execute function public.calculate_task_accounting();