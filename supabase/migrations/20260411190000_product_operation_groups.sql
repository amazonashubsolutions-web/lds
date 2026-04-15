begin;

create table if not exists public.product_operation_activations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  active_range_id uuid unique null references public.product_active_ranges(id) on delete set null,
  fecha_inicio date not null,
  fecha_fin date not null,
  default_group_capacity integer not null check (default_group_capacity > 0),
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_product_operation_activations_product_id
  on public.product_operation_activations(product_id);

create index if not exists idx_product_operation_activations_fecha_inicio
  on public.product_operation_activations(fecha_inicio, fecha_fin);

create table if not exists public.product_operation_groups (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  activation_id uuid null references public.product_operation_activations(id) on delete cascade,
  operation_date date not null,
  group_order integer not null default 1 check (group_order > 0),
  group_name varchar(120) not null,
  capacity integer not null check (capacity > 0),
  status varchar(20) not null default 'open' check (status in ('open', 'full', 'closed', 'cancelled')),
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(product_id, operation_date, group_order)
);

create index if not exists idx_product_operation_groups_product_date
  on public.product_operation_groups(product_id, operation_date);

create index if not exists idx_product_operation_groups_activation_id
  on public.product_operation_groups(activation_id);

drop trigger if exists trg_product_operation_groups_updated_at on public.product_operation_groups;
create trigger trg_product_operation_groups_updated_at
before update on public.product_operation_groups
for each row execute function public.set_updated_at();

alter table public.product_operation_activations enable row level security;
alter table public.product_operation_groups enable row level security;

drop policy if exists product_operation_activations_select_policy on public.product_operation_activations;
create policy product_operation_activations_select_policy on public.product_operation_activations
for select using (auth.uid() is not null);

drop policy if exists product_operation_activations_manage_policy on public.product_operation_activations;
create policy product_operation_activations_manage_policy on public.product_operation_activations
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

drop policy if exists product_operation_groups_select_policy on public.product_operation_groups;
create policy product_operation_groups_select_policy on public.product_operation_groups
for select using (auth.uid() is not null);

drop policy if exists product_operation_groups_manage_policy on public.product_operation_groups;
create policy product_operation_groups_manage_policy on public.product_operation_groups
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

with seeded_activations as (
  insert into public.product_operation_activations (
    product_id,
    active_range_id,
    fecha_inicio,
    fecha_fin,
    default_group_capacity,
    created_by,
    created_at
  )
  select
    par.product_id,
    par.id as active_range_id,
    par.fecha_inicio,
    par.fecha_fin,
    20 as default_group_capacity,
    par.created_by,
    par.created_at
  from public.product_active_ranges par
  inner join public.products p
    on p.id = par.product_id
  where p.status = 'active'
  on conflict (active_range_id) do update
    set fecha_inicio = excluded.fecha_inicio,
        fecha_fin = excluded.fecha_fin,
        default_group_capacity = excluded.default_group_capacity,
        created_by = excluded.created_by
  returning id, product_id, fecha_inicio, fecha_fin, default_group_capacity, created_by
)
insert into public.product_operation_groups (
  product_id,
  activation_id,
  operation_date,
  group_order,
  group_name,
  capacity,
  status,
  created_by
)
select
  activation.product_id,
  activation.id,
  series.operation_date,
  1 as group_order,
  'Grupo 1' as group_name,
  activation.default_group_capacity,
  'open' as status,
  activation.created_by
from seeded_activations activation
cross join lateral (
  select generate_series(
    activation.fecha_inicio::timestamp,
    activation.fecha_fin::timestamp,
    interval '1 day'
  )::date as operation_date
) as series
on conflict (product_id, operation_date, group_order) do update
  set activation_id = excluded.activation_id,
      group_name = excluded.group_name,
      capacity = excluded.capacity,
      status = excluded.status,
      created_by = excluded.created_by;

commit;
