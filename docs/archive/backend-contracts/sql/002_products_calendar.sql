-- LDS backend contracts
-- 002_products_calendar.sql

create table products (
  id uuid primary key,
  provider_agency_id uuid not null references agencies(id),
  nombre varchar(180) not null,
  ciudad varchar(120),
  punto_encuentro varchar(255),
  descripcion_breve text,
  hora_salida time not null,
  hora_llegada time not null,
  status varchar(30) not null default 'pending_activation',
  created_by uuid not null references users(id),
  updated_by uuid null references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table product_seasons (
  id uuid primary key,
  product_id uuid not null references products(id) on delete cascade,
  season_type varchar(20) not null,
  fecha_inicio date not null,
  fecha_fin date not null,
  nombre_opcional varchar(120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table product_penalty_rules (
  id uuid primary key,
  product_id uuid not null unique references products(id) on delete cascade,
  tarifa_administrativa numeric(12,2) not null default 0,
  multa_cancelacion numeric(12,2) not null default 0,
  multa_no_show numeric(12,2) not null default 0,
  multa_reembolso numeric(12,2) not null default 0,
  permite_reembolso boolean not null default true,
  observaciones text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table product_active_ranges (
  id uuid primary key,
  product_id uuid not null references products(id) on delete cascade,
  fecha_inicio date not null,
  fecha_fin date not null,
  created_by uuid not null references users(id),
  created_at timestamptz not null default now()
);

create table product_calendar_dates (
  id uuid primary key,
  product_id uuid not null references products(id) on delete cascade,
  fecha date not null,
  is_operable boolean not null default true,
  occupancy_percentage numeric(5,2) not null default 0,
  blocked_reason varchar(255),
  updated_by uuid null references users(id),
  updated_at timestamptz not null default now(),
  unique(product_id, fecha)
);

create index idx_products_provider on products(provider_agency_id);
create index idx_products_status on products(status);
create index idx_product_seasons_product on product_seasons(product_id);
create index idx_product_active_ranges_product on product_active_ranges(product_id);
create index idx_product_calendar_dates_lookup on product_calendar_dates(product_id, fecha);
