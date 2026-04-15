create table if not exists public.product_calendar_events (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  event_type varchar(50) not null check (
    event_type in (
      'initial_range_created',
      'active_range_created',
      'product_activated',
      'date_deactivated',
      'date_reactivated',
      'date_deactivation_blocked'
    )
  ),
  target_date date null,
  range_start date null,
  range_end date null,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_product_calendar_events_product_created_at
  on public.product_calendar_events(product_id, created_at desc);

create index if not exists idx_product_calendar_events_product_target_date
  on public.product_calendar_events(product_id, target_date);

alter table public.product_calendar_events enable row level security;

create policy product_calendar_events_select_policy on public.product_calendar_events
for select using (auth.uid() is not null);

create policy product_calendar_events_manage_policy on public.product_calendar_events
for all using (
  exists (
    select 1
    from public.products p
    where p.id = product_id
      and public.can_manage_provider_agency(p.provider_agency_id)
  )
)
with check (
  exists (
    select 1
    from public.products p
    where p.id = product_id
      and public.can_manage_provider_agency(p.provider_agency_id)
  )
);
