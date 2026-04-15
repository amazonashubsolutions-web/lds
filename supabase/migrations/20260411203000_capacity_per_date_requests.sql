begin;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'product_operation_activations'
      and column_name = 'default_group_capacity'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'product_operation_activations'
      and column_name = 'default_capacity'
  ) then
    alter table public.product_operation_activations
      rename column default_group_capacity to default_capacity;
  end if;
end $$;

alter table public.product_operation_activations
  add column if not exists default_capacity integer;

update public.product_operation_activations
set default_capacity = coalesce(default_capacity, 20)
where default_capacity is null;

alter table public.product_operation_activations
  alter column default_capacity set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'product_operation_activations_default_capacity_check'
  ) then
    alter table public.product_operation_activations
      add constraint product_operation_activations_default_capacity_check
      check (default_capacity > 0);
  end if;
end $$;

alter table public.product_calendar_dates
  add column if not exists capacity_override integer null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'product_calendar_dates_capacity_override_check'
  ) then
    alter table public.product_calendar_dates
      add constraint product_calendar_dates_capacity_override_check
      check (capacity_override is null or capacity_override > 0);
  end if;
end $$;

create table if not exists public.capacity_requests (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  provider_agency_id uuid not null references public.agencies(id),
  seller_agency_id uuid not null references public.agencies(id),
  requested_by_user_id uuid not null references public.users(id),
  travel_date date not null,
  requested_passenger_count integer not null check (requested_passenger_count > 0),
  current_available_capacity integer not null default 0 check (current_available_capacity >= 0),
  missing_capacity integer not null default 0 check (missing_capacity >= 0),
  reason text,
  status varchar(20) not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'resolved')),
  reviewed_by_user_id uuid null references public.users(id),
  reviewed_at timestamptz null,
  resolution_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_capacity_requests_product_date
  on public.capacity_requests(product_id, travel_date);

create index if not exists idx_capacity_requests_provider_status
  on public.capacity_requests(provider_agency_id, status);

create index if not exists idx_capacity_requests_seller_status
  on public.capacity_requests(seller_agency_id, status);

drop trigger if exists trg_capacity_requests_updated_at on public.capacity_requests;
create trigger trg_capacity_requests_updated_at
before update on public.capacity_requests
for each row execute function public.set_updated_at();

alter table public.capacity_requests enable row level security;

drop policy if exists capacity_requests_select_policy on public.capacity_requests;
create policy capacity_requests_select_policy on public.capacity_requests
for select using (
  public.is_super_user()
  or requested_by_user_id = auth.uid()
  or seller_agency_id = public.current_agency_id()
  or exists (
    select 1
    from public.products p
    where p.id = product_id
      and public.can_manage_provider_agency(p.provider_agency_id)
  )
);

drop policy if exists capacity_requests_insert_policy on public.capacity_requests;
create policy capacity_requests_insert_policy on public.capacity_requests
for insert with check (
  public.is_super_user()
  or (
    requested_by_user_id = auth.uid()
    and seller_agency_id = public.current_agency_id()
  )
);

drop policy if exists capacity_requests_update_policy on public.capacity_requests;
create policy capacity_requests_update_policy on public.capacity_requests
for update using (
  public.is_super_user()
  or exists (
    select 1
    from public.products p
    where p.id = product_id
      and public.can_manage_provider_agency(p.provider_agency_id)
  )
)
with check (
  public.is_super_user()
  or exists (
    select 1
    from public.products p
    where p.id = product_id
      and public.can_manage_provider_agency(p.provider_agency_id)
  )
);

alter table public.reservations
  drop column if exists operation_group_id;

drop table if exists public.product_operation_groups cascade;

commit;
