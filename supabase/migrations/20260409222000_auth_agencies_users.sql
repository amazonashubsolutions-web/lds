-- Supabase migration: base schema, auth linkage, agencies and users
create extension if not exists pgcrypto;

create table if not exists public.agencies (
  id uuid primary key default gen_random_uuid(),
  agency_type varchar(20) not null check (agency_type in ('seller', 'provider')),
  nombre varchar(180) not null,
  nit varchar(60) not null unique,
  tipo_persona varchar(20) not null check (tipo_persona in ('juridica', 'fisica')),
  direccion varchar(255),
  telefono_contacto varchar(40),
  email_empresa varchar(180),
  horario_atencion varchar(180),
  ciudad varchar(120),
  pais varchar(120),
  status varchar(20) not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agency_legal_representatives (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null unique references public.agencies(id) on delete cascade,
  nombre varchar(180) not null,
  tipo_documento varchar(40),
  numero_documento varchar(80),
  telefono_contacto varchar(40),
  email varchar(180),
  cargo varchar(120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  agency_id uuid null references public.agencies(id) on delete set null,
  role varchar(40) not null default 'travel_agent' check (role in ('super_user', 'agency_admin', 'travel_agent')),
  first_name varchar(120) not null default '',
  last_name varchar(120) not null default '',
  email varchar(180) not null unique,
  email_verified_at timestamptz null,
  phone varchar(40),
  birth_date date null,
  address varchar(255),
  photo_url varchar(500),
  status varchar(20) not null default 'inactive' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_users_agency on public.users(agency_id);
create index if not exists idx_users_role on public.users(role);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (
    id,
    agency_id,
    role,
    first_name,
    last_name,
    email,
    email_verified_at,
    status
  )
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'agency_id', '')::uuid,
    coalesce(new.raw_user_meta_data ->> 'role', 'travel_agent'),
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    new.email,
    new.email_confirmed_at,
    'inactive'
  )
  on conflict (id) do update
  set email = excluded.email,
      email_verified_at = excluded.email_verified_at,
      updated_at = now();

  return new;
end;
$$;

create or replace function public.handle_auth_user_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users
     set email = new.email,
         email_verified_at = new.email_confirmed_at,
         updated_at = now()
   where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
after update of email, email_confirmed_at on auth.users
for each row execute function public.handle_auth_user_update();

drop trigger if exists trg_agencies_updated_at on public.agencies;
create trigger trg_agencies_updated_at
before update on public.agencies
for each row execute function public.set_updated_at();

drop trigger if exists trg_legal_rep_updated_at on public.agency_legal_representatives;
create trigger trg_legal_rep_updated_at
before update on public.agency_legal_representatives
for each row execute function public.set_updated_at();

drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();
