-- Supabase migration: commercial coupons for products

create table if not exists public.product_coupons (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  code varchar(60) not null unique,
  description text not null default '',
  value_type varchar(20) not null default 'percentage'
    check (value_type in ('percentage', 'fixed_amount')),
  value_amount numeric(12,2) not null check (value_amount >= 0),
  currency_code varchar(10) not null default 'COP',
  discount_target varchar(40) not null default 'booking_total'
    check (discount_target in ('booking_total', 'adults_subtotal', 'children_subtotal')),
  starts_at date not null,
  ends_at date not null,
  rule_type varchar(40) not null default 'passenger_conditions'
    check (rule_type in ('passenger_conditions', 'passenger_count')),
  rule_logic varchar(10) not null default 'and'
    check (rule_logic in ('and', 'or')),
  rule_conditions jsonb not null default '[]'::jsonb,
  status varchar(20) not null default 'active'
    check (status in ('active', 'inactive')),
  created_by_user_id uuid not null references public.users(id),
  updated_by_user_id uuid null references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_coupons_date_range_chk check (ends_at >= starts_at)
);

create index if not exists idx_product_coupons_product
  on public.product_coupons(product_id);

create index if not exists idx_product_coupons_status
  on public.product_coupons(status);

create index if not exists idx_product_coupons_product_status_dates
  on public.product_coupons(product_id, status, starts_at, ends_at);

drop trigger if exists trg_product_coupons_updated_at on public.product_coupons;
create trigger trg_product_coupons_updated_at
before update on public.product_coupons
for each row execute function public.set_updated_at();

alter table public.product_coupons enable row level security;

create policy product_coupons_select_policy on public.product_coupons
for select
using (auth.uid() is not null);

create policy product_coupons_manage_policy on public.product_coupons
for all
using (
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

create policy product_coupons_public_active_select_policy on public.product_coupons
for select
to anon
using (
  status = 'active'
  and exists (
    select 1
    from public.products p
    where p.id = product_id
      and p.status = 'active'
  )
);
