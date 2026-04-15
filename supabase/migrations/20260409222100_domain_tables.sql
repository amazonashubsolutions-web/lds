-- Supabase migration: products, reservations, post-sales and operations
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  provider_agency_id uuid not null references public.agencies(id),
  nombre varchar(180) not null,
  ciudad varchar(120),
  punto_encuentro varchar(255),
  descripcion_breve text,
  hora_salida time not null,
  hora_llegada time not null,
  status varchar(30) not null default 'pending_activation' check (status in ('draft', 'pending_activation', 'active', 'inactive')),
  created_by uuid not null references public.users(id),
  updated_by uuid null references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_seasons (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  season_type varchar(20) not null check (season_type in ('high', 'low')),
  fecha_inicio date not null,
  fecha_fin date not null,
  nombre_opcional varchar(120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_penalty_rules (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null unique references public.products(id) on delete cascade,
  tarifa_administrativa numeric(12,2) not null default 0,
  multa_cancelacion numeric(12,2) not null default 0,
  multa_no_show numeric(12,2) not null default 0,
  multa_reembolso numeric(12,2) not null default 0,
  permite_reembolso boolean not null default true,
  observaciones text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_active_ranges (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  fecha_inicio date not null,
  fecha_fin date not null,
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.product_calendar_dates (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  fecha date not null,
  is_operable boolean not null default true,
  occupancy_percentage numeric(5,2) not null default 0,
  blocked_reason varchar(255),
  updated_by uuid null references public.users(id),
  updated_at timestamptz not null default now(),
  unique(product_id, fecha)
);

create table if not exists public.quotations (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id),
  user_id uuid not null references public.users(id),
  product_id uuid not null references public.products(id),
  status varchar(20) not null default 'draft',
  total_amount numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  locator varchar(20) not null unique,
  product_id uuid not null references public.products(id),
  product_owner_agency_id uuid not null references public.agencies(id),
  seller_agency_id uuid not null references public.agencies(id),
  created_by_user_id uuid not null references public.users(id),
  parent_reservation_id uuid null references public.reservations(id),
  origin_type varchar(40) not null default 'direct' check (origin_type in ('direct', 'split', 'partial_cancellation', 'no_show_child')),
  status varchar(40) not null default 'reserved' check (status in ('reserved', 'issued', 'cancelled_by_user', 'cancelled_by_expiration', 'refund_in_progress')),
  reservation_type varchar(20) not null default 'full' check (reservation_type in ('full', 'child')),
  booking_date date not null,
  issue_date date null,
  travel_date date not null,
  embark_time time not null,
  payment_type varchar(30) not null,
  payment_status varchar(30),
  total_amount numeric(12,2) not null,
  currency varchar(10) not null default 'COP',
  season_type varchar(20),
  notes_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reservation_passengers (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  first_name varchar(120) not null,
  last_name varchar(120) not null,
  passenger_type varchar(10) not null check (passenger_type in ('ADT', 'CHD', 'INF')),
  document_type varchar(40),
  document_number varchar(80),
  country varchar(120),
  sex varchar(20),
  birth_date date null,
  age integer,
  phone varchar(40),
  passenger_status varchar(30) not null default 'active' check (passenger_status in ('active', 'cancelled', 'checked_in', 'no_show', 'refund_requested')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reservation_notes (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  created_by_user_id uuid not null references public.users(id),
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.reservation_status_history (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  previous_status varchar(40),
  new_status varchar(40) not null,
  reason varchar(255),
  changed_by_user_id uuid null references public.users(id),
  changed_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references public.users(id),
  agency_id uuid null references public.agencies(id),
  reservation_id uuid null references public.reservations(id),
  type varchar(40) not null,
  title varchar(180) not null,
  body text not null,
  read_at timestamptz null,
  created_at timestamptz not null default now()
);

create table if not exists public.cancellations (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id),
  reservation_passenger_id uuid null references public.reservation_passengers(id),
  cancellation_scope varchar(30) not null check (cancellation_scope in ('full_reservation', 'single_passenger')),
  reason_type varchar(40) not null check (reason_type in ('customer_request', 'no_show', 'provider_operation', 'expiration')),
  requested_solution varchar(20) not null check (requested_solution in ('coupon', 'refund')),
  requested_by_user_id uuid not null references public.users(id),
  agency_id uuid not null references public.agencies(id),
  effective_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code varchar(40) not null unique,
  reservation_id uuid not null references public.reservations(id),
  reservation_passenger_id uuid null references public.reservation_passengers(id),
  cancellation_id uuid null references public.cancellations(id),
  buyer_agency_id uuid not null references public.agencies(id),
  seller_agency_id uuid not null references public.agencies(id),
  created_by_user_id uuid not null references public.users(id),
  reason varchar(255),
  requested_at timestamptz not null,
  original_product_amount numeric(12,2) not null,
  applied_penalty_amount numeric(12,2) not null default 0,
  available_balance numeric(12,2) not null,
  status varchar(20) not null default 'active' check (status in ('active', 'inactive')),
  expires_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.refunds (
  id uuid primary key default gen_random_uuid(),
  code varchar(40) not null unique,
  reservation_id uuid not null references public.reservations(id),
  reservation_passenger_id uuid null references public.reservation_passengers(id),
  cancellation_id uuid null references public.cancellations(id),
  buyer_agency_id uuid not null references public.agencies(id),
  seller_agency_id uuid not null references public.agencies(id),
  created_by_user_id uuid not null references public.users(id),
  request_date timestamptz not null,
  refund_date timestamptz null,
  status varchar(30) not null check (status in ('por_pagar', 'en_reembolso', 'pagado')),
  original_product_amount numeric(12,2) not null,
  cancellation_penalty_amount numeric(12,2) not null default 0,
  no_show_penalty_amount numeric(12,2) not null default 0,
  refund_fee_amount numeric(12,2) not null default 0,
  refund_total_amount numeric(12,2) not null,
  payment_receipt_file varchar(500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.passenger_lists (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id),
  fecha_operacion date not null,
  embark_time time not null,
  status varchar(20) not null check (status in ('inactive', 'active', 'check_in')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.passenger_list_items (
  id uuid primary key default gen_random_uuid(),
  passenger_list_id uuid not null references public.passenger_lists(id) on delete cascade,
  reservation_id uuid not null references public.reservations(id),
  reservation_passenger_id uuid not null references public.reservation_passengers(id),
  item_status varchar(30) not null default 'pending' check (item_status in ('pending', 'checked_in', 'no_show', 'cancelled', 'refund')),
  checked_in_at timestamptz null,
  checked_in_by_user_id uuid null references public.users(id),
  no_show_at timestamptz null,
  no_show_by_user_id uuid null references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.alliances (
  id uuid primary key default gen_random_uuid(),
  provider_agency_id uuid not null references public.agencies(id),
  seller_agency_id uuid not null references public.agencies(id),
  city varchar(120) not null,
  facturado_limit numeric(12,2) not null,
  current_balance numeric(12,2) not null,
  contract_file varchar(500),
  status varchar(20) not null check (status in ('active', 'inactive', 'suspended')),
  suspended_reason varchar(255),
  created_by_user_id uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.alliance_movements (
  id uuid primary key default gen_random_uuid(),
  alliance_id uuid not null references public.alliances(id) on delete cascade,
  movement_type varchar(20) not null check (movement_type in ('sale', 'payment')),
  movement_date date not null,
  description varchar(255) not null,
  amount numeric(12,2) not null,
  balance_after numeric(12,2) not null,
  reservation_id uuid null references public.reservations(id),
  receipt_file varchar(500),
  created_at timestamptz not null default now()
);

create index if not exists idx_products_provider on public.products(provider_agency_id);
create index if not exists idx_products_status on public.products(status);
create index if not exists idx_reservations_product on public.reservations(product_id);
create index if not exists idx_reservations_seller_agency on public.reservations(seller_agency_id);
create index if not exists idx_reservations_owner_agency on public.reservations(product_owner_agency_id);
create index if not exists idx_reservations_status on public.reservations(status);
create index if not exists idx_reservations_travel_date on public.reservations(travel_date);
create index if not exists idx_reservation_passengers_reservation on public.reservation_passengers(reservation_id);
create index if not exists idx_reservation_passengers_document on public.reservation_passengers(document_number);
create index if not exists idx_passenger_lists_product_date on public.passenger_lists(product_id, fecha_operacion);
create index if not exists idx_alliances_provider on public.alliances(provider_agency_id);
create index if not exists idx_alliances_seller on public.alliances(seller_agency_id);

create trigger trg_products_updated_at before update on public.products for each row execute function public.set_updated_at();
create trigger trg_product_seasons_updated_at before update on public.product_seasons for each row execute function public.set_updated_at();
create trigger trg_product_penalty_rules_updated_at before update on public.product_penalty_rules for each row execute function public.set_updated_at();
create trigger trg_quotations_updated_at before update on public.quotations for each row execute function public.set_updated_at();
create trigger trg_reservations_updated_at before update on public.reservations for each row execute function public.set_updated_at();
create trigger trg_reservation_passengers_updated_at before update on public.reservation_passengers for each row execute function public.set_updated_at();
create trigger trg_coupons_updated_at before update on public.coupons for each row execute function public.set_updated_at();
create trigger trg_refunds_updated_at before update on public.refunds for each row execute function public.set_updated_at();
create trigger trg_passenger_lists_updated_at before update on public.passenger_lists for each row execute function public.set_updated_at();
create trigger trg_passenger_list_items_updated_at before update on public.passenger_list_items for each row execute function public.set_updated_at();
create trigger trg_alliances_updated_at before update on public.alliances for each row execute function public.set_updated_at();
