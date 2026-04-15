begin;

alter table public.reservations
  drop constraint if exists reservations_status_check;

alter table public.reservations
  add constraint reservations_status_check
  check (
    status in (
      'payment_pending',
      'payment_failed',
      'payment_expired',
      'reserved',
      'issued',
      'cancelled_by_user',
      'cancelled_by_expiration',
      'refund_in_progress'
    )
  );

create table if not exists public.payment_attempts (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  created_by_user_id uuid not null references public.users(id),
  provider varchar(40) not null default 'pending_integration',
  status varchar(30) not null default 'pending' check (status in ('pending', 'requires_redirect', 'paid', 'failed', 'expired')),
  locator varchar(20) not null,
  amount numeric(12,2) not null,
  currency varchar(10) not null default 'COP',
  provider_reference varchar(120),
  redirect_url text,
  checkout_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_payment_attempts_reservation on public.payment_attempts(reservation_id);
create index if not exists idx_payment_attempts_status on public.payment_attempts(status);

drop trigger if exists trg_payment_attempts_updated_at on public.payment_attempts;
create trigger trg_payment_attempts_updated_at
before update on public.payment_attempts
for each row execute function public.set_updated_at();

alter table public.payment_attempts enable row level security;

drop policy if exists payment_attempts_select_policy on public.payment_attempts;
create policy payment_attempts_select_policy on public.payment_attempts
for select using (public.can_access_reservation(reservation_id));

drop policy if exists payment_attempts_insert_policy on public.payment_attempts;
create policy payment_attempts_insert_policy on public.payment_attempts
for insert with check (public.can_manage_reservation(reservation_id));

drop policy if exists payment_attempts_update_policy on public.payment_attempts;
create policy payment_attempts_update_policy on public.payment_attempts
for update using (public.can_manage_reservation(reservation_id))
with check (public.can_manage_reservation(reservation_id));

commit;
