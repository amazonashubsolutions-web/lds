begin;

create table if not exists public.payment_attempt_history (
  id uuid primary key default gen_random_uuid(),
  payment_attempt_id uuid not null references public.payment_attempts(id) on delete cascade,
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  event_type varchar(30) not null default 'updated'
    check (event_type in ('created', 'status_changed', 'updated')),
  previous_status varchar(30),
  new_status varchar(30),
  details text,
  changed_by_user_id uuid null references public.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_payment_attempt_history_reservation
  on public.payment_attempt_history(reservation_id, created_at desc);

create index if not exists idx_payment_attempt_history_attempt
  on public.payment_attempt_history(payment_attempt_id, created_at desc);

alter table public.payment_attempt_history enable row level security;

drop policy if exists payment_attempt_history_select_policy on public.payment_attempt_history;
create policy payment_attempt_history_select_policy on public.payment_attempt_history
for select using (public.can_access_reservation(reservation_id));

create or replace function public.log_payment_attempt_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_user_id uuid := coalesce(auth.uid(), new.created_by_user_id);
  v_event_type varchar(30) := 'updated';
  v_details text;
begin
  if tg_op = 'INSERT' then
    v_event_type := 'created';
    v_details := format(
      'Intento de pago registrado. Proveedor: %s. Estado inicial: %s.',
      coalesce(new.provider, 'pending_integration'),
      coalesce(new.status, 'pending')
    );
  elsif new.status is distinct from old.status then
    v_event_type := 'status_changed';
    v_details := format(
      'Movimiento de pago actualizado de %s a %s.',
      coalesce(old.status, 'sin estado'),
      coalesce(new.status, 'sin estado')
    );
  else
    v_event_type := 'updated';
    v_details := 'Intento de pago actualizado.';
  end if;

  if nullif(trim(coalesce(new.provider_reference, '')), '') is not null then
    v_details := v_details || format(
      ' Referencia proveedor: %s.',
      trim(new.provider_reference)
    );
  end if;

  insert into public.payment_attempt_history (
    payment_attempt_id,
    reservation_id,
    event_type,
    previous_status,
    new_status,
    details,
    changed_by_user_id,
    created_at
  )
  values (
    new.id,
    new.reservation_id,
    v_event_type,
    case when tg_op = 'UPDATE' then old.status else null end,
    new.status,
    v_details,
    v_actor_user_id,
    now()
  );

  return new;
end;
$$;

drop trigger if exists trg_payment_attempt_history on public.payment_attempts;
create trigger trg_payment_attempt_history
after insert or update on public.payment_attempts
for each row execute function public.log_payment_attempt_history();

insert into public.payment_attempt_history (
  payment_attempt_id,
  reservation_id,
  event_type,
  previous_status,
  new_status,
  details,
  changed_by_user_id,
  created_at
)
select
  pa.id,
  pa.reservation_id,
  'created',
  null,
  pa.status,
  format(
    'Intento de pago registrado. Proveedor: %s. Estado inicial: %s.',
    coalesce(pa.provider, 'pending_integration'),
    coalesce(pa.status, 'pending')
  ),
  pa.created_by_user_id,
  pa.created_at
from public.payment_attempts pa
where not exists (
  select 1
  from public.payment_attempt_history pah
  where pah.payment_attempt_id = pa.id
);

commit;
