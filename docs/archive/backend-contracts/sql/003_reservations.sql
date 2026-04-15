-- LDS backend contracts
-- 003_reservations.sql

create table reservations (
  id uuid primary key,
  locator varchar(20) not null unique,
  product_id uuid not null references products(id),
  product_owner_agency_id uuid not null references agencies(id),
  seller_agency_id uuid not null references agencies(id),
  created_by_user_id uuid not null references users(id),
  parent_reservation_id uuid null references reservations(id),
  origin_type varchar(40) not null default 'direct',
  status varchar(40) not null default 'reserved',
  reservation_type varchar(20) not null default 'full',
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

create table reservation_passengers (
  id uuid primary key,
  reservation_id uuid not null references reservations(id) on delete cascade,
  first_name varchar(120) not null,
  last_name varchar(120) not null,
  passenger_type varchar(10) not null,
  document_type varchar(40),
  document_number varchar(80),
  country varchar(120),
  sex varchar(20),
  birth_date date null,
  age integer,
  phone varchar(40),
  passenger_status varchar(30) not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table reservation_notes (
  id uuid primary key,
  reservation_id uuid not null references reservations(id) on delete cascade,
  created_by_user_id uuid not null references users(id),
  body text not null,
  created_at timestamptz not null default now()
);

create table reservation_status_history (
  id uuid primary key,
  reservation_id uuid not null references reservations(id) on delete cascade,
  previous_status varchar(40),
  new_status varchar(40) not null,
  reason varchar(255),
  changed_by_user_id uuid null references users(id),
  changed_at timestamptz not null default now()
);

create table notifications (
  id uuid primary key,
  user_id uuid null references users(id),
  agency_id uuid null references agencies(id),
  reservation_id uuid null references reservations(id),
  type varchar(40) not null,
  title varchar(180) not null,
  body text not null,
  read_at timestamptz null,
  created_at timestamptz not null default now()
);

create index idx_reservations_product on reservations(product_id);
create index idx_reservations_seller_agency on reservations(seller_agency_id);
create index idx_reservations_travel_date on reservations(travel_date);
create index idx_reservations_status on reservations(status);
create index idx_reservation_passengers_reservation on reservation_passengers(reservation_id);
create index idx_reservation_passengers_document on reservation_passengers(document_number);
