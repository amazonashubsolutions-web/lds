begin;

create table if not exists public.product_disable_cases (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  provider_agency_id uuid not null references public.agencies(id),
  requested_by_user_id uuid not null references public.users(id),
  reason_key varchar(40) not null check (
    reason_key in (
      'stop_selling',
      'legal_permits',
      'company_closure',
      'weather',
      'other'
    )
  ),
  reason_label varchar(180) not null,
  reason_other text null,
  affected_reservations_count integer not null default 0 check (affected_reservations_count >= 0),
  case_status varchar(30) not null default 'pending_lds_review' check (
    case_status in ('pending_lds_review', 'in_review', 'resolved')
  ),
  lds_notification_email varchar(180) null,
  legal_representative_email varchar(180) null,
  notification_recipients text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_product_disable_cases_product
  on public.product_disable_cases(product_id);

create index if not exists idx_product_disable_cases_provider_status
  on public.product_disable_cases(provider_agency_id, case_status);

drop trigger if exists trg_product_disable_cases_updated_at on public.product_disable_cases;
create trigger trg_product_disable_cases_updated_at
before update on public.product_disable_cases
for each row execute function public.set_updated_at();

alter table public.product_disable_cases enable row level security;

drop policy if exists product_disable_cases_select_policy on public.product_disable_cases;
create policy product_disable_cases_select_policy on public.product_disable_cases
for select using (
  public.is_super_user()
  or exists (
    select 1
    from public.products p
    where p.id = product_id
      and public.can_manage_provider_agency(p.provider_agency_id)
  )
);

drop policy if exists product_disable_cases_insert_policy on public.product_disable_cases;
create policy product_disable_cases_insert_policy on public.product_disable_cases
for insert with check (
  public.is_super_user()
  or exists (
    select 1
    from public.products p
    where p.id = product_id
      and public.can_manage_provider_agency(p.provider_agency_id)
  )
);

drop policy if exists product_disable_cases_update_policy on public.product_disable_cases;
create policy product_disable_cases_update_policy on public.product_disable_cases
for update using (
  public.is_super_user()
)
with check (
  public.is_super_user()
);

commit;
