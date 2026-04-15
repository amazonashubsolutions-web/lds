-- Supabase migration: financial fields for reservations and passengers

-- Add coupon trace to reservations
alter table public.reservations
  add column if not exists coupon_code varchar(60) null,
  add column if not exists discount_percentage numeric(5,2) null;

-- Add individually charged rate to reservation passengers
alter table public.reservation_passengers
  add column if not exists charged_rate numeric(12,2) null;
