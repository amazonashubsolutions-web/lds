-- LDS backend contracts
-- 004_postsales_and_alliances.sql

create table cancellations (
  id uuid primary key,
  reservation_id uuid not null references reservations(id),
  reservation_passenger_id uuid null references reservation_passengers(id),
  cancellation_scope varchar(30) not null,
  reason_type varchar(40) not null,
  requested_solution varchar(20) not null,
  requested_by_user_id uuid not null references users(id),
  agency_id uuid not null references agencies(id),
  effective_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table coupons (
  id uuid primary key,
  code varchar(40) not null unique,
  reservation_id uuid not null references reservations(id),
  reservation_passenger_id uuid null references reservation_passengers(id),
  cancellation_id uuid null references cancellations(id),
  buyer_agency_id uuid not null references agencies(id),
  seller_agency_id uuid not null references agencies(id),
  created_by_user_id uuid not null references users(id),
  reason varchar(255),
  requested_at timestamptz not null,
  original_product_amount numeric(12,2) not null,
  applied_penalty_amount numeric(12,2) not null default 0,
  available_balance numeric(12,2) not null,
  status varchar(20) not null default 'active',
  expires_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table refunds (
  id uuid primary key,
  code varchar(40) not null unique,
  reservation_id uuid not null references reservations(id),
  reservation_passenger_id uuid null references reservation_passengers(id),
  cancellation_id uuid null references cancellations(id),
  buyer_agency_id uuid not null references agencies(id),
  seller_agency_id uuid not null references agencies(id),
  created_by_user_id uuid not null references users(id),
  request_date timestamptz not null,
  refund_date timestamptz null,
  status varchar(30) not null,
  original_product_amount numeric(12,2) not null,
  cancellation_penalty_amount numeric(12,2) not null default 0,
  no_show_penalty_amount numeric(12,2) not null default 0,
  refund_fee_amount numeric(12,2) not null default 0,
  refund_total_amount numeric(12,2) not null,
  payment_receipt_file varchar(500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table passenger_lists (
  id uuid primary key,
  product_id uuid not null references products(id),
  fecha_operacion date not null,
  embark_time time not null,
  status varchar(20) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table passenger_list_items (
  id uuid primary key,
  passenger_list_id uuid not null references passenger_lists(id) on delete cascade,
  reservation_id uuid not null references reservations(id),
  reservation_passenger_id uuid not null references reservation_passengers(id),
  item_status varchar(30) not null default 'pending',
  checked_in_at timestamptz null,
  checked_in_by_user_id uuid null references users(id),
  no_show_at timestamptz null,
  no_show_by_user_id uuid null references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table alliances (
  id uuid primary key,
  provider_agency_id uuid not null references agencies(id),
  seller_agency_id uuid not null references agencies(id),
  city varchar(120) not null,
  facturado_limit numeric(12,2) not null,
  current_balance numeric(12,2) not null,
  contract_file varchar(500),
  status varchar(20) not null,
  suspended_reason varchar(255),
  created_by_user_id uuid not null references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table alliance_movements (
  id uuid primary key,
  alliance_id uuid not null references alliances(id) on delete cascade,
  movement_type varchar(20) not null,
  movement_date date not null,
  description varchar(255) not null,
  amount numeric(12,2) not null,
  balance_after numeric(12,2) not null,
  reservation_id uuid null references reservations(id),
  receipt_file varchar(500),
  created_at timestamptz not null default now()
);

create index idx_cancellations_reservation on cancellations(reservation_id);
create index idx_coupons_reservation on coupons(reservation_id);
create index idx_refunds_reservation on refunds(reservation_id);
create index idx_passenger_lists_product_date on passenger_lists(product_id, fecha_operacion);
create index idx_alliances_provider on alliances(provider_agency_id);
create index idx_alliances_seller on alliances(seller_agency_id);
