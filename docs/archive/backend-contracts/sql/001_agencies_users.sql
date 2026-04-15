-- LDS backend contracts
-- 001_agencies_users.sql

create table agencies (
  id uuid primary key,
  agency_type varchar(20) not null,
  nombre varchar(180) not null,
  nit varchar(60) not null unique,
  tipo_persona varchar(20) not null,
  direccion varchar(255),
  telefono_contacto varchar(40),
  email_empresa varchar(180),
  horario_atencion varchar(180),
  ciudad varchar(120),
  pais varchar(120),
  status varchar(20) not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table agency_legal_representatives (
  id uuid primary key,
  agency_id uuid not null unique references agencies(id),
  nombre varchar(180) not null,
  tipo_documento varchar(40),
  numero_documento varchar(80),
  telefono_contacto varchar(40),
  email varchar(180),
  cargo varchar(120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table users (
  id uuid primary key,
  agency_id uuid null references agencies(id),
  role varchar(40) not null,
  first_name varchar(120) not null,
  last_name varchar(120) not null,
  email varchar(180) not null unique,
  email_verified_at timestamptz null,
  phone varchar(40),
  birth_date date null,
  address varchar(255),
  photo_url varchar(500),
  status varchar(20) not null default 'inactive',
  password_hash varchar(255) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_users_agency on users(agency_id);
create index idx_users_role on users(role);
