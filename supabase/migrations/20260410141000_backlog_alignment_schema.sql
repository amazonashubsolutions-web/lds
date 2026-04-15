-- Supabase migration: backlog alignment for editorial product data, post-sales and operations

alter table public.products
  add column if not exists region varchar(120),
  add column if not exists category_key varchar(60),
  add column if not exists pricing_label varchar(40) not null default 'Desde',
  add column if not exists pricing_unit_label varchar(40) not null default 'persona',
  add column if not exists cover_image_url varchar(500),
  add column if not exists is_featured boolean not null default false;

update public.products
set category_key = coalesce(category_key, 'actividades')
where category_key is null;

alter table public.products
  alter column category_key set not null;

create table if not exists public.product_subcategories (
  id uuid primary key default gen_random_uuid(),
  category_key varchar(60) not null,
  subcategory_key varchar(80) not null unique,
  nombre varchar(120) not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_subcategory_links (
  product_id uuid not null references public.products(id) on delete cascade,
  product_subcategory_id uuid not null references public.product_subcategories(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (product_id, product_subcategory_id)
);

create table if not exists public.product_detail_content (
  product_id uuid primary key references public.products(id) on delete cascade,
  slug varchar(220) not null unique,
  eyebrow varchar(160),
  summary text,
  meta jsonb not null default '[]'::jsonb,
  overview jsonb not null default '[]'::jsonb,
  itinerary jsonb not null default '[]'::jsonb,
  includes jsonb not null default '[]'::jsonb,
  excludes jsonb not null default '[]'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  considerations jsonb not null default '[]'::jsonb,
  cancellation_policies jsonb not null default '[]'::jsonb,
  booking_config jsonb not null default '{}'::jsonb,
  updated_by_user_id uuid null references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_gallery_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url varchar(500) not null,
  file_name varchar(255),
  position integer not null default 0,
  is_primary boolean not null default false,
  created_by_user_id uuid null references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(product_id, position)
);

create unique index if not exists idx_product_gallery_primary
  on public.product_gallery_images(product_id)
  where is_primary = true;

alter table public.cancellations
  add column if not exists notes text;

alter table public.refunds
  add column if not exists source_coupon_id uuid null references public.coupons(id) on delete set null;

alter table public.refunds
  drop column if exists payment_receipt_file;

create unique index if not exists idx_refunds_source_coupon
  on public.refunds(source_coupon_id)
  where source_coupon_id is not null;

create table if not exists public.refund_receipts (
  id uuid primary key default gen_random_uuid(),
  refund_id uuid not null unique references public.refunds(id) on delete cascade,
  uploaded_by_user_id uuid not null references public.users(id),
  uploaded_by_agency_id uuid not null references public.agencies(id),
  receipt_file_url varchar(500) not null,
  payment_date date not null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.refund_payment_reminders (
  id uuid primary key default gen_random_uuid(),
  refund_id uuid not null references public.refunds(id) on delete cascade,
  requested_by_user_id uuid not null references public.users(id),
  requested_by_agency_id uuid not null references public.agencies(id),
  reminder_channel varchar(20) not null default 'email' check (reminder_channel in ('email')),
  reminder_target_email varchar(180),
  notes text,
  requested_at timestamptz not null default now()
);

alter table public.passenger_lists
  add column if not exists created_by_user_id uuid null references public.users(id);

create unique index if not exists idx_passenger_lists_unique_product_date
  on public.passenger_lists(product_id, fecha_operacion);

create table if not exists public.passenger_list_status_history (
  id uuid primary key default gen_random_uuid(),
  passenger_list_id uuid not null references public.passenger_lists(id) on delete cascade,
  previous_status varchar(20),
  new_status varchar(20) not null check (new_status in ('inactive', 'active', 'check_in')),
  reason varchar(255),
  changed_by_user_id uuid not null references public.users(id),
  changed_at timestamptz not null default now()
);

create table if not exists public.checkin_events (
  id uuid primary key default gen_random_uuid(),
  passenger_list_id uuid not null references public.passenger_lists(id) on delete cascade,
  passenger_list_item_id uuid not null unique references public.passenger_list_items(id) on delete cascade,
  reservation_id uuid not null references public.reservations(id),
  reservation_passenger_id uuid not null references public.reservation_passengers(id),
  checked_in_by_user_id uuid not null references public.users(id),
  checked_in_at timestamptz not null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.no_show_events (
  id uuid primary key default gen_random_uuid(),
  passenger_list_id uuid not null references public.passenger_lists(id) on delete cascade,
  passenger_list_item_id uuid not null unique references public.passenger_list_items(id) on delete cascade,
  reservation_id uuid not null references public.reservations(id),
  reservation_passenger_id uuid not null references public.reservation_passengers(id),
  cancellation_id uuid null references public.cancellations(id),
  coupon_id uuid null references public.coupons(id),
  refund_id uuid null references public.refunds(id),
  marked_by_user_id uuid not null references public.users(id),
  marked_at timestamptz not null,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.alliance_movements
  add column if not exists created_by_user_id uuid null references public.users(id);

create table if not exists public.alliance_status_history (
  id uuid primary key default gen_random_uuid(),
  alliance_id uuid not null references public.alliances(id) on delete cascade,
  previous_status varchar(20),
  new_status varchar(20) not null check (new_status in ('active', 'inactive', 'suspended')),
  reason varchar(255),
  changed_by_user_id uuid not null references public.users(id),
  changed_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'alliances_distinct_agencies_chk'
      and conrelid = 'public.alliances'::regclass
  ) then
    alter table public.alliances
      add constraint alliances_distinct_agencies_chk
      check (provider_agency_id <> seller_agency_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'alliances_provider_seller_unique'
      and conrelid = 'public.alliances'::regclass
  ) then
    alter table public.alliances
      add constraint alliances_provider_seller_unique
      unique (provider_agency_id, seller_agency_id);
  end if;
end $$;

create or replace function public.validate_product_provider_agency()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1
    from public.agencies a
    where a.id = new.provider_agency_id
      and a.agency_type = 'provider'
  ) then
    raise exception 'products.provider_agency_id must reference a provider agency';
  end if;

  return new;
end;
$$;

create or replace function public.validate_alliance_agency_types()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1
    from public.agencies a
    where a.id = new.provider_agency_id
      and a.agency_type = 'provider'
  ) then
    raise exception 'alliances.provider_agency_id must reference a provider agency';
  end if;

  if not exists (
    select 1
    from public.agencies a
    where a.id = new.seller_agency_id
      and a.agency_type = 'seller'
  ) then
    raise exception 'alliances.seller_agency_id must reference a seller agency';
  end if;

  return new;
end;
$$;

create or replace function public.validate_product_subcategory_link()
returns trigger
language plpgsql
as $$
declare
  product_category_key varchar(60);
  subcategory_category_key varchar(60);
begin
  select p.category_key
    into product_category_key
  from public.products p
  where p.id = new.product_id;

  select ps.category_key
    into subcategory_category_key
  from public.product_subcategories ps
  where ps.id = new.product_subcategory_id;

  if product_category_key is null or subcategory_category_key is null then
    raise exception 'product and subcategory must exist';
  end if;

  if product_category_key <> subcategory_category_key then
    raise exception 'product category_key must match linked product_subcategories.category_key';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_product_provider_agency on public.products;
create trigger trg_validate_product_provider_agency
before insert or update of provider_agency_id on public.products
for each row execute function public.validate_product_provider_agency();

drop trigger if exists trg_validate_alliance_agency_types on public.alliances;
create trigger trg_validate_alliance_agency_types
before insert or update of provider_agency_id, seller_agency_id on public.alliances
for each row execute function public.validate_alliance_agency_types();

drop trigger if exists trg_validate_product_subcategory_link on public.product_subcategory_links;
create trigger trg_validate_product_subcategory_link
before insert or update of product_id, product_subcategory_id on public.product_subcategory_links
for each row execute function public.validate_product_subcategory_link();

create index if not exists idx_product_subcategories_category
  on public.product_subcategories(category_key);
create index if not exists idx_product_subcategory_links_product
  on public.product_subcategory_links(product_id);
create index if not exists idx_product_gallery_images_product
  on public.product_gallery_images(product_id);
create index if not exists idx_refund_receipts_refund
  on public.refund_receipts(refund_id);
create index if not exists idx_refund_payment_reminders_refund
  on public.refund_payment_reminders(refund_id);
create index if not exists idx_passenger_list_status_history_list
  on public.passenger_list_status_history(passenger_list_id);
create index if not exists idx_checkin_events_list
  on public.checkin_events(passenger_list_id);
create index if not exists idx_no_show_events_list
  on public.no_show_events(passenger_list_id);
create index if not exists idx_alliance_status_history_alliance
  on public.alliance_status_history(alliance_id);

drop trigger if exists trg_product_subcategories_updated_at on public.product_subcategories;
create trigger trg_product_subcategories_updated_at
before update on public.product_subcategories
for each row execute function public.set_updated_at();

drop trigger if exists trg_product_detail_content_updated_at on public.product_detail_content;
create trigger trg_product_detail_content_updated_at
before update on public.product_detail_content
for each row execute function public.set_updated_at();

drop trigger if exists trg_product_gallery_images_updated_at on public.product_gallery_images;
create trigger trg_product_gallery_images_updated_at
before update on public.product_gallery_images
for each row execute function public.set_updated_at();
